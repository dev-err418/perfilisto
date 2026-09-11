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
