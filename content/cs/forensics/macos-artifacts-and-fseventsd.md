---
title: macOS Artifacts and fseventsd
description: "macOS keeps a per-volume database of every directory that changed, which is an examiner's dream until you read what Apple says the record actually contains."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-07-21
updated:
aliases:
  - FSEvents
  - macOS Forensics
---

Most operating systems record what applications choose to report. macOS also records something no application asked for: a running log of which directories changed, maintained by the system for its own indexing and backup machinery, kept on the volume where the changes happened. An examiner who finds a wiped user directory can still often see that the directory was written to, and roughly when, because the record of the change outlives the changed data.

> [!note] The idea
> The filesystem event store answers *where and roughly when* something changed and refuses to answer *what*. Apple documents this as a design property rather than a limitation: notifications are coalesced, delivered at directory granularity, and explicitly allowed to be dropped under load. Treating an event as proof that a specific file was created is reading a claim the mechanism never makes.

## What the mechanism actually is

Apple's description of the architecture is unusually direct. "The file system events mechanism consists of three parts: kernel code that passes raw event notification to user space through a special device," a daemon that filters the stream and sends out notifications, and "a persistent database which stores a record of all changes throughout time."

That third component is the forensic artifact. It is not a subscription feed that vanishes when no client is listening. It is stored state, written per volume, and it accumulates. Backup software and search indexing use it to ask what changed since the last time they looked, and that same question is what makes it valuable in an investigation: the store is a coarse, cheap, always-on change history that no user process opted into.

The coarseness is stated plainly. "The important point to take away is that the granularity of notifications is at a directory level. It tells you only that something in the directory has changed, but does not tell you what changed."

That sentence should be quoted verbatim in any report built on this artifact. An event names a path and a type of change. It does not name [[cs/systems/file-systems|a file within a directory]], it does not record file contents, and it does not distinguish one write from a hundred.

## The gaps are documented

The API guide goes further and names the conditions under which the record is incomplete by design. "If an event in a directory occurs at about the same time as one or more events in a subdirectory of that directory, the events may be coalesced into a single event," and the client is told to rescan because the additional changes are not necessarily in an immediate child of the listed path. Separately, [[cs/systems/inter-process-communication|a communication failure between the kernel and the user-space daemon]] produces a dropped-event flag, which is the system telling a client that it missed changes it will never be able to enumerate.

Those two behaviors set the outer bound on any argument built from event records. Missing events are expected. Merged events are expected. So the artifact supports statements of the form "this path saw activity in this window" and does not support statements of the form "these were the only changes" or "no change occurred here."

Ordering is better founded than timing. "A per-host event stream consists of events whose IDs are increasing with respect to other events on that host," so the identifiers give a monotonic sequence within a volume. An examiner gets a reliable *before and after* relation between two events even where the wall-clock time attached to the record is imprecise, which is a different and often more defensible kind of claim than a timestamp. It is the same reasoning as [[cs/systems/logical-clocks-lamport-and-vector|a logical clock]]: sequence numbers order events without asserting when they happened.

Volume identity matters for the same reason. Apple warns that a familiar volume name with an unexpected identifier can mean a reformat, a duplicate name, or purged event identifiers, and that a lower identifier than previously seen can mean a restore from backup or a wrap. Each of those is a case where continuing to treat the store as one uninterrupted history produces a wrong answer.

## Unified logging

The other distinctive macOS source is the system log, and it broke with tradition on purpose. Apple's documentation states that the unified logging system "centralizes the storage of log data in memory and on disk, rather than writing that data to a text-based log file," and that it "supersedes the Apple System Logger (ASL) and Syslog APIs."

For an examiner that has three consequences. There is no text file to grep, so the store must be read with tooling that understands the format. Part of the data lives in memory, so a running Mac holds log content that a powered-off disk image does not, which puts the log squarely inside [[cs/forensics/the-order-of-volatility|the volatility ordering]] rather than comfortably on disk. And the messages themselves are subject to privacy handling at the point they are written, because the API exposes formatters to "manage the privacy and presentation of the message" values, so dynamic strings can be redacted before they ever reach the store. A log line that says a private value was elided is not a corrupted record. It is the system doing what the developer asked.

## What this adds up to

macOS gives an examiner an unusually good answer to "was there activity in this location" and an unusually poor answer to "what exactly happened there." That pairing shapes the method. The event store is used to focus attention, narrow a time window, and demonstrate that a location was touched even after its contents are gone. The specifics come from artifacts that record specifics, which is where [[cs/forensics/timestamps-macb-and-timeline-analysis|filesystem timestamps]], application databases, and the unified log carry the argument.

The reason to be pedantic about it is the section's standing tension. An event record that says a directory changed is easy to describe as "the file was created at that time" in a summary paragraph, and that sentence is a claim the artifact does not license. Anyone reviewing the work who has read Apple's documentation will find that gap immediately, which is why [[cs/forensics/forensic-reporting-for-an-adverse-audience|the report]] should carry the mechanism's limits alongside its output.

## Related Notes

- [[cs/forensics/timestamps-macb-and-timeline-analysis|Timestamps, MACB, and Timeline Analysis]] for the per-file times that the event store deliberately does not provide.
- [[cs/forensics/the-order-of-volatility|The Order of Volatility]] because part of the unified log lives in memory until it is flushed.
- [[cs/forensics/windows-event-logs-and-user-activity|Windows Event Logs and User Activity]] for the contrast with a per-event auditing model.
- [[cs/systems/logical-clocks-lamport-and-vector|Logical Clocks: Lamport and Vector]] for why monotonic identifiers order events more defensibly than clock readings.
- [[cs/forensics/mobile-device-forensics|Mobile Device Forensics]] for the same vendor's mobile platform, where the acquisition problem dominates.
- [[cs/forensics/file-carving-and-unallocated-space|File Carving and Unallocated Space]] for recovering the content that an event record only proves existed.

## Sources

- <https://developer.apple.com/library/archive/documentation/Darwin/Conceptual/FSEvents_ProgGuide/TechnologyOverview/TechnologyOverview.html> for the three-part architecture, the persistent database of changes, and directory-level granularity.
- <https://developer.apple.com/library/archive/documentation/Darwin/Conceptual/FSEvents_ProgGuide/UsingtheFSEventsFramework/UsingtheFSEventsFramework.html> for coalescing, dropped events, per-host stream identifiers, and volume identity caveats.
- <https://developer.apple.com/documentation/os/logging.md> for unified logging storage in memory and on disk, its replacement of ASL and Syslog, and privacy handling of interpolated values.
