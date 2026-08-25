---
title: "Error Handling in Rust: Result, Option, and ?"
description: "How Result and Option encode failure in the type, what the ? operator actually desugars to, and the Book's own rule for when panicking beats propagating."
draft: false
comments: true
tags:
  - cs
  - languages
  - error-handling
date: 2026-06-24
updated:
aliases: []
---

Rust has no [[cs/pl/exceptions-handlers-and-non-local-control|exceptions]]. A function that can fail says so in its return type, and a caller that ignores the failure does not compile. The comparative case for that design, against exceptions and against error codes, is in [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]]. What follows is the Rust machinery: the two enums, the operator that makes them bearable, and the criteria the Book gives for choosing panic over propagation.

`Result<T, E>` is [[cs/pl/records-variants-and-pattern-matching|an ordinary enum with two variants]]. `T` is the type returned on success inside `Ok`, and `E` is the type returned on failure inside `Err`. Both `Result` and `Option` and their variants are in the prelude, so you write `Ok` and `Err` rather than `Result::Ok`.

> [!note] The idea
> `?` looks like syntax for "unwrap or bail", and that is most of what it does. The part people miss is the type conversion: every error passed through `?` goes through `From::from`, converting the callee's error type into the current function's declared error type. That single hook is what lets a function whose parts fail in a dozen unrelated ways still return one error type, and it is why adding a new failure mode to a function body often requires no changes at the call sites. The operator is a coercion point, not only a control-flow shortcut.

## Handling versus shortcutting

The explicit form matches on the `Result` and does something in each arm. It works, and the Book concedes it is a bit verbose and does not always communicate intent well.

`unwrap` is the shortcut. On `Ok` it returns the inner value; on `Err` it calls `panic!`. Running it on a missing file prints `called 'Result::unwrap()' on an 'Err' value: Os { code: 2, kind: NotFound, message: "No such file or directory" }`.

`expect` does the same but lets you choose the panic message, which replaces the default one `unwrap` uses. The Book's recommendation is unambiguous: in production-quality code, most Rustaceans choose `expect` over `unwrap` and give context about why the operation is expected to always succeed, so that if the assumption is ever proven wrong there is more information for debugging.

That framing is the useful one. `expect` is not "I am being lazy", it is an assertion with a written justification attached. `unwrap` is the same assertion with the justification omitted.

## What `?` does

Propagating an error means returning it to the caller rather than handling it locally, which gives more control to the calling code where there may be more information or logic about how the error should be handled. The pattern is common enough that Rust provides the question mark operator for it.

Placed after a `Result`, `?` works almost the same way as the equivalent `match`. On `Ok`, the value inside comes out of the expression and the program continues. On `Err`, the `Err` is returned from the whole function as if you had written `return`.

The "almost" is the conversion. Error values that have `?` called on them go through the `from` function defined in the `From` trait, which converts the error type received into the error type declared in the current function's return type. Define `impl From<io::Error> for OurError` and every `?` in a function returning `Result<_, OurError>` will call `from` and convert, with no other code changes.

Because `?` yields a value, calls chain: `File::open("hello.txt")?.read_to_string(&mut username)?` is the same function written more ergonomically.

## Where `?` is allowed

`?` can only be used in functions whose return type is compatible with the value it is used on, because it performs an early return of that value. Use it in a `fn main()` returning `()` and you get `error[E0277]: the '?' operator can only be used in a function that returns 'Result' or 'Option' (or another type that implements 'FromResidual')`, with the compiler suggesting you add `-> Result<(), Box<dyn std::error::Error>>` and an `Ok(())`. The two fixes are exactly those: change the return type, or handle the `Result` with a `match` or one of its methods.

On `Option<T>` the behavior is parallel. `None` returns early from the function; `Some(v)` yields `v` and execution continues. `fn last_char_of_first_line(text: &str) -> Option<char> { text.lines().next()?.chars().last() }` is a one-line function precisely because the empty-input case exits through the `?`.

The rule that catches people: you can use `?` on a `Result` in a function returning `Result` and on an `Option` in a function returning `Option`, but you cannot mix them. `?` will not automatically convert a `Result` to an `Option` or the reverse. Use `Result::ok` or `Option::ok_or` to convert explicitly. Note the asymmetry with the `From` conversion above. Rust will silently widen one error type into another, because that loses nothing, but it will not silently turn a described failure into an absent value, because that discards the description.

## `main` can return a `Result`

`main` may return `Result<(), E>`. Writing `fn main() -> Result<(), Box<dyn Error>>` and ending with `Ok(())` makes `?` usable at the top level. `Box<dyn Error>` is [[cs/languages/Rust/trait-objects-vtables-and-fat-pointers|a trait object]] meaning roughly "any kind of error", and it is allowed here because it lets any `Err` value be returned early, so the signature stays correct as more failure modes are added to the body.

The exit-code behavior is specified. An executable whose `main` returns `Ok(())` exits with 0; one returning `Err` exits with a nonzero value. The Book gives the reason directly: C executables return 0 on success and some other integer on error, and Rust returns integers from executables to be compatible with that convention. More generally, `main` may return any type implementing `std::process::Termination`, whose `report` function returns an `ExitCode`.

## Panic or propagate

Returning `Result` is the good default when defining a function that might fail. The argument is about who gets to decide: when code panics there is no way to recover, so calling `panic!` makes the decision that a situation is unrecoverable on behalf of the calling code. Returning `Result` gives the caller options, including the option to call `panic!` itself and turn your recoverable error into an unrecoverable one. The permission flows one direction only.

Panicking is right in three families of case.

**Examples, prototypes, and tests.** In an example, robust error handling can make the point less clear, and `unwrap` is understood as a placeholder for whatever the real application would do. While prototyping, `unwrap` and `expect` leave clear markers for when you are ready to make the program more robust. In a test, a failing method call should fail the whole test even when it is not the functionality under test, and since `panic!` is how a test is marked as a failure, `unwrap` or `expect` is exactly what should happen.

**When you know more than the compiler.** Parsing the hardcoded string `"127.0.0.1"` into an `IpAddr` still returns a `Result`, because the compiler is not smart enough to see that this particular string always parses. Calling `.expect("Hardcoded IP address should be valid")` is acceptable, and documenting the reason in the message text matters: if the address later comes from a user instead, the note prompts you to replace the `expect` with real handling.

**Bad states and contract violations.** Panic when the code could end up in a bad state, meaning some assumption, guarantee, contract, or invariant has been broken, and additionally the bad state is unexpected rather than something that happens occasionally, later code needs to rely on not being in that state rather than re-checking at every step, and there is no good way to encode the condition in the types.

The contract case deserves its own emphasis. Functions often have contracts: their behavior is only guaranteed if the inputs meet particular requirements. A contract violation always indicates a caller-side bug, there is no reasonable way for calling code to recover, and the calling programmers need to fix the code. Contracts, especially where violation causes a panic, should be explained in the function's API documentation.

Conversely, when failure is expected, `Result` is the right answer. The Book's examples of expected failure are a parser given malformed data and an HTTP request returning a rate-limit status. Returning `Result` there says failure is a possibility the caller must decide about.

> [!warning] The security case for panicking
> Where an operation could put a user at risk if called with invalid values, verify first and panic if the values are invalid. Attempting to operate on invalid data can expose code to vulnerabilities, and this is the main reason the standard library panics on out-of-bounds memory access: reaching memory that does not belong to the current data structure is a common security problem. Panicking is the safe failure here precisely because it is not recoverable.

> [!tip] Let types remove the checks
> Scattering validation through every function is verbose. If a function takes a concrete type rather than an `Option`, the compiler has already guaranteed a value is present and the body handles one case instead of two. Encoding the invariant in a type (a `Guess` whose constructor rejects out-of-range values and panics, documented as such) moves the check to one place and lets everything downstream assume it.

## Related Notes

- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] - Result-style errors compared against exceptions and error codes across languages
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - the mechanism Rust declines to use, and what unwinding costs
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the sum types that make `Result` and `Option` ordinary library code
- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds in Rust]] - `From`, the trait that `?` calls, and `Box<dyn Error>` as a trait object
- [[cs/software-engineering/testing-strategies|Testing Strategies]] - why panicking is the correct failure mode inside a test

## Sources

- "Recoverable Errors with Result," The Rust Programming Language. https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html . Supports the `Result<T, E>` definition and prelude import, `unwrap` and `expect` behavior and messages, the recommendation to prefer `expect` in production code, the meaning of propagation, `?` semantics and its `From::from` conversion, method chaining after `?`, the E0277 restriction and its suggested fixes, `?` on `Option`, the prohibition on mixing `Result` and `Option` with `ok`/`ok_or` as the explicit conversions, `main` returning `Result<(), Box<dyn Error>>`, and the 0 / nonzero exit codes plus the `Termination` trait.
- "To panic! or Not to panic!," The Rust Programming Language. https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html . Supports `Result` as the good default and the who-decides argument, the examples/prototype/test cases, the hardcoded `IpAddr` `expect` case, the bad-state criteria, function contracts indicating caller-side bugs and belonging in API documentation, expected-failure cases (malformed parser input, HTTP rate limit), the security rationale for panicking on invalid values and out-of-bounds access, and using the type system to eliminate repeated checks.
