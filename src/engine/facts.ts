import type { EngagementType, IR35Status } from '../settings/settings';

export const UNKNOWN = 'Unknown';
export type Unknown = typeof UNKNOWN;

/** What the recruiter's messages say about the Opportunity. */
export interface OpportunityFacts {
  engagementType: EngagementType | Unknown;
  ir35Status: IR35Status | Unknown;
}

/** Turns a Thread's messages into Opportunity facts. Uncertainty must come back as Unknown. */
export interface FactExtractor {
  /** `recruiterMessages` are every message the recruiter sent in the Thread, oldest first. */
  extract(recruiterMessages: string[]): OpportunityFacts;
}
