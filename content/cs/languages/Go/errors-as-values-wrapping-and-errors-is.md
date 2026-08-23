---
title: "Errors as Values, Wrapping, and errors.Is"
description: "Why Go's error handling is a library rather than a language feature, what the %w verb actually commits you to, and the tree that Is and As walk."
draft: false
comments: true
tags:
  - cs
  - languages
  - error-handling
date: 2026-07-24
updated:
aliases:
  - Go Error Wrapping
  - errors.Is and errors.As
---

The entire language-level surface of Go error handling fits in four lines. The spec defines the predeclared type as an interface with one method, `Error() string`, and calls it "the conventional interface for representing an error condition, with the nil value representing no error." That is the whole of it. No `throw`, no `catch`, no annotation on a function signature, no unwinding.

Everything else that Go programmers call error handling is library code layered on top of that interface, which is a design decision with consequences that took a decade to surface.

> [!note] The idea
> Because an error is an ordinary [[cs/languages/Go/interfaces-and-implicit-satisfaction|interface value]], error handling in Go evolves the way libraries evolve rather than the way languages do. Go 1.13 is the proof: the central addition was "a convention rather than a change," an `Unwrap` method that the standard library agrees to call. The cost of that freedom shows up in the design guidance, not the syntax. "wrapping an error makes that error part of your API." A formatting verb, `%w`, silently adds a public contract that you must keep.

## Before there was a chain

Go errors are values, and pre-1.13 programs interrogated them in exactly two ways.

Comparison to a sentinel: `if err == ErrNotFound`. And a type assertion or type switch to view the error as a more specific type, `if e, ok := err.(*NotFoundError); ok`. Both work, and both break the moment anyone adds context, because the standard way to add context threw the value away. "Creating a new error with fmt.Errorf discards everything from the original error except the text." A caller downstream of one `fmt.Errorf("decompress %v: %v", name, err)` has a string and nothing else.

The workaround was to define a struct holding the lower-level error, like `QueryError` with a `Query` and an `Err` field, and let callers reach inside. That pattern "is so pervasive in Go code that, after extensive discussion, Go 1.13 added explicit support for it."

## A convention, three functions, one verb

The convention: "an error which contains another may implement an Unwrap method returning the underlying error. If e1.Unwrap() returns e2, then we say that e1 wraps e2." Repeating that gives what the blog calls "the error chain."

The verb: "In Go 1.13, the fmt.Errorf function supports a new %w verb. When this verb is present, the error returned by fmt.Errorf will have an Unwrap method returning the argument of %w, which must be an error. In all other ways, %w is identical to %v." One character changes an error from opaque to inspectable, and changes nothing about how it prints.

The functions: `Is` replaces sentinel comparison, `As` replaces the type assertion. In the simple case they behave identically to what they replace. The difference appears with wrapping, where "these functions consider all the errors in a chain." The package documentation makes the recommendation flatly: `errors.Is(err, fs.ErrExist)` "is preferable to" `err == fs.ErrExist` "because the former will succeed if err wraps io/fs.ErrExist."

The package also exports `Unwrap` itself, which returns "the result of calling an error's Unwrap method, or nil when the error has no Unwrap method." The blog immediately advises against reaching for it: "It is usually better to use errors.Is or errors.As, however, since these functions will examine the entire chain in a single call."

## It is a tree, not a chain

The word chain is now historical. The current documentation is precise: "Successive unwrapping of an error creates a tree. The Is and As functions inspect an error's tree by examining first the error itself followed by the tree of each of its children in turn (pre-order, depth-first traversal)."

The branching comes from a second unwrap shape. An error may implement `Unwrap() error` or `Unwrap() []error`, and `errors.Join` produces the latter: "Join returns an error that wraps the given errors," and "A non-nil error returned by Join implements the Unwrap() []error method." So a single error value can be the root of a genuine tree of causes, and both `Is` and `As` do a [[cs/dsa/graph-traversals-bfs-dfs|depth-first traversal]] of it. This is one of the few places where a standard library API's behavior is only correctly described in graph terms.

One asymmetry to hold on to: `errors.Unwrap` "only calls a method of the form Unwrap() error. In particular Unwrap does not unwrap errors returned by Join." The low-level function sees the chain; only `Is` and `As` see the tree.

> [!example] Two escape hatches in the matcher
> Matching is not pure equality. "An error is considered to match a target if it is equal to that target or if it implements a method Is(error) bool such that Is(target) returns true." `As` has the parallel hook, matching if "the error has a method As(any) bool such that As(target) returns true," in which case "the As method is responsible for setting target." That is how `syscall.Errno` reports itself as `fs.ErrExist`, and how the Upspin-style template error can match on only the non-zero fields of a target. The documentation adds the one rule that keeps it from recursing badly: "An Is method should only shallowly compare err and the target and not call Unwrap on either."

## The part that is actually a design decision

The blog's Whether to Wrap section is the most valuable page in Go's error documentation, and it has nothing to do with syntax.

"Wrap an error to expose it to callers. Do not wrap an error when doing so would expose implementation details." The worked example: a `LookupUser` function backed by `database/sql` might see `sql.ErrNoRows`. Return it with `%v` and the caller sees text. Return it with `%w` and a caller can write `errors.Is(err, sql.ErrNoRows)`, at which point "the function must always return sql.ErrNoRows if you don't want to break your clients, even if you switch to a different database package."

The conclusion is stated as a rule about compatibility rather than about errors: "In other words, wrapping an error makes that error part of your API. If you don't want to commit to supporting that error as part of your API in the future, you shouldn't wrap the error."

And the reason this is invisible in review is that the observable output does not change. "whether you wrap or not, the error text will be the same." The choice "is about whether to give programs additional information so they can make more informed decisions, or to withhold that information to preserve an abstraction layer." One character of a format string is an [[cs/software-engineering/api-design|API commitment]] that the compiler will never check and the tests will never catch.

## Against checked exceptions

Set beside [[cs/languages/Java/checked-and-unchecked-exceptions|Java's checked exceptions]], the two languages solve opposite halves of the same problem and each leaves the other half open.

Java puts the error contract in the signature, where the compiler enforces it, and pays with the well-documented pressure to catch and ignore or to widen a `throws` clause until it means nothing. Go puts nothing in the signature beyond `error`, so a function's failure modes are documentation rather than type, and the wrapping decision above is the only mechanism for making a failure mode part of the contract. Java's contract is checked and coarse; Go's is precise and unchecked.

The deeper difference is control flow. An exception is [[cs/pl/exceptions-handlers-and-non-local-control|non-local control transfer]]; a Go error is a return value that the caller must destructure, which is why Go code has the shape it has. The verbosity people complain about is the cost of refusing the non-local jump, and the tree traversal in `errors.Is` is what Go bought with it: a caller can ask about a cause five frames down without any frame in between having declared it.

The library keeps moving, which is the point of putting errors in a library. `errors.AsType`, added in Go 1.26, is the type-assertion form written with a type parameter, returning the matching value instead of setting an out-parameter. "For most uses, prefer AsType." The one-method interface from 2009 did not have to change for that to happen.

## Related Notes

- [[cs/languages/Java/checked-and-unchecked-exceptions]] - the contract in the signature, and what enforcing it costs
- [[cs/languages/common/errors-as-values-vs-control-flow]] - the cross-language framing this note is one instance of
- [[cs/languages/Go/interfaces-and-implicit-satisfaction]] - why a nil concrete pointer in an error return is not a nil error
- [[cs/pl/exceptions-handlers-and-non-local-control]] - the mechanism Go declined, and what its absence buys
- [[cs/dsa/graph-traversals-bfs-dfs]] - the pre-order depth-first walk that `Is` and `As` actually perform
- [[cs/software-engineering/api-design]] - compatibility commitments made by accident, of which `%w` is a clean example

## Sources

- [The Go Programming Language Specification](https://go.dev/ref/spec) - the predeclared `error` interface and the nil-means-no-error convention
- [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors) - pre-1.13 sentinel and type-assertion patterns, the `Unwrap` convention, the `%w` verb, and the guidance on when wrapping becomes an API commitment
- [errors package documentation](https://pkg.go.dev/errors) - the tree formed by repeated unwrapping, the traversal order used by `Is` and `As`, the `Is` and `As` method hooks, `Join`, and `AsType`
