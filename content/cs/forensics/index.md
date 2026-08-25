---
title: Forensics
description: "Turning what happened on a machine into something a third party will believe: acquisition, preservation, analysis, and the evidentiary standards that decide whether any of it survives an adversarial reading."
draft: false
comments: false
tags:
  - cs
  - forensics
date: 2026-08-22
updated:
aliases: []
---

Forensics is the only computing discipline whose output is judged by people outside computing. A compiler is graded by whether the program runs, a protocol by whether the packets arrive, a proof by whether the argument holds. A forensic finding is graded by a judge, a jury, a regulator, or an opposing expert, none of whom will read the source of the tool that produced it. That single fact reorganizes everything: an analysis that is technically correct and procedurally unsound is worthless, so the first arc here is process rather than tooling, and the last arc is testimony.

The middle is artifacts. What a record proves, how it was preserved, what it fails to say, and where two independent records of the same act disagree. The recurring move in every note is to state the claim the artifact actually licenses and refuse the one it does not, because the gap between those two sentences is where an analysis comes apart.

Other sections own the machinery. [[cs/security/index|Security]] owns the attacks these artifacts record, [[cs/systems/index|Systems]] owns file systems and memory management, [[cs/networking/index|Networking]] owns protocols and capture mechanics, and [[cs/law/index|Law]] owns the statutes and the Fourth Amendment. These notes link all four and restate none of them.

#### The discipline and its constraints

Read this arc first, because every later note assumes it. These five settle what the discipline is for, what order to work in, and what makes a copy of a disk admissible rather than merely accurate.

- [[cs/forensics/what-digital-forensics-is|What Digital Forensics Is]] - science applied to law, and why that puts preservation ahead of discovery
- [[cs/forensics/the-order-of-volatility|The Order of Volatility]] - collection order as a forensic decision, because every second spends evidence that is decaying at different rates
- [[cs/forensics/chain-of-custody|Chain of Custody]] - the record that makes tampering a claim someone has to prove rather than one they can merely raise
- [[cs/forensics/acquisition-write-blockers-and-verification|Acquisition, Write Blockers, and Verification]] - an interface-level filter that splits every command into modifying and non-modifying, and why the block still gets verified
- [[cs/forensics/forensic-soundness-and-repeatability|Forensic Soundness and Repeatability]] - soundness as a property of the path to the result, tested by whether a second examiner lands in the same place

#### Storage

The largest artifact surface, and the one where deletion turns out to remove almost nothing. Start with the container and its hash, then the structure that indexes the volume, then what is recoverable once that structure no longer points at the data.

- [[cs/forensics/disk-imaging-formats-and-hashing|Disk Imaging Formats and Hashing]] - what raw, E01, and AFF4 can say about the bytes they do not have
- [[cs/forensics/ntfs-artifacts-and-the-mft|NTFS Artifacts and the MFT]] - a record per file that holds metadata and, for small files, the file itself
- [[cs/forensics/file-carving-and-unallocated-space|File Carving and Unallocated Space]] - recovery from content when the metadata is gone, where validation rather than detection is the expensive half
- [[cs/forensics/deleted-files-journaling-and-what-survives|Deleted Files, Journaling, and What Survives]] - an accounting change that left content intact, until discard made it an instruction the examiner cannot observe
- [[cs/forensics/timestamps-macb-and-timeline-analysis|Timestamps, MACB, and Timeline Analysis]] - four timestamp classes living in different structures under different update rules, and the timeline as an argument rather than a reading

#### Volatile state

Memory holds what the disk never will: running processes, network connections, injected code, and keys. It also cannot be recaptured, which is why acquisition here is a one-shot act performed by a tool running inside the system it measures.

- [[cs/forensics/memory-acquisition|Memory Acquisition]] - why the capture is never a snapshot, since pages are read in address order while the kernel keeps writing
- [[cs/forensics/memory-analysis-and-process-reconstruction|Memory Analysis and Process Reconstruction]] - type-directed reading of a foreign address space, bounded by the symbol table for that exact kernel build
- [[cs/forensics/the-page-file-and-hibernation-artifacts|The Page File and Hibernation Artifacts]] - memory management and power management writing volatile state to disk, where it outlives the power cycle

#### Per-platform artifacts

The same questions, asked of five platforms that answer them with entirely different record-keeping. Each note is organized around who writes the artifact and with what privilege, because that ordering decides how much weight a field carries when someone disputes it.

- [[cs/forensics/the-windows-registry-as-evidence|The Windows Registry as Evidence]] - a configuration store that became the richest artifact on the machine, carrying one coarse timestamp
- [[cs/forensics/windows-event-logs-and-user-activity|Windows Event Logs and User Activity]] - what a logon type actually means, and what clearing the log writes into the log
- [[cs/forensics/linux-artifacts-and-log-sources|Linux Artifacts and Log Sources]] - three unrelated record-keepers at three trust levels, with the most quotable one the least trustworthy
- [[cs/forensics/macos-artifacts-and-fseventsd|macOS Artifacts and fseventsd]] - a per-volume database of every directory that changed, which refuses to say what changed
- [[cs/forensics/mobile-device-forensics|Mobile Device Forensics]] - full-disk encryption inverting the discipline, so the most invasive method returns the least usable data

#### Beyond the single machine

Once evidence leaves the box, the examiner stops choosing what exists. Capture is sampled, flow records are summaries produced by a timer, cloud data is whatever a provider decided to keep, and an adversary gets a vote in all of it.

- [[cs/forensics/network-forensics-and-packet-capture|Network Forensics and Packet Capture]] - the one artifact that shows the thing itself, under constraints that all point at not having it
- [[cs/forensics/flow-records-and-log-based-investigation|Flow Records and Log-Based Investigation]] - a summary produced by a timer, and which of its fields are artifacts of the metering
- [[cs/forensics/cloud-forensics-and-the-acquisition-problem|Cloud Forensics and the Acquisition Problem]] - no service to image, and a release process that is contractual and legal before it is technical
- [[cs/forensics/anti-forensics-and-what-it-defeats|Anti-Forensics and What It Defeats]] - a counting problem, since a technique has to reach every independent record of the act and almost none do

#### Making it hold up

The arc the section exists for. A finding becomes evidence only after somebody characterizes the tool, writes the method down, and states the claim in language that survives an opposing expert reading the same artifacts.

- [[cs/forensics/malware-triage-static-and-dynamic|Malware Triage, Static and Dynamic]] - what a sample does to this investigation, and the hazard that a sample under observation chooses what it shows
- [[cs/forensics/tool-validation-and-nist-cftt|Tool Validation and NIST CFTT]] - a named version tested against a published specification, where the anomalies are the useful part
- [[cs/forensics/the-daubert-standard-and-expert-testimony|The Daubert Standard and Expert Testimony]] - a reliability test located in method rather than result, and the questions it asks of any technique
- [[cs/forensics/forensic-reporting-for-an-adverse-audience|Forensic Reporting for an Adverse Audience]] - a document written to be attacked, which separates observation from conclusion and argues the alternatives
- [[cs/forensics/incident-response-and-where-forensics-begins|Incident Response and Where Forensics Begins]] - two objectives colliding at the containment decision, which is also the decision about what evidence will still exist

---

*The full file listing follows below, generated automatically by Quartz.*
