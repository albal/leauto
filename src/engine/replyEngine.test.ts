import { describe, expect, it } from 'vitest';
import { EMPTY_SETTINGS, type Settings } from '../settings/settings';
import { replyTo } from './replyEngine';
import type { ThreadSnapshot } from './types';

const settings: Settings = { ...EMPTY_SETTINGS, setupComplete: true, signOff: 'Sam Taylor' };

function thread(recruiterName: string | null, ...recruiterMessages: string[]): ThreadSnapshot {
  return { recruiterName, messages: recruiterMessages.map((text) => ({ text, fromRecruiter: true })) };
}

describe('replyTo', () => {
  it('writes no Draft until the Candidate has finished setup', () => {
    const outcome = replyTo(thread('Jordan Smith', 'Hello!'), { ...settings, setupComplete: false });

    expect(outcome).toEqual({ type: 'notice', notice: 'not-set-up' });
  });

  it('asks for the Engagement Type in a Clarification', () => {
    const outcome = replyTo(thread('Jordan Smith', 'I have a great Cloud Architect opportunity.'), settings);

    expect(outcome).toMatchObject({ type: 'draft', kind: 'clarification' });
    expect(outcome.type === 'draft' && outcome.text).toContain('permanent, fixed-term or contract');
  });

  it("greets the recruiter by first name and ends with the Candidate's sign-off", () => {
    const outcome = replyTo(thread('Jordan Smith', 'Hello!'), settings);

    expect(outcome.type === 'draft' && outcome.text).toMatch(/^Hi Jordan,\n/);
    expect(outcome.type === 'draft' && outcome.text).toMatch(/Best regards,\nSam Taylor$/);
  });

  it('greets with "Hi there," when the recruiter name is absent', () => {
    const outcome = replyTo(thread(null, 'Hello!'), settings);

    expect(outcome.type === 'draft' && outcome.text).toMatch(/^Hi there,\n/);
  });
});
