import type { EngagementType, IR35Status } from '../settings/settings';
import { UNKNOWN, type FactExtractor, type OpportunityFacts, type Unknown } from './facts';

/**
 * Keyword and pattern extraction tuned to UK contracting vocabulary.
 * Each rule removes the text it matched, so a phrase like "fixed-term contract"
 * isn't counted again as "contract". Conflicting signals give Unknown.
 */
export const heuristicExtractor: FactExtractor = {
  extract(recruiterMessages) {
    const text = normalise(recruiterMessages.join('\n'));
    const ir35Status = ir35From(text);
    return {
      engagementType: engagementTypeFrom(text, ir35Status !== UNKNOWN),
      ir35Status,
    } satisfies OpportunityFacts;
  },
};

function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/[‐-―]/g, '-').replace(/\s+/g, ' ')} `;
}

interface Rule<T> {
  value: T;
  pattern: RegExp;
}

/** Applies rules in order, removing each match; returns every value that matched. */
function matchAll<T>(text: string, rules: Rule<T>[]): { found: Set<T>; rest: string } {
  const found = new Set<T>();
  let rest = text;
  for (const { value, pattern } of rules) {
    const global = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    if (global.test(rest)) {
      found.add(value);
      rest = rest.replace(global, ' ');
    }
  }
  return { found, rest };
}

function single<T>(found: Set<T>): T | Unknown {
  return found.size === 1 ? [...found][0]! : UNKNOWN;
}

const ENGAGEMENT_RULES: Rule<EngagementType>[] = [
  // Phrases containing another type's keyword go first, with any duration ("12 month FTC").
  {
    value: 'Fixed-Term',
    pattern: /\b(\d{1,2}[- ]?(month|mth)s?\s+)?(fixed[- ]term( contract)?|ftc|(maternity|paternity|parental leave) cover)\b/,
  },
  { value: 'Permanent', pattern: /\bpermanent (contract|role|position|opportunity|job|basis|hire|headcount)\b/ },
  { value: 'Permanent', pattern: /\bperm\b/ },
  { value: 'Permanent', pattern: /\bpermanent\b(?!ly)/ },
  { value: 'Permanent', pattern: /\bsalary\b|\bsalaried\b|\bper annum\b|\bbenefits package\b|\bpension\b/ },
  { value: 'Permanent', pattern: /£\s?\d{2,3}k\b|\b\d{2,3}k \+ (bonus|benefits)\b/ },
  { value: 'Contract', pattern: /\bcontract(s|or|ors|ing)?\b/ },
  { value: 'Contract', pattern: /\bday rate\b|\bper day\b|\bp\/d\b|\bfreelance\b/ },
  { value: 'Contract', pattern: /\b\d{1,2}[- ]?(month|mth)s?( initial)?\b|\binitial \d{1,2}\b/ },
];

function engagementTypeFrom(text: string, ir35Stated: boolean): EngagementType | Unknown {
  const { found } = matchAll(text, ENGAGEMENT_RULES);
  // An IR35 determination only exists for contracts.
  if (!found.size && ir35Stated) return 'Contract';
  return single(found);
}

const IR35_STATEMENT_RULES: Rule<IR35Status>[] = [
  // Negations go first, so "not inside IR35" isn't then read as "inside IR35".
  { value: 'Outside', pattern: /\bnot (inside|within|caught by)( of)? ir35\b/ },
  { value: 'Inside', pattern: /\bnot outside( of)? ir35\b/ },
  { value: 'Outside', pattern: /\boutside( of| the scope of)? ir35\b|\bir35[: -]+outside\b|\bout of scope (of|for) ir35\b/ },
  { value: 'Inside', pattern: /\b(inside|within|caught by)( of)? ir35\b|\bir35[: -]+inside\b/ },
];

/** Hints only count when there's no explicit IR35 statement. */
const IR35_HINT_RULES: Rule<IR35Status>[] = [
  { value: 'Inside', pattern: /\bumbrella\b|\bpaye\b|\bdeemed\b/ },
  { value: 'Outside', pattern: /\b(your|own) (ltd|limited company)\b|\bvia (a |your )?(ltd|limited company)\b/ },
];

function ir35From(text: string): IR35Status | Unknown {
  const statements = matchAll(text, IR35_STATEMENT_RULES).found;
  if (statements.size) return single(statements);
  return single(matchAll(text, IR35_HINT_RULES).found);
}
