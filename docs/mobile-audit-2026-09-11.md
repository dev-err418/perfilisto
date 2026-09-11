# Mobile rendering audit — 11 September 2026

Checked the local application using Chromium with phone viewports and touch emulation. This is browser emulation, not a physical iPhone/Safari certification. Changes are not deployed by this audit.

## Coverage

- Public landing page, login, privacy, terms and data-deletion pages: 360, 390 and 430 pixels wide. No horizontal overflow, broken images, missing internal anchors or uncaught browser errors in this sweep.
- Onboarding: welcome consent dialog, gender, age, hair color, hair length, hair type, body type, attire, backgrounds, empty/filled upload and package selection. Full male path at 360×740, 390×844 and 430×932; female path at 390×844. All measured layouts fit the viewport.
- Real Whop card form, promo-code entry point, total, pay button and order summary at 360/390/430 pixels. The embedded document also fits its available width. No card submitted or charge made.
- Controlled post-payment fixture: payment-received dialog, photo-check success notification, verified upload, poses, glasses, review, select/multiselect controls, consent and generation handoff at 360 pixels (390 for final handoff). This validates layout and navigation, not a real payment or AI request.
- Dashboard preview: generating, ready transition, results, mobile sidebar, favorites, empty favorites and Browse results. Favorite add/remove and filtering exercised at 360×740.
- Live phone-upload page at 360×844: empty, selected and uploaded states; two example images uploaded, synchronized, removed and cleaned up. No horizontal overflow.

## Fixes

1. Shared onboarding photo options use two columns on narrow phones rather than a long narrow single column. Desktop widths remain unchanged.
2. Photo-check success/warning/error notifications expose Sonner's standard dismiss button. This lets users immediately clear a notification covering the bottom action on a small screen; the existing auto-dismiss remains.
3. Result Download buttons keep their full-height shape and readable label while reducing mobile horizontal padding, preventing the icon from collapsing.

## Validation and limits

ESLint, production export, all 53 existing tests and whitespace checks pass. Screenshots and temporary browser scripts are stored under `/tmp/perfilisto-mobile-audit` and `/tmp/perfilisto-mobile-*.mjs` on this computer. Full-page screenshots include sticky controls at their viewport position; content beneath them can be reached by scrolling.

Actual device keyboards, Safari-specific behavior, OAuth provider pages after handoff, real payment completion and paid AI generation are outside this mobile rendering test. The previous website audit documents backend/deployment gaps separately.
