# leauto privacy policy

_Effective 19 October 2026_

leauto is a browser extension for Chrome and Edge that drafts replies to recruiter messages on LinkedIn. This policy explains what it does with your data. In short, **leauto collects nothing, sends nothing anywhere, and has no servers.**

## What leauto reads

When you click one of leauto's buttons in an open LinkedIn conversation, and only then, leauto reads that conversation from the page in your browser:

- the text of the messages, and which of them came from the other person
- the other person's display name, for the greeting

It uses these to decide which reply to draft and to write the Draft into LinkedIn's message box. The text is processed in memory, inside your browser, while it drafts the reply. leauto doesn't save it, log it, or send it anywhere. It never reads other conversations, your inbox list, your profile or any other LinkedIn page, and it never sends a message. You always send replies yourself.

## What leauto stores

Your settings (the criteria you accept, your rates, your sign-off name, your tone and any templates you write) are saved with the browser's extension storage (`chrome.storage.sync`). If you've turned on browser sync, your browser may sync these settings across your devices through your Google or Microsoft account, under that provider's privacy policy. leauto's author never receives them. Uninstalling leauto removes them.

## Network requests

leauto makes no network requests. It has no analytics, no telemetry, no advertising, no tracking, and no servers of its own. It doesn't share, sell or transfer any data to anyone.

The only link leauto offers to an outside site is the "Report the problem" link that appears if LinkedIn's page layout changes. If you click it, your browser opens a new GitHub issue form, pre-filled with leauto's version number and the names of the page elements it couldn't find. It never includes message text, names or addresses. Nothing is sent until you choose to submit the form on GitHub.

## Permissions

- **storage**: saves your settings, as described above.
- **Access to www.linkedin.com**: adds leauto's buttons beside LinkedIn's message box, and, when you click one, reads the open conversation and writes the Draft.

## Changes and contact

leauto is open source under the MIT licence: <https://github.com/albal/linkedauto>. Any change to this policy will be made in that repository, with the date above updated. Questions can be raised as an issue at <https://github.com/albal/linkedauto/issues>.
