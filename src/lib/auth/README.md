# Authentication preparation

`/login` is a static, provider-ready page with Google and Facebook sign-in buttons.
Both buttons stay disabled until real authentication is connected.

`request-policy.mjs` is shared by `src/proxy.ts` (Next.js development) and
`worker/index.js` (Cloudflare production). It keeps login responses private,
canonicalizes the www host, and redirects `/dashboard` and its children to
`/login?redirect=...`. Onboarding and photo upload routes remain public.

Dashboard access currently fails closed for every visitor. To enable accounts,
connect a provider and verify its session server-side before allowing dashboard
requests. A cookie's presence is not proof of authentication. Protect future
private API endpoints with the same session verification. Validate the login
callback destination against same-origin dashboard paths before redirecting.

The export script temporarily excludes API routes and the Next.js proxy because
static exports cannot run them; the Worker supplies production request handling.

Run the request-policy checks with `node --test src/lib/auth/request-policy.test.mjs`.
