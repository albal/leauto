# leauto

A Chrome and Edge extension that reads recruiter pitches in LinkedIn message Threads, checks them against your criteria (Engagement Type, IR35 Status, Working Pattern, rate), and writes a reply Draft into the compose box for you to review and send. It never sends anything itself, it only reads a Thread when you click, and your messages never leave your browser.

Domain language is in [GLOSSARY.md](GLOSSARY.md), and architectural decisions are in [docs/adr/](docs/adr/).

## Development

```sh
npm install
npm run dev          # WXT dev mode with a fresh Chrome profile
npm run build:all    # production builds in .output/chrome-mv3 and .output/edge-mv3
npm run check        # typecheck, fixture lint, unit tests, end-to-end tests
```

- `npm test`: Vitest unit tests of the Reply Engine (`(ThreadSnapshot, Settings) → Outcome`)
- `npm run test:e2e`: builds the extension and runs Playwright against sanitised LinkedIn fixtures (see [docs/fixtures.md](docs/fixtures.md))

Releases and store publishing are covered in [docs/publishing.md](docs/publishing.md).
