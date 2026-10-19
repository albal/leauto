import {
  ENGAGEMENT_TYPES,
  IR35_STATUSES,
  WORKING_PATTERNS,
  type EngagementType,
  type IR35Status,
  type Settings,
  type WorkingPattern,
} from '../settings/settings';
import { UNKNOWN, type OpportunityFacts } from './facts';

export type Mismatch =
  | { fact: 'engagementType'; value: EngagementType }
  | { fact: 'ir35Status'; value: IR35Status }
  | { fact: 'workingPattern'; value: WorkingPattern }
  | { fact: 'officeDays'; value: number }
  | { fact: 'location'; value: string };

/** An Unknown fact that one of the Candidate's active rules depends on. */
export type Question =
  | { fact: 'engagementType' }
  | { fact: 'ir35Status'; contractConfirmed: boolean }
  | { fact: 'workingPattern' }
  | { fact: 'officeDays' }
  | { fact: 'location' };

export interface Evaluation {
  mismatches: Mismatch[];
  questions: Question[];
}

const acceptsEvery = <T>(accepted: readonly T[], all: readonly T[]) => all.every((v) => accepted.includes(v));

export function evaluate(facts: OpportunityFacts, settings: Settings): Evaluation {
  const mismatches: Mismatch[] = [];
  const questions: Question[] = [];
  const { engagementType, ir35Status, workingPattern } = facts;

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

  if (workingPattern === UNKNOWN) {
    if (!acceptsEvery(settings.workingPatterns, WORKING_PATTERNS)) questions.push({ fact: 'workingPattern' });
  } else if (!settings.workingPatterns.includes(workingPattern.pattern)) {
    mismatches.push({ fact: 'workingPattern', value: workingPattern.pattern });
  } else if (workingPattern.pattern !== 'Remote') {
    const maxDays = settings.hybrid.maxOfficeDaysPerWeek;
    const { officeDaysPerWeek: days, location } = workingPattern;
    if (workingPattern.pattern === 'Hybrid' && maxDays !== null) {
      if (days === UNKNOWN) questions.push({ fact: 'officeDays' });
      else if (days > maxDays) mismatches.push({ fact: 'officeDays', value: days });
    }
    // The commuting cities apply wherever the Candidate would travel to an office.
    if (settings.hybrid.cities.length) {
      if (location === UNKNOWN) questions.push({ fact: 'location' });
      else if (!withinCommute(location, settings.hybrid.cities)) mismatches.push({ fact: 'location', value: location });
    }
  }

  return { mismatches, questions };
}

function withinCommute(location: string, cities: string[]): boolean {
  const place = location.toLowerCase();
  return cities.some((city) => place.includes(city.toLowerCase()) || city.toLowerCase().includes(place));
}
