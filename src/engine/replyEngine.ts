import type { Settings } from '../settings/settings';
import type { Outcome, ThreadSnapshot } from './types';

/**
 * Decides which Draft (or notice) a Thread calls for and writes it.
 * Pure: no DOM, no browser APIs.
 */
export function replyTo(thread: ThreadSnapshot, settings: Settings): Outcome {
  const questions = ['Is this opportunity permanent, fixed-term or contract?'];
  return {
    type: 'draft',
    kind: 'clarification',
    text: compose(thread, settings, [
      'Thanks for reaching out. Before discussing next steps, could you please clarify:',
      questions.map((q, i) => `${i + 1}. ${q}`).join('\n'),
      'Once confirmed, I can let you know if this aligns with my current availability.',
    ]),
  };
}

function compose(thread: ThreadSnapshot, settings: Settings, paragraphs: string[]): string {
  return [greeting(thread.recruiterName), ...paragraphs, signOff(settings.signOff)].join('\n\n');
}

function greeting(recruiterName: string | null): string {
  const firstName = recruiterName?.trim().split(/\s+/)[0];
  return firstName ? `Hi ${firstName},` : 'Hi there,';
}

function signOff(name: string): string {
  return name.trim() ? `Best regards,\n${name.trim()}` : 'Best regards';
}
