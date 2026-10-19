import { describe, expect, it } from 'vitest';
import { EMPTY_SETTINGS, type Settings } from '../settings/settings';
import { replyTo } from './replyEngine';
import type { Outcome, ThreadSnapshot } from './types';

/** An Outside IR35, contract-only Candidate. */
const contractor: Settings = {
  ...EMPTY_SETTINGS,
  setupComplete: true,
  engagementTypes: ['Contract'],
  ir35: { enabled: true, accepted: ['Outside'] },
  workingPatterns: ['Remote', 'Hybrid', 'On-site'],
  signOff: 'Sam Taylor',
};

function thread(...recruiterMessages: string[]): ThreadSnapshot {
  return {
    recruiterName: 'Jordan Smith',
    messages: recruiterMessages.map((text) => ({ text, fromRecruiter: true })),
  };
}

function draft(outcome: Outcome) {
  if (outcome.type !== 'draft') throw new Error(`Expected a Draft, got the ${outcome.notice} notice`);
  return outcome;
}

describe('setup', () => {
  it('writes no Draft until the Candidate has finished setup', () => {
    const outcome = replyTo(thread('A contract role, Outside IR35.'), { ...contractor, setupComplete: false });

    expect(outcome).toEqual({ type: 'notice', notice: 'not-set-up' });
  });
});

describe('greeting and sign-off', () => {
  it("greets the recruiter by first name and ends with the Candidate's sign-off", () => {
    const { text } = draft(replyTo(thread('A Cloud Architect opportunity.'), contractor));

    expect(text).toMatch(/^Hi Jordan,\n/);
    expect(text).toMatch(/Best regards,\nSam Taylor$/);
  });

  it('greets with "Hi there," when the recruiter name is absent', () => {
    const { text } = draft(replyTo({ ...thread('Hello!'), recruiterName: null }, contractor));

    expect(text).toMatch(/^Hi there,\n/);
  });
});

describe('Engagement Type', () => {
  it.each([
    ['a permanent role', 'We have a permanent Cloud Architect position, Outside IR35.'],
    ['a permanent role', 'Salary up to £90k plus a great benefits package.'],
    ['a permanent role', 'Looking for a perm hire, £85k + bonus.'],
    ['a fixed-term role', 'A 12 month FTC with a fintech client.'],
    ['a fixed-term role', 'This is a fixed-term contract covering maternity leave.'],
    ['a fixed-term role', 'Maternity cover for a platform lead.'],
  ])('declines %s when only Contract is accepted', (described, message) => {
    const outcome = draft(replyTo(thread(message), contractor));

    expect(outcome.kind).toBe('decline');
    expect(outcome.text).toContain(`- it's ${described}`);
  });

  it.each([
    'A 6 month contract, Outside IR35.',
    'Initial 3 months, £650 per day, outside IR35.',
    'Freelance role, outside of IR35.',
  ])('recognises a Contract: %s', (message) => {
    expect(draft(replyTo(thread(message), contractor)).kind).toBe('interest');
  });

  it('treats an Outside IR35 statement alone as a Contract', () => {
    expect(draft(replyTo(thread('This one is Outside IR35, fully remote.'), contractor)).kind).toBe('interest');
  });

  it('asks for the Engagement Type when it is Unknown', () => {
    const outcome = draft(replyTo(thread('A Senior Cloud Architect opportunity with AWS.'), contractor));

    expect(outcome.kind).toBe('clarification');
    expect(outcome.text).toContain('1. Is this opportunity permanent, fixed-term or contract?');
  });

  it('treats conflicting Engagement Type signals as Unknown', () => {
    const outcome = draft(replyTo(thread('Open to contract or permanent candidates.'), contractor));

    expect(outcome.kind).toBe('clarification');
    expect(outcome.text).toContain('permanent, fixed-term or contract?');
  });

  it('does not ask for the Engagement Type when every type is accepted', () => {
    const flexible: Settings = { ...contractor, engagementTypes: ['Permanent', 'Fixed-Term', 'Contract'] };
    const outcome = draft(replyTo(thread('A Senior Cloud Architect opportunity.'), flexible));

    expect(outcome.text).not.toContain('permanent, fixed-term or contract?');
  });
});

describe('IR35 Status', () => {
  it.each([
    'A 6 month contract, inside IR35.',
    'Contract role, IR35: inside.',
    'Contract role paid via umbrella.',
    'A contract that falls within IR35.',
    'This contract is caught by IR35.',
    'The contract is not outside IR35.',
  ])('declines an Inside IR35 Contract: %s', (message) => {
    const outcome = draft(replyTo(thread(message), contractor));

    expect(outcome.kind).toBe('decline');
    expect(outcome.text).toContain("- it's Inside IR35");
  });

  it.each([
    'A 6 month contract, not inside IR35.',
    'Contract role, IR35 - outside.',
    'Contract, out of scope of IR35.',
    'Contract via your own Ltd company.',
  ])('accepts an Outside IR35 Contract: %s', (message) => {
    expect(draft(replyTo(thread(message), contractor)).kind).toBe('interest');
  });

  it('lets an explicit IR35 statement win over hints', () => {
    const message = 'Contract role, outside IR35. Umbrella options are available if you prefer.';

    expect(draft(replyTo(thread(message), contractor)).kind).toBe('interest');
  });

  it('treats conflicting IR35 statements as Unknown and asks', () => {
    const outcome = draft(replyTo(thread('Contract role. Could be inside IR35 or outside IR35.'), contractor));

    expect(outcome.kind).toBe('clarification');
    expect(outcome.text).toContain('What is the IR35 determination (Inside or Outside)?');
  });

  it('asks for the IR35 Status of a Contract when it is Unknown', () => {
    const outcome = draft(replyTo(thread('A 6 month contract with a bank.'), contractor));

    expect(outcome.kind).toBe('clarification');
    expect(outcome.text).toContain('1. What is the IR35 determination (Inside or Outside)?');
    expect(outcome.text).not.toContain('permanent, fixed-term or contract?');
  });

  it('asks for both facts, conditionally, when the Engagement Type is Unknown too', () => {
    const flexible: Settings = { ...contractor, engagementTypes: ['Contract', 'Permanent'] };
    const outcome = draft(replyTo(thread('An exciting Cloud Architect opportunity.'), flexible));

    expect(outcome.text).toContain('1. Is this opportunity permanent, fixed-term or contract?');
    expect(outcome.text).toContain('2. If it is a contract, what is the IR35 determination (Inside or Outside)?');
  });

  it('ignores IR35 when the rule is off', () => {
    const noIr35: Settings = { ...contractor, ir35: { enabled: false, accepted: [] } };

    expect(draft(replyTo(thread('A 6 month contract, inside IR35.'), noIr35)).kind).toBe('interest');
    expect(draft(replyTo(thread('A 6 month contract.'), noIr35)).kind).toBe('interest');
  });

  it('ignores IR35 when both statuses are accepted', () => {
    const either: Settings = { ...contractor, ir35: { enabled: true, accepted: ['Outside', 'Inside'] } };

    expect(draft(replyTo(thread('A 6 month contract.'), either)).kind).toBe('interest');
  });

  it('ignores IR35 for a Permanent Opportunity', () => {
    const permToo: Settings = { ...contractor, engagementTypes: ['Contract', 'Permanent'] };

    expect(draft(replyTo(thread('A permanent role, salary £90k.'), permToo)).kind).toBe('interest');
  });
});

describe('Working Pattern', () => {
  const remoteOnly: Settings = { ...contractor, workingPatterns: ['Remote'] };
  const hybridOk: Settings = {
    ...contractor,
    workingPatterns: ['Remote', 'Hybrid'],
    hybrid: { maxOfficeDaysPerWeek: 2, cities: ['London', 'Leeds'] },
  };
  const outsideContract = 'A 6 month contract, Outside IR35.';

  it.each([
    'Fully remote.',
    '100% remote, UK based.',
    'Remote-first team.',
    'You can work from home.',
    'The role is remote.',
  ])('accepts a Remote Opportunity: %s', (message) => {
    expect(draft(replyTo(thread(`${outsideContract} ${message}`), remoteOnly)).kind).toBe('interest');
  });

  it.each([
    ['a hybrid role', 'Hybrid working.'],
    ['a hybrid role', '2 days a week in the office.'],
    ['a hybrid role', 'Onsite 2 days per week.'],
    ['a hybrid role', 'Remote with occasional travel to the office.'],
    ['a hybrid role', 'Mostly remote with quarterly onsite meetups.'],
    ['a hybrid role', 'Two anchor days in the London office.'],
    ['an on-site role', 'Office-based.'],
    ['an on-site role', '5 days a week in the office.'],
    ['an on-site role', 'This is fully on-site.'],
  ])('declines %s when only Remote is accepted: %s', (described, message) => {
    const outcome = draft(replyTo(thread(`${outsideContract} ${message}`), remoteOnly));

    expect(outcome.kind).toBe('decline');
    expect(outcome.text).toContain(`- it's ${described}`);
  });

  it('asks for the Working Pattern when it is Unknown', () => {
    const outcome = draft(replyTo(thread(outsideContract), remoteOnly));

    expect(outcome.kind).toBe('clarification');
    expect(outcome.text).toContain('1. Is the role fully remote, hybrid or on-site?');
  });

  it('treats conflicting Working Pattern signals as Unknown', () => {
    const outcome = draft(replyTo(thread(`${outsideContract} Fully remote, but 3 days a week in the office.`), remoteOnly));

    expect(outcome.kind).toBe('clarification');
  });

  it('does not ask for the Working Pattern when every pattern is accepted', () => {
    expect(draft(replyTo(thread(outsideContract), contractor)).kind).toBe('interest');
  });

  it('accepts Hybrid within the office-day limit and commuting cities', () => {
    const message = `${outsideContract} Hybrid, 2 days a week in London.`;

    expect(draft(replyTo(thread(message), hybridOk)).kind).toBe('interest');
  });

  it('matches commuting cities as case-insensitive substrings', () => {
    const message = `${outsideContract} Hybrid, two days per week at our City of London office.`;

    expect(draft(replyTo(thread(message), hybridOk)).kind).toBe('interest');
  });

  it('declines Hybrid with more office days than the maximum', () => {
    const outcome = draft(replyTo(thread(`${outsideContract} 3 days a week in the office, based in London.`), hybridOk));

    expect(outcome.kind).toBe('decline');
    expect(outcome.text).toContain('- it needs 3 office days a week');
  });

  it('declines an office outside the commuting cities', () => {
    const outcome = draft(replyTo(thread(`${outsideContract} Hybrid, 1 day a week in Manchester.`), hybridOk));

    expect(outcome.kind).toBe('decline');
    expect(outcome.text).toContain('- the office is in Manchester');
  });

  it.each([
    ['Hybrid, based in London.', 'How many days a week would be spent in the office?'],
    ['Hybrid, 2 days a month in London.', 'How many days a week would be spent in the office?'],
    ['Hybrid, 2 days in the office.', 'How many days a week would be spent in the office?'],
    ['Hybrid, 2 days a week.', 'Where is the office located?'],
  ])('asks about Unknown Hybrid details: %s', (detail, question) => {
    const outcome = draft(replyTo(thread(`${outsideContract} ${detail}`), hybridOk));

    expect(outcome.kind).toBe('clarification');
    expect(outcome.text).toContain(question);
  });

  it('does not ask about office days or location when the Candidate set no limits', () => {
    const noLimits: Settings = { ...contractor, workingPatterns: ['Hybrid'] };

    expect(draft(replyTo(thread(`${outsideContract} Hybrid working.`), noLimits)).kind).toBe('interest');
  });

  it('states Working Pattern limits in the Decline criteria', () => {
    const outcome = draft(replyTo(thread(`${outsideContract} Office-based.`), hybridOk));

    expect(outcome.text).toContain(
      "I'm currently only considering Outside IR35 contract roles that are remote or hybrid (up to 2 office days a week in London or Leeds).",
    );
  });
});

describe('Decline', () => {
  it('cites Working Pattern Mismatches together with IR35 Mismatches', () => {
    const remoteOnly: Settings = { ...contractor, workingPatterns: ['Remote'] };
    const outcome = draft(replyTo(thread('A 6 month contract, inside IR35, hybrid in Leeds.'), remoteOnly));

    expect(outcome.text).toContain("- it's Inside IR35\n- it's a hybrid role");
  });

  it('cites every Mismatch, states the criteria, and asks no questions', () => {
    const settings: Settings = { ...contractor, engagementTypes: ['Contract'] };
    const outcome = draft(replyTo(thread('Contract or FTC. Inside IR35.'), settings));

    expect(outcome.kind).toBe('decline');
    expect(outcome.text).toContain("I'm currently only considering Outside IR35 contract roles.");
    expect(outcome.text).not.toMatch(/\?/);
  });

  it('attaches the IR35 criterion to contract roles only', () => {
    const permToo: Settings = { ...contractor, engagementTypes: ['Contract', 'Permanent'] };
    const outcome = draft(replyTo(thread('A 6 month contract, inside IR35.'), permToo));

    expect(outcome.text).toContain("I'm currently only considering Outside IR35 contract or permanent roles.");
  });

  it('declines on IR35 even when the Engagement Type is Unknown', () => {
    const outcome = draft(replyTo(thread('Great opportunity, inside IR35 via umbrella.'), contractor));

    expect(outcome.kind).toBe('decline');
    expect(outcome.text).toContain("- it's Inside IR35");
  });
});

describe('Expression of Interest', () => {
  it('asks for the full specification or a call when everything fits', () => {
    const outcome = draft(replyTo(thread('A 6 month contract, Outside IR35.'), contractor));

    expect(outcome.kind).toBe('interest');
    expect(outcome.text).toContain('full job specification');
  });
});

describe('Thread', () => {
  it("ignores the Candidate's own messages when gathering facts", () => {
    const snapshot: ThreadSnapshot = {
      recruiterName: 'Jordan Smith',
      messages: [
        { text: 'I only do contract work, Outside IR35.', fromRecruiter: false },
        { text: 'A Senior Cloud Architect opportunity.', fromRecruiter: true },
      ],
    };

    expect(draft(replyTo(snapshot, contractor)).kind).toBe('clarification');
  });
});
