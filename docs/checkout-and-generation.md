# Checkout and headshot generation

After uploading 6–10 images, customers choose Basic (€29/10 photos), Professional (€39/50), or Executive (€59/100). The shared catalog is `src/lib/orders/plans.json`; the landing page uses the same prices. The displayed delivery targets are Basic within 1 hour, Professional within 30 minutes, and Executive within 15 minutes. The current OpenAI Batch integration still uses a 24-hour completion window and cannot enforce those shorter targets. Faster generation processing must be validated before enabling checkout.

Whop collects card details in its own iframe. The app never receives card numbers. Orders are associated with the authenticated Google/Facebook subject. Prices and quantities come from the server catalog. Browser success callbacks alone cannot mark an order paid: the server verifies the payment or a signed Whop webhook. Whop must report the matching account, plan, order metadata, currency and amount.

## Configuration

Whop business: Perfilisto (`biz_KrDEESTmp4RqPG`). Three hidden, one-time EUR plans have been created. The integration key has read/create checkout configurations, read payments, and read/create plans/products permissions. No charge, transfer, refund or payout permission was requested.

Secrets in `.env.local` for development and Cloudflare Worker secrets for production:

- `AUTH_SECRET`: existing sign-in secret, shared by localhost and production.
- `WHOP_API_KEY`: server-side integration key.
- `WHOP_WEBHOOK_SECRET`: signing secret for `https://perfilisto.com/api/webhooks/whop`.
- `OPENAI_API_KEY`: not configured yet. Whop checkout can open without it; photo verification and generation require it.

Worker variables:

- `WHOP_ACCOUNT_ID=biz_KrDEESTmp4RqPG`
- Optional `OPENAI_VERIFY_MODEL` (default `gpt-4.1-mini`).
- Optional `OPENAI_IMAGE_MODEL` (default `gpt-image-2`).

Before enabling checkout, validate the OpenAI key's vision and image-model access and billing, run one small generation, and test Whop payment success/failure in its separate sandbox. No real charge or OpenAI request was performed during implementation.

## Storage and recovery

`HeadshotOrder` Durable Objects store order state. The private R2 bucket `perfilisto-order-photos` holds reference images and generated JPEGs. Image downloads require the order owner's session; the bucket is not public. Localhost forwards authenticated requests to the same public backend using a 5-minute signed session, so payment redirects and webhook events operate on the same orders.

Order IDs are saved in the browser URL and local storage. Unpaid orders expire after 24 hours; paid galleries and references expire 30 days after payment. An alarm removes stored photos and uploaded OpenAI input files. The short-lived phone uploader's two-hour session is separate from the saved order.

A browser reload restores the order, payment state and sources. Replacing images after payment resets the quality assessment, not payment. Once generation starts, references are locked.

## Verification and generation

Verification uses a non-stored Responses API request with structured JSON output, checks every image's clarity, lighting, face visibility and framing, and requires six accepted images. It does not identify people or compare biometric identities. The user confirms that all references are their own recent photos. Lack of mid-range examples is advisory and can be acknowledged explicitly; fewer than six usable images cannot be bypassed.

Generation uploads accepted images once and creates a JSONL batch of `/v1/images/edits` requests referencing their file IDs. Each purchased headshot gets a distinct prompt variation based on the selected outfits/backgrounds. No `n` multiplier expands the purchased quantity. A stored batch ID prevents duplicate submission. If the batch-creation response is interrupted, the system searches batch metadata before any further submission; unresolved ambiguity requires support rather than potentially double-charging API usage.

Durable Object alarms poll independently of the browser. Completed output is parsed one JSONL line at a time into private R2 objects. Partial failures preserve successful photos and show a support message; they never become a fake completed gallery. Output download links remain authenticated.

The development-only “Preview payment & verification” button uses clearly labeled in-memory demo state. It makes no payment or AI request and is absent from production builds. `src/lib/orders/local.mjs` is an isolated filesystem adapter for development tests, not the live order service.

## Checks

Run `node --test worker/*.test.mjs src/lib/auth/*.test.mjs src/lib/photo-upload.test.mjs`, `npm run lint`, and `npm run build`. Use Node 22 for Wrangler. Browser checks cover desktop/mobile pricing, payment confirmation, framing warning, final consent, generation state, and real Whop iframe loading without submitting a payment.

Sources:
- https://docs.whop.com/developer/guides/accept-payments
- https://docs.whop.com/developer/guides/webhooks
- https://developers.openai.com/api/docs/guides/batch
- https://developers.openai.com/api/reference/resources/images/methods/edit

## Final preferences and album

After verification, customers confirm their reference photos, choose professional and/or relaxed poses, choose no glasses / an equal mix / all glasses, and review their editable profile, attire and background choices. The final confirmation submits these allowlisted preferences with the generation request. Preferences are saved on the authenticated order and become immutable once the batch is prepared/submitted.

A successful submission shows a five-second countdown, then redirects to `/album?order=<order-id>`. The private album polls its order every 15 seconds, shows the provider's completed request count (never a simulated percentage), and exposes downloads once results have been saved. Partial/failed batches retain their support message and available downloads. The album confirms that an email will be sent when the authenticated account has an email address and notification delivery is configured.

The localhost debug preview includes all final steps and the loading screen without making payments or AI calls. Live OpenAI verification and generation still require `OPENAI_API_KEY`.

## Transactional email

Cloudflare Email Sending is enabled for `perfilisto.com`. The `EMAIL` binding is restricted to `hello@perfilisto.com`, with the display name Perfilisto and the same reply-to address. No separate sending API key is required. The existing active routing rule forwards replies sent to `hello@perfilisto.com` to `arthurs.dev@gmail.com`. DNS includes Cloudflare bounce MX/SPF, DKIM and DMARC authentication.

`src/lib/email/templates.json` contains the simplified payment and headshot-ready email layouts: white cards, quiet sans-serif typography, a small Perfilisto logo and one orange capsule button. `messages.mjs` supplies private order/album links and plain-text alternatives. No Aragon tracking, addresses or external image assets remain. The payment button opens the order; it does not claim to provide a tax invoice.

Recipient email and name come exclusively from the signed login session, never browser-supplied order fields. Local forwarding retains these claims. Neither recipient data nor internal delivery flags appear in the public order response. Checkout refuses accounts without an email address when email delivery is configured, asking them to sign in with Google or share their Facebook email.

Verified payment queues the payment email. A complete batch queues the ready email only after all purchased images have been stored. A partial or failed batch never sends a success email. `EMAIL_DELIVERIES` uses one durable object per order/event to prevent repeated webhooks or polling from sending the same notification again. An interrupted enqueue retries independently of payment and generation. Delivery retries temporary errors with backoff, up to 12 attempts, and stops on permanent recipient/validation failures. A crash after provider acceptance but before saving its acknowledgement can still cause a duplicate; the provider does not expose an idempotency key for this binding.

Message bodies and recipient data are removed from the delivery record after acknowledgement or terminal failure. Delivery metadata expires after 30 days. Cloudflare Email Sending Activity Log shows delivery/bounce/suppression details; a successful API acknowledgement is not proof of inbox placement. The account's initial sending quota is 1,000/day.

Tests: `node --test worker/email-delivery.test.mjs worker/headshot-order.test.mjs`. For local sending tests, use a separate localhost-only Worker with a remote EMAIL binding and clearly labelled preview subjects; do not fake production payments or generation completion.

Validated on September 11, 2026: both marked template previews reached the Gmail inbox. Gmail reported SPF, DKIM (including `perfilisto.com`) and DMARC passing. Desktop (800 px) and mobile (390 px) renders had no overflow or broken assets.

Whop package revision (September 11, 2026): the catalog points to new hidden one-time plans with 10/50/100 headshots and 1 hour/30 minutes/15 minutes descriptions. Older plan IDs remain available for existing order snapshots.
