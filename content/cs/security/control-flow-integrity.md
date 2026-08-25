---
title: Control-Flow Integrity
description: "The defense that stopped protecting memory permissions and started policing the control-flow graph, splitting the problem into forward edges and backward edges."
draft: false
comments: true
tags:
  - cs
  - security
  - memory
date: 2026-05-08
updated:
aliases:
  - CFI
  - control flow integrity
  - forward-edge CFI
  - backward-edge CFI
---

Every prior memory defense answered a question about storage. Stack canaries ask "was this saved value tampered with?" Non-executable memory asks "is this page allowed to run code?" [[cs/security/return-oriented-programming|Return-oriented programming]] walked around both by corrupting the return value the canary did not cover and reusing code the page permissions already blessed. Control-flow integrity changes the question entirely. It stops reasoning about bytes and permissions and starts reasoning about the program's [[cs/pl/intermediate-representations-and-ssa|control-flow graph]] directly: for every indirect branch, is this jump one the compiled program was ever supposed to be able to make?

> [!note] The idea
> CFI enforces that indirect control transfers land only on targets a precomputed valid-target set allows. A program's control flow is a graph of possible transfers; CFI instruments each indirect call, jump, and return to check its destination against that graph at runtime and aborts if the destination is not in the set. Because ROP and its relatives work precisely by redirecting indirect transfers to unintended locations, constraining those transfers to legitimate edges removes the primitive the attack is built from, without needing to know anything about the specific bug that enabled the corruption.

## Direct edges are safe; indirect edges are the battlefield

Not all control transfers are equally exposed. Wikipedia draws the line: a transfer is "direct, in that the target address is written in the code itself, or indirect, in that the target address itself is a variable in memory or a CPU register." A direct call is baked into the instruction stream and cannot be repointed by corrupting data. The dangerous transfers are the indirect ones, because their destination lives in memory an attacker might overwrite. That is why CFI's whole job, in Wikipedia's phrasing, is that it "is designed to protect indirect transfers from going to unintended locations."

## Forward edges and backward edges

The clarifying move is to split indirect transfers into two families. A forward edge is a jump forward into new code: an indirect call through a function pointer or a C++ [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|virtual table]]. A backward edge is a return, which uses an address the stack handed back, "an indirect backward-edge transfer." The two need different machinery. A forward-edge attack overwrites a vtable or function pointer; a backward-edge attack "change[s] the call stack for a backward-edge attack (return-oriented programming)." ROP, in other words, is specifically a backward-edge problem, which is why the sharpest backward-edge defense is a shadow stack: a protected second copy of every return address. Intel's Control-flow Enforcement Technology implements exactly this in hardware, where "the shadow stack stores a copy of the return address of each CALL. On a RET, the processor checks if the return address stored in the normal stack and shadow stack are equal," faulting if they differ. Forward edges get a complementary hardware check, indirect branch tracking, which requires every legal indirect-call target to begin with a special `ENDBRANCH` instruction.

## Coarse versus fine, and why precision is the whole game

CFI is not one policy but a dial, and where you set it decides how much attack surface survives. Wikipedia's distinction is the key engineering tradeoff: a coarse-grained forward-edge scheme "could, for example, restrict the set of indirect call targets to any function that may be indirectly called in the program, while a fine-grained one would restrict each indirect call site to functions that [[cs/pl/type-systems-goals-guarantees|have the same type]] as the function to be called." The same split governs returns: coarse CFI lets a function return to any same-type call site, while "a fine-grained one would enforce precise return matching (so it can return only to the function that called it)." A coarse policy is cheap and permissive, and a large valid-target set still leaves an attacker room to chain legitimate-but-unintended edges. A precise policy shrinks that set toward the single edge the program actually intended. The security of a CFI deployment is essentially the size of the target set it allows.

> [!warning] CFI narrows the door; it does not remove the room
> CFI constrains where indirect transfers may go, but any coarse policy still admits a set of "valid" targets, and attackers have shown that a control-flow path stitched entirely from allowed edges can sometimes still do useful work. This is why practical systems layer CFI with address randomization and shadow stacks rather than treating any one of them as complete. Clang frames the guarantee honestly: its CFI schemes are "designed to abort the program upon detecting certain forms of undefined behavior that can potentially allow attackers to subvert the program's control flow," not to prove the program safe.

## Related Notes

- [[cs/security/return-oriented-programming|Return-Oriented Programming]], the backward-edge attack CFI and shadow stacks are built to reject
- [[cs/security/buffer-overflows|Buffer Overflows]], the corruption that supplies the hijacked control transfer in the first place
- [[cs/security/memory-protections-aslr-dep-canaries|Memory Protections: ASLR, DEP, and Stack Canaries]], the earlier defenses CFI complements rather than replaces
- [[cs/security/stride-threat-modeling|STRIDE Threat Modeling]], for naming the elevation-of-privilege threat a control-flow hijack realizes

## Sources

- "Control-flow integrity," Wikipedia. https://en.wikipedia.org/wiki/Control-flow_integrity . Supports the definition of CFI as techniques that "prevent a wide variety of malware attacks from redirecting the flow of execution," the direct versus indirect and forward-edge versus backward-edge distinctions, that CFI "is designed to protect indirect transfers from going to unintended locations," the coarse-grained versus fine-grained target-set tradeoff, and Intel CET's shadow-stack return check and indirect branch tracking with `ENDBRANCH`.
- "Control Flow Integrity," Clang documentation, LLVM Project. https://clang.llvm.org/docs/ControlFlowIntegrity.html . Supports that Clang's CFI schemes are "designed to abort the program upon detecting certain forms of undefined behavior that can potentially allow attackers to subvert the program's control flow."
