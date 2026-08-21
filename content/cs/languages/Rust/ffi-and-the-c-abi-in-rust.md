---
title: "FFI and the C ABI in Rust"
description: "extern C, repr(C), and the exact point where the compiler stops proving things and starts trusting your declaration."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-14
updated:
aliases:
  - extern C in Rust
  - repr(C)
---

Rust's guarantees end at the edge of the crate graph. Past that edge is a symbol in a shared object with a calling convention, a memory layout, and a set of preconditions that exist only in a header file and a paragraph of documentation. Interoperating means describing that symbol in Rust and then being right, because nothing downstream will check.

> [!note] The idea
> An `extern` block is a claim, not a query. When declaring the argument types to a foreign function, the Rust compiler cannot check if the declaration is correct, so specifying it correctly is part of keeping the binding correct at runtime. Everything else about FFI follows: the `unsafe` requirement, the `repr(C)` requirement, the separate unwinding ABIs. Each is a place where a property the compiler normally proves has to be asserted instead, and the assertion is unverifiable in principle rather than merely unimplemented.

## Declaring the other side

An `extern` block is a list of function signatures in a foreign library, in this case with the platform's C ABI. A `#[link(...)]` attribute instructs the linker to link against the named library so the symbols can be resolved. Going the other direction, `extern "C"` on a Rust function makes it adhere to the C calling convention, and `no_mangle` turns off Rust's name mangling so that it has a well defined symbol to link to. Together those four pieces are the whole surface: a symbol name, a calling convention, argument types, and a linker instruction.

Foreign functions are assumed to be unsafe, so calls to them need to be wrapped in `unsafe` as a promise to the compiler that everything contained within truly is safe. The Nomicon's justification is worth having in mind because it names three separate hazards rather than gesturing at danger: C libraries often expose interfaces that are not thread-safe, almost any function taking a pointer is not valid for all possible inputs since the pointer could be dangling, and raw pointers fall outside Rust's safe memory model entirely. Each corresponds to a Rust guarantee that simply does not exist on the far side, and the [[cs/languages/Rust/unsafe-rust-and-its-contract|unsafe contract]] is where the obligation to reestablish them lands.

## Layout, and why the default will not do

A Rust struct without a `repr` attribute uses the Rust representation, and the only data layout guarantees it makes are those required for soundness: field offsets are divisible by field alignment, the type's alignment is at least the maximum of its fields', and for structs the fields do not overlap. Crucially, the ordering does not have to be the same as the order in which the fields are specified in the declaration, and there are no other guarantees of data layout made by this representation. The compiler is free to reorder fields to eliminate padding, and it does.

`#[repr(C)]` is the opt-out, designed for dual purposes: creating types interoperable with the C language, and creating types you can soundly perform layout-dependent operations on such as reinterpreting a value as a different type. The algorithm is the C one, spelled out. The alignment of the struct is the alignment of its most-aligned field, or one if there are no fields. Fields are laid out in declaration order, each at the next offset that is a multiple of its alignment, and the size of the struct is the final offset rounded up to a multiple of the struct's alignment.

Writing that algorithm down is what makes the type predictable, and predictability is the entire product. The padding you can now compute is the price of matching a layout someone else already fixed. Field reordering is a real optimization that `repr(C)` gives up, which is why the attribute belongs on the types that cross the boundary and not on your internal ones.

For pointers to structures whose contents a C library keeps private, the Nomicon's recipe is an opaque type: a `#[repr(C)]` struct with at least one private field and no constructor, so it cannot be instantiated outside its module, plus a `PhantomData` marker that keeps the compiler from marking it `Send`, `Sync`, or `Unpin`. Distinct opaque types for distinct C structs recover type safety that a `*mut c_void` throws away.

## What crossing costs

The call itself is cheap. `extern "C"` is a calling convention, so a Rust-to-C call is an ordinary call instruction with arguments in the platform's registers, and there is no marshalling layer, no runtime, and no boxing. The costs are elsewhere and they are structural.

Optimization stops. The foreign function is opaque to the compiler, so it cannot be inlined, and every assumption about aliasing and mutation has to be dropped across the call. That is the same wall that makes a system call expensive relative to a function call, and for the same reason.

Ownership has to be negotiated by hand. Foreign libraries often hand off ownership of resources to the calling code, and when that happens you must use Rust's destructors to provide safety and guarantee release of the resources, especially in the case of a panic. The corollary is the rule about allocators: memory allocated by C must be freed by C's `free`, not by dropping a `Box`, because the two [[cs/systems/memory-allocators-and-fragmentation|allocators]] keep separate bookkeeping. Wrapping the foreign handle in a Rust type with a `Drop` implementation that calls the library's own destructor is how RAII gets extended over a boundary that has never heard of it.

Unwinding needs a separate ABI. Most ABI strings come in two variants, one with an `-unwind` suffix and one without, and the Rust ABI always permits unwinding, so there is no `Rust-unwind` ABI. If panics or foreign exceptions are expected to cross a boundary, that boundary must use the appropriate `-unwind` string; otherwise use the plain one. When an unwind meets a boundary not permitted to unwind, the outcome depends on which side started it: a Rust panic will cause the process to safely abort, while a foreign exception entering Rust will cause undefined behavior. The asymmetry is the point, and it is treated further in [[cs/languages/Rust/panic-unwinding-and-abort|panic, unwinding, and abort]].

> [!warning] The boundary is where the safety contract changes hands
> Inside safe Rust, memory safety is a theorem. Across the boundary it is a promise made by whoever wrote the C. Every one of the [[cs/security/use-after-free-and-heap-exploitation|memory-safety bug classes]] Rust removes is fully available again the moment a pointer crosses, and a Rust program that calls a vulnerable C library is a vulnerable program. The practical consequence for design is that the wrapper crate is the security boundary: it must validate what it receives, own what it is given, expose no raw pointer in its safe API, and document exactly which invariants its callers must uphold. A thin binding that just marks everything `unsafe` and passes it through has moved the problem to every one of its users. The general shape of this handoff, across languages, is in [[cs/languages/common/c-abi-and-ffi|the C ABI and foreign function interfaces]].

One further limit is worth stating plainly, because people are surprised by it: Rust is currently unable to call directly into a C++ library. C++ has no stable ABI and its name mangling, exceptions, and object model are not something `extern "C"` describes. The usual answer is a C shim, which is also how most other languages reach C++.

## Related Notes

- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - the cross-language view of what an ABI fixes and what every FFI has to restate
- [[cs/languages/Rust/unsafe-rust-and-its-contract|Unsafe Rust and Its Contract]] - what you are promising when you write the `unsafe` block around the call
- [[cs/languages/Rust/panic-unwinding-and-abort|Panic, Unwinding, and Abort]] - why the unwinding ABIs are separate and what happens when they are mismatched
- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] - why memory must go home to the allocator that produced it
- [[cs/security/use-after-free-and-heap-exploitation|Use-After-Free and Heap Exploitation]] - the bug class that comes back into scope the moment a pointer crosses
- [[cs/systems/system-calls-and-the-kernel-boundary|System Calls and the Kernel Boundary]] - a different boundary with the same optimization wall

## Sources

- "FFI," The Rustonomicon. https://doc.rust-lang.org/nomicon/ffi.html . Supports the `extern` block as a list of foreign signatures using the platform C ABI, `#[link]` directing the linker, foreign functions being assumed unsafe and the three hazards behind that, the compiler's inability to check a foreign declaration, `extern "C"` and `no_mangle` for exporting to C, ownership handoff requiring Rust destructors, the opaque-type recipe with a private field and a `PhantomData` marker, the paired unwind and non-unwind ABI strings with abort versus undefined behavior, and the inability to call directly into a C++ library.
- "Type Layout," The Rust Reference. https://doc.rust-lang.org/reference/type-layout.html . Supports the Rust representation being the default, its guarantees being only those required for soundness, field ordering not matching declaration order, the absence of any other layout guarantee, the dual purpose of the C representation, and the `repr(C)` struct alignment and size-and-offset algorithm.
