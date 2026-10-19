# LinkedIn fixtures

The Playwright tests run the built extension against copies of LinkedIn's `/messaging/` page in `tests/fixtures/`. This repo is public, so a fixture must never contain a real person's data.

## Making a fixture

1. Open the Thread on LinkedIn and save the Thread's DOM (DevTools → the `.msg-thread` element → Copy outerHTML).
2. Cut it down to the structure leauto reads: the Thread container, the title bar with the participant name, the message list items and their bodies, and the compose form.
3. Sanitise it:
   - [ ] Replace every person's name with an invented one.
   - [ ] Rewrite every message body with invented text that keeps the vocabulary under test.
   - [ ] Delete every `<img>`, avatar, `srcset` and `style="background-image…"`.
   - [ ] Replace every URN ID with `FAKE-<n>` (for example `urn:li:msg_message:FAKE-1`).
   - [ ] Replace every profile URL with `linkedin.com/in/fake-<name>`.
   - [ ] Remove tracking attributes (`data-tracking-*`, `data-control-*`) and any inline JSON.
4. Add the stand-in script from an existing fixture, which enables Send only after a real `input` event (in place of LinkedIn's React state).
5. Run `npm run lint:fixtures`. It fails if it finds LinkedIn media CDN URLs, URNs not starting `FAKE`, or profile URLs not starting `fake-`.

The lint check can't spot a real name or a real message. Checklist step 3 is the guard against those, so review fixture diffs with that in mind.
