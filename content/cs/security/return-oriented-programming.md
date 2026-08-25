---
title: Return-Oriented Programming
description: "Why marking memory non-executable did not end code execution attacks: the program you want already exists inside the binary, and the return instruction is its interpreter."
draft: false
comments: true
tags:
  - cs
  - security
  - memory
date: 2026-03-22
updated:
aliases:
  - ROP
  - return oriented programming
  - ROP chain
  - code reuse attack
---

For most of the 1990s the exploit recipe was fixed: overflow a buffer, write your own machine code onto [[cs/dsa/stack|the stack]], and overwrite the return address to point at it. Defenders eventually cut that off at the hardware level by marking writable memory as non-executable, so bytes an attacker plants can be written but never run. That should have ended the game. It did not. Return-oriented programming is the answer to a sharp question: if you cannot bring your own code, can you compose an equivalent program entirely out of code that is already there and already executable?

> [!note] The idea
> ROP defeats non-executable memory by injecting no code at all. The attacker locates short instruction sequences that already sit in the program and its libraries, each ending in a `ret`, and chains them by stacking their addresses. Every `ret` pops the next address and jumps to it, so the return instruction itself becomes the fetch-and-dispatch loop of a small interpreter, and the stack of addresses becomes the program. Data execution prevention never fires, because nothing but existing, already-executable code ever runs.

## What non-executable memory actually blocked

Executable-space protection (DEP, and the more general `W^X` policy of "writable xor executable") targets one specific move. As Wikipedia's account puts it, operating systems "began to combat the exploitation of buffer overflow bugs by marking the memory where data is written as non-executable," so "the machine would refuse to execute any code located in user-writable areas of memory, preventing the attacker from placing payload on the stack and jumping to it via a return address overwrite." The defense is precise, and precisely limited. It does not stop you from corrupting the [[cs/security/buffer-overflows|return address]]. It only stops the CPU from running instructions that live in a page you were allowed to write.

## Gadgets and the borrowed instruction set

The insight is that the code segment is full of useful fragments. A "gadget" is a short run of instructions that already exists in the binary or a shared library and happens to end in a return. Wikipedia describes the mechanism directly: a ROP attack "does not inject malicious instructions, but rather uses instruction sequences already present in executable memory, called 'gadgets', by manipulating return addresses." Each gadget does one small thing (load a register, add two values, write to memory) and then returns, which is the important part. The return is not an exit. It is a jump to whatever address sits next on the stack.

That turns the stack into a program. Overwrite the first return address with the address of gadget one; place gadget two's address just above it, then gadget three's, and so on. "At the conclusion of the first gadget, a return instruction will be executed, which will pop the address of the next gadget off the stack and jump to it. At the conclusion of that gadget, the chain continues with the third, and so on." The attacker never writes an instruction. The attacker writes a sequence of addresses, and the machine's own `ret` opcode walks the list.

## Why this is Turing-complete, not a trick

It would be easy to dismiss this as a way to call a couple of library functions. Hovav Shacham's 2007 paper is what closed that door. Its abstract states the result plainly: "We present new techniques that allow a return-into-libc attack to be mounted on x86 executables that calls no functions at all," combining "a large number of short instruction sequences to build gadgets that allow arbitrary computation." The introduction draws the consequence for defenders: the "widely deployed 'W-xor-X' defense, which rules out code injection but allows return-into-libc attacks, is much less useful than previously thought." Shacham named the technique, in his words "facetiously, return-oriented programming," precisely because the gadget set gives an attacker loops, branches, and arithmetic. It is a full programming language whose instructions happen to be other people's code.

The x86 architecture makes gadgets abundant. Because it is a dense variable-length instruction set, "any random sequence of bytes is likely to be interpretable as some valid set of x86 instructions," so you can even find gadgets by scanning backward from a `ret` opcode byte through unaligned positions the compiler never intended as instruction boundaries. Shacham's thesis is that "given any sufficiently large quantity of code (including, but not limited to, [[cs/languages/common/c-abi-and-ffi|the C standard library]]), sufficient gadgets will exist for [[cs/history/turing-and-computability|Turing-complete]] functionality."

> [!warning] This is why the defensive line moved to control flow
> Because ROP reuses legitimate executable code, no policy about *what memory is executable* can stop it. The bytes it runs were always meant to run. That is exactly why the countermeasures that matter target *where control is allowed to go*: address randomization to hide the gadgets ([[cs/security/memory-protections-aslr-dep-canaries|ASLR]]), and [[cs/security/control-flow-integrity|Control-Flow Integrity]] to reject the impossible return targets a chain depends on. The attack forced defense to stop asking "is this page executable?" and start asking "is this jump legitimate?"

## Related Notes

- [[cs/security/buffer-overflows|Buffer Overflows]], the memory-corruption primitive that hands ROP control of the return address in the first place
- [[cs/security/memory-protections-aslr-dep-canaries|Memory Protections: ASLR, DEP, and Stack Canaries]], including the DEP that ROP was invented to bypass and the ASLR that fights back
- [[cs/security/control-flow-integrity|Control-Flow Integrity]], the defense built to reject the hijacked returns a ROP chain is made of
- [[cs/security/format-string-vulnerabilities|Format String Vulnerabilities]], another route to the arbitrary write that seeds a chain

## Sources

- "Return-oriented programming," Wikipedia. https://en.wikipedia.org/wiki/Return-oriented_programming . Supports that operating systems marked written memory non-executable to prevent "placing payload on the stack and jumping to it," that a ROP attack "does not inject malicious instructions, but rather uses instruction sequences already present in executable memory, called 'gadgets'," the chaining mechanism where each `ret` pops "the address of the next gadget off the stack," the density of the x86 instruction set, and Shacham's Turing-completeness thesis.
- Hovav Shacham, "The Geometry of Innocent Flesh on the Bone: Return-into-libc without Function Calls (on the x86)," Proceedings of ACM CCS 2007. https://hovav.net/ucsd/dist/geometry.pdf . Supports that the attack runs "on x86 executables that calls no functions at all" combining "short instruction sequences to build gadgets that allow arbitrary computation," that the "W-xor-X" defense is "much less useful than previously thought," and that Shacham coined "return-oriented programming."
