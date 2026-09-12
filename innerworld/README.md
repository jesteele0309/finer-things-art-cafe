# The Finer Things / INNERWORLD 0.7

Your inner life, made visible.

This independent web application lives inside `innerworld/`. The existing Art Cafe root application is preserved. This studio release includes the flows below; commercial activation and device acceptance still have the explicit gates in `docs/RELEASE_CHECKLIST.md`.

## Implemented flows

- Finite daily ritual, separate appearance/resonance feedback, editable private notes and input explanations.
- Mood, theme, medium, palette, motifs, descriptors and up to three locally re-encoded moodboard references.
- Separate approvals for reflective text and the exact visual prompt. The exact approved prompt survives archive reloads. Real Responses/Images API adapters; selected images use the image-edit endpoint. Saved originals remain intact.
- IndexedDB storage, optional PBKDF2/AES-GCM passphrase encryption, stale-tab revision protection, legacy localStorage migration, explicit unencrypted backups.
- Opt-in private cloud artwork storage and atomic snapshot sync with optimistic concurrency. Profile, saved pieces, draft, chapters and ordering remain together.
- Two-account Between Us spaces: single-use restricted/unrestricted invites, own contributions, versioned scenes, two approvals, withdrawal and server rechecks before/after AI generation.
- Expiring/revocable shared art cards with title, chosen line and image only. No journal notes, source questions, raw birth details or private paths in the returned public card.
- Search and month-filtered archive, editable/reordered chapters, year-book assembly, original-resolution PNG exports and browser print/Save as PDF. Private reflections are opt-in for print.
- Birthplace search, reviewable IANA timezone, explicit handling of nonexistent/repeated civil times, real geocentric astronomy positions, natal/transit aspects and Whole Sign houses. Ascendant/houses deliberately omitted above 66 degrees latitude.
- Collaboration inbox plus opt-in Web Push: per-device preferences, timezone-aware daily reminders, generic private previews, durable delivery leases/retries and expired-subscription removal. Device delivery still needs acceptance after browser opt-in.
- Cross-tab authentication refresh coordination, one retry after a rejected token, and actionable expired sign-in-link messages.
- Durable server-controlled free/member usage limits with duplicate-request rejection. Server membership check protects high-resolution requests.

## Run and verify

Node 22.16+ (22.x). Dependency versions are pinned.

```sh
cd innerworld
npm ci
npm run verify
npm start
```

The release suite uses `tests/release-*.test.mjs`; older tests target retired interfaces and are not the release gate. All 33 release checks passed on September 12, 2026. HTTP tests run the actual Node server with external services mocked; they never charge a provider. The committed lockfile makes GitHub CI and Railway builds reproducible.

Sixteen live, non-billable API checks passed against production: authentication for three isolated accounts, free membership, astrology, restricted invitations and identical scene approval, outsider rejection, private image upload/retrieval, cloud archive and chapter preservation, stale-copy conflicts, anonymous art-card filtering/revocation, consent withdrawal and sign-out. These used synthetic data and a small uploaded PNG; they do not prove paid image generation or email delivery. The production browser also passed local onboarding, saved collection reload and chapter creation.

Eight transaction-rollback billing reconciliation checks passed using synthetic Stripe-shaped records. This validates SQL entitlement decisions for activation, renewal, payment failure, cancellation, identity and price mismatches. It does not validate incoming Stripe events or a real purchase. Notification queue ownership, leases and function access were separately tested in rollback-only database checks.

`scripts/live-acceptance.py` records API acceptance against disposable accounts provisioned by an administrator. Keep its credentials outside the repository. Its default run makes no paid AI requests; `--generate` makes one reflection, two image generations and one reference edit and requires approval for those provider charges. Clean up the recorded disposable accounts and objects afterward.

## Runtime configuration

Use the example variable names in `.env.example`, set through the deployment host. Never commit real secrets. OpenAI provider keys stay exclusively on Railway. The Supabase publishable key is intentionally public; no service-role key is sent to the browser. The gateway uses built-in Supabase server credentials, user validation and a database-held digest of the Railway gateway credential. The plaintext gateway credential is never in source.

`VERIFY_MODELS_ON_START=1` performs read-only model access checks and one nonexistent-share negative gateway check, logging only model names/status codes. These checks do not demonstrate paid generation or billing availability.

Apply the versioned Supabase migration and deploy `supabase/functions/innerworld-gateway/index.ts` with its existing custom gateway authentication. `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` enable the Railway push worker. Only the public key is returned to browsers. Notifications require an explicit user gesture and browser permission; the worker never sends journal text or artwork previews. iPhone/iPad users need the installed Home Screen web app. The service must remain awake for minute-based queue processing.

## Billing activation boundary

Approved membership prices remain USD 12/month and USD 120/year. New checkout requires `BILLING_LAUNCH_READY=1`, a valid Stripe-hosted `STRIPE_PORTAL_URL`, and a server check confirming the configured live Stripe account, webhook events and both approved prices in Stripe Sync. Existing product and prices are not recreated. Entitlements reconcile only verified account-linked, paid, allowlisted live Stripe records. Launch requires verifying checkout, activation, renewal, failed payment, cancellation and portal self-service against the configured Stripe Sync connection. The app does not grant membership from a client-side success flag.

At the September 12 review, Stripe Sync's managed webhook belonged to a different test account from the live account holding the membership product; no customer portal configuration was present and the connected Stripe operations exposed portal reads only. Checkout remains paused until these external configuration gaps are fixed and verified.

## Not shipped as completed services

Physical print/book manufacturing, shipping, print-order payment and native iOS/Android store builds are not shipped. Browser print exports are functional output, not print fulfillment. Production email delivery, a real two-browser account journey, paid generation/editing, payment event delivery and real device push delivery still require acceptance. Do not market unverified external services as delivered or charge for unverified benefits.

## Privacy details

The device passphrase protects that browser's stored ciphertext, not an unlocked browser or cloud snapshot. There is no passphrase recovery. Cloud sync and public sharing require explicit user action. Image prompts do not silently acquire journal text; astrology sends a symbolic allowlist rather than raw birth information to OpenAI. Provider data handling is governed by the provider's current policy. Revocation blocks future server access but cannot erase recipient downloads. Local erasure does not erase the cloud account or cancel subscriptions.

Nominatim search is manual, cached and limited to approximately one request/second for this single service instance. Coordinate-to-timezone lookup is a suggestion that the user reviews. Scale-out deployment requires a shared geocoding limiter or a contracted provider.

## Primary implementation references

- https://developers.openai.com/api/docs/models/gpt-5-mini
- https://developers.openai.com/api/docs/models/gpt-image-2
- https://developers.openai.com/api/docs/guides/image-generation
- https://github.com/cosinekitty/astronomy
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://operations.osmfoundation.org/policies/nominatim/
