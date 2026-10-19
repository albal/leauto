import type { Settings } from '../settings/settings';
import { compose } from './composition';
import { evaluate } from './evaluation';
import type { FactExtractor } from './facts';
import { heuristicExtractor } from './heuristicExtractor';
import type { DraftKind, Outcome, ReplyOptions, ThreadSnapshot } from './types';

/**
 * Decides which Draft (or notice) a Thread calls for and writes it.
 * Pure: no DOM, no browser APIs.
 */
export function replyTo(
  thread: ThreadSnapshot,
  settings: Settings,
  options: ReplyOptions = {},
  extractor: FactExtractor = heuristicExtractor,
): Outcome {
  if (!settings.setupComplete) return { type: 'notice', notice: 'not-set-up' };

  const recruiterMessages = thread.messages.filter((m) => m.fromRecruiter).map((m) => m.text);
  const lastReply = thread.messages.findLastIndex((m) => !m.fromRecruiter);
  const unanswered = thread.messages.slice(lastReply + 1).map((m) => m.text);
  const facts = extractor.extract(recruiterMessages, unanswered);

  if (!options.force) {
    if (!facts.hasJobSignals) return { type: 'notice', notice: 'not-a-job' };
    if (!unanswered.length) return { type: 'notice', notice: 'already-replied' };
  }

  const { mismatches, questions, quoteRate } = evaluate(facts, settings);
  const kind: DraftKind =
    options.force ?? (mismatches.length ? 'decline' : questions.length ? 'clarification' : 'interest');
  const asked = kind === 'clarification' && !questions.length ? [{ fact: 'details' } as const] : questions;
  return {
    type: 'draft',
    kind,
    text: compose(kind, { recruiterName: thread.recruiterName, mismatches, questions: asked, quoteRate }, settings),
  };
}
