---
title: The GIL and Python Concurrency
description: "What the global interpreter lock actually protects, why removing it was hard for reasons that have nothing to do with performance, and how threads, multiprocessing, and asyncio divide the workload space."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-07-08
updated:
aliases: []
---

The complaint is familiar: [[cs/systems/processes-and-threads|Python threads]] do not use your cores. The reason usually given, that CPython has a big lock, is true but shallow, because it does not explain why twenty-five years of smart people failed to remove it. The lock is not the hard part. The *guarantees the lock accidentally provides to every C extension ever written* are the hard part.

The cross-language placement of this problem, where Python, Rust, and C++ each put the burden of preventing data races, is in [[cs/languages/common/concurrency-in-practice|concurrency in practice]]. This note goes deeper on the CPython side.

> [!note] The idea
> The GIL is a mutex protecting the interpreter's own object bookkeeping, not your data. Its existence is a consequence of [[cs/languages/common/memory-ownership-refcounting-gc|reference counting]] being cheap precisely because it is unsynchronized. The deep obstacle to removing it was never the lock itself but the API contract built on top: existing C extensions assume that when their code runs, all other threads are locked out, so any replacement must provide GIL-like guarantees by default and keep threading opt-in for extensions. Free-threaded CPython therefore shipped as a separate build configuration rather than as a behavior change.

## What the lock actually locks

The Python wiki states the scope precisely. In CPython, the GIL is a [[cs/systems/concurrency-primitives|mutex]] that protects access to Python objects, preventing multiple threads from executing Python bytecodes at once. It prevents race conditions and ensures thread safety, and it is necessary mainly because CPython's memory management is not thread-safe.

That last clause is the whole causal chain. Every Python object carries a reference count, and almost any reference to an object is a modification of at least that count. Two threads incrementing the same count without synchronization corrupt it, and a corrupted count means either a leak or a premature free. Making the counts atomic would fix correctness and destroy the property that made refcounting attractive: the wiki notes the existing reference count mechanism is very fast in the non-concurrent case, and that many concurrent garbage collection algorithms assume modifications are rare, which is exactly wrong for refcounting.

The wiki is also careful about the blast radius. The GIL prevents multithreaded CPython programs from taking full advantage of multiprocessor systems *in certain situations*, because many potentially blocking or long-running operations, such as I/O, image processing, and NumPy number crunching, happen outside the GIL. It is only in multithreaded programs that spend a lot of time inside the GIL interpreting CPython bytecode that the GIL becomes a bottleneck.

Some secondary costs are less well known. The wiki summarizes that system call overhead is significant especially on multicore hardware, that two threads calling a function may take twice as much time as a single thread calling it twice, that the GIL can cause I/O-bound threads to be scheduled ahead of CPU-bound threads, and that it prevents signals from being delivered. CPython extensions must be GIL-aware in order to avoid defeating threads.

## Why it was so hard to remove

The wiki's list of properties any GIL replacement must have reads like a specification of the trap. Simplicity, since the proposal must be maintainable long term. Concurrency, since it must actually improve multithreaded performance in practice. Speed, because the BDFL said he would reject any proposal that slows down single-threaded programs. Features, because the replacement must support existing CPython behavior including `__del__` and weak references.

Then there is API compatibility, which the wiki calls an especially difficult aspect. All concurrent memory management schemes found rely on one or more of three techniques, and all three are incompatible with the existing Python/C API. Tracing needs to enumerate the objects an object points to, but while builtin pointer-containing types like `PyList` and `PyDict` have a `tp_traverse` method, not all extension types do. Write barriers, small pieces of code executing whenever a pointer variable is modified, cannot be hooked out of the `Py_INCREF` macros no matter how they are hacked, and many schemes need different barriers for stack variables, global variables, and object fields, a distinction nothing in the C API makes. Exact stack information requires knowing where local C variables live on the stack or in registers, which the C API does not require extensions to track.

And underneath all of that sits the assumption. Existing C extensions depend on the GIL guarantees: they assume that when extension code is called, all other threads are locked out, and an extension that does want to deal with a threaded environment explicitly opts in by releasing the GIL. So any would-be replacement must provide GIL-like guarantees by default, and threading must remain opt-in for extensions.

Two properties the wiki lists as "nice to have" are the ones users actually notice. Prompt destruction: the existing reference-counting scheme destroys objects as soon as they become unreachable (except in reference cycles, collected later by the cycle collector), and some programs depend on this to close files promptly. Ordered destruction: barring cycles, Python always destroys an unreachable object before destroying anything it references, so all of an object's attributes are still there when `__del__` runs, a guarantee many garbage collection schemes do not give.

## PEP 703 and the free-threaded build

PEP 703, "Making the Global Interpreter Lock Optional in CPython," is the accepted proposal. It targets Python 3.13 and adds a build configuration, `--disable-gil`, to let CPython run Python code without the global interpreter lock, with the changes needed to make the interpreter thread-safe.

The motivation is not general-purpose throughput. It is scientific computing and AI/ML, where, as the PEP puts it, the lack of concurrency is often a bigger issue than the speed of executing Python code, because most processor cycles are spent in optimized CPU or GPU kernels while the GIL introduces a global bottleneck that can prevent other threads making progress if they call any Python code. Neural network workloads expose intra-operator, inter-operator, and request parallelism, and the PEP's claim is that the GIL makes inter-operator and some request parallelism hard to express efficiently.

The practitioner quotes in the PEP are the most concrete evidence in it. Manuel Kroiss of DeepMind's reinforcement learning team writes that they would like to run on the order of 50 to 100 threads per process but often see the GIL become the bottleneck with fewer than 10 threads, and that dealing with it usually ends in translating large parts of the Python codebase into C++, making the code less accessible to researchers. Heinrich Kuttler describes straightforward multithreaded implementations failing to scale beyond a few parallel simulated environments due to GIL contention, with multiprocessing adding complexity and in effect ruling out interacting with CUDA from different workers.

The Steering Council's acceptance came with an explicit proviso: the rollout must be gradual and break as little as possible, and they retain the ability to roll back any changes that turn out to be too disruptive, including potentially rolling back all of PEP 703 entirely. The PEP itself is now marked a historical document, with current documentation living under Python's free-threading pages.

> [!warning] "The GIL is gone" is not what shipped
> PEP 703 adds an optional build configuration, not a change to the default interpreter. A free-threaded build is a different binary with different extension compatibility characteristics, accepted on the condition that it can be rolled back. Treat "does this run under free-threading" as a per-build, per-extension question, not as a version number.

## Choosing between threads, processes, and asyncio

The three mechanisms are not three styles of the same thing. They fail differently, and the workload picks one.

**Threads** share memory and are cheap to start, and they buy real throughput whenever the work happens outside the interpreter. Blocking I/O releases the GIL, and so does well-written native code, which is why NumPy-heavy and image-processing workloads scale on threads while pure-Python loops do not. The cost is that every shared object is a synchronization problem you own, and that CPU-bound bytecode serializes.

**Multiprocessing** side-steps the problem by not sharing an interpreter. The standard library documentation describes the package as supporting spawning processes with an API similar to `threading`, offering both local and remote concurrency, effectively side-stepping the Global Interpreter Lock by using subprocesses instead of threads, and thereby allowing the programmer to fully leverage multiple processors. `Pool` gives the common data-parallel shape, distributing input data across processes.

PEP 703 is candid about what that costs, and gives numbers. Each subprocess has its own interpreter, so there is one GIL per process, but communication between processes is limited: objects generally need to be serialized or copied to shared memory, which introduces [[cs/languages/common/serialization-and-wire-formats|serialization]] overhead and complicates building APIs on top. Starting a subprocess is also more expensive than starting a thread: the PEP states roughly 100 microseconds to start a thread against roughly 50 milliseconds to spawn a subprocess, a 500-fold difference driven by Python re-initialization. And many C and C++ libraries support access from multiple threads but do not support access or use across multiple processes.

**asyncio** is a different axis entirely. It is a single-threaded event loop doing cooperative multitasking, so the GIL is not a constraint on it because there is only ever one thread; the treatment in [[cs/languages/common/concurrency-in-practice|concurrency in practice]] covers it. It suits high-connection-count I/O work where the bottleneck is waiting on many sockets, and it suits nothing that is CPU-bound, because a coroutine that computes without awaiting blocks the entire loop.

> [!example] Reading the decision off the profile
> Profile first, then choose. If most of the time is inside interpreted bytecode, threads will not help and multiprocessing will, at the price of serialization and roughly 50 milliseconds per worker startup. If most of the time is in native library calls that release the GIL, threads already work and processes would only add copying. If most of the time is spent blocked on network I/O with many concurrent connections, asyncio wins on memory per connection and threads win on ease of integration with blocking libraries. The GIL only decides the first case, which is why arguments about it so often talk past each other: the two people are profiling different programs.

## Related Notes

- [[cs/languages/common/concurrency-in-practice|Concurrency in Practice]] - where Python, Rust, and C++ each put the data-race burden, and the asyncio event-loop model
- [[cs/languages/common/memory-ownership-refcounting-gc|Who Frees the Memory]] - the reference counting that makes the GIL necessary and a concurrent collector hard
- [[cs/systems/processes-and-threads|Processes and Threads]] - what a process actually costs relative to a thread at the OS layer
- [[cs/pl/concurrency-models-threads-locks-and-actors|Concurrency Models]] - the theory of threads, locks, and message passing behind these three mechanisms
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - the extension API whose guarantees kept the GIL alive
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - the tax multiprocessing pays on every object crossing a process boundary

## Sources

- "GlobalInterpreterLock," Python Wiki. https://wiki.python.org/moin/GlobalInterpreterLock . Supports the GIL being a mutex protecting access to Python objects and preventing multiple threads from executing bytecode at once, its necessity because CPython memory management is not thread-safe, the observation that I/O, image processing, and NumPy work happen outside the GIL so only bytecode-heavy multithreading is bottlenecked, the secondary costs (system call overhead, two threads costing twice as much, I/O-bound threads scheduled ahead of CPU-bound ones, signals not delivered, extensions needing to be GIL-aware), the desirable properties of any replacement including the single-threaded speed constraint and the refcounting-versus-concurrent-GC tension, the three incompatible techniques (tracing and `tp_traverse`, write barriers and `Py_INCREF`, exact stack information), the requirement that replacements provide GIL-like guarantees by default with opt-in threading for extensions, and the prompt-destruction and ordered-destruction properties.
- "PEP 703 - Making the Global Interpreter Lock Optional in CPython," Python Enhancement Proposals. https://peps.python.org/pep-0703/ . Supports the `--disable-gil` build configuration targeting Python 3.13, the scientific-computing motivation and the point that cycles are spent in optimized CPU/GPU kernels, the intra/inter-operator and request parallelism framing, the DeepMind and NetHack Learning Environment practitioner quotes, the multiprocessing limitations including one GIL per process, serialization or shared-memory copying, the ~100 microsecond thread versus ~50 millisecond subprocess startup figures, and libraries supporting multiple threads but not multiple processes, plus the Steering Council's rollback proviso and the PEP's historical-document status.
- "multiprocessing - Process-based parallelism," Python Standard Library. https://docs.python.org/3/library/multiprocessing.html . Supports multiprocessing spawning processes with an API similar to `threading`, offering local and remote concurrency, effectively side-stepping the Global Interpreter Lock by using subprocesses instead of threads to fully leverage multiple processors, and `Pool` parallelizing a function across multiple input values as data parallelism.
