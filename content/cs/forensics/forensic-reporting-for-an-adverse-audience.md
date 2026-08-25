---
title: Forensic Reporting for an Adverse Audience
description: "A forensic report is written to be attacked, which is why observations and conclusions are separated, why competing explanations are argued rather than omitted, and why the notes have to be contemporaneous."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-07-27
updated:
aliases: []
---

Most technical writing assumes a cooperative reader. A design document persuades colleagues, [[cs/software-engineering/incident-postmortems-and-blameless-culture|a postmortem]] informs a team that wants the system fixed, a paper addresses reviewers who share the author's vocabulary. A forensic report assumes the opposite: at least one reader is looking for the sentence that overstates the evidence, and that reader will have access to the same artifacts.

That single assumption produces every structural convention in this kind of document.

> [!note] The idea
> The report's job is to make each claim traceable to an artifact and to a step someone else could repeat. Its structure follows from that: **observations are separated from conclusions**, competing explanations are argued rather than omitted, and the notes behind it are written during the work rather than reconstructed afterward. A report that mixes the layers is not a stylistic problem. It is a document in which a reader cannot tell what was seen from what was inferred.

## Notes are the substrate

The report is downstream of documentation that already exists. NIJ's guidance states the responsibility plainly: "the examiner is responsible for completely and accurately reporting his or her findings and the results of the analysis of the digital evidence examination." And it locates the work: "documentation is an ongoing process throughout the examination. It is important to accurately record the steps taken during the digital evidence examination."

The standard for those notes is the one that makes repetition possible. Documentation "should be contemporaneous with the examination," and the guidance is specific about depth: "take notes detailed enough to allow complete duplication of actions," and "include in the notes dates, times, and descriptions and results of actions taken."

One instruction is easy to skip and disproportionately valuable when the work is challenged: "document irregularities encountered and any actions taken regarding the irregularities during the examination." An anomaly recorded when it happened, with what was done about it, is a sign of a controlled process. The same anomaly discovered later by an opposing examiner, absent from the notes, is a hole.

The broader principle behind all of it appears in the guide's general list: "activity relating to the seizure, examination, storage, or transfer of digital evidence should be documented, preserved, and available for review." Available for review is the operative phrase and the reason [[cs/forensics/chain-of-custody|custody records]] and examination notes live in the same evidentiary world.

## The layers of the document

NIJ describes a report structure that separates administrative facts, method, and findings. The report may include "identity of the reporting agency," a case identifier, the investigator, the submitter, dates of receipt and of the report, a "descriptive list of items submitted for examination, including serial number, make, and model," the "identity and signature of the examiner," a "brief description of steps taken during examination, such as string searches, graphics image searches, and recovering erased files," and results.

The summary and detail sections have a stated relationship that is the discipline's answer to selective quotation: "all findings listed in the summary should also be contained in the details of findings section of the report." Nothing appears in the summary that the body does not support, which means an adversary reading only the summary cannot find a claim with no evidence behind it.

The details section is where artifacts are named individually: specific files related to the request, "other files, including deleted files, that support the findings," string and keyword searches, internet-related evidence, indicators of ownership, and techniques used to hide or mask data. Naming the artifact rather than the inference is what lets another examiner go to the same offset in the same image and see the same thing, which is [[cs/forensics/forensic-soundness-and-repeatability|repeatability]] expressed as prose.

## Uncertainty is stated, not smoothed

NIST puts the intellectual honesty requirement first among the factors affecting reporting. "When the information regarding an event is incomplete, it may not be possible to arrive at a definitive explanation of what happened. When an event has two or more plausible explanations, each should be given due consideration in the reporting process." And the method for handling them: "analysts should use a methodical approach to attempt to prove or disprove each possible explanation that is proposed."

That is a stronger instruction than it looks. It is not a request to hedge. It is a request to enumerate the alternatives that the artifacts permit and then to say what would distinguish them and whether the available evidence does. An account that survives being tested against its rivals is worth more than one that was never compared to anything, and stating the residual uncertainty explicitly is closer in spirit to reporting [[cs/statistics/confidence-intervals|an interval]] than to reporting a point.

The same publication frames the whole analysis phase the same way: "the foundation of forensics is using a methodical approach to reach appropriate conclusions based on the available data or determine that no conclusion can yet be drawn." The second half of that sentence is a legitimate output. [[cs/statistics/hypothesis-testing|No conclusion yet]] is a finding, and reports that cannot produce it are reports that will eventually produce a wrong one.

## Writing for the reader you actually have

NIJ states the constraint compactly: "the resulting report should be written for the intended audience." NIST expands it into cases. "An incident requiring law enforcement involvement requires highly detailed reports of all information gathered, and may also require copies of all evidentiary data obtained." A system administrator "might want to see network traffic and related statistics in great detail." Senior management "might simply want a high-level overview of what happened," including what should be done to prevent a recurrence.

Those are different documents drawn from the same notes, and the temptation they create is the one to resist: an executive summary written for readability can drop the qualifiers that make its sentences true. The qualifier is the finding. "The security log contains no record of that logon" and "the user did not log on" are different claims, and only one of them is supported when [[cs/forensics/windows-event-logs-and-user-activity|audit configuration]] is unknown.

## The habit that produces defensible reports

Write every finding as a sentence about an artifact, then attach the inference as a separate sentence that names its assumptions. Cite the artifact by location so it can be revisited. State the tool and version that produced the output, since [[cs/forensics/tool-validation-and-nist-cftt|a validation result is scoped to a version]]. Record what was not examined and why, because scope limits are attacked when they are hidden and are unremarkable when they are declared.

None of this makes an analysis correct. It makes an analysis checkable, and checkability is the property the audience outside computing is actually evaluating when it decides whether to believe any of it. That is the section's thesis stated one last time from the writing side: technically correct and procedurally undocumented is worth nothing at the moment it matters.

## Related Notes

- [[cs/forensics/the-daubert-standard-and-expert-testimony|The Daubert Standard and Expert Testimony]] for the gatekeeping inquiry this document is written to satisfy.
- [[cs/forensics/forensic-soundness-and-repeatability|Forensic Soundness and Repeatability]] for the property the notes are meant to preserve.
- [[cs/forensics/chain-of-custody|Chain of Custody]] for the parallel record of handling.
- [[cs/forensics/tool-validation-and-nist-cftt|Tool Validation and NIST CFTT]] for why tool and version belong in the method section.
- [[cs/statistics/confidence-intervals|Confidence Intervals]] for stating a result together with its uncertainty rather than as a point.
- [[cs/software-engineering/incident-postmortems-and-blameless-culture|Incident Postmortems and Blameless Culture]] for the cooperative-audience document that forensic reporting is not.

## Sources

- <https://www.ojp.gov/pdffiles1/nij/199408.pdf> for examiner responsibility, contemporaneous notes, duplication-grade detail, irregularities, the report elements, and the summary-to-details relationship.
- <https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf> for alternative explanations, audience consideration, and the methodical approach to conclusions.
