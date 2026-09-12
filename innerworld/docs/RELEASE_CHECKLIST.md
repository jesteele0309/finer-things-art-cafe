# Release acceptance — 0.7.2

## Verified September 12, 2026

- [x] 38 automated domain, client, Node HTTP, installed-dependency, push-worker and provider-error checks pass. Paid providers are mocked.
- [x] 16 non-billable production API checks pass using three disposable accounts and synthetic material: authentication, membership lookup, astrology, invitations, identical scene approval, outsider rejection, private binary storage, archive/chapters, conflict rejection, share/revocation, consent withdrawal and sign-out.
- [x] Eight rollback-only SQL entitlement checks pass for activation, renewal, cancellation, payment failure, verified identity, approved prices and billing readiness. These are not Stripe webhook-delivery tests.
- [x] Notification SQL checks cover ownership, claims, exact leases, duplicate dispatch prevention and function access.
- [x] Production browser onboarding, collection reload and chapter creation work on the 0.6 base.
- [x] Supabase gateway version 5 and the versioned migration for notification delivery and HTTP 409 conflicts are applied.
- [x] Railway notification keys are installed securely, with billing launch still disabled.

- [x] Eleven rollback-only quota checks cover restoration, double release, wrong owner/kind, retained duplicate IDs and service-only access.
- [x] Repeated all 16 non-billable API checks against 0.7.1; an initial Auth timeout did not recur on the completed run.
- [x] Paused both public Payment Links and disabled the obsolete Railway webhook. Prices are preserved.

## Deployment gate

- Publish this release to GitHub and confirm `npm ci` plus `npm run verify` succeeds in CI and Railway.
- Confirm the public release hash matches the deployed commit and notification configuration is present.
- Confirm read-only provider model access, private gateway check and notification worker startup from runtime logs.
- Record the deployed commit, CI result and browser review in the Notion production launch project.

## Acceptance and external configuration still open

- [ ] Real sign-in email delivery and callback to the app; production SMTP review. API authentication does not prove delivery.
- [x] User approved one reflection, two generations and one reference edit using synthetic data.
- [ ] Complete the approved paid-provider run after funding the API organization. The deployed 0.7.1 diagnostic returned OpenAI `credit_balance_exhausted`; further paid calls were stopped. Real generation, shared generation and editing remain unverified.
- [ ] Two independent browsers complete sign-in, cloud transfer and shared creation, including consent withdrawal while a real generation is in flight.
- [ ] Verify encryption, wrong-passphrase handling and offline reload on iOS Safari and desktop.
- [ ] After explicit browser opt-in, verify a background push and a daily reminder on desktop and an installed iOS Home Screen app.
- [ ] Connect the live Stripe account to Stripe Sync. Its existing managed webhook is for a different test account.
- [ ] Grant Stripe portal configuration access; configure payment-method updates, invoices and cancellation.
- [ ] Verify checkout/event delivery, activation, renewal, failed payment and cancellation before enabling purchases. Preserve approved USD 12/month and USD 120/year pricing.
- [ ] Physical print manufacturing/shipping and native store submissions require provider/developer account setup and their own acceptance.

Do not mark external or device flows complete from mocked tests or a healthy HTTP process.
