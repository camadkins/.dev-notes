---
title: Buffer Overflows
description: "How a missing bounds check on the stack becomes arbitrary code execution, by way of the one word of memory that decides where the program goes next."
draft: false
comments: true
tags:
  - cs
  - security
  - memory
date: 2026-02-08
updated:
aliases:
  - buffer overflow
  - stack smashing
  - stack buffer overflow
---

A buffer overflow starts as an unglamorous bug: a program writes more bytes into a fixed-size region than the region holds, and the extra bytes spill into whatever sits next in memory. What turns this from a crash into the most consequential exploit class in systems history is a detail of layout. On the stack, the thing sitting next to a local buffer is often the address the CPU will jump to when the current function returns. Overwrite that, and you are no longer corrupting data. You are choosing the program's next instruction.

> [!note] The idea
> A stack buffer overflow is a memory-safety bug that becomes a control-flow hijack because of adjacency. The overflow reaches past the buffer into the saved return address, and since the CPU trusts that address blindly on return, controlling those bytes means controlling where execution goes. A missing bounds check is promoted into arbitrary code execution by the stack's own layout.

## The missing check

The precondition is a language that will let you write out of bounds without complaint. Aleph One's canonical 1996 walkthrough puts it at the root: C "does not have any built-in bounds checking," and standard functions like `strcpy()`, `strcat()`, and `gets()` "perform no boundary checking." Hand one of them a source longer than the destination and it keeps copying past the end, because nothing in the language or the library is watching the buffer's edge. Wikipedia's definition is the same fact stated structurally: a stack buffer overflow "occurs when a program writes to a memory address on the program's call stack outside of the intended data structure."

## Why the return address is the prize

The stack is more than scratch space. It holds, among other things, "the return addresses for all active function calls." When a function is called, the address to resume at is pushed; when the function finishes, the CPU "pops the return address off the stack and jumps to that address." That jump is unconditional and unchecked. The processor does not ask whether the address is sensible; it goes there.

A local buffer typically sits below the saved return address in the same frame, and writes grow toward it. So an overflow long enough to reach the return address gets to replace it. Aleph One states the exploit primitive in one line: "a buffer overflow allows us to change the return address of a function. In this way we can change the flow of execution of the program." Wikipedia names the canonical method the same way: "overwrite the function return address with a pointer to attacker-controlled data." Point it back into the buffer you just filled with your own instructions, and the function's return becomes a jump into your code.

## From corruption to control

Stringing those two facts together is the classic attack, and it has a name: a deliberate overflow "caused deliberately as part of an attack" is "known as stack smashing." The attacker crafts an input that is partly machine code (historically a shellcode payload that spawns a shell) and partly a new return address chosen to land on that code. The vulnerable function copies it in, overruns its buffer, overwrites the saved return address, and on return the CPU jumps into attacker bytes running with the process's privileges. No new bug is needed at return time. The single unchecked copy already decided the outcome.

> [!warning] This is why memory-unsafe languages carry a permanent tax
> The overflow-to-hijack chain exists because C and C++ let a write run past an allocation and let a corrupted pointer be trusted. Everything built to blunt it, the protections that randomize layout, mark the stack non-executable, and plant a canary before the return address, is mitigation layered over a language that permits the bug in the first place. Memory-safe languages remove the primitive at the source; unsafe ones spend decades containing it.

## Related Notes

- [[memory-protections-aslr-dep-canaries|Memory Protections: ASLR, DEP, and Stack Canaries]], the defenses built specifically to break this chain
- [[virtual-memory|Virtual Memory]], the address space the overflow corrupts and the layout randomization scrambles
- [[side-channel-attacks|Side-Channel Attacks]], a different route to a secret that also exploits how hardware really behaves
- [[stride-threat-modeling|STRIDE Threat Modeling]], for naming the elevation-of-privilege threat a code-execution bug realizes

## Sources

- Aleph One, "Smashing the Stack for Fun and Profit," Phrack Magazine, Issue 49 (1996). http://phrack.org/issues/49/14.html . Supports that C "does not have any built-in bounds checking," that `strcpy()`/`strcat()`/`gets()` "perform no boundary checking," and that "a buffer overflow allows us to change the return address of a function. In this way we can change the flow of execution of the program."
- "Stack buffer overflow," Wikipedia. https://en.wikipedia.org/wiki/Stack_buffer_overflow . Supports the definition of a stack buffer overflow as writing "to a memory address on the program's call stack outside of the intended data structure," that the canonical exploit is to "overwrite the function return address with a pointer to attacker-controlled data," that on return the CPU "pops the return address off the stack and jumps to that address," and the term "stack smashing."
