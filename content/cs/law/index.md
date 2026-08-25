---
title: Law
description: "What the law permits, forbids, and compels when systems are attacked, defended, searched, or exported. US-centric by design, describing instruments rather than advising."
draft: false
comments: false
tags:
  - cs
  - law
date: 2026-08-20
updated:
aliases: []
---

Everywhere else this garden explains how systems work, and since the standards section, how they are specified. This section covers what the law permits, forbids, and compels when those systems are attacked, defended, searched, or exported. It is US-centric by design, because that is the jurisdiction most of these notes describe. Three of them leave it: one for a European regulation that reaches American companies anyway, and two for the international law of armed conflict and state responsibility.

Every note here describes an instrument. It says what a statute, a regulation, a treaty, or a court opinion provides, quotes the operative language, and cites the document. None of them tells a reader what to do, whether something is legal in a particular situation, or how to respond to a legal event.

> [!warning] Scope
> These notes are descriptions of legal instruments, written by an engineer for engineers. They are not legal advice, they do not establish an attorney-client relationship, and they are not a substitute for counsel. Statutes and regulations change, court opinions are superseded, and nothing here has been checked against the law of any particular jurisdiction on any particular day.

The technical subject matter behind every attack, defense, and control named here lives in [[cs/security/index|Security]]. The normative arguments live in [[cs/ethics/index|Ethics]]. Conformance and specification live in [[cs/standards/index|Standards]]. These notes link all three and restate none of them.

#### The core criminal statute

One federal statute, 18 U.S.C. 1030, is the one this section assumes a security practitioner can read cold. Start with the text, then the phrase that took the Supreme Court thirty-five years to construe, then the sentencing exposure, then the fifty state analogues that cover the same ground with different verbs.

- [[cs/law/the-computer-fraud-and-abuse-act|The Computer Fraud and Abuse Act]] - seven offenses that barely changed, and one definition that grew until it covered every machine on the internet
- [[cs/law/exceeds-authorized-access-and-van-buren|Exceeds Authorized Access and Van Buren]] - two decades of circuit split ended by a gates-up-or-down metaphor an engineer already understands
- [[cs/law/cfaa-penalties-and-the-charging-problem|CFAA Penalties and the Charging Problem]] - where the same access becomes a misdemeanor or a twenty-year felony, and what flips the switch
- [[cs/law/state-computer-crime-statutes|State Computer Crime Statutes]] - the same keystroke landing in a different legal category depending on which side of a state line it happened

#### Surveillance and stored data

The government's access to communications and to data held by providers, sorted by statute and then by constitutional doctrine. The chapter structure is from 1986 and the technology is not, which is most of what makes this arc hard.

- [[cs/law/the-wiretap-act-and-interception|The Wiretap Act and Interception]] - a felony prohibition, an unusually demanding court order, and a line drawn by one deletion in 1986
- [[cs/law/the-stored-communications-act|The Stored Communications Act]] - two provider categories from 1986 and a ladder of legal process climbing over them
- [[cs/law/pen-registers-and-trap-and-trace|Pen Registers and Trap and Trace]] - a judge confirming that a certification was made, not evaluating whether it is true
- [[cs/law/the-third-party-doctrine|The Third-Party Doctrine]] - handing information to a bank or a phone company as a forfeiture of any Fourth Amendment interest in it
- [[cs/law/riley-carpenter-and-the-fourth-amendment-online|Riley, Carpenter, and the Fourth Amendment Online]] - two opinions moving digital data out from under doctrines built for physical objects
- [[cs/law/the-cloud-act-and-cross-border-data|The CLOUD Act and Cross-Border Data]] - possession, custody, or control travelling with the provider rather than with the disk

#### Research, disclosure, and the DMCA

The legal position of the person who finds the bug. Two prohibitions in copyright law, the exemptions that partially relieve them, and the two private instruments that do the rest of the work.

- [[cs/law/dmca-1201-and-anticircumvention|DMCA Section 1201 and Anticircumvention]] - an act ban and a tools ban, only one of which the triennial rulemaking can reach
- [[cs/law/the-security-research-exemption|The Security Research Exemption]] - a statutory exemption that requires prior authorization and a regulatory class that reaches no other statute
- [[cs/law/coordinated-vulnerability-disclosure-and-safe-harbor|Coordinated Vulnerability Disclosure and Safe Harbor]] - what a safe harbor clause is as an instrument, and what a charging policy is not
- [[cs/law/bug-bounty-terms-as-contracts|Bug Bounty Terms as Contracts]] - three separable operative parts, and scope turning on whether the publisher could authorize testing at all

#### Export control

The rules that treat knowledge as a controlled item. Two regimes, a historical episode that shaped modern cryptography, and one multilateral entry that showed what happens when a control is written against a technique.

- [[cs/law/the-export-administration-regulations|The Export Administration Regulations]] - the Commerce Control List, the ECCN, and the deemed export that happens without anything crossing a border
- [[cs/law/itar-and-defense-articles|ITAR and Defense Articles]] - a defense article is whatever the Munitions List says it is, and the boundary is an order of review
- [[cs/law/encryption-export-history-and-the-crypto-wars|Encryption Export History and the Crypto Wars]] - cryptography as a munition, and the memoranda and rule changes that ended that
- [[cs/law/wassenaar-and-intrusion-software|Wassenaar and Intrusion Software]] - a control defined by defeating defenses, an abandoned implementation, and a purpose-based fix

#### Compliance regimes that bind engineers

Obligations that arrive as requirements documents rather than as prosecutions. The federal baseline first, then the contract clauses that push it into industry, then the privacy regimes that reach commercial systems.

- [[cs/law/fisma-and-the-federal-baseline|FISMA and the Federal Baseline]] - a statute that specifies no control at all and delegates the substance outward
- [[cs/law/the-nist-risk-management-framework|The NIST Risk Management Framework]] - seven steps, a control catalog, and one step where a named official accepts risk in writing
- [[cs/law/dfars-252-204-7012-and-cui|DFARS 252.204-7012 and CUI]] - a clause covering information the contractor generated itself, with a 72-hour reporting duty attached
- [[cs/law/cmmc-and-the-defense-industrial-base|CMMC and the Defense Industrial Base]] - the same controls as the underlying publication, plus a verification method and an expiry date
- [[cs/law/sectoral-privacy-hipaa-glba-ferpa|Sectoral Privacy: HIPAA, GLBA, FERPA]] - health, financial, and education records, each hung on a different enforcement hook
- [[cs/law/state-breach-notification-law|State Breach Notification Law]] - fifty-odd statutes over one event, differing on the verb for what the attacker did
- [[cs/law/gdpr-as-it-reaches-us-engineers|GDPR as It Reaches US Engineers]] - a European regulation whose jurisdictional hook is where the person is, not where the company is

#### Conflict and authority

The hardest arc, because the material invites opinion and these notes decline to supply it. Each note here states what an instrument provides and attributes every contested position to whoever asserted it.

- [[cs/law/title-10-and-title-50-authorities|Title 10 and Title 50 Authorities]] - a definition, four exclusions, and a deeming clause that moved a class of operations between oversight regimes
- [[cs/law/cyber-operations-and-the-law-of-armed-conflict|Cyber Operations and the Law of Armed Conflict]] - the Charter and the Protocol supplying the vocabulary and declining to supply the thresholds
- [[cs/law/attribution-and-state-responsibility|Attribution and State Responsibility]] - a legal test written about relationships, a forensic method that measures artifacts, and the distance between them

---

*The full file listing follows below, generated automatically by Quartz.*
