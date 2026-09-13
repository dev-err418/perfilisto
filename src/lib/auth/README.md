# Authentication

Google and Facebook use Auth.js Core in both the Next.js development route and
production Cloudflare Worker. Callback URLs are `/api/auth/callback/google` and
`/api/auth/callback/facebook`; register the production origin and localhost origin
in the relevant provider dashboard.

Required server secrets: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`,
`AUTH_FACEBOOK_ID`, and `AUTH_FACEBOOK_SECRET`. Development reads `.env.local`;
production reads Worker secrets. Never expose these through NEXT_PUBLIC variables.

Login buttons discover configured providers, request a CSRF token, and initiate
OAuth through POST. Google checks PKCE, state, and nonce; Facebook checks state.
Sessions use encrypted, HttpOnly cookies lasting seven days. User identity is
provider-qualified. This integration does not persist a user database or link
Google and Facebook accounts by email.

The shared request policy protects dashboard and onboarding pages (including
static HTML/RSC output variants). It requires a cryptographically verified,
unexpired session, preserves the intended destination, and prevents public
caching. Callback redirects allow only same-origin onboarding/dashboard paths.
Mobile photo upload routes retain their existing public session-link behavior.

The static export excludes Next.js API/proxy files; the production Worker handles
authentication and request protection before serving assets. Future private APIs
must independently verify their session and authorize ownership of requested data.

Run checks with `node --test src/lib/auth/*.test.mjs` using Node 22+.

## Email codes

The login form also supports passwordless email codes through the existing
Cloudflare Email Service `EMAIL` binding. `POST /api/auth/email/send` sends a
six-digit code; `POST /api/auth/email/verify` redeems it and issues the same
seven-day encrypted, HttpOnly Auth.js session used by social sign-in. Both routes
require a same-origin JSON POST. `GET /api/auth/email/status` reports availability.

`EmailAuth` is a Durable Object, bound as `EMAIL_AUTH` with migration
`v5-email-auth`. Requests are serialized per HMAC of the normalized email address.
Only keyed code/browser hashes and temporary counters are stored, not plaintext
codes or recipient addresses. Each code is bound to the requesting browser's
HttpOnly cookie, expires after ten minutes, and is consumed atomically. Five
incorrect attempts exhaust a code. Resends rotate the challenge, have a 60-second
cooldown, and are limited to five sends per email per hour. `AUTH_RATE_LIMIT`
also limits requests per Cloudflare visitor IP. Delivery errors invalidate the
challenge, retain abuse counters, and return no provider details.

Email identities use `email:<HMAC>`; they do not automatically merge with Google
or Facebook identities. Existing users must use their original sign-in method to
access existing orders. Do not change or rotate AUTH_SECRET casually: it also
keys email identity IDs, in addition to encrypting existing sessions. A future
identity migration needs an explicit account-linking flow with proof of both
accounts, not an email-string match.

English and Spanish code emails are sent directly so the send response can
report failure. No code is logged or returned in the API response. Expired
challenge hashes are removed by alarms; rate-limit records expire after an hour.
Next.js-only development has no Cloudflare bindings and shows email sign-in as
unavailable; use the Worker runtime with the configured binding to exercise it.

Verification: `node --test worker/email-auth.test.mjs src/lib/auth/*.test.mjs
worker/analytics.test.mjs`. These tests mock delivery and do not send real email.
After deployment, a real inbox code redemption is still needed to verify live
mail delivery. Deploy the new migration and bindings with the Worker and assets.
