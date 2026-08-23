---
title: "Unsafe Code and the fixed Statement"
description: "unsafe does not make code dangerous, it makes code unverifiable. fixed exists because the collector moves objects, so an address is a claim that expires."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-08-14
updated:
aliases:
  - Pointers in C#
  - Pinning in .NET
  - The unsafe Keyword
---

The name is the most misleading thing about the feature. Unsafe code is not necessarily dangerous; it is code whose safety cannot be verified by .NET tools. Most C# is verifiably safe, meaning the tooling can prove it does not directly access memory through pointers and does not allocate raw memory, and creates managed objects instead. The `unsafe` keyword withdraws the proof, not the safety, and the honest question when you write it is whether you can supply by hand what the verifier was supplying automatically.

> [!note] The idea
> Two facts collide in this feature. A pointer is an address, and the CLR's collector relocates objects during compaction. The garbage collector does not keep track of whether an object is being pointed to by any pointer type, so a pointer into the managed heap is valid only while something prevents the object from moving. That something is `fixed`, which prevents the collector from relocating a moveable variable and declares a pointer to it. Every rule about pointer lifetimes in C# follows from the collector, not from the pointer.

## What the unsafe context actually unlocks

In the original model, which C# 1.0 introduced and which remains the default, the unsafe context covers the existence of pointer features. You may declare a pointer type, take the address of a variable, dereference a pointer, convert a `stackalloc` expression to a pointer, or apply `sizeof` to an arbitrary type only inside an unsafe context. The `unsafe` modifier on a type, member, or block establishes that context and places no obligation on callers, which is the part worth pausing over: a method marked `unsafe` can be called from ordinary code with no annotation at the call site.

Compiling any of it requires the `AllowUnsafeBlocks` compiler option, so the capability is opt-in per project rather than per file. The stated reasons to reach for it are narrow: calling native functions that require pointers, and in some cases improving performance through direct memory access that avoids array-bounds checks. That second one is the honest trade. Removing the bounds check removes the mechanism that turns an out-of-range index into an exception rather than into a read of someone else's memory, which is the entire subject of [[cs/security/buffer-overflows|the buffer overflow]]. The documentation says plainly that unsafe code introduces security and stability risks.

A second model is in preview in C# 15 and .NET 11, and its design choice is instructive. Under the updated memory safety model the unsafe context covers the operations that access memory the runtime does not manage: the existence of a pointer is not unsafe, the dereference of a pointer is. Declaring a pointer type, taking an address with `&`, using the `fixed` statement, converting a `stackalloc` to a pointer, and `sizeof` on any unmanaged type all become allowed in safe code, while pointer indirection, member access through a pointer, element access, function pointer invocation, and element access on a fixed-size buffer still require an unsafe context. The larger change is that the `unsafe` modifier on a member becomes a contract that propagates the obligation to audit safety to the caller, so calling an unsafe member requires unsafe. That is [[cs/languages/Rust/unsafe-rust-and-its-contract|the Rust model of unsafe]] arriving in C# two decades later: the keyword names an obligation someone must discharge rather than a permission someone has been granted.

## Why `fixed` has to exist

The referent of a pointer is the type before the `*`. If that referent is an object in the managed heap, including local variables captured by lambda expressions or anonymous delegates, you must pin the object for as long as the pointer is used. The collector will otherwise move it out from under you, because [[cs/languages/CSharp/the-clr-garbage-collector|compaction moves survivors toward the older end of a segment]] and updates every reference it knows about. It does not know about your pointer.

`fixed` closes that gap for the duration of a block. The address of a fixed, or pinned, variable does not change during execution of the statement, the declared pointer can be used only inside the corresponding `fixed` statement, and the pointer is readonly and cannot be modified. When the pointer holds the address of an object field or an array element, the statement guarantees the collector will not relocate or dispose of the containing object instance while the statement body runs.

You can initialize the pointer from an array, in which case it holds the address of the first element; from the address of a variable using `&`; from a `string`; from a fixed-size buffer; or from an instance of a type implementing `GetPinnableReference`, which must return a `ref` to an unmanaged type. `Span<T>` and `ReadOnlySpan<T>` use that last pattern, so a span over a slice of an array can be pinned directly.

> [!warning] The pointer outlives the guarantee, and the compiler will not stop you
> Passing pointers between methods can cause undefined behavior. A method that returns a pointer to a local variable through an `in`, `out`, or `ref` parameter or as its result hands back an address that was set inside a `fixed` block, and the variable it points to might no longer be fixed. Nothing at the type level records that a pointer was only valid inside a scope, which is why this is a discipline rather than a rule, and why it belongs in the same family as [[cs/languages/common/undefined-behavior-as-a-contract|every other undefined behavior contract]]: the language stops describing what happens, and you are responsible for staying inside the region where it still does.

There is a way out of pinning altogether. Memory allocated with `stackalloc` lives on the stack, where it is not subject to garbage collection and therefore does not need to be pinned. Short-lived buffers are the case that motivates the whole feature, and the stack answers it without ever involving the collector.

## Fixed-size buffers, and the runtime noticing

The `fixed` keyword has a second job. Declaring a fixed-size buffer stores an array's contents inside a struct itself, which is what you want when interoperating with data from other languages or platforms. The element type is restricted to `bool`, `byte`, `char`, `short`, `int`, `long`, `sbyte`, `ushort`, `uint`, `ulong`, `float`, or `double`, and the declaration must include a length: `fixed char id[8]` is legal and `fixed char id[]` is not.

Two details in this corner are worth carrying away. A fixed-size `char` buffer always takes two bytes per character regardless of encoding, so a 128 element buffer is 256 bytes even when marshaled with `CharSet.Auto` or `CharSet.Ansi`. And the compiler emits `UnsafeValueTypeAttribute` on fixed-size buffers, which instructs the CLR that a type contains an unmanaged array that can potentially overflow, while memory allocated with `stackalloc` automatically enables buffer overrun detection features in the CLR. The runtime treats these declarations as a signal to switch on protections it does not otherwise need, which is the managed-code cousin of [[cs/security/memory-protections-aslr-dep-canaries|stack canaries]]: an acknowledgment that the code below this line can smash something, so the surrounding machinery starts checking.

The boundary, in one sentence: crossing it costs you the verifier, the bounds check, and the collector's cooperation, and buys you an address. That is a good trade in exactly two situations, native interop and a measured hot path, and a bad one everywhere else.

## Related Notes

- [[cs/languages/CSharp/the-clr-garbage-collector|The CLR Garbage Collector]] - the compaction behavior that makes pinning necessary in the first place.
- [[cs/languages/CSharp/ref-structs-spans-and-the-allows-ref-struct-constraint|Ref Structs, Spans, and the allows ref struct Anti-Constraint]] - the safe alternative that solves most of what pointers used to.
- [[cs/languages/Rust/unsafe-rust-and-its-contract|Unsafe Rust and Its Contract]] - unsafe as a propagating obligation, which C# is now adopting.
- [[cs/security/buffer-overflows|Buffer Overflows]] - what the bounds check you skipped was preventing.
- [[cs/security/memory-protections-aslr-dep-canaries|Memory Protections: ASLR, DEP, and Stack Canaries]] - the defenses the runtime enables when it sees an unmanaged buffer.
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - the general form of a rule the compiler will not enforce for you.

## Sources

- "Unsafe code, pointer types, and function pointers," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/unsafe-code . Supports the definition of verifiably safe code, unsafe as unverifiable rather than dangerous, the native interop and bounds-check motivations, the security and stability warning, the AllowUnsafeBlocks requirement, the original model and the operations it gates, the updated memory safety model in preview and its per-operation table including caller obligations, the referent type definition, the statement that the collector does not track pointers and that heap referents must be pinned, the undefined behavior of passing pointers between methods, the fixed-size buffer element types and length requirement, the two-bytes-per-character sizing, and the UnsafeValueTypeAttribute and stackalloc buffer overrun detection notes.
- "fixed statement (C# reference)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/fixed . Supports the definition of the fixed statement and pinned variables, the unchanging address during execution, the scope and readonly nature of the declared pointer, the guarantee against relocation or disposal of the containing object, the initialization forms including arrays, addresses, strings, fixed-size buffers, and GetPinnableReference with Span and ReadOnlySpan, and the stackalloc alternative that is not subject to garbage collection.
