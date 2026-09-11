# Automatic email audit — 11 September 2026

The two configured transactional emails are backend-driven:

- Payment confirmation: queued after a verified Whop payment is persisted.
- Headshots ready: queued after the batch completes and every purchased result has been stored. Partial/failed batches do not send a misleading completion email.

Both use Perfilisto <hello@perfilisto.com>, reply to hello@perfilisto.com, and address the email from the authenticated customer's account. Checkout refuses a missing email when notifications are configured.

Cloudflare production settings were read successfully: EMAIL send binding permits hello@perfilisto.com, and EmailDelivery and HeadshotOrder Durable Objects are bound. The deployed Worker source also contains payment/completion notification triggers, background order alarms, and delivery retries. Users do not need to keep the browser open.

Queue enqueue failures arrange an order alarm retry. Delivery persists before sending, retries transient errors up to 12 attempts, and avoids normal duplicate event sends using an order/type key. Suppressed or invalid recipients stop retrying. A send acknowledgement followed by interruption before its record is saved can still cause a duplicate; provider inbox placement is not guaranteed.

Added regression coverage for full batch completion via the background alarm (including results stored before the ready notification) and recovery from an email-queue outage without any account visit. All 55 tests and ESLint pass.

The subsequent real EUR 0.00 Whop checkout triggered an automatic payment confirmation from hello@perfilisto.com, received in Gmail at 19:01:10 UTC (message 1a091d85c44aab9e). SPF, DKIM, and DMARC passed. Ready-email delivery remains unverified end to end: five of six references passed verification, so generation was correctly blocked pending a replacement photo. See whop-zero-checkout-test-2026-09-11.md. Current local ready emails link to /dashboard; the older live bundle still uses the previous destination. Deploy the current frontend and backend together to publish the newer dashboard flow. No deployment performed in this audit.
