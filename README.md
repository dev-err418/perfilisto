# Perfilisto

Next.js frontend, exported as static assets and hosted by a Cloudflare Worker. The Worker implements authentication, orders, mobile uploads, Whop payments/webhooks, OpenAI batch processing, analytics and transactional email. Private photo storage uses R2; durable state and retries use Durable Objects.

Use Node.js 22 or newer. Keep secrets in ignored local environment files or Cloudflare secrets; never commit them.

```bash
npm ci
npm run dev          # Next.js UI on localhost
npm test             # Complete backend, auth, email, analytics and upload suite
npm run lint
npm run build        # Exports the frontend to out/
npm run deploy:check # Lint, build and Cloudflare dry run; does not publish
npm start            # Local Cloudflare runtime using built assets
npm run deploy       # Build and publish to Cloudflare
```

Local Next.js order requests use the authenticated proxy to the production Worker. Treat non-debug checkout and generation as real operations. Debug previews are development-only and use sample results.

A Git push alone does not deploy the Cloudflare Worker. Publish the frontend and Worker together when API contracts or routes change.

See [the website audit](docs/website-audit-2026-09-11.md) for verified behavior, remaining launch checks and known product gaps. Authentication details are in [src/lib/auth/README.md](src/lib/auth/README.md).

Language routes are `/es` and `/en`. Bare page URLs select Spanish for Spain (Cloudflare IP country) or a preferred Spanish browser language, and English for other detected countries/languages. With no signals, Spanish is the fallback. A locale cookie remembers the visited language; API and asset URLs remain unprefixed. The same detection and auth policy run in the development proxy and production Worker.

`src/lib/orders/catalog.mjs` owns locale pricing: EUR 29/39/69 and USD 35/45/75. Checkout snapshots the server price and currency into a one-time Whop plan and verifies the returned amount before displaying the payment form. English checkout disables promotional codes. Existing orders retain their original amounts. Deploy frontend and Worker together; the Next.js development order proxy still reaches the currently deployed Worker.
