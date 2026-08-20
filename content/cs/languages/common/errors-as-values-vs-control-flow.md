---
title: Errors as Values vs Control Flow
description: Two philosophies for when things go wrong. Errors returned as values the caller must handle, versus exceptions that unwind the stack, and the honesty-versus-ergonomics tradeoff between them.
draft: false
comments: true
tags:
  - cs
  - languages
  - error-handling
date: 2026-07-22
updated:
aliases:
  - Error Handling in Practice
  - Errors as Values
  - Result vs Exceptions
---

Something will go wrong: a file will be missing, a network call will time out, a parse will fail. How a language lets you express that is one of its most opinionated choices, because it shapes every function signature and every call site. There are two broad answers. Either an error is a value the function returns, sitting in the type alongside the success case so the caller cannot ignore it, or an error is a control-flow event that unwinds the stack to a handler somewhere above. The theory of the second, stack unwinding and non-local control, lives in [[cs/pl/exceptions-handlers-and-non-local-control|exceptions and non-local control]]. This note is about the practical fork: which philosophy each language chose, and what it costs.

The machinery both approaches ride on is the same sum-type-and-pattern-matching from [[cs/pl/records-variants-and-pattern-matching|records, variants, and pattern matching]]: a `Result` is just a value that is either an `Ok` or an `Err`. What differs is whether the language pushes you toward encoding failure in the type or toward throwing it over the call stack.

> [!note] The idea
> Errors-as-values put failure in the return type: the function hands back either a success or an error, and the type system makes the caller deal with both. Errors-as-control-flow throw an exception that unwinds the stack until a handler catches it, keeping the normal path clean but letting failure travel invisibly. The first is honest and verbose; the second is ergonomic and easy to ignore. Every language's error handling is a position on that tradeoff.

## Rust: errors are values, and the type won't let you forget

Rust takes the errors-as-values side about as far as it goes, and states the choice outright: Rust does not have exceptions. It splits failure into two kinds. Recoverable errors, a missing file, a timeout, are returned as `Result<T, E>`, a value that is either `Ok(T)` or `Err(E)`. Unrecoverable ones, a bug like an out-of-bounds index, trigger `panic!`, which stops the program. The Book's framing is that the compiler forces you to acknowledge the possibility of an error before the code will compile, so error paths are explicit and unavoidable.

The obvious objection to errors-as-values is verbosity: if every call returns a `Result`, do you not drown in checks? Rust's answer is the `?` operator, which propagates an error up one level automatically, unwrapping the `Ok` or returning the `Err` from the enclosing function. It gives back most of the brevity of exceptions while keeping the honesty: the `?` is visible in the source, so failure still travels only through marked points, never invisibly. Errors are values, and the type is the thing that will not let you forget them.

## Python: exceptions as ordinary control flow

Python sits at the opposite pole and leans in. Exceptions are not a last resort; they are idiomatic, and the language has a name for the style. Its glossary defines EAFP, "easier to ask forgiveness than permission," as the common Python style that assumes valid keys and attributes exist and catches exceptions if the assumption proves false, and calls it clean and fast, characterized by many `try` and `except` statements. It contrasts this with LBYL, "look before you leap," the check-first style common to C, and notes LBYL is particularly susceptible to race conditions because the world can change between the check and the action.

So where a Rust programmer returns a `Result`, a Python programmer often just does the operation and catches the exception if it fails. The normal path stays uncluttered by error checks, and failure propagates up the stack on its own until something handles it. The cost is the mirror of the benefit: a function's signature does not tell you what it can raise, so the failure modes are invisible at the call site, and an exception nobody catches becomes a crash.

## C++: exceptions, but reserved for the exceptional

C++ has exceptions and also the older C convention of error codes and `errno`, and the [[cs/pl/exceptions-handlers-and-non-local-control|unwinding]] runs [[cs/languages/common/memory-ownership-refcounting-gc|RAII]] destructors as it goes, so resources still get cleaned up as the stack unwinds. Its guidance splits the difference thoughtfully. The C++ Core Guidelines say to develop an error-handling strategy early, throw exceptions to signal a failure that cannot be handled locally, and use exceptions for errors only, drawing a firm line between an error (the function cannot achieve its advertised purpose) and an ordinary status code (a normal operational outcome). The guidelines favor exceptions over error codes for genuine errors on one specific ground: an exception cannot be silently ignored, whereas a returned error code can be, and an ignored error can leave the system in an undefined state.

That last point is the quiet bridge between the two philosophies. Rust's whole design is built to make the returned error impossible to ignore, achieving by type system what the C++ guidelines seek by convention. Both are chasing the same goal, that a failure not be dropped on the floor, from opposite starting points.

> [!warning] The real axis is "can this error be ignored," not "value or exception"
> It is easy to frame this as values versus exceptions, but the property that actually matters is whether the language lets you silently drop an error. C error codes can be ignored, which is the failure mode; Rust's `Result` cannot be, because the type demands it; C++ exceptions cannot be, because unwinding forces the issue. Python's exceptions cannot be silently ignored either, though its invisible-in-the-signature failure modes trade that for a different blind spot. Judge an error strategy by what happens to the error nobody remembered to handle.

## Related Notes

- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions and Non-Local Control]] - the stack-unwinding theory the exception side rides on
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the sum types and exhaustive matching that make `Result` and `Option` work
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - RAII destructors running during exception unwinding, the reason C++ can throw without leaking
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - what an ignored C error code can lead to when it leaves the system in an undefined state

## Sources

- "Error Handling," The Rust Programming Language (official book). https://doc.rust-lang.org/book/ch09-00-error-handling.html . Supports Rust having no exceptions, the split between recoverable errors (`Result<T, E>`, errors as values) and unrecoverable ones (`panic!`), and the compiler forcing the caller to acknowledge and handle or propagate the error.
- "Glossary: EAFP / LBYL," Python documentation. https://docs.python.org/3/glossary.html . Supports EAFP being the common Python style that assumes keys/attributes exist and catches exceptions if not (many `try`/`except`), its contrast with the check-first LBYL style common to C, and LBYL's susceptibility to race conditions between check and action.
- "C++ Core Guidelines: Error handling (E)," isocpp.github.io (Stroustrup and Sutter, eds.). https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines . Supports developing an error-handling strategy early (E.1), throwing exceptions for failures that cannot be handled locally (E.2), using exceptions for errors only versus status codes (E.3), an error meaning the function cannot achieve its advertised purpose, and exceptions being preferred because they cannot be silently ignored.
