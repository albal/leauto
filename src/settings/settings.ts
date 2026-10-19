export type EngagementType = 'Permanent' | 'Fixed-Term' | 'Contract';
export type IR35Status = 'Outside' | 'Inside';
export type WorkingPattern = 'Remote' | 'Hybrid' | 'On-site';
export type Currency = 'GBP' | 'USD' | 'EUR';
export type Tone = 'direct' | 'warm' | 'brief';
export type TemplateName = 'decline' | 'clarification' | 'interest' | 'rateQuote';

export const ENGAGEMENT_TYPES: readonly EngagementType[] = ['Permanent', 'Fixed-Term', 'Contract'];
export const IR35_STATUSES: readonly IR35Status[] = ['Outside', 'Inside'];
export const WORKING_PATTERNS: readonly WorkingPattern[] = ['Remote', 'Hybrid', 'On-site'];

/** The Candidate's criteria and drafting preferences. */
export interface Settings {
  /** False until the Candidate saves the options page; no Draft is written before then. */
  setupComplete: boolean;
  engagementTypes: EngagementType[];
  ir35: {
    enabled: boolean;
    accepted: IR35Status[];
  };
  workingPatterns: WorkingPattern[];
  hybrid: {
    maxOfficeDaysPerWeek: number | null;
    cities: string[];
  };
  rates: {
    currency: Currency;
    preferredDayRate: number | null;
    minimumDayRate: number | null;
    hoursPerDay: number;
  };
  signOff: string;
  tone: Tone;
  templates: Partial<Record<TemplateName, string>>;
}

/** Settings before setup: nothing is accepted, so the Candidate must choose every criterion. */
export const EMPTY_SETTINGS: Settings = {
  setupComplete: false,
  engagementTypes: [],
  ir35: { enabled: false, accepted: [] },
  workingPatterns: [],
  hybrid: { maxOfficeDaysPerWeek: null, cities: [] },
  rates: { currency: 'GBP', preferredDayRate: null, minimumDayRate: null, hoursPerDay: 7.5 },
  signOff: '',
  tone: 'warm',
  templates: {},
};
