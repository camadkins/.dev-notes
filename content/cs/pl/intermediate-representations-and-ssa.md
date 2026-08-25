---
title: Intermediate Representations & SSA
description: "Why compilers translate into a language nobody writes, and why giving every variable exactly one definition is the single change that makes optimization tractable."
draft: false
comments: true
tags:
  - cs
  - pl
  - compilers
  - optimization
date: 2026-06-24
updated:
aliases:
  - SSA
---

A compiler with `m` source languages and `n` targets would need `m * n` translators if each went straight from one to the other. Routing everything through a shared middle language turns that into `m + n`. That is the practical argument for an intermediate representation, and it is the smaller half of the story.

The larger half is that the middle language can be *designed*, and the right design makes analyses that were hard become trivial.

> [!note] The idea
> An IR is chosen for what it makes easy to prove, not for what it makes easy to write. SSA's single rule, that every variable is assigned exactly once, converts the question "where did this value come from" from a whole-program dataflow analysis into a pointer lookup. The cost of that rule is one new construct, the Φ function, needed exactly at the points where control paths merge.

## What an IR is for

An intermediate representation is the data structure or code used internally by a compiler or virtual machine to represent source code, designed to be conducive to further processing such as optimization and translation. A good IR must be **accurate**, capable of representing the source without loss of information, and **independent** of any particular source or target language. It may be an in-memory data structure, or a tuple- or stack-based code readable by the program, in which case it is also called an intermediate language.

Using an IR is what lets compiler systems like GCC and LLVM serve many different source languages and generate code for many different target architectures.

An intermediate language is the language of an [[cs/pl/abstract-machines-cek-secd|abstract machine]] designed to aid program analysis, and its design typically differs from a real machine language in three ways: each instruction represents exactly one fundamental operation, so composite addressing modes like shift-add are absent; control flow information may not be in the instruction set; and the number of registers available may be large, even limitless. A popular format is three-address code.

Not every intermediate language is purpose-built. C's nature as an abstraction of assembly and its ubiquity as the de facto system language made it a popular target for Eiffel, Sather, Esterel, some Lisp dialects, Nim, Cython, Vala, and others. [[cs/languages/Java/the-class-file-and-classloading|Java bytecode]] and the [[cs/languages/CSharp/the-il-and-the-jit|Common Intermediate Language]] are intermediate languages too, the latter designed to be shared by all .NET compilers before static or dynamic compilation to machine code.

## The single-assignment rule

Static single assignment form is a type of IR where each variable is assigned exactly once. It is used in most high-quality optimizing compilers for imperative languages, including LLVM, GCC, and many commercial compilers.

Conversion splits existing variables into versions, new variables typically written as the original name with a subscript, so that every definition gets its own version. Additional statements assigning to new versions may need to be introduced at the join point of two control flow paths. Both directions are efficient: there are efficient algorithms for converting into SSA, and converting from SSA to machine code is also efficient.

The gain is immediate. Consider:

```
y := 1
y := 2
x := y
```

A human sees that the first assignment is unnecessary and that the `y` used on line three comes from the second assignment. A compiler would have to run reaching-definition analysis to establish that. In SSA both facts are immediate:

```
y1 := 1
y2 := 2
x1 := y2
```

SSA makes numerous analyses easier, such as determining use-define chains, because when looking at a use of a variable there is only one place where it may have received a value. Most optimizations can be adapted to preserve SSA form, so one optimization can run after another with no additional analysis, and the SSA-based versions are usually more efficient and more powerful than their non-SSA predecessors.

The list of optimizations enabled or strongly enhanced by SSA is the reason it took over: constant folding, value range propagation, sparse conditional constant propagation, dead-code elimination, global value numbering, partial-redundancy elimination, strength reduction, and register allocation.

## Φ functions, and where they go

The rule breaks at merges. If one branch assigns `y1` and the other assigns `y2`, a use in the block below could refer to either, depending on which path control took.

![A diamond control-flow graph where two branches define y1 and y2 and the merge block introduces a phi function](cs/pl/assets/ssa-phi-merge.svg)

The fix is a special statement inserted in the merge block, a **Φ (Phi) function**, which generates a new definition `y3` by choosing either `y1` or `y2` depending on past control flow. The block below can then simply use `y3`. No Φ is needed for a variable with only one version reaching the point, since Φ(x2, x2) = x2.

> [!warning]
> Φ functions are not implemented as machine operations on most machines. A compiler can implement one by inserting move operations at the end of every predecessor block, though those moves may not survive register allocation. That approach can fail when simultaneous operations are speculatively producing inputs to a Φ function, as on wide-issue machines, which typically have a selection instruction the compiler uses instead.

Deciding where the Φ functions go is the hard part, and it has an efficient solution built on **dominance frontiers**. Node A strictly dominates node B if it is impossible to reach B without passing through A first; A dominates B if it strictly dominates B or A = B. The dominance frontier of A is the set of nodes B that A does not strictly dominate but where A dominates some immediate predecessor of B. Those are exactly the points where multiple control paths merge back into one, and therefore exactly where Φ functions are needed. Variables defined in a dominator need none, since only one definition can apply. The efficient algorithm for computing dominance frontiers was described by Cytron, Ferrante, Rosen, Wegman, and Zadeck in 1991.

## Where SSA came from

SSA was developed in the 1980s by several researchers at IBM. A 1986 paper by Cytron, Lowry, and Zadeck introduced birthpoints, identity assignments, and variable renaming such that variables had a single static assignment. A 1987 paper by Cytron and Ferrante proved that this renaming removes all false dependencies for scalars. In 1988, Barry Rosen, Mark N. Wegman, and Kenneth Zadeck replaced the identity assignments with Φ-functions, introduced the name "static single-assignment form", and demonstrated a now-common SSA optimization. The name Φ-function was chosen by Rosen as a more publishable version of "phony function". In 1989, Rosen, Wegman, Zadeck, Cytron, and Ferrante found an efficient means of converting programs to SSA form.

## LLVM as the working example

LLVM is a Static Single Assignment based representation providing type safety, low-level operations, flexibility, and the capability of representing all high-level languages cleanly, and it is the common code representation used throughout all phases of the LLVM compilation strategy. The same representation exists in three equivalent forms: an in-memory compiler IR, an on-disk bitcode representation suitable for fast loading by a JIT, and a human-readable assembly language.

The design goal is stated plainly in the reference: LLVM aims to be a universal IR by being low-level enough that high-level ideas map cleanly onto it, while remaining typed so it can itself be the target of optimizations. The example given is [[cs/languages/Go/escape-analysis-and-stack-allocation|pointer analysis]] proving that a C automatic variable is never accessed outside its function, allowing promotion from a memory location to a simple SSA value.

An LLVM function definition contains a list of basic blocks forming the control flow graph, each block a list of instructions ending in a terminator such as a branch or return. The Φ node appears as a real instruction:

> [!example] A loop counter in LLVM IR
> ```llvm
> Loop:       ; Infinite loop that counts from 0 on up...
>   %indvar = phi i32 [ 0, %LoopHeader ], [ %nextindvar, %Loop ]
>   %nextindvar = add i32 %indvar, 1
>   br label %Loop
> ```
>
> The `phi` instruction implements the φ node in the SSA graph of the function. It takes a list of pairs, one for each predecessor basic block of the current block, and at runtime logically takes on the value specified by the pair corresponding to the predecessor that executed just prior. Here `%indvar` is `0` on entry from `%LoopHeader` and the previous increment on every iteration from `%Loop`.
>
> PHI instructions must come first in a basic block, with no non-phi instructions before them. For the purposes of SSA, each incoming value's use is deemed to occur on the edge from its predecessor block to the current block, not inside the block.

SSA is also what makes LLVM's notion of well-formedness checkable. `%x = add i32 1, %x` parses fine but is not well formed, because the definition of `%x` does not dominate all of its uses, and a verification pass run automatically by the parser and by the optimizer catches it.

> [!tip]
> Functional-language compilers for Scheme and ML generally use [[cs/pl/continuations-cps|continuation-passing style]] instead. SSA is formally equivalent to a well-behaved subset of CPS excluding non-local control flow, so optimizations formulated in one generally apply to the other. CPS is more natural for higher-order functions and interprocedural analysis and easily encodes `call/cc`, which SSA does not.

## Related Notes

- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]]
- [[cs/pl/continuations-cps|Continuations & CPS]]
- [[cs/pl/abstract-machines-cek-secd|Abstract Machines: CEK and SECD]]
- [[cs/pl/operational-semantics-big-step-small-step|Operational Semantics]]
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding & Closures]]
- [[cs/pl/levels-of-artificial-languages|Levels of Artificial Languages]]

## Sources

- "Intermediate representation," Wikipedia. https://en.wikipedia.org/wiki/Intermediate_representation . Backs the definition of an IR and the accuracy and independence criteria, its possible forms including intermediate languages, the role of an IR in letting GCC and LLVM serve many source languages and targets, the three ways an intermediate language differs from a machine language, three-address code, and the use of C, Java bytecode, and the Common Intermediate Language as intermediate languages.
- "Static single-assignment form," Wikipedia. https://en.wikipedia.org/wiki/Static_single-assignment_form . Backs the definition of SSA and its adoption in LLVM and GCC, versioned variables and join-point statements, the efficiency of conversion in both directions, the `y := 1; y := 2; x := y` example and the use-define chain argument, the list of SSA-enabled optimizations, the Φ function at merge points and the Φ(x2, x2) case, the implementation of Φ via predecessor moves and the wide-issue caveat, dominance and dominance frontiers as the placement criterion, the Cytron et al. 1991 algorithm, the IBM development history through the 1988 naming and the "phony function" origin, and the formal SSA/CPS correspondence.
- "LLVM Language Reference Manual," LLVM. https://llvm.org/docs/LangRef.html . Backs LLVM as an SSA-based representation used throughout all phases of compilation, the three equivalent forms, the universal-IR design goal and the promotion of a C automatic variable to an SSA value via pointer analysis, functions as lists of basic blocks ending in terminators, the well-formedness example where `%x` does not dominate its uses, and the `phi` instruction's syntax, argument structure, first-in-block requirement, edge-based use semantics, runtime behavior, and loop-counter example.
