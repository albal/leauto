# leauto

A browser extension that reads recruiter pitches in LinkedIn message threads, checks them against the Candidate's working criteria, and writes a reply Draft for the Candidate to review and send themselves.

## Language

### People

**Candidate**:
The person using the extension: the recipient of recruiter pitches, whatever Engagement Types they accept.
_Avoid_: user, contractor, professional

### Conversation

**Thread**:
A single LinkedIn messaging conversation between the Candidate and a recruiter, of any kind (InMail, connection message, Sales Navigator).
_Avoid_: InMail, conversation, chat

**Unanswered Messages**:
The recruiter's messages in a Thread that arrived after the Candidate's most recent reply.
_Avoid_: latest message, last bubble

**Opportunity**:
The role being pitched in a Thread, described by the facts gathered from all of the recruiter's messages in that Thread.
_Avoid_: job, role, InMail, pitch

**Draft**:
Reply text the extension places in LinkedIn's compose box for the Candidate to review and send manually. A Draft is never sent automatically.
_Avoid_: response, auto-reply, message

### Opportunity facts

**Engagement Type**:
The contractual basis of an Opportunity: `Permanent`, `Fixed-Term`, or `Contract`.
_Avoid_: contract model, B2B, terms

**IR35 Status**:
For a `Contract` Opportunity only, whether the engagement falls `Outside` or `Inside` UK off-payroll rules, or is `Unknown`.
_Avoid_: IR35 determination, IR35 preference (when meaning the Candidate's rule)

**Working Pattern**:
Where an Opportunity's work is done: `Remote`, `Hybrid` (with a number of office days per week and a location), or `On-site`.
_Avoid_: working model, remote flexibility, location policy

**Unknown**:
The value of an Opportunity fact that the recruiter has not stated, or that the extension could not determine with confidence. An Unknown fact leads to a question in a Clarification, never to a guess.
_Avoid_: missing, unspecified, information gap

### Evaluation

**Mismatch**:
A fact about an Opportunity that breaks one of the Candidate's criteria, for example an Inside IR35 Contract when only Outside is accepted, or a stated rate below the Minimum Rate.
_Avoid_: rejection reason, conflict

**Preferred Rate**:
The rate the Candidate quotes when a recruiter asks for their rate.
_Avoid_: target rate, day rate (as a setting name)

**Minimum Rate**:
The lowest rate the Candidate accepts. If the recruiter states a rate below it, that counts as a Mismatch.
_Avoid_: floor, minimum acceptable rate

### Drafts

**Decline**:
A Draft that turns down an Opportunity and cites every Mismatch.
_Avoid_: rejection, pass

**Clarification**:
A Draft that asks the recruiter for every Unknown fact the Candidate's criteria depend on.
_Avoid_: inquiry, information request

**Expression of Interest**:
A Draft for an Opportunity with no Mismatches and no Unknown facts, asking for the full specification or a call.
_Avoid_: acceptance, positive acknowledgment, match reply

**Rate Quote**:
A section stating the Candidate's Preferred Rate, added to a Clarification or an Expression of Interest when the recruiter asked about rates. It is never part of a Decline.
_Avoid_: rate injection
