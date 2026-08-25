---
title: Exceptions and Stack Unwinding
description: "What throwing actually does to the call stack, why RAII is not merely a convention but load-bearing during unwinding, what noexcept promises and does not check, and where the zero-cost model puts its bill."
draft: false
comments: true
tags:
  - cs
  - languages
  - error-handling
date: 2026-06-27
updated:
aliases: []
---

A `throw` looks like a `return` that skips several frames. It is not. A return unwinds one frame in a way the compiler planned when it emitted the function. A throw hands control to a runtime that has to walk frames it was not told about in advance, run destructors it finds along the way, compare the thrown type against handler types at each level, and get all of that right in the presence of partially constructed objects. Almost every surprising rule about C++ exceptions is a consequence of doing that safely.

> [!note] The idea
> The exception mechanism is a promise to run destructors on the way out, and it is only as good as the destructors. C++ made that promise structural by giving every automatic object a destructor call during unwinding, which is why RAII is not a style preference in this language but the only cleanup mechanism the exception path knows about. A resource released by code at the bottom of a function is not released when the function exits through a throw. A resource released by a destructor is.

## What the throw expression does first

Before any control transfer, an object is created. "Throwing an exception initializes an object with dynamic storage duration," called the exception object, copy-initialized from the operand. Its type is the operand's type with top-level cv-qualifiers removed, which is the reason `throw e;` inside a handler slices a derived exception back to its static type and `throw;` does not.

Where that object lives is deliberately unspecified. "The memory for the exception object is allocated in an unspecified way. The only guarantee is that the storage will never be allocated by global allocation" functions. Implementations use a dedicated emergency buffer precisely so that throwing `std::bad_alloc` does not require a successful allocation.

Then the search begins. "the control flow works backwards (up the call stack) until it reaches the start of a try block," at which point each handler's parameter type is compared, in order of appearance, against the exception object's type. No match means unwinding continues to the next enclosing try block. This is a dynamic search, not a static jump, and it is what separates exceptions from the local non-local control transfers catalogued in [[cs/pl/exceptions-handlers-and-non-local-control|exceptions, handlers, and non-local control]].

## Unwinding is the destructor pass

The part that matters is what happens between frames. As control moves up the stack, "destructors are invoked for all objects with automatic storage duration that are constructed, but not yet destroyed, since the corresponding try block was entered, in reverse order of completion of their constructors."

Read the qualifiers. Constructed but not yet destroyed: an object whose constructor is still running is not yet an object, so it does not get a destructor. In reverse order of completion of their constructors: the unwinder replays construction order backwards, which is the same guarantee normal scope exit gives. That symmetry is the whole design, and it is what [[cs/languages/Cpp/raii-and-object-lifetime|RAII]] is built on.

The partial-construction case is handled explicitly. "If an exception is thrown from a constructor or (rare) from a destructor of an object" then destructors run for all fully-constructed non-static non-variant members and base classes, again in reverse order. So a constructor that throws halfway through leaves no half-owned members, and, when the object was being created by a new-expression, the matching deallocation function is called if available. This is why a constructor may throw at all: it is the only way to report failure from a function with no return value, and the language guarantees the wreckage is cleaned up.

> [!warning] Throwing during unwinding ends the program
> "If any function that is called directly by the stack unwinding mechanism, after initialization of the exception object and before the start of the exception handler, exits with an exception, std::terminate is called." Those functions include the destructors of the automatic objects being unwound. There is no defined answer to which of two simultaneous exceptions wins, so the standard declines to have one. That is the entire reason destructors are non-throwing by default in C++11 and later, and the reason a destructor that can fail is a design error rather than an inconvenience.

One asymmetry catches people out. An exception that is never caught also calls `std::terminate`, but "It is implementation-defined whether any stack unwinding takes place for uncaught exceptions." A debugger may show you the throw site with the stack intact, or may show you a program that already ran every destructor. Neither is wrong.

## noexcept is a promise, not a proof

`noexcept` reads like a static check and is not one. cppreference is unambiguous: "Note that a noexcept specification on a function is not a compile-time check; it is merely a method for a programmer to inform the compiler whether or not a function should throw exceptions." Nothing verifies it. "Non-throwing functions are permitted to call potentially-throwing functions." The enforcement is at runtime and it is terminal: "Whenever an exception is thrown and the search for a handler encounters the outermost block of a non-throwing function, the function std::terminate is called."

So the specifier is an assertion whose penalty for being wrong is death rather than a diagnostic. What you buy with it is optimization and library behavior. The optimization is that the compiler need not maintain the machinery to unwind through the function. The library behavior is more visible than most people realize: "containers such as std::vector will move their elements if the elements" move constructor is noexcept, and copy otherwise. A move constructor that forgets `noexcept` silently converts every reallocation of a vector of that type from moves into copies. Marking one correctly is a performance decision, not documentation.

The rule interacts with virtual dispatch in the one direction that preserves substitutability: "If a virtual function is non-throwing, all declarations, including the definition, of every overrider must be non-throwing as well." A caller holding a base reference relied on the promise, so an override cannot revoke it.

## Where the cost actually is

The design goal is that code which does not throw pays nothing on the happy path. The standard mandates no mechanism for this, and the phases of the search described above are stated as behavior rather than as instructions to emit, which leaves an implementation free to keep the bookkeeping outside the function body entirely and consult it only when an exception is in flight. The C++11 revision of the older `throw()` specification was made in exactly this spirit: unlike pre-C++17 `throw()`, `noexcept` "may or may not unwind the stack, and will call" `std::terminate`, "which potentially allows the compiler to implement noexcept without the runtime overhead of throw" with parentheses.

The isocpp FAQ gives the resulting profile in plain terms. "Modern C++ implementations reduce the overhead of using exceptions to a few percent (say, 3%)" compared with doing no error handling at all, and "It costs nothing on some implementations." The bill arrives later: "All the cost is incurred when you throw an exception," and "You incur cost only when you have an error."

That shape is the whole argument, and the whole objection. It is excellent when errors are rare, because the common path is faster than one threaded with status checks. It is a poor fit when errors are routine, since every one of them pays the full price, and a poor fit under a hard latency bound, since the search is dynamic and its length is not known in advance. That is why real-time and embedded codebases disable exceptions and reach for [[cs/languages/common/errors-as-values-vs-control-flow|errors as values]] instead, and why [[cs/languages/Rust/panic-unwinding-and-abort|Rust's panic]] keeps the same unwinder for bugs while routing expected failures through a return type. Viewed abstractly, a handler is a delimited continuation captured by the enclosing try block, and the cost model above is what it takes to reconstruct one that was never explicitly built; see [[cs/pl/continuations-cps|continuations and CPS]] for that framing.

## Related Notes

- [[cs/languages/Cpp/raii-and-object-lifetime|RAII and Object Lifetime]] - the destructor guarantee unwinding depends on
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - the general mechanism and its alternatives
- [[cs/pl/continuations-cps|Continuations and CPS]] - what a handler is, stated without a stack
- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] - the design chosen when throwing is not affordable
- [[cs/languages/Rust/panic-unwinding-and-abort|Panic, Unwinding, and Abort]] - the same machinery reserved for bugs rather than errors
- [[cs/languages/Cpp/the-rule-of-zero-three-five|The Rule of Zero, Three, and Five]] - why a throwing destructor is a design error and not a tradeoff

## Sources

- "throw expression," cppreference.com. https://en.cppreference.com/w/cpp/language/throw.html . Supports the exception object being initialized with dynamic storage duration, its memory being allocated in an unspecified way and never by global allocation functions, the backwards search for a try block and handler matching in order of appearance, destructors running for constructed-but-not-destroyed automatic objects in reverse order of construction completion, the constructor and destructor partial-construction rules, std::terminate when a function called by the unwinding mechanism itself exits with an exception, and unwinding for uncaught exceptions being implementation-defined.
- "noexcept specifier," cppreference.com. https://en.cppreference.com/w/cpp/language/noexcept_spec.html . Supports noexcept not being a compile-time check, non-throwing functions being permitted to call potentially-throwing ones, std::terminate on an exception reaching the outermost block of a non-throwing function, std::vector selecting moves only when the move constructor is noexcept, the requirement that overriders of a non-throwing virtual function also be non-throwing, and noexcept permitting implementation without the runtime overhead of throw().
- "Exceptions and Error Handling," isocpp.org. https://isocpp.org/wiki/faq/exceptions . Supports the overhead figure of a few percent against no error handling, exception handling costing nothing on some implementations, and all of the cost being incurred at the throw.
