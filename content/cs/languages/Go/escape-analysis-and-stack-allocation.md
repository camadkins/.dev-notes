---
title: "Escape Analysis and Stack Allocation"
description: "Where a Go value lives is not a language rule but the output of a conservative data-flow proof, and the proof is allowed to fail in the safe direction."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-08-11
updated:
aliases: []
---

Ask a C programmer where a variable lives and the answer is in the declaration. `int x` is on the stack, `malloc` returns heap. Ask a Go programmer and the honest answer is that the compiler decided, the decision is not in the specification, and it may change when you upgrade your toolchain.

That sounds like a gap in the language. It is the design.

> [!note] The idea
> Escape analysis is a **proof obligation, not a classification**. The compiler tries to prove that no pointer to a value can outlive the frame it sits in. If the proof succeeds, the value stays on the stack. If the proof fails, for any reason including the analysis simply not being clever enough, the value goes to the heap. Failure is safe and merely costs an allocation, while a wrong success would produce a dangling pointer. The asymmetry is the whole design, and it is why the answer to "does this escape" is a property of a specific compiler version rather than of your source code.

## What the language refuses to say

The FAQ opens its answer by declining the question. "The storage location chosen by the implementation is irrelevant to the semantics of the language." A variable in Go exists as long as something references it, and nothing observable depends on where the bytes are.

Then it says what the implementation does. "When possible, the Go compilers will allocate variables that are local to a function in that function" stack frame. The exception is stated as a failure of proof, not as a rule about which constructs allocate: "if the compiler cannot prove that the variable is not referenced after the function returns, then the compiler must allocate the variable on the garbage-collected heap to avoid dangling pointer errors."

Read that sentence in the negative and you get the safety property. Go has no [[cs/security/use-after-free-and-heap-exploitation|use-after-free]] because there is no path by which a live pointer can name a dead frame. A language with manual memory management makes that the programmer's obligation. Rust makes it a typing obligation, checked by the borrow rules that [[cs/pl/ownership-and-linear-types|linear types]] formalize, with the answer visible in the signature. Go makes it a compiler obligation, discharged invisibly, and pays for the cases the compiler cannot see by allocating.

Size is the second reason, and it is a pure performance judgment: "Also, if a local variable is very large, it might make more sense to store it on the heap rather than the stack." Goroutine stacks start small and grow, so a large frame is expensive in a way it would not be with a fixed multi-megabyte thread stack. The [[cs/languages/Go/goroutines-and-the-scheduler|growable stack]] design and the escape decision are pulling on the same rope.

## The analysis, concretely

The compiler's own description of the pass names two invariants: "pointers to stack objects cannot be stored in the heap," and "pointers to a stack object cannot outlive that object." Everything else is machinery for deciding those two questions.

The machinery is a graph problem. "We implement this with a static data-flow analysis of the AST." The compiler builds a directed weighted graph in which vertices, called locations, stand for variables allocated by statements and expressions, and edges stand for assignments. The weights are the clever part: "The number of dereference operations minus the number of addressing operations is recorded as the edge" weight. So `p = &q` is an edge of weight -1, `p = q` is 0, `p = *q` is 1. Taking an address moves you one step down; dereferencing moves you one step up. Because `&x` is not itself addressable, weights cannot go below -1.

The pass then walks the graph looking for paths that violate the invariants. If a variable's address is "stored in the heap or elsewhere that may outlive it, then v is marked as requiring heap allocation." Function boundaries are handled by summarizing each function's parameter-to-result and parameter-to-heap flows into parameter tags, "which are used at static call sites to improve escape analysis of function arguments." That is what makes the analysis interprocedural without requiring whole-program compilation.

## Deliberate imprecision

Here is the part that explains most surprising escape reports. The lowering into this graph is "generally without sensitivity to flow, path, or context; and without distinguishing elements within a compound variable." A struct is one vertex, not one per field. A slice is one vertex, not one per element. The compiler's own example is blunt:

```go
var x struct { f, g *int }
var u []*int
x.f = u[0]
```

is modeled simply as `x = *u`. The pass does not separate `x.f` from `x.g`, or `u[0]` from `u[1]`. It does keep the implicit dereference that indexing a slice performs, because that is a weight and weights are the thing it reasons about.

Field insensitivity means one escaping field drags the whole struct to the heap. Flow insensitivity means a pointer that escapes on a branch you never take still escapes. Both are conservative, which is to say both err toward the heap. Neither can produce an unsound stack allocation, and that is the only property that has to hold.

> [!warning] Do not build a mental rule set
> The runtime guide says outright that trying to enumerate the escaping cases is a mistake: "It would be fragile and difficult to try to enumerate precisely when values escape: the algorithm itself is fairly sophisticated and changes between Go releases." Folklore like "returning a pointer always heap-allocates" or "interface conversion always allocates" is a snapshot of one version's precision, not a language property. Values also escape for reasons unrelated to pointers, for example when "its size is dynamically determined," as with a slice whose length comes from a variable. And escape is transitive: writing a reference into something already escaping makes the referent escape too.

## Asking instead of guessing

Because the answer is version-specific, the workflow is to ask the compiler rather than to reason about it. It will tell you: "the Go compiler has the ability to describe why it decides to escape a Go value to the heap," through a debug flag "that describes all optimizations it applied or did not apply to some package in a text format." `go build -gcflags=-m=3` prints the decisions and the reason for each. Editors with Go language-server support surface the same data as an inline overlay.

The payoff is measured in GC pressure rather than in allocation cost alone. A value that stays in the frame is reclaimed by moving the stack pointer, at a cost the compiler can compute at compile time. A value that escapes joins the population the collector has to trace, so it costs an allocation now and a share of every future mark cycle. Restructuring a hot function to keep one buffer in the frame removes work from a subsystem that runs concurrently with everything else, which is why escape analysis output is usually the first thing to read after a heap profile rather than the last.

## Related Notes

- [[cs/systems/memory-allocators-and-fragmentation]] - what the heap actually is, and the cost the compiler is trying to avoid paying
- [[cs/security/use-after-free-and-heap-exploitation]] - the failure mode the two invariants exist to make unreachable
- [[cs/pl/ownership-and-linear-types]] - the same lifetime question answered in the type system, where the programmer can see it
- [[cs/languages/Go/the-go-garbage-collector]] - the subsystem that inherits every value the analysis could not keep in a frame
- [[cs/languages/Go/goroutines-and-the-scheduler]] - small growable stacks, which change the arithmetic on large local values
- [[cs/languages/CSharp/value-types-structs-and-boxing]] - a runtime that draws the stack and heap line by declared type instead of by analysis

## Sources

- [Go Frequently Asked Questions](https://go.dev/doc/faq) - storage location as semantically irrelevant, the proof-failure rule, dangling pointers, large locals, and address-taking as a heap candidate
- [A Guide to the Go Garbage Collector](https://go.dev/doc/gc-guide) - stack allocation on the goroutine stack, escape as an inability to determine lifetime, dynamic sizing, transitivity, version-dependence, and the compiler diagnostic flag
- [cmd/compile/internal/escape/escape.go](https://go.dev/src/cmd/compile/internal/escape/escape.go) - the two invariants, the AST data-flow formulation, deref-minus-address edge weights, parameter tags, and the deliberate flow and field insensitivity
