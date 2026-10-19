# Product Requirements Document (PRD)

## InMail Filter & Auto-Responder for LinkedIn (Chrome & Edge)

### 1. Document Overview

* **Status:** Draft / Review
* **Target Platforms:** Google Chrome, Microsoft Edge (Chromium Manifest V3)
* **Target Audience:** Independent contractors, freelance consultants, and senior specialists managing inbound LinkedIn recruiter messages.
* **Core Value Proposition:** Eliminates repetitive inbound message triage by reading recruiter messages in the LinkedIn inbox and generating polite, highly contextual drafts based on user-defined criteria (IR35 determination, remote working model, engagement type, and day/hourly rates).

---

### 2. Problem Statement & Objectives

#### 2.1 The Problem

Contractors and specialized professionals frequently receive generic or ill-fitting recruiter pitches on LinkedIn. Common friction points include:

* **Mismatches:** Recruiter proposes an "Inside IR35" or "Hybrid/On-site" role when the candidate strictly accepts "Outside IR35" and "Fully Remote."
* **Missing Details:** Messages omit foundational parameters such as engagement type (Contract vs. Permanent), IR35 status, remote flexibility, or day rate.
* **Repetitive Manual Typing:** Crafting individual decline notes or inquiry requests consumes valuable billable time.

#### 2.2 Objectives

* **Draft Generation:** Generate 1-click context-aware response drafts directly into LinkedIn’s messaging compose box.
* **Criteria Filtering:** Accurately evaluate recruiter messages against user preferences (Contract Model, IR35, Remote/Location, Day Rate).
* **Zero Backend Overhead:** Run entirely client-side within the browser (using standard Chromium extension APIs and direct-to-provider LLM API calls or fast local regex/heuristics) to minimize setup complexity and safeguard privacy.
* **Human-in-the-Loop Safety:** Never send messages automatically. Always stage the message in the input box for user review and manual sending to eliminate false positives and prevent LinkedIn bot detection.

---

### 3. User Personas & Core Workflows

#### 3.1 Primary Persona

* **Name:** David, Senior Contract Cloud Architect
* **Location:** United Kingdom
* **Working Requirements:** Outside IR35 only, 100% remote, minimum day rate of £650/day.
* **Pain Point:** Receives 5–10 recruiter InMails daily pitching hybrid roles in London or Inside IR35 public-sector contracts.

#### 3.2 User Workflows

```
Recruiter sends InMail
       │
       ▼
User opens message thread on LinkedIn
       │
       ▼
Extension parses latest recruiter message
       │
       ├── Case A: Role mismatches rules (e.g., Inside IR35 / Hybrid)
       │     └─► Draft polite rejection citing specific mismatch
       │
       ├── Case B: Missing details (IR35 / Working pattern / Contract type not stated)
       │     └─► Draft professional inquiry requesting missing parameters
       │
       ├── Case C: Recruiter asks for rate ("What is your day rate?")
       │     └─► Include configured preferred rate in the generated draft
       │
       └── Case D: Perfect match / all criteria satisfied
             └─► Draft positive acknowledgment requesting full spec / call link

```

---

### 4. System Logic & Decision Matrix

The parsing engine evaluates the latest recruiter message across four core dimensions:

| Dimension | Message Content Extracted | Candidate Rule | Extension Action |
| --- | --- | --- | --- |
| **Working Pattern** | Hybrid or On-site | Fully Remote Only | **Polite Decline:** State commitment to remote-only contracts. |
| **IR35 Status** | Inside IR35 | Outside IR35 Only | **Polite Decline:** State services are strictly supplied via Ltd company (Outside IR35). |
| **Engagement Type** | Permanent or FTC | Contract B2B Only | **Polite Decline:** State availability is strictly limited to contracting/consulting. |
| **Information Gap** | Missing IR35, terms, or location | Mandatory Fields Required | **Clarification Request:** Ask for the working pattern, engagement model, and IR35 determination. |
| **Rate Inquiry** | "What are your rates / expectations?" | Target Rate Configured | **Inject Rate:** Quote target day/hourly rate directly in the drafted reply. |

---

### 5. Detailed Feature Requirements

#### 5.1 Settings & Onboarding Interface (Popup / Options Page)

* **Rule Definitions:**
* **Working Model:** Toggle between `Fully Remote`, `Hybrid Acceptable`, `Any`. If hybrid, specify allowed office days/month and locations.
* **IR35 Status:** Toggle between `Outside IR35 Only`, `Inside Considered`, `Permanent Only`.
* **Engagement Type:** Checkboxes for `B2B Contract`, `Permanent`, `Fixed-Term Contract (FTC)`.
* **Rate / Compensation:** Configurable text fields for `Preferred Day Rate` (e.g., "£650/day"), `Minimum Acceptable Rate`, and `Currency` (£/$/€).


* **Tone & Persona Customization:**
* Option to select message tone: `Direct & Professional`, `Warm & Cordial`, or `Brief & Crisp`.


* **Inference Engine Configuration:**
* **Mode A (Zero-Key Heuristic Mode):** Uses pre-built keyword/regex rules matching UK contracting vernacular (e.g., "inside", "PAYE", "umbrella", "hybrid", "days on-site").
* **Mode B (Bring-Your-Own LLM Key):** User inputs an API key (OpenAI, Anthropic, or OpenRouter) with model selection (e.g., `gpt-4o-mini`, `claude-3-5-haiku`) for natural language understanding and customized phrasing.



```json
{
  "userPreferences": {
    "engagementTypes": ["Contract"],
    "ir35Preference": "Outside Only",
    "workingModel": "Fully Remote",
    "targetRate": "£650/day",
    "tone": "Warm & Cordial",
    "llmProvider": "openai",
    "apiKey": "sk-...",
    "model": "gpt-4o-mini"
  }
}

```

#### 5.2 Content Script & LinkedIn DOM Integration

* **DOM Detection:**
* Observe the LinkedIn Messaging panel (`div.msg-conversations-container` and thread view `div.msg-thread`).
* Identify when a thread is active and read the latest inbound message bubble (`div.msg-s-event-listitem--other`).


* **UI Injection:**
* Inject a discrete button bar directly above or inside LinkedIn's rich text composer (`div.msg-form__contenteditable` or `div[role="textbox"]`).
* Action Buttons:
* `Auto-Draft Reply`: Evaluates message against criteria and inserts draft into the composer.
* `Decline (Outside IR35 / Remote)`: Quick template shortcut.
* `Ask Terms / IR35`: Quick template shortcut.




* **Draft Populator:**
* Emulate native input events (`input`, `change`) on LinkedIn's content-editable element to ensure LinkedIn's internal React/Redux store captures the text and enables the native "Send" button.



#### 5.3 Automated Response Generation Scenarios

##### Scenario 1: Mismatch Decline (Inside IR35 / Hybrid)

* **Trigger:** Recruiter pitches an Inside IR35 role or mentions mandatory office days.
* **Draft Template Output:**
> "Hi [Recruiter Name],
> Thanks for reaching out with this opportunity. I am currently only considering contract roles that are **fully remote** and operate strictly **Outside IR35** via my limited company.
> Because this engagement falls Inside IR35 / requires hybrid on-site presence, I will have to pass. If you pick up any fully remote, Outside IR35 contracts matching my profile in the future, please feel free to share them.
> Best regards,
> [Candidate Name]"



##### Scenario 2: Information Missing (Terms & IR35 Not Mentioned)

* **Trigger:** Recruiter pitches a job title and tech stack without mentioning contract status, IR35 position, or remote expectations.
* **Draft Template Output:**
> "Hi [Recruiter Name],
> Thanks for reaching out. The role sounds interesting on the technical side. Before discussing next steps, could you please clarify a few foundational details:
> 1. Is this opportunity contract (B2B) or permanent?
> 2. If contract, what is the preliminary IR35 determination (Inside vs. Outside)?
> 3. What is the expected working pattern (is this 100% remote)?
> 
> 
> Once confirmed, I can let you know if this aligns with my current availability.
> Best regards,
> [Candidate Name]"



##### Scenario 3: Recruiter Inquires About Day Rate

* **Trigger:** Recruiter explicitly asks: "What are your rate expectations?" or "What is your target day rate?"
* **Draft Template Output:**
> "Hi [Recruiter Name],
> Thanks for reaching out. In response to your question regarding rates: my standard day rate for fully remote, Outside IR35 engagements is **[Configured Preferred Rate]**.
> If that fits within the client's budget and the terms align, please send over the full job description or contract specification.
> Best regards,
> [Candidate Name]"



---

### 6. Technical Architecture & Implementation Stack

```
┌────────────────────────────────────────────────────────┐
│                   Chromium Browser                     │
│                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │     Popup / Options   │   │  Background Service  │  │
│  │     Configuration     │◄──┼►      Worker         │  │
│  └──────────┬────────────┘   └──────────┬───────────┘  │
│             │ chrome.storage            │              │
│             ▼                           ▼              │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Content Script (LinkedIn Context)        │  │
│  │                                                  │  │
│  │  1. Scrapes latest InMail text                   │  │
│  │  2. Evaluates rules (Regex or LLM API call)      │  │
│  │  3. Injects custom UI button into LinkedIn       │  │
│  │  4. Populates div[role="textbox"] with draft     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘

```

* **Manifest:** Manifest V3.
* **Permissions Required:**
* `storage`: For saving user preferences, rate cards, and local settings.
* `activeTab`: To access the active tab without asking for broad web permissions.
* `host_permissions`: `https://*[.linkedin.com/](https://.linkedin.com/)*` (and target LLM provider endpoints like `[https://api.openai.com/](https://api.openai.com/)*`).


* **Client-Side Parser:**
* **Fast Rules Engine:** Local dictionary matching terms such as `inside ir35`, `umbrella`, `hybrid`, `london (2 days)`, `onsite`, `permanent`, `salary`.
* **Optional LLM Prompting:** Structured JSON extraction returning:
```json
{
  "is_contract": true,
  "ir35_status": "inside" | "outside" | "unknown",
  "working_pattern": "remote" | "hybrid" | "onsite" | "unknown",
  "asked_for_rate": true | false
}

```





---

### 7. Non-Functional Requirements & Safety

* **Account Safety & LinkedIn Compliance:**
* Zero automated "click-to-send" operations. The extension only triggers DOM modifications when the user clicks an injected UI button, maintaining 100% human-in-the-loop compliance.


* **Privacy & Data Security:**
* User credentials, rates, and API keys are stored in `chrome.storage.sync` or `chrome.storage.local`.
* InMail message text is never logged to external servers owned by the extension author. Any external network calls occur directly between the user's browser and the LLM provider API of their choice.


* **Performance:**
* Rule evaluation and draft generation must take less than 1.5 seconds from click to draft insertion.


* **Browser Portability:**
* 100% code sharing between Google Chrome and Microsoft Edge by adhering strictly to Chromium W3C extension standards.



---

### 8. Edge Cases & Handling

* **Irrelevant Context / Non-Job InMails:** If the message is a sales pitch (e.g., selling SaaS or lead generation), the parser detects lack of job keywords and informs the user: *"No job details detected; auto-draft skipped."*
* **Dynamic DOM Mutations:** LinkedIn frequently updates CSS classes in its messaging interface. The extension will select elements based on semantic ARIA roles (e.g., `div[role="textbox"]`, `div[data-view-name]`) rather than obfuscated styling classes (e.g., `.artdeco-button--tertiary`).
* **Existing Draft in Compose Box:** If the user already started typing, the extension prompts a one-click confirmation (`Overwrite existing draft?`) before clearing and inserting the new response.

---

### 9. Release Milestones & Roadmap

* **Phase 1 (MVP - Local Rules & Templates):**
* Extension boilerplate (Manifest V3) running on Chrome & Edge.
* Options dashboard to set rate, IR35 rule, and remote preference.
* Injected button on LinkedIn messaging box.
* Regex/heuristic parsing with standard boilerplate decline/inquiry templates.


* **Phase 2 (LLM Integration):**
* Bring-Your-Own-Key integration for OpenAI / Anthropic.
* Context-aware nuance extraction (e.g., detecting subtle phrasing like "occasional team anchor days").
* Recruiter name extraction for personalized greetings.


* **Phase 3 (Quick Adjustments):**
* Floating action pill offering alternative tones with one click: `Decline Politely`, `Decline Firmly`, `Quote Day Rate Only`, `Ask for Call Spec`.

