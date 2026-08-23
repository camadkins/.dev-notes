---
title: "The IL and the JIT"
description: "A .NET assembly ships instructions no processor can execute, and the compiler that produces real machine code runs late enough to see the whole type system, which is the layer everything else in this folder rests on."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-06-22
updated:
aliases:
  - CIL and the .NET JIT
  - Tiered Compilation in .NET
  - What Is Inside a .NET Assembly
---

Build a C# project and you get a `.dll`, which looks like every other `.dll` on the machine and is not one. The processor cannot execute a byte of it. What the file holds is common intermediate language and a full description of every type declared in it, and the translation into instructions your CPU understands happens later, on the machine that runs the program, one method at a time.

> [!note] The idea
> C# is compiled twice by two different compilers separated by time, and the second compiler runs with the entire type system already loaded in front of it. Portability is the advertised reason. The consequence that matters more for this folder is that native code is produced at a moment when the runtime already knows what `T` is, so `List<int>` can have its own compiled method bodies and its own static fields. A language that has nothing running at that moment has to erase instead.

## What is actually in the file

When compiling to managed code, the compiler translates your source code into common intermediate language, which the documentation describes as a CPU-independent set of instructions that can be efficiently converted to native code. The instruction set is not a thin veneer over one architecture. CIL includes instructions for loading, storing, initializing, and calling methods on objects, along with arithmetic and logical operations, control flow, direct memory access, and exception handling. It is a stack machine with an object model built in, which puts it in a different category from the register-flavored [[cs/pl/intermediate-representations-and-ssa|intermediate representations]] a native compiler uses internally, though the JIT will build one of those from the CIL before it emits anything.

The second half of the file is the part people forget. When a compiler produces CIL, it also produces metadata: the definition of each type, the signatures of each type's members, the members the code references, and other data the runtime needs while executing. The CIL and metadata sit together in a portable executable file. Because they travel together, the code describes itself, which is why .NET needs no type libraries and no separate interface definition language the way COM did. [[cs/languages/Java/the-class-file-and-classloading|The Java class file]] made the same bet a few years earlier and reached a different conclusion about how much of the type system to preserve.

Metadata is also the reason the runtime can answer questions about a generic instantiation at all. The type arguments are recorded, not thrown away, and that record is what [[cs/languages/CSharp/reified-generics-in-the-clr|reification]] reads.

## The first call

Before CIL can run it must be compiled against the runtime into native code for the target architecture. The mechanism is unusually literal. The loader creates and attaches a stub to each method in a type when the type is loaded and initialized. When a method is called for the first time, the stub passes control to the JIT compiler, which converts the CIL for that method into native code and modifies the stub to point directly to the generated native code. Every later call goes straight to the compiled body with no indirection left over.

Two things follow. First, methods that never run are never compiled. The design takes seriously the possibility that some code might never be called, so instead of spending time and memory converting all the CIL in a file up front, it converts the CIL as needed and keeps the result in memory for the rest of the process. Second, the compiled result belongs to that process and dies with it. This is the axis on which .NET differs from both poles of [[cs/pl/compilation-vs-interpretation|the compile-or-interpret question]]: there is a real compiler producing real machine code, and it runs inside the program it is compiling.

Because the runtime supplies one or more JIT compilers for each computer architecture it supports, the same set of CIL can be JIT-compiled and run on any supported architecture. Portability is a property of the artifact, not of a source distribution.

## Two tiers, because the first call is the wrong time to optimize

Compiling well takes time, and the first call is exactly when you cannot afford it. Tiered compilation resolves the tension by refusing to answer it once. It transitions methods through two tiers: the first tier generates code more quickly, called quick JIT, or loads pre-compiled ReadyToRun code, and the second tier generates optimized code in the background. It has been enabled by default since .NET Core 3.0.

The design document is blunter about what tier 0 is. Tier 0 is whatever code can be made available most quickly to first run a method, and for methods that are not precompiled the JIT generates code using minimal optimizations. Tier 1 is whatever the runtime thinks will run faster. The promotion policy from the 2.1 release has two gates: the method needs to be called at least 30 times, as measured by a call counter, and a 100 millisecond startup timer must have expired without any tier 0 jitting occurring, since fresh tier 0 jitting is the heuristic for still being in startup. A method called a thousand times in the first hundred milliseconds still waits for the timer and then for thirty more calls.

> [!warning] The counter counts calls, not work
> The design document lists this as a known issue in plain terms: the call counter may not adequately address cases where methods are hot by virtue of containing loops, even if they are not invoked many times. A method entered once that spins for a minute inside a loop is, by the counter's measure, cold. This is why quick JIT is not applied to methods containing loops unless you deliberately turn that on, and why a benchmark that forgets to warm up is measuring tier 0.

Running twice also buys information that a single compilation could never have. Dynamic profile-guided optimization works hand in hand with tiered compilation, optimizing code based on additional instrumentation put in place during tier 0. The first version of a method is not only cheap to produce, it is a sensor.

## Verification, and what type safety is protecting

As part of compilation to native code, CIL must pass a verification process. Verification examines CIL and metadata to find out whether the code is type safe, which the documentation defines as accessing only the memory locations it is authorized to access. Stated that way the guarantee is recognizable: it is the exact property that a [[cs/security/buffer-overflows|buffer overflow]] destroys, promised statically for all managed code rather than defended one bounds check at a time. Everything the `unsafe` keyword does is a negotiated exception to this paragraph.

The layering is worth holding onto. The C# compiler enforces the language rules. The verifier enforces the runtime's rules on whatever CIL shows up, including CIL that no C# compiler produced. The JIT then emits machine code for a program the runtime has already agreed to trust.

## Related Notes

- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - what the runtime does with the type arguments this layer preserves.
- [[cs/languages/CSharp/generic-specialization-and-code-sharing|Generic Specialization and Code Sharing]] - the JIT deciding which instantiations get their own compiled body.
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - the general frame that a JIT refuses to sit on either side of.
- [[cs/pl/intermediate-representations-and-ssa|Intermediate Representations & SSA]] - what a compiler backend wants its input to look like, and why CIL is not quite it.
- [[cs/languages/Java/the-class-file-and-classloading|The Class File and Classloading]] - the same two-stage design with a different answer on type preservation.
- [[cs/security/buffer-overflows|Buffer Overflows]] - the failure mode type safety exists to make unreachable.

## Sources

- "Managed Execution Process," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/standard/managed-execution-process . Supports the CIL definition and instruction categories, metadata contents, the PE file packaging and self-description, the per-architecture JIT claim, the loader stub and first-call rewrite, on-demand compilation, and the verification and type-safety definition.
- "Runtime configuration options for compilation," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/core/runtime-config/compilation . Supports the two-tier description, quick JIT and ReadyToRun as tier one, background optimizing JIT, the .NET Core 3.0 default, the loops caveat, and dynamic profile-guided optimization working with tiered compilation via tier 0 instrumentation.
- "Tiered Compilation" design document, dotnet/runtime. https://raw.githubusercontent.com/dotnet/runtime/main/docs/design/features/tiered-compilation.md . Supports the Tier0 and Tier1 definitions, the 30-call counter, the 100 millisecond startup timer heuristic, and the known issue about methods that are hot by virtue of containing loops.
