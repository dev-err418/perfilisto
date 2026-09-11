# Whop funnel attribution

Perfilisto account: `biz_KrDEESTmp4RqPG`.

## Data flow

1. The global `WhopPixel` asks for optional analytics consent. The choice lasts six months; GPC and DNT override an allow choice. Localhost and mobile upload-session pages do not run optional tracking.
2. `/api/analytics/context` returns uncached, same-origin, consented context: Cloudflare city/region/postal/country, plus verified account email/name and a hashed account identifier after sign-in. It never returns raw IP, photos, appearance answers, provider IDs or tokens.
3. The official `https://t.whop.tw/s.js` establishes `_wuid`, identifies the signed-in account, and sends page views. React controls page changes, with SDK automatic page/form/URL identity collection disabled to avoid duplicates and accidental input capture.
4. Funnel events go to `/api/analytics/events`, then a durable Cloudflare delivery object, then Whop's Events API. The gateway uses the original CF visitor IP and user agent, re-verifies identity, and whitelists event names and campaign fields. Whop's currently published pixel drops some documented customer fields, so these enriched events use the API rather than duplicating pixel events.
5. The checkout receives saved UTM parameters, the actual Whop visitor ID where present, and the already verified checkout email on its **first render**. Whop's React embed snapshots its initial settings. Changing analytics settings never remounts an entered payment form.
6. **Whop owns checkout views, purchases, subscriptions and trials.** No custom `purchase`, checkout-view or trial events are sent. Whop's payment webhook remains the sole authority for unlocking a paid order.

## Events

| Event | Trigger |
|---|---|
| `page` | Initial/SPA page view, through Whop pixel |
| `visit` | Enriched visit per route and tab journey |
| `view_content` | Homepage pricing becomes visible |
| `get_started` | A same-origin onboarding link is clicked |
| `sign_in_started_google/facebook` | Provider button clicked |
| `sign_in_failed_google/facebook` or `sign_in_failed` | Start/return failure; no raw error details |
| `signed_in` | A verified session is present; this is not labeled a new registration |
| `onboarding_welcome`, `onboarding_gender`, etc. | Entry into a named step; no selected appearance values |
| `uploads_ready` | Six prepared images are available |
| `package_selected` | Package explicitly selected; Whop plan ID attached |
| `add_to_cart` | Order creation succeeds; gateway checks ownership and gets price/currency/plan from the actual order |
| `photos_saved` | Save succeeds; gateway confirms at least six persisted images |
| `order_preparation_failed` | Preparing the order/photos/checkout failed, without raw errors |

Event IDs identify a single journey action; order events use the order UUID across tabs and reloads. The outbox and Whop both deduplicate by event ID and event name. Pending browser events contain no raw account details and retry for ten minutes. Cross-account pending events are discarded. Server deliveries retry for up to 24 hours; personal payloads are removed after successful delivery or permanent validation failure. Only a non-personal deduplication marker remains for 30 days. Tracking failure never blocks the product.

The last accepted marketing parameters are stored for 30 days in the browser. Whop receives original landing/campaign events and joins later events and checkout by its own visitor identity. Approximate IP-based location can be absent or inaccurate (VPNs, mobile networks).

## Configuration

- `WHOP_EVENTS_API_KEY`: secret with **event:create**. Add **company:basic:read** to verify events and validate the pixel through Whop's API.
- Existing `WHOP_API_KEY` remains scoped to checkout; it is not reused or exposed to the browser.
- `ANALYTICS_DELIVERIES`: durable outbox binding, migration `v4-analytics-deliveries`.
- `ANALYTICS_RATE_LIMIT`: 120 requests/minute/IP; public endpoint also rejects cross-origin requests, payloads over 8 KB, and unauthenticated account/order events.
- `WHOP_ACCOUNT_ID`: existing Perfilisto account variable.

With Node 22+ and the secret installed: `npm run lint`, `npm run build`, `npx wrangler deploy`.

## Verification

Run `node --test worker/*.test.mjs src/lib/auth/*.test.mjs src/lib/photo-upload.test.mjs`.

Browser smoke checks use a clean test context, the real Whop SDK, and intercepted analytics/payment network requests: no pre-consent events; one pixel/page view; actual `_wuid`; campaign persistence through login; login failure instrumentation; onboarding step deduplication; no appearance data; consent withdrawal; GPC; no pixel on phone upload links; campaign/visitor/email passed into checkout without charging a card.

After deployment, accept analytics in an isolated browser, visit a clearly labeled test campaign, then inspect Whop's Websites and Events pages. The scoped API key can use `POST /api/v1/events/validate_pixel` and `GET /api/v1/events?identifier=<actual _wuid>` to verify delivery. Never send a fake purchase or payment to test analytics. Whop purchase attribution requires a genuine successful payment and is not proven by merely opening a card form.

References:
- https://docs.whop.com/developer/ads/pixel
- https://docs.whop.com/developer/ads/events-api
- https://docs.whop.com/api-reference/beta/events/create-event
- https://developers.cloudflare.com/workers/runtime-apis/request/
