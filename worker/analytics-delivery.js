/** One durable outbox per event. Whop event IDs also deduplicate an interrupted send. */
export class AnalyticsDelivery {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; this.queue = Promise.resolve(); }
  serial(fn) { const next = this.queue.then(fn); this.queue = next.catch(() => {}); return next; }
  fetch(request) {
    return this.serial(async () => {
      if (request.method !== "POST") return new Response(null, { status: 405 });
      const existing = await this.ctx.storage.get("delivery");
      if (!existing) {
        const payload = await request.json();
        await this.ctx.storage.put("delivery", { payload, status: "pending", attempts: 0, expires: Date.now() + 86400000 });
      }
      if ((!existing || existing.status === "pending") && !await this.ctx.storage.getAlarm()) await this.ctx.storage.setAlarm(Date.now() + 1000);
      return Response.json({ accepted: true }, { status: 202 });
    });
  }
  alarm() { return this.serial(() => this.deliver()); }
  async deliver() {
    const delivery = await this.ctx.storage.get("delivery");
    if (!delivery) return;
    if (Date.now() >= delivery.expires) { await this.ctx.storage.deleteAll(); return; }
    if (delivery.status !== "pending") { await this.ctx.storage.setAlarm(delivery.expires); return; }
    delivery.attempts++;
    await this.ctx.storage.put("delivery", delivery);
    await this.ctx.storage.setAlarm(Math.min(delivery.expires, Date.now() + Math.min(3600000, 15000 * 2 ** Math.min(delivery.attempts, 8))));
    let status = 0;
    try {
      if (!this.env.WHOP_EVENTS_API_KEY) throw new Error("Missing key");
      const response = await fetch("https://api.whop.com/api/v1/events", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.env.WHOP_EVENTS_API_KEY}`, "Content-Type": "application/json", "Api-Version-Date": "2026-09-11" },
        body: JSON.stringify(delivery.payload), signal: AbortSignal.timeout(15000),
      });
      status = response.status;
      if (response.ok && typeof (await response.json()).id === "string") {
        await this.finish(delivery, "sent");
        return;
      }
    } catch { /* Retry without ever logging personal data or credentials. */ }
    if ([400, 404, 422].includes(status)) await this.finish(delivery, "failed");
    console.error("Analytics delivery pending or failed", status);
  }
  async finish(delivery, status) {
    const expires = Date.now() + 30 * 86400000;
    await this.ctx.storage.put("delivery", { status, attempts: delivery.attempts, expires });
    await this.ctx.storage.setAlarm(expires);
  }
}
