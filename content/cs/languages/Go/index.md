---
title: Go
description: Landing page for Go. Twelve years of refusing generics, then a middle path between erasure and monomorphization, plus the concurrency and runtime model underneath it.
draft: false
comments: false
tags:
  - cs
  - languages
date: 2026-08-21
updated:
aliases: []
---

Go is the most instructive answer in this section because it is the one that was argued about in public for twelve years before it shipped. The refusal was never hostility to the feature. It was a cost argument: the team held that every known implementation made either the programmer, the compiler, or the runtime pay too much, and declined to pick until it found a bargain it liked. What arrived in 1.18 is neither erasure nor full monomorphization. The compiler emits one copy per garbage-collection shape and passes a dictionary for the rest, which quantizes types by properties the allocator already tracks.

That middle path is the reason this folder sits between [[cs/languages/Java/generics-and-type-erasure|Java erasure]] and [[cs/languages/CSharp/generic-specialization-and-code-sharing|CLR specialization]] in the comparison at [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]]. Theory stays in [[cs/pl/index|Programming Language Concepts]].

### The refusal, and the design that ended it

- [[cs/languages/Go/why-go-waited-and-what-changed|Why Go Waited, and What Changed]] - a cost argument, and a design that won by reinterpreting a construct Go already had
- [[cs/languages/Go/type-parameters-and-constraints|Type Parameters and Constraints]] - a parameter list moved one level up, with syntax forced by the parser rather than chosen
- [[cs/languages/Go/constraint-interfaces-and-type-sets|Constraint Interfaces and Type Sets]] - operator constraints without a constraint language, by redefining an interface as a set of types
- [[cs/languages/Go/comparable-ordered-and-the-constraint-library|comparable, Ordered, and the Constraint Library]] - one of these is enforced by the compiler and the other is a hand-maintained list

### How it compiles

The middle path, priced.

- [[cs/languages/Go/generics-implementation-gc-shape-stenciling|Generics Implementation: GC Shape Stenciling]] - one copy per collector shape rather than one per type
- [[cs/languages/Go/dictionaries-and-what-they-cost|Dictionaries and What They Cost]] - the hidden first argument, and the two costs that are not the table lookup
- [[cs/languages/Go/type-inference-in-go|Type Inference in Go]] - two unification-based mechanisms, both deliberately weak

### The deliberate omissions

The interesting half of the proposal is the list of things it refused to add.

- [[cs/languages/Go/what-generics-deliberately-left-out|What Generics Deliberately Left Out]] - the omissions list is the design, and the one item that has since moved shows the price of the rest
- [[cs/languages/Go/generics-versus-interfaces-when-to-use-which|Generics versus Interfaces: When to Use Which]] - the deciding question is whether the code is identical for all types, and speed is not a tiebreaker

### Interfaces, which came first

Go had an answer to polymorphism for twelve years before it had type parameters, and it is a different answer.

- [[cs/languages/Go/interfaces-and-implicit-satisfaction|Interfaces and Implicit Satisfaction]] - conformance the compiler computes, and the nil trap that falls out of the representation
- [[cs/languages/Go/the-empty-interface-any-and-type-assertions|The Empty Interface, any, and Type Assertions]] - the pre-generics escape hatch, and why an assertion is an identity check rather than a cast

### Concurrency and the runtime

- [[cs/languages/Go/goroutines-and-the-scheduler|Goroutines and the Scheduler]] - G, M, and P, growable stacks, work stealing, and preemption by signal
- [[cs/languages/Go/channels-and-select|Channels and select]] - a synchronization primitive that happens to carry data, and the four things `select` promises
- [[cs/languages/Go/the-go-memory-model|The Go Memory Model]] - happens-before as a transitive closure, and a deliberate refusal to make racy programs fully undefined
- [[cs/languages/Go/escape-analysis-and-stack-allocation|Escape Analysis and Stack Allocation]] - where a value lives is the output of a proof that may fail in the safe direction
- [[cs/languages/Go/the-go-garbage-collector|The Go Garbage Collector]] - concurrent tri-color marking, a write barrier that is usually off, and a pacer that conscripts the allocator

### The rest of the language

- [[cs/languages/Go/slices-arrays-and-the-append-aliasing-trap|Slices, Arrays, and the append Aliasing Trap]] - a three-word header, and a reallocation decision the language declines to make visible
- [[cs/languages/Go/maps-and-randomized-iteration-order|Maps and Randomized Iteration Order]] - Swiss Tables underneath, and iteration order made actively unstable on purpose
- [[cs/languages/Go/range-over-func-iterators|Range Over Func Iterators]] - an iterator as a callback taking `yield`, with traversal state on the call stack
- [[cs/languages/Go/errors-as-values-wrapping-and-errors-is|Errors as Values, Wrapping, and errors.Is]] - a library rather than a language feature, and the tree that `Is` and `As` walk
- [[cs/languages/Go/defer-panic-and-recover|defer, panic, and recover]] - a runtime stack attached to the goroutine, which explains every surprising rule
- [[cs/languages/Go/modules-and-the-import-path|Modules and the Import Path]] - minimal version selection refusing to be a solver, and a path resolved by indirection

### Read from the comparative layer

- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - the axis, with Go in the middle of it
- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] - Go's position stated against exceptions
- [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]] - where each language puts the data-race problem
- [[cs/languages/common/module-systems-and-namespacing|Module Systems and Namespacing]] - path-addressed modules against compile-time trees

---

*Any pages placed under this folder are auto-listed below by Quartz.*
