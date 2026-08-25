---
title: What Digital Forensics Is
description: "Forensics is the application of science to the law, which means its output is graded by lawyers, judges, and juries rather than by engineers, and that single fact reorganizes the entire discipline around preservation instead of discovery."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-06-14
updated:
aliases: []
---

Every other computing discipline is graded by machines or by peers. A compiler is right when the program runs. A protocol implementation is right when it interoperates. A security control is right when the attack fails. Digital forensics is the exception. Its output is a claim about the past, delivered to people who cannot read a hex dump, evaluated under rules written centuries before the artifacts existed, and attacked by an opponent whose only job is to make the claim collapse.

NIST puts the definition plainly. Forensic science is generally defined as the application of science to the law. Digital forensics, in SP 800-86's phrasing, is generally considered the application of science to the identification, collection, examination, and analysis of data while preserving the integrity of the information and maintaining a strict chain of custody for the data. Read that sentence twice. Two of its clauses are about finding things. Two are about not breaking them. The second pair is what separates this field from every neighboring one.

> [!note] The idea
> A forensic finding is a **joint product of an artifact and a procedure**, and it fails if either half fails. Analysis that is technically correct but procedurally unsound produces nothing usable, because the procedure is the only reason a third party has to believe the artifact was not manufactured. Correctness is necessary. Provenance is what makes correctness worth anything.

## The four phases, and why the order is fixed

SP 800-86 breaks the process into collection, examination, analysis, and reporting. Collection identifies, labels, records, and acquires data from the possible sources of relevant data, following guidelines and procedures that preserve the integrity of the data. Examination forensically processes large amounts of collected data using automated and manual methods to extract data of particular interest, again while preserving integrity. Analysis derives useful information from the examination results using legally justifiable methods and techniques. Reporting describes the actions used and explains how tools and procedures were selected.

The phase boundaries are not project management decoration. Each one is a place where the evidence changes hands or changes representation, and each transition is a place an opponent will look for a gap. Collection is deliberately separated from examination so that the acquisition can be defended without reference to what was later found, which matters because the person who images a drive and the person who interprets it are frequently different people testifying at different times. Note also what the reporting phase includes: an explanation of why these tools were chosen. In most engineering, tool selection is taste. Here it is a question you will be asked under oath.

## The output is not a file, it is a proposition

The artifact of a forensic examination is a statement of the form "this account executed this binary at this time, and here is why you should believe me." RFC 3227, the IETF's best current practice on evidence collection, enumerates what computer evidence needs to be, and the list is startlingly non-technical. Evidence must be admissible, meaning it conforms to certain legal rules before it can be put before a court. It must be authentic, meaning it is possible to positively tie evidentiary material to the incident. It must be complete, telling the whole story rather than a particular perspective. It must be reliable, with nothing about how it was collected and handled that casts doubt on its authenticity. And it must be believable, readily understandable by a court.

"Believable" is the one that stings. A finding can be admissible, authentic, complete, and reliable, and still lose, because the person deciding did not follow it. That is a constraint no compiler ever imposed. It is also why [[cs/forensics/forensic-reporting-for-an-adverse-audience|forensic reporting]] is a technical skill in this field rather than an afterthought, and why the discipline's terminal arc is testimony.

## What it is not

Forensics is not [[cs/security/incident-response-lifecycle|incident response]], though the two share tooling and frequently the same analyst. Incident response optimizes for restoring service and stopping the bleeding, and it accepts destroying evidence to do that faster. Rebuilding a compromised host from a golden image is excellent incident response and total forensic loss. RFC 3227 names the tension directly: when confronted with a choice between collection and analysis you should do collection first and analysis later. That priority ordering only makes sense if you expect to be questioned later about a state of the world that no longer exists.

Forensics is also not security engineering. A security engineer asks what an attacker could do; [[cs/security/stride-threat-modeling|threat modeling]] is a discipline of hypotheticals and coverage. A forensic examiner asks what someone did do, once, on this machine, and must be prepared to say when the data cannot support an answer. SP 800-86 makes the point that the foundation of forensics is a methodical approach that lets analysts either draw appropriate conclusions from the available data or determine that no conclusion can yet be drawn. The second option is a legitimate finding. In very few other technical fields is "I do not know, and here is exactly why the data cannot tell us" a deliverable rather than a failure.

## The uses that are not criminal at all

The legal framing dominates the discipline's methods, but not its caseload. SP 800-86 observes that digital forensic techniques serve many purposes, including investigating crimes and internal policy violations, reconstructing computer security incidents, troubleshooting operational problems, and recovering from accidental system damage. Most examinations never reach a courtroom. They land in an HR proceeding, an insurance claim, a regulator's inbox, or a customer's lawyer's hands. The audience changes; the standard does not, because you cannot know at collection time which audience you are collecting for. That uncertainty is why the discipline treats every acquisition as though it will be contested. It usually will not be. The cost of being wrong about which one is the exception is the whole case.

NIST is careful to bound its own document, warning that because different organizations are subject to different laws and regulations, the publication should not be used as a guide for executing a digital forensic investigation or construed as legal advice. That caveat is itself instructive. Even the standards body writing the technical guidance refuses to speak for the legal layer. The two layers are genuinely separate, and the examiner is the person who has to stand in both.

> [!warning] Scope
> This note describes the discipline as documented by NIST and the IETF. It is not legal advice and makes no claim about admissibility in any jurisdiction. The rules of evidence, the Fourth Amendment, and the statutes governing lawful access are covered in `cs/law` and are deliberately not restated here.

## Related Notes

- [[cs/forensics/chain-of-custody|Chain of Custody]] is the mechanism by which the procedural half of a finding becomes documentary.
- [[cs/forensics/the-order-of-volatility|The Order of Volatility]] turns the collection-before-analysis rule into a concrete sequence.
- [[cs/security/incident-response-lifecycle|The Incident Response Lifecycle]] shares the tooling and optimizes for the opposite outcome, which is the cleanest way to see what forensics is for.
- [[cs/law/the-third-party-doctrine|The Third-Party Doctrine]] governs whether the data an examiner wants can be lawfully obtained at all.
- [[cs/standards/what-a-standard-actually-is|What a Standard Actually Is]] explains the document class that SP 800-86 and RFC 3227 belong to, and why "should" in them is load-bearing.
- [[cs/software-engineering/incident-postmortems-and-blameless-culture|Incident Postmortems]] are the same reconstruction problem with a friendly audience, which is why they are so much cheaper.

## Sources

- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) backs the definition of digital forensics, the four process phases, the range of non-criminal uses, the methodical-approach guidance, and NIST's own scope caveat.
- [RFC 3227, Guidelines for Evidence Collection and Archiving](https://www.rfc-editor.org/rfc/rfc3227.html) backs the five properties of computer evidence and the collection-before-analysis priority.
