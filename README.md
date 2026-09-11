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
