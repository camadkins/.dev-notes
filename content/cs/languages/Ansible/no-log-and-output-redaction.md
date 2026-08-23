---
title: "no_log and Output Redaction"
description: "Why no_log is a display filter attached to a task rather than a marking attached to a secret, and the three places a value it hid still reaches a human."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-30
updated:
aliases:
  - Ansible no_log
  - Output Redaction
---

A vaulted secret stops being protected the moment it is used. The documentation says so without hedging: encryption with [[cs/languages/Ansible/vault-and-secret-management|Ansible Vault]] only protects data at rest, and once the content is decrypted, which the docs call data in use, play and plugin authors are responsible for avoiding any secret disclosure. The same sentence names the mechanism it expects you to reach for and points at `no_log` for details on hiding output.

Read that handoff slowly. It assigns the residual risk to a person, and the mechanism it names is narrower than the responsibility being handed over.

> [!note] The idea
> `no_log` is a display filter attached to a task, not a marking attached to a value. Ansible does not follow the secret through the run and suppress it wherever it surfaces. It marks one place where output would have been produced and keeps rendering everything else normally. Every surprise in this area follows from that difference. A value that reaches a second task, a registered variable, or a plugin sitting upstream of the console has left the marked place, and it carries no memory of ever having been protected.

## What the attribute covers

The documented use is a task whose results or command you do not want shown when using `-v` (verbose) mode. Both halves are load-bearing. A password can be exposed by what the module returns and equally by the command line the module was given, and the FAQ's own example is a `shell` task whose command interpolates `{{ secret_value }}`, where the argument is the thing worth hiding.

The purpose is not to run quietly. The docs frame it as a way to keep verbose output but hide sensitive information from others who would otherwise like to be able to see the output. Verbosity stays on, one task's payload goes away, and the run remains readable to an operator who is allowed to watch it but is not allowed to see one field inside it.

The attribute can also apply to an entire play. The docs attach a warning to that form in the same breath: it will make the play somewhat difficult to debug, and it is recommended that this be applied to single tasks only, once a playbook is completed. That last clause is a lifecycle instruction rather than a style note. Redaction is meant to be added when the playbook works, because a redacted play under development is a play whose failures you cannot read.

## Debugging is the documented gap

The clean statement of scope is in the FAQ: the use of the `no_log` attribute does not prevent data from being shown when debugging Ansible itself through the `ANSIBLE_DEBUG` environment variable. Ansible's internal trace runs beneath the filter, because it is not task output at all. It is the engine describing its own work, and the engine's description of a task includes the arguments it assembled.

The practical version of this is dull and common. Someone troubleshoots a failing run on the control node, turns on `ANSIBLE_DEBUG`, gets a working diagnosis, and leaves a full trace in terminal scrollback, in a CI job's archived output, or in whatever collector was watching that host. The value never leaked where it was produced. It leaked where the output was gathered, which is the recurring shape of every [[cs/security/siem-and-security-logging|log aggregation]] incident: the pipeline that exists to preserve everything is very good at preserving this too.

## Why a registered variable still leaks

`no_log` is a keyword written on a task or on a play, so its effect is bounded by the task or the play it is written on. `register` is unaffected by it. The registered variable holds the module's real return data, not a redacted copy, because redaction was never applied to the data in the first place. It was applied to one act of printing.

So the sequence that catches people is not exotic. A task carrying `no_log: true` registers its result. Three tasks later, a `debug` task prints that variable while diagnosing something unrelated, and prints it in full, because that `debug` task is a different task and nothing about it was marked. The same applies to a template that writes the value into a file on the managed node, a `set_fact` that copies it under a friendlier name, and a subsequent command whose argument interpolates it. Each is a fresh opportunity that inherits no protection.

The discipline that actually works here comes from handling classified material rather than from software: under [[cs/security/comsec-principles|COMSEC practice]] the marking travels with the material through every container it passes into. Ansible's variable system has no such marking to travel, which is why the correct habit is to treat `no_log` as something you put on every task that touches the value, and to prefer never registering a secret at all over registering it and remembering to guard each reader.

## The callback ordering problem

Nothing in the engine writes to your terminal. Console output is produced by [[cs/languages/Ansible/callback-plugins-and-output|callback plugins]] rendering an event stream, and the docs are specific about the order: stdout callback plugins handle the main console output, only one can be active, and they always get the event first, with the rest of the callbacks getting the event in the order they are configured. Notification callback plugins, the third type, inform other applications, services, or systems.

Put those two facts against the vault warning and the hole is visible. Redaction is something done while turning a result into text for a human. Callbacks are the layer that turns results into text, and notification callbacks turn them into HTTP posts, database rows, and chat messages instead. A notification callback is not the console, so whatever the console decided to withhold is not a decision that binds it. This is exactly why the vault documentation names plugin authors alongside play authors as the parties responsible for avoiding secret disclosure. It is not a rhetorical flourish. It is an accurate description of who holds the data.

> [!warning] Enabling a callback is a trust decision
> A third-party notification callback is a component with read access to every task result in the run, running inside your control node, with a network egress path you did not write. `no_log` does not constrain it, and the ordering guarantee in the docs is about which callback sees an event first, never about which callback is allowed to see it. Audit what an enabled callback transmits, and treat the list of enabled callbacks as part of the secret-handling surface rather than as output configuration.

## Where this leaves you

Three rules fall out with no judgment required. Mark every task that touches a secret rather than the one task you were worried about, since the protection does not follow the value. Keep `ANSIBLE_DEBUG` off any control node whose scrollback or job log outlives the session, since the engine trace is outside the filter by design. And treat enabled callbacks as readers of everything, because the documentation already does when it makes plugin authors responsible for what they disclose.

## Related Notes

- [[cs/languages/Ansible/vault-and-secret-management|Vault and Secret Management]] covers the data-at-rest half of the problem that this note picks up at decryption.
- [[cs/languages/Ansible/callback-plugins-and-output|Callback Plugins and Output]] explains the event stream and the one-stdout-owner rule that the redaction gap sits inside.
- [[cs/languages/Ansible/variables-and-precedence|Variables and Precedence]] shows why a registered value is an ordinary variable with no special status.
- [[cs/security/siem-and-security-logging|SIEM and Security Logging]] is where redacted-on-screen output tends to arrive unredacted anyway.
- [[cs/security/comsec-principles|COMSEC Principles]] is the contrast case where the marking travels with the material instead of with the printer.
- [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] frames the callback question as one of who needs to read a result at all.

## Sources

- [Protecting sensitive data with Ansible Vault](https://docs.ansible.com/ansible/latest/vault_guide/vault.html) backs the data-at-rest-only scope, the data-in-use handoff to play and plugin authors, and the pointer to `no_log` for hiding output.
- [Frequently Asked Questions](https://docs.ansible.com/ansible/latest/reference_appendices/faq.html) backs the verbose-mode scope over results and the command given to a task, the keep-verbose-output framing, the play-level form with its difficult-to-debug caveat and single-task recommendation, and the `ANSIBLE_DEBUG` exclusion.
- [Callback plugins](https://docs.ansible.com/ansible/latest/plugins/callback.html) backs the three callback types, the single active stdout callback, the stdout-first configured-order event delivery, and notification callbacks informing other applications, services, or systems.
