---
title: Free Threading and the End of the GIL
description: "PEP 703 did not delete a lock, it rebuilt reference counting around the fact that most objects are touched by one thread, and single-threaded programs pay for it."
draft: false
comments: true
tags:
  - cs
  - languages
  - concurrency
date: 2026-08-08
updated:
aliases:
  - PEP 703
  - Free-Threaded Python
  - disable-gil
---

Removing a lock sounds like deletion. It was not. The lock in question was doing a second, undocumented job, and that job is why removing it took a decade and a rewrite of how Python counts references.

PEP 703 opens with the problem in two sentences. CPython's global interpreter lock prevents multiple threads from executing Python code at the same time, and the GIL is an obstacle to using multi-core CPUs from Python efficiently. The proposal itself is narrow: add a build configuration, `--disable-gil`, that lets CPython run Python code without the global interpreter lock, with the changes needed to make the interpreter thread-safe. The parenthetical is where the work hides.

> [!note] The idea
> The GIL was implicitly protecting every reference count in the interpreter. Removing it therefore meant making refcounting thread-safe without making it atomic, because atomic increments on every pointer copy would cost more than the parallelism gained. The answer is a bet on a measured empirical fact: most objects are only ever touched by one thread. Biased reference counting turns that observation into a data structure with two counters, and the cost of the bet is paid by single-threaded programs, in percent.

## Why counting was the hard part

The GIL is described in [[cs/languages/Python/the-gil-and-python-concurrency|its own right elsewhere]]; the point here is what depended on it. As the PEP puts it, removing the GIL requires changes to CPython's reference counting implementation to make it thread-safe. Furthermore, it needs to have low execution overhead and allow for efficient scaling with multiple threads.

Those three requirements conflict. Thread-safe counting is trivially achievable with atomic read-modify-write instructions on every increment and decrement. It is also ruinous, because [[cs/languages/Python/cpython-object-model-and-reference-counting|Python touches a reference count on every pointer copy]], so an atomic operation would land on argument passing, list appends, and attribute stores, in the hot path of every program. Worse, hot shared objects such as `None` and common types would have every core fighting over one [[cs/systems/cache-coherence|cache line]]. Atomic counting does not merely add instructions, it manufactures contention on exactly the objects that are shared most.

So the PEP proposes a combination of three techniques: immortalization, a limited form of deferred reference counting, and a switch from plain non-atomic reference counting to biased reference counting, which is a thread-safe reference counting technique with lower execution overhead than plain atomic reference counting.

## Biased reference counting

Biased reference counting is a 2018 technique from Jiho Choi, Thomas Shull, and Josep Torrellas, and it is based on the observation that most objects are only accessed by a single thread, even in multi-threaded programs. Program behavior, not language design, is the load-bearing claim.

The implementation splits the counter in two. Each object is associated with an owning thread, the thread that created it. Reference counting operations from the owning thread use non-atomic instructions to modify a local reference count, and other threads use atomic instructions to modify a shared reference count. The payoff is stated in hardware terms: this design avoids many atomic read-modify-write operations that are expensive on contemporary processors.

The common case therefore costs what it cost before, a plain non-atomic increment on a field the owning thread alone writes. Only cross-thread access takes the expensive path. The shared count can even go temporarily negative, since increfs and decrefs need not balance between threads, so the object header carries a small state machine tracking whether the two counts are still separate or have been merged. An object is dead when both counters agree that nothing is left, which requires a protocol rather than a comparison against zero.

## Deferring, for the objects everyone touches

Biased counting handles the private case. There is a second population it cannot help: a few types of objects, such as top-level functions, code objects, modules, and methods, tend to be frequently accessed by many threads concurrently. These are genuinely shared, so the bias is wrong for all of them, and every thread calling a module-level function would contend on that function's counter.

Immortalization solves this for objects that live forever, but these objects do not necessarily live for the lifetime of the program, so the PEP proposes a limited form of deferred reference counting to avoid contention on their reference count fields. The mechanism removes the counting rather than protecting it. Typically the interpreter modifies reference counts as objects are pushed to and popped from the interpreter's stack, and for objects using deferred counting, the interpreter skips these reference counting operations entirely. The count is then knowingly wrong, an underestimate, and the cycle collector reconciles it. The stack is a root set that a tracing collector can scan, so the counts do not need to describe it.

That is a quiet architectural shift. Reference counting stops being the complete answer to liveness for those objects and becomes an approximation the [[cs/pl/gc-algorithms-mark-sweep-copying-generational|tracing collector]] corrects, which moves CPython closer to the hybrid designs it spent thirty years avoiding.

## What it costs, and who pays

The PEP is honest about the bill. On pyperformance, the reported execution overhead of a `--disable-gil` build is 6% on Intel Skylake and 5% on AMD Zen 3 for single-threaded programs, and 8% and 7% for multi-threaded ones. The largest contribution to execution overhead is biased reference counting followed by per-object locking. The shipped implementation improved on those figures: the free-threaded build has additional overhead when executing Python code compared to the default GIL-enabled build, and on the pyperformance benchmark suite the average overhead ranges from about 1% on macOS aarch64 to 8% on x86-64 Linux systems.

One second-order cost is more interesting than the headline number. For thread-safety reasons, an application running with multiple threads will only specialize a given bytecode once, which is why multi-threaded overhead exceeds single-threaded overhead. [[cs/languages/Python/the-bytecode-and-the-eval-loop|The specializing interpreter]] rewrites instructions in place as it learns types, and an instruction that many threads may execute concurrently cannot be rewritten repeatedly without synchronization. Removing one global lock forced a retreat in an optimization that assumed exactly one writer, which is the general shape of the whole project: the GIL was not one lock, it was an invariant a thousand pieces of code silently assumed.

> [!warning] The lock did not fully leave
> Free-threaded builds support optionally running with the GIL enabled at runtime via `PYTHON_GIL` or `-X gil`, and the GIL may also automatically be enabled when importing a C-API extension module that is not explicitly marked as supporting free threading, with a warning printed. Backward compatibility runs through the C API: an extension written under the assumption that only one thread runs Python code at a time is not safe without it, and there is no way to check mechanically, so the interpreter re-enables the lock rather than crashing.

The semantic guarantees also narrowed. Some data-race-free behavior that programs relied on came from the GIL, not from any documented promise. The free-threading guide notes that it is generally not thread-safe to access the same iterator object from multiple threads concurrently, and that threads may see duplicate or missing elements. That was always true in principle and never observable in practice, because the GIL made the individual steps atomic. This is the recurring lesson of concurrency work: an implementation detail that makes racy code work is a guarantee your users depend on whether you documented it or not, and taking it away is a breaking change even when the specification never promised it.

## Related Notes

- [[cs/languages/Python/the-gil-and-python-concurrency|The GIL and Python Concurrency]] - the lock itself, and what it was for
- [[cs/languages/Python/cpython-object-model-and-reference-counting|CPython's Object Model and Reference Counting]] - the counter that had to become thread-safe
- [[cs/systems/cache-coherence|Cache Coherence]] - why an atomic increment on a shared object is expensive rather than merely slower
- [[cs/languages/Python/the-bytecode-and-the-eval-loop|The Bytecode and the Eval Loop]] - the specializing interpreter that had to give ground
- [[cs/pl/gc-algorithms-mark-sweep-copying-generational|GC Algorithms: Mark-Sweep, Copying, and Generational]] - the tracing side that deferred counting leans on
- [[cs/languages/Java/the-java-memory-model-and-happens-before|The Java Memory Model and Happens-Before]] - what it looks like to specify the guarantees instead of inheriting them from a lock

## Sources

- "PEP 703 - Making the Global Interpreter Lock Optional in CPython," Python Enhancement Proposals. https://peps.python.org/pep-0703/ . Supports the GIL preventing simultaneous execution of Python code and obstructing multi-core use; the `--disable-gil` build configuration; the requirement to make reference counting thread-safe with low overhead; biased reference counting's origin, its single-thread-access observation, owning threads, local versus shared counts, and avoidance of expensive atomic read-modify-write operations; deferred reference counting for functions, code objects, modules, and methods, and the interpreter skipping stack reference counting for them; the reported per-platform overhead figures and biased reference counting being the largest contributor; and multi-threaded applications specializing a given bytecode only once.
- "Python support for free threading," Python HOWTOs. https://docs.python.org/3/howto/free-threading-python.html . Supports the free-threaded build's additional execution overhead and the measured range from about 1% on macOS aarch64 to 8% on x86-64 Linux; the runtime re-enabling of the GIL via `PYTHON_GIL` or `-X gil` and automatically on importing an unmarked C extension with a warning; and the documented lack of thread safety for sharing an iterator across threads.
