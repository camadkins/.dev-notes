---
title: Unsafe Rust and Its Contract
description: "The five superpowers unsafe actually grants, the proof obligations the keyword creates and discharges, why the borrow checker stays on, and what Miri can and cannot tell you."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-07-02
updated:
aliases:
  - unsafe Rust
  - The unsafe Keyword
---

The most common misreading of `unsafe` is that it switches something off. It does not. `unsafe` does not turn off the borrow checker or disable any of Rust's other safety checks; use a reference inside an `unsafe` block and it is still checked. What the keyword grants is access to five specific features that the compiler then does not check for memory safety, and everything else about the language stays exactly as it was.

The general question of what a UB contract is, across languages, lives in [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]]. This note is about the Rust keyword and what it moves from the compiler's ledger to yours.

> [!note] The idea
> The Reference gives the crispest framing: the `unsafe` keyword is used to create or discharge the obligation to prove something safe. That single sentence covers every use of the word. `unsafe fn`, `unsafe static`, and `unsafe trait` mark code that *defines* extra safety conditions to be upheld elsewhere. `unsafe {}`, `unsafe impl`, `unsafe extern`, and `#[unsafe(attr)]` mark code where the programmer *asserts* those conditions are satisfied. The non-obvious consequence is that the two halves are logical duals, so an `unsafe` block sitting inside an `unsafe fn` can use that function's obligations to discharge the ones arising inside it. The keyword is a proof-obligation bookkeeping system, not an off switch.

## The five superpowers

You can take five actions in unsafe Rust that you cannot in safe Rust:

1. Dereference a raw pointer.
2. Call an unsafe function or method.
3. Access or modify a mutable static variable.
4. Implement an unsafe trait.
5. Access fields of unions.

That is the complete list. `unsafe` gives access to these five features, which are then not checked by the compiler for memory safety, and you still get some degree of safety inside the block. Nor does `unsafe` mean the code inside is necessarily dangerous or will definitely have memory safety problems; the intent is that the programmer ensures the code accesses memory in a valid way.

The reason any of this exists is that static analysis is conservative. When the compiler tries to determine whether code upholds the guarantees, it is better for it to reject some valid programs than to accept some invalid ones, so code the compiler cannot be confident about is rejected even when it is fine. `unsafe` is how you say you know what you are doing, at your own risk, because incorrect unsafe code produces memory unsafety such as null pointer dereferencing.

The Nomicon frames the same split at the language level. Rust can be thought of as a combination of two programming languages, Safe Rust and Unsafe Rust. Unsafe Rust is exactly like Safe Rust with all the same rules and semantics; it just lets you do some extra things that are definitely not safe. Write only Safe Rust and you never have to worry about type safety or memory safety, never endure a dangling pointer, a use-after-free, or any other kind of undefined behavior. The value of the separation is getting C-like low-level control over implementation details without most of the problems of integrating a separate safe language. The residual problem is the one the whole Nomicon exists to address: you must become aware of properties the type system assumes and audit them in any code that interacts with Unsafe Rust.

## Obligations, created and discharged

The Reference's vocabulary is worth adopting because it makes `unsafe` compositional rather than binary.

An **unsafe function** is one that is not safe in all contexts or for all possible inputs. It has extra safety conditions, requirements that must be upheld by all callers and that the compiler does not check. `get_unchecked` has the extra safety condition that the index must be in bounds. An unsafe function should come with documentation explaining what those conditions are, and can only be called from inside an `unsafe` block, or inside an `unsafe fn` without the `unsafe_op_in_unsafe_fn` lint.

An **unsafe block** is the dual. By putting operations into one, the programmer states that they have taken care of satisfying the extra safety conditions of all operations inside it. Discharging can happen in several ways: run-time checks, data structure invariants that guarantee certain properties, or the surrounding `unsafe fn`'s own obligations. By default the body of an unsafe function is itself treated as an unsafe block, which the `unsafe_op_in_unsafe_fn` lint changes.

The same pairing appears again at the trait level. An **unsafe trait** carries extra safety conditions that implementations must uphold and can only be implemented by `unsafe impl` blocks; writing `unsafe impl` states that the programmer has satisfied them. That is exactly the situation with [[cs/languages/Rust/send-sync-and-fearless-concurrency|`Send` and `Sync`]]: if a type contains something that does not implement them, such as a raw pointer, marking it `Send` or `Sync` requires `unsafe`, because Rust cannot verify the guarantee and you are doing the check manually.

Two smaller cases complete the set. **Unsafe external blocks** exist because the programmer who declares an external block must assure that the signatures of the items within are correct, and failing to do so may lead to undefined behavior; `unsafe extern` indicates that obligation has been met. Prior to edition 2024, `extern` blocks were allowed without being qualified as unsafe. **Unsafe attributes** such as `#[unsafe(no_mangle)]` are attributes with extra safety conditions the compiler cannot check, so they must be wrapped in `unsafe(..)` to assert they hold.

Inside an `unsafe extern` block every item is implicitly unsafe, but some foreign functions genuinely are safe to call. C's `abs` has no memory safety considerations and works for any `i32`, so the `safe` keyword can mark it, after which calling it needs no `unsafe` block. The Book's warning on this is the one to remember: marking a function as `safe` does not inherently make it safe, it is a promise you are making to Rust, and keeping it is still your responsibility.

> [!example] `split_at_mut`, the canonical safe abstraction
> Splitting a mutable slice in two is fundamentally fine because the halves do not overlap, but the borrow checker only sees two borrows from the same slice. The standard library's implementation takes `values.len()`, takes `values.as_mut_ptr()` to get a `*mut i32`, asserts `mid <= len`, and then in an `unsafe` block calls `slice::from_raw_parts_mut(ptr, mid)` and `slice::from_raw_parts_mut(ptr.add(mid), len - mid)`. `from_raw_parts_mut` is unsafe because it must trust the pointer is valid, and `add` is unsafe because it must trust the offset location is a valid pointer. The assertion is what discharges both obligations: with `mid <= len` established, every raw pointer used inside the block is provably valid. The function's own signature is safe, so no caller ever sees the keyword.

## Keep it small, wrap it, and check it

Three pieces of operational guidance follow directly from the model.

Keep `unsafe` blocks small. Requiring the five operations to sit inside annotated blocks is what guarantees that any error related to memory safety must be within an `unsafe` block, which is the property you want when you are hunting a memory bug.

Enclose unsafe code in a safe abstraction with a safe API. Parts of the standard library are implemented as safe abstractions over unsafe code that has been audited, and wrapping prevents uses of `unsafe` from leaking out into every place the functionality is wanted, because using a safe abstraction is safe. The Reference's motivating example is structural rather than stylistic: Rust's type system is a conservative approximation of the dynamic safety requirements, so a doubly-linked list, not being a tree, can only be represented with reference-counted pointers in safe code, while representing the reverse links as raw pointers inside `unsafe` blocks removes the reference counting. The standard library's own threads and message passing are implemented with `unsafe` blocks.

Run Miri. It is an official Rust tool for detecting undefined behavior, and where the borrow checker is static, Miri is dynamic: it runs your program or its test suite and detects violations of the rules it understands. It requires nightly, installed with `rustup +nightly component add miri` and invoked as `cargo +nightly miri run` or `cargo +nightly miri test`.

> [!warning] Miri's guarantee runs one way only
> Miri is a dynamic analysis tool, so it only catches problems in code that actually gets run, and it does not cover every possible way code can be unsound. The Book states the asymmetry outright: if Miri catches a problem you know there is a bug, but Miri not catching one does not mean there is no problem. Pair it with good testing rather than treating a clean run as a proof.

Using `unsafe` for one of the five superpowers is neither wrong nor frowned upon. It is trickier to get right because the compiler cannot help uphold memory safety, and the explicit annotation is what makes the source of a problem findable later.

## Related Notes

- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - what UB is and why compilers are entitled to assume it away
- [[cs/languages/Rust/send-sync-and-fearless-concurrency|Send, Sync, and Fearless Concurrency]] - the unsafe traits whose obligations are hardest to state
- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes]] - the checks that stay on inside an `unsafe` block
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - `unsafe extern` and the signature obligation in practice
- [[cs/languages/Rust/smart-pointers-box-rc-refcell|Smart Pointers: Box, Rc, and RefCell]] - the safe abstractions built over exactly this machinery

## Sources

- "Unsafe Rust," The Rust Programming Language. https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html . Supports the five unsafe superpowers, `unsafe` not turning off the borrow checker or other safety checks, the conservatism-of-static-analysis rationale and the at-your-own-risk warning, keeping blocks small so memory errors are localized, wrapping unsafe code in safe abstractions audited in the standard library, the `split_at_mut` implementation with `as_mut_ptr`, the `mid <= len` assertion, `slice::from_raw_parts_mut` and `add` and why each is unsafe, the `safe` keyword for FFI functions such as `abs` and the promise it represents, `unsafe impl` for `Send`/`Sync` on types containing raw pointers, and Miri including its installation and invocation commands and its one-way guarantee.
- "The `unsafe` keyword," The Rust Reference. https://doc.rust-lang.org/reference/unsafe-keyword.html . Supports `unsafe` creating or discharging the obligation to prove something safe, the split between obligation-defining forms (`unsafe fn`, `unsafe static`, `unsafe trait`) and obligation-asserting forms (`unsafe {}`, `unsafe impl`, `unsafe fn` without the lint, `unsafe extern`, `#[unsafe(attr)]`), the definition of extra safety conditions with the `get_unchecked` example, calling rules and the `unsafe_op_in_unsafe_fn` lint, unsafe blocks as the logical dual and the ways obligations are discharged, unsafe traits and `unsafe impl`, the `unsafe extern` signature obligation and the 2024-edition change, unsafe attributes, the conservative-approximation and doubly-linked-list example, and threads and message passing using unsafe blocks.
- "Meet Safe and Unsafe," The Rustonomicon. https://doc.rust-lang.org/nomicon/meet-safe-and-unsafe.html . Supports Rust as a combination of Safe Rust and Unsafe Rust, Unsafe Rust having all the same rules and semantics plus extra unsafe capabilities, the guarantee that pure Safe Rust never yields a dangling pointer, use-after-free, or other undefined behavior, the value of the separation as C-like control without the integration problems, and the residual duty to audit type-system assumptions in code interacting with Unsafe Rust.
