---
title: Smart Pointers in C++
description: unique_ptr, shared_ptr, and weak_ptr as ownership written into the type. The control block, the two reference counts, the cycle leak, and the deletion asymmetry between unique and shared.
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-06-11
updated:
aliases: []
---

A `T*` parameter tells you almost nothing. It might be an object you must delete, an object someone else deletes, the first element of an array, or nothing at all. Every one of those readings compiles. The smart pointer types exist so that the ownership question, which used to live in a comment or a naming convention, moves into the type where the compiler and the reader both see it.

The general taxonomy of memory-management strategies is in [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]]. This note is the C++ specifics: what each type promises, what it costs at runtime, and the two failure modes that survive.

> [!note] The idea
> The three smart pointers are not three levels of convenience. They encode three genuinely different ownership relations, and the copyability of each type is the encoding. `unique_ptr` satisfies MoveConstructible and MoveAssignable but neither CopyConstructible nor CopyAssignable, so the type system itself forbids a second owner. `shared_ptr` is copyable because shared ownership is the point. `weak_ptr` cannot be dereferenced at all without first being converted, because a non-owning observer must be forced to ask whether the object still exists. The non-obvious part is that reference counting alone cannot free a cycle, so `weak_ptr` is not a convenience over `shared_ptr`, it is the repair for a structural hole in `shared_ptr`.

## unique_ptr: one owner, no runtime cost for the ownership

cppreference defines `std::unique_ptr` as a smart pointer that owns and manages another object via a pointer and subsequently disposes of that object when the `unique_ptr` goes out of scope. Disposal happens when the managing object is destroyed, or when it is assigned another pointer via `operator=` or `reset()`. The object is disposed of by calling `get_deleter()(ptr)`, and the default deleter, `std::default_delete`, uses the `delete` operator, which destroys the object and deallocates the memory. A `unique_ptr` may own no object, in which case it is described as empty.

There are two versions: one managing a single object (allocated with `new`) and one managing a dynamically allocated array of objects (allocated with `new[]`). That distinction exists because `delete` and `delete[]` are different operators and picking the wrong one is not recoverable.

The copyability rule is the whole design in one sentence. The class satisfies the requirements of MoveConstructible and MoveAssignable, but of neither CopyConstructible nor CopyAssignable. Uniqueness is not a documented promise you might violate; it is a compile error. This is exactly the point where [[cs/languages/Cpp/move-semantics-and-rvalue-references|move semantics]] stops being an optimization and becomes load-bearing, since a move is the only way to transfer the ownership at all.

cppreference lists what the type is commonly used for, and the list reads as a set of guarantees the raw pointer could not make: providing exception safety to classes and functions handling objects with dynamic lifetime, by guaranteeing deletion on both normal exit and exit through exception; passing ownership of uniquely owned objects into functions; acquiring ownership from functions; and serving as the element type in move-aware containers such as `std::vector` when polymorphic behavior is desired.

Three sharp edges worth knowing.

Only non-const `unique_ptr` can transfer ownership of the managed object to another `unique_ptr`. If an object's lifetime is managed by a `const std::unique_ptr`, it is limited to the scope in which the pointer was created.

It works with incomplete types, which is why it is the standard handle for the pImpl idiom. cppreference notes that if the default deleter is used, `T` must be complete at the point where the deleter is invoked, which happens in the destructor, move assignment operator, and `reset` member function.

And the base-class trap: if `T` derives from `B`, then `unique_ptr<T>` is implicitly convertible to `unique_ptr<B>`, and the default deleter of the resulting `unique_ptr<B>` will use `operator delete` for `B`, leading to undefined behavior unless the destructor of `B` is virtual. cppreference explicitly contrasts this with `shared_ptr`, which behaves differently: `shared_ptr<B>` will use the `operator delete` for the type `T`, and the owned object will be deleted correctly even if the destructor of `B` is not virtual.

That asymmetry is not arbitrary. `unique_ptr` carries its deleter in its type, so converting the type converts the deleter. `shared_ptr` type-erases the deleter into a separate object, so the deleter chosen at construction survives every conversion. Which brings us to that object.

## shared_ptr and the control block

`std::shared_ptr` retains shared ownership of an object through a pointer, and several `shared_ptr` objects may own the same object. The object is destroyed and its memory deallocated when the last remaining `shared_ptr` owning it is destroyed, or when the last remaining one is assigned another pointer via `operator=` or `reset()`. Destruction goes through a delete-expression or a custom deleter supplied at construction.

cppreference's implementation notes describe the machinery, flagged as a typical implementation rather than a mandate. A `shared_ptr` holds only two pointers: the stored pointer (the one returned by `get()`) and a pointer to a control block. The control block is a dynamically allocated object holding either a pointer to the managed object or the managed object itself, the deleter (type-erased), the allocator (type-erased), the number of `shared_ptr`s that own the managed object, and the number of `weak_ptr`s that refer to it.

Two counts, not one. That detail is the reason `weak_ptr` can work at all, and it drives the destruction protocol: the destructor of `shared_ptr` decrements the number of shared owners, and if that counter reaches zero the control block calls the destructor of the managed object; the control block does not deallocate itself until the `weak_ptr` counter reaches zero as well. So the object dies at shared-count zero and the bookkeeping dies later, at weak-count zero.

`std::make_shared` is more than tidier syntax. cppreference states that when a `shared_ptr` is created by calling `std::make_shared` or `std::allocate_shared`, the memory for both the control block and the managed object is created with a single allocation, and the managed object is constructed in place in a data member of the control block; when created via one of the `shared_ptr` constructors instead, the managed object and the control block must be allocated separately. One allocation versus two, and better locality between the count and the thing it counts.

The counts are not free. To satisfy thread safety requirements, cppreference notes the reference counters are typically incremented using an equivalent of `std::atomic::fetch_add` with `std::memory_order_relaxed`, and that decrementing requires stronger ordering to safely destroy the control block. Copying a `shared_ptr` is an atomic read-modify-write on a [[cs/systems/cache-coherence|shared cache line]]. In a hot loop across threads that is a real cost, which is the practical argument for passing `const shared_ptr&` or a raw reference when you are not taking ownership. Related tradeoffs across languages are in [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]].

> [!warning] Thread safety covers the pointer's bookkeeping, not the object
> cppreference is precise: all member functions, including copy constructor and copy assignment, can be called by multiple threads on different `shared_ptr` objects without additional synchronization even if these objects are copies and share ownership of the same object. But if multiple threads access **the same** `shared_ptr` object without synchronization and any of those accesses uses a non-const member function, a data race will occur, and `std::atomic<shared_ptr>` can be used to prevent it. The reference count is thread-safe. The pointee is your problem, and so is a single `shared_ptr` variable being reassigned under you.

One more rule that catches people who mix raw and smart pointers: ownership can be shared with another `shared_ptr` only by copy constructing or copy assigning its value, and constructing a new `shared_ptr` from the raw underlying pointer owned by another `shared_ptr` leads to undefined behavior. Two `shared_ptr`s built separately from the same `T*` get two independent control blocks, two counts that each reach zero, and one object [[cs/security/use-after-free-and-heap-exploitation|deleted twice]].

## The cycle, and weak_ptr as the repair

`std::weak_ptr` holds a non-owning reference to an object managed by `std::shared_ptr`, and it must be converted to `std::shared_ptr` in order to access the referenced object. cppreference gives it two jobs.

The first is temporary ownership: when an object needs to be accessed only if it exists, and it may be deleted at any time by someone else, `weak_ptr` tracks the object and is converted to `shared_ptr` to acquire temporary ownership. If the original `shared_ptr` is destroyed at that moment, the object's lifetime is extended until the temporary `shared_ptr` is destroyed as well. The check and the acquisition are one atomic step, which is why `expired()` followed by construction is the wrong pattern and `lock()` is the right one.

The second job is the structural one. cppreference states that another use is to break reference cycles formed by objects managed by `shared_ptr`, and that if such a cycle is orphaned, meaning there are no outside shared pointers into the cycle, the `shared_ptr` reference counts cannot reach zero and the memory is leaked. To prevent this, one of the pointers in the cycle can be made weak.

This is the classic limitation of reference counting as a discipline, not a bug in the implementation. Two nodes pointing at each other each hold the other's count at one, forever, with nobody reachable to decrement them. A tracing collector finds this case by starting from roots and observing that neither node is reachable; a counter cannot, because a count is local information. The comparison is in [[cs/pl/garbage-collection-concepts|Garbage Collection Concepts]], and the same problem shows up as `Rc` versus `Weak` in [[cs/languages/Rust/smart-pointers-box-rc-refcell|Rust's Box, Rc, and RefCell]].

The practical rule this yields: in a parent-child structure where children need to see their parent, the parent owns children with `shared_ptr` and children point back with `weak_ptr`. Ownership goes one direction; observation goes the other.

> [!example] Checking and using in one step
> cppreference's `weak_ptr` example keeps a global `std::weak_ptr<int> gw;` and an `observe()` function that prints `gw.use_count()` and then writes `if (std::shared_ptr<int> spt = gw.lock())`, with the comment that we have to make a copy of the shared pointer before usage. In `main`, `auto sp = std::make_shared<int>(42); gw = sp;` then `observe()` inside a block, and `observe()` again after the block ends. The output is two lines: `gw.use_count() == 1; *spt == 42` and then `gw.use_count() == 0; gw is expired`. `use_count()` returns the number of `shared_ptr` objects that manage the object, which is why the weak pointer's own existence does not keep the count above zero, and `expired()` checks whether the referenced object was already deleted.

`weak_ptr`'s own representation mirrors `shared_ptr`'s: cppreference notes a typical implementation stores a pointer to the control block and the stored pointer of the `shared_ptr` it was constructed from, and that it is not possible to access the stored pointer in a `weak_ptr` without locking it into a `shared_ptr`. The inaccessibility is the safety property. There is no way to accidentally dereference an observer.

> [!tip] Choosing
> Default to `unique_ptr`; it is the cheapest and it states the strongest fact. Reach for `shared_ptr` only when the object genuinely has several independent owners with no single one outliving the rest, and accept the atomic counts as the price. Reach for `weak_ptr` when a reference must not extend a lifetime, either to break a cycle or to observe something that may already be gone. And where the object can simply be a member or a local, use no pointer at all, which is where the [[cs/languages/Cpp/raii-and-object-lifetime|plain RAII]] answer beats all three.

## Related Notes

- [[cs/languages/Cpp/raii-and-object-lifetime|RAII and Object Lifetime]] - the technique these types are library instances of
- [[cs/languages/Cpp/move-semantics-and-rvalue-references|Move Semantics and Rvalue References]] - the only way to transfer a `unique_ptr`, and why that is enforced by the type
- [[cs/languages/Cpp/the-rule-of-zero-three-five|The Rule of Zero, Three, and Five]] - holding smart pointers as members is how a class earns zero special member functions
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - reference counting placed next to manual freeing and tracing collection
- [[cs/languages/Rust/smart-pointers-box-rc-refcell|Smart Pointers: Box, Rc, and RefCell]] - the same three relations in a language that checks them statically
- [[cs/pl/garbage-collection-concepts|Garbage Collection Concepts]] - why a tracing collector reclaims the cycle a counter cannot
- [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]] - the cost of atomic reference counts under contention
- [[cs/dsa/dynamic-memory-allocation|Dynamic Memory Allocation]] - the double-free and leak failure modes underneath

## Sources

- "std::unique_ptr," cppreference.com. https://en.cppreference.com/w/cpp/memory/unique_ptr.html . Supports the definition and disposal conditions, `get_deleter()(ptr)` and `std::default_delete`, the empty state, the single-object and array versions, MoveConstructible/MoveAssignable but not CopyConstructible/CopyAssignable, the common uses list, the const-`unique_ptr` restriction on ownership transfer, incomplete-type support with the completeness requirement at deleter invocation, and the derived-to-base conversion hazard with the `shared_ptr` contrast.
- "std::shared_ptr," cppreference.com. https://en.cppreference.com/w/cpp/memory/shared_ptr.html . Supports shared ownership and the two destruction conditions, the two-pointer representation and the control block contents including both counts, `make_shared` and `allocate_shared` using a single allocation with in-place construction, the destruction protocol (object at shared-count zero, control block at weak-count zero), the relaxed atomic increment note, the thread-safety statement about different versus the same `shared_ptr` object, and the undefined behavior of building a second `shared_ptr` from another's raw pointer.
- "std::weak_ptr," cppreference.com. https://en.cppreference.com/w/cpp/memory/weak_ptr.html . Supports the non-owning definition and required conversion, the temporary-ownership model with lifetime extension, cycle breaking and the orphaned-cycle leak, the `use_count`/`expired`/`lock` observers, the `lock()` example and its output, and the two-pointer implementation with no access to the stored pointer without locking.
