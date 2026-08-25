---
title: RAII and Object Lifetime
description: "Resource Acquisition Is Initialization: binding a resource's life cycle to an object's lifetime, why the destructor is the only reliable cleanup path, and what the standard actually promises about when lifetime ends."
draft: false
comments: true
tags:
  - cs
  - languages
  - memory
date: 2026-02-17
updated:
aliases:
  - RAII
  - SBRM
---

A function that locks a mutex, does some work, and unlocks it has to unlock on every path out. The early `return` someone adds six months later is one path. The exception thrown three frames down inside the work is another, and that one is invisible in the function's own source text. C++ has no `finally` block. What it has instead is a guarantee about destructors, and RAII is the technique of routing every cleanup obligation through that guarantee.

The cross-language framing of who releases memory sits in [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]]. This note is about the C++ mechanism underneath: what the technique requires of a class, what the language promises about lifetime, and where the promise stops.

> [!note] The idea
> RAII is not primarily a memory-management trick. It is the observation that C++ already enforces one form of paired symmetry unconditionally, constructor to destructor, and that any other acquire/release pair (`fopen`/`fclose`, `lock`/`unlock`, `new`/`delete`) can be smuggled into that pair and inherit its enforcement. The non-obvious consequence is that resource availability stops being a runtime question. cppreference states it directly: resource availability becomes a class invariant, which eliminates redundant runtime tests. A `lock_guard` that exists is a lock that is held. There is no failed or half-constructed state to check for.

## The definition, and the two halves of it

cppreference defines RAII as a C++ programming technique which binds the life cycle of a resource that must be acquired before use to the lifetime of an object. The parenthetical list of what counts as a resource is worth reading in full, because it is much wider than the heap: allocated heap memory, thread of execution, [[cs/networking/ports-and-sockets|open socket]], open file, [[cs/systems/concurrency-primitives|locked mutex]], disk space, database connection, anything that exists in limited supply.

The technique has a two-part summary on that page. Encapsulate each resource into a class where the constructor acquires the resource and establishes all class invariants or throws an exception if that cannot be done, and the destructor releases the resource and never throws exceptions. Then always use the resource via an instance of a RAII class that either has automatic storage duration or temporary lifetime itself, or has lifetime bounded by the lifetime of an automatic or temporary object.

Both halves are load-bearing and the second is the one people skip. A perfectly written RAII class allocated with bare `new` and never deleted leaks exactly as hard as the raw resource did. The class only helps when its own lifetime is nailed to a scope.

The constructor-throws clause matters too. It is what makes "the object exists" equivalent to "the resource is held". If a constructor could return an object in a failed state, callers would be back to checking, and the invariant would be gone.

## What the guarantee actually covers

cppreference lists what RAII buys, and the second and third items are the ones that are hard to reproduce by hand. All resources are released when the lifetime of their controlling object ends, in reverse order of acquisition. And if resource acquisition fails, meaning the constructor exits with an exception, all resources acquired by every fully-constructed member and base subobject are released in reverse order of initialization.

That second clause is the interesting one. A class with four resource-holding members whose fourth member's constructor throws does not leak the first three. The language unwinds the partially constructed object for you, releasing exactly the subobjects that finished initializing, in reverse. Writing that by hand with raw handles means tracking how far you got and cleaning up a prefix, per constructor, forever.

cppreference names the underlying machinery: RAII leverages the core language features of object lifetime, scope exit, order of initialization, and [[cs/languages/Cpp/exceptions-and-stack-unwinding|stack unwinding]] to eliminate resource leaks and guarantee exception safety. The alternative name for the technique, Scope-Bound Resource Management (SBRM), comes from the basic case where the RAII object's lifetime ends due to scope exit.

## The canonical before and after

The cppreference illustration is a mutex, and it is worth reading as two failure surfaces rather than two code styles.

The non-RAII version calls `m.lock()`, then work, then `m.unlock()`. Its annotations mark the holes: if `f()` throws an exception the mutex is never released, and the early `return` also never releases it. The mutex is released only if the function reaches the final statement.

The RAII version replaces all of that with `std::lock_guard<std::mutex> lk(m);` at the top, and the comment on that line is the whole technique in five words: mutex acquisition is initialization. Now the exception path releases the mutex, the early return releases the mutex, and normal return releases the mutex.

cppreference generalizes the diagnostic: classes with `open()`/`close()`, `lock()`/`unlock()`, or `init()`/`copyFrom()`/`destroy()` member functions are typical examples of non-RAII classes. If a type's interface has a pair of functions you must call in order, the type is asking its users to be correct on every control-flow path. The C++ Core Guidelines rule R.1 puts the same point structurally: C++'s language-enforced constructor/destructor symmetry mirrors the symmetry inherent in resource acquire/release function pairs such as `fopen`/`fclose`, `lock`/`unlock`, and `new`/`delete`.

## Lifetime is a runtime property with a specification

"Goes out of scope" is loose talk. The standard's notion is lifetime, and cppreference's object-lifetime page states that every object and reference has a lifetime, which is a runtime property: there is a point of execution when its lifetime begins and a moment when it ends.

Lifetime begins when storage with the proper alignment and size for the type is obtained and its initialization, if any, is complete. Lifetime ends, for a class-type object, when the destructor call starts. Non-class objects end when destroyed, and any object's lifetime ends if the storage it occupies is released or is reused by an object not nested within it.

Two details from that page have direct consequences for RAII code.

Temporaries are destroyed at the end of the full expression. All temporary objects are destroyed as the last step in evaluating the full expression that lexically contains the point where they were created, and if multiple temporaries were created they are destroyed in the order opposite to creation. cppreference notes this holds even if that evaluation ends in throwing an exception. This is why an unnamed `std::lock_guard<std::mutex>(m)` is a bug: it is a temporary, so it locks and unlocks within the same statement. The named variable is the point.

References have their own lifetime, separate from the referent. The lifetime of a reference begins when its initialization is complete and ends as if it were a scalar object, and cppreference attaches the note that the lifetime of the referred object may end before the end of the lifetime of the reference, which makes [[cs/security/use-after-free-and-heap-exploitation|dangling references]] possible. A reference outliving its referent is the C++ hole that Rust's borrow checker was built to close; see [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes]] for the contrast.

> [!warning] RAII does not cover resources you do not acquire
> cppreference is explicit about the boundary. RAII does not apply to the management of resources that are not acquired before use: CPU time, core availability, cache capacity, entropy pool capacity, network bandwidth, electric power consumption, stack memory. For those, a constructor cannot guarantee availability for the duration of the object's lifetime, and other means of resource management have to be used. The technique needs something to hold. A resource you merely consume as you run is not holdable, so no destructor can release it.

## What the standard library already does for you

cppreference lists the library types that manage their own resources following RAII: `std::string`, `std::vector`, `std::jthread` (since C++20), and many others acquire their resources in constructors that throw exceptions on errors, release them in destructors that never throw, and require no explicit cleanup. On top of that the library ships wrappers for user-provided resources: `std::unique_ptr` and `std::shared_ptr` (via `std::make_unique` and `std::make_shared`) for dynamically allocated memory, and `std::lock_guard`, `std::unique_lock`, and `std::shared_lock` for mutexes.

The practical reading of that list is that most C++ code should be composing RAII types rather than writing them. Core Guideline E.6 makes the same point in ascending order of preference: the `new int[12]` version leaks on throw, the explicit-release version is called clumsy and error-prone, `make_unique<int[]>(12)` is fine, and the guideline then adds that unless you really need pointer semantics you should use a local resource object such as `vector<int> v(12)`, which is simpler, safer, and often more efficient. A class that holds no resources of its own and simply has RAII members needs no destructor at all, which is where [[cs/languages/Cpp/the-rule-of-zero-three-five|The Rule of Zero, Three, and Five]] picks up.

> [!example] Wrapping an ill-behaved C handle
> Core Guideline R.1 gives the minimal wrapper for a resource that is not already a class. `Port` holds a `PortHandle` member, its constructor initializes that member from `open_port(destination)`, its destructor calls `close_port(port)`, and it provides `operator PortHandle()` so it can be passed where the raw handle is expected. It then writes `Port(const Port&) = delete;` and `Port& operator=(const Port&) = delete;`, with the comment that port handles usually cannot be cloned, so disable copying and assignment if necessary. The deletes are the part that beginners omit, and they are the difference between a wrapper and a double-close waiting to happen. The guideline's own summary of the rewritten `send` function is the payoff: all resource cleanup is automatic, performed once on all paths whether or not there is an exception, and as a bonus the function now advertises that it takes over ownership of the pointer.

## Related Notes

- [[cs/languages/Cpp/smart-pointers|Smart Pointers in C++]] - the standard library's RAII wrappers for heap memory, and ownership written into the type
- [[cs/languages/Cpp/the-rule-of-zero-three-five|The Rule of Zero, Three, and Five]] - which special member functions a resource-owning class owes, and why owing none is better
- [[cs/languages/Cpp/move-semantics-and-rvalue-references|Move Semantics and Rvalue References]] - how a scope-bound resource escapes its scope without being copied
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - RAII placed next to manual freeing, reference counting, and tracing collection
- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves in Rust]] - the same destructor-at-scope-exit idea with uniqueness enforced by a checker
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - the control-flow paths RAII exists to survive
- [[cs/pl/garbage-collection-concepts|Garbage Collection Concepts]] - the other answer to the same question, with different timing guarantees

## Sources

- "RAII," cppreference.com. https://en.cppreference.com/w/cpp/language/raii.html . Supports the definition and resource list, the two-part summary (constructor acquires or throws, destructor releases and never throws; use via automatic or temporary storage duration), release in reverse order of acquisition, cleanup of fully-constructed subobjects when a constructor throws, the class-invariant framing, the SBRM name, the mutex before/after example including the `lock_guard` comment, the non-RAII interface smell, the standard-library RAII types and wrappers, and the note on resources RAII cannot manage.
- "Lifetime," cppreference.com. https://en.cppreference.com/w/cpp/language/lifetime.html . Supports lifetime as a runtime property, when lifetime begins and ends (including destructor-call start for class types), destruction of temporaries at the end of the full expression in reverse order of creation even when an exception is thrown, and reference lifetime with the dangling-reference note.
- "C++ Core Guidelines," isocpp.github.io. https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines . Supports rule R.1 (constructor/destructor symmetry mirroring acquire/release pairs, the `Port` wrapper with deleted copy operations, and the automatic-cleanup-on-all-paths conclusion) and rule E.6 (the leaking, clumsy, `make_unique`, and local-object versions in ascending order of preference).
