---
title: asyncio and the Event Loop
description: "Why calling a coroutine does nothing, what a Task adds, and why a single CPU-bound call delays every other task on the loop by exactly its own duration."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-06-30
updated:
aliases:
  - Python asyncio
  - The Event Loop
  - Coroutines and Tasks
---

The first surprise in asyncio is that a coroutine does not run when you call it. The documentation states it as a warning because everyone hits it: simply calling a coroutine will not schedule it to be executed. What comes back is a coroutine object, an inert value describing work that has not started. Calling it is closer to building a closure than to invoking a function.

That is the whole design in one observation. A coroutine function returns a suspendable state machine rather than a result, and something else has to decide when to advance it.

> [!note] The idea
> asyncio is a userspace scheduler wearing function-call syntax. The event loop is a run queue, a Task is a scheduling entity, and `await` is a voluntary yield point. Every property people find surprising follows from one fact: yielding is cooperative, so the loop can only regain control when a coroutine chooses to give it back. This is [[cs/systems/process-scheduling-algorithms|non-preemptive scheduling]], which the operating system abandoned decades ago for exactly the failure mode asyncio still has.

## The loop and the queue

The event loop is the core of every asyncio application. Event loops run asynchronous tasks and callbacks, perform network IO operations, and run subprocesses. The docs steer most people away from touching it directly: application developers should typically use the high-level asyncio functions, such as `asyncio.run()`, and should rarely need to reference the loop object or call its methods.

What the loop actually does each turn is unglamorous. It asks the operating system which of a set of file descriptors are ready, using `epoll`, `kqueue`, or the local equivalent, then runs the callbacks waiting on the ready ones, then runs any callbacks scheduled by time. The kernel readiness call is the load-bearing part. asyncio does not make [[cs/systems/io-devices-and-drivers|I/O]] faster; it lets one thread wait on thousands of descriptors at once instead of one, and the concurrency comes from the multiplexing, not from the syntax.

Coroutines need a driver to be advanced. Tasks are used to schedule coroutines concurrently, and when a coroutine is wrapped into a Task with a function like `asyncio.create_task()`, the coroutine is automatically scheduled to run soon. The distinction is the one people flatten: `await some_coroutine()` runs it inline and waits, while `create_task(some_coroutine())` hands it to the scheduler and returns immediately. Only the second creates concurrency. A missing `create_task` is the single most common reason "async" code runs sequentially.

Underneath both sits the Future. A Future is a special low-level awaitable object that represents an eventual result of an asynchronous operation, and future objects in asyncio are needed to allow callback-based code to be used with async and await. That sentence explains why the layer exists at all. The kernel interface is callback-shaped, `async`/`await` is coroutine-shaped, and the Future is the adapter: a slot that a callback fills in and a coroutine waits on.

## What `await` actually does

The mechanics are unusually clean, and worth stating as a sequence rather than an analogy. An event loop runs in a thread, typically the main thread, and executes all callbacks and Tasks in its thread. While a Task is running in the event loop, no other Tasks can run in the same thread. When a Task executes an `await` expression, the running Task gets suspended, and the event loop executes the next Task.

Three facts, and the second is the one that costs people days. There is no preemption. No timer interrupt, no scheduler tick, no way for the loop to take control back. A Task holds the thread until it awaits something that actually suspends.

This is why the generator machinery was the right foundation. A coroutine suspending at an `await` is a frame that stops, keeps its locals, and hands control to its caller, which is precisely what `yield` does. `async def` compiles to a state machine over resumption points, the same shape [[cs/pl/coroutines-and-generators|coroutines take in general]] and the same shape a C# async method takes, differing mainly in whether the compiler or the runtime owns the machine.

## Blocking calls poison the loop

The failure mode is stated flatly in the developer guide. Blocking CPU-bound code should not be called directly, and the reason is quantified: if a function performs a CPU-intensive calculation for 1 second, all concurrent asyncio Tasks and IO operations would be delayed by 1 second.

Read that as a scheduling property, not a performance tip. The delay is not proportional to load or amortized across tasks. It is exactly the duration of the blocking call, applied to every other task on the loop, because the loop is not running while your function is. A synchronous `requests.get` in one handler stalls every open connection in the process for the length of that HTTP round trip. There is no partial degradation. Cooperative scheduling gives you all the throughput or none of it, and the choice belongs to whichever code is currently running.

The escape hatch is to move blocking work off the loop's thread entirely. An executor can be used to run a task in a different thread, including in a different interpreter, or even in a different process to avoid blocking the OS thread with the event loop. A thread pool is enough for blocking I/O, since the calling thread simply parks. CPU-bound work needs a process pool for the reason that governs everything about Python concurrency, which is [[cs/languages/Python/the-gil-and-python-concurrency|the interpreter lock]].

> [!example] Debug mode measures the thing that hurts
> asyncio ships instrumentation aimed directly at this failure. In debug mode, the execution time of the I/O selector is logged if it takes too long to perform an I/O operation, and callbacks taking longer than 100 milliseconds are logged, with `loop.slow_callback_duration` setting the threshold in seconds. That is a profiler for cooperative-scheduling violations. Anything appearing in that log is code holding the loop hostage, and the fix is always the same: make it await, or move it to an executor.

## What the model buys, and what it costs

Against threads, asyncio's win is that suspension points are visible. Every place a task can be interleaved is marked with `await` in the source, so the set of interleavings is finite, local, and readable, and a sequence of statements without an `await` between them is atomic with respect to other tasks. Whole classes of race condition that [[cs/systems/concurrency-primitives|lock-based code]] must defend against cannot occur, and one thread with one stack scales to many more concurrent connections than one OS thread per connection.

The cost is that the property is only as good as the weakest library in the process. One synchronous call anywhere in the stack breaks it for everyone, and the ecosystem has to be duplicated: an async database driver, an async HTTP client, an async everything. The documentation opens the developer guide by conceding the point, noting that asynchronous programming is different from classic sequential programming and then listing the traps. The model is not harder because the syntax is unfamiliar. It is harder because the scheduler is now partly your responsibility.

## Related Notes

- [[cs/systems/process-scheduling-algorithms|Process Scheduling Algorithms]] - preemptive scheduling, and why operating systems stopped trusting programs to yield
- [[cs/pl/coroutines-and-generators|Coroutines and Generators]] - the control-flow primitive underneath `async def`
- [[cs/languages/Python/the-gil-and-python-concurrency|The GIL and Python Concurrency]] - why CPU-bound work needs a process, not a thread
- [[cs/systems/io-devices-and-drivers|I/O Devices and Drivers]] - the readiness notification the loop is built on
- [[cs/languages/CSharp/async-await-and-the-state-machine|async, await, and the State Machine]] - the same idea with the compiler generating the machine
- [[cs/languages/Python/exception-groups-and-tracebacks|Exception Groups and Tracebacks]] - what happens when several concurrent tasks fail at once

## Sources

- "Event loop," Python Standard Library. https://docs.python.org/3/library/asyncio-eventloop.html . Supports the event loop being the core of every asyncio application; loops running tasks and callbacks, performing network I/O, and running subprocesses; and the guidance that application developers should use high-level functions and rarely touch the loop.
- "Coroutines and Tasks," Python Standard Library. https://docs.python.org/3/library/asyncio-task.html . Supports calling a coroutine not scheduling it for execution; Tasks scheduling coroutines concurrently with `create_task` scheduling the coroutine to run soon; and Futures as low-level awaitables representing an eventual result, needed to bridge callback-based code to async and await.
- "Developing with asyncio," Python Standard Library. https://docs.python.org/3/library/asyncio-dev.html . Supports the loop running in one thread and executing all callbacks and Tasks there; no other Task running while one is running; `await` suspending the running Task so the loop runs the next; blocking CPU-bound code delaying all tasks and I/O by its own duration; the executor escape hatch across threads, interpreters, and processes; and debug mode logging slow selector operations and callbacks over 100 milliseconds.
