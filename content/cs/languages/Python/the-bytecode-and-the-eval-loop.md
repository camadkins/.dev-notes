---
title: The Bytecode and the Eval Loop
description: "How Python source becomes an immutable code object, what a frame adds to it, and how the specializing adaptive interpreter rewrites instructions while the program runs."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-25
updated:
aliases:
  - CPython Bytecode
  - The Eval Loop
  - Specializing Adaptive Interpreter
---

Python is compiled. Not to machine code, and not ahead of time in any way you have to think about, but the path from source text to execution runs through a real compiler that emits a real instruction set. The `dis` module exists to show you that instruction set, and its documentation opens with a disclaimer worth taking seriously: bytecode is an implementation detail of the CPython interpreter, no guarantees are made that bytecode will not be added, removed, or changed between versions of Python, and use of this module should not be considered to work across Python VMs or Python releases.

That disclaimer is a design statement, not a warning label. The instruction set is deliberately unstable, and the freedom to change it every release is what let CPython get significantly faster after 3.11 without changing the language.

> [!note] The idea
> A Python code object is immutable, but the instructions the interpreter actually executes are not. The specializing adaptive interpreter keeps the user-visible bytecode fixed while maintaining a mutable, self-rewriting copy underneath, where each hot instruction watches the types flowing through it and replaces itself with a narrower version. This is the [[cs/pl/compilation-vs-interpretation|compile versus interpret]] distinction going soft: the interpreter performs a small, local, continuous compilation without ever emitting machine code.

## Code objects and frames are two different things

The compiler's output is a code object, and the reference is precise about what it holds. Code objects represent byte-compiled executable Python code, and the difference between a code object and a function object is that the function object contains an explicit reference to the function's globals while a code object contains no context. Default argument values live on the function, not the code, because they are computed at runtime. And the crucial property: unlike function objects, code objects are immutable and contain no references, directly or indirectly, to mutable objects.

Immutability is what makes a code object shareable and cacheable. It is what `.pyc` files store, it is why the same code object backs every closure created from one `def`, and it is why nothing about a running program can change the instructions the compiler emitted.

The mutable half is the frame. Frame objects represent execution frames, and they may occur in traceback objects and are passed to registered trace functions. A frame carries `f_back`, which points to the previous stack frame towards the caller, `f_code` for the code object being executed, and the local variable storage. The chain of `f_back` pointers is the call stack, and it is the same chain that a traceback walks.

Splitting the two this way is what makes [[cs/languages/Python/generators-and-iterators|generators]] possible. A generator is a frame that outlives the call that created it. The code object never changed; the frame simply stopped being tied to the C stack.

## The loop, and what it costs

The eval loop is a dispatch loop over that instruction stream, maintaining a [[cs/pl/abstract-machines-cek-secd|value stack per frame]]. Each instruction pops operands, does something, pushes a result. `LOAD_FAST` pushes a local, `BINARY_OP` pops two and pushes their combination, `CALL` builds a new frame.

The expensive part of that scheme is not the dispatch, it is what the generic instructions have to do. `a + b` compiles to one instruction that must handle integers, floats, strings, lists, and any user class defining `__add__`, so it consults the type, walks the [[cs/languages/Python/the-data-model-and-dunder-methods|data model]] slots, and dispatches. Every execution redoes that work, even when the answer has been the same ten thousand times running.

## Specialization: doing the type check once instead of every time

PEP 659 stated the problem as a general fact about dynamic languages. In order to perform well, virtual machines for dynamic languages must specialize the code that they execute to the types and values in the program being run. It also detached that idea from the machinery people assume it requires: this specialization is often associated with JIT compilers, but is beneficial even without machine code generation.

The mechanism has two halves with distinct names. Quickening is the process of replacing slow instructions with faster variants, producing a mutable instruction stream separate from the immutable bytecode. Its advantages are listed as consequences of that mutability: quickened code can be changed at runtime, can use super-instructions spanning lines and taking multiple operands, and does not need to handle tracing because it can fall back to the original bytecode for that. The last item is why debuggers keep working.

Adaptation is the second half. Each instruction that would benefit from specialization is replaced by an adaptive version during quickening, and each adaptive instruction periodically attempts to specialize itself. So `LOAD_ATTR` becomes an adaptive form, watches what it is asked to do, and once it has seen enough of the same thing, rewrites itself into a family member that assumes that case: attribute found in the instance dictionary at a known offset, or in a class with an unchanged version tag. Each specialized form carries a guard, and when the guard fails the instruction reverts to the general version rather than producing a wrong answer.

The strategy is deliberately narrow. The PEP describes an interpreter that specializes code aggressively, but over a very small region, and is able to adjust to mis-specialization rapidly and at low cost. That is the opposite of a tracing JIT, which speculates across long traces and pays a large deoptimization penalty when the speculation breaks. One instruction is a small enough unit that being wrong costs almost nothing, which is what makes speculation safe without a compiler backend. As the PEP frames the tradeoff, specialization gives improved performance while adaptation allows the interpreter to rapidly change when the pattern of usage in a program alters, limiting the additional work caused by mis-specialization.

> [!example] What the disassembler shows
> The `dis` documentation records the visible consequences. From 3.11, some instructions are accompanied by one or more inline cache entries, which take the form of `CACHE` instructions and are hidden by default. Those caches are the per-instruction storage where a specialized form keeps the type version and offset it is betting on. The docs also note that the interpreter now adapts the bytecode to specialize it for different runtime conditions, and that the adaptive bytecode can be shown with `adaptive=True`. Disassemble a function before and after running it in a loop and the instruction names change under you.

The inline caches also explain a subtle documented change: from 3.12 the argument of a jump is measured relative to the instruction immediately after the jump's `CACHE` entries, so caches are transparent for forward jumps but must be accounted for in backward jumps. Speculative optimization leaked into the instruction encoding itself, which is exactly the kind of change the bytecode's instability was reserved for.

None of this changes what a Python program means. The specialized `LOAD_ATTR` produces the same value the general one would, or it guards, falls back, and produces it anyway. Speculation is invisible from inside the language, which is the same bargain a [[cs/languages/CSharp/the-il-and-the-jit|JIT compiler]] offers, reached without a code generator, and without giving up the portability that a plain interpreter loop has.

## Related Notes

- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - the spectrum this sits in the middle of
- [[cs/languages/CSharp/the-il-and-the-jit|The IL and the JIT]] - the same speculation with machine code generation on the other end
- [[cs/languages/Python/generators-and-iterators|Generators and Iterators in Python]] - what a frame outliving its call makes possible
- [[cs/languages/Python/exception-groups-and-tracebacks|Exception Groups and Tracebacks]] - the frame chain read backwards
- [[cs/languages/Python/free-threading-and-the-end-of-the-gil|Free Threading and the End of the GIL]] - what per-instruction mutable state costs when many threads share it
- [[cs/pl/abstract-machines-cek-secd|Abstract Machines: CEK and SECD]] - the theory of a machine that is a loop over a state, which the frame and value stack implement

## Sources

- "dis - Disassembler for Python bytecode," Python Standard Library. https://docs.python.org/3/library/dis.html . Supports bytecode being an implementation detail with no cross-version or cross-VM guarantees; the appearance of inline `CACHE` entries from 3.11 and their being hidden by default; the interpreter adapting bytecode to specialize for runtime conditions; and the 3.12 change to jump argument measurement relative to cache entries.
- "PEP 659 - Specializing Adaptive Interpreter," Python Enhancement Proposals. https://peps.python.org/pep-0659/ . Supports the claim that dynamic-language VMs must specialize to types and values; specialization being beneficial without machine code generation; the definition of quickening and the listed advantages of quickened code including tracing fallback; adaptive instructions being installed during quickening and periodically specializing themselves; and the aggressive-but-small-region strategy with cheap recovery from mis-specialization.
- "3. Data model," Python Language Reference. https://docs.python.org/3/reference/datamodel.html . Supports code objects representing byte-compiled code, holding no context, and being immutable with no references to mutable objects; and frame objects representing execution frames with `f_back` pointing toward the caller.
