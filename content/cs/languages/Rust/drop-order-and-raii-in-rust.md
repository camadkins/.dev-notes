---
title: "Drop Order and RAII in Rust"
description: "Where destructors run, in what order, what suppresses them, and why the language guarantees no leak but does guarantee no use-after-free."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-06-24
updated:
aliases:
  - Drop Order
  - Destructors in Rust
---

C++ gets RAII from a promise about destructors and a programmer who routes every cleanup obligation through it. Rust gets the same technique for free, because the ownership system already establishes exactly one owner for every value and already knows when that owner's scope ends. The `Drop` implementation is not a discipline you adopt; it is a hook on machinery the compiler runs whether you write one or not.

The interesting part is not that destructors run. It is the precise order, which is specified rather than incidental, and the exact size of the guarantee, which is smaller than most people assume.

> [!note] The idea
> Rust guarantees that a destructor never runs twice and never runs on memory that is still reachable through a live reference. It does not guarantee that a destructor runs at all. That asymmetry is deliberate and load-bearing: leaking is safe, and double-freeing is not, so the language draws the safety line between them rather than around both. The consequence is a rule that constrains every author of unsafe code: you may assume your destructor will not be misfired, and you may not assume it will be fired.

## The specified order

When an initialized variable or temporary goes out of scope, its destructor is run, or in Rust's vocabulary it is dropped. The destructor of a type consists of calling `Drop::drop` if the type implements `Drop`, then recursively running the destructor of all of its fields. Both halves happen; implementing `Drop` adds a step, it does not replace the field drops.

Within a value, the order is by declaration. The fields of a struct are dropped in declaration order, as are the fields of the active enum variant and the elements of a tuple. An array or owned slice drops from the first element to the last. The one gap in the specification is the closure: variables that a closure captures by move are dropped in an unspecified order, which is a real constraint if you were counting on a capture releasing before another.

Between values, the order inverts. Each variable or temporary belongs to a drop scope, and when control flow leaves a drop scope, all variables associated to that scope are dropped in reverse order of declaration for variables, or of creation for temporaries. Reverse declaration order is the only order that works, because a later local may borrow an earlier one, and unwinding the stack of dependencies means unwinding it in the order it was built. Leaving several scopes at once, as a `return` does, drops from the inside outwards. Function parameters sit in the scope of the entire function body and so are dropped last.

Patterns follow the same reversal one level down. Variables in patterns are dropped in reverse order of declaration within the pattern, so destructuring a tuple into two bindings drops the second one first. This is where drop order stops being trivia and starts mattering, because pattern matching is how most Rust code introduces bindings.

## Temporaries, which is where the surprises live

A temporary is the unnamed value that holds the result of an expression used in a place context. Its temporary scope is, apart from lifetime extension, the smallest scope that contains the expression and is one of a fixed list: the entire function, a statement, the body of an `if`, `while`, or `loop`, an `else` block, a lazy boolean operand, a match arm's guard and body. The practical reading of that list is that the default is the enclosing statement, so a temporary usually lives to the semicolon. `let guard = mutex.lock().unwrap();` binds the guard and it lives to the end of the block; `mutex.lock().unwrap().field` produces a guard that dies at the semicolon, which is the classic accidental early unlock.

Operands get temporaries too, to hold results while the other operands are evaluated. Normally this is invisible, since the temporaries are moved from once the expression is evaluated, so dropping them has no effect. The exception is the one that matters: unless one of the operands breaks out of the expression, returns, or panics. A half-evaluated expression is precisely the case where partially constructed state has to be torn down, and that path is what makes the ordering rules observable rather than academic. The same interaction is what makes destructors and [[cs/pl/exceptions-handlers-and-non-local-control|non-local control flow]] a single design problem in any language that has both.

## What suppresses a destructor

Three things. `mem::forget` takes ownership of a value and does not run its destructor, so any resources the value manages, such as heap memory or a file handle, will linger forever in an unreachable state. `ManuallyDrop` wraps a variable or field to prevent it from being dropped automatically. And process termination without unwinding: `process::exit` and `process::abort` skip destructors outright, and if the panic handler is set to abort, panicking will always terminate the process without destructors being run.

`mem::forget` is a safe function, and the reasoning behind that is the whole argument of this note. It is not marked unsafe because Rust's safety guarantees do not include a guarantee that destructors will always run. The Nomicon records the history: `forget` was once marked unsafe as a lint against using it, and this was determined to be an untenable stance, because there are many ways to fail to call a destructor in safe code. The famous one is a cycle of reference-counted pointers built with [[cs/languages/Rust/interior-mutability-and-the-cell-family|interior mutability]], which leaks without a single `unsafe` block. Marking `forget` unsafe would have suggested a guarantee that safe code could break anyway.

The rule falls out of that. Preventing a destructor from being run is safe even for a type that is not `'static`, and types may not safely rely on a destructor being run for soundness. Safe code may assume destructor leaks do not happen, since a program that leaks destructors is probably wrong. Unsafe code cannot rely on destructors to be run in order to be safe. The Reference says the same thing from the other side: because forgetting a value is allowed, any unsafe code you write must allow for this possibility, and you cannot return a value and expect the caller will necessarily run its destructor.

> [!warning] Leaking is the safe failure, dropping twice is not
> The reason the line is drawn here is that the two errors have different blast radii. A leaked `Box<u8>` wastes memory and the type is by definition inaccessible. A destructor run twice frees the same allocation twice, and a freed allocation that something still points at is [[cs/security/use-after-free-and-heap-exploitation|use-after-free]], the exploitable one. The standard library's own advice encodes the preference: `ManuallyDrop` errs on the side of leaking instead of erring on the side of double-dropping, and it is preferred over `mem::forget` for disassembling a value precisely because a panic between `forget` and the reconstruction would cause a double free.

## Against C++

The technique is the same and the guarantee is differently placed. [[cs/languages/Cpp/raii-and-object-lifetime|C++ RAII]] gets its power from the destructor being the one path the language runs unconditionally, and it depends on the programmer writing classes that acquire in the constructor and release in the destructor. Rust hands you the ownership analysis first: [[cs/languages/Rust/ownership-and-moves|moves]] mean the compiler already knows which binding is responsible for a value at every point, so a moved-from local is simply not dropped, and a partially initialized value drops only its initialized fields. C++ needs a moved-from state that is valid to destroy; Rust needs no such state because the drop is statically elided.

What Rust gives up in exchange is the C++ programmer's habit of treating a destructor as a promise. In C++ a `lock_guard` that exists is a lock that will be released. In Rust it is a lock that will be released unless somebody forgets it, aborts, or builds a cycle, and unsafe code inside your abstraction has to survive that.

## Related Notes

- [[cs/languages/Cpp/raii-and-object-lifetime|RAII and Object Lifetime]] - the same technique where the destructor guarantee is stronger and the ownership analysis is weaker
- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves in Rust]] - why a moved-from binding has no destructor to run
- [[cs/languages/Rust/interior-mutability-and-the-cell-family|Interior Mutability and the Cell Family]] - the reference cycle that leaks from entirely safe code
- [[cs/security/use-after-free-and-heap-exploitation|Use-After-Free and Heap Exploitation]] - the failure mode the drop rules exist to make impossible
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - why destructor order becomes observable exactly on the abnormal path
- [[cs/dsa/dynamic-memory-allocation|Dynamic Memory Allocation]] - what a leaked allocation costs the allocator that never sees it returned

## Sources

- "Destructors," The Rust Reference. https://doc.rust-lang.org/reference/destructors.html . Supports the drop-on-scope-exit rule, the two-part destructor operation, declaration-order field drops and the unspecified closure-capture order, reverse-declaration drop scopes and inside-outwards nesting, function parameters dropping last, reverse pattern-binding order, temporary scopes and the operand-temporary rule, and the suppression mechanisms including abort.
- "forget in std::mem," Rust standard library documentation. https://doc.rust-lang.org/std/mem/fn.forget.html . Supports resources lingering in an unreachable state, `forget` being safe because Rust does not guarantee destructors run, the obligation on unsafe code to allow for forgetting, the double-free hazard between disassembly and `forget`, and `ManuallyDrop` erring on the side of leaking.
- "Leaking," The Rustonomicon. https://doc.rust-lang.org/nomicon/leaking.html . Supports `mem::forget` consuming a value without running its destructor, the history of it once being unsafe, the many ways to skip a destructor in safe code, and the split rule that safe code may assume no destructor leaks while unsafe code may not.
