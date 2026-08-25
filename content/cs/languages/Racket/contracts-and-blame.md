---
title: Contracts and Blame in Racket
description: "Why a contract is a boundary rather than an assertion, how the arrow combinator splits a function into two channels, and the flat/chaperone/impersonator hierarchy underneath."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-01-19
updated:
aliases:
  - contract-out
---

An assertion says a value is wrong. A contract says *who* is wrong. That difference is the entire design, and it is why Racket's contract system is organized around [[cs/pl/modules-signatures-and-separate-compilation|module boundaries]] rather than around function bodies.

The Guide's framing is the business one. Like a contract between two business partners, a software contract is an agreement between two parties, and the agreement specifies obligations and guarantees for each product, or value, that is handed from one party to the other. A contract therefore establishes a boundary between the two parties, and whenever a value crosses that boundary the contract monitoring system performs contract checks, making sure the partners abide by the established contract.

> [!note] The idea
> A contract is not a check attached to a value. It is a check attached to a *crossing*, which is why the system can name a guilty party at all. Attaching a contract to a `provide` clause creates two channels between a server module and a client module, one for arguments going in and one for results coming back, and every violation lands on whichever side sent the offending value. The consequence people underestimate is that checking a function contract cannot be an event: `->` produces a wrapper that outlives the crossing and keeps checking each call, which is exactly why Racket has a whole taxonomy of how much a contract is allowed to alter the value it guards.

## Attach it to the export, not the definition

Racket encourages contracts mainly at module boundaries, and programmers attach them to `provide` clauses to impose constraints and promises on the use of exported values:

```racket
#lang racket
(provide (contract-out [amount positive?]))
(define amount ...)
```

That export specification promises to all clients of the module that the value of `amount` will always be a positive number, and the contract system monitors the obligation carefully: every time a client refers to `amount`, the monitor checks that the value is indeed a positive number. The contracts library is built into the `racket` language; from `racket/base` you `(require racket/contract)` first.

Binding `amount` to a non-positive number means that when the module is required the monitoring system signals a violation and blames the module for breaking its promises. Binding it to a symbol instead exposes a subtlety worth internalizing: the monitoring system will apply `positive?` to a symbol, and `positive?` reports an error, because its domain is only numbers. The fix is to make the contract total over all Racket values by combining checks, `(and/c number? positive?)`. A [[cs/math/predicate-logic-and-quantifiers|predicate]] used as a contract must be prepared for any value, not merely the values you expected.

Contracts do not have to sit on module boundaries. `define/contract` establishes a contract boundary between a definition and its surrounding context, so the two parties become the definition and the module containing it. The Guide flags the cost directly: forms that create these nested contract boundaries can be subtle to use, because they may have unexpected performance implications or blame a party that may seem unintuitive.

## The arrow splits a function into two channels

A mathematical function has [[cs/math/functions-injective-surjective-bijective|a domain and a range]], and a contract can ensure that a function receives only values in its domain and produces only values in its range. `->` creates such a contract, with the forms after the arrow specifying contracts for the domains and finally a contract for the range.

```racket
#lang racket
(provide (contract-out [deposit (-> number? any)]
                       [balance (-> number?)]))
(define amount 0)
(define (deposit a) (set! amount (+ amount a)))
(define (balance) amount)
```

When a module exports a function it establishes two channels of communication between itself as a server and the client module that imports the function. If the client calls the function it sends a value into the server module; when the call ends and the function returns, the server sends a value back to the client. The Guide is explicit that this client-server distinction is important, because when something goes wrong one or the other of the parties is to blame. A client applying `deposit` to `'millions` gets blamed for breaking the contract; if `balance` returned `'broke`, the monitoring system would blame the server module.

`->` by itself is not a contract. It is a **contract combinator**, which combines other contracts to form a contract. The Reference generalizes: contract combinators are functions such as `->` and `listof` that take contracts and produce other contracts.

The arrow also has an infix spelling that is pure reader behavior. `(number? . -> . any)` is just another way of writing `(-> number? any)`, because when a Racket S-expression contains two dots with a symbol in the middle the reader re-arranges it and places the symbol at the front. That is the same [[cs/languages/Racket/s-expressions-and-evaluation|two-dot reader conversion]] used for `<`, showing up in a library API.

## `any` and `any/c` are not the same promise

The distinction is a small one that reveals how deliberate the checking model is. `any` matches any kind of result and can only be used in the range position of a function contract; it tells the monitoring system not to check the return value, and it tells a potential client that the server module makes no promises at all about the return value, even whether it is a single value or multiple values.

`any/c` is similar in making no demands on a value, but unlike `any` it indicates a *single* value and is suitable as an argument contract. Using it as a range contract imposes a check that the function produces a single value. So `(-> integer? any)` describes a function accepting an integer and returning any number of values, while `(-> integer? any/c)` describes one producing a single result. The Guide's test case is `(define (f x) (values (+ x 1) (- x 1)))`, which matches the first and not the second.

The advice that follows is a cost model, not a style rule. Use `any/c` as a result contract when it is particularly important to promise a single result, and `any` when you want to promise as little as possible and incur as little checking as possible.

## Anything of arity one is a contract

The Reference lists what counts as a contract, and the list is wider than it first appears. Contracts come in two forms: those constructed by the library's operations, and ordinary Racket values that double as contracts. Symbols, booleans, keywords, and `null` are treated as contracts that recognize themselves using `eq?`; strings, byte strings, characters, `+nan.0`, and `+nan.f` recognize themselves using `equal?`; other numbers recognize themselves using `=`; regular expressions are treated as contracts that recognize byte strings and strings matching the expression. And any procedure of arity 1 is treated as a predicate, applied to the values that appear during checking, returning `#f` to indicate the contract failed and anything else to indicate it passed.

That last rule is what makes `(-> amount? any)` work with a hand-written `amount?`, and the Guide's bank-account example uses it to require an exact nonnegative integer. It also exports `amount?` itself, with the contract `(-> any/c boolean?)`, on the reasoning that it makes no sense to restrict a channel of communication to values the client does not understand. If the client must satisfy a predicate, give the client the predicate.

## The hierarchy: what a contract is allowed to do to a value

A `positive?` contract can be settled the instant the value crosses. A `(-> number? any)` contract cannot, because the argument does not exist yet. The Reference divides contracts into three categories along exactly that line.

**Flat contracts** can be fully checked immediately for a given value, and are essentially predicate functions. `flat-contract-predicate` extracts the predicate from an arbitrary flat contract; all flat contracts returned by library functions can be used directly as predicates, though ordinary Racket values doubling as flat contracts (numbers, symbols) cannot.

**Chaperone contracts** may wrap a value so that it signals contract violations later, as the value is used, but are guaranteed not to otherwise change behavior. The Reference's own example is the function case: a function contract wraps a function value and later checks inputs and outputs, and any properties the function value had before being wrapped are preserved by the wrapper. Every flat contract may be used where a chaperone contract is expected, but not the reverse.

**Impersonator contracts** may wrap values and provide no guarantees at all. They may hide properties of values or make them completely opaque, the cited example being `new-∀/c`. All contracts may be used where impersonator contracts are expected.

The hierarchy is a statement about observability. Moving from flat to chaperone to impersonator, you give up progressively more of your ability to reason about the guarded value from the outside, and you buy the ability to guard progressively more of its future behavior. The Reference points at the "Impersonators and Chaperones" section and a research paper on chaperones and impersonators for how the mechanism implements contracts.

> [!warning] `define/contract` checks more than you probably want
> The Guide lists two consequences of using `define/contract` on a function. The contract will be checked on any call outside the definition of the function, *even those inside the module in which it is defined*, and because there may be many such calls the checking may cause the contract to be checked too often, which could lead to performance degradation, especially if the function is called repeatedly from a loop. Separately, a function may be written to accept a more lax set of inputs when called by other code in the same module, and for those cases the boundary `define/contract` establishes is too strict.

## Related Notes

- [[cs/languages/Racket/s-expressions-and-evaluation|S-Expressions and Evaluation]] - the two-dot reader rule that gives `(number? . -> . any)` its shape
- [[cs/languages/Racket/structs-and-pattern-matching|Structs and Pattern Matching]] - the data definitions contracts most often guard
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - the static answer to the same question, checked before rather than during
- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] - how different languages report the violation once it is detected
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the boundary a contract is attached to
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - the static analogue of a function contract's two channels

## Sources

- "7.1 Contracts and Boundaries," The Racket Guide. https://docs.racket-lang.org/guide/contract-boundaries.html . Supports the business-partner definition of a software contract, contracts establishing a boundary with checks performed whenever a value crosses it, contracts attached to `provide` clauses via `contract-out` with the `amount positive?` example and its per-reference monitoring, requiring `racket/contract` from `racket/base`, blame falling on the module for a non-positive `amount`, the `positive?`-applied-to-a-symbol failure and the `(and/c number? positive?)` fix, and `define/contract` creating a nested boundary between a definition and its module with its performance and unintuitive-blame caveats.
- "7.2 Simple Contracts on Functions," The Racket Guide. https://docs.racket-lang.org/guide/contract-func.html . Supports domain and range framing, `->` creating a function contract with domains then range, the bank-account module, the two channels between server and client and the client-server blame split with the `'millions` and `'broke` examples, `->` being a contract combinator rather than a contract, the `(number? . -> . any)` infix rewrite, the `any` versus `any/c` distinction with the `(values (+ x 1) (- x 1))` test and the promise-as-little advice, arity-one predicates as contracts in the `amount?` example, and exporting `amount?` with `(-> any/c boolean?)`.
- "8 Contracts," The Racket Reference. https://docs.racket-lang.org/reference/contracts.html . Supports the contract system guarding one part of a program from another, contracts coming in constructed and value-doubling forms with the `eq?`/`equal?`/`=`/regexp/arity-one-predicate rules, contract combinators as functions taking contracts and producing contracts, and the flat/chaperone/impersonator hierarchy including `flat-contract-predicate`, the function-wrapping chaperone guarantee and property preservation, the flat-usable-as-chaperone one-way rule, impersonators hiding properties with `new-∀/c` as the example, and the pointer to the chaperones and impersonators research paper.
