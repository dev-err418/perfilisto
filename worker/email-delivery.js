import { emailMessage } from "../src/lib/email/messages.mjs";
const DAY = 86400000;
export class EmailDelivery {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.queue = Promise.resolve();
  }
  fetch(request) {
    const next = this.queue.then(async () => {
      if (request.method !== "POST")
        return new Response("Not found", { status: 404 });
      const existing = await this.ctx.storage.get("delivery");
      if (existing) {
        if (existing.status === "pending" && !(await this.ctx.storage.getAlarm()))
          await this.ctx.storage.setAlarm(Date.now() + 1000);
        return Response.json({ status: existing.status });
      }
      const { kind, order } = await request.json();
      const message = emailMessage(kind, order);
      const delivery = {
        message,
        status: "pending",
        attempts: 0,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * DAY,
      };
      await this.ctx.storage.put("delivery", delivery);
      await this.ctx.storage.setAlarm(Date.now() + 1000);
      return Response.json({ status: "pending" }, { status: 202 });
    });
    this.queue = next.catch(() => {});
    return next;
  }
  alarm() {
    const next = this.queue.then(() => this.deliver());
    this.queue = next.catch(() => {});
    return next;
  }
  async deliver() {
    const delivery = await this.ctx.storage.get("delivery");
    if (!delivery) return;
    if (Date.now() >= delivery.expiresAt) {
      await this.ctx.storage.deleteAll();
      return;
    }
    if (delivery.status === "sent" || delivery.status === "failed") {
      await this.ctx.storage.setAlarm(delivery.expiresAt);
      return;
    }
    delivery.attempts++;
    await this.ctx.storage.put("delivery", delivery);
    // Persist a retry before the external call so an interrupted Worker resumes.
    await this.ctx.storage.setAlarm(
      Date.now() +
        Math.min(3600000, 30000 * 2 ** Math.min(delivery.attempts, 7)),
    );
    try {
      const result = await this.env.EMAIL.send(delivery.message);
      if (!result?.messageId)
        throw new Error("Email service did not acknowledge delivery");
      await this.ctx.storage.put("delivery", {
        status: "sent",
        messageId: result.messageId,
        attempts: delivery.attempts,
        sentAt: Date.now(),
        expiresAt: delivery.expiresAt,
      });
      await this.ctx.storage.setAlarm(delivery.expiresAt);
    } catch (error) {
      const code = typeof error?.code === "string" ? error.code : "SEND_FAILED";
      delivery.lastError = code;
      if (
        [
          "E_RECIPIENT_SUPPRESSED",
          "E_VALIDATION_ERROR",
          "E_RECIPIENT_NOT_ALLOWED",
        ].includes(code) ||
        delivery.attempts >= 12
      ) {
        delivery.status = "failed";
        delete delivery.message;
        await this.ctx.storage.setAlarm(delivery.expiresAt);
      }
      await this.ctx.storage.put("delivery", delivery);
      console.error("Transactional email delivery failed", code);
    }
  }
}
