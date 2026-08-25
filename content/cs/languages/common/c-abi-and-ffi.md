---
title: The C ABI and Foreign Function Interfaces
description: Why C is the lingua franca every language speaks at the boundary. Calling conventions, the stable ABI, name mangling, and why crossing the boundary is where safety guarantees stop.
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-22
updated:
aliases:
  - FFI
---

A program is rarely written in one language. A Python data pipeline calls into a C math library; a Rust service links an existing C++ codec; an operating system exposes its system calls to everything. For any of that to work, code compiled from one language has to call a function compiled from another, and the two compilers never agreed on anything in advance. What they can agree on, almost universally, is the C application binary interface. C is the boundary language not because it is the best but because it is the one everyone already speaks.

An ABI is not the same as an API. An [[cs/software-engineering/api-design|API]] is a source-level contract, names and types you write against. An ABI is the binary contract: how arguments are placed in registers and on the stack, who cleans up the stack, how a struct is laid out in memory, how a function's name appears in the object file. The theory of turning separate units into one program is [[cs/pl/modules-signatures-and-separate-compilation|separate compilation and linking]]; the ABI is what makes that linking work across languages.

> [!note] The idea
> Every platform has a stable C ABI: a fixed calling convention plus a fixed data layout that the dominant C compiler defines and everyone else targets. Other languages interoperate by lowering their calls to this ABI, exporting and importing functions through a narrow C-shaped door. Two things make the door narrow. The caller must match the ABI exactly, and it must uphold invariants the compiler can no longer check, which is why crossing the boundary is unsafe by construction.

## The stable ABI and the calling convention

A calling convention answers the mechanical questions of a function call: which registers hold the first arguments, where the rest go on the stack, which register holds the return value, and which registers the callee must preserve. On a given platform this is fixed. Rust's reference makes the dependence explicit: the `"C"` ABI matches the default ABI of the dominant C compiler on the target, and platform-specific conventions like `"stdcall"`, `"cdecl"`, `"sysv64"`, and `"aapcs"` exist for the cases where a specific convention is required. Because the C ABI is stable and documented per platform, a compiled C function is a fixed target that any other language can learn to call.

## Name mangling and the extern "C" door

There is a second obstacle above the calling convention: the name in the object file. C++ encodes a function's namespace, class, and parameter types into its symbol so that overloaded functions get distinct names, a process called name mangling. C does not mangle. A linker looking for a plain C symbol will not find the mangled C++ one.

The C++ standard resolves this with language linkage. Every function type and name has a language linkage, C++ by default, and a linkage specification changes it: writing `extern "C"` gives a declaration C language linkage so it can be called from or defined in C. In practice `extern "C"` tells the C++ compiler to emit an unmangled, C-callable symbol. It is the door every C++ library exports through when it wants to be reachable from another language.

Rust faces the same problem from the other side and solves it the same way. Foreign functions are declared in an `extern` block, and the ABI string with no explicit value defaults to `"C"`. To hand Rust data to C, the type must be given a C-compatible layout with `#[repr(C)]`, since Rust's default layout is not guaranteed to match what C expects.

## The boundary is where safety stops

The reason FFI is more than a linking detail is what happens to a language's guarantees at the door. Inside safe Rust the compiler proves the absence of certain bugs. The moment a call crosses into foreign code, the compiler can prove nothing, because it cannot see the other side. Rust encodes this directly: a function declared in an `extern` block is unsafe to call unless explicitly marked `safe`, and even reading a foreign `static` is unsafe, because, as the reference notes, nothing guarantees the bit pattern at that memory is valid for the declared type when arbitrary C code initialized it. The caller takes on the obligations the compiler used to discharge: that the signature matches, that pointers are valid and correctly aligned, that the memory model is respected. Get any of it wrong and you are in [[cs/languages/common/undefined-behavior-as-a-contract|undefined behavior]].

Python shows the same boundary from the top of the stack. CPython's performance-critical parts and its bridges to the system are written in C against a stable C API, which is why so much of the scientific Python ecosystem is a thin Python surface over compiled C and Fortran. The convenience of the glue language and the danger of the boundary are the same fact: Python can call into native code precisely because it drops down to the C ABI, and a mismatch there crashes the interpreter rather than raising a catchable exception.

> [!example] What a cross-language call actually agrees on
> A Rust program calls a C function `int crc32(const uint8_t *data, size_t len)`:
> 1. Rust declares it in `unsafe extern "C" { fn crc32(data: *const u8, len: usize) -> i32; }`, defaulting to the C ABI.
> 2. The C side is compiled to a plain, unmangled `crc32` symbol; a C++ side would need `extern "C"` to match.
> 3. At the call, both sides follow the platform calling convention: the pointer and length go in the argument registers the ABI names, the `int` comes back in the return register.
> 4. Rust wraps the call in `unsafe`, because the compiler cannot verify that `data` really points to `len` valid bytes. That obligation is now the programmer's.

## Related Notes

- [[cs/pl/modules-signatures-and-separate-compilation|Modules and Separate Compilation]] - the linking model the ABI extends across language boundaries
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - the stages that turn source into the object files a linker joins
- [[cs/dsa/pointer-with-functions|Pointers and Functions]] - raw pointers and the explicit wrappers native interop relies on
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - what a mismatched signature or invalid pointer across the boundary actually triggers
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - the related problem of agreeing on byte layout when the boundary is a wire instead of a call

## Sources

- "External blocks," The Rust Reference. https://doc.rust-lang.org/reference/items/external-blocks.html . Supports functions in `extern` blocks being implicitly unsafe to call unless marked `safe`, the ABI string defaulting to `"C"`, the `"C"` ABI matching the dominant C compiler on the target, platform ABIs like `"stdcall"`/`"cdecl"`/`"sysv64"`/`"aapcs"`, the `#[link]` attribute, and foreign statics being unsafe because nothing guarantees the bit pattern is valid for the declared type.
- "Linkage specifications ([dcl.link])," Working Draft, Standard for C++ (eel.is mirror). https://eel.is/c++draft/dcl.link . Supports every function type and name having a language linkage, C++ being the default, and `extern "C"` giving C language linkage so the entity can be called from or defined in C.
- "Introduction," Python/C API Reference Manual. https://docs.python.org/3/c-api/intro.html . Supports CPython exposing a stable C API through which native extension code interoperates with the interpreter, the basis for Python calling into compiled C code.
