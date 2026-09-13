import { codeEmail, emailCode, emailDigest, emailReply, EMAIL_CODE_TTL, EMAIL_RESEND_SECONDS, normalizeEmail } from "../src/lib/auth/email.mjs";
const HOUR = 3600000;

/** One serialized record per HMAC of normalized email; never store the raw code. */
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
      await this.ctx.storage.put("challenge", record);
      await this.ctx.storage.setAlarm(record.expires);
      try {
        const result = await this.env.EMAIL.send(codeEmail(email, value, locale));
        if (!result?.messageId) throw new Error("Delivery not acknowledged");
      } catch {
        // Keep rate limits even on a delivery failure; invalidate uncertain sends.
        delete record.digest; delete record.challenge;
        await this.ctx.storage.put("challenge", record);
        return emailReply({ error: "send_failed" }, 503);
      }
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
    if (verified || record.attempts >= 5) { delete record.digest; delete record.challenge; }
    await this.ctx.storage.put("challenge", record);
    return verified ? emailReply({ verified: true }) : emailReply({ error: record.attempts >= 5 ? "expired_code" : "invalid_code" }, 400);
  }
  alarm() {
    const next = this.queue.then(async () => {
      const record = await this.ctx.storage.get("challenge");
      if (!record) return;
      if (Date.now() >= record.windowEnds) return this.ctx.storage.deleteAll();
      if (Date.now() >= record.expires) { delete record.digest; delete record.challenge; await this.ctx.storage.put("challenge", record); }
      await this.ctx.storage.setAlarm(record.expires > Date.now() ? Math.min(record.expires, record.windowEnds) : record.windowEnds);
    });
    this.queue = next.catch(() => {});
    return next;
  }
}
