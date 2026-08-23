---
title: Sandboxing and Isolation
description: Why confining untrusted code is about shrinking what a compromised process can even ask for, not about catching it in the act.
draft: false
comments: true
tags:
  - cs
  - security
  - operating-systems
date: 2026-02-17
updated:
aliases:
  - sandboxing
  - process isolation
  - seccomp
---

The instinct when you run code you do not trust is to watch it: log what it does, scan it for badness, alert when it misbehaves. Sandboxing takes the opposite stance. It assumes the code is already hostile, or soon will be, and asks a narrower question. When this process is fully compromised, what is it physically able to do to the rest of the machine? A good sandbox makes that answer small before a single instruction runs.

> [!note] The idea
> Containment is not detection. A sandbox shrinks the set of requests a process can even make to the kernel and the set of resources it can even see, so a total compromise still buys the attacker almost nothing. You defend by reducing capability, not by predicting behavior.

## The kernel interface is the real attack surface

A user process cannot touch hardware, other processes, or the network directly. Everything it wants routes through system calls into the kernel. That boundary is the whole game: if a process can only reach the kernel through a handful of calls, then a bug in any of the hundreds of other calls it never makes cannot be turned against it, and neither can the resources those calls would have exposed. Sandboxing on Linux is three independent narrowings of that boundary, and they compose.

## seccomp: narrow the syscall menu

[Secure Computing mode](https://man7.org/linux/man-pages/man2/seccomp.2.html) filters the system calls a thread is allowed to make. In strict mode the only calls permitted are `read`, `write`, `_exit`, and `sigreturn`, and "other system calls result in the termination of the calling thread." Filter mode is the useful one: the allowed calls "are defined by a pointer to a Berkeley Packet Filter (BPF)," a small program that inspects each syscall and its arguments and returns an action, allow, block with an error, or kill. The filter runs in the kernel on every call, so the menu of things the process can even attempt is set in code before the untrusted logic starts.

## Namespaces: narrow what exists

seccomp limits verbs; namespaces limit nouns. "A namespace wraps a global system resource in an abstraction that makes it appear to the processes within the namespace that they have their own isolated instance of the global resource." There are eight types, including mount, PID, network, and user namespaces. A process in its own network namespace sees no interfaces it was not given; in its own PID namespace it cannot see, let alone signal, processes outside it. The resource is not merely forbidden, it is invisible, which is a stronger guarantee than a permission check that could be fooled.

## Capabilities: split the one big privilege

The last narrowing attacks the all-or-nothing nature of root. Since Linux 2.2 the kernel "divides the privileges traditionally associated with superuser into distinct units, known as capabilities, which can be independently enabled and disabled." A web server that needs to bind port 80 can be granted `CAP_NET_BIND_SERVICE`, "bind a socket to Internet domain privileged ports (port numbers less than 1024)," and nothing else. If that process is taken over, the attacker inherits one sliver of root's power rather than the whole thing.

## Why the three compose

Each mechanism closes a different escape route, so an attacker has to defeat all three at once. Namespaces make most of the system invisible, capabilities make the visible-but-privileged parts unreachable, and seccomp cuts off the syscalls that would be needed to attack the kernel itself and break out. This is the same containment logic that [[cs/military-computing/bell-lapadula-and-mandatory-access-control|mandatory access control]] applies to classified data and that [[cs/military-computing/multics-and-time-sharing-foundations|Multics protection rings]] pioneered in hardware: the policy is the system's to enforce, not the confined code's to relax.

> [!example] What a container really is
> A Linux container is not a virtual machine. It is an ordinary process wearing all three narrowings at once: its own namespaces so it sees a private filesystem, network, and process tree; a seccomp filter blocking the syscalls a breakout would need; and a trimmed capability set so even root inside the container cannot reconfigure the host. Strip those away and the "container" is just a process sharing your kernel.

> [!warning] Shared kernel, shared fate
> All three mechanisms run on the host kernel. A bug in the kernel's own syscall handling can still be a full escape, which is why the seccomp filter matters so much: fewer reachable syscalls means fewer reachable kernel bugs. Sandboxing raises the cost of a breakout, it does not make one impossible.

## Related Notes

- [[cs/systems/virtual-memory|Virtual Memory]], the hardware isolation every sandbox is built on top of
- [[cs/systems/processes-and-threads|Processes and Threads]], the subjects being confined
- [[cs/military-computing/bell-lapadula-and-mandatory-access-control|Bell-LaPadula and Mandatory Access Control]], policy the system enforces rather than the user
- [[cs/military-computing/multics-and-time-sharing-foundations|Multics and Time-Sharing Foundations]], where protection rings began
- [[stride-threat-modeling|STRIDE Threat Modeling]], for naming the elevation-of-privilege threat a sandbox contains

## Sources

- "seccomp(2)," Linux manual pages, man7.org. https://man7.org/linux/man-pages/man2/seccomp.2.html . Supports the description of seccomp strict mode allowing only read, write, _exit, and sigreturn (other calls terminating the thread) and filter mode defining allowed calls via a Berkeley Packet Filter that returns an action per system call.
- "namespaces(7)," Linux manual pages, man7.org. https://man7.org/linux/man-pages/man7/namespaces.7.html . Supports the definition of a namespace as wrapping a global system resource in an abstraction giving processes their own isolated instance, and the existence of the eight namespace types including mount, PID, network, and user.
- "capabilities(7)," Linux manual pages, man7.org. https://man7.org/linux/man-pages/man7/capabilities.7.html . Supports the claim that Linux since 2.2 divides superuser privilege into independently enabled capabilities, and the CAP_NET_BIND_SERVICE description as binding a socket to privileged ports below 1024.
- "Sandbox (computer security)," Wikipedia. https://en.wikipedia.org/wiki/Sandbox_%28computer_security%29 . Supports the framing of a sandbox as a security mechanism for separating running programs to run untrusted code within a tightly controlled set of resources without risking harm to the host.
