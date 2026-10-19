import type { Settings } from '../settings/settings';
import { compose } from './composition';
import { evaluate } from './evaluation';
import type { FactExtractor } from './facts';
import { heuristicExtractor } from './heuristicExtractor';
import type { DraftKind, Outcome, ThreadSnapshot } from './types';

/**
 * Decides which Draft (or notice) a Thread calls for and writes it.
 * Pure: no DOM, no browser APIs.
 */
export function replyTo(
  thread: ThreadSnapshot,
  settings: Settings,
  extractor: FactExtractor = heuristicExtractor,
): Outcome {
  if (!settings.setupComplete) return { type: 'notice', notice: 'not-set-up' };

  const recruiterMessages = thread.messages.filter((m) => m.fromRecruiter).map((m) => m.text);
  const facts = extractor.extract(recruiterMessages);
  const { mismatches, questions } = evaluate(facts, settings);

  const kind: DraftKind = mismatches.length ? 'decline' : questions.length ? 'clarification' : 'interest';
  return {
    type: 'draft',
    kind,
    text: compose(kind, { recruiterName: thread.recruiterName, mismatches, questions }, settings),
  };
}
