---
title: Borrowing and Lifetimes in Rust
description: Shared versus mutable references, the aliasing rule that buys both data-race freedom and optimization, and what lifetime annotations do and do not change.
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-05-02
updated:
aliases:
  - The Borrow Checker
  - Rust Lifetimes
---

If moving were the only way to hand a value to a function, every call would be a transfer of custody and every function that wanted to keep using its argument would have to hand it back. The Rust Book's own example of that pattern returns a tuple of the value and the answer, which it calls too much ceremony for a concept that should be common. References are the fix: the action of creating one is called borrowing, and the analogy is exact. If a person owns something, you can borrow it, and when you are done you have to give it back. You do not own it.

Everything here builds on [[cs/languages/Rust/ownership-and-moves|ownership and moves]]. What borrowing adds is a second question the compiler must answer, not "who frees this" but "who may look at it, and who may change it, and when".

> [!note] The idea
> The borrowing rules are usually taught as a safety mechanism, and they are one. The less obvious half is that they are also a performance mechanism. Guaranteeing that a mutable reference is never aliased is exactly the fact an optimizer needs to keep a value in a register across a write through some other pointer. Other languages must assume the pointers might overlap; Rust's rule lets the compiler assume they do not. The same restriction that rejects your program also makes the accepted version faster.

## Two kinds of borrow, one rule

A `&T` is a shared reference; you can read through it but not write. Try to mutate through one and the compiler emits `error[E0596]: cannot borrow ... as mutable, as it is behind a '&' reference`, with the suggestion to change the parameter to `&mut String`.

A `&mut T` is a mutable reference, and it carries the restriction the language is famous for. If you have a mutable reference to a value, you can have no other references to that value. Two `&mut` to the same variable produce `error[E0499]: cannot borrow 's' as mutable more than once at a time`. Mixing the two is equally rejected: `error[E0502]: cannot borrow 's' as mutable because it is also borrowed as immutable`.

The Book's recap states it as two rules of references. At any given time, you can have either one mutable reference or any number of immutable references. And references must always be valid.

The asymmetry has a plain justification. Multiple readers are fine because no one who is only reading can affect anyone else's reading. A writer alongside readers is not, because users of an immutable reference do not expect the value to change out from under them.

## What the rule buys, part one: data races

The compile-time payoff is stated directly. The restriction preventing multiple mutable references to the same data at the same time allows mutation in a very controlled fashion, and the benefit is that Rust can prevent [[cs/security/race-conditions-and-toctou|data races]] at compile time.

The Book gives the standard three-part definition of a data race: two or more pointers access the same data at the same time, at least one of the pointers is being used to write, and there is no mechanism synchronizing access. Data races cause undefined behavior and are hard to diagnose at runtime, and Rust's response is to refuse to compile code containing them. Notice that the aliasing rule negates the first two conditions simultaneously, which is why one rule covers the whole class. The practical consequences across languages are compared in [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]].

## What the rule buys, part two: alias analysis

The Rustonomicon makes the second argument, and it is the one that explains why Rust bothers to enforce aliasing rules even in single-threaded code. Take a function `compute(input: &u32, output: &mut u32)` that reads `*input` several times while writing `*output`. You would like the compiler to cache `*input` in a register instead of reloading it after each write.

In Rust that optimization is sound. For almost any other language, barring global analysis, it is not, because the optimization relies on knowing that aliasing does not occur, and most languages are liberal about it. The specific worry is a call like `compute(&x, &mut x)` where the two arguments overlap, which would make the cached and uncached versions produce different results. Rust can reject that possibility because `&mut` is not allowed to be aliased, so it can perform the optimization.

The Nomicon lists what alias analysis unlocks in general: keeping values in registers by proving no pointer accesses that memory, eliminating reads by proving nothing wrote since the last read, and eliminating writes by proving nothing reads before the next write. In a language without the aliasing rule, the compiler must consider the overlapping call possible and forgo all of it. Rust gets the guarantee from the type system, on every reference, with nothing for the programmer to opt into.

## Borrows end at last use, not at the closing brace

An early frustration with the rules dissolves once you know the scope rule. A reference's scope starts where it is introduced and continues through the last time that reference is used. So two shared borrows printed and then never touched again do not conflict with a `&mut` created on the following line: the scopes do not overlap, and the compiler can tell that a reference is no longer being used at a point before the end of the [[cs/pl/scoping-binding-and-closures|lexical scope]].

This is why refactoring a borrow error is often just moving the last use of a reference earlier, rather than introducing a new block.

## Lifetimes exist to kill dangling references

The compiler guarantees references will never be dangling: if you have a reference to some data, the compiler ensures the data will not go out of scope before the reference to it does. The component that does this is [[cs/languages/Rust/the-borrow-checker-nll-and-polonius|the borrow checker]], which compares scopes to determine whether all borrows are valid.

Inside a single function the checker can see both scopes and decide directly. Across a function boundary it cannot, and that is where annotations become necessary. Return a reference to a local and you get `error[E0106]: missing lifetime specifier`, with the diagnostic naming the real problem: this function's return type contains a borrowed value, but there is no value for it to be borrowed from.

The subtler case is a function taking two references and returning one of them. The compiler's help text is the clearest statement of the whole feature: the signature does not say whether the return is borrowed from `x` or from `y`. The borrow checker cannot complete its analysis because it does not know how the lifetimes of the arguments relate to the lifetime of the return value. Writing `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str` supplies exactly that missing relation.

> [!warning] Annotations do not extend anything
> Lifetime annotations do not change how long any reference lives. They describe the relationships of the lifetimes of multiple references to each other, without affecting those lifetimes. Specifying `'a` is not a request that something live longer; it tells the borrow checker to reject any values that do not satisfy the stated constraint. The function does not need to know how long its arguments actually live, only that some scope can be substituted for `'a` that satisfies the signature.

## Elision: three rules, not inference

Most Rust code has no lifetime annotations in it, and that is deliberate rather than magical. Before 1.0, every reference needed an explicit lifetime. The team observed that programmers were writing the same annotations over and over in predictable, deterministic patterns, and programmed those patterns into the compiler. They are called the lifetime elision rules, and they are not rules for programmers to follow. They are a set of particular cases the compiler considers, and if your code fits, you do not write the lifetimes.

The three rules, applied in order:

1. The compiler assigns a lifetime parameter to each parameter that is a reference. One parameter gets one, two parameters get two separate ones.
2. If there is exactly one input lifetime parameter, that lifetime is assigned to all output lifetime parameters.
3. If there are multiple input lifetimes but one of them is `&self` or `&mut self`, the lifetime of `self` is assigned to all output lifetime parameters.

Rule three is why methods read cleanly: a method taking `&self` and another reference and returning a reference gets the `self` lifetime on the output without anyone writing it down.

The critical caveat is that elision is not inference. The rules do not provide full inference, and if ambiguity remains after applying them the compiler will not guess. It errors, and you resolve it by annotating. That is exactly what happens to a two-argument `longest`: rule one gives each parameter its own lifetime, rule two does not apply because there are two inputs, rule three does not apply because there is no `self`, and the compiler stops.

> [!example] Tracing elision on `first_word`
> `fn first_word(s: &str) -> &str` compiles bare. Rule one gives the parameter a lifetime, producing `fn first_word<'a>(s: &'a str) -> &str`. Rule two applies because there is exactly one input lifetime, so the output gets it too: `fn first_word<'a>(s: &'a str) -> &'a str`. Every reference in the signature now has a lifetime and the compiler proceeds. Run the same procedure on `fn longest(x: &str, y: &str) -> &str` and it stalls after rule one, which is the whole difference between the two functions.

## `'static`

One lifetime is built in. `'static` denotes that the affected reference can live for the entire duration of the program, and all string literals have it, because the text of a string literal is stored directly in the program's binary, which is always available.

The Book attaches a warning that is worth carrying: error messages sometimes suggest `'static`, but most of the time that suggestion is the fallout of attempting to create a dangling reference or a mismatch of available lifetimes. The fix is to repair those problems, not to write `'static` and move on.

## Related Notes

- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves in Rust]] - the single-owner rule that borrowing is the relaxation of
- [[cs/languages/Rust/smart-pointers-box-rc-refcell|Smart Pointers: Box, Rc, and RefCell]] - what to do when the aliasing rule cannot be satisfied statically
- [[cs/pl/ownership-and-linear-types|Ownership and Linear Types]] - borrowing as the regions-and-capabilities idea from type theory
- [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]] - the data-race problem across languages, and what compile-time prevention is worth
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - why data races and dangling reads are UB rather than merely wrong
- [[cs/pl/mutable-state-references-effects|Mutable State, References, and Effects]] - the semantics of references and aliasing without Rust's restrictions

## Sources

- "References and Borrowing," The Rust Programming Language. https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html . Supports the borrowing definition, E0596/E0499/E0502 diagnostics, the one-mutable-or-many-immutable rule, the three-condition data-race definition and compile-time prevention, the reference-scope-ends-at-last-use rule, the no-dangling-references guarantee, and the E0106 error on returning a reference to a local.
- "Validating References with Lifetimes," The Rust Programming Language. https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html . Supports lifetimes existing to prevent dangling references, the borrow checker comparing scopes, annotations describing relationships without changing how long references live, the pre-1.0 history and the three lifetime elision rules, elision not providing full inference, and the `'static` lifetime of string literals plus the caution against reaching for it.
- "Aliasing," The Rustonomicon. https://doc.rust-lang.org/nomicon/aliasing.html . Supports the `compute(input, output)` caching optimization being sound in Rust but not in most other languages, the `compute(&x, &mut x)` overlap case being impossible because `&mut` cannot be aliased, and the list of optimizations alias analysis enables.
