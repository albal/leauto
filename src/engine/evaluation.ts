import { ENGAGEMENT_TYPES, IR35_STATUSES, type EngagementType, type IR35Status, type Settings } from '../settings/settings';
import { UNKNOWN, type OpportunityFacts } from './facts';

export type Mismatch =
  | { fact: 'engagementType'; value: EngagementType }
  | { fact: 'ir35Status'; value: IR35Status };

/** An Unknown fact that one of the Candidate's active rules depends on. */
export type Question = { fact: 'engagementType' } | { fact: 'ir35Status'; contractConfirmed: boolean };

export interface Evaluation {
  mismatches: Mismatch[];
  questions: Question[];
}

const acceptsEvery = <T>(accepted: readonly T[], all: readonly T[]) => all.every((v) => accepted.includes(v));

export function evaluate(facts: OpportunityFacts, settings: Settings): Evaluation {
  const mismatches: Mismatch[] = [];
  const questions: Question[] = [];
  const { engagementType, ir35Status } = facts;

  if (engagementType === UNKNOWN) {
    if (!acceptsEvery(settings.engagementTypes, ENGAGEMENT_TYPES)) questions.push({ fact: 'engagementType' });
  } else if (!settings.engagementTypes.includes(engagementType)) {
    mismatches.push({ fact: 'engagementType', value: engagementType });
  }

  const ir35Applies =
    settings.ir35.enabled &&
    settings.engagementTypes.includes('Contract') &&
    !acceptsEvery(settings.ir35.accepted, IR35_STATUSES) &&
    (engagementType === 'Contract' || engagementType === UNKNOWN);
  if (ir35Applies) {
    if (ir35Status === UNKNOWN) {
      questions.push({ fact: 'ir35Status', contractConfirmed: engagementType === 'Contract' });
    } else if (!settings.ir35.accepted.includes(ir35Status)) {
      mismatches.push({ fact: 'ir35Status', value: ir35Status });
    }
  }

  return { mismatches, questions };
}
