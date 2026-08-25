---
title: "Memory Protections: ASLR, DEP, and Stack Canaries"
description: "Three defenses that attack a memory-corruption exploit at three different steps, and how together they push attackers off code injection and onto reusing code already present."
draft: false
comments: true
tags:
  - cs
  - security
  - memory
date: 2026-04-22
updated:
aliases:
  - ASLR
  - DEP
  - NX bit
  - stack canaries
---

None of the three standard memory protections fixes the underlying bug. A [[cs/security/buffer-overflows|buffer overflow]] is still a buffer overflow with all of them enabled. What they do instead is break specific links in the chain that turns a memory-corruption bug into running code, and they aim at different links, which is why deploying all three is worth far more than any one. Read together they tell a story about how exploitation was forced to evolve.

> [!note] The idea
> ASLR, DEP, and stack canaries are not bug fixes but exploit-step defeats. Canaries detect the overwrite before the corrupted return address is used, DEP makes the injected payload non-executable, and ASLR makes the addresses an exploit needs unpredictable. Each attacks a different assumption the classic stack-smash relies on, and together they leave attackers reusing existing executable code rather than injecting their own.

## Stack canaries: detect the overwrite before it is used

The canary sits between the buffer and the thing worth protecting. As Wikipedia describes it, "Canaries or canary words or stack cookies are known values that are placed between a buffer and control data on the stack to monitor buffer overflows." The insight is about order of corruption: "When the buffer overflows, the first data to be corrupted will usually be the canary, and a failed verification of the canary data will therefore alert of an overflow." Before a function returns, it checks the canary; if it changed, the overflow already happened and the program aborts instead of using the poisoned return address. Two refinements matter. Terminator canaries "are built of null terminators, CR, LF, and FF," so string operations that stop at those bytes cannot rewrite the canary intact, and random canaries "are randomly generated, usually from an entropy-gathering daemon, in order to prevent an attacker from knowing their value."

## DEP / NX: make the payload non-executable

The classic attack lands shellcode in a writable buffer and jumps to it. Executable-space protection removes the second half of that move. It "marks memory regions as non-executable, such that an attempt to execute machine code in these regions will cause an exception," using "hardware features such as the [[cs/systems/virtual-memory|NX bit]] (no-execute bit)." The attack model it kills is stated directly: these exploits "rely on some part of memory, usually the stack, being both writable and executable; if it is not, the attack fails." You can still write your bytes onto the stack; the CPU just refuses to run them.

## ASLR: make the addresses unguessable

An exploit needs to know where things are, the address of its payload, or of a useful function to jump to. ASLR denies that knowledge by "randomly arrang[ing] the address space positions of key data areas of a process, including the base of the executable and the positions of the stack, [[cs/systems/memory-allocators-and-fragmentation|heap]] and libraries." This "hinders some types of security attacks by making it more difficult for an attacker to predict target addresses." And because a wrong guess is usually fatal to the attempt: with randomized layout "these values have to be guessed, and a [[cs/math/discrete-probability|mistaken guess]] is not usually recoverable due to the application crashing." The attacker gets few tries, each likely to crash the target and alert defenders.

## Why they compose, and what attackers did next

Stack canaries defend the return address in one frame; DEP defends against running injected data anywhere; ASLR defends the addresses both of those rely on. They are independent, so an exploit must beat all three at once, and beating them is a different problem each. The interesting consequence is where the arms race went. DEP means you cannot run new code, so attackers stopped injecting it and started reusing code already marked executable. Wikipedia notes the endpoint bluntly: "Return-oriented programming can allow an attacker to execute arbitrary code even when executable space protection is enforced." ROP chains together short snippets ending in `ret` that already exist in the program's libraries, and because it reuses resident code, it needs no writable-executable memory, which is exactly why it appeared once DEP became standard, and why defeating ASLR (to locate those snippets) became the real objective.

> [!warning] Mitigations raise cost, they do not restore safety
> All three protections assume the bug exists and try to make it unprofitable. Determined exploitation adapted: info-leak bugs defeat ASLR, ROP defeats DEP, and canary values can sometimes be leaked or brute-forced. The layered defenses are why exploitation got expensive and specialized, not why it stopped. The only step that removes the primitive is not writing the overflow in the first place.

## Related Notes

- [[cs/security/buffer-overflows|Buffer Overflows]], the exploit chain these three defenses are built to interrupt
- [[cs/systems/virtual-memory|Virtual Memory]], the address space ASLR randomizes and DEP marks per-page
- [[cs/security/sandboxing-and-isolation|Sandboxing and Isolation]], containment for the code that runs when a mitigation is beaten
- [[cs/security/secure-boot-and-the-chain-of-trust|Secure Boot and the Chain of Trust]], integrity pushed below the software these protections run in

## Sources

- "Buffer overflow protection," Wikipedia. https://en.wikipedia.org/wiki/Buffer_overflow_protection . Supports that canaries are "known values that are placed between a buffer and control data on the stack to monitor buffer overflows," that the corrupted canary alerts of an overflow, and the descriptions of terminator and random canaries.
- "Executable-space protection," Wikipedia. https://en.wikipedia.org/wiki/Executable_space_protection . Supports that it "marks memory regions as non-executable," uses "the NX bit (no-execute bit)," defeats attacks that need memory "being both writable and executable," and that "Return-oriented programming can allow an attacker to execute arbitrary code even when executable space protection is enforced."
- "Address space layout randomization," Wikipedia. https://en.wikipedia.org/wiki/Address_space_layout_randomization . Supports that ASLR "randomly arranges the address space positions of key data areas of a process, including the base of the executable and the positions of the stack, heap and libraries," that it makes "it more difficult for an attacker to predict target addresses," and that "a mistaken guess is not usually recoverable due to the application crashing."
