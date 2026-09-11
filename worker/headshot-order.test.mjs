import { test } from "node:test";
import assert from "node:assert/strict";
import { encode } from "@auth/core/jwt";
import { HeadshotOrder, handleOrders } from "./headshot-order.js";
import {
  paymentMatches,
  generationRequests,
} from "../src/lib/orders/providers.mjs";
import { verifyWhopSignature, handleWhopWebhook } from "./whop-webhook.js";

const id = "11111111-1111-4111-8111-111111111111";
const owner = "test:one";
function setup() {
  const data = new Map();
  const objects = new Map();
  const storage = {
    get: async (key) => structuredClone(data.get(key)),
    put: async (key, value) => data.set(key, structuredClone(value)),
    setAlarm: async (value) => data.set("alarm", value),
    deleteAll: async () => data.clear(),
  };
  const env = {
    WHOP_API_KEY: "test",
    WHOP_ACCOUNT_ID: "biz_test",
    OPENAI_API_KEY: "test",
    AUTH_SECRET: "test-secret-for-authentication-at-least-32",
    ORDER_PHOTOS: {
      put: async (k, v) => objects.set(k, v),
      get: async (k) =>
        objects.has(k)
          ? {
              body: objects.get(k),
              arrayBuffer: async () => objects.get(k).buffer,
            }
          : null,
      delete: async (k) => objects.delete(k),
    },
  };
  const order = new HeadshotOrder({ storage }, env);
  env.HEADSHOT_ORDERS = { getByName: () => order };
  const req = async (
    action = "",
    body = {},
    method = "POST",
    identity = owner,
  ) =>
    order.fetch(
      new Request(
        `https://perfilisto.com/api/orders/${id}${action ? "/" + action : ""}`,
        {
          method,
          headers: {
            "X-Order-Owner": identity,
            "Content-Type": "application/json",
          },
          body: method === "GET" ? undefined : JSON.stringify(body),
        },
      ),
    );
  return { env, order, data, objects, req };
}
const inputPhotos = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `p-${i}`,
    name: `photo-${i}.jpg`,
    dataUrl: "data:image/jpeg;base64,/9j/2Q==",
  }));
async function create(s) {
  await s.req("", {
    planId: "basic",
    price: 1,
    preferences: { attire: ["professional", "evil"], backgrounds: ["office"] },
  });
  await s.req("photos", { photos: inputPhotos(6) }, "PUT");
  return s.data.get("order");
}
function payment(order, overrides = {}) {
  return {
    id: "pay_test",
    status: "succeeded",
    account_id: "biz_test",
    plan_id: order.whopPlanId,
    metadata: { order_id: order.id },
    checkout_configuration_id: order.checkoutId,
    currency: "eur",
    subtotal: 29,
    total: 29,
    ...overrides,
  };
}

test("Server owns package price, enforces photo count, saves sources, and isolates owners", async () => {
  const s = setup();
  let o = await create(s);
  assert.equal(o.price, 29);
  assert.equal(o.photoCount, 10);
  assert.deepEqual(o.preferences.attire, ["professional"]);
  assert.equal(s.objects.size, 6);
  assert.equal(
    (await s.req("photos", { photos: inputPhotos(5) }, "PUT")).status,
    400,
  );
  assert.equal((await s.req("", {}, "GET", "test:another")).status, 404);
  const r = await (await s.req("", {}, "GET")).json();
  assert.equal(r.owner, undefined);
  assert.equal(r.photos.length, 6);
  assert.ok(r.photos[0].url.includes("/images/source-"));
});
test("Missing AI configuration blocks charging; unpaid orders cannot verify or generate", async () => {
  const s = setup();
  await create(s);
  delete s.env.OPENAI_API_KEY;
  assert.equal((await s.req("checkout")).status, 503);
  assert.equal((await s.req("verify")).status, 402);
  assert.equal((await s.req("generate")).status, 402);
});
test("Payment validation rejects mismatched orders, currency, amount, account and refunds", async () => {
  const s = setup();
  const o = await create(s);
  o.checkoutId = "ch_one";
  assert.equal(paymentMatches(o, payment(o), "biz_test"), true);
  for (const bad of [
    { metadata: { order_id: "other" } },
    { currency: "usd" },
    { subtotal: 1 },
    { account_id: "biz_other" },
    { plan_id: "plan_other" },
    { checkout_configuration_id: "ch_other" },
    { status: "pending" },
    { refunded_amount: 29 },
  ])
    assert.equal(paymentMatches(o, payment(o, bad), "biz_test"), false);
});
test("Repeated checkout and confirmation reuse the same order; six accepted photos and consent are required", async (t) => {
  const s = setup();
  await create(s);
  let checkouts = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (String(url).includes("checkout_configurations")) {
      checkouts++;
      return Response.json({ id: "ch_one" });
    }
    if (String(url).includes("/payments/"))
      return Response.json(payment(s.data.get("order")));
    throw Error("unexpected request");
  });
  assert.equal((await s.req("checkout")).status, 200);
  assert.equal((await s.req("checkout")).status, 200);
  assert.equal(checkouts, 1);
  assert.equal((await s.req("confirm", { paymentId: "pay_test" })).status, 200);
  assert.equal((await s.req("confirm", { paymentId: "pay_test" })).status, 200);
  assert.equal(
    (await s.req("generate", { confirmOwnPhotos: true })).status,
    409,
  );
  let o = s.data.get("order");
  o.review = {
    photos: o.photos.map((p) => ({ id: p.id, accepted: true })),
    needsMidRange: true,
  };
  s.data.set("order", o);
  assert.equal(
    (await s.req("generate", { confirmOwnPhotos: true })).status,
    400,
  );
});
test("Verification failures never fabricate success and replacement invalidates the old review", async (t) => {
  const s = setup();
  let o = await create(s);
  await s.order.markPaid(o, payment(o));
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({ photos: [], summary: "bad" }),
            },
          ],
        },
      ],
    }),
  );
  assert.equal((await s.req("verify")).status, 503);
  assert.equal(s.data.get("order").review, undefined);
  o = s.data.get("order");
  o.review = { photos: [] };
  s.data.set("order", o);
  await s.req("photos", { photos: inputPhotos(7) }, "PUT");
  assert.equal(s.data.get("order").review, undefined);
  assert.equal(s.objects.size, 7);
  assert.ok(s.data.get("order").payment);
});
test("Generation makes only the purchased count, preserves file references, and is idempotent", async (t) => {
  const s = setup();
  let o = await create(s);
  await s.order.markPaid(o, payment(o));
  o = s.data.get("order");
  o.review = {
    photos: o.photos.map((p) => ({ id: p.id, accepted: true })),
    needsMidRange: false,
  };
  s.data.set("order", o);
  let batches = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (String(url).endsWith("/files"))
      return Response.json({ id: `file_${crypto.randomUUID()}` });
    if (String(url).endsWith("/batches")) {
      batches++;
      assert.equal(JSON.parse(options.body).endpoint, "/v1/images/edits");
      return Response.json({ id: "batch_test" });
    }
    throw Error("unexpected request");
  });
  assert.equal(
    (await s.req("generate", { confirmOwnPhotos: true })).status,
    200,
  );
  assert.equal(
    (await s.req("generate", { confirmOwnPhotos: true })).status,
    200,
  );
  assert.equal(batches, 1);
  assert.equal(
    (await s.req("photos", { photos: inputPhotos(6) }, "PUT")).status,
    409,
  );
  const requests = generationRequests({ ...o, photoCount: 200 }, [
    "file_reference",
  ]);
  assert.equal(requests.length, 200);
  assert.equal(new Set(requests.map((r) => r.custom_id)).size, 200);
  assert.equal(requests[0].body.images[0].file_id, "file_reference");
});
test("Partial batch output retains successful images without pretending the whole gallery succeeded", async (t) => {
  const s = setup();
  let o = await create(s);
  o.batchId = "batch_test";
  o.status = "generating";
  s.data.set("order", o);
  t.mock.method(globalThis, "fetch", async (url) =>
    String(url).includes("/content")
      ? new Response(
          JSON.stringify({
            custom_id: "headshot-0",
            response: {
              status_code: 200,
              body: { data: [{ b64_json: "/9j/2Q==" }] },
            },
          }) +
            "\n" +
            JSON.stringify({
              custom_id: "headshot-1",
              response: { status_code: 400 },
            }),
        )
      : Response.json({ status: "completed", output_file_id: "file_output" }),
  );
  const result = await (await s.req("", {}, "GET")).json();
  assert.equal(result.status, "partial");
  assert.equal(result.results.length, 1);
  assert.ok(result.error);
});
test("Order API requires authentication and same-origin writes and strips forged webhook authority", async () => {
  const s = setup();
  await create(s);
  assert.equal(
    (
      await handleOrders(
        new Request(`https://perfilisto.com/api/orders/${id}`),
        s.env,
      )
    ).status,
    401,
  );
  const cookie = "__Secure-authjs.session-token";
  const token = await encode({
    token: { sub: owner },
    secret: s.env.AUTH_SECRET,
    salt: cookie,
    maxAge: 300,
  });
  const base = {
    Cookie: `${cookie}=${token}`,
    "Content-Type": "application/json",
  };
  assert.equal(
    (
      await handleOrders(
        new Request(`https://perfilisto.com/api/orders/${id}`, {
          method: "POST",
          headers: base,
          body: "{}",
        }),
        s.env,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleOrders(
        new Request(`https://perfilisto.com/api/orders/${id}/webhook`, {
          method: "POST",
          headers: {
            ...base,
            Origin: "https://perfilisto.com",
            "X-Verified-Whop-Event": "1",
          },
          body: JSON.stringify(payment(s.data.get("order"))),
        }),
        s.env,
      )
    ).status,
    404,
  );
  assert.equal(s.data.get("order").payment, undefined);
});
test("Webhook signatures reject tampering and expiry; valid repeated events do not reset paid orders", async () => {
  const s = setup();
  let o = await create(s);
  s.env.WHOP_WEBHOOK_SECRET = "ws_testsecret";
  const raw = JSON.stringify({
    type: "payment.succeeded",
    account_id: "biz_test",
    data: payment(o),
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const headers = new Headers({
    "webhook-id": "msg_test",
    "webhook-timestamp": timestamp,
  });
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(s.env.WHOP_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`msg_test.${timestamp}.${raw}`),
  );
  headers.set(
    "webhook-signature",
    `v1,${Buffer.from(signature).toString("base64")}`,
  );
  assert.equal(
    await verifyWhopSignature(raw, headers, s.env.WHOP_WEBHOOK_SECRET),
    true,
  );
  assert.equal(
    await verifyWhopSignature(raw + " ", headers, s.env.WHOP_WEBHOOK_SECRET),
    false,
  );
  const call = () =>
    handleWhopWebhook(
      new Request("https://perfilisto.com/api/webhooks/whop", {
        method: "POST",
        headers,
        body: raw,
      }),
      s.env,
    );
  assert.equal((await call()).status, 200);
  o = s.data.get("order");
  o.status = "generating";
  s.data.set("order", o);
  assert.equal((await call()).status, 200);
  assert.equal(s.data.get("order").status, "generating");
  headers.set("webhook-timestamp", "1");
  assert.equal(
    await verifyWhopSignature(raw, headers, s.env.WHOP_WEBHOOK_SECRET),
    false,
  );
});

test("Preferences are validated, restored to their owner and locked when generation starts", async () => {
  const s = setup();
  const o = await create(s);
  const preferences = {
    attire: ["professional"],
    backgrounds: ["studio"],
    poses: ["relaxed", "relaxed", "injected"],
    glasses: "mixed",
    hair: "black",
    headwear: "reference",
    arbitrary: "ignore rules",
  };
  assert.equal(
    (await s.req("preferences", { preferences }, "PUT")).status,
    402,
  );
  o.payment = { id: "pay_test", amount: 29, currency: "eur" };
  o.status = "paid";
  s.data.set("order", o);
  const saved = await (
    await s.req("preferences", { preferences }, "PUT")
  ).json();
  assert.deepEqual(saved.preferences.poses, ["relaxed"]);
  assert.equal(saved.preferences.glasses, "mixed");
  assert.equal(saved.preferences.arbitrary, undefined);
  assert.equal(
    (
      await s.req(
        "preferences",
        { preferences: { ...preferences, poses: [] } },
        "PUT",
      )
    ).status,
    400,
  );
  const restored = await (await s.req("", undefined, "GET")).json();
  assert.equal(restored.preferences.hair, "black");
  const locked = s.data.get("order");
  locked.batchSubmitting = true;
  s.data.set("order", locked);
  assert.equal(
    (
      await s.req(
        "preferences",
        { preferences: { ...preferences, glasses: "none" } },
        "PUT",
      )
    ).status,
    409,
  );
  assert.equal(s.data.get("order").preferences.glasses, "mixed");
});

test("Image prompts honor selected poses, eyewear split and confirmed details", () => {
  const o = {
    photoCount: 10,
    preferences: {
      attire: ["professional"],
      backgrounds: ["studio"],
      poses: ["relaxed"],
      glasses: "mixed",
      hair: "brown",
      headwear: "none",
    },
  };
  const requests = generationRequests(o, ["file_reference"]);
  assert.equal(
    requests.filter((r) =>
      r.body.prompt.includes("wear clear prescription-style glasses"),
    ).length,
    5,
  );
  assert.equal(
    requests.filter((r) => r.body.prompt.includes("no glasses or eyewear"))
      .length,
    5,
  );
  assert.ok(
    requests.every(
      (r) =>
        r.body.prompt.includes("relaxed natural stance") &&
        r.body.prompt.includes("hair: brown") &&
        r.body.prompt.includes("Headwear: no headwear"),
    ),
  );
  o.preferences.glasses = "all";
  o.preferences.poses = ["professional"];
  assert.ok(
    generationRequests(o, []).every(
      (r) =>
        r.body.prompt.includes("wear clear prescription-style glasses") &&
        r.body.prompt.includes("confident professional stance"),
    ),
  );
});

test('Notifications follow verified payment and complete saved results, without exposing customer details', async () => {
  const s = setup();
  const o = await create(s);
  o.customer = { email: 'owner@example.com', name: 'Owner' };
  const queued = [];
  s.env.EMAIL_DELIVERIES = { getByName: name => ({ fetch: async request => { queued.push({ name, body: await request.json() }); return Response.json({status:'pending'}); } }) };
  await s.order.queueNotifications(o);
  assert.equal(queued.length, 0);
  await s.order.markPaid(o, payment(o));
  await s.order.queueNotifications(o);
  assert.deepEqual(queued.map(x => x.body.kind), ['payment']);
  o.status = 'partial'; o.results = Array.from({length:o.photoCount - 1}, (_,i) => ({id:`r-${i}`}));
  await s.order.queueNotifications(o);
  assert.equal(queued.length, 1);
  o.status = 'complete'; o.results.push({id:'last'});
  await s.order.queueNotifications(o);
  await s.order.queueNotifications(o);
  assert.deepEqual(queued.map(x => x.body.kind), ['payment','ready']);
  assert.equal(queued[0].body.order.customer.email, 'owner@example.com');
  const dto = s.order.public(o);
  assert.equal(dto.customer, undefined);
  assert.equal(dto.emailQueued, undefined);
  assert.equal(dto.emailNotificationsEnabled, true);
});
test('Email enqueue outages preserve successful payment and arrange a retry', async () => {
  const s = setup();
  const o = await create(s);
  o.customer = {email:'owner@example.com'};
  s.env.EMAIL_DELIVERIES = { getByName: () => ({ fetch: async () => { throw Error('offline'); } }) };
  await s.order.markPaid(o, payment(o));
  assert.ok(s.data.get('order').payment);
  assert.equal(s.data.get('order').emailQueued?.payment, undefined);
  assert.ok(s.data.get('alarm') <= Date.now() + 60000);
});
test('Gateway takes notification identity from the signed session, ignoring forged headers', async () => {
  const s = setup();
  let forwarded;
  s.env.HEADSHOT_ORDERS = { getByName: () => ({ fetch: async request => { forwarded = request; return Response.json({}); } }) };
  const salt = '__Secure-authjs.session-token';
  const token = await encode({token:{sub:owner,email:'owner@example.com',name:'Owner'},secret:s.env.AUTH_SECRET,salt,maxAge:300});
  const response = await handleOrders(new Request(`https://perfilisto.com/api/orders/${id}`, {headers:{Cookie:`${salt}=${token}`,'X-Order-Customer':encodeURIComponent(JSON.stringify({email:'forged@example.com'}))}}), s.env);
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(decodeURIComponent(forwarded.headers.get('X-Order-Customer'))), {email:'owner@example.com',name:'Owner'});
});
