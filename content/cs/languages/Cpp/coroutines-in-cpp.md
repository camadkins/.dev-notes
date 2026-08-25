---
title: Coroutines in C++
description: "The compiler transformation behind co_await, why the promise type is a protocol rather than a class, and why C++20 shipped a mechanism with no coroutine types to use it with."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-07-30
updated:
aliases: []
---

C++20 added three keywords, one header, and no coroutine. `<coroutine>` gives you a handle type, two trivial awaiter types, and a traits template. There is no `task`, no `future`-style awaitable, and until C++23 no `generator`. Writing `co_await` in a function makes it a coroutine and then requires you to have already supplied a type describing what that means. Most languages ship async as a package; C++ shipped a compiler transformation and a set of names it will call, and left the semantics to whoever writes the return type.

> [!note] The idea
> A C++ coroutine is a source-to-source rewrite whose target is a protocol you supply. The compiler splits your function at every suspension point, moves the locals that survive a suspension into a heap-allocated state object, and wraps the whole body in a fixed skeleton of calls to member functions of a type it deduces from your return type. Nothing about scheduling, threading, or laziness is in the language. Those are all decisions encoded in a class you write, which is why the same three keywords produce lazy generators, eager tasks, and thread-pool schedulers with no language support for any of them.

## Stackless, and what that forces

"A coroutine is a function that can suspend execution to be resumed later." The critical design decision follows immediately: "Coroutines are stackless: they suspend execution by returning to the caller, and the data that is required to resume execution is stored separately from the stack."

Stackless means there is no second stack to switch to. A suspension is an ordinary return, and everything the resumed function will need must have been copied somewhere that survives it. cppreference lists what the coroutine state holds: the promise object, the parameters copied by value, "some representation of the current suspension point, so that a resume knows where to continue," and "local variables and temporaries whose lifetime spans the current suspension point."

That last item is why this cannot be a library. Deciding which locals span a suspension point means knowing where the suspension points are and which variables are live across them, which is liveness analysis over the function body. No library performs it and no macro approximates it, while a stackful design dodges the question by allocating a whole stack per coroutine. C++ chose to pay a compiler transformation rather than a stack, and every other property of the feature is downstream of that; the wider design space is in [[cs/pl/coroutines-and-generators|coroutines and generators]].

The parameter rule has a sharp edge. Parameters are copied into the state, but "by-reference parameters remain references (thus, may become dangling, if the coroutine is resumed after the lifetime of referred object ends." A coroutine taking `const std::string&` and suspending is a dangling reference waiting for a caller who passed a temporary.

## The rewrite, stated normatively

The standard specifies the transformation as a textual substitution. The coroutine behaves as if "its function-body were replaced by" a replacement body: construct the promise object; inside a `try`, `co_await promise.initial_suspend()` and then run the original body; catch everything and call `promise.unhandled_exception()`; and at the end, `co_await promise.final_suspend()`.

Everything else fills in that skeleton. Starting a coroutine allocates the state, copies parameters, constructs the promise, calls `promise.get_return_object()` and holds the result, then awaits `initial_suspend()`. The draft is precise about what that return object is for: it "is used to initialize the returned reference or prvalue result object of a call to a coroutine." Your caller receives an object built before the body ever ran.

Which promise type? "The Promise type is determined by the compiler from the return type of the coroutine using" `std::coroutine_traits`. The return type is the only thing the caller wrote, so it is the only place the language can hang the configuration. Hence the constraint that "Every coroutine must have a return type that satisfies a number of requirements," and hence the fact that `co_await` on a plain function is a compile error about a missing `promise_type`.

`initial_suspend` alone decides one of the biggest semantic questions. Return `std::suspend_always` and the coroutine is lazy, doing nothing until someone resumes it, which is what a generator wants. Return `std::suspend_never` and it runs eagerly to its first real suspension, which is what a task usually wants. Same keywords, opposite behavior, selected by one member function in a class you wrote.

## Suspension is a three-call protocol

`co_await expr` is not one operation. "The unary operator co_await suspends a coroutine and returns control to the caller," and the way it does so runs through three members of an awaiter object.

`await_ready()` comes first, described as "this is a short-cut to avoid the cost of suspension if it" is already known that the result is available. Returning true skips suspension entirely, which is what makes an already-completed asynchronous operation cost roughly nothing.

If it returns false, the state is populated and `await_suspend(handle)` is called. This is where scheduling lives, and the return type of that one function selects the behavior: `void` returns control to the caller, `bool` chooses between returning and resuming immediately, and returning another handle performs symmetric transfer, since "if await_suspend returns a coroutine handle for some other coroutine, that handle is resumed." That third form is a tail call between coroutines, and it is what lets a chain of awaiting tasks resume its continuation without growing the stack, the same idea [[cs/pl/continuations-cps|continuations and CPS]] formalizes.

Then `await_resume()` runs, whether or not a suspension happened, and its result is the value of the whole `co_await` expression.

> [!warning] The coroutine is already suspended when await_suspend runs
> cppreference states it directly: "Note that the coroutine is fully suspended before entering" `await_suspend`, and "Its handle can be shared with another thread and resumed before the" function returns. So the coroutine you are in the middle of suspending may already be running elsewhere, may already have finished, and may already have destroyed the awaiter object whose member function you are executing. The guidance is to treat `*this` as destroyed after publishing the handle. The synchronization requirement is the one from [[cs/languages/Cpp/the-cpp-memory-model-and-atomics|the memory model]]: "the awaiter should use at least release semantics and the resumer should use at least acquire semantics."

## The allocation, and the escape

"Coroutine state is allocated dynamically via non-array operator" new, which is the feature's main cost. The promise type may supply a class-level replacement, and a placement form receiving the coroutine's own arguments, so the allocation is at least controllable. It can also vanish. The call to operator new can be optimized out, even with a custom allocator, when "The lifetime of the coroutine state is strictly nested within the lifetime of the caller" and the size of the state is known at the call site. "In that case, coroutine state is embedded in the caller's" frame, or in the caller's own coroutine state if the caller is itself a coroutine. That elision is not guaranteed by the standard, which is the honest summary of the feature's performance story: the abstraction is free when the optimizer can see through it and costs a heap allocation when it cannot.

## Mechanism, not policy

The absence of library types in C++20 was the design, not an oversight. A coroutine's behavior is entirely determined by its promise type, so shipping one `task` would have fixed a scheduling model, an eagerness policy, an error-propagation strategy, and an allocator convention for everyone. The committee specified the protocol instead and let library authors compete, then standardized one result: `std::generator`, a "synchronous coroutine generator for ranges," arrives in C++23.

The cost is visible to anyone who has written a first coroutine. The smallest promise type in the standard's own example still declares `get_return_object`, `initial_suspend`, `final_suspend`, `unhandled_exception`, and a `return_void` or `yield_value`, and none of the error messages name the one you forgot. Compare [[cs/languages/CSharp/async-await-and-the-state-machine|C# async and await]], which ships the state machine and the task type together, or [[cs/languages/Rust/async-rust-futures-and-pinning|Rust futures]], which fix one `Future` trait and leave only the executor open. C++ opened the widest hole of the three, and got the widest range of libraries and the steepest first day.

## Related Notes

- [[cs/pl/coroutines-and-generators|Coroutines and Generators]] - stackful against stackless, and where C++ sits in that space
- [[cs/pl/continuations-cps|Continuations and CPS]] - what symmetric transfer between coroutines is a special case of
- [[cs/languages/CSharp/async-await-and-the-state-machine|async, await, and the State Machine]] - the same transformation with the policy decided for you
- [[cs/languages/Rust/async-rust-futures-and-pinning|Async Rust, Futures, and Pinning]] - one trait in the language, the executor left open
- [[cs/languages/Cpp/the-cpp-memory-model-and-atomics|The C++ Memory Model and Atomics]] - the ordering a handle published across threads requires
- [[cs/languages/Cpp/lambdas-and-captures|Lambdas and Captures]] - the other C++ feature that is a compiler rewrite into a type you never name

## Sources

- "Coroutines," cppreference.com. https://en.cppreference.com/w/cpp/language/coroutines.html . Supports the definition of a coroutine and its stackless design, the contents of the coroutine state including parameters copied by value and locals spanning a suspension point, by-reference parameters remaining references and possibly dangling, the requirement that every coroutine have a suitable return type, the promise object and coroutine handle roles, the promise type being deduced from the return type via coroutine_traits, dynamic allocation of the state via non-array operator new and the conditions under which that allocation may be elided into the caller's frame, the co_await protocol of await_ready, await_suspend, and await_resume including symmetric transfer, and the warning that the coroutine is fully suspended before await_suspend runs with the release and acquire requirement.
- "Coroutine definitions," C++ working draft, eel.is/c++draft. https://eel.is/c++draft/dcl.fct.def.coroutine . Supports the normative replacement body with the promise construction, initial suspend, catch calling unhandled_exception, and final suspend; get_return_object initializing the result object of the call; and resuming a coroutine that is not suspended being undefined behavior.
