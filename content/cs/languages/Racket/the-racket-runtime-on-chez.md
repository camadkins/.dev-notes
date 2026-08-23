---
title: The Racket Runtime on Chez
description: "What changed when Racket swapped its C core for Chez Scheme, what deliberately did not, and why the expander was never part of the port."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-18
updated:
aliases:
  - Racket CS
  - Racket BC
  - Racket on Chez Scheme
---

Racket started in 1995 as a fusion of two off-the-shelf C/C++ libraries, a Scheme interpreter and a cross-platform GUI toolkit, assembled to host a pedagogical programming environment. Twenty-some years later the environment had become DrRacket and the interpreter mash-up had become the Racket core, and the team replaced the whole bottom of it. Racket 8.0 shipped Chez Scheme underneath, and the old implementation acquired a retronym.

> [!note] The idea
> The port was a maintainability project that produced a performance result, not the reverse. By 2019 the main Racket distribution consisted of roughly 1.2M lines of Racket, and that code was still supported by roughly 200k lines of C that existed mainly because the original interpreter had been written in C. The interesting engineering claim is about what did not move: the macro expander was already written in Racket, and the same expander implementation runs on both virtual machines. When the boundary between your language and your runtime is a data structure rather than a call into C, swapping the runtime is a compiler-backend problem instead of a rewrite.

## Why not a mainstream VM

The paper is unusually direct about why the JVM and its peers were not candidates, and the reasons are a compact list of what a Scheme actually needs from a machine.

Most virtual machines artificially limit the continuation to a fixed-size call stack, preventing a programmer from using the direct, recursive style that naturally matches a list-shaped or tree-shaped data declaration. Some have grudgingly tacked on a tail-call instruction, but first-class continuations are right out. That single sentence explains [[cs/languages/Racket/proper-tail-calls-and-the-loop-question|why Racket's no-stack-overflow guarantee]] is not portable to a host that models control as a bounded stack.

The second requirement is arithmetic. Most such machines provide numerical support only in the form of floating-point numbers and small integers, leaving out arbitrary precision arithmetic. [[cs/languages/Racket/the-numeric-tower|The exact rational tower]] is not a library you can layer on a machine whose integers wrap; it has to be the machine's own notion of a number, or every arithmetic operation pays a dispatch.

Chez Scheme became available as an open-source implementation in mid-2016, which is what made it a candidate at all. [[cs/history/gnu-stallman-and-free-software|The license change is the load-bearing event]] in this story: a commercial compiler with the right semantics had existed for decades and was unusable as a foundation until it was not.

## The shape of the new stack

Chez Scheme has a small kernel written in C, but it is mostly implemented in Scheme, which already inverts the old ratio. Racket CS adds a compatibility layer implemented in Scheme, a C-implemented `rktio` layer that abstracts over operating-system facilities in the manner of libuv, and additional Racket-specific functionality implemented in Racket.

The seam between Racket and its backend is a form, not an API. The output of the macro expander is a set of linklet forms, with a small layer below the expander managing their compilation and evaluation. For Racket CS, a schemify pass converts a Racket linklet to a Chez Scheme lambda, which is then handled by the Chez Scheme compiler.

That is why the port was tractable. The expander layer implements Racket's module and macro system, and it is the same implementation in both cases. Everything above the linklet form, meaning the entire language tower from `#lang` down to macro expansion, was untouched. Everything below it was replaced. A [[cs/pl/intermediate-representations-and-ssa|well-chosen intermediate representation]] is what converts "rewrite the implementation" into "write a new backend for an existing IR", and the linklet is Racket's.

## What actually changed, and by how much

The experience report's own summary in 2019 was measured: DrRacket runs, the Racket distribution can build itself, and nearly all of the core Racket test suite passes. The authors expected Racket on Chez Scheme to become the main Racket implementation, and encouraged other language implementers to consider Chez Scheme as a target virtual machine.

By February 2020 the status post could say Racket CS is ready for production use. It then passed all of the tests for the main Racket distribution, and differences in compile and run times were much reduced. The honest performance statement from that post is worth keeping, because it is not the one a marketing page would write: Racket CS tends to perform about the same as Racket BC, sometimes better and sometimes worse, but typically using more memory due to larger code sizes.

Two observations from the same post generalize past this project. First, on how the gains arrived: as the trend lines may suggest, the overall improvement is from many small changes that add up. There was no single win. Second, on where they arrived: much of the improvement on the standard benchmark suite happened in the thread and I/O layers that were newly implemented for Racket CS. Rewriting the C runtime in Racket made those layers faster, which is the counterintuitive result and the one that justifies the maintainability argument on performance grounds too.

## The two implementations, named

Both survive and both are documented, so the vocabulary is worth having straight. CS is the current default implementation, built on Chez Scheme as its core virtual machine, and it performs better than BC for most programs. BC is an older implementation, and was the default until version 8.0. BC features a compiler and runtime written in C, with a precise garbage collector and [[cs/pl/compilation-vs-interpretation|a just-in-time compiler]] on most platforms; CS instead compiles through the Chez Scheme compiler ahead of the machine code it runs.

A program can ask which it is on: `(system-type 'vm)` reports `'chez-scheme` under CS and `'racket` under BC. That predicate exists because the difference is observable. The two report different collectors as well, `'cs` against `'3m`, and the thread and I/O layers that Racket CS reimplemented are exactly the layers a concurrent program spends its time in. A program that cares about parallelism or about allocation behavior is a program that can tell which runtime it is on.

> [!warning] The part that was least predictable
> The authors name the hardest problem, and it is not the compiler. Whether and how to manage mismatches between Chez Scheme and Racket was the least predictable part of the effort. The two implement similar languages, but "similar" is where the cost lives: every place the semantics diverge slightly is a decision about whether to patch Chez, emulate Racket in the compatibility layer, or change Racket and break someone. That is the general lesson for any project that rebuilds a system on a close-but-not-identical foundation. The port of the parts that differ obviously is scheduled work. The port of the parts that look the same is where the schedule goes.

## Related Notes

- [[cs/languages/Racket/proper-tail-calls-and-the-loop-question|Proper Tail Calls and the Loop Question]] - the control-model requirement that disqualified most host VMs
- [[cs/languages/Racket/the-numeric-tower|The Numeric Tower]] - the arithmetic requirement that disqualified the rest
- [[cs/pl/intermediate-representations-and-ssa|Intermediate Representations and SSA]] - the linklet as the seam that made a backend swap possible
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - BC's JIT versus compiling through the Chez compiler
- [[cs/history/gnu-stallman-and-free-software|GNU, Stallman, and Free Software]] - the open-sourcing of Chez Scheme in 2016 as the precondition
- [[cs/languages/Racket/futures-places-and-real-parallelism|Futures, Places, and Real Parallelism]] - where the CS and BC difference is directly observable

## Sources

- "Rebuilding Racket on Chez Scheme (Experience Report)," Flatt et al., ICFP 2019. https://www.cs.utah.edu/plt/publications/icfp19-rddkmstz.pdf . Supports Racket starting in 1995 as a fusion of two off-the-shelf C/C++ libraries, the 1.2M lines of Racket supported by roughly 200k lines of C, the fixed-size call stack and tail-call criticisms of mainstream VMs, the absence of arbitrary-precision arithmetic on those machines, Chez Scheme becoming open source in mid-2016, Chez having a small C kernel but being mostly implemented in Scheme, the compatibility layer and the C-implemented `rktio` layer, the expander being the same implementation in both columns, the macro expander producing linklet forms, schemify converting a linklet to a Chez Scheme lambda, mismatch management being the least predictable part of the effort, and the summary that DrRacket runs and nearly all of the core test suite passes.
- "Racket-on-Chez Status: February 2020," Matthew Flatt, Racket blog. https://blog.racket-lang.org/2020/02/racket-on-chez-status.html . Supports Racket CS being ready for production use, passing all main-distribution tests with much reduced compile and run time differences, performing about the same as BC while typically using more memory due to larger code sizes, improvement coming from many small changes that add up, and much of the benchmark improvement coming from the newly implemented thread and I/O layers.
- "19.2 Racket Virtual Machine Implementations," The Racket Guide. https://docs.racket-lang.org/guide/performance.html . Supports CS being the current default built on Chez Scheme and performing better than BC for most programs, `(system-type 'vm)` reporting `'chez-scheme` and `'racket`, and BC being the older implementation that was the default until version 8.0 with a C compiler and runtime, a precise garbage collector, and a JIT on most platforms.
