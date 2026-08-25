---
title: Incident Response and Where Forensics Begins
description: "Response minimizes harm and forensics maximizes defensibility, and the two objectives collide at exactly one moment: the decision to contain, which is also the decision about what evidence will still exist."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-06-12
updated:
aliases: []
---

Both disciplines start the same way. Something is wrong on a machine, someone has to find out what, and the answers come from logs, memory, disks, and network records. The divergence is in what counts as success. Response succeeds when the harm stops and the business runs again. Forensics succeeds when a reconstruction of events survives an adversarial reading months later. Those goals overlap for most of the work and point in opposite directions at a few specific moments.

> [!note] The idea
> The conflict is not philosophical, and it is not usually about tooling. It arrives as a single scheduling decision: containment stops the damage and simultaneously destroys the volatile state that would have answered the scope question. NIST resolves this by making evidence preservation **one named criterion in the containment decision**, which means the tradeoff is supposed to be made deliberately, in advance, by policy, rather than improvised by whoever is holding the laptop at 2 a.m.

## Two processes, one incident

NIST's handling guide describes the response life cycle as "preparation, detection and analysis, containment, eradication and recovery, and post-incident activity." The forensic process sits inside those phases rather than beside them, and NIST's forensic guide says why an organization needs it at all: "organizations should have a capability to perform computer and network forensics," because "without such a capability, an organization will have difficulty determining what events have occurred within its systems and networks, such as exposures of protected, sensitive data."

That guide also connects the capability to decision-making rather than to litigation alone: "handling evidence in a forensically sound manner puts decision makers in a position where they can confidently take the necessary actions."

The handling guide states the priority ordering from the other side, and it is honest about it: "although the primary reason for gathering evidence during an incident is to resolve the incident, it may also be needed for legal proceedings." Resolution first. The evidentiary use is a possibility that has to be preserved without becoming the objective, which is the whole tension in one sentence. The response side of that lifecycle is developed in [[cs/security/incident-response-lifecycle|the incident response lifecycle]]; this note is about the seam.

## The containment decision

NIST lists the criteria for choosing a containment strategy, and the list is where the two disciplines are forced to negotiate: "potential damage to and theft of resources," "need for evidence preservation," "service availability," "time and resources needed to implement the strategy," "effectiveness of the strategy," and "duration of the solution."

Preservation is the second item, weighed against availability and speed. Making it explicit is the point. An organization that has decided in advance how it weighs those criteria for each incident type behaves consistently under pressure, and NIST recommends exactly that: "organizations should create separate containment strategies for each major incident type, with criteria documented clearly to facilitate decision-making."

The alternative to containment is not free either. NIST warns that "the delayed containment strategy is dangerous because an attacker could escalate unauthorized access or compromise other systems," and it is blunt about the liability: watching an attacker instead of stopping them can expose the organization, since "if an organization knows that a system has been compromised and allows the compromise to continue, it may be liable if the attacker uses the compromised system to attack other systems." [[cs/law/the-wiretap-act-and-interception|Monitoring for evidence]] is a decision with legal exposure, not a neutral technical choice, and NIST says the response team "should discuss this strategy with its legal department to determine if it is feasible."

## Where they actually collide

The abstract tension becomes concrete in a small number of recurring moments.

**Pulling the plug.** Disconnecting or powering off a host stops the bleeding and destroys running processes, network connections, injected code, and keys held only in RAM. NIST is direct about the ordering that follows: "it is generally desirable to acquire evidence from a system of interest as soon as one suspects that an incident may have occurred," because "an initial system snapshot may do more good in identifying the problem and its source than most other actions that can be taken at this stage." That is [[cs/forensics/the-order-of-volatility|the order of volatility]] restated as an operational instruction, and it is why [[cs/forensics/memory-acquisition|memory capture]] belongs at the front of a response rather than at the end.

**Cleaning up.** Reimaging a compromised host restores service and removes the artifact set that would have established how the intrusion started and how far it went. Once the host is rebuilt, questions about scope can only be answered from evidence collected elsewhere.

**Touching things.** The most common evidence loss is not adversarial at all. NIST names it: "from an evidentiary standpoint, it is much better to get a snapshot of the system as-is rather than doing so after incident handlers, system administrators, and others have inadvertently altered the state of the machine during the investigation." Administrators log in, run diagnostics, open files, and each of those actions writes timestamps and overwrites the very artifacts the investigation depends on.

**Blocking.** Cutting off a command channel protects the network and ends the collection of exactly the traffic that would have characterized the implant.

None of these has a universally right answer. Each has a right answer for a given organization, incident type, and legal posture, decided beforehand.

## Handling that preserves both

Where responders do collect evidence, the requirements do not soften because there is an outage in progress. NIST specifies that "evidence should be collected according to procedures that meet all applicable laws and regulations that have been developed from previous discussions with legal staff and appropriate law enforcement agencies so that any evidence can be admissible in court." Custody is continuous: "evidence should be accounted for at all times; whenever evidence is transferred from person to person, chain of custody forms should detail the transfer and include each party's signature."

The detailed log NIST asks for is the same record described in [[cs/forensics/chain-of-custody|custody documentation]]: identifying information for each item, the "name, title, and phone number of each individual who collected or handled the evidence during the investigation," the "time and date (including time zone) of each occurrence of evidence handling," and the "locations where the evidence was stored."

A response team that keeps that record while working fast has preserved its options. One that skips it has made a decision about admissibility without noticing that it was making one.

## Preparation is the real answer

The reason preparation dominates both guides is that almost every conflict between response and forensics can be dissolved before it happens. [[cs/security/siem-and-security-logging|Logging that is centralized and forwarded]] means that reimaging a host does not destroy the record of what happened on it. A documented containment policy per incident type means the tradeoff was argued when nobody was under pressure. NIST's forensic guide asks organizations to "ensure that their policies contain clear statements addressing all major forensic considerations, such as contacting law enforcement, performing monitoring, and conducting regular reviews of forensic policies and procedures," and to keep procedures and guidelines derived from those policies.

The equipment recommendation makes the same point in miniature. NIST's list of response resources includes forensic software, trusted binaries on removable media, and "evidence gathering accessories, including hard-bound notebooks, digital cameras, audio recorders, chain of custody forms, evidence storage bags and tags, and evidence tape, to preserve evidence for possible legal actions." A team that has to improvise custody documentation during an incident will improvise it badly.

Where forensics begins, then, is not a moment in the timeline. It is a decision made in advance about which questions the organization intends to be able to answer, and the answer becomes fixed the instant somebody powers off a machine.

## Related Notes

- [[cs/security/incident-response-lifecycle|The Incident Response Lifecycle]] for the response process this note sits inside.
- [[cs/forensics/the-order-of-volatility|The Order of Volatility]] for why acquisition ordering is the crux of the conflict.
- [[cs/forensics/memory-acquisition|Memory Acquisition]] for the capture that containment forecloses.
- [[cs/forensics/chain-of-custody|Chain of Custody]] for the handling record that must survive an outage.
- [[cs/security/siem-and-security-logging|SIEM and Security Logging]] for the forwarding that makes reimaging survivable.
- [[cs/forensics/what-digital-forensics-is|What Digital Forensics Is]] for the discipline whose objective differs from response.

## Sources

- <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf> for the response life cycle, containment criteria, delayed containment risk, evidence gathering and custody, and the value of an early snapshot.
- <https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf> for the recommendation that organizations hold a forensic capability, its effect on decision-making, and the policy statements a forensic program requires.
