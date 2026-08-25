---
title: Linux Artifacts and Log Sources
description: "A Linux box records what happened in three unrelated places with three different trust levels, and the one an examiner reaches for first is the one the system never promised to keep."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-08-06
updated:
aliases: []
---

Windows funnels its record-keeping through one auditing subsystem with a documented event catalog. Linux does nothing of the kind. What happened on a Linux system is scattered across a service journal, a set of fixed-format login accounting files, per-user shell history written by an unprivileged process, the kernel audit subsystem when someone configured it, and application logs in whatever format each application chose. The pieces have different owners, different write paths, and very different resistance to tampering.

> [!note] The idea
> Sort Linux artifacts by **who writes them and with what privilege**, not by how useful they look. Journal metadata is attached by a privileged daemon; login accounting is written by a handful of setuid programs into files whose absence silently disables the accounting; shell history is a text file written by the user's own shell, at exit, under the user's own control. The most quotable artifact in a Linux investigation is usually the least trustworthy one, and the ordering is the analysis.

## The journal

On a systemd system the primary log is the journal. The man page states the job plainly: "systemd-journald is a system service that collects and stores logging data." It takes input from the kernel ring buffer, the classic libc syslog call, the native structured journal API, the standard output and standard error of service units, and "audit records, originating from the kernel audit subsystem."

Two properties matter forensically. The first is metadata. "The daemon will implicitly collect numerous metadata fields for each log messages in a secure and unfakeable way." A process writing a log line does not get to choose the unit, PID, UID, GID, or executable path recorded alongside it, because those fields are attached by the daemon from the connection rather than accepted from the sender. A syslog line, by contrast, is a string in which every field is whatever the sender typed. That is the difference between a record about a process and a record from a process, and it decides how much weight the field carries when someone disputes it.

The second is where it lives. "The journal service stores log data either persistently below /var/log/journal or in a volatile way below /run/log/journal/," and the volatile case is lost at reboot. Whether a given machine keeps its journal across a reboot depends on whether the persistent directory exists, so an investigator who reboots a host before imaging it can destroy the entire log with a routine act. That is [[cs/forensics/the-order-of-volatility|the volatility ordering]] appearing in a place people do not expect: on a default-configured system, the log is volatile state.

The journal can also be configured to [[cs/security/siem-and-security-logging|forward to a classic syslog daemon]], which is how a systemd host ends up with both a binary journal and plain text files under `/var/log`. When they disagree, they disagree for a reason, usually filtering or a forwarding gap, and the disagreement is worth reporting rather than smoothing.

## Login accounting

Underneath the journal sits a much older mechanism. The utmp family records sessions in [[cs/dsa/arrays|fixed-size binary records]], and the manual is explicit about scope: "The utmp file allows one to discover information about who is currently using the system," while "the wtmp file records all logins and logouts."

The manual is equally explicit about the limits, in a way that reads like a forensic warning written thirty years early. On coverage: "There may be more users currently using the system, because not all programs use utmp logging." On existence: "None of these programs creates the file, so if it is removed, record-keeping is turned off."

That second sentence is the important one. Login accounting is not a service that reopens its store. It is a set of programs appending to a file that must already exist. Delete it and nothing recreates it, nothing complains, and the machine keeps running while recording nothing. An empty or missing wtmp is therefore ambiguous in exactly the way [[cs/forensics/anti-forensics-and-what-it-defeats|anti-forensic technique]] wants it to be, and the manual's own warning that a writable utmp means "you risk faked system logfiles" tells you the format was never designed to resist an adversary with local privileges.

## Shell history

Shell history is where investigators find the sentences they want to quote, and it is the weakest artifact on the system. Bash writes it to a plain file owned by the user: "If HISTFILE is unset or null, the shell does not save the command history when it exits." Unsetting one variable disables it, without privilege, without a trace in the file itself.

Selective suppression is a documented feature rather than an attack. With the right setting, "lines which begin with a space character are not saved in the history list," so a leading space removes a command from the record. And the file has no times unless someone asked for them: only when the timestamp variable is set does "the shell writes time stamps to the history file so they may be preserved across shell sessions." Without it the file is an ordered list of strings with no clock attached, and even the order is per-session rather than global, because each shell appends its own buffer when it exits.

> [!warning] What history is and is not
> A command in `.bash_history` is evidence that a shell was configured to record it and that the file was written. It is not evidence that the command succeeded, that it ran at a particular time, or that the account owner typed it. And an empty history file is evidence of nothing at all, because the mechanisms that produce one include a fresh account, a killed shell, a variable change, and a deliberate wipe.

## The audit subsystem

The kernel audit subsystem is the only Linux source designed for the adversarial case: rules are configured in advance, [[cs/systems/system-calls-and-the-kernel-boundary|records are generated in the kernel]], and the journal ingests them as a distinct source. Where it has been enabled with useful rules, it answers questions that no other source can, particularly execution and file access. Where it has not, and by default the rule set is thin, it answers nothing. As with [[cs/forensics/windows-event-logs-and-user-activity|Windows audit policy]], the configuration of the logging system becomes a fact that belongs in the report, because it is what distinguishes an absence of evidence from evidence of absence.

## Reading the set together

The practical method is to treat the journal as the spine, use login accounting to bound sessions, and use shell history only for leads that another source can confirm. A command in history that matches a process record in the journal is corroborated. A command in history that matches nothing is a lead, and describing it as a finding overstates what a user-writable text file can support.

The filesystem is the fourth source and often the decisive one, because installation, modification, and access leave marks in metadata that no log setting controls. That is a separate problem, handled in [[cs/forensics/timestamps-macb-and-timeline-analysis|timeline analysis]], and it is where a Linux investigation usually ends up when the logs turn out to be thin.

## Related Notes

- [[cs/forensics/the-order-of-volatility|The Order of Volatility]] because a default journal is volatile and a reboot destroys it.
- [[cs/forensics/windows-event-logs-and-user-activity|Windows Event Logs and User Activity]] for the same questions under a centralized auditing model.
- [[cs/forensics/anti-forensics-and-what-it-defeats|Anti-Forensics and What It Defeats]] for what deleting accounting files and unsetting history actually achieves.
- [[cs/forensics/timestamps-macb-and-timeline-analysis|Timestamps, MACB, and Timeline Analysis]] for the filesystem evidence that survives when logging does not.
- [[cs/systems/system-calls-and-the-kernel-boundary|System Calls and the Kernel Boundary]] for why a kernel-generated record outranks a userspace one.
- [[cs/security/siem-and-security-logging|SIEM and Security Logging]] for forwarding these sources off the host before they can be edited.

## Sources

- <https://man7.org/linux/man-pages/man8/systemd-journald.service.8.html> for the journal's input sources, its implicitly collected metadata, and persistent versus volatile storage.
- <https://man7.org/linux/man-pages/man5/utmp.5.html> for utmp and wtmp semantics, incomplete coverage, and the effect of removing the file.
- <https://man7.org/linux/man-pages/man1/bash.1.html> for HISTFILE, space-prefixed suppression, and timestamped history.
