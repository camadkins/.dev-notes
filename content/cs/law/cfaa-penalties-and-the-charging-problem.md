---
title: CFAA Penalties and the Charging Problem
description: "Subsection (c) is where the same access becomes a one-year misdemeanor or a twenty-year felony, and the switches that flip it are drafted broadly enough that the critics call the sentencing exposure a matter of charging choice rather than conduct."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-07-18
updated:
aliases: []
---

Most of the argument about [[cs/law/the-computer-fraud-and-abuse-act|the CFAA]] happens in subsection (a), where the offenses live. The pressure is in subsection (c), where the numbers live. Subsection (a) says what counts as a violation. Subsection (c) says what a violation costs, and it does so through a lattice of conditions that can move the same access from a fine to a decade of exposure without any change in the underlying facts about what the defendant did to the machine.

> [!note] The idea
> The CFAA's penalty structure is **conditional rather than graded by conduct**. Nothing in subsection (c) asks how sophisticated the intrusion was or how much harm followed. It asks whether the offender had a financial motive, whether the access furthered any other unlawful act, whether an accounting exercise reaches $5,000, and whether there is a prior conviction under the same section. Each of those is a switch, and each switch multiplies the maximum.

> [!warning] Scope
> This note describes what a penalty statute says and what a published Department of Justice policy states. It is not legal advice, it is not a prediction of any outcome, and nothing here tells a reader what exposure any particular conduct carries.

## The base tier

Start with the paragraph that generates the most cases. A violation of the information-obtaining paragraph, the government-computer paragraph, or the password trafficking paragraph draws "a fine under this title or imprisonment for not more than one year, or both." That is a misdemeanor. In the Supreme Court's summary from Van Buren, those who violate subsection (a)(2) "face penalties ranging from fines and misdemeanor sentences to imprisonment for up to 10 years."

The range from one year to ten is the whole subject of this note.

## The three switches that make a felony

Subparagraph (c)(2)(B) turns the misdemeanor into "a fine under this title or imprisonment for not more than 5 years, or both" if any one of three conditions holds.

The first is that "the offense was committed for purposes of commercial advantage or private financial gain." The second is that "the offense was committed in furtherance of any criminal or tortious act in violation of the Constitution or laws of the United States or of any State." The third is that "the value of the information obtained exceeds $5,000."

Read those as an engineer reads a predicate. The first is broad because almost any commercial context supplies a financial purpose. The second is broader still, because it incorporates by reference the entirety of federal and state criminal and tort law, including civil torts, so a state law claim that would never be charged on its own can supply the element that converts a federal misdemeanor into a federal felony. The third is an accounting question rather than a technical one, and the statute does not define how the value of information is measured.

A separate branch handles the damage paragraph. Where an offense caused loss aggregating at least $5,000 in value during a one-year period, or affected medical care, or caused physical injury, or threatened public health or safety, or hit a government computer used for justice, national defense, or national security, or affected ten or more protected computers in a year, the maximum runs to five years for reckless damage and to ten years for intentional damage. The word doing the work is "loss," which the statute defines as "any reasonable cost to any victim, including the cost of responding to an offense, conducting a damage assessment, and restoring the data, program, system, or information to its condition prior to the offense," plus lost revenue and consequential damages from interruption of service.

That definition is worth sitting with. Loss is not the value of what was taken or the cost of what was broken. It is the victim's response cost. An organization that runs a thorough [[cs/security/incident-response-lifecycle|incident response]] with outside forensics on a minor intrusion can produce a larger statutory loss figure than a sloppier organization suffering a worse one. The threshold that separates tiers is partly a function of how the victim reacted.

## Recidivism and the ceiling

Every tier has a second version for offenders with a prior conviction under the same section. The national defense paragraph carries ten years on a first offense and "not more than twenty years" after a prior. The information paragraph carries ten years after a prior. The damage paragraph reaches twenty years after a prior. At the top, if an offender attempts to cause or knowingly or recklessly causes death from conduct violating the intentional damage paragraph, the statute authorizes "a fine under this title, imprisonment for any term of years or for life, or both."

Recall from the base statute that a state conviction counts. A prior state computer trespass conviction punishable by more than a year, with unauthorized access as an element, is a prior conviction for these purposes, so the escalation ladder crosses jurisdictions.

Subsection (b) completes the picture: conspiracy and attempt are punished under subsection (c) exactly as the completed offense is.

## Where the stacking criticism comes from

The criticism, made repeatedly by defense lawyers, academics, and security researchers, is not that any single maximum is too high in isolation. It is structural, and it has three parts.

First, one episode of conduct can satisfy several paragraphs at once. Accessing a system without authorization and taking data can implicate the information paragraph, the fraud paragraph if any deception was involved, and the damage paragraph if the access impaired availability. Each is a separate count with its own maximum.

Second, the felony switches are drafted so broadly that they are satisfied in most real cases rather than in exceptional ones. Commercial advantage covers a great deal. Furtherance of "any criminal or tortious act" of any state covers more. When the conditions that are supposed to distinguish serious cases are present by default, the misdemeanor tier stops functioning as the ordinary case and becomes the exception.

Third, the aggregation rules let separate events combine. Loss aggregates across a one-year period and, for federal investigations, across a related course of conduct affecting other protected computers. Damage affecting ten or more protected computers in a year is its own trigger, which is easy to satisfy for anything that touches a network at scale, and hard to reason about in advance for anyone working on distributed systems.

Put together, the argument is that the sentencing exposure attached to a given piece of conduct depends heavily on how the government chooses to slice it into counts and which switches it elects to plead. That is a criticism of charging discretion operating on an unusually permissive statute, not a claim that any judge did anything wrong.

## The Department's own answer

The Justice Department's published charging policy, in the Justice Manual, responds to part of this directly. On the phrase Van Buren construed, the policy states that "the Department will not charge defendants with 'exceeding authorized access' or 'exceeds authorized access' under these paragraphs unless" six conditions hold, including that the computer is divided into areas and that "that division is established in a computational sense, that is, through computer code or configuration, rather than through contracts, terms of service agreements, or employee policies."

The policy also directs declination in one named category: "the attorney for the government should decline prosecution if available evidence shows the defendant's conduct consisted of, and the defendant intended, good-faith security research," borrowing the Register of Copyrights definition of that term. And it adds an internal check: "in no instance will an office charge a defendant with 'exceeding authorized access' or 'exceeds authorized access' contrary to a recommendation from CCIPS without approval from the Office of the Deputy Attorney General."

The policy closes by disclaiming any enforceable effect. Its provisions "are not intended to, do not, and may not be relied upon to create a right or benefit, substantive or procedural, enforceable at law by a party to litigation with the United States." A policy is an instruction to prosecutors. It binds the department internally, is revisable by the department, and confers nothing on a defendant. That is the structural answer to why the statutory breadth still matters even after a narrowing policy: the policy narrows practice, not the statute.

## Why engineers end up reading this section

Severity in security engineering is usually expressed through something like [[cs/security/vulnerability-scoring-cve-and-cvss|CVSS]], which scores impact on confidentiality, integrity, and availability using defined metrics. Subsection (c) scores something else entirely: motive, collateral illegality, an accounting total, and criminal history. The two vocabularies do not map onto each other, which is why practitioners running [[cs/security/penetration-testing-methodology|authorized testing]] attend to the scope of the authorization document more closely than to the technical severity of what they find.

## Related Notes

- [[cs/law/the-computer-fraud-and-abuse-act|The Computer Fraud and Abuse Act]] for the offenses subsection (c) prices.
- [[cs/law/exceeds-authorized-access-and-van-buren|Exceeds Authorized Access and Van Buren]] for the question the charging policy also addresses.
- [[cs/law/state-computer-crime-statutes|State Computer Crime Statutes]] because a state conviction counts as a prior.
- [[cs/law/the-security-research-exemption|The Security Research Exemption]] for the neighboring declination question in copyright law.
- [[cs/security/vulnerability-scoring-cve-and-cvss|Vulnerabilities: CVE and CVSS]] for the severity vocabulary that does not match the statutory one.
- [[cs/security/incident-response-lifecycle|The Incident Response Lifecycle]] because response cost is what the statutory term loss measures.

## Sources

- <https://www.law.cornell.edu/uscode/text/18/1030> for subsection (c): the misdemeanor tier, the felony conditions, the damage tiers and loss aggregation, the recidivist maxima, and the definition of loss.
- <https://www.supremecourt.gov/opinions/20pdf/19-783_k53l.pdf> for the Court's summary of the penalty range attached to subsection (a)(2).
- <https://www.justice.gov/jm/jm-9-48000-computer-fraud> for the Justice Manual charging policy and its disclaimer of enforceable rights.
