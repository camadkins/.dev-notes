---
title: Typed-Untyped Boundaries and Contract Generation
description: "Compiling a type into a contract at the module boundary, who gets blamed when the contract fires, and the types the compiler cannot translate at all."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-27
updated:
aliases:
  - Contract Generation
  - require/typed Contracts
  - Typed Racket Boundary Cost
---

A type annotation in Typed Racket has two careers. In typed code it is an input to the checker and disappears after compilation. At a boundary with untyped code it becomes something else: a contract, generated automatically, installed in the compiled module, and running on every value that crosses. Understanding the second career explains three things that otherwise look unrelated, which are certain type errors that mention contracts, blame messages naming an interface rather than a module, and programs that slow down when you add types to them.

> [!note] The idea
> The types-to-contracts step is a **compiler pass with a partial function as its specification**. Not every Typed Racket type has a contract that expresses it, so the pass can fail, and when it fails you get a compile-time error at the `require/typed` line rather than a weaker check at run time. That is the design choice worth noticing: rather than let an unenforceable type silently become an unenforced one, Racket refuses to compile the boundary. The price is that a perfectly valid type can be unusable at exactly the place you most wanted it.

## What gets installed, and where

When interoperating with untyped code, contracts are installed between typed and untyped modules. The unit is the boundary, not the value and not the module: a value that never crosses is never wrapped, and a value that crosses repeatedly is checked repeatedly.

For the ordinary case none of this needs stating, because Typed Racket provides types for most of the bindings provided by `#lang racket`, so `require/typed` is unnecessary for the standard library. You reach for it when importing something Racket does not already have a type for, which in practice means your own untyped modules and third-party packages.

There is a quieter case that catches people. Functions defined in Typed Racket that are used at compile time in other typed or untyped modules are type-checked and then protected with contracts, the same as any other export. A helper you wrote for a macro to call during expansion is a boundary crossing too, and pays the same toll.

## Blame names the interface

When the generated contract fires, the error is a normal Racket contract violation:

```
increment: broke its own contract
  promised: exact-integer?
  produced: "this is broken"
  in: (-> any/c exact-integer?)
  contract from: (interface for increment)
  blaming: (interface for increment)
```

Because the implementation in the untyped module broke the contract by returning a string instead of an integer, the error message blames it. Two details in that message are worth reading closely.

First, the party is `(interface for increment)`, not a filename. The contract was not written by either module. It was synthesized from the `require/typed` clause, so the blame party is the generated interface standing between them, which is the honest answer about who made the promise.

Second, the contract printed is `(-> any/c exact-integer?)` and not `(-> exact-integer? exact-integer?)`. The domain became `any/c`. That is correct: the argument came *from* typed code, where the checker already proved it was an integer, so re-checking it on the way in would be redundant. The type is enforced only in the direction where enforcement is needed. Contract generation is doing real work here rather than transliterating, and the two-channel structure it is exploiting is the ordinary caller-versus-callee split from [[cs/languages/Racket/contracts-and-blame|contracts and blame]].

## Types that cannot be compiled

When a typed module requires bindings from an untyped module or vice versa, there are some types that cannot be converted to a corresponding contract. The Guide gives three reasons: a type is not yet supported in the contract system, Typed Racket's contract generator has not been updated, or the contract is too difficult to generate.

The example is `object-name`, whose real behavior is genuinely case-dependent:

```racket
(require/typed racket/base
  [object-name (case-> (-> Struct-Type-Property Symbol)
                       (-> Regexp (U String Bytes)))])
```

This fails to compile with a message that the function type has two cases of arity one. The type itself is fine. As the Guide puts it, this function type by cases is a valid type, but a corresponding contract is difficult to generate because the check on the result depends on the check on the domain, and in the future this may be supported with dependent contracts.

Sit with that reason for a moment. A contract sees one call at a time and must decide what to check on the way out based on what it saw on the way in. Dependency between the two is exactly what `->i` provides, and it is the expensive combinator precisely because it must delay evaluating the range contract until the arguments are known. The type system has no such difficulty, because it reasons about the case analysis statically. The gap between what a type can say and what a runtime check can enforce is the whole subject, and it opens first at the dependent cases.

The workaround is to widen: a more approximate type will work for this case, but with a loss of type precision at use sites. `(-> (U Struct-Type-Property Regexp) (U String Bytes Symbol))` compiles, and every caller now has to handle a wider result than it will actually receive.

The other documented failure is more fundamental. `define-predicate` also involves contract generation, so some types cannot have predicates generated for them, and asking for `(define-predicate p? (All (A) (Listof A)))` reports that it cannot generate a contract for a non-function polymorphic type. A predicate is a one-shot test on a value already in hand, and there is nothing about a list of unknown element type to test. Enforcing parametricity dynamically requires the wrapper machinery of [[cs/languages/Racket/parametric-polymorphism-through-contracts|parametric contracts]], which needs a function application to wrap around. No application, no enforcement.

## The cost, and where it lands

Contract boundaries installed for typed-untyped interaction may cause significant slowdowns. That sentence is in the caveats section of the Guide, unhedged. The optimization section is equally blunt: contracts can have significant overhead, so typed-untyped boundary crossings should be avoided in performance-sensitive code.

The important word is *crossings*. The cost is not a property of having types and not a property of the value's size. It is paid per crossing, which means the fix is almost never to remove types and almost always to move the boundary so that fewer values cross it in a hot path. A typed inner loop calling an untyped helper pays on every iteration; the same two modules with the helper's typed wrapper hoisted out of the loop pay once. Boundary placement here is a design decision of the sort discussed in [[cs/software-engineering/coupling-and-cohesion|coupling and cohesion]], with an unusually literal price attached: the seams you cut your program along are the ones you will be billed for.

> [!tip] Measure before you move it
> The Guide's advice for a program suspected of paying too much at a boundary is not to guess but to use the contract profiler, installed with `raco pkg install contract-profile`. It attributes runtime cost to individual contracts, which turns "typed code got slower" into a ranked list of boundaries. The optimizer keeps its own channel, logging events under the topic `TR-optimizer`, so you can see which optimizations fired as well as which contracts cost you. Both are ordinary applications of the principle in [[cs/software-engineering/observability-logging-metrics-tracing|observability]]: the system emits attribution, and you read it rather than reasoning about it from first principles.

## Reading a boundary error correctly

The practical skill this note is aimed at is telling three superficially similar failures apart. A message at the `require/typed` line saying a type could not be converted to a contract is a *compile-time* failure of the generator, fixed by widening the type. A contract violation blaming an interface at run time is a genuine mismatch, where the untyped code does not do what its declared type says. And a program that is merely slow has neither of those problems; it has a boundary in the wrong place. Only the second is a bug in the sense of a wrong answer. The other two are the type system telling you something about the shape of your program.

## Related Notes

- [[cs/languages/Racket/typed-racket-and-gradual-typing|Typed Racket and Gradual Typing]] - why the boundary is contracted at all, and the Deep, Shallow, and Optional alternatives
- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame in Racket]] - the mechanism the generator emits into, and the two-party model behind the blame message
- [[cs/languages/Racket/parametric-polymorphism-through-contracts|Parametric Polymorphism Through Contracts]] - what dynamic enforcement of a polymorphic type actually requires
- [[cs/software-engineering/coupling-and-cohesion|Coupling and Cohesion]] - boundary placement as the lever, since the cost is charged per crossing
- [[cs/software-engineering/observability-logging-metrics-tracing|Observability, Logging, Metrics, and Tracing]] - the contract profiler and optimizer log as attribution rather than guesswork
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - a partial compiler pass, and what it means for one to reject valid input

## Sources

- "8 Caveats and Limitations," The Typed Racket Guide. https://docs.racket-lang.org/ts-guide/caveats.html . Supports some types being unconvertible to a corresponding contract across a typed-untyped require, the three stated reasons for that failure, the `object-name` `case->` example and its explanation that the result check depends on the domain check with dependent contracts as a possible future fix, the approximate-type workaround costing precision at use sites, `define-predicate` involving contract generation with the non-function polymorphic type failure, contract boundaries causing significant slowdowns, and compile-time uses of typed functions being type-checked and then contract-protected.
- "7 Optimization in Typed Racket," The Typed Racket Guide. https://docs.racket-lang.org/ts-guide/optimization.html . Supports contracts being installed between typed and untyped modules, contracts having significant overhead so boundary crossings should be avoided in performance-sensitive code, Typed Racket already providing types for most `#lang racket` bindings, the contract profiler and its `raco pkg install contract-profile` invocation, and the optimizer logging under the `TR-optimizer` topic.
- "6 Typed-Untyped Interaction," The Typed Racket Guide. https://docs.racket-lang.org/ts-guide/typed-untyped-interaction.html . Supports the `increment` contract violation message with its `(interface for increment)` blame party and `(-> any/c exact-integer?)` contract, and the untyped implementation being blamed for returning a string instead of an integer.
