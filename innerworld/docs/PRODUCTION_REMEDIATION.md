# Production remediation — September 12, 2026

This is an execution record. Open items remain launch gates; researched roadmap features are not represented as deployed.

## Release evidence

- Previous working release: `1a4d54901d698f4fe2d6c8909e99eb6d5abc0cc1` (0.7.0).
- Published diagnostic release: `0b9296334e3768e07aaa6b1f212e82fdf729d7ba` (0.7.1).
- Railway deployment `99adcc62-fb84-4105-82f9-e237d663cc12`: SUCCESS; public `/api/status` returned that exact revision and version.
- Railway build: 35 passed, 0 failed. Local 0.7.2 follow-up: 38 passed, 0 failed; paid services are mocked in these tests.
- Repeated 16 non-billable production API checks successfully using three disposable synthetic accounts. An initial Supabase Auth HTTP 504 was transient; the completed run authenticated all three accounts and signed them out.
- Versioned quota migration `20260912205338` applied; private gateway version 5 active. Eleven rollback-only database checks passed.
- Follow-up 0.7.2 publication and deployment: record final commit and deployment after verification.

## Milestone 1 — release state and recovery

- [x] Verify GitHub main, Railway state and local patch; preserve the earlier release as a rollback target.
- [x] Verify configured variable names without exposing their values.
- [x] Confirm Vercel connection exposes no team; continue using the existing Railway service.
- [x] Keep in-app checkout gated and pause the two external Payment Links.

Rollback the application to the earlier working Railway deployment if the follow-up fails. The additive database column and service-only RPC can remain; old code does not use them. Do not remove customer data or weaken billing gates during rollback.

## Milestones 2–4 — publishing and AI

- [x] Publish through the normal GitHub connection. The previous workspace-credit rejection did not recur.
- [x] Deploy 0.7.1 and verify the actual running revision.
- [x] Diagnose one authorized reflection request. Request `ffba4cd5-c3b5-4fe7-bd90-f3c809046213` returned HTTP 429 and `credit_balance_exhausted`.
- [x] Stop further paid calls after confirming depleted provider credits.
- [x] Implement exact-once allowance restoration for explicit provider rejection. Keep duplicate IDs; do not refund successful or uncertain outcomes.
- [ ] Fund the OpenAI API organization associated with the existing Railway key. Account-owner action; do not expose or rotate the key to treat a depleted balance.
- [ ] Complete real reflection, personal artwork, shared artwork and reference editing acceptance after funding. Preserve request IDs and results; do not blindly retry unknown outcomes.

OpenAI identifies this error as an exhausted organization prepaid balance. [Error codes](https://developers.openai.com/api/docs/guides/error-codes).

## Milestone 5 — live Stripe synchronization

- [x] Confirm live account `acct_1UBfdXFIwkq6hr2U` owns INNERWORLD billing.
- [x] Confirm existing Supabase managed webhook belongs to `acct_1UBfuYPb4ChJeAd0` in test mode; no prices are synchronized.
- [x] Disable obsolete live webhook `we_1UE4iEFIwkq6hr2UalR2ZzJ9`, whose Railway route was retired.
- [x] Pause payment links `plink_1UE1mbFIwkq6hr2ULjFazqca` and `plink_1UE1mfFIwkq6hr2Ul0c6ZdYM`; preserve their product and prices.
- [ ] Configure Supabase Stripe Sync with the intended live account credential through its secure dashboard integration. The current connector has no action to install that credential.
- [ ] Confirm live managed webhook, initial backfill, approved prices and event delivery.
- [ ] Verify authenticated user/customer/subscription association and activation, renewal, failure, recovery and cancellation. Do not grant access from a return URL.

Use a restricted Stripe key with the permissions required by the managed integration; enter it into Supabase, not source or chat. Preserve the existing test integration unless replacement is necessary and reviewed. [Official installation guidance](https://supabase.com/blog/stripe-sync-engine-integration).

## Milestone 6 — customer billing management

- [x] Confirm the live account has no portal configuration and current connected operations expose portal reads only.
- [ ] Obtain portal configuration access or configure the live hosted portal in Stripe Dashboard.
- [ ] Enable payment-method updates, invoices and cancellation; verify the customer sees their own records.
- [ ] Set the resulting hosted login link in Railway `STRIPE_PORTAL_URL`; keep `BILLING_LAUNCH_READY=0` until lifecycle acceptance is complete.
- [ ] Review applicable tax setup before activation; do not enable automatic tax without the required registrations.

[Hosted portal setup](https://docs.stripe.com/customer-management/activate-no-code-customer-portal).

## Milestone 7 — complete acceptance

- [x] API authentication, astrology, two-account consent, outsider rejection, private storage, cloud chapters, conflict handling, share revocation and sign-out pass.
- [ ] Verify real email delivery and callback with an authorized mailbox; inspect SMTP and redirect settings. API password sign-in does not prove email delivery.
- [ ] Verify two independent browser accounts, generated artwork reload, cross-device sync and consent withdrawal during a real generation.
- [ ] Verify encryption, wrong passphrase and offline reload on desktop and iOS Safari.
- [ ] Verify actual background push on desktop and an installed iOS Home Screen app after explicit device opt-in.
- [ ] Connect a Stripe sandbox and exercise the subscription lifecycle with provider events and time simulation. Current Stripe connection exposes the live account only. SQL fixtures do not establish event delivery.
- [ ] Confirm live billing configuration without creating a real charge solely for testing.

Supabase's default email service is intended for restricted testing; production delivery needs an appropriate configured sender. [SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp). [Stripe Billing simulations](https://docs.stripe.com/billing/testing/test-clocks).

## Milestone 8 — activation and product expansion

- [ ] Enable commercial purchases only after AI, synchronization, portal and acceptance gates pass; explicitly reactivate both Payment Links and then set the launch flag.
- [ ] Capture final commit/deployment, test evidence and rollback target.
- [ ] Deliver museum discovery/provenance, expanded collections/search/moodboards, advanced image editing, journaling/personalization, expanded astrology/relationships, media, fulfillment and native packaging as separately tested releases.

These expansion milestones retain their researched scope. Physical manufacturing/shipping, native store accounts and real device permissions are external dependencies, not completed services.

## Security review

The new quota-release RPC has a fixed empty search path, denies anon/authenticated execution and is callable only by the trusted server. Its gateway action validates the signed-in user before supplying the owner ID. The advisor did not flag it. Remaining existing findings include Stripe-managed function search paths, legacy Art Cafe foreign-table exposure, authenticated API discoverability and disabled leaked-password checks; do not report the entire project as clean. [Supabase advisor guidance](https://supabase.com/docs/guides/database/database-linter).
