// Fails if a committed LinkedIn fixture looks like it still contains real data.
// See docs/fixtures.md for the sanitisation checklist.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const FIXTURES = path.resolve('tests/fixtures');

const RULES = [
  { name: 'LinkedIn media CDN URL', pattern: /media\.licdn\.com/gi },
  // Real URNs carry opaque IDs; sanitised fixtures use IDs starting FAKE.
  { name: 'real-looking URN', pattern: /urn:li:[a-z_]+:(?!FAKE)[A-Za-z0-9_-]{4,}/g },
  { name: 'real-looking profile URL', pattern: /linkedin\.com\/in\/(?!fake-)[A-Za-z0-9_-]+/gi },
];

const problems = [];
for (const file of (await readdir(FIXTURES)).filter((f) => f.endsWith('.html'))) {
  const text = await readFile(path.join(FIXTURES, file), 'utf8');
  for (const { name, pattern } of RULES) {
    for (const match of text.matchAll(pattern)) problems.push(`${file}: ${name}: ${match[0]}`);
  }
}

if (problems.length) {
  console.error(`Unsanitised fixture data found:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('Fixtures look sanitised.');
