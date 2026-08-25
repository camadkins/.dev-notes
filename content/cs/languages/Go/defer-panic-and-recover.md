---
title: "defer, panic, and recover"
description: "The deferred call list is a runtime stack attached to the goroutine, and every surprising rule about argument evaluation, ordering, and what recover can reach follows from that."
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

Most people meet `defer` as a cleanup convenience and `recover` as Go's version of `catch`. The first reading is close enough to be useful. The second is wrong in a way that produces real bugs, and the fix is to stop thinking about scopes and start thinking about a list.

> [!note] The idea
> A deferred call is not a lexical construct. The 2010 announcement describes the mechanism in one sentence: "A defer statement pushes a function call onto a list," and "The list of saved calls is executed after the surrounding function returns." That list is a per-goroutine runtime stack. Argument evaluation timing, last-in-first-out ordering, why `recover` works only inside a deferred function, why a panic in one goroutine cannot be caught in another, and why `runtime.Goexit` runs your cleanup without being catchable are all one fact seen from five angles.

## What gets saved, and when

The spec is precise about the push. Each time a `defer` statement executes, the function value and parameters to the call are evaluated as usual "and saved anew but the actual function is not invoked." Evaluation happens at the `defer` line. Invocation happens later.

```go
func a() {
    i := 0
    defer fmt.Println(i)
    i++
    return
}
```

This prints `0`. The value of `i` was copied onto the list when the `defer` executed, and the increment afterward changed a variable the list no longer refers to. Wrapping the call in a closure changes the answer, because then the saved thing is a function value that reads `i` through its captured binding at call time. The distinction is exactly the one [[cs/pl/scoping-binding-and-closures|closures]] make everywhere: a copied value against a captured reference.

The nil case pins the timing down further. If a deferred function value evaluates to nil, "execution panics when the function is invoked, not when the" statement is executed. Pushing a nil onto the list is legal. Popping it is not.

## Popping the list

Deferred calls run "in the reverse order they were deferred," which is the only order a stack can produce. The blog's example prints `3210`.

The precise moment matters more than the order does. Deferred functions run "immediately before the surrounding function returns," and when the function exits through an explicit `return`, they run "after any result parameters are set" by that statement. So a deferred closure over a named result observes the value the `return` chose and can overwrite it. The spec says so: "the deferred function may access and modify the result parameters before they are returned." A function whose body says `return 6` can return 42.

Two smaller rules fall out of the same picture. A deferred call's own return values go nowhere, because nothing is waiting to receive them: "If the deferred function has any return values, they are discarded when the function completes." And a `defer` inside a loop pushes once per iteration, which is how the file-descriptor leak in every long-running Go service gets written.

This is a strictly more powerful mechanism than a scope-exit hook. C++ ties cleanup to an object's lifetime, so [[cs/languages/Cpp/raii-and-object-lifetime|RAII]] needs a type per cleanup action. Go's list takes an arbitrary call, which is why `defer mu.Unlock()` needs no unlock guard type.

## Panic walks the same list

A panic, whether explicit or from a runtime fault such as an out-of-range index, "terminates the execution of F." Then "Any functions deferred by F are then executed as usual," and the process repeats in F's caller, and so on to the top of the goroutine. If nothing stops it, "the program is terminated and the error condition is reported, including the value of the argument to panic."

`recover` is the stop. The spec restricts it hard: its return value "is nil when the goroutine is not panicking or recover was not called directly by a deferred function." Conversely, if a goroutine is panicking and `recover` was called directly by a deferred function, the return is guaranteed non-nil. To keep that guarantee honest, "calling panic with a nil interface value" is itself a runtime panic, and since Go 1.21 "programs that call panic(nil) observe recover returning a" `*PanicNilError`.

When a recover succeeds, "the state of functions called between G and the call to panic is discarded, and normal execution resumes" in G. The unwinding already happened; recovery does not undo it.

## Why this is not exception handling

Set it beside Java. There, [[cs/languages/Java/checked-and-unchecked-exceptions|checked exceptions]] are a type-checked part of a method's signature, `catch` clauses select on type, and the mechanism is the ordinary way libraries report ordinary failure. Go inverts all three.

There is no selection. `recover` returns one `any` and you type-assert it yourself. There is no signature. Nothing in a Go function type says it may panic, so no caller can be forced to handle anything, and the compiler has no equivalent of the checked-exception contract that [[cs/pl/exceptions-handlers-and-non-local-control|non-local control transfer]] makes checkable. And there is a convention against using it: "even when a package uses panic internally, its external API still presents explicit error return values." Panic is allowed as an internal shortcut for unwinding a recursive descent, and required to be converted at the package boundary. The reporting mechanism Go actually intends is [[cs/languages/Go/errors-as-values-wrapping-and-errors-is|errors as ordinary values]].

> [!warning] What recover cannot reach
> The list belongs to one goroutine. A panic in a goroutine you started unwinds that goroutine's list and then kills the process; a deferred `recover` in the function that spawned it never runs, because that function is not on the panicking stack. Every goroutine that might panic needs its own recovering deferred call, at its own top frame.
>
> The list also runs for reasons that are not panics. `runtime.Goexit` "terminates the goroutine that calls it. No other goroutine is affected," and runs all deferred calls on the way out, but "Because Goexit is not a panic, any recover calls in those deferred functions will return nil." A deferred function that tests `recover() != nil` to decide whether things went badly will conclude, wrongly, that they went fine.

The useful mental model is a two-part one. `defer` is a general-purpose scheduled-call mechanism that happens to be good at cleanup. `panic` is stack unwinding with no type story and a cultural prohibition on crossing an API boundary. They share a data structure and nothing else.

## Related Notes

- [[cs/pl/exceptions-handlers-and-non-local-control]] - the general theory of non-local transfer, and what Go declines to take from it
- [[cs/pl/scoping-binding-and-closures]] - why deferring a call and deferring a closure over the same variable disagree
- [[cs/languages/Java/checked-and-unchecked-exceptions]] - exceptions in the signature, selected by type, the design Go rejected
- [[cs/languages/Go/errors-as-values-wrapping-and-errors-is]] - the mechanism panic is required to convert into at a package boundary
- [[cs/languages/Cpp/raii-and-object-lifetime]] - cleanup bound to object lifetime instead of to a call list
- [[cs/languages/common/errors-as-values-vs-control-flow]] - the cross-language axis this note sits on

## Sources

- [Defer, Panic, and Recover](https://go.dev/blog/defer-panic-and-recover) - defer as a pushed list, the three ordering rules, the worked panic trace, and the library convention against exporting panics
- [The Go Programming Language Specification](https://go.dev/ref/spec) - argument evaluation at defer time, reverse ordering, interaction with named results, the nil deferred value, and the exact conditions under which recover returns non-nil
- [package runtime](https://pkg.go.dev/runtime) - Goexit running deferred calls without being a panic, and PanicNilError since Go 1.21
