---
title: Windows Event Logs and User Activity
description: "Event records are the closest thing Windows has to a narrated account of itself, and the two most useful facts about them are what a logon type actually means and what clearing the log writes into the log."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-06-24
updated:
aliases:
  - EVTX
  - Windows Security Log
---

An event record is a structured object, not a line of text. Each one names the provider that emitted it, an event identifier, a channel it belongs to, a precise creation time, the process and thread that wrote it, and a payload of named fields. The security channel of a Windows machine, when auditing is configured, holds a per-event record of authentication, process creation, privilege use, object access, and administrative changes, each stamped to sub-second precision by the component that observed it.

That precision is why event records anchor timelines that other Windows artifacts cannot. A [[cs/forensics/the-windows-registry-as-evidence|registry key]] tells you a program was configured to start. An event record tells you a process by that name started, at that instant, under that account, from that parent.

> [!note] The idea
> The forensic weight of an event record comes from a field almost nobody reads carefully: the qualifier that says **how** something happened. A successful logon is not one fact but a family of them, distinguished by logon type, and the type separates a person at the keyboard from a scheduled task from a service start from an authenticated share access. Analysts who read only the account name and the timestamp routinely place a human at a machine that only saw a network authentication.

## The channel model

The record format carries its own routing. A logon event names its provider, carries EventID 4624, sits in the `Security` channel, and records the process ID and thread ID that wrote it. Channels separate the platform's own subsystems, so security auditing, system component messages, application messages, and the many operational channels published by individual Windows features are separate streams rather than one undifferentiated log. Each has its own file, its own retention setting, and its own permissions.

For an examiner that structure has an immediate consequence. Security auditing can be turned off, cleared, or configured to retain very little, while the operational channels published by individual services often survive untouched because nobody thinks about them. The channels that matter to a given case are frequently not the security channel at all.

## Logon type is the load-bearing field

Event 4624 records a successful logon, and its logon type field is the interpretive key. Microsoft's own table defines them. Type 0 is "used only by the System account, for example at system startup." Type 3 is a network logon, meaning "a user or computer logged on to this computer from the network." Type 4 is batch, and "batch logon type is used by batch servers, where processes can be run on behalf of a user without their direct intervention." Type 5 is a service logon, generated when "the Service Control Manager started a service." Type 8 covers a network logon where "the user's password was passed to the authentication package in its unhashed form."

Read those definitions as claims about human presence and they sort themselves. An interactive type places a session on the console. A network type places credentials on the wire and nothing else, which is what a mapped drive, a remote administrative connection, or [[cs/security/kerberos-authentication|a ticket-backed service access]] produces. A batch or service type usually reflects scheduling and configuration rather than any contemporaneous action by the named account.

Attribution is looser still because the field that identifies the account is a security identifier, not a name. Microsoft notes that "Event Viewer automatically tries to resolve SIDs and show the account name," which means the name on screen is a rendering artifact produced at display time, from a mapping that may not exist on the machine you are examining. An event exported on one host and read on another can display differently. The SID is the evidence, and the string is a convenience.

## Process creation is the other high-value event

Event 4688 "generates every time a new process starts," and its new process name field is "full path and the name of the executable for the new process." On a system configured to include it, the record also carries a Process Command Line field, which turns a bare executable name into the actual invocation with its arguments.

That difference is enormous in practice. Half of intrusion tradecraft runs through interpreters and signed system binaries, so an executable name alone frequently identifies nothing more specific than a scripting host. The command line identifies what it was asked to do. That field is not enabled by default, which is why a well-instrumented host and a default host produce evidence of completely different quality from the same intrusion, and why the audit configuration itself becomes a fact worth documenting in a report.

## What clearing leaves behind

The security log can be cleared by an account with the privilege to do it, and the clearing is itself audited. Event 1102 "generates every time Windows Security audit log was cleared," and the record's subject field holds the "SID of account that cleared the system security audit log."

That is a small, sharp fact with two edges. Clearing does not erase the trace of clearing, so a security log holding a single 1102 as its earliest record is a documented act with an actor attached. But the record proves the erasure and preserves nothing about its contents, so what was destroyed remains unknown from this artifact alone.

The recovery paths for the destroyed contents run through other artifacts. Cleared records may persist in [[cs/forensics/file-carving-and-unallocated-space|unallocated space]] as recoverable log fragments, in forwarded copies on a collector, or in the [[cs/security/siem-and-security-logging|central pipeline]] that shipped them off the host before the clear. Log forwarding matters forensically for exactly this reason: it moves the evidence outside the reach of an account that controls the machine, which is the same argument that makes custody a design property rather than a paperwork exercise.

> [!warning] Absence proves very little
> Auditing is configuration. A missing event may mean the action did not happen, or that the subcategory was not audited, or that retention rolled the record off, or that the log was cleared. A report that treats absence as evidence of non-occurrence is making a claim the artifact does not support, and it is the claim an opposing expert will attack first.

## The reconstruction

Put the three together and the shape of a defensible account emerges. An authentication record establishes that credentials were accepted, and the logon type constrains how. A process creation record establishes what ran, and the command line constrains what it did. A clearing record establishes an act of destruction and names an account. Each is a narrow claim, each is precisely timestamped, and the analysis is the argument that connects them, not any single record.

The connections are checked against artifacts that fail differently. That is the point of [[cs/forensics/timestamps-macb-and-timeline-analysis|building a timeline from multiple sources]] rather than from the log alone: an intruder who controls the machine controls the log, but controlling every artifact that records the same act is much harder.

## Related Notes

- [[cs/forensics/the-windows-registry-as-evidence|The Windows Registry as Evidence]] for configured intent, which event records test against actual execution.
- [[cs/forensics/timestamps-macb-and-timeline-analysis|Timestamps, MACB, and Timeline Analysis]] for placing precisely stamped records among coarser ones.
- [[cs/forensics/anti-forensics-and-what-it-defeats|Anti-Forensics and What It Defeats]] for what clearing, selective deletion, and audit reconfiguration actually accomplish.
- [[cs/security/siem-and-security-logging|SIEM and Security Logging]] for the forwarding pipeline that puts a copy beyond the host's control.
- [[cs/security/kerberos-authentication|Kerberos Authentication]] for what a network logon type is usually recording underneath.
- [[cs/forensics/linux-artifacts-and-log-sources|Linux Artifacts and Log Sources]] for the same questions answered by a system with a very different logging model.

## Sources

- <https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4624> for the logon type table, the event XML structure including provider and channel, and SID resolution at display time.
- <https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4688> for process creation, the new process name field, and the command line field.
- <https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-1102> for the audit log cleared event and the account SID it records.
