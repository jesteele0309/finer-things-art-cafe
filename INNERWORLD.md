# INNERWORLD · The Finer Things ART SALON™

Development MVP, not a production launch. Existing Python utilities remain unchanged; the original painting viewer is preserved at `roll-a-portrait.html`.

## Run

Node 22 or later. No dependencies to install. Run `npm start`, then open `http://localhost:3000`. Run `npm test` for the bounded unit and HTTP integration suite.

To enable optional paid image generation, copy `.env.example` to `.env` locally and configure `OPENAI_API_KEY` for an account with access to `OPENAI_IMAGE_MODEL`. Never commit credentials. No key was provisioned or paid provider call made during development. The configured model defaults to `gpt-image-1`. Reference: https://developers.openai.com/api/docs/guides/image-generation

The included server is loopback-only, rejects cross-origin generation requests, limits generation attempts to ten per hour per process, and does not log or store requests. It is intentionally not a publicly deployable authenticated backend. Do not expose it using a public tunnel. Before public release, add account authentication, per-user authorization, durable quotas, billing controls, abuse prevention and a reviewed provider-data policy.

## Implemented

- Responsive editorial Today, Ask then see, Folio and visual preference onboarding.
- Theme-based scene prompts, explicitly editable before provider submission. Free-text notes are not analyzed; only the approved scene prompt is transmitted.
- Separate appearance and emotional-fit feedback. Responses remain user-authored; theme-based invitations are not model assessments.
- Real image-generation API adapter; revisions create new images from revised full scene prompts, not image-to-image edits.
- Device-local IndexedDB storage for preferences, generated images, responses and saved Folio pieces. No cloud account, encryption, cross-device syncing or analytics.
- Text-only sharing with explicit confirmation and no notes, print chapters excluding private notes, JSON backup export including private notes.
- Preserved Roll-a-Portrait legacy page, with its existing Met API behavior.

## Explicit limitations and next work

- The starting image is a pre-generated example, clearly labeled. Daily selection reopens a saved piece for the local day or the example; there is no automatic daily generation or scheduled content.
- Taste feedback is stored per piece but does not yet train or update a personalization model. Users directly control medium, palette and motifs.
- Optional symbolism is a metaphor prompt only. Birth charts, transits and birth-data collection are not implemented.
- No Between Us, payments, subscriptions, printed-book ordering, public share URLs or native mobile shell.
- JSON backup restore and image-sharing exports remain to implement. Existing browser storage is not encrypted and may be cleared or evicted.
- Unit and HTTP integration tests use a mocked image provider. Live generation and browser/end-to-end interaction testing were not performed.

## Brand and provenance

Brand direction follows the user's INNERWORLD brief and The Finer Things ART SALON™ identity. Private source documents and their identifiers are excluded from this public repository.

The example image was generated for this implementation: unfinished plaster room, red chair, ocean doorway, analog editorial photography. It is not a Midjourney output, chart reading or personalized image. No Midjourney or Co–Star integration or affiliation is claimed.
