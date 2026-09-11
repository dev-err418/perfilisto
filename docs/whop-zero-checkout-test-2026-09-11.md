# Whop 100% discount test — 11 September 2026

Created QA100SEP11 in the Perfilisto Whop dashboard (promo_HFTHpyi8Nlap): 100% off, maximum one redemption, one use per customer. The existing app API key cannot create promo codes; its permissions were left unchanged. NEW10 was left unchanged.

Created Basic audit order 7b152a14-72b0-45e8-b0cd-deef3b8ecf24 with six user-provided references and onboarding preferences, checkout ch_2SGuJef0pJv6sXG. This belongs to an isolated audit identity, not the user's regular Google/Facebook login. Its email link requires the audit session; it must not be presented as accessible through the user's normal account.

## Real checkout and email passed

Both the embedded Whop checkout and application breakdown showed EUR 0.00 after applying the code. After entering the user-provided billing information through the hosted checkout, payment succeeded: pay_S3nY0hHyt50QN0, EUR 0.00. The payment-received modal appeared and the backend returned a verified payment. No card information is stored in this report or repository. Treat the single-use code as consumed; do not resubmit the payment.

The automatic payment confirmation reached the user's Gmail inbox at 19:01:10 UTC from Perfilisto <hello@perfilisto.com>, subject “Your payment has been confirmed”, Gmail message 1a091d85c44aab9e. Gmail reports SPF, DKIM (including perfilisto.com), and DMARC pass. No manual email send was used.

## Photo verification correctly blocks generation

Triggered the real photo check from the payment modal. Five photos were accepted, including a mid-range image. The sixth (low-angle train selfie) was rejected for its extreme angle and perspective. The order remains paid, with zero generated results. The UI did not expose Continue; the automated script timed out waiting for it. This is the expected minimum-six-accepted-photos gate, not a payment failure. No generation request or new batch was submitted. A replacement photo is needed to finish the real generation and ready-email acceptance test.

Added a regression assertion that paymentMatches accepts a verified 100% promo with zero subtotal/total. Existing rejection checks still reject unexplained underpayment. The order backend's 22 tests pass.

The current frontend and backend changes remain local; no deployment was performed. Ready-email delivery and this order's final gallery are not yet verified end to end.
