---
title: Privilege Separation and Least Privilege
description: "Saltzer and Schroeder's least-privilege principle as a design rule, and the privilege-separation architecture that turns it into a structural barrier."
draft: false
comments: true
tags:
  - cs
  - security
  - operating-systems
date: 2026-04-08
updated:
aliases:
  - least privilege
  - privilege separation
  - principle of least privilege
---

Most catastrophic compromises share a shape: a bug in one small, exposed piece of code hands the attacker the authority of the *whole* program. A parser flaw in a network daemon running as root becomes a root shell. The reason is not the bug alone; it is that the vulnerable code held far more privilege than its job required. Two ideas, one a principle and one an architecture, attack that surplus directly.

> [!note] The idea
> Least privilege is a design *principle*: every component should hold only the rights its job actually needs. Privilege separation is the *architecture* that enforces it by splitting a program into a small privileged part and a larger unprivileged part, so that a compromise of the exposed code cannot reach the trusted code. The principle says "hold less"; the architecture makes "less" a wall the attacker has to climb.

## The principle, as originally stated

Saltzer and Schroeder's 1975 paper "The Protection of Information in Computer Systems" gives the canonical wording. Least privilege: "Every program and every user of the system should operate using the least set of privileges necessary to complete the job." They give two reasons, and the second is the one people forget. Primarily "this principle limits the damage that can result from an accident or error." But it "also reduces the number of potential interactions among privileged programs to the minimum for correct operation, so that unintentional, unwanted, or improper uses of privilege are less likely to occur."

So least privilege is a blast-radius argument and a complexity argument at once. Less privilege means less damage when something fails, and fewer privileged pieces means fewer dangerous interactions to reason about. The same paper's related principle, *separation of privilege*, notes that "a protection mechanism that requires two keys to unlock it is more robust and flexible than one that allows access to the presenter of only a single key," because "the two keys can be physically separated and distinct programs" must cooperate to misuse the mechanism.

## Turning the principle into a barrier

A principle you can violate silently is only advice. Privilege separation makes least privilege *structural*. Provos, Friedl, and Honeyman's 2003 paper "Preventing Privilege Escalation" motivates it from the failure mode: "A programming error in a privileged service opens the door to system compromise in the form of unauthorized acquisition of privileges. In the worst case, a remote attacker may obtain superuser privileges."

Their fix is to divide the program. Privilege separation is "a generic approach that lets parts of an application run with different levels of privilege," so that "programming errors occurring in the unprivileged parts can no longer be abused to gain unauthorized privileges." Architecturally they name the halves: "We call the privileged part the monitor and the unprivileged parts the slaves." The rule that makes it a barrier is the mediation: "A slave must ask the monitor to perform any operation that requires privileges. Before serving a request from the slave, the monitor first validates it."

The exposed code, the part that touches the network and untrusted input, runs as a slave with almost no authority. When it needs something privileged, it asks the monitor, which checks the request against a fixed policy. An attacker who fully owns the slave inherits only the slave's privileges, which by design are nearly nothing. This is the same containment logic behind [[sandboxing-and-isolation|sandboxing]], applied inside a single program rather than around it.

> [!example] OpenSSH, the canonical case
> The Provos work grew out of hardening OpenSSH. The process that speaks the SSH protocol to an unauthenticated remote peer, the most exposed code in the system, runs unprivileged in a restricted environment. Only after authentication succeeds does a small, audited privileged monitor perform the acts that actually require root (like creating the user's session). A memory-corruption bug in the pre-authentication code, the exact class handled by [[buffer-overflows|buffer overflows]] and blunted by [[memory-protections-aslr-dep-canaries|ASLR and DEP]], lands the attacker in a box with no privileges to escalate.

## Why both ideas are needed

Least privilege without separation is aspirational: a monolithic root process can *intend* to use few privileges, but a bug still runs with all of them. Separation without least privilege is pointless: splitting a program helps nothing if every part still runs as root. Together they compose. Least privilege sets the target (each part holds the minimum), and separation enforces it by putting a validated mediation boundary between the part that will get compromised and the part that holds the authority worth stealing. This is the structural core of [[zero-trust-architecture|zero-trust]] thinking applied at the process level.

## Related Notes

- [[sandboxing-and-isolation|Sandboxing and Isolation]] - the containment boundary privilege separation draws inside one program
- [[buffer-overflows|Buffer Overflows]] - the bug class that turns surplus privilege into full compromise
- [[memory-protections-aslr-dep-canaries|Memory Protections]] - defenses that make exploiting the exposed part harder in the first place
- [[stride-threat-modeling|STRIDE Threat Modeling]] - Elevation of Privilege is the STRIDE category these ideas directly counter
- [[zero-trust-architecture|Zero-Trust Architecture]] - least privilege scaled up from a process to a whole enterprise

## Sources

- Saltzer, J. H. and Schroeder, M. D., "The Protection of Information in Computer Systems," design principles section. https://web.mit.edu/Saltzer/www/publications/protection/Basic.html . Supports the least-privilege statement (least set of privileges necessary, limiting damage and reducing privileged interactions) and the separation-of-privilege principle (two keys more robust than one).
- Provos, N., Friedl, M., and Honeyman, P., "Preventing Privilege Escalation," USENIX Security 2003. https://www.usenix.org/legacy/events/sec03/tech/full_papers/provos_et_al/provos_et_al.pdf . Supports the privileged-service failure mode, privilege separation as running parts at different privilege levels so unprivileged bugs cannot escalate, and the monitor/slave architecture where a slave must ask the monitor and the monitor validates the request.
