import { validEmail } from "../src/lib/email/messages.mjs";
import { sanitizePreferences } from "../src/lib/orders/preferences.mjs";
import plans from "../src/lib/orders/plans.json" with { type: "json" };
import { getToken } from "@auth/core/jwt";
import {
  whop,
  openai,
  verifyPhotos,
  generationRequests,
  paymentMatches,
} from "../src/lib/orders/providers.mjs";

const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
const DAY = 86_400_000;
export class HeadshotOrder {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.queue = Promise.resolve();
  }
  fetch(request) {
    const next = this.queue.then(() => this.handle(request));
    this.queue = next.catch(() => {});
    return next.catch(() =>
      json(
        {
          error:
            "Could not complete this request. Your progress is saved. Please try again.",
        },
        503,
      ),
    );
  }
  async save(order) {
    await this.ctx.storage.put("order", order);
  }
  async handle(request) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[2],
      action = parts[3];
    const owner = request.headers.get("X-Order-Owner");
    let order = await this.ctx.storage.get("order");
    if (
      action === "webhook" &&
      request.headers.get("X-Verified-Whop-Event") === "1"
    ) {
      if (!order) return json({ ok: true });
      const payment = await request.json();
      if (!paymentMatches(order, payment, this.env.WHOP_ACCOUNT_ID))
        return json({ error: "Payment mismatch" }, 400);
      if (!order.payment) await this.markPaid(order, payment);
      else await this.queueNotifications(order);
      return json({ ok: true });
    }
    if (order && owner !== order.owner)
      return json({ error: "Order not found" }, 404);
    if (order && order.expiresAt < Date.now())
      return json(
        {
          error:
            "This order has expired. Contact hello@perfilisto.com for help.",
        },
        410,
      );
    let customer;
    try {
      const candidate = JSON.parse(
        decodeURIComponent(request.headers.get("X-Order-Customer") || "{}"),
      );
      if (validEmail(candidate.email))
        customer = {
          email: candidate.email,
          name: String(candidate.name || "").slice(0, 120),
        };
    } catch {
      /* Only the authenticated gateway supplies this header. */
    }
    if (order && !order.customer && customer) {
      order.customer = customer;
      await this.save(order);
      await this.queueNotifications(order);
    }
    let body = {};
    if (request.method === "POST" || request.method === "PUT") {
      if (Number(request.headers.get("Content-Length") || 0) > 20_000_000)
        return json({ error: "Upload too large" }, 413);
      try {
        const reader = request.body?.getReader();
        const chunks = [];
        let size = 0;
        if (reader)
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 20_000_000) {
              await reader.cancel();
              return json(
                {
                  error:
                    "These photos are too large. Please use smaller copies.",
                },
                413,
              );
            }
            chunks.push(value);
          }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        body = JSON.parse(new TextDecoder().decode(bytes));
      } catch {
        return json({ error: "Invalid request" }, 400);
      }
    }
    if (!order && request.method === "POST" && !action) {
      const plan = plans.find((p) => p.id === body.planId);
      if (!plan) return json({ error: "Choose a package" }, 400);
      const preferences = sanitizePreferences(body.preferences);
      order = {
        ...plan,
        planId: plan.id,
        id,
        owner,
        customer,
        preferences,
        status: "draft",
        photos: [],
        results: [],
        createdAt: Date.now(),
        expiresAt: Date.now() + DAY,
      };
      await this.save(order);
      await this.ctx.storage.setAlarm(order.expiresAt);
    }
    if (!order) return json({ error: "Order not found" }, 404);
    if (request.method === "GET" && action === "images") {
      const image = [...order.photos, ...order.results].find(
        (p) => p.id === parts[4],
      );
      if (!image) return json({ error: "Photo not found" }, 404);
      const object = await this.env.ORDER_PHOTOS.get(`${id}/${image.id}`);
      return object
        ? new Response(object.body, {
            headers: {
              "Content-Type": "image/jpeg",
              "Cache-Control": "private, no-store",
              "X-Content-Type-Options": "nosniff",
              ...(url.searchParams.has("download")
                ? {
                    "Content-Disposition":
                      'attachment; filename="perfilisto-headshot.jpg"',
                  }
                : {}),
            },
          })
        : json({ error: "Photo not found" }, 404);
    }
    if (request.method === "PUT" && action === "photos") {
      if (order.batchId || order.batchSubmitting || order.inputFileId)
        return json({ error: "Generation has already started" }, 409);
      const photos = body.photos;
      if (
        !Array.isArray(photos) ||
        photos.length < 6 ||
        photos.length > 10 ||
        new Set(photos.map((p) => p.id)).size !== photos.length ||
        photos.some(
          (p) =>
            !/^[a-zA-Z0-9-]{1,80}$/.test(p.id) ||
            typeof p.name !== "string" ||
            p.name.length > 500 ||
            typeof p.dataUrl !== "string" ||
            !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(p.dataUrl) ||
            p.dataUrl.length > 5_000_000,
        )
      )
        return json({ error: "Upload 6–10 valid photos" }, 400);
      const nextPhotos = [];
      for (const p of photos) {
        // Versioned object keys make a replacement atomic at the order record.
        const photoId = `source-${crypto.randomUUID()}`;
        await this.env.ORDER_PHOTOS.put(
          `${id}/${photoId}`,
          Uint8Array.from(atob(p.dataUrl.split(",")[1]), (c) =>
            c.charCodeAt(0),
          ),
          { httpMetadata: { contentType: "image/jpeg" } },
        );
        nextPhotos.push({ id: photoId, name: p.name });
      }
      const oldPhotos = order.photos;
      order.photos = nextPhotos;
      delete order.review;
      await this.save(order);
      for (const p of oldPhotos)
        await this.env.ORDER_PHOTOS.delete(`${id}/${p.id}`);
    } else if (request.method === "POST" && action === "checkout") {
      if (order.payment) return json(this.public(order));
      if (this.env.EMAIL_DELIVERIES && !validEmail(order.customer?.email))
        return json(
          { error: "Your account did not provide an email address. Please sign in with Google or allow Facebook to share your email before checking out." },
          400,
        );
      if (!this.env.WHOP_API_KEY)
        return json(
          { error: "Checkout is not available yet. Please come back soon." },
          503,
        );
      if (order.photos.length < 6)
        return json({ error: "Upload at least 6 photos first" }, 400);
      if (!order.checkoutId) {
        const config = await whop(this.env, "/checkout_configurations", {
          method: "POST",
          idempotencyKey: `checkout-${id}`,
          body: {
            account_id: this.env.WHOP_ACCOUNT_ID,
            plan_id: order.whopPlanId,
            payment_method_configuration: {
              enabled: ["card"],
              disabled: [],
              include_platform_defaults: false,
            },
            metadata: { order_id: id },
            redirect_url: `${url.origin}/onboarding?order=${id}`,
            checkout_styling: { button_color: "#ff7416" },
          },
        });
        order.checkoutId = config.id;
        order.status = "checkout";
        await this.save(order);
      }
    } else if (request.method === "POST" && action === "confirm") {
      if (!order.payment) {
        if (!/^pay_[a-zA-Z0-9]+$/.test(body.paymentId || ""))
          return json(
            {
              error:
                "Waiting for payment confirmation. Please try again shortly.",
            },
            409,
          );
        const payment = await whop(this.env, `/payments/${body.paymentId}`);
        if (!paymentMatches(order, payment, this.env.WHOP_ACCOUNT_ID))
          return json(
            { error: "Payment is not confirmed for this order yet." },
            409,
          );
        await this.markPaid(order, payment);
      }
    } else if (request.method === "POST" && action === "verify") {
      if (!order.payment) return json({ error: "Payment required" }, 402);
      if (!order.review) {
        const photos = [];
        for (const photo of order.photos) {
          const object = await this.env.ORDER_PHOTOS.get(`${id}/${photo.id}`);
          if (!object)
            return json(
              {
                error:
                  "A source photo is missing. Please upload your photos again.",
              },
              409,
            );
          const bytes = new Uint8Array(await object.arrayBuffer());
          let binary = "";
          for (const byte of bytes) binary += String.fromCharCode(byte);
          photos.push({
            ...photo,
            dataUrl: `data:image/jpeg;base64,${btoa(binary)}`,
          });
        }
        order.review = await verifyPhotos(this.env, photos);
        await this.save(order);
      }
    } else if (request.method === "PUT" && action === "preferences") {
      if (!order.payment) return json({ error: "Payment required" }, 402);
      if (order.batchId || order.batchSubmitting || order.inputFileId)
        return json({ error: "Generation has already started" }, 409);
      const next = sanitizePreferences(body.preferences);
      if (
        !next.poses?.length ||
        !next.glasses ||
        !next.attire?.length ||
        !next.backgrounds?.length
      )
        return json(
          { error: "Choose poses, glasses, attire and backgrounds" },
          400,
        );
      order.preferences = next;
      await this.save(order);
    } else if (request.method === "POST" && action === "generate") {
      if (!order.payment) return json({ error: "Payment required" }, 402);
      if (
        !order.review ||
        order.review.photos.filter((p) => p.accepted).length < 6
      )
        return json({ error: "You need at least 6 accepted photos" }, 409);
      if (
        body.confirmOwnPhotos !== true ||
        (order.review.needsMidRange && body.acceptFraming !== true)
      )
        return json(
          { error: "Please confirm your reference photos first" },
          400,
        );
      if (!order.batchId) {
        if (body.preferences) {
          if (order.batchSubmitting)
            return json(
              { error: "Your batch is being submitted. Please wait." },
              409,
            );
          const next = sanitizePreferences(body.preferences);
          if (
            !next.poses?.length ||
            !next.glasses ||
            !next.attire?.length ||
            !next.backgrounds?.length
          )
            return json(
              { error: "Please complete your photo preferences" },
              400,
            );
          if (
            order.inputFileId &&
            JSON.stringify(next) !== JSON.stringify(order.preferences)
          )
            return json(
              {
                error:
                  "Your batch is already prepared. Please keep your submitted preferences.",
              },
              409,
            );
          order.preferences = next;
          await this.save(order);
        }
        await this.startBatch(order);
      }
    } else if (
      request.method === "GET" &&
      !action &&
      order.batchId &&
      !["complete", "partial", "failed"].includes(order.status)
    ) {
      await this.checkBatch(order);
    } else if (
      !["GET", "POST", "PUT"].includes(request.method) ||
      (action &&
        ![
          "photos",
          "checkout",
          "confirm",
          "verify",
          "generate",
          "preferences",
        ].includes(action))
    )
      return json({ error: "Not found" }, 404);
    return json(this.public(order));
  }
  public(order) {
    const {
      owner,
      customer,
      emailQueued,
      inputFileId,
      inputFileIds,
      batchSubmitting,
      ...safe
    } = order;
    void owner;
    void customer;
    void emailQueued;
    void inputFileId;
    void inputFileIds;
    void batchSubmitting;
    return {
      ...safe,
      checkoutEmail: order.checkoutId && !order.payment && validEmail(order.customer?.email)
        ? order.customer.email
        : undefined,
      emailNotificationsEnabled: Boolean(
        order.customer?.email && this.env.EMAIL_DELIVERIES,
      ),
      photos: order.photos.map((p) => ({
        ...p,
        url: `/api/orders/${order.id}/images/${p.id}`,
      })),
      results: order.results.map((p) => ({
        ...p,
        url: `/api/orders/${order.id}/images/${p.id}`,
      })),
    };
  }
  async markPaid(order, payment) {
    order.payment = {
      id: payment.id,
      amount: Number(
        payment.total ?? payment.final_amount ?? payment.amount ?? order.price,
      ),
      currency: payment.currency,
    };
    order.status = "paid";
    order.expiresAt = Date.now() + 30 * DAY;
    await this.save(order);
    await this.ctx.storage.setAlarm(order.expiresAt);
    await this.queueNotifications(order);
  }
  async startBatch(order) {
    if (order.batchSubmitting) {
      // An interrupted POST may already have created a paid batch. Never blindly submit another.
      const batches = await (
        await openai(this.env, "/batches?limit=100", undefined, "GET")
      ).json();
      const existing = batches.data?.find(
        (b) => b.metadata?.order_id === order.id,
      );
      if (existing) {
        order.batchId = existing.id;
        order.status = "generating";
        await this.save(order);
        await this.ctx.storage.setAlarm(Date.now() + 60_000);
        return;
      }
      throw new Error(
        "Generation submission is being reconciled. Please contact support if it does not resume.",
      );
    }
    const fileIds = order.inputFileIds || {};
    for (const photo of order.photos.filter((p) =>
      order.review.photos.some((v) => v.id === p.id && v.accepted),
    )) {
      if (fileIds[photo.id]) continue;
      const object = await this.env.ORDER_PHOTOS.get(`${order.id}/${photo.id}`);
      const form = new FormData();
      form.append("purpose", "vision");
      form.append(
        "file",
        new Blob([await object.arrayBuffer()], { type: "image/jpeg" }),
        "reference.jpg",
      );
      const uploaded = await (await openai(this.env, "/files", form)).json();
      fileIds[photo.id] = uploaded.id;
      order.inputFileIds = fileIds;
      await this.save(order);
    }
    if (!order.inputFileId) {
      const lines = generationRequests(
        order,
        Object.values(fileIds),
        this.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      );
      const form = new FormData();
      form.append("purpose", "batch");
      form.append(
        "file",
        new Blob([lines.map((l) => JSON.stringify(l)).join("\n")], {
          type: "application/jsonl",
        }),
        "headshots.jsonl",
      );
      const uploaded = await (await openai(this.env, "/files", form)).json();
      order.inputFileId = uploaded.id;
      await this.save(order);
    }
    order.batchSubmitting = true;
    await this.save(order);
    await this.ctx.storage.setAlarm(Date.now() + 60_000);
    const batch = await (
      await openai(this.env, "/batches", {
        input_file_id: order.inputFileId,
        endpoint: "/v1/images/edits",
        completion_window: "24h",
        metadata: { order_id: order.id },
      })
    ).json();
    order.batchId = batch.id;
    order.status = "generating";
    await this.save(order);
    await this.ctx.storage.setAlarm(Date.now() + 60_000);
  }
  async checkBatch(order) {
    if (order.lastBatchCheck && Date.now() - order.lastBatchCheck < 15_000)
      return;
    const batch = await (
      await openai(this.env, `/batches/${order.batchId}`, undefined, "GET")
    ).json();
    order.lastBatchCheck = Date.now();
    order.batchStatus = batch.status;
    order.batchProgress = {
      completed: Math.max(
        0,
        Math.min(
          order.photoCount,
          Number(batch.request_counts?.completed) || 0,
        ),
      ),
      failed: Math.max(
        0,
        Math.min(order.photoCount, Number(batch.request_counts?.failed) || 0),
      ),
      total: order.photoCount,
    };
    if (
      ["completed", "failed", "expired", "cancelled"].includes(batch.status)
    ) {
      if (batch.output_file_id) {
        const response = await openai(
          this.env,
          `/files/${batch.output_file_id}/content`,
          undefined,
          "GET",
        );
        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();
        let buffer = "";
        const persistLine = async (line) => {
          if (!line.trim()) return;
          const result = JSON.parse(line);
          const index = /^headshot-(\d+)$/.exec(result.custom_id)?.[1];
          const encoded = result.response?.body?.data?.[0]?.b64_json;
          if (
            index === undefined ||
            Number(index) >= order.photoCount ||
            !encoded ||
            result.response?.status_code !== 200
          )
            return;
          const imageId = `result-${index}`;
          if (order.results.some((p) => p.id === imageId)) return;
          await this.env.ORDER_PHOTOS.put(
            `${order.id}/${imageId}`,
            Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
            { httpMetadata: { contentType: "image/jpeg" } },
          );
          order.results.push({ id: imageId });
          await this.save(order);
        };
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          let end;
          while ((end = buffer.indexOf("\n")) >= 0) {
            await persistLine(buffer.slice(0, end));
            buffer = buffer.slice(end + 1);
          }
        }
        await persistLine(buffer);
      }
      order.status =
        order.results.length === order.photoCount
          ? "complete"
          : order.results.length
            ? "partial"
            : "failed";
      if (order.status !== "complete")
        order.error =
          "Some photos could not be generated. Contact hello@perfilisto.com with your order number so we can resolve this.";
      await this.ctx.storage.setAlarm(order.expiresAt);
    } else await this.ctx.storage.setAlarm(Date.now() + 60_000);
    await this.save(order);
    await this.queueNotifications(order);
  }
  async queueNotifications(order) {
    if (!this.env.EMAIL_DELIVERIES || !validEmail(order.customer?.email))
      return;
    order.emailQueued ||= {};
    const kinds = [
      ...(order.payment ? ["payment"] : []),
      ...(order.payment && order.status === "complete" &&
      order.results.length === order.photoCount
        ? ["ready"]
        : []),
    ];
    for (const kind of kinds) {
      if (order.emailQueued[kind]) continue;
      try {
        const response = await this.env.EMAIL_DELIVERIES.getByName(
          `${order.id}:${kind}`,
        ).fetch(
          new Request("https://internal/deliver", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind,
              order: { id: order.id, customer: order.customer },
            }),
          }),
        );
        if (!response.ok) throw new Error("Email enqueue failed");
        order.emailQueued[kind] = true;
        await this.save(order);
      } catch {
        // Email outages must never turn a confirmed payment into a failed checkout.
        const alarm = await this.ctx.storage.getAlarm?.();
        await this.ctx.storage.setAlarm(
          Math.min(alarm || order.expiresAt, Date.now() + 60000),
        );
      }
    }
  }
  alarm() {
    const next = this.queue.then(() => this.runAlarm());
    this.queue = next.catch(() => {});
    return next;
  }
  async runAlarm() {
    const order = await this.ctx.storage.get("order");
    if (!order) return;
    if (order.expiresAt > Date.now()) {
      if (order.batchSubmitting && !order.batchId) {
        try {
          await this.startBatch(order);
        } catch {
          await this.ctx.storage.setAlarm(Date.now() + 300_000);
        }
      } else if (
        order.batchId &&
        !["complete", "partial", "failed"].includes(order.status)
      ) {
        try {
          await this.checkBatch(order);
        } catch {
          await this.ctx.storage.setAlarm(Date.now() + 300_000);
        }
      } else await this.ctx.storage.setAlarm(order.expiresAt);
      await this.queueNotifications(order);
      return;
    }
    for (const p of [...order.photos, ...order.results])
      await this.env.ORDER_PHOTOS.delete(`${order.id}/${p.id}`);
    for (const id of [
      ...Object.values(order.inputFileIds || {}),
      order.inputFileId,
    ].filter(Boolean)) {
      try {
        await openai(this.env, `/files/${id}`, undefined, "DELETE");
      } catch {
        /* Object storage is still cleared if the upstream file has expired. */
      }
    }
    await this.ctx.storage.deleteAll();
  }
}

export async function handleOrders(request, env) {
  const url = new URL(request.url);
  if (
    !["https://perfilisto.com", "https://www.perfilisto.com"].includes(
      url.origin,
    ) &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    return json({ error: "Invalid origin" }, 400);
  if (request.method !== "GET" && request.headers.get("Origin") !== url.origin)
    return json({ error: "Invalid request origin" }, 403);
  const token = env.AUTH_SECRET
    ? await getToken({
        req: request,
        secret: env.AUTH_SECRET,
        secureCookie: url.protocol === "https:",
      })
    : null;
  if (!token?.sub || !token.exp || token.exp <= Date.now() / 1000)
    return json({ error: "Please sign in again" }, 401);
  const id = url.pathname.split("/")[3];
  if (!/^[a-f0-9-]{36}$/.test(id || ""))
    return json({ error: "Order not found" }, 404);
  if (!env.HEADSHOT_ORDERS || !env.ORDER_PHOTOS)
    return json({ error: "Order service is not configured yet" }, 503);
  const headers = new Headers(request.headers);
  headers.set("X-Order-Owner", token.sub);
  headers.delete("X-Order-Customer");
  if (validEmail(token.email))
    headers.set(
      "X-Order-Customer",
      encodeURIComponent(
        JSON.stringify({
          email: token.email,
          name: typeof token.name === "string" ? token.name.slice(0, 120) : "",
        }),
      ),
    );
  headers.delete("X-Verified-Whop-Event");
  return env.HEADSHOT_ORDERS.getByName(id).fetch(
    new Request(request, { headers }),
  );
}
