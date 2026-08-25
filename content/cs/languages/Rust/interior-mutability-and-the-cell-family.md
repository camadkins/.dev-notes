---
title: "Interior Mutability and the Cell Family"
description: "Cell, RefCell, OnceCell, and the one primitive underneath all of them that the compiler treats as a special case."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-07-02
updated:
aliases: []
---

Rust's memory model rests on a rule with two branches. Given an object, you may have several shared references to it, or one exclusive reference to it, and never both at once. The compiler enforces the split, and enforcing it is what buys the language its aliasing guarantees. There are situations where the rule is not flexible enough, because sometimes it is required to have multiple references to an object and yet mutate it. The standard library's answer is a family of shareable mutable containers that exist to permit mutability in a controlled manner, even in the presence of aliasing.

> [!note] The idea
> The cell family is not four independent tricks. It is four safe interfaces over one primitive, `UnsafeCell<T>`, which is the only type in the language whose presence changes what the compiler is allowed to assume about a shared reference. Everything else in the family is library code. That is why "just write it with raw pointers" is not an alternative: a raw pointer cast from `&T` still lives under the assumption that `&T` points to immutable data, and the assumption is what the optimizer acts on. `UnsafeCell` is the opt-out, and it is a language-level fact, not a library convention.

## The guarantee being suspended

The Reference states the mechanism in one paragraph. A type has interior mutability if its internal state can be changed through a shared reference to it. This goes against the usual requirement that the value pointed to by a shared reference is not mutated. And `std::cell::UnsafeCell<T>` is the only allowed way to disable this requirement.

That last clause is the whole note. If you have a `&T`, the compiler performs optimizations based on the knowledge that `T` points to immutable data, and mutating that data, for example through an alias or by transmuting a `&T` into a `&mut T`, is undefined behavior. The optimizer is entitled to cache the loaded value in a register across a call, to hoist a read out of a loop, to reorder. A `*mut T` you conjured by casting away constness does not tell it otherwise. `UnsafeCell<T>` does, because the compiler recognizes the type and stops making the assumption for the memory it covers. It also has the same in-memory representation as its inner type, so the opt-out costs no space, though it does disable niche optimizations in order to avoid its interior mutability property from spreading into an enclosing type. That is a real cost: `Option<UnsafeCell<NonNull<u8>>>` is twice the size of `Option<NonNull<u8>>` on a 64-bit target.

Only one half of the aliasing rule is suspended. The uniqueness guarantee for mutable references is unaffected. There is no legal way to obtain aliasing `&mut`, not even through `UnsafeCell`. Interior mutability makes shared references weaker; it does nothing to exclusive ones. The [[cs/languages/common/undefined-behavior-as-a-contract|contract with the optimizer]] is amended, not torn up.

## Four cells, one primitive

`Cell<T>` implements interior mutability by moving values in and out of the cell. You never get a reference to the interior value at all: `get` duplicates it for `Copy` types, `take` swaps in a default, `replace` and `set` write a new value and hand back or drop the old one. Because no reference to the inside ever escapes, there is nothing to invalidate, and so `Cell` needs no bookkeeping and can never panic. It is typically used for more simple types where copying or moving values is not too resource intensive, and it should usually be preferred over the other cell types when possible.

`RefCell<T>` buys you actual references and pays for them at run time. Borrows for a `RefCell` are tracked at runtime, unlike Rust's native reference types which are entirely tracked statically, at compile time. If a borrow is attempted that would violate these rules, the thread will panic. The behavior and the tradeoff are treated at length in [[cs/languages/Rust/smart-pointers-box-rc-refcell|smart pointers]]; what matters here is the position in the family. `Cell` moves values so it needs no checks. `RefCell` hands out references so it needs checks. Same guarantee, different payment schedule.

`OnceCell<T>` is the hybrid: a reference to the inside can be obtained without moving or copying the value, and without runtime checks, because the value can be written at most once and never again unless you hold a `&mut` to the cell itself. Write-once collapses the borrow question, since a reference handed out after initialization can never observe a second write. `LazyCell<T, F>` pairs a cell with a function and calls it on first deref, which is `OnceCell::get_or_init` with the initializer fixed at construction.

None of the four implement `Sync`, because all four allow doing this in a single-threaded way. The threaded counterparts are a different set of types: `Mutex`, `RwLock`, `OnceLock`, and the atomics. Those wrap `UnsafeCell` too, and add the synchronization that makes concurrent access defined. `UnsafeCell` by itself does nothing to avoid data races; they are still undefined behavior. The relationship between the single-threaded cell and its locking twin is exactly the relationship between an unsynchronized and a synchronized [[cs/systems/concurrency-primitives|concurrency primitive]], and Rust encodes the difference in the trait system rather than in documentation.

## Why a language needs this at all

The obvious question is why a language that spent its whole budget proving aliasing safe would then sell an exemption. The library's own answer is that inherited mutability, where one must have unique access to mutate a value, is one of the key language elements that enables Rust to reason strongly about pointer aliasing, statically preventing crash bugs. Because of that, inherited mutability is preferred, and interior mutability is something of a last resort.

The last resort has three named occasions, and the third one is structural rather than convenient. Mutation inside something immutable: `Rc` and `Arc` hand out shared references only, so without cells their contents could never change. Logically immutable methods: a memoizing accessor that takes `&self` and fills a cache on first call. And mutating implementations of `Clone`. That third case is a closed loop. `clone` is declared to take `&self`, so any mutation that happens in the clone method must use cell types, and `Rc<T>` itself must mutate on clone because it has a reference count to increment. `Rc` maintains its counts in a `Cell<usize>`. Reference counting, the mechanism, is only expressible because interior mutability, the exemption, exists.

> [!warning] The safety burden moves, it does not vanish
> The `UnsafeCell` API is technically very simple: `.get()` gives you a raw pointer to the contents. It is up to you as the abstraction designer to use that raw pointer correctly. The rules you must uphold are the aliasing rules themselves, restated as obligations rather than checks: a `&T` released to safe code may coexist with other `&T` but not with a `&mut T`, and a `&mut T` may be released only if nothing else aliases it. There is no magic whatsoever when dealing with exclusive accesses. Writing a cell type is the same job the compiler does, done by hand, with no one checking your work. This is the reason [[cs/pl/mutable-state-references-effects|effects hidden behind an immutable interface]] are a design decision and not a shortcut.

## Related Notes

- [[cs/languages/Rust/smart-pointers-box-rc-refcell|Smart Pointers: Box, Rc, and RefCell]] - the run-time borrow check in detail, and `Rc<RefCell<T>>`
- [[cs/languages/Rust/unsafe-rust-and-its-contract|Unsafe Rust and Its Contract]] - what you are promising when you build a safe API over `UnsafeCell`
- [[cs/languages/Rust/send-sync-and-fearless-concurrency|Send, Sync, and Fearless Concurrency]] - why the cell family is `!Sync` and the lock family is not
- [[cs/pl/mutable-state-references-effects|Mutable State, References, and Effects]] - the general shape of state hidden behind a pure-looking signature
- [[cs/systems/concurrency-primitives|Concurrency Primitives]] - the synchronization the threaded cells add on top of the same primitive
- [[cs/security/race-conditions-and-toctou|Race Conditions and TOCTOU]] - what an unsynchronized shared mutation costs when the exemption is taken without the discipline

## Sources

- "Interior mutability," The Rust Reference. https://doc.rust-lang.org/reference/interior-mutability.html . Supports the definition of interior mutability, the shared-reference requirement it contradicts, `UnsafeCell` as the only allowed way to disable it, and `RefCell` using run-time borrow checks.
- "Module std::cell," Rust standard library documentation. https://doc.rust-lang.org/std/cell/index.html . Supports the aliasing-or-mutability rule, shareable mutable containers, the four flavors and their methods, `Cell` moving values in and out, run-time borrow tracking and the panic, the single-threaded restriction and the `Sync` counterparts, the last-resort framing, the three occasions for interior mutability, and `Rc` keeping its counts in a `Cell`.
- "UnsafeCell in std::cell," Rust standard library documentation. https://doc.rust-lang.org/std/cell/struct.UnsafeCell.html . Supports `UnsafeCell` as the core primitive, the optimization assumption behind `&T`, the untouched uniqueness guarantee for `&mut`, the identical in-memory representation and disabled niche optimizations, data races remaining undefined behavior, and the aliasing obligations the abstraction designer takes on.
