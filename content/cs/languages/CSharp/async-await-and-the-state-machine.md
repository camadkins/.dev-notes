---
title: "async, await, and the State Machine"
description: "await does not start a thread and does not wait. It cuts the method in half at that point, hands the second half to the task as a continuation, and returns."
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

The single most common wrong model of `await` is that it waits. The keyword reads like a blocking call and behaves like the opposite of one. What it actually does is mark the seam where the compiler will cut the method into pieces, and the method surrenders the thread at that seam rather than holding it.

> [!note] The idea
> `async` is a compiler instruction, not a runtime one. When you implement asynchronous programming in C#, the compiler transforms your program into a state machine that tracks the operations and state of the method, including where to resume. An `await` expression does not block the current thread while the awaited task is running; instead it signs up the rest of the method as a continuation and returns control to the caller. The async and await keywords do not cause extra threads to be created, and an async method does not run on its own thread. Concurrency here is a property of the I/O device, not of any thread you own.

## What the method returns and when

Start with the observable difference, because it is the one that reframes everything else. A synchronous method returns when its work is complete. An async method returns a task value when its work is suspended. Those are different events. The `Task` handed back at the suspension point is a promise about the future: it encapsulates information about the state of the asynchronous process and, eventually, either the final result from the process or the exception the process raises if it does not succeed. Microsoft is explicit that this is an implementation of the Promise model of asynchrony, which is the same object other language communities call a future.

So `Task` is not a thread and does not hold one. It is a small piece of mutable state with a completion flag, a result slot, an exception slot, and a list of things to run when the flag flips. The operand of an `await` expression must provide for notification when a task completes, and in general a delegate is invoked when the task completes, either successfully or unsuccessfully. That delegate is the rest of your method.

## The cut

`await` suspends evaluation of the enclosing async method until the operation represented by its operand completes. When the operation completes, `await` returns the result, if any. Control returns to the caller at the moment of suspension.

Two details in that description do real work. The first is that suspension is conditional: when `await` is applied to an operand representing an already completed operation, it returns the result immediately without suspending the enclosing method. The fast path is genuinely fast, which is why `ValueTask` exists and why awaiting a cached completed task costs close to nothing. The second is that suspending is not returning. The suspension of an async method at an `await` expression does not constitute an exit from the method, and `finally` blocks do not run. The method is paused mid-body with its state intact, which is exactly what makes ordinary loops and `try` blocks work across an await, and exactly what a callback-based design could not give you.

The transformation is the same one behind [[cs/languages/CSharp/iterators-and-yield-return|`yield return`]], applied to a different interface. Both take a method with suspension points and rewrite it into an object that remembers where it stopped. Theory has a name for the shape: the continuation. Signing up the rest of the method as a callback is a hand-rolled instance of [[cs/pl/continuations-cps|continuation-passing style]], performed by the compiler on code you wrote in direct style, and the state machine is the reified continuation. Read from that angle, an async method is a [[cs/pl/coroutines-and-generators|coroutine]] whose resumption is scheduled by I/O completion instead of by a caller pulling the next value.

## The synchronization context, and where the second half runs

If the rest of the method is a continuation, something has to decide which thread runs it. That is the job of the synchronization context. An async method runs on the current synchronization context and uses time on the thread only when the method is active. In a UI application the context posts the continuation back to the UI thread, which is why you can touch a control on the line after an await without marshaling by hand. In a console application or a modern ASP.NET Core request there is no such context, and the continuation runs on a thread pool thread.

This one mechanism explains the entire folklore around `ConfigureAwait(false)` and the classic deadlock. Block a UI thread on `.Result`, and the continuation that would complete the task is queued to the thread you just blocked. Nothing is deadlocked in the lock sense. The work is finished and the only thread allowed to notice is asleep.

> [!warning] async void is a different construct wearing the same syntax
> An async method can have a `void` return type, used primarily for event handlers, where a `void` return is required. It cannot be awaited, and the caller of a void-returning async method cannot catch any exceptions that the method throws. There is no task to put the exception into, so it surfaces on whatever context was active, which usually means the process. Use it only where an event signature forces your hand.

## Bound by I/O or bound by CPU

The decision procedure is short and the two answers barely resemble each other. If the code waits for a result or an action, such as data from a database, use `async` and `await` without `Task.Run`. If the code runs an expensive computation, use `async` and `await` but spawn the work onto another thread with `Task.Run`.

The reason the first case needs no thread at all is worth stating plainly: while a socket read is outstanding, no code is running. There is nothing for a thread to do. You can use `Task.Run` to move CPU-bound work to a background thread, but a background thread does not help with a process that is just waiting for results to become available. A thread parked in a blocking read is an expensive receipt, and async programming is the accounting change that stops issuing them. [[cs/systems/processes-and-threads|What a thread actually costs]] is the missing half of the argument, and [[cs/languages/Java/virtual-threads-and-structured-concurrency|Java answered the same question]] by making the receipt cheap instead of eliminating it.

> [!example] Read the signature, then the seam
> `Task<int> t = GetUrlContentLengthAsync();` returns at the first await inside, not at the end. `int n = await t;` retrieves the result once the task completes. The two lines can be separated by other work, which is the whole point of writing them separately. Collapsing them to `await GetUrlContentLengthAsync()` is fine when there is nothing useful to do in between.

Two syntactic restrictions fall out of the rewrite. `await` is usable only in a method, lambda, or anonymous method modified by `async`, and inside such a method it is forbidden in a synchronous local function, inside a `lock` block, and in an unsafe context. An async method also cannot declare `in`, `ref`, or `out` parameters, though it can call methods that have them. A reference to a stack location cannot survive a suspension whose resumption happens on some other stack.

## Related Notes

- [[cs/languages/CSharp/iterators-and-yield-return|Iterators and yield return]] - the same compiler rewrite, aimed at `IEnumerable` instead of `Task`.
- [[cs/pl/continuations-cps|Continuations & CPS]] - the theory the state machine is an implementation of.
- [[cs/pl/coroutines-and-generators|Coroutines & Generators]] - suspend and resume as a language feature rather than a library.
- [[cs/systems/processes-and-threads|Processes & Threads]] - what you are declining to allocate when you await.
- [[cs/languages/Java/virtual-threads-and-structured-concurrency|Virtual Threads and Structured Concurrency]] - the opposite bet on the same problem.
- [[cs/languages/CSharp/the-il-and-the-jit|The IL and the JIT]] - the state machine is ordinary IL by the time anything runs it.

## Sources

- "Task asynchronous programming model," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/task-asynchronous-programming-model . Supports the non-blocking await and continuation sign-up, no extra threads and no dedicated thread per async method, the synchronization context claim, the synchronous-returns-when-complete versus async-returns-when-suspended contrast, what a task encapsulates, that suspension is not an exit and finally blocks do not run, the async void restrictions, and the ban on in, ref, and out parameters.
- "Asynchronous programming scenarios," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/standard/async-in-depth . Supports the compiler transforming the program into a state machine that tracks operations and state, the Promise model of asynchrony, and the I/O-bound versus CPU-bound decision table including the use of Task.Run.
- "await operator," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/await . Supports the suspension and result semantics, the no-suspension fast path for an already completed operation, that await does not block the evaluating thread, the completion-notification delegate requirement, and the syntactic restrictions on where await may appear.
