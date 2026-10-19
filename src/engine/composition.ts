import type { Currency, EngagementType, Settings, WorkingPattern } from '../settings/settings';
import type { Mismatch, Question } from './evaluation';
import type { DraftKind } from './types';

const TEMPLATES: Record<DraftKind | 'rateQuote', string> = {
  decline: `Hi {recruiterFirstName},

Thanks for reaching out with this opportunity. {criteria} Unfortunately this one isn't a fit:
{mismatches}

If anything matching comes up in the future, please feel free to share it.

Best regards,
{signOff}`,
  clarification: `Hi {recruiterFirstName},

Thanks for reaching out. Before discussing next steps, could you please clarify a few details:
{questions}

{rateQuote}

Once confirmed, I can let you know if this aligns with my current availability.

Best regards,
{signOff}`,
  interest: `Hi {recruiterFirstName},

Thanks for reaching out. This sounds like a good fit for what I'm looking for.

{rateQuote}

Could you send over the full job specification, or suggest a time for a call?

Best regards,
{signOff}`,
  rateQuote: `In answer to your question about rates: my day rate is {preferredRate}.`,
};

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  Permanent: 'permanent',
  'Fixed-Term': 'fixed-term',
  Contract: 'contract',
};

const PATTERN_LABELS: Record<WorkingPattern, string> = {
  Remote: 'fully remote',
  Hybrid: 'hybrid',
  'On-site': 'on-site',
};

export interface DraftParts {
  recruiterName: string | null;
  mismatches: Mismatch[];
  questions: Question[];
  quoteRate: boolean;
}

export function compose(kind: DraftKind, parts: DraftParts, settings: Settings): string {
  const { currency, preferredDayRate } = settings.rates;
  const values: Record<string, string> = {
    preferredRate: preferredDayRate === null ? '' : dayRate(preferredDayRate, currency),
    recruiterFirstName: parts.recruiterName?.trim().split(/\s+/)[0] || 'there',
    criteria: criteriaSentence(settings),
    mismatches: parts.mismatches.map((m) => `- ${describeMismatch(m, settings)}`).join('\n'),
    questions: parts.questions.map((q, i) => `${i + 1}. ${ask(q, settings)}`).join('\n'),
    signOff: settings.signOff.trim(),
  };
  // A Decline never quotes a rate.
  values.rateQuote = parts.quoteRate && kind !== 'decline' ? fill(TEMPLATES.rateQuote, values) : '';
  return fill(TEMPLATES[kind], values).replace(/\n{3,}/g, '\n\n').trim();
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => values[name] ?? placeholder);
}

function dayRate(amount: number, currency: Currency): string {
  const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 });
  return `${money.format(amount)}/day`;
}

function list(items: string[], conjunction: 'and' | 'or'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items.at(-1)}`;
}

/** "I'm currently only considering Outside IR35 contract roles that are fully remote." */
function criteriaSentence(settings: Settings): string {
  const ir35 =
    settings.ir35.enabled && settings.ir35.accepted.length === 1 ? `${settings.ir35.accepted[0]} IR35 ` : '';
  const types = settings.engagementTypes.map((t) =>
    t === 'Contract' ? `${ir35}${ENGAGEMENT_LABELS[t]}` : ENGAGEMENT_LABELS[t],
  );
  const pattern = patternCriterion(settings);
  return `I'm currently only considering ${list(types, 'or')} roles${pattern ? ` that are ${pattern}` : ''}.`;
}

/** "remote or hybrid (up to 2 office days a week in London or Leeds)", or '' when anything goes. */
function patternCriterion(settings: Settings): string {
  const { workingPatterns } = settings;
  const { maxOfficeDaysPerWeek: maxDays, cities } = settings.hybrid;
  const limits: string[] = [];
  if (workingPatterns.includes('Hybrid') && maxDays !== null) {
    limits.push(`up to ${maxDays} office ${maxDays === 1 ? 'day' : 'days'} a week`);
  }
  if (workingPatterns.some((p) => p !== 'Remote') && cities.length) limits.push(`in ${list(cities, 'or')}`);
  if (workingPatterns.length === 3 && !limits.length) return '';
  const labels = workingPatterns.map((p) => (p === 'Remote' && workingPatterns.length > 1 ? 'remote' : PATTERN_LABELS[p]));
  return `${list(labels, 'or')}${limits.length ? ` (${limits.join(' ')})` : ''}`;
}

function describeMismatch(mismatch: Mismatch, settings: Settings): string {
  switch (mismatch.fact) {
    case 'engagementType':
      return `it's a ${ENGAGEMENT_LABELS[mismatch.value]} role`;
    case 'ir35Status':
      return `it's ${mismatch.value} IR35`;
    case 'workingPattern':
      return mismatch.value === 'Remote' ? "it's a fully remote role" : `it's ${mismatch.value === 'Hybrid' ? 'a hybrid' : 'an on-site'} role`;
    case 'officeDays':
      return `it needs ${mismatch.value} office ${mismatch.value === 1 ? 'day' : 'days'} a week`;
    case 'location':
      return `the office is in ${mismatch.value}`;
    case 'rate':
      return `the rate (${dayRate(mismatch.dayRate, settings.rates.currency)}) is below what I'm looking for`;
  }
}

function ask(question: Question, settings: Settings): string {
  switch (question.fact) {
    case 'engagementType':
      return 'Is this opportunity permanent, fixed-term or contract?';
    case 'ir35Status':
      return question.contractConfirmed || settings.engagementTypes.length === 1
        ? 'What is the IR35 determination (Inside or Outside)?'
        : 'If it is a contract, what is the IR35 determination (Inside or Outside)?';
    case 'workingPattern':
      return 'Is the role fully remote, hybrid or on-site?';
    case 'officeDays':
      return 'How many days a week would be spent in the office?';
    case 'location':
      return 'Where is the office located?';
    case 'rate':
      return 'What is the day rate budget?';
    case 'details':
      return 'Could you share more details about the role?';
  }
}
