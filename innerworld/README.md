# The Finer Things / INNERWORLD 0.6

Your inner life, made visible.

This independent web application lives only inside `innerworld/`. The existing Art Cafe root application is not replaced. This is a feature-complete studio release candidate for the implemented flows below, not a claim that every commercial service or end-to-end journey has been verified.

## Implemented flows

- Finite daily ritual, separate appearance/resonance feedback, editable private notes and input explanations.
- Mood, theme, medium, palette, motifs, descriptors and up to three locally re-encoded moodboard references.
- Separate approvals for reflective text and the exact visual prompt. Real Responses/Images API adapters; selected images use the image-edit endpoint. Saved originals remain intact.
- IndexedDB storage, optional PBKDF2/AES-GCM passphrase encryption, stale-tab revision protection, legacy localStorage migration, explicit unencrypted backups.
- Opt-in private cloud artwork storage and atomic snapshot sync with optimistic concurrency. Profile, saved pieces, draft, chapters and ordering remain together.
- Two-account Between Us spaces: single-use restricted/unrestricted invites, own contributions, versioned scenes, two approvals, withdrawal and server rechecks before/after AI generation.
- Expiring/revocable shared art cards with title, chosen line and image only. No journal notes, source questions, raw birth details or private paths in the returned public card.
- Search and month-filtered archive, editable/reordered chapters, year-book assembly, original-resolution PNG exports and browser print/Save as PDF. Private reflections are opt-in for print.
- Birthplace search, reviewable IANA timezone, explicit handling of nonexistent/repeated civil times, real geocentric astronomy positions, natal/transit aspects and Whole Sign houses. Ascendant/houses deliberately omitted above 66 degrees latitude.
- Collaboration notification inbox. This is not background push notification delivery.
- Durable server-controlled free/member usage limits with duplicate-request rejection. Server membership check protects high-resolution requests.

## Run and verify

Node 22.16+ (22.x). Dependency versions are pinned.

```sh
cd innerworld
npm install
npm run verify
npm start
```

The release suite uses `tests/release-*.test.mjs`; older tests target retired interfaces and are not the release gate. The suite includes 21 domain/HTTP tests plus two installed-dependency tests. HTTP tests run the actual Node server with external services mocked; they never charge a provider.

During authoring, 21 domain/HTTP tests and ten browser component checks passed. The browser checks used an about:blank harness with mocked storage/services because this build environment blocks browser navigation to localhost and file URLs. Do not treat these as full login, IndexedDB, offline, payment or generation end-to-end tests. Separate transaction-rollback database checks passed for restricted invitations, two-user approval, revocation, duplicate quota requests, free quota limits and snapshot revision conflict.

## Runtime configuration

Use the example variable names in `.env.example`, set through the deployment host. Never commit real secrets. OpenAI provider keys stay exclusively on Railway. The Supabase publishable key is intentionally public; no service-role key is sent to the browser. The gateway uses built-in Supabase server credentials, user validation and a database-held digest of the Railway gateway credential. The plaintext gateway credential is never in source.

`VERIFY_MODELS_ON_START=1` performs read-only model access checks and one nonexistent-share negative gateway check, logging only model names/status codes. These checks do not demonstrate paid generation or billing availability.

## Billing activation boundary

Approved membership prices remain USD 12/month and USD 120/year. New checkout is disabled unless BOTH `BILLING_LAUNCH_READY=1` and a valid Stripe-hosted `STRIPE_PORTAL_URL` are configured. Existing product and prices are not recreated. Entitlements reconcile only verified account-linked, paid, allowlisted live Stripe records. Launch requires verifying checkout, activation, renewal, failed payment, cancellation and portal self-service against the configured Stripe Sync connection. The app does not grant membership from a client-side success flag.

## Not shipped as completed services

Physical print/book manufacturing, shipping, print-order payment, native iOS/Android store builds, background push notifications, and production email deliverability are not validated here. Browser print exports are functional output, not print fulfillment. A production SMTP/auth redirect review, real two-account user acceptance test, paid generation test, and payment lifecycle verification remain release gates. Do not market these external services as delivered or charge for unverified benefits.

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
