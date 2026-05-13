# Definition of Done — feature-level

A feature ships when ALL of these are true:

- [ ] Typed strictly. `npm run typecheck` clean.
- [ ] Linted. `npm run lint` clean. No new `// eslint-disable` lines
      without a comment explaining why.
- [ ] No `any`. No `@ts-ignore` without a justifying comment.
- [ ] Tests written and passing. `npm test` green.
  - Unit tests for any new logic in `lib/*`.
  - Integration tests for any new Server Action or Route Handler
    that touches the DB.
  - E2E tests for any new user-facing journey (Playwright).
- [ ] Explicit Loading / Empty / Error states for every new view.
      Use the shared `<DataState>` pattern.
- [ ] Mobile responsive. Tested at 375px and 768px.
- [ ] Keyboard accessible. Tab order is logical, Enter / Escape
      do the right thing in dialogs, focus is visible.
- [ ] Audit log written. Every mutation on `Reservation`, `Payment`,
      `Property`, or `Guest` calls the audit helper.
- [ ] i18n. FR keys added (source of truth). EN and AR keys added
      or stubbed.
- [ ] Documented.
  - User-facing change → update `README.md` if relevant.
  - Architectural change → ADR in `docs/adr/`.
  - PMS workflow change → update `docs/pms-walkthrough.md`.
  - Per-function: JSDoc explaining the *why* if non-obvious.
- [ ] PR diff < 400 lines (or split, or justified in the PR body).
- [ ] Screenshots in the PR for UI changes (desktop + mobile).
- [ ] Manually exercised the happy path AND one edge case.

Then, and only then, request review.
