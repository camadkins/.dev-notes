---
title: racket/generic in Practice, Fallbacks and Dispatch
description: "The four places a generic call can land, why Racket distinguishes an implemented method from a merely supported one, and what gen:dict does with that distinction."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-11
updated:
aliases:
  - racket/generic
  - "gen:dict"
  - Generic Method Fallbacks
---

This is legal Racket, and the empty brackets are not a typo:

```racket
(struct deformed-dict () #:methods gen:dict [])
```

A struct that claims the dictionary interface and implements nothing in it. `(dict-implements/c)` accepts an instance of it. `(dict-implements/c 'dict-ref)` rejects the same instance with a contract violation. Both answers are correct, and the gap between them is where the interesting part of Racket's generics lives.

> [!note] The idea
> A generic call in Racket does not have one dispatch target and a failure case. It has an ordered search across four places: the fast-path predicates, the type's own method table, the default predicates, and finally the interface's fallbacks. Because the last of those can synthesize a method out of other methods, the system has to distinguish an **implemented** method from a **supported** one, and it exposes that distinction in the API rather than hiding it. The reason is cost. A fallback is always correct and frequently asymptotically worse, so the caller sometimes needs to know which one it got.

## Four places a call can land

`define-generics` accepts three keyword options that each add a dispatch path, and the Reference specifies exactly where each sits relative to the method table.

`#:fast-defaults` supplies predicates and implementations that are checked before dispatching to the generic method table. The option is intended to provide a fast path for dispatching to built-in datatypes, such as lists and vectors, that do not overlap with structures implementing the interface. This is how `(dict-ref '((a . "apple")) 'a)` works on a plain association list: lists are not structs and carry no property, so a predicate check has to come first, and putting it first also skips the property lookup for the common case.

`#:defaults` is the mirror image. Its predicates dispatch to the given default implementations if dispatching to the generic method table fails. Same shape, later in the order, for types that should be covered but should not shadow a real implementation.

`#:fallbacks` is different in kind. It does not test the value at all. Fallback implementations are used for any instance of the generic interface that does not supply a specific implementation, which means they are written in terms of the interface's other methods rather than in terms of any concrete representation. A fallback `count` written as "walk the iterator and add one each time" works for every implementer, present and future, because it only calls methods the interface already guarantees.

That last property is what makes `#:fallbacks` the same design move as [[cs/languages/Java/default-methods-and-interface-evolution|Java's default methods]]: a way to grow an interface without breaking every existing implementer, at the cost of a definition that cannot know how expensive it is.

## Implemented, supported, unsupported

The Reference draws the line explicitly. If a generic instance has a corresponding implementation for a method through `#:methods`, `#:defaults`, or `#:fast-defaults`, then that method is an *implemented* generic method of the value. If it is not implemented but has a fallback implementation that does not raise an `exn:fail:support` exception when given that value, then it is a *supported* generic method. Everything else is neither.

Three states, not two. And `#:defined-predicate` hands the distinction to the caller: it defines a procedure reporting whether a specific instance implements a given set of methods, not counting fallback implementations, and the Reference says the procedure is intended for use by higher-level APIs to adapt their behavior depending on method availability. Adapt, not fail. The expected use is a library choosing a strategy, not a program refusing to run.

## gen:dict is the case study

`gen:dict` is a generic interface that supplies dictionary method implementations for a structure type via the `#:methods` option of struct definitions, and it splits its own methods into two documented halves.

The primitive methods, including `dict-ref`, `dict-set`, and the four iteration operations, have no fallback implementations, and are only supported for dictionary types that directly implement them. The derived methods, including `dict-has-key?`, `dict-keys`, `dict-count`, and `dict-map`, have fallback implementations in terms of the other methods, and may be supported even by dictionary types that do not directly implement them.

So the interface has a kernel and a periphery. Implement `dict-ref` and the iteration protocol and you get roughly twenty more operations at no additional writing cost. That is the same bargain the abstract base classes in [[cs/languages/Python/the-data-model-and-dunder-methods|Python's data model]] offer, and it fails in the same place: the derived operations are only as good as the primitives underneath them.

`dict-count` shows the failure precisely. The docs say it returns the number of keys mapped by the dictionary, usually in constant time, and is supported for any dictionary that implements `dict-iterate-first` and `dict-iterate-next`. Both halves are true and they describe different code paths. A hash table implements `dict-count` directly and answers in constant time. A struct that implemented only the iteration primitives gets a fallback that walks every entry, so the same call is linear. The cost model of the underlying structure, discussed for the direct case in [[cs/dsa/hash-tables|hash tables]], does not survive the trip through a fallback, and the documented complexity is the built-in case rather than a guarantee about the protocol.

Racket is honest about this elsewhere in the same page. The iteration operations `dict-iterate-next` and `dict-iterate-key` are documented as operations that *should* take constant time, a request to implementers rather than a promise to callers. And `dict?` itself is not a constant-time test on pairs, since checking that a value is an association list may require traversing the list.

> [!warning] The predicate that ignores fallbacks
> `dict-implements?` answers about implementation, not about whether the call will work. The docs are blunt: fallback implementations do not affect the result, and a dictionary may support the given methods via fallback implementations yet produce false. A guard written as "refuse this value unless it implements `dict-count`" will reject values on which `dict-count` returns the right answer. That is usually what you want when the reason for asking was performance, and never what you want when the reason was correctness. Decide which question you are asking before picking the predicate, a distinction that generalizes well beyond dictionaries into ordinary [[cs/software-engineering/api-design|API design]].

## The older mechanism, and why it is discouraged

`prop:dict` still exists: a structure type property used to define custom extensions to the dictionary API, accepting a vector of ten method implementations positionally, with `#f` in the slots a type does not support. The docs discourage its use in favor of the generic interface.

The reasons are visible in the shape. A positional vector of ten has no names, no arity checking, no contract combinator, no fallbacks, and no way to grow without breaking every existing implementer. `gen:dict` is the same property underneath, with a macro over it that recovers all five. Reading the two side by side is the clearest argument for why [[cs/languages/Racket/generic-interfaces-and-gen-colon|the generic interface layer]] was worth building on top of a mechanism that already worked.

## Related Notes

- [[cs/languages/Racket/generic-interfaces-and-gen-colon|Generic Interfaces and the gen Prefix]] - the form that defines the interface these options configure
- [[cs/languages/Java/default-methods-and-interface-evolution|Default Methods and Interface Evolution]] - the same fallback bargain, and the same reason it exists
- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - a kernel of methods generating a periphery, in another dynamic language
- [[cs/dsa/hash-tables|Hash Tables]] - the cost model the derived methods borrow and sometimes lose
- [[cs/software-engineering/api-design|API Design]] - exposing capability queries, and choosing which question a predicate answers
- [[cs/languages/Go/interfaces-and-implicit-satisfaction|Interfaces and Implicit Satisfaction]] - what a protocol looks like with no fallback layer at all

## Sources

- "5.4 Generic Interfaces," The Racket Reference. https://docs.racket-lang.org/reference/struct-generics.html . Supports `#:fast-defaults` predicates being checked before the generic method table and intended as a fast path for built-in datatypes like lists and vectors, `#:defaults` dispatching after the method table lookup fails, `#:fallbacks` applying to any instance that does not supply a specific implementation, the implemented-versus-supported definitions including the `exn:fail:support` condition, and `#:defined-predicate` reporting implementation while excluding fallbacks for higher-level APIs adapting to method availability.
- "4.18 Dictionaries," The Racket Reference. https://docs.racket-lang.org/reference/dicts.html . Supports `gen:dict` supplying dictionary methods through the `#:methods` option, the primitive methods having no fallbacks and being supported only by direct implementers, the derived methods having fallbacks in terms of the other methods, `dict-count` being documented as usually constant time and supported for any dictionary implementing the iteration primitives, `dict-iterate-next` and `dict-iterate-key` being specified as operations that should take constant time, `dict?` not being a constant-time test on pairs, `dict-implements?` ignoring fallback implementations, and `prop:dict` as a discouraged ten-slot property predating the generic interface.
