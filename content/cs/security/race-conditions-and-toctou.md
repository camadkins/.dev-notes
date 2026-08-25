---
title: Race Conditions and TOCTOU
description: "Why a permission check and the action it protects can both be correct in isolation yet combine into a privilege escalation, because the gap between them is an interval an attacker can act inside."
draft: false
comments: true
tags:
  - cs
  - security
  - concurrency
date: 2026-05-09
updated:
aliases:
  - TOCTOU
  - TOCTTOU
  - time of check to time of use
  - race condition
---

Most vulnerability classes are a flaw in a single operation: this copy has no bounds check, this query is unsanitized. A time-of-check-to-time-of-use bug is different and more slippery, because both operations can be individually correct. The check correctly verifies a condition. The action correctly does its job. The defect lives in the space between them, in the assumption that nothing changed while the program moved from one line to the next.

> [!note] The idea
> TOCTOU is a race condition in which the property a program verifies and the property it then relies on are read at two different moments, and an attacker mutates state in the interval between them. The check passes against the world as it was; the action runs against the world as the attacker just remade it. Because the two steps are not atomic, the guarantee the check was supposed to establish is void by the time the action consumes it.

## Check and use are two events, not one

The formal definition names the shape exactly: TOCTOU is "a class of software bugs caused by a [[cs/systems/concurrency-primitives|race condition]] involving the checking of the state of a part of a system (such as a security credential) and the use of the results of that check." Two separate reads of the same state, with a window in between. The vulnerability exists because "it is possible for other programs that run concurrently with this program to execute in between steps 1 and 2 (the operation is [[cs/languages/Cpp/the-cpp-memory-model-and-atomics|not atomic]]), and other programs can change the property or data." Non-atomicity plus outside control over the property is the whole recipe.

## The canonical file race

The textbook case is a setuid program deciding whether the invoking user is allowed to write a file. It checks with `access("file", W_OK)`, which tests the real user's permissions, then opens with `open("file", O_WRONLY)`. Between those two calls, "the attacker replaces file with a [[cs/systems/file-systems|symlink]] to the Unix password file /etc/passwd." The check evaluated the attacker's own file and passed. The open, running with the program's elevated privileges, follows the freshly planted symlink and writes to a file the real user was never allowed to touch. Same path string, two different files, because the name was resolved twice across a window the attacker controlled.

## Why it lands as privilege escalation

The reason this is a security bug and not merely a correctness bug is the privilege asymmetry. "If the program running is privileged, and an unprivileged process can affect the property, it can effectively execute certain privileged tasks." The check exists precisely to gate a privileged action behind a permission test. Win the race and "such a permissions check can then be bypassed completely, and a variety of privileged actions can be executed this way (privilege escalation)." The guard is not removed; it is satisfied against a decoy and then rendered meaningless.

> [!warning] The fix is to collapse the window, not to check harder
> Adding a second check does not help, because it introduces a second window. The durable fixes remove the gap: operate on a stable handle instead of re-resolving a name (open the file once, then check permissions on the open descriptor with `fstat`), use atomic primitives (`O_CREAT | O_EXCL`), or hold a lock across check and use. The goal is to make check and use refer to the same object with no interval an attacker can reach into.

## Related Notes

- [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]], the design that limits what a won TOCTOU race can reach
- [[cs/security/buffer-overflows|Buffer Overflows]], another single-flaw class this bug is usefully contrasted against

## Sources

- "Time-of-check to time-of-use," Wikipedia. https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use . Supports the definition as "a race condition involving the checking of the state of a part of a system ... and the use of the results of that check," the non-atomicity requirement, the `access`-then-`open` symlink example against `/etc/passwd`, and that a bypassed permission check permits "privilege escalation."
