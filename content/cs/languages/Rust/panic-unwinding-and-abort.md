---
title: "Panic, Unwinding, and Abort"
description: "What panicking does to the stack, why the two strategies are a build-time choice, and the precise sense in which a panic is not an exception."
draft: false
comments: true
tags:
  - cs
  - languages
  - error-handling
date: 2026-08-11
updated:
aliases:
  - Unwinding
  - catch_unwind
---

Rust has two error mechanisms and the distinction between them is a claim about the error, not about ergonomics. `Result` is for a failure the caller is expected to handle. Panic is the other one: a mechanism to prevent a function from returning normally, in response to an error condition that is typically not expected to be recoverable within the context in which the error is encountered. Recoverable errors and the `?` operator are covered in [[cs/languages/Rust/error-handling-result-and-question-mark|error handling]]; this note is about what happens after the decision to stop.

> [!note] The idea
> The panic strategy is a property of the build, not of the code. The same source compiled with `-C panic=abort` and `-C panic=unwind` produces programs with different semantics: in one, destructors run as the stack comes apart and a thread boundary can contain the damage; in the other, the process dies where it stands. No library can depend on either, which is why `catch_unwind` is documented as a thing that might not catch all Rust panics rather than as a `catch` block. A language feature whose behavior is a compiler flag cannot be a control-flow construct.

## What panicking does

Some language constructs panic automatically, out-of-bounds array indexing among them, and the standard library adds the explicit `panic!` macro. What happens next is decided by the panic handler, and `std` provides two: `unwind`, which unwinds the stack and is potentially recoverable, and `abort`, which aborts the process and is non-recoverable. The default for most targets is `unwind`, and not all targets provide the unwind handler at all.

Unwinding is the interesting one because it is not merely a stack pop. When a panic occurs, the unwind handler unwinds Rust frames, just as C++'s `throw` unwinds C++ frames, until the panic reaches a point of recovery such as a thread boundary. As the panic traverses those frames, live objects that implement `Drop` have their `drop` methods called, so when normal execution resumes, no-longer-accessible objects will have been cleaned up just as if they had gone out of scope normally. That guarantee is what makes RAII survive a panic, and it is why [[cs/languages/Rust/drop-order-and-raii-in-rust|drop order]] and panic behavior are one subject rather than two. The Reference is careful to note that as long as the resource-cleanup guarantee is preserved, unwinding may be implemented without actually using the platform's C++ mechanism.

Choosing `abort` buys you something concrete. When compiling with the abort panic strategy, the optimizer may assume that unwinding across Rust frames is impossible, which can result in both code-size and runtime speed improvements. Every call site that might unwind otherwise needs landing pads, and deleting them shrinks the binary. The strategies do not mix freely either: crates built with the unwind strategy can use the abort panic handler, but the abort strategy cannot use the unwind panic handler.

## `catch_unwind`, and the reasons it is not `catch`

`std::panic::catch_unwind` invokes a closure, capturing the cause of an unwinding panic if one occurs, returning `Ok` with the closure's result or `Err(cause)` where the cause is the object `panic!` was originally invoked with. It looks like a try block. The documentation spends most of its length explaining why you should not use it as one.

It is not recommended for a general try/catch mechanism, and `Result` is the appropriate type for functions that can fail on a regular basis. It might not catch all Rust panics, because a Rust panic is not always implemented via unwinding and can be implemented by aborting the process instead. It requires its closure to be `UnwindSafe`, a bound whose stated purpose is to encode the concept of exception safety in the type system, so that a value observed in a half-modified state cannot silently escape the catch. And the result needs care on the way out: if it is `Err` it holds the panic payload, and dropping that may itself panic.

The legitimate uses are boundaries rather than error handling. Recovering at a thread boundary so other threads keep running, which `thread::spawn` sets up automatically. Stopping an unwind before it crosses into foreign code. A server that would rather drop one request than lose the process, which is a real [[cs/security/denial-of-service-and-ddos|availability]] concern: an attacker-reachable index-out-of-bounds in a request handler is a crash, and a crash of the whole process is a denial of service in a way that a caught unwind on one worker is not.

## Why panics are not exceptions

The word "unwinding" is shared with C++ and the mechanism is deliberately similar, which makes the differences easy to miss. Three of them are structural.

The first is what the type system says. An exception in a language with [[cs/pl/exceptions-handlers-and-non-local-control|non-local control flow]] is part of a function's interface, whether declared like a Java checked exception or documented informally, and callers are expected to catch. A Rust function's fallibility lives in its return type. Panic is not in the signature at all, because it is not a case the caller is meant to handle.

The second is that recovery is not guaranteed to exist. Panicking may be recoverable or non-recoverable, and it can be configured to always be non-recoverable by choosing a non-unwinding handler. Even under the unwind handler the guarantee is narrow: the unwind handler does not guarantee that all panics are recoverable, only that panicking via the `panic!` macro and similar standard library mechanisms is recoverable. Library code that assumes it can catch and continue is assuming a build configuration it does not control.

The third is that unwinding does not compose across runtimes. Unwinding with the wrong ABI is undefined behavior, and the crossing rules are strict enough to be worth stating: an unwind originated from a Rust runtime must either lead to termination of the process or be caught by the same runtime. Catching a foreign unwinding operation, such as a C++ exception, will either abort the process or return an opaque error, and it is unspecified which. Rust code linked against a different instance of the standard library counts as foreign for this purpose, so a library panicking in a child thread can abort an entire application when the versions differ. This is one of the sharp edges of [[cs/languages/Rust/ffi-and-the-c-abi-in-rust|crossing the C ABI]], and it is why `extern "C-unwind"` exists as a separate ABI from `extern "C"`.

> [!warning] A panicking library is a design decision you are making for your users
> Because the panic strategy belongs to the final binary, a library that panics on bad input has decided that its callers may not handle that case, and under `panic=abort` it has decided their process dies. That is defensible for a violated invariant and indefensible for a parse failure. The rule of thumb the standard library follows is visible in its own API surface: indexing panics, `get` returns an `Option`, and both exist so the caller can pick which claim is true about their situation. The general form of that choice is treated in errors as values versus control flow.

## Related Notes

- [[cs/languages/Rust/error-handling-result-and-question-mark|Error Handling in Rust: Result, Option, and ?]] - the other mechanism, for failures the caller is expected to handle
- [[cs/languages/Rust/drop-order-and-raii-in-rust|Drop Order and RAII in Rust]] - the cleanup guarantee unwinding preserves, and the abort case where it does not
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - the mechanism panics resemble and the interface contract they decline
- [[cs/languages/Rust/ffi-and-the-c-abi-in-rust|FFI and the C ABI in Rust]] - why an unwind must not cross a non-unwinding ABI
- [[cs/languages/Go/defer-panic-and-recover|defer, panic, and recover]] - a near-identical vocabulary with a recover that is expected to be used
- [[cs/systems/processes-and-threads|Processes and Threads]] - why the thread boundary is the natural place to contain a panic

## Sources

- "Panic," The Rust Reference. https://doc.rust-lang.org/reference/panic.html . Supports the definition of panicking and its non-recoverable framing, automatic panics such as out-of-bounds indexing, the unwind and abort handlers and the default, the unwinding process and the `Drop` guarantee, the optimizer benefit of the abort strategy and the one-way compatibility between strategies, the narrow recoverability guarantee, and the FFI rules including wrong-ABI undefined behavior, foreign-exception catching being unspecified, and the same-runtime containment rule.
- "catch_unwind in std::panic," Rust standard library documentation. https://doc.rust-lang.org/std/panic/fn.catch_unwind.html . Supports what `catch_unwind` returns, the recommendation against using it as a general try/catch, `Result` being the appropriate type for regular failure, the warning that it might not catch panics implemented as aborts, and the `UnwindSafe` bound encoding exception safety in the type system.
