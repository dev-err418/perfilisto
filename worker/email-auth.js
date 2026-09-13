import { codeEmail, emailCode, emailDigest, emailReply, EMAIL_CODE_TTL, EMAIL_RESEND_SECONDS, normalizeEmail } from "../src/lib/auth/email.mjs";
import { encode, decode } from "@auth/core/jwt";
const DELIVERY_SALT = "perfilisto-email-delivery";
const HOUR = 3600000;

/** One serialized record per HMAC of normalized email; delivery payloads are encrypted; verification uses only hashes. */
export class EmailAuth {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; this.queue = Promise.resolve(); }
  fetch(request) {
    const next = this.queue.then(() => this.handle(request));
    this.queue = next.catch(() => {});
    return next;
  }
  async handle(request) {
    const { email, challenge, code, locale } = await request.json();
    if (request.method !== "POST" || !normalizeEmail(email) || !/^[a-f0-9-]{36}$/.test(challenge || "")) return emailReply({ error: "invalid_request" }, 400);
    const now = Date.now();
    let record = await this.ctx.storage.get("challenge");
    if (new URL(request.url).pathname === "/send") {
      if (record && (now < record.nextSend || (record.windowEnds > now && record.sends >= 5))) {
        const retryAfter = Math.ceil((record.sends >= 5 && record.windowEnds > now ? record.windowEnds : record.nextSend) / 1000 - now / 1000);
        return emailReply({ error: "rate_limited", retryAfter }, 429, { "Retry-After": String(retryAfter) });
      }
      const value = emailCode();
      record = { digest: await emailDigest(this.env.AUTH_SECRET, `code:${challenge}:${value}`), challenge: await emailDigest(this.env.AUTH_SECRET, `browser:${challenge}`), expires: now + EMAIL_CODE_TTL, attempts: 0,
        nextSend: now + EMAIL_RESEND_SECONDS * 1000, sends: record?.windowEnds > now ? record.sends + 1 : 1, windowEnds: record?.windowEnds > now ? record.windowEnds : now + HOUR };
      record.delivery = await encode({ token: { email, code: value, locale }, secret: this.env.AUTH_SECRET, salt: DELIVERY_SALT, maxAge: EMAIL_CODE_TTL / 1000 });
      await this.ctx.storage.put("challenge", record);
      // A durable alarm delivers the email after the browser receives its cookie.
      await this.ctx.storage.setAlarm(now + 1);
      return emailReply({ sent: true });
    }
    if (new URL(request.url).pathname !== "/verify") return emailReply({ error: "not_found" }, 404);
    if (!record?.digest || record.expires <= now || record.attempts >= 5) return emailReply({ error: "expired_code" }, 400);
    if (record.challenge !== await emailDigest(this.env.AUTH_SECRET, `browser:${challenge}`)) return emailReply({ error: "invalid_code" }, 400);
    record.attempts++;
    const candidate = await emailDigest(this.env.AUTH_SECRET, `code:${challenge}:${code}`);
    let difference = 0;
    for (let i = 0; i < record.digest.length; i++) difference |= record.digest.charCodeAt(i) ^ candidate.charCodeAt(i);
    const verified = /^\d{6}$/.test(code || "") && difference === 0;
    if (verified || record.attempts >= 5) { delete record.digest; delete record.challenge; delete record.delivery; }
    await this.ctx.storage.put("challenge", record);
    return verified ? emailReply({ verified: true }) : emailReply({ error: record.attempts >= 5 ? "expired_code" : "invalid_code" }, 400);
  }
  async alarm() {
    const prepare = this.queue.then(async () => {
      const record = await this.ctx.storage.get("challenge");
      if (!record) return;
      if (Date.now() >= record.windowEnds) { await this.ctx.storage.deleteAll(); return; }
      if (Date.now() >= record.expires) {
        delete record.digest; delete record.challenge; delete record.delivery;
        await this.ctx.storage.put("challenge", record);
      }
      await this.ctx.storage.setAlarm(record.expires > Date.now() ? record.expires : record.windowEnds);
      return record.delivery;
    });
    this.queue = prepare.catch(() => {});
    const delivery = await prepare;
    if (!delivery) return;
    // Do not hold the request queue while the mail provider acknowledges delivery.
    let delivered = false;
    try {
      const payload = await decode({ token: delivery, secret: this.env.AUTH_SECRET, salt: DELIVERY_SALT });
      if (!payload) throw new Error("Expired delivery");
      const result = await this.env.EMAIL.send(codeEmail(payload.email, payload.code, payload.locale));
      delivered = Boolean(result?.messageId);
    } catch { /* Retry the same code, without logging the recipient or payload. */ }
    const finish = this.queue.then(async () => {
      const record = await this.ctx.storage.get("challenge");
      if (record?.delivery !== delivery) return;
      if (delivered || !record.digest || Date.now() >= record.expires) {
        delete record.delivery;
        await this.ctx.storage.put("challenge", record);
      } else {
        await this.ctx.storage.setAlarm(Math.min(Date.now() + 30000, record.expires));
      }
    });
    this.queue = finish.catch(() => {});
    await finish;
  }
}
