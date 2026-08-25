---
title: Trait Objects, Vtables, and Fat Pointers
description: "A dyn reference is two words, the second points at a table holding size, alignment, drop, and the methods, and every dyn-compatibility rule falls out of what fits in that table."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-07-07
updated:
aliases: []
---

`&T` is one machine word. `&dyn Trait` is two. That single fact explains more about Rust's trait objects than any rule list, because the second word is where the erased type went, and everything the language refuses to let you do with `dyn` is something that would not fit in it.

> [!note] The idea
> Rust does not put a vtable pointer inside values. It puts it inside pointers. A concrete `Circle` in memory is exactly its fields with no header, and the dispatch information appears only when a reference to it is coerced to `&dyn Shape`. That choice is why a type pays nothing for being usable behind `dyn`, why one type can be viewed through several unrelated trait objects, and why the dyn-compatibility rules exist at all: the vtable has to be constructed at the coercion site, ahead of time, for a fixed set of entries, so anything whose identity is not known then simply has nowhere to go.

## What the pointer holds

Trait objects are dynamically sized types, since the concrete type behind them is opaque, and like all DSTs they are used behind some pointer, such as `&dyn SomeTrait` or [[cs/languages/Rust/smart-pointers-box-rc-refcell|`Box<dyn SomeTrait>`]]. The Nomicon states the general rule for such types: because they lack a statically known size, they can only exist behind a pointer, and any pointer to a DST becomes a wide pointer consisting of the pointer plus the information that completes it.

For a trait object, the completing information is the vtable pointer. The reference spells out the pair: each instance of a pointer to a trait object includes a pointer to an instance of a type `T` implementing the trait, and a virtual method table containing, for each method of the trait and its supertraits that `T` implements, a pointer to `T`'s implementation.

There is more in the table than methods. The standard library's description of trait object metadata lists the contents: the vtable notably contains the type's size, the type's alignment, a pointer to the type's `drop_in_place` implementation, which may be a no-op for plain-old-data types, and pointers to all the methods for the type's implementation of the trait. That is why the Nomicon can say the runtime size of the pointee can be dynamically requested from the vtable, and it is why `Box<dyn Trait>` can free the right number of bytes and run the right destructor for a type the compiler forgot on purpose.

The other major DST is worth holding alongside it. The information completing a slice pointer is just the number of elements it points to, from which the runtime size is the element size times the count. Both `&[T]` and `&dyn Trait` are two words: one carries a length, the other a table. [[cs/languages/Rust/slices-vec-and-capacity|Slices]] and trait objects are one mechanism answering different questions.

## What dispatch costs

The purpose of trait objects is to permit late binding of methods, the same mechanism [[cs/pl/objects-classes-and-dispatch|virtual dispatch]] provides in languages built on inheritance. Calling a method on one results in virtual dispatch at runtime: a function pointer is loaded from the vtable and invoked indirectly, and the actual implementation behind each vtable entry can vary object by object.

Two costs follow, and only the first is the one people quote. The load and the indirect call are small. The larger cost is that the call is opaque to the optimizer, since an indirect call cannot be inlined, so constant propagation into the callee and fusion across the call do not happen. That is the real gap against the monomorphized path described in [[cs/languages/Rust/traits-and-generic-bounds|the bounds note]], and it is why `dyn` in a hot loop is a different decision from `dyn` on a setup path.

The second is a security property. Loading a function pointer from memory and calling through it is the primitive that [[cs/security/control-flow-integrity|control-flow integrity]] schemes exist to constrain, since corrupting the word holding a vtable pointer redirects execution. Safe Rust does not permit that corruption, and `unsafe` code manipulating trait object pointers is handling a control-flow-relevant value rather than mere data.

## Why the layout forces the rules

A trait can only be used behind `dyn` if it satisfies a list of dyn-compatibility conditions, enumerated in the traits note. Read the layout first and the list stops being arbitrary.

A vtable is a fixed array of entries, built when a concrete type is coerced, holding one function pointer per method. So:

**A generic method has no entry.** `fn process<U>(&self, u: U)` is not one function, it is a family of functions indexed by `U`, and monomorphization creates them only for the instantiations that appear. A vtable would need one slot per possible `U`, an unbounded number, decided at a coercion site that cannot see the call sites.

**A method returning `Self` has no callable entry.** Calling `fn clone_me(&self) -> Self` through a trait object requires space for a result whose size is the erased type's. The vtable does carry a size, but the caller's frame is laid out at compile time, so the return slot cannot be sized from a runtime value.

**A method taking a second `Self` cannot be dispatched.** The receiver's concrete type is hidden, so the caller has no way to produce another value of that same hidden type, and nothing checks that a second trait object holds the same type as the first.

**Receivers must be pointer-shaped.** A method dispatched through a trait object receives the value through a reference, `Box`, `Rc`, `Arc`, or `Pin` over one of those, because those are the forms that carry the fat pointer intact. A by-value `self` on an unsized type would require moving a value of unknown size.

**Opaque return types have no entry.** An `async fn` or a return-position `impl Trait` in a trait desugars to an associated type whose value differs per implementation, so the vtable slot would have a different signature for every implementor.

Each rule is the same sentence in different clothes: the entry must be one function with a fixed signature, decided when the vtable is built.

The associated-type requirement is the same argument one level up. A trait object's type must name every associated type, which is why `dyn Iterator` is rejected and `dyn Iterator<Item = u32>` is accepted. Otherwise two `dyn Iterator` values would have the same type and different `next` signatures, and the point of an associated type is that it is determined once you know the implementing type, which is exactly the thing `dyn` throws away.

> [!example] Why auto traits are free to add
> `dyn Trait + Send` is legal even though a trait object admits at most one non-auto trait, and the reason is layout. Auto traits are markers with no methods, so adding one contributes no vtable entries and changes nothing about the representation. It is a compile-time assertion attached to the type, not a runtime capability, and two trait object types alias each other when the base traits alias and the sets of auto traits and lifetime bounds are the same, which makes `dyn Trait + Send + Sync` and `dyn Trait + Sync + Send` one type.

Lifetimes are the last piece. Since a trait object can contain references, those lifetimes are expressed as part of the trait object type, written `dyn Trait + 'a`, with defaults that usually infer a sensible choice. The erasure is being honest about its limit: the concrete type is gone, but how long its borrows live is a fact nothing in the vtable can answer, so the type system carries it.

## Related Notes

- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds in Rust]] - the dyn-compatibility rules as a list, and the static dispatch alternative
- [[cs/languages/Rust/smart-pointers-box-rc-refcell|Smart Pointers: Box, Rc, and RefCell]] - the pointers a trait object lives behind, and how `Box<dyn Trait>` knows what to free
- [[cs/languages/Rust/slices-vec-and-capacity|Slices, Vec, and Capacity]] - the other wide pointer, carrying a length where this one carries a table
- [[cs/languages/Rust/associated-types-vs-type-parameters|Associated Types vs Type Parameters]] - why `dyn` forces every associated type to be named
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - vtables as a general implementation technique, and the designs that put them inside objects instead
- [[cs/security/control-flow-integrity|Control-Flow Integrity]] - what an indirect call through a stored function pointer means to an attacker

## Sources

- "Trait objects," The Rust Reference. https://doc.rust-lang.org/reference/types/trait-object.html . Supports trait objects being dynamically sized types used behind a pointer, the pair of a data pointer and a vtable holding one function pointer per method of the trait and its supertraits, late binding and virtual dispatch by loading a function pointer and invoking it indirectly, per-object variation of vtable entries, the composition rule allowing one non-auto trait plus any number of auto traits, aliasing of trait object types with reordered auto traits, and trait object lifetime bounds written `Trait + 'a`.
- "Exotically Sized Types," The Rustonomicon. https://doc.rust-lang.org/nomicon/exotic-sizes.html . Supports dynamically sized types lacking a statically known size, existing only behind pointers, any pointer to a DST becoming a wide pointer carrying completing information, the vtable pointer as that information for trait objects, the runtime size being requestable from the vtable, and the slice case where the completing information is the element count.
- "Generic associated types to be stable in Rust 1.65," The Rust Blog. https://blog.rust-lang.org/2022/10/28/gats-stabilization/ . Supports the requirement that a well-formed trait object specify a value for all associated types, illustrated by the rejection of a bare `dyn Iterator`.
- "std::ptr::DynMetadata," Rust standard library documentation. https://doc.rust-lang.org/std/ptr/struct.DynMetadata.html . Supports the metadata for a trait object type being a pointer to a vtable, and the vtable's contents: type size, type alignment, a pointer to the type's `drop_in_place` implementation which may be a no-op for plain-old-data, and pointers to all the methods of the type's implementation of the trait.
