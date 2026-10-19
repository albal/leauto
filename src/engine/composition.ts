import type { EngagementType, Settings } from '../settings/settings';
import type { Mismatch, Question } from './evaluation';
import type { DraftKind } from './types';

const TEMPLATES: Record<DraftKind, string> = {
  decline: `Hi {recruiterFirstName},

Thanks for reaching out with this opportunity. {criteria} Unfortunately this one isn't a fit:
{mismatches}

If anything matching comes up in the future, please feel free to share it.

Best regards,
{signOff}`,
  clarification: `Hi {recruiterFirstName},

Thanks for reaching out. Before discussing next steps, could you please clarify a few details:
{questions}

Once confirmed, I can let you know if this aligns with my current availability.

Best regards,
{signOff}`,
  interest: `Hi {recruiterFirstName},

Thanks for reaching out. This sounds like a good fit for what I'm looking for.

Could you send over the full job specification, or suggest a time for a call?

Best regards,
{signOff}`,
};

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  Permanent: 'permanent',
  'Fixed-Term': 'fixed-term',
  Contract: 'contract',
};

export interface DraftParts {
  recruiterName: string | null;
  mismatches: Mismatch[];
  questions: Question[];
}

export function compose(kind: DraftKind, parts: DraftParts, settings: Settings): string {
  const values: Record<string, string> = {
    recruiterFirstName: parts.recruiterName?.trim().split(/\s+/)[0] || 'there',
    criteria: criteriaSentence(settings),
    mismatches: parts.mismatches.map((m) => `- ${describeMismatch(m)}`).join('\n'),
    questions: parts.questions.map((q, i) => `${i + 1}. ${ask(q, settings)}`).join('\n'),
    signOff: settings.signOff.trim(),
  };
  return TEMPLATES[kind]
    .replace(/\{(\w+)\}/g, (placeholder, name: string) => values[name] ?? placeholder)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function list(items: string[], conjunction: 'and' | 'or'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items.at(-1)}`;
}

/** "I'm currently only considering Outside IR35 contract or permanent roles." */
function criteriaSentence(settings: Settings): string {
  const ir35 =
    settings.ir35.enabled && settings.ir35.accepted.length === 1 ? `${settings.ir35.accepted[0]} IR35 ` : '';
  const types = settings.engagementTypes.map((t) =>
    t === 'Contract' ? `${ir35}${ENGAGEMENT_LABELS[t]}` : ENGAGEMENT_LABELS[t],
  );
  return `I'm currently only considering ${list(types, 'or')} roles.`;
}

function describeMismatch(mismatch: Mismatch): string {
  switch (mismatch.fact) {
    case 'engagementType':
      return `it's a ${ENGAGEMENT_LABELS[mismatch.value]} role`;
    case 'ir35Status':
      return `it's ${mismatch.value} IR35`;
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
  }
}
