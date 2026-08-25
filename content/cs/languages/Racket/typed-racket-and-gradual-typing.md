---
title: Typed Racket and Gradual Typing
description: "What a typed module actually buys, how typed and untyped code mix, and why enforcing the annotations at run time is what separates this from an optional checker."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-19
updated:
aliases: []
---

Most gradual type systems answer one question: does this program pass the checker? Typed Racket answers a second one that the first does not imply: if the checker said yes, is the running program allowed to violate what it proved? In `#lang typed/racket` the answer is no, and the machinery that makes it no is where the language stops resembling every other optional type layer bolted onto a dynamic language.

Typed Racket is Racket's gradually-typed sister language, allowing the incremental addition of statically-checked type annotations. The word doing the work in that sentence is *incremental*: the unit of typing is the module, not the program, so a codebase converts one file at a time and the two halves have to coexist while it does.

> [!note] The idea
> A type annotation in Typed Racket is not only a claim the checker verifies, it is a claim the runtime enforces on everything the checker could not see. When a typed module and an untyped module exchange a value, the type compiles to a contract at that boundary. The static proof therefore holds for the whole program rather than only for the typed part, and that is precisely what licenses the type-driven optimizer to remove checks: an unchecked assumption can no longer reach the optimized code. The three languages Racket ships, Deep, Shallow, and Optional, are three positions on how much of that enforcement you are willing to pay for, and shipping all three admits the cost instead of hiding it.

## The two directions are not symmetric

Typed code importing untyped code has to say what it expects. `require/typed` names each binding and its type, and the annotation is mandatory because the untyped module never declared one:

```racket
#lang typed/racket
(require/typed "distance.rkt"
  [#:struct pt ([x : Real] [y : Real])]
  [distance (-> pt pt Real)])
```

The `#:struct` clause imports a structure type and lets you use it as if it had been defined with Typed Racket's own `struct` form. `#:opaque` handles the case where the untyped module exports a predicate but no struct: it defines a new type from that predicate, so `[#:opaque Point point?]` makes `Point` mean exactly the values for which `point?` returns true. A typed module should not use `require/typed` to import from another typed module, where plain `require` works.

The other direction needs no work at all. If an untyped module requires a typed module, it can use the bindings as expected. There is one documented exception, and it is sharp: macros defined in typed modules may not be used in untyped modules, because such uses can circumvent the protections of the type system. A macro is code that runs during expansion in the *importing* module's context, and a typed macro dropped into untyped code would splice type-checked-looking expansions into a place where nothing checks them. That the restriction exists at all is a good indication of how seriously the enforcement is meant.

The same seriousness produces one blunt limitation worth knowing before you plan a port: Typed Racket currently does not support [[cs/languages/Racket/generic-interfaces-and-gen-colon|generic interfaces]]. The dispatch mechanism most modern Racket libraries use for protocols has no type-level story yet.

## Why the boundary needs a contract at all

The Guide makes the argument with a two-module program. An untyped module defines `increment` and gets it wrong, returning a string. A typed module imports it at `(-> Integer Integer)` and calls it. Every use of `increment` in the typed module is correct under the assumption that the function upholds that type, and the implementation does not uphold it.

A checker alone cannot catch this. The checker never saw the untyped module, and by construction never will. So by default, Typed Racket establishes contracts wherever typed and untyped code interact to ensure strong types, and the failure surfaces as a contract violation blaming the interface for `increment` rather than as garbage propagating into typed code. This is the ordinary boundary-and-blame model from [[cs/languages/Racket/contracts-and-blame|contracts and blame]], with the contracts generated from types instead of written by hand.

The payoff is stated directly in the same section: Deep Typed Racket checks all values passing between typed and untyped modules with contracts, which means Typed Racket can safely optimize programs with the assurance that the program will not segfault due to an unchecked assumption. Soundness here is not an aesthetic preference about type systems, in the sense discussed in [[cs/pl/type-soundness-progress-preservation|type soundness]]. It is the enabling condition for an optimizer that deletes runtime checks. Delete a check on the strength of a type, and the type had better be true.

Note also what the model does *not* charge for: no contract overhead is ever incurred for uses of typed values from another Deep-typed module. The cost is a boundary cost, not a typing cost, which means it scales with how mixed your program is rather than with how much of it is typed. That makes the module the meaningful unit here in the same way it is in [[cs/pl/modules-signatures-and-separate-compilation|module systems with signatures]]: the signature is what gets checked, and crossing it is what costs.

## Three enforcement levels, named honestly

Contracts can have a non-trivial performance impact, especially with first-class functions or other higher-order data such as vectors, and Racket's response was to ship the weaker options rather than quietly weaken the default.

**Deep** is the default: rigorous contract checks, full guarantees, maximum optimization. Use it for tightly-connected groups of typed modules, and avoid it when untyped higher-order values frequently cross into typed code.

**Shallow** (`typed/racket/shallow`) replaces contracts with shape checks. A shape check ensures a value matches the top-level constructor of a type. It is always a yes-or-no predicate rather than a wrapper, and typically runs in constant time. The same broken `increment` still gets caught, by a check placed after the call rather than by a wrapper around the function. The tradeoffs are stated plainly: the number of shape checks in a module grows in proportion to its size, and shallow types are only enforced in their immediate, local context.

**Optional** (`typed/racket/optional`) does nothing at run time. Optional types do not ensure safe typed-untyped interactions, cannot detect incorrect type assumptions, and therefore do not enable type-driven optimizations, but they also add no costs. The broken `increment` call simply returns the string.

> [!warning] Optional is the model most gradual typing actually ships
> Read that third bullet again and it describes [[cs/languages/Python/type-hints-and-gradual-typing|Python's type hints]] exactly: annotations the checker reads and the interpreter ignores, with no runtime consequence and no optimization licensed by them. That is a coherent design, and it is what Racket calls the *weakest* of its three options. The useful comparison is not "Racket has types and Python does not." Both have a checker. The difference is that Racket's default assumes the checker's conclusions are load-bearing at run time and pays for it, while the mainstream gradual systems assume they are advisory and do not. The performance numbers people cite against sound gradual typing are the price of that assumption, not an implementation defect.

## Choosing

The Guide's own guidance is concrete. Deep types for tightly-connected typed regions; expensive boundary types to watch for include `Vectorof`, `->`, and `Object`. Shallow types for small typed modules that frequently touch untyped code, since the checks are constant time for most types and linear in the size of the type, not the value, for a few exceptions like `U` and `case->`. Avoid Shallow in large typed modules that call functions or access data structures often, since those operations may incur shape checks. Optional types enable the typechecker and nothing else.

Three languages, one type system, and the difference between them is entirely about what happens at the edges.

## Related Notes

- [[cs/languages/Python/type-hints-and-gradual-typing|Type Hints and Gradual Typing]] - the unenforced model, which Racket ships as its weakest option
- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame in Racket]] - the enforcement mechanism the type system compiles down to
- [[cs/pl/type-soundness-progress-preservation|Type Soundness: Progress and Preservation]] - what soundness claims, and why an optimizer needs it
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - why the module boundary is where the cost lands
- [[cs/languages/Racket/generic-interfaces-and-gen-colon|Generic Interfaces and the gen Prefix]] - the dispatch mechanism Typed Racket does not yet support
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - the general question of what a type is supposed to promise

## Sources

- "The Typed Racket Guide," Racket documentation. https://docs.racket-lang.org/ts-guide/index.html . Supports Typed Racket being Racket's gradually-typed sister language allowing the incremental addition of statically-checked type annotations.
- "6 Typed-Untyped Interaction," The Typed Racket Guide. https://docs.racket-lang.org/ts-guide/typed-untyped-interaction.html . Supports `require/typed` and its `#:struct` and `#:opaque` clauses, plain `require` between typed modules, untyped modules requiring typed modules without extra work, the macro exception, the broken `increment` example and its contract violation, Deep Typed Racket contracting all values crossing the boundary with the no-segfault optimization guarantee, no overhead between Deep-typed modules, shape checks matching a type's top-level constructor as constant-time yes-or-no predicates, the growth and locality caveats for Shallow, Optional types adding no runtime checks and enabling no optimization, and the Deep/Shallow/Optional selection guidance including the expensive boundary types.
- "8 Caveats and Limitations," The Typed Racket Guide. https://docs.racket-lang.org/ts-guide/caveats.html . Supports Typed Racket not supporting generic interfaces, and macros defined in Typed Racket modules being unusable from ordinary Racket modules because such uses can circumvent the type system's protections.
