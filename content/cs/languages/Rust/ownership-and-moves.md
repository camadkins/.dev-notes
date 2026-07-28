---
title: Ownership and Moves in Rust
description: The three ownership rules, what a move actually invalidates, why Copy types are exempt, and the exact order in which values are dropped at scope exit.
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-03-11
updated:
aliases:
  - Rust Ownership
  - Move Semantics in Rust
---

A `String` in Rust is three words on the stack (a pointer, a length, a capacity) plus a buffer on the heap. Copy the three stack words into a second variable and you have two things that believe they own the same buffer. When both go out of scope, both run the code that returns that buffer to the allocator, and the allocator's bookkeeping is now corrupt. Rust's whole ownership system exists to make that arrangement unrepresentable rather than merely discouraged.

The comparative framing (manual freeing, RAII, refcounting, tracing GC) lives in [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]], and the type theory that ownership descends from is in [[cs/pl/ownership-and-linear-types|Ownership and Linear Types]]. This note is about the concrete Rust mechanics: what the rules say, what a move does to the source variable, and what the compiler emits when a scope ends.

> [!note] The idea
> Ownership is not a runtime tracking scheme. It is a static claim about which single variable is responsible for a value, enforced by invalidating the source of every assignment that would create a second claim. Because the responsibility is single, the compiler can insert exactly one `drop` per value with no reference count and no collector. The non-obvious part is that "goes out of scope" is a precisely specified order, not a vague sweep: variables in a scope drop in reverse order of declaration, while the fields inside a struct drop in declaration order.

## The three rules

The Rust Book states them as three lines. Each value in Rust has an owner. There can only be one owner at a time. When the owner goes out of scope, the value will be dropped.

The third rule is the mechanism. When a variable goes out of scope Rust calls a function named `drop`, which is where the author of `String` puts the code that returns the memory, and Rust calls it automatically at the closing curly bracket. The Book explicitly connects this to C++: deallocating resources at the end of an item's lifetime is the pattern C++ calls Resource Acquisition Is Initialization, and Rust's `drop` will be familiar to anyone who has used RAII.

What makes this more than RAII-with-different-syntax is the second rule. RAII gives you a destructor; it does not stop you from holding a raw pointer to the same object. Rust's uniqueness rule is what lets the compiler emit that `drop` call unconditionally, because it has already proven no other binding could emit a second one.

## Moves: assignment invalidates the source

Assigning `s1` to `s2` copies the pointer, length, and capacity, and does not touch the heap buffer. Other languages would call that a shallow copy. Rust invalidates `s1` at the same time, so the Book's name for it is a **move**: `s1` was moved into `s2`. Using `s1` afterward is a compile error, and the compiler's message names the reason directly, that the move occurred because the type does not implement the `Copy` trait.

The Book is blunt about why: with both pointers live, when `s2` and `s1` go out of scope they will both try to free the same memory, a double free, and one of the memory-safety bugs the language is built to exclude. Invalidation is not a stylistic preference, it is the double free being deleted from the space of programs.

Two consequences follow that surprise people coming from C++ or Python.

Assignment over a live variable drops the old value immediately. Give an existing `String` a new value and Rust calls `drop` on the original and frees its memory right away, rather than at the end of the enclosing block.

Function calls move too. Passing a variable to a function will move or copy exactly as assignment does; the Book's annotated example shows a `String` argument becoming invalid in the caller the moment it is passed, then dropped when the callee's parameter goes out of scope. Returning a value moves it back out. The pattern is uniform, which is why "who owns this now" is answerable by reading the signature.

## Copy: the exemption for stack-only data

Integers do not behave this way. `let y = x` on an `i32` leaves `x` perfectly usable. The reason the Book gives is that types with a known size at compile time are stored entirely on the stack, so copies of the actual values are quick to make and there is no difference between a deep and a shallow copy. Invalidating the source would buy nothing.

The `Copy` trait is the annotation that encodes this. A type implementing `Copy` does not move on assignment; its variables are trivially copied and remain valid afterward. The integer types, `bool`, the floating-point types, `char`, and tuples containing only `Copy` types all implement it.

The interesting restriction is the interaction with `Drop`. Rust will not let you annotate a type with `Copy` if the type or any of its parts implements `Drop`, and attempting it is a compile-time error. The two traits encode contradictory claims: `Copy` says duplicating this value is meaningless bookkeeping, `Drop` says this value owns something that needs releasing. A type cannot be both, and the compiler refuses to let you assert both. As a general rule, any group of simple scalar values can implement `Copy`, and nothing requiring allocation or holding a resource can.

When you genuinely want the heap data duplicated, `clone` does it explicitly. The Book frames the verbosity as the point: seeing a call to `clone` tells you arbitrary and possibly expensive code is running. The cost is visible in the source text.

## Scope exit is specified, not approximate

The Rust Reference pins down what "goes out of scope" means with more precision than the Book needs to. When an initialized variable or temporary goes out of scope, its destructor is run. The destructor of a type `T` is: call `Drop::drop` if `T: Drop`, then recursively run the destructor of all its fields.

The ordering rules are where the detail lives, and they are not all the same direction. When control flow leaves a drop scope, all variables associated with that scope are dropped in reverse order of declaration, and temporaries in reverse order of creation. But the fields of a struct are dropped in declaration order, as are the fields of the active enum variant, and the elements of an array or owned slice drop from the first to the last. Variables captured by move into a closure drop in an unspecified order, which is the one place the Reference declines to promise anything.

Reverse order for locals is the right default because a later declaration may borrow an earlier one, so the borrower must die first. Forward order inside a struct is simply a different, equally arbitrary-looking choice that the Reference commits to so that `Drop` implementations can rely on it.

Two escape hatches round it out. A partially initialized variable drops only its initialized fields, so `mem::forget` on one tuple element leaves the other still dropped normally at scope end. And if a destructor must be run manually, such as when implementing your own smart pointer, `ptr::drop_in_place` is the tool.

> [!example] Reading a move error
> `let s1 = String::from("hello"); let s2 = s1; println!("{s1}");` fails with `error[E0382]: borrow of moved value: 's1'`, and the diagnostic annotates three spans: the binding, tagged with "move occurs because `s1` has type `String`, which does not implement the `Copy` trait"; the assignment, tagged "value moved here"; and the use, tagged "value borrowed here after move". The compiler then suggests cloning the value if the performance cost is acceptable. The error is worth reading as a summary of the whole model: a move happened, `Copy` would have prevented it, and the fix is either to clone or to borrow.

> [!warning] Ownership is about responsibility, not about the heap
> Nothing in the three rules mentions allocation. A file handle, a socket, a mutex guard, and a spawned-thread join handle are all owned values whose `Drop` implementations release something that is not memory. The `String` example is a teaching device; the rule generalizes to any resource with a release step.

## Related Notes

- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes]] - the escape from moving everything, and the aliasing rule that makes it safe
- [[cs/languages/Rust/smart-pointers-box-rc-refcell|Smart Pointers: Box, Rc, and RefCell]] - what to reach for when single ownership is genuinely the wrong model
- [[cs/pl/ownership-and-linear-types|Ownership and Linear Types]] - the substructural type theory Rust's rules are an engineering instance of
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - Rust's answer placed next to manual freeing, RAII, and reference counting
- [[cs/dsa/dynamic-memory-allocation|Dynamic Memory Allocation]] - the double free and use-after-free failure modes the move rule deletes
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - the general notion of scope that drop scopes specialize

## Sources

- "What Is Ownership?", The Rust Programming Language. https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html . Supports the three ownership rules, `drop` being called automatically at the closing curly bracket, the RAII comparison, move semantics and the double-free rationale, immediate drop on reassignment, moves through function arguments and return values, `clone` for deep copies, and the `Copy` trait including its member types and its incompatibility with `Drop`.
- "Destructors," The Rust Reference. https://doc.rust-lang.org/reference/destructors.html . Supports the composition of a destructor (`Drop::drop` then fields recursively), drop of scope variables in reverse declaration order, struct and enum-variant fields in declaration order, arrays first element to last, move-captured closure variables in unspecified order, partial-initialization dropping only initialized fields, and `ptr::drop_in_place` for manual destruction.
