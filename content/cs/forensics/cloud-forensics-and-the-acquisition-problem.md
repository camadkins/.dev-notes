---
title: Cloud Forensics and the Acquisition Problem
description: "You cannot image a service. What is left is whatever the provider decided to record, for as long as it decided to keep it, released through a process that is contractual and legal before it is technical."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-08-15
updated:
aliases: []
---

Every acquisition method in this section assumes a thing you can hold still: a disk, a phone, a running kernel, a network segment. Cloud services violate that assumption at the root. The storage is pooled across tenants, the compute exists only while it is billed, and the machine that ran the workload may have been destroyed before anyone noticed the incident. There is no object to image and no moment at which it stops changing.

> [!note] The idea
> In cloud investigation the examiner never touches the evidence, so the entire discipline shifts from acquisition to **request**. What can be proven is bounded in advance by what the provider chose to instrument, what retention it configured, and what process compels disclosure. The technically interesting question, how to copy a thing faithfully, is replaced by an administrative one: was the record created before anyone knew it would be needed?

## NIST named the problem

The NIST Cloud Computing Forensic Science Working Group catalogued the challenges, and several read like a direct denial of the standard method. Under data collection, the list includes the "inability to image all of the forensic artifacts in the cloud," "locating forensic artifacts in large, distributed, and dynamic systems," and "recovery of deleted data in a shared and distributed virtual environment."

Two more describe why an examiner cannot simply be given the underlying hardware. There is a problem of "data integrity in a multi-tenant environment where data is shared among multiple computers in multiple locations and accessible by multiple parties," and a problem of "accessing the data of one tenant without breaching the confidentiality of other tenants." A physical disk in a provider's data center holds many customers' data. Seizing it is both technically useless without the storage layer's mapping and legally fraught for everyone else on it.

The report also lists, among the distinctive features of the cloud that create these scenarios, the "inability to acquire system and network logs, multi-tenancy" and rapid elasticity. In an on-premises investigation the hypervisor, the switch, and the storage array are all yours. In a hosted one, everything below your workload belongs to someone else, and its telemetry is not yours to collect.

Custody changes shape too. NIST lists "accurate and secure provenance for maintaining and preserving chain of custody" as an architecture challenge, because [[cs/forensics/chain-of-custody|the custody argument]] now has to span an organizational boundary. The first hands on the evidence belong to provider personnel, which is why the report separately flags the "confidence, competence, and trustworthiness of the cloud Providers to act as first responders and perform data collection."

## What a provider's logs contain

The substitute for an image is the control-plane record. AWS describes its service in terms an examiner will recognize immediately: "Actions taken by a user, role, or an AWS service are recorded as events in CloudTrail," including "actions taken in the AWS Management Console, AWS Command Line Interface, and AWS SDKs and APIs."

That is a genuinely strong artifact for one class of question. Who created that instance, who changed that permission, who exported that snapshot, from which credential, at what time, from which address. Provider APIs are the only way to act on cloud resources, so an audited API is an audited action, with none of the coverage gaps that plague host-based logging.

The limits are equally sharp, and they are set by defaults. The console's built-in event history "provides a viewable, searchable, downloadable, and immutable record of the past 90 days of management events in an AWS Region." Ninety days, management events, one region. Longer retention requires a trail configured in advance, storing to a bucket that itself lives under the account being investigated. Data-plane activity, meaning reads and writes of the objects themselves, is a separate category that must be deliberately enabled.

The forensic consequence is stark: for most accounts, whether the evidence exists was decided months before the incident, by whoever configured logging. And a record kept inside the compromised account is a record an attacker with sufficient privilege can alter or stop, which is the cloud version of the argument for forwarding logs off the host.

## The process that reaches the data

When the account holder is not the party asking, or when the data belongs to a customer of the provider, acquisition becomes legal process. The federal scheme's ladder is written into statute. A governmental entity may require disclosure of the contents of a communication in electronic storage for 180 days or less "only pursuant to a warrant issued using the procedures described in the Federal Rules of Criminal Procedure." A court order for other categories "shall issue only if the governmental entity offers specific and articulable facts showing that there are reasonable grounds to believe" the material sought is "relevant and material to an ongoing criminal investigation."

The provision an investigator reaches for first is neither of those. On request, a provider "shall take all necessary steps to preserve records and other evidence in its possession pending the issuance of a court order or other process," and those records "shall be retained for a period of 90 days," extendable by another 90 on renewed request. Preservation is not disclosure. It is a freeze, and it exists because provider retention is short enough that ordinary policy would destroy the evidence while the paperwork was being prepared. The full ladder is [[cs/law/the-stored-communications-act|the Stored Communications Act]], and the cross-border question of data held outside the country is [[cs/law/the-cloud-act-and-cross-border-data|the CLOUD Act]].

NIST's own list of legal challenges reflects the same terrain from the technical side: "identifying and addressing issues of jurisdictions for legal access to data," "issuing subpoenas without knowledge of the physical location of data," "data acquisition that relies on the cooperation of cloud Providers," and "missing terms in contracts and service level agreements." That last one is the actionable one for an engineer. The contract, negotiated long before any incident, determines what the provider will produce, in what format, and how fast.

## What the examiner can still do

The workload itself is often reachable even when the platform is not. A virtual machine's disk can be snapshotted through the provider API and the snapshot treated as [[cs/forensics/disk-imaging-formats-and-hashing|an image]] in the usual way, hashed on export and analyzed offline. Memory can sometimes be captured from inside the guest, with the same live-acquisition caveats as [[cs/forensics/memory-acquisition|any running system]]. Container and serverless workloads are worse, because their lifetimes are measured in seconds and their filesystems vanish on exit, leaving only what the platform logged. NIST names the analysis-side consequence: "correlation of forensic artifacts across and within cloud Providers" and "timeline analysis of log data, including synchronization of timestamps."

The section's thesis lands hard here. The findings will be judged by someone outside computing, and the honest report says which records the provider produced, what their documented retention and coverage were, and which parts of the timeline are supported by nothing because nothing was ever recorded.

## Related Notes

- [[cs/law/the-stored-communications-act|The Stored Communications Act]] for the statutory ladder that compels provider disclosure.
- [[cs/law/the-cloud-act-and-cross-border-data|The CLOUD Act and Cross-Border Data]] for data held outside the jurisdiction issuing the process.
- [[cs/forensics/chain-of-custody|Chain of Custody]] because the first handler of cloud evidence works for someone else.
- [[cs/systems/virtualization-vms-and-containers|Virtualization: VMs and Containers]] for the workload lifetimes that decide what can be captured at all.
- [[cs/forensics/flow-records-and-log-based-investigation|Flow Records and Log-Based Investigation]] for the provider-side flow logs that replace on-premises capture.
- [[cs/forensics/memory-acquisition|Memory Acquisition]] for what is still possible from inside a guest instance.

## Sources

- <https://nvlpubs.nist.gov/nistpubs/ir/2020/NIST.IR.8006.pdf> for the catalogued cloud forensic challenges: imaging, multi-tenancy, provenance, provider first response, legal access, and correlation.
- <https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.md> for what a provider control-plane log records and the ninety-day default event history.
- <https://www.law.cornell.edu/uscode/text/18/2703> for the warrant requirement, the court-order standard, and the ninety-day preservation obligation.
