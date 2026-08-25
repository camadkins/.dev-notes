---
title: Parametric Polymorphism Through Contracts
description: "How parametric->/c and ->i express polymorphism at runtime, what an opaque wrapper actually enforces, and why that is a stronger claim than a type parameter makes."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-24
updated:
aliases: []
---

Write `(-> A B (values B A))` in a typed language and the compiler will not let you return the arguments in the wrong order. Racket has no compiler doing that check, and yet:

```racket
(define swap-ctc (parametric->/c [A B] (-> A B (values B A))))
(define/contract (bad-swap a b) swap-ctc (values a b))
(bad-swap 1 2)
```

fails at runtime with `promised: B produced: #<A>`. Both arguments are integers. Nothing about the values `1` and `2` distinguishes an A from a B. The check still fires, and understanding why is the point of this note.

> [!note] The idea
> `parametric->/c` does not check types. It manufactures identity. At every application it constructs a fresh opaque wrapper per type variable, boxes each incoming value in the wrapper for its variable, and on the way out demands that returned values carry the right wrapper before unwrapping them. The polymorphic function is therefore physically unable to inspect what it was handed, which is the operational content of parametricity: not "this works for all types" but "this function provably cannot depend on which type it got." A static type parameter forbids the dependence by refusing to compile; the contract forbids it by making the value opaque while the function holds it.

## The wrapper is the mechanism

The Reference is direct about the construction. `parametric->/c` creates a contract for parametric polymorphic functions, with each type variable bound in the body contract and instantiated fresh on each call. At each application the contract constructs a new opaque wrapper for each variable. Values flowing into the polymorphic function, meaning values in negative position, are wrapped in the corresponding opaque wrapper. Values flowing out, in positive position, are checked for the appropriate wrapper: if they have it they are unwrapped, and if they do not, a contract violation is signaled.

Run that machine on `bad-swap`. The integer `1` arrives in the position guarded by A and becomes an A-wrapped opaque struct. The integer `2` becomes a B-wrapped one. The body returns them in the declared order `(values a b)`, so the first result carries the A wrapper while the range contract demands B. The error message prints `promised: B produced: #<A>`, and the printed form is the wrapper, not the integer. The values were never comparable to begin with.

The same machinery catches a subtler bug that a nominal type system would also catch but for a different reason. `(define/contract (copy-first a b) swap-ctc (values a a))` violates the contract even when called as `(copy-first v v)` with one symbol bound to both parameters. The two arguments were `eq?` on the way in and are still one value on the way out, but they went through different wrappers, so the returned A cannot satisfy B. Aliasing at the call site does not survive the boundary.

The confinement runs the other direction too. A function that tries to look at what it received gets nothing useful: `(if (integer? a) ...)` on a wrapped argument takes the false branch, because `a` is an opaque struct and not an integer. This is the runtime shadow of the abstraction theorem behind [[cs/pl/parametric-polymorphism-adts|parametric polymorphism]]. A polymorphic function that cannot observe its argument has very few things it can do with it, and that shortage of options is exactly what makes free theorems provable.

## Universal and existential, and which side hides

Underneath `parametric->/c` sit two constructors that make the direction explicit. `new-∀/c` builds a universal contract: universal contracts accept all values when in negative positions (function inputs) and wrap them in an opaque struct, hiding the precise value, and in positive positions such a contract accepts only values that were previously accepted in negative positions, by checking for the wrappers. So `(let ([a (new-∀/c 'a)]) (-> a a))` describes the identity function, or a function that never returns.

`new-∃/c` is its dual and flips both halves. Existential contracts accept all values when in positive positions (function returns) and wrap them in an opaque struct, hiding the precise value. Inputs are then accepted only if they were previously handed out. That is a sealed abstract data type: the module returns handles whose representation the client cannot see and cannot forge, and will only accept back handles it issued.

The duality is not a metaphor borrowed from logic, it is the same duality. A universal claim hides the choice from the callee, an existential claim hides it from the caller, and which side of an implication a quantifier sits on decides which side gets the information. The general shape lives in [[cs/math/predicate-logic-and-quantifiers|predicate logic and quantifiers]]; the contract library is that shape compiled to struct wrappers and `eq?` checks on them.

## Where `->i` fits, and where it does not

`->i` is often introduced alongside the parametric combinators, and it is a different tool for a neighboring problem. Its distinguishing feature is naming: each argument and result is named and these names can be used in the subcontracts and in the pre- and post-condition clauses. That makes `(->i ([x number?] [y (x) (>=/c x)]) [result (x y) (and/c number? (>=/c (+ x y)))])` expressible, a contract in which the second argument's obligation depends on the first argument's value and the result's obligation depends on both.

Racket's Reference notes three primary function contract combinators with increasing amounts of expressiveness and increasing additional overheads, and puts `->i` at the expensive end, because it requires delaying the evaluation of the contract expressions for the domain and range until the function itself is called or returns. `->` can generate a wrapper that calls the original function directly. `->i` cannot, because it does not know what to check until the arguments exist.

The distinction worth holding onto: `->i` gives dependency, `parametric->/c` gives abstraction. `->i` lets a contract say more about the values, and `parametric->/c` lets it say that the function knows less about them. They are opposite moves.

> [!warning] Dynamic parametricity is not free, and not the same guarantee
> The wrapper costs an allocation per argument per call, and the abstraction is enforced only along the path the contract guards. Code inside the same module, on the unguarded side of the boundary, sees the raw values. A static type parameter costs nothing at runtime and holds everywhere the type is in scope, which is the trade in the other direction. And unlike [[cs/languages/Java/generics-and-type-erasure|type erasure]], which deletes the parameter and leaves the values untouched, this approach keeps the parameter and alters the values instead: the type variable becomes a real object at runtime while the payload becomes unreachable.

## Where blame lands

The failure messages above blame the function, not the caller. `bad-swap: broke its own contract` with `blaming: (function bad-swap)` is the range half of the arrow firing, which is the ordinary two-channel split described in [[cs/languages/Racket/contracts-and-blame|contracts and blame]]: the domain guards the caller's promise, the range guards the callee's. What parametricity adds is that the callee can now break a promise it had no way of keeping accidentally. Returning the wrong one of two indistinguishable integers is not a type error in any observable sense until the wrappers make it one.

## Related Notes

- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame in Racket]] - the boundary and blame model these combinators extend
- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism and Algebraic Data Types]] - the abstraction theorem the opaque wrapper enforces operationally
- [[cs/math/predicate-logic-and-quantifiers|Predicate Logic and Quantifiers]] - why the universal and existential contracts hide information from opposite sides
- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - the opposite trade, deleting the parameter and leaving values alone
- [[cs/languages/Go/type-parameters-and-constraints|Type Parameters and Constraints]] - what the same promise looks like when a checker enforces it before the program runs
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - static enforcement of the property, and what it buys over the runtime version

## Sources

- "8.3 Parametric Contracts," The Racket Reference. https://docs.racket-lang.org/reference/parametric-contracts.html . Supports `parametric->/c` creating a contract for parametric polymorphic functions, the per-application construction of a fresh opaque wrapper for each variable, the negative-position wrapping and positive-position wrapper check with a violation when it is absent, the `swap-ctc` examples including `bad-swap`, `copy-first`, and `inspect-first`, and the definitions and duality of `new-∀/c` and `new-∃/c`.
- "8.2 Function Contracts," The Racket Reference. https://docs.racket-lang.org/reference/function-contracts.html . Supports the three primary function contract combinators with increasing expressiveness and overhead, `->` generating wrappers that call the original directly, `->i` being the most expensive because it delays evaluation of the domain and range contract expressions until call or return, and `->i` naming each argument and result for use in subcontracts and pre- and post-conditions with the dependent numeric example.
