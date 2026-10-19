import type { Currency, EngagementType, IR35Status, WorkingPattern } from '../settings/settings';

export const UNKNOWN = 'Unknown';
export type Unknown = typeof UNKNOWN;

/** What the recruiter's messages say about the Opportunity. */
export interface OpportunityFacts {
  engagementType: EngagementType | Unknown;
  ir35Status: IR35Status | Unknown;
  workingPattern: WorkingPatternFacts | Unknown;
  rate: StatedRate | Unknown;
  /** Whether the Unanswered Messages ask for the Candidate's rate. */
  askedForRate: boolean;
  /** Whether anything in the Thread suggests a job pitch at all. */
  hasJobSignals: boolean;
}

/** A rate the recruiter stated; for a range, its top figure. */
export interface StatedRate {
  amount: number;
  per: 'day' | 'hour';
  /** Null when the recruiter gave no currency. */
  currency: Currency | null;
}

export interface WorkingPatternFacts {
  pattern: WorkingPattern;
  /** Office days per week, for Hybrid. */
  officeDaysPerWeek: number | Unknown;
  /** Where the office is, as the recruiter wrote it. */
  location: string | Unknown;
}

/** Turns a Thread's messages into Opportunity facts. Uncertainty must come back as Unknown. */
export interface FactExtractor {
  /**
   * `recruiterMessages` are every message the recruiter sent in the Thread, oldest first;
   * `unansweredMessages` are those sent after the Candidate's most recent reply.
   */
  extract(recruiterMessages: string[], unansweredMessages: string[]): OpportunityFacts;
}
