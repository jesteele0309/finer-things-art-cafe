# The Finer Things / Innerworld

**Your inner life, made visible.**

This branch contains the independent INNERWORLD product inside `innerworld/`, without replacing the existing Finer Things Art Cafe experience.

## Implemented in the production branch

- Editorial mobile/desktop interface with one daily piece rather than an endless feed.
- Aesthetic onboarding: medium, palette, motifs and theme.
- Optional astrology intake with birth information kept out of image prompts.
- Daily Inner Weather artwork, concise reflection and invitation.
- Separate visual-taste and experience-fit feedback.
- Explainable `Why this?` personalization.
- Ask, then See flow with non-authoritative framing and revision.
- Between Us shared-study consent flow that does not read private journal material.
- Personal collection/search.
- Local privacy baseline and explicit review before anything is sent to the image provider.
- Procedural offline study renderer as a genuine fallback, clearly distinct from provider-generated art.
- Server-side OpenAI Images API adapter. The OpenAI key is never shipped to the browser.
- PWA shell and static fallback.

## Production backend boundary

GitHub Pages can serve the static application but cannot execute `server.mjs`. AI generation therefore requires deploying the Node service to a server host and setting `OPENAI_API_KEY`, `STUDIO_ACCESS_TOKEN`, `APP_ORIGIN`, and `ENABLE_AI=1` there. Never commit `.env`.

## Next service layer

Calculated natal charts/transits, authenticated cloud accounts/sync, remote two-user invitations, subscription billing, durable media storage and print ordering belong in the hosted service layer. The UI deliberately does not claim these are live until those services are connected and verified.

## Run

Node 22.16+.

```sh
cd innerworld
npm install
npm start
```
