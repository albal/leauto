import type { TemplateName, Tone } from '../settings/settings';

export const PLACEHOLDERS: Record<string, string> = {
  recruiterFirstName: 'The recruiter\'s first name ("there" if unknown)',
  criteria: 'A sentence stating what you accept',
  mismatches: 'Each Mismatch, one "- " line each',
  questions: 'Each question, numbered',
  rateQuote: 'The Rate Quote, when the recruiter asked about rates',
  preferredRate: 'Your Preferred Rate, e.g. £650/day',
  signOff: 'Your sign-off name',
};

export const BUILT_IN_TEMPLATES: Record<Tone, Record<TemplateName, string>> = {
  direct: {
    decline: `Hello {recruiterFirstName},

Thank you for getting in touch. {criteria} This opportunity doesn't meet those requirements:
{mismatches}

Please keep me in mind for suitable roles in future.

Regards,
{signOff}`,
    clarification: `Hello {recruiterFirstName},

Thank you for getting in touch. Before going further, please confirm:
{questions}

{rateQuote}

Regards,
{signOff}`,
    interest: `Hello {recruiterFirstName},

Thank you for getting in touch. This opportunity matches my requirements.

{rateQuote}

Please send the full job specification, or suggest a time for a call.

Regards,
{signOff}`,
    rateQuote: `My day rate is {preferredRate}.`,
  },
  warm: {
    decline: `Hi {recruiterFirstName},

Thanks for reaching out with this opportunity. {criteria} Unfortunately this one isn't a fit:
{mismatches}

If anything matching comes up in the future, please feel free to share it.

Best regards,
{signOff}`,
    clarification: `Hi {recruiterFirstName},

Thanks for reaching out. Before discussing next steps, could you please clarify a few details:
{questions}

{rateQuote}

Once confirmed, I can let you know if this aligns with my current availability.

Best regards,
{signOff}`,
    interest: `Hi {recruiterFirstName},

Thanks for reaching out. This sounds like a good fit for what I'm looking for.

{rateQuote}

Could you send over the full job specification, or suggest a time for a call?

Best regards,
{signOff}`,
    rateQuote: `In answer to your question about rates: my day rate is {preferredRate}.`,
  },
  brief: {
    decline: `Hi {recruiterFirstName},

Thanks, but I'll pass on this one:
{mismatches}

{criteria}

{signOff}`,
    clarification: `Hi {recruiterFirstName},

Thanks. Could you confirm:
{questions}

{rateQuote}

{signOff}`,
    interest: `Hi {recruiterFirstName},

Thanks, this looks like a fit.

{rateQuote}

Could you send the full spec or suggest a call time?

{signOff}`,
    rateQuote: `My day rate is {preferredRate}.`,
  },
};
