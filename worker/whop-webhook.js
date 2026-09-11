export async function verifyWhopSignature(raw, headers, secret) {
  const timestamp = headers.get("webhook-timestamp");
  const id = headers.get("webhook-id");
  if (
    !secret ||
    !id ||
    !timestamp ||
    !Number.isFinite(Number(timestamp)) ||
    Math.abs(Date.now() / 1000 - Number(timestamp)) > 300
  )
    return false;
  const keyBytes = secret.startsWith("whsec_")
    ? Uint8Array.from(atob(secret.slice(6)), (c) => c.charCodeAt(0))
    : new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const data = new TextEncoder().encode(`${id}.${timestamp}.${raw}`);
  for (const signature of (headers.get("webhook-signature") || "").split(" ")) {
    if (!signature.startsWith("v1,")) continue;
    try {
      if (
        await crypto.subtle.verify(
          "HMAC",
          key,
          Uint8Array.from(atob(signature.slice(3)), (c) => c.charCodeAt(0)),
          data,
        )
      )
        return true;
    } catch {
      /* Ignore malformed signature. */
    }
  }
  return false;
}
export async function handleWhopWebhook(request, env) {
  if (request.method !== "POST")
    return new Response("Method not allowed", { status: 405 });
  const raw = await request.text();
  if (
    !(await verifyWhopSignature(raw, request.headers, env.WHOP_WEBHOOK_SECRET))
  )
    return new Response("Invalid signature", { status: 401 });
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (event.type !== "payment.succeeded") return new Response("OK");
  const id = event.data?.metadata?.order_id;
  // Signed events unrelated to a Perfilisto order (including Whop's generic
  // test fixture) are acknowledged without changing any order.
  if (!/^[a-f0-9-]{36}$/.test(id || "")) return new Response("OK");
  if ((event.account_id || event.company_id) !== env.WHOP_ACCOUNT_ID)
    return new Response("Invalid account", { status: 403 });
  return env.HEADSHOT_ORDERS.getByName(id).fetch(
    new Request(`https://perfilisto.com/api/orders/${id}/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Verified-Whop-Event": "1",
      },
      body: JSON.stringify({
        ...event.data,
        account_id: event.account_id || event.company_id,
      }),
    }),
  );
}
