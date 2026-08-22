---
title: Ownership & Linear Types
description: "Substructural type systems drop the structural rules that let a variable be duplicated or discarded, which turns resource management into a typing problem."
draft: false
comments: true
tags:
  - cs
  - pl
  - type-theory
  - memory
date: 2026-05-29
updated:
aliases:
  - Linear Types
  - Affine Types
  - Substructural Type Systems
  - Borrow Checker
---

Most type systems quietly assume you can use a variable as many times as you like, or not at all. Both assumptions are structural rules, borrowed from logic, and both are optional. Substructural type systems are the family that gets built by removing them.

The payoff is not theoretical tidiness. Removing those rules gives the type checker the ability to say something no ordinary type can say: *this value must be consumed, and consumed only once*.

> [!note] The idea
> Ordinary types classify what a value **is**. Substructural types additionally track **how many times it may be used**, which is exactly the information a resource needs. Once "used exactly once" is a typing judgment, deallocation, file closing, and state transitions stop being runtime disciplines the programmer has to remember and become properties the compiler checks.

## Dropping the structural rules

Substructural type systems are a family analogous to substructural logics, in which one or more of the structural rules are absent or allowed only under controlled circumstances. Such systems constrain access to resources like files, locks, and memory by tracking state changes and prohibiting invalid states.

Three structural rules are on the table: **exchange** (reorder assumptions), **weakening** (introduce an unused assumption, that is, discard a value), and **contraction** (duplicate an assumption, that is, use a value twice). Discarding different combinations produces different systems.

| System | Exchange | Weakening | Contraction | Use |
|---|---|---|---|---|
| Ordered | no | no | no | exactly once, in the order it was introduced |
| Linear | yes | no | no | exactly once |
| Affine | yes | yes | no | at most once |
| Relevant | yes | no | yes | at least once |
| Normal | yes | yes | yes | arbitrarily |

Ordered types correspond to noncommutative logic and model stack-based allocation: without exchange, an object may only be used when it is on top of the modelled stack, and then it is popped. Linear types correspond to linear logic and model heap allocation. Relevant types correspond to relevant logic, where every variable is used at least once. Affine types correspond to affine logic.

## What linearity buys

Ensuring objects are used exactly once lets the system safely deallocate an object after its use, or design interfaces guaranteeing that a resource cannot be used once it has been closed or transitioned to a different state. The Clean language uses uniqueness types, a variant of linear types, to support concurrency, I/O, and in-place array update.

Linear type systems allow [[cs/pl/mutable-state-references-effects|references]] but not aliases. A reference goes out of scope after appearing on the right-hand side of an assignment, so only one reference to any object exists at once. Passing a reference as an argument counts, since the parameter is assigned the value inside the function.

That single-reference property makes linear types a natural fit for quantum computing, since it reflects the no-cloning theorem. From the [[cs/pl/lambda-calculus-syntax-substitution|lambda calculus]] point of view, the same condition reads simply: a variable `x` can appear exactly once in a term.

## The resource interpretation

The substructural vocabulary is most useful as a way to characterize resource management, the aspect of language safety concerned with ensuring each allocated resource is deallocated exactly once. Under this reading, the interpretation concerns only uses that transfer ownership, called **moving**, where ownership is the responsibility to free the resource. Uses that do not transfer ownership, called **borrowing**, fall outside the interpretation, and lifetime semantics restrict those to the window between allocation and deallocation.

The difference between affine and linear then becomes sharp. An affine resource can be moved but need not be, so an affine type cannot be spent more than once. A linear resource must be moved, so letting it go out of scope is an invalid program. Affine types can enforce ordering of a function-call state machine; linear types enforce ordering *and completion*.

> [!example] Hoare's vending machine, in Rust
> ```rust
> fn buy_candy(_: Coin) -> Candy { Candy{} }
> fn buy_drink(_: Coin) -> Drink { Drink{} }
> ```
>
> `Coin` is an affine type (unless it implements `Copy`), so spending the same coin twice is a program the compiler is entitled to reject:
>
> ```rust
> let coin = Coin {};
> let candy = buy_candy(coin); // The lifetime of the coin variable ends here.
> let drink = buy_drink(coin); // Compilation error: Use of moved variable.
> ```
>
> Affinity does not mean a value cannot be used without being used up. A function taking `&Coin` merely borrows, and the same coin can be validated infinitely many times as long as it is not moved.
>
> What Rust cannot express here is a coin that is forbidden from going out of scope. That would take a linear type.

Affine typing is what makes the **typestate pattern** work: functions consume and return an object wrapped in different types, acting like state transitions in a state machine whose state is stored as a type in the caller's context, so an API can statically enforce that its functions are called in the right order.

## Rust: ownership as the concrete case

Rust is the mainstream language that made this discipline load-bearing. All programs must manage memory; some languages use garbage collection, others require explicit allocate and free. Rust takes a third approach, managing memory through [[cs/languages/Rust/ownership-and-moves|a system of ownership]] with rules the compiler checks, where violating any rule means the program does not compile, and none of the ownership features slow the program down at runtime.

The rules are short:

- Each value in Rust has an owner.
- There can only be one owner at a time.
- When the owner goes out of scope, the value will be dropped.

The problem being solved is the pairing problem. Without a GC it is the programmer's job to identify when memory is no longer used and free it, and doing that correctly has historically been difficult: forget and you waste memory, do it too early and you have an invalid variable, do it twice and that is a bug too. Exactly one allocate must be paired with exactly one free. Rust returns memory automatically when the owning variable goes out of scope, calling a function named `drop` at the closing curly bracket. The pattern is the one C++ calls [[cs/languages/Cpp/raii-and-object-lifetime|Resource Acquisition Is Initialization]].

Affinity shows up in assignment. Copying a `String`'s pointer, length, and capacity without copying the heap data would leave two owners, and when both go out of scope both would free the same memory, a **[[cs/security/use-after-free-and-heap-exploitation|double free]]** error that can lead to memory corruption and security vulnerabilities. Rust's answer is to invalidate the first variable, so instead of a shallow copy the operation is called a **move**. With only the new binding valid, exactly one `drop` runs.

## Borrowing: the escape hatch that keeps the guarantee

If moves were the only option, threading a value through a program would be miserable. References solve that. A reference is like a pointer in that it is an address you can follow, but unlike a pointer it is guaranteed to point to a valid value of a particular type for the life of that reference. Creating one is called borrowing, and because the reference does not own the value, the value is not dropped when the reference stops being used.

Two rules keep borrowing sound:

- At any given time, you can have either one mutable reference or any number of immutable references.
- References must always be valid.

The first rule buys [[cs/pl/concurrency-models-threads-locks-and-actors|concurrency safety]] as a side effect. A data race happens when two or more pointers access the same data at the same time, at least one of them writes, and there is no synchronization mechanism. The aliasing-XOR-mutation rule makes the first two conditions unrepresentable, so Rust prevents data races by refusing to compile code containing them. A reference's scope runs from where it is introduced through the last time it is used, so immutable borrows can end before a later mutable borrow begins.

The second rule kills dangling pointers. In languages with pointers it is easy to free memory while keeping a pointer to it; in Rust the compiler ensures the data will not go out of scope before the reference to it does.

> [!warning]
> Rust is affine, not linear. A value can be dropped by falling out of scope, so the compiler cannot force you to *finish* anything, only to avoid using it twice. Linear types are stronger and awkward for a different reason: any early return, which is typical of error handling, must achieve the same cleanup, and that becomes pedantic in languages with stack unwinding where every function call is a potential early return.

## Related Notes

- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]]
- [[cs/pl/mutable-state-references-effects|Mutable State, References & Effects]]
- [[cs/pl/garbage-collection-concepts|Garbage Collection: Concepts]]
- [[cs/pl/concurrency-models-threads-locks-and-actors|Concurrency Models]]
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus: Syntax & Substitution]]
- [[cs/pl/type-soundness-progress-preservation|Type Soundness: Progress & Preservation]]

## Sources

- "Substructural type system," Wikipedia. https://en.wikipedia.org/wiki/Substructural_type_system . Backs the definition of substructural type systems and their resource-constraining purpose, the exchange/weakening/contraction table for ordered, linear, affine, relevant, and normal systems, the stack and heap modelling readings, safe deallocation and closed-resource interfaces, Clean's uniqueness types, references-without-aliases and the no-cloning connection, the resource interpretation of moving versus borrowing, the affine versus linear move obligation, the Rust vending-machine example and its move error, the typestate pattern, and the early-return cost of linear types under stack unwinding.
- "What Is Ownership?," The Rust Programming Language. https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html . Backs ownership as a compiler-checked third approach to memory management with no runtime cost, the three ownership rules, the allocate/free pairing problem, automatic return of memory via `drop` at scope end and the RAII comparison, and the double-free reasoning behind invalidating the source variable so a shallow copy becomes a move.
- "References and Borrowing," The Rust Programming Language. https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html . Backs the definition of a reference and of borrowing, the two rules of references, the three conditions of a data race and Rust's compile-time prevention of them, the non-lexical extent of a reference's scope, and the guarantee that references are never dangling.
