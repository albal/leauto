/** One message in a Thread, as read from the page. */
export interface ThreadMessage {
  text: string;
  /** True when the recruiter sent it; false when the Candidate did. */
  fromRecruiter: boolean;
}

/** Plain data read from a LinkedIn Thread: everything the Reply Engine needs and nothing more. */
export interface ThreadSnapshot {
  /** The other participant's display name, if the page showed one. */
  recruiterName: string | null;
  /** Oldest first. */
  messages: ThreadMessage[];
}

export type DraftKind = 'decline' | 'clarification' | 'interest';

export interface ReplyOptions {
  /** Compose this kind regardless of the Thread, skipping the not-a-job, already-replied and Mismatch steps. */
  force?: DraftKind;
}

export type Notice = 'not-set-up' | 'not-a-job' | 'already-replied';

export type Outcome =
  | { type: 'notice'; notice: Notice }
  | { type: 'draft'; kind: DraftKind; text: string };
