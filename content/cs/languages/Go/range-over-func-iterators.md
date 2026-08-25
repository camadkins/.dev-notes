---
title: "Range Over Func Iterators"
description: "Go 1.23 made a function a rangeable thing, so an iterator is a callback taking yield, and the traversal state lives in a call stack instead of a struct."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-05
updated:
aliases: []
---

Before Go 1.23, every container package invented its own way to loop. The standard library alone offers `sync.Map.Range`, `flag.Visit`, and `filepath.Walk`, and the announcement is candid that "none of those three examples work quite the same way." The consequence was worse than inconsistency: "when you start using a new Go container package you may have to learn a new looping mechanism," and no adapter could be written that worked across containers.

The fix was to make one of those shapes official and teach `for/range` to speak it.

> [!note] The idea
> A Go iterator is not an object with a cursor. It is a function you hand a callback to, and the callback is your loop body. The `for/range` statement over a function is compiled into exactly that: "the compiler must be adjusting the loop to create a yield function to pass to the iterator returned by" the expression you ranged over. Control is inverted at runtime while the syntax stays a loop. The payoff is that traversal state never has to be reified, because the iterator's own call stack holds it.

## The three signatures

"As of Go 1.23 it now supports ranging over functions that take a single argument." The argument is itself a function: "The single argument must itself be a function that takes zero to two arguments and returns a bool; by convention, we call it the yield function." The spec's table lists exactly three admissible shapes, `func(yield func() bool)`, `func(yield func(V) bool)`, and `func(yield func(K, V) bool)`, and notes that `yield` cannot be variadic. "When we speak of an iterator in Go, we mean a function with one of these three types."

The `iter` package names two of them, `Seq` and `Seq2`, "as shorthands for iterators that pass 1 or 2 values per sequence element" to yield. `Seq2` "represents a sequence of paired values, conventionally key-value" pairs, which is why ranging a map-like sequence gives you two variables the same way ranging a map does.

## How the loop is rewritten

The spec describes the rewrite as a protocol rather than as a desugaring recipe. "The iteration proceeds by calling f with a new, synthesized yield function as its argument." Then: "If yield is called before f returns, the arguments to yield become the iteration values for executing the loop body once." The body runs, and "After each successive loop iteration, yield returns true and may be called again to continue the loop." Termination flows the other way: "If the loop body terminates (such as by a break statement), yield returns false and must not be called again."

So the boolean is the entire control channel. `true` means keep going, `false` means the consumer is finished, and the `iter` docs make the contract enforceable: "Yield panics if called after it returns false." An iterator that ignores a `false` return is a bug the runtime will catch rather than a bug that silently produces extra values.

Everything a loop body can do has to travel across that boundary. `break`, `return` from the enclosing function, `goto`, and a panic in the body all have to unwind through a call the iterator made. The blog admits the cost without detailing it: there is "a fair bit of complexity in the Go compiler and runtime to make this efficient, and to correctly handle things like break or" panic in the loop. That complexity is the price of putting the inversion in the compiler rather than in every caller.

Written out, an iterator is unremarkable. The body of one is a loop that calls `yield` and returns early if it gets `false` back. What makes it feel strange on first reading is that you are writing the producer half of a protocol whose consumer half the compiler generates.

## Why a function and not an interface

The obvious alternative is the one Java and Rust took: an interface with a method that advances a cursor, which is what [[cs/languages/Rust/iterators-and-adapters|the Iterator trait]] provides. It composes well and it is easy to explain. Go's argument against it shows up in the binary-tree example.

An iterator over a tree written as a push function is a recursive walk. "The push method uses recursion to walk over the whole tree, calling yield on each element." If yield returns false the method returns false the whole way up. The result is an ordinary [[cs/dsa/inorder|inorder traversal]], written the way the textbook writes it.

Now write the same thing behind a `Next() (E, bool)` interface. `Next` has to return to its caller between every element, so the position in the tree cannot live in the call stack. You have to build an explicit stack of pending nodes as a field on the iterator struct and hand-transform the recursion into a state machine. The blog states the alternative plainly: "There is no need to maintain a separate stack to record the position within the tree; we can just use the goroutine call stack to do that for us."

That is the trade. A cursor interface makes the consumer's life easy and the producer's life hard for anything more structured than a slice. A push function makes the producer's life easy and would have made the consumer's life hard, except that the compiler absorbs the consumer's half. Go chose the shape whose difficulty a compiler could take on.

The same shape has a name in theory. Passing your continuation to a producer and letting it call you back is [[cs/pl/continuations-cps|continuation-passing style]], with `yield` as a one-shot continuation returning a boolean that says whether to keep going. Go did not add [[cs/pl/coroutines-and-generators|coroutines]] to the language to get iterators. It added one loop form that consumes a CPS-shaped producer.

## Pull iterators, and where the coroutine went

Push does not cover every case. Comparing two sequences element by element needs both under the caller's control, and a push iterator will not surrender control. "A pull iterator works the other way around: it is a function that is written such that each time you call it, it returns the next value in the sequence."

"The new standard library function iter.Pull takes a standard iterator," a push iterator, and returns a `next` function and a `stop` function. The naive implementation of this conversion is a goroutine plus [[cs/languages/Go/channels-and-select|channels]]: the blog's hand-rolled version "uses a pair of channels, one for values in the set and one to stop returning values," with a goroutine sending on one and selecting on the other. `iter.Pull` provides the same interface with a cheaper mechanism.

`stop` exists because of the asymmetry in how the two directions signal completion. Ranging over a push iterator makes the compiler guarantee that an early exit turns into a `false` from `yield`, which is the iterator's cue to clean up. "With a pull iterator, on the other hand, there is no way to force the yield function to return false, so the stop function is needed." Calling `stop` is what makes yield return false on the producer side. Hence the convention of deferring it.

> [!warning] The pull iterator is not concurrent
> "It is an error to call next or stop from multiple goroutines simultaneously." A pull iterator is a suspended computation with one resumption point, not a thread-safe queue. Panics cross the boundary rather than being contained: "If the iterator panics during a call to next (or stop), then next (or stop) itself panics with the same value."

The pattern goes back further than the syntax. The blog credits the Design Patterns book for the name and notes that "iterators date back to Barbara Liskov" and CLU in the 1970s, where the iterator construct also worked by yielding to a loop body rather than by returning a cursor. Go 1.23 arrived at the older answer.

## Related Notes

- [[cs/pl/coroutines-and-generators]] - the general suspend-and-resume mechanism Go declined to add, and what `iter.Pull` reconstructs
- [[cs/pl/continuations-cps]] - yield as a continuation, which is what makes the push shape work at all
- [[cs/dsa/inorder]] - the recursive traversal that a push iterator can express directly and a cursor interface cannot
- [[cs/languages/CSharp/iterators-and-yield-return]] - the same problem solved by compiling the producer into a state machine instead
- [[cs/languages/Rust/iterators-and-adapters]] - the cursor-interface answer, and the adapter ecosystem it makes possible
- [[cs/languages/Go/channels-and-select]] - the mechanism a hand-written pull iterator reaches for first

## Sources

- [Range Over Function Types](https://go.dev/blog/range-functions) - the motivating inconsistency in existing library patterns, the three iterator signatures, the compiler-synthesized yield function, the recursive tree iterator and the call-stack argument, and pull iterators with their stop function
- [The Go Programming Language Specification](https://go.dev/ref/spec) - the range table for function expressions and the exact yield protocol, including what happens when the loop body terminates
- [package iter](https://pkg.go.dev/iter) - Seq and Seq2, the meaning of yield's boolean result, the panic on yield after false, and the concurrency and panic rules for Pull
