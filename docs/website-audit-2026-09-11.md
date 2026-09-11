# Website audit — 11 September 2026

Audit baseline: main at b188aeb, plus the fixes below. Production is still Cloudflare version 74f877db-986b-431a-b19c-24e77f626229, deployed at 15:55 UTC. A Git push has not deployed the newer dashboard.

## Issues fixed in this audit

- Public onboarding example images were caught by the page authentication rule. The login background returned a login redirect instead of an image. Bundled image assets are now public; onboarding/dashboard/album pages and private order image APIs remain protected.
- Generate new skipped account restoration initially, but the purchase component later restored the previous order from local storage. Explicit new purchases now stay fresh, while a URL with an order ID still resumes that order.
- Review multi-select popups could be hidden behind the sticky action bar. They now use Base UI's portaled, collision-positioned Popover, with bounded scrolling, keyboard dismissal and focus management.
- JSON null, arrays and primitives sent to order mutations could cause an internal error. They now return 400.
- The email regression test still expected /album instead of the new /dashboard destination. Updated it and added npm test to run the entire suite.

## Verified

| Area | Evidence |
| --- | --- |
| Public website | Home, login, terms, privacy and deletion pages return 200; desktop/mobile checks found no horizontal overflow, missing anchor targets or uncaught JavaScript errors. The login image issue above was detected separately. |
| Access control | Live anonymous dashboard/onboarding/album requests, including static HTML/text variants, redirect to sign-in. Order APIs reject anonymous access; cross-origin writes and unsigned Whop webhooks are rejected. Unit tests cover owner isolation and forged identity headers. |
| Google and Facebook | Live and localhost sign-in initialization reaches the correct provider with a state parameter and the correct environment-specific callback URL. Provider account consent and completed sign-in were not automated. |
| Desktop upload | Both supplied HEIC files plus a JPEG rendered successfully; a corrupt HEIC displayed a file-specific error without losing the three valid photos. |
| Mobile upload | Live mobile UI uploaded two sample photos, the shared session returned both, and removing one synchronized correctly. Separate live API checks covered create, PUT, GET and DELETE. Audit photo data was removed. |
| Prices and checkout | Whop API returned Basic €29/10, Professional €39/50 and Executive €59/100 matching local configuration (quantities are local plan configuration). All three live test orders created checkout configurations; repeating checkout reused each configuration. |
| Card form | A real Whop checkout embed loaded card number, expiry and CVC fields in the browser. No card details were entered and no payment submitted. |
| Payment protection | Live unpaid verification/generation/preferences calls were rejected. Invalid payment confirmation was rejected. Mocked backend tests cover paid confirmation, discount validation, webhook signatures and idempotency. |
| Photo review and generation flow | Browser test with controlled API responses passed payment modal → check photos → poses → glasses → review/consent → generation request → dashboard, including a 390px mobile viewport. |
| OpenAI | Live model-list request authenticated successfully and included gpt-image-2 and gpt-4.1-mini. Backend tests cover reference files, selected options, purchased counts, batch submission, recovery and partial output. No new paid inference or batch was launched in this audit. |
| Results and favorites | Earlier/current browser checks cover ready transition, result downloads, sidebar/mobile drawer, favoriting, filtering and removal. Backend tests cover persistence, repeated requests and ownership. Live favorites require the new deployment. |
| Email | Template destination, privacy, enqueueing, retries and delivery failure paths pass backend tests. No email was sent in this audit. |
| Analytics | Live context returns 200. Events without consent return 204 by design; they are not sent. Unit tests cover consent, event validation, identity, prices and retries. No artificial conversion events were sent. |

Final automated checks: 53 tests pass, ESLint passes, production build passes, Cloudflare deployment dry run passes.

## Remaining launch work / limitations

1. Deploy the current website and Worker together. The live authenticated /dashboard and /api/orders/current still return 404. Favorites are also absent from the old Worker. The login-image fix and all audit fixes are local until deployment.
2. Resolve the delivery-time promise. All plans submit to the same OpenAI Batch API with completion_window: "24h". There is no plan-dependent priority queue or real-time fallback enforcing 15 minutes / 30 minutes / 1 hour. Either implement those guarantees or present the durations as estimates. OpenAI describes the Batch window here: https://platform.openai.com/docs/api-reference/batch/object.
3. Complete one controlled paid end-to-end acceptance run after deployment: successful charge → verified webhook → photo check → completed generation → stored downloadable results → receipt/ready email to a real inbox. This audit did not charge a card or send mail, so it cannot certify those live outcomes.
4. Consider an album history. The account lookup remembers only the latest generated album. Older albums remain accessible through their private links, but are not listed in the sidebar after another generation.
5. Confirm the operational process for failed/partial batches and refunds. Failure states preserve available results and direct users to support; there is no self-service retry/refund workflow.
6. Production OAuth consent/app-review status still needs a real non-developer account check. Successful authorization URL creation alone does not establish Google/Facebook approval for all users.

The three live checkout test orders were unpaid, used sample photos under an isolated audit identity, and expire under the existing unpaid-order cleanup policy. No customer orders were modified.
