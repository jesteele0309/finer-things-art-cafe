# Release acceptance

## Automated gates
- [x] Domain and Node HTTP mock-provider tests: 21 passed during authoring.
- [x] UI components/mobile overflow: ten about:blank harness checks passed (storage and service calls mocked).
- [x] Database transaction-rollback checks: restricted invites, two-account scene consent, revoked consent, duplicate request IDs, free image quota, snapshot conflicts.
- [ ] Deployed build runs `npm run verify`, including actual installed astronomy/timezone dependencies.
- [ ] Public deployed release hash and health response match new commit.
- [ ] Read-only provider model and authenticated gateway negative checks pass.

## Real-user acceptance still required
- [ ] New account sign-in email reaches a non-owner inbox and returns to the correct app origin.
- [ ] Real image generation and image-edit reference request complete and remain usable after reload.
- [ ] Two independent accounts create/join/contribute/approve; revoke during generation and verify result is not published.
- [ ] Cross-device cloud upload/download preserves binary art, private notes and chapter ordering; conflicts are visible.
- [ ] Share/revoke/expiry checked from another browser; no private fields appear.
- [ ] Device passphrase encryption, wrong-password rejection, storage failure and offline reload checked on iOS Safari and desktop.
- [ ] Stripe test lifecycle covers purchase, renewal, failure and cancellation; customer portal works.
- [ ] External fulfillment, push notifications and native builds separately scoped, authorized and tested.

Do not tick these boxes based only on source inspection or a healthy HTTP process.
