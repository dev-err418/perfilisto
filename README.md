# Perfilisto

Marketing site for Perfilisto. English first; copy lives in `src/i18n` so Spanish can be added later.

The glass topbar is the same system as [Postback](https://postback.sh): sticky pill nav, blur, and the expanding Get started control.

```bash
npm run dev
```

## Cloudflare Workers

Use Node.js 22 or newer (`.nvmrc` selects Node 22). Wrangler requires it.
The Miniflare `sharp` override pins a patched release for local tooling.

The current landing page uses Next.js static export. `npm run build` creates
`out/`, which Cloudflare Workers serves as static assets. There is no server
Next.js server runtime, database, or application secret required for this version.
The small Worker entry point redirects www and otherwise serves the static assets.

```bash
npm ci
npm run deploy:check # lint, production build, and Wrangler dry run; does not publish
npm start            # preview the built assets in the local Workers runtime
```

To publish, provide `CLOUDFLARE_API_TOKEN` in the deployment process environment
and run `npm run deploy`. Keep the token outside source control and the `out/`
directory. The token used for the readiness check remains in the local Postback
project; it has not been copied into this project.

`wrangler.jsonc` targets the verified Cloudflare account and creates Custom
Domains for `perfilisto.com` and `www.perfilisto.com`. Cloudflare provisions DNS
and certificates when deployed. `worker/index.js` redirects www to the apex.
Unknown paths return the exported 404 page.

This static setup must be replaced with a Workers-compatible server adapter if
server-side authentication, Server Actions, or dynamic API routes are added.

## Launch blockers found during readiness review

- `/login` is not implemented.
- The homepage has no `how-it-works` or `pricing` sections, although the navigation
  links to them.

The deployment setup can host the landing page, but these user flows need real
destinations or an intentional prelaunch experience before a product launch.
The readiness check does not publish the site or modify Cloudflare DNS.
