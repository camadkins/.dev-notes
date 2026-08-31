---
title: Space Complexity
description: How algorithms use memory and how to reason about auxiliary space, recursion, and in-place trade-offs.
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-12-07
aliases: []
---

## Overview
**Space complexity** measures how much **additional memory** an algorithm needs as a function of the input size `n`. It complements time complexity and guides choices in environments where memory is scarce, data volume is large, or latency depends on cache and allocation behavior. Understanding space lets you decide when an algorithm is **in-place**, when recursion is too deep, and when a **streaming** or **external-memory** strategy is warranted.

> [!note]
> Unless stated otherwise, **auxiliary space** means memory beyond the input and the required output. Some conventions count the recursion stack as part of the auxiliary space; this note does.

## Motivation
Memory limits are common:
- Embedded systems and microservices use small heaps or fixed arenas.
- Data pipelines process inputs larger than RAM; paging trashes performance.
- Concurrency multiplies memory footprints across threads or tasks.
Choosing an algorithm with **sublinear** or **in-place** memory can be the difference between success and failure, even if it is not the fastest in raw CPU time.

## Definition and Formalism
Let `S(n)` denote auxiliary space for an input of size `n`.

- **Constant space**: `S(n) = Θ(1)` - in-place, aside from recursion stack if any.
- **Logarithmic space**: `S(n) = Θ(log n)` - typical of divide-and-conquer with tail recursion eliminated or shallow stacks.
- **Linear space**: `S(n) = Θ(n)` - buffers proportional to input, e.g., stable merging.
- **Sublinear**: `o(n)` - streaming/sketching; limited working memory.
- **Superlinear**: `ω(n)` - rare but can occur in high-dimensional dynamic programs or memoization of large state spaces.

**Total space** sometimes refers to input + output + auxiliary; here we focus on **auxiliary** unless otherwise specified.

### What counts toward `S(n)`
- **Data structures** allocated by the algorithm (arrays, hash tables, trees).
- **Recursion stack frames** and **iterative stacks/queues** used for traversal.
- **Temporary buffers** for merging, partitioning, or copying.
- **Metadata** (visited flags, parent arrays, path reconstructions).

What **usually does not** count:
- The **input** stored before the algorithm runs.
- The **output** that the problem requires to exist at the end (e.g., the sorted array replacing the input).

> [!tip]
> State your **space model** explicitly in documentation: "counts recursion stack; in-place means `O(1)` auxiliary words excluding the input and final output."

## Example or Illustration
Consider three classic cases:

1) **Binary Search** on a sorted array uses **`Θ(1)`** space if written iteratively. A recursive version uses `Θ(log n)` stack frames, one per level of the decision tree.

2) **Merge Sort** on arrays is stable but needs **`Θ(n)`** extra buffer for merging. Linked-list merge sort can be made more memory-frugal (relink nodes), but the array version's buffer dominates `S(n)`.

3) **Quick Sort** partitions in place and recurses on subarrays. With good pivot selection and tail-call elimination, stack depth is **`Θ(log n)`** expected, so `S(n) = Θ(log n)`. In the worst case it can reach `Θ(n)` if not guarded (introspective fallback helps).

## Properties and Relationships
### Auxiliary vs total space
Let `Aux(n)` be space beyond input and required output. If the algorithm must assemble a separate output (e.g., building a new list while keeping the input intact), then **total** space can be `Θ(n)` even if `Aux(n)` is small. Be precise about which notion is relevant for your system.

### Recursion, iteration, and stack depth
- Every recursive call adds a **frame** with parameters, locals, and return addresses.
- If the recursion tree height is `h(n)`, then stack space is `Θ(h(n))`.
- Tail recursion can compile to loops in some languages, but do not assume guaranteed **tail-call elimination**; it's not universal.

> [!warning]
> **Stack overflows** occur when `h(n)` exceeds runtime stack limits (often 0.5–8 MB by default). Deep recursions on skewed trees or lists are common culprits; prefer iterative forms or explicit stacks.

### In-place algorithms
An algorithm is **in-place** when `S(n) = O(1)` words beyond the input/output. Subtleties:
- Many "in-place" algorithms still need `O(log n)` for recursion or a few pointers.
- Some operations require **swap** or **rotate** primitives; large-object swaps may incur hidden copies unless handled by reference.

### Space–time trade-offs
- **Memoization / DP** replaces exponential recomputation with a **table**, trading time for space (`Θ(n)` or more).
- **Hashing** accelerates membership queries at the cost of `Θ(n)` space.
- **Compression** reduces space but adds CPU time; e.g., succinct structures or run-length encoding of bitsets.
- **Bidirectional search** halves depth (time) using two frontiers (space) instead of one.

### Memory hierarchy & locality
Space affects **cache behavior**:
- Smaller working sets stay in **L1/L2**, reducing [[cs/systems/memory-hierarchy-and-caching|cache misses]].
- Streaming algorithms with contiguous scans outperform pointer-chasing structures of the same asymptotic space.
- Blocking/tiling trades modest extra buffers for locality wins.

## Implementation or Practical Context
### How to compute `S(n)` (checklist)
1. **List all allocations**: arrays, maps, trees, buffers, queues.
2. **Account for recursion/iteration**: maximum frame depth, explicit stacks/queues.
3. **Find peak usage**: overlapping lifetimes matter; reuse buffers where lifetimes do not overlap.
4. **Ignore** input and required output unless documenting **total space**.
5. **Express** the maximum as a function: `S(n) = a·n + b·log n + c`.

> [!tip]
> For multi-phase algorithms, sketch a **timeline** of lifetimes to identify buffers that can be reused (arena/stack allocators, object pools).

### Common patterns
- **Graph traversals**: BFS uses a queue with up to `Θ(|V| + |E|)` storage in sparse graphs (dominated by `Θ(|V|)` for the queue and `Θ(|V|)` for visited). DFS recursion uses `Θ(|V|)` worst-case stack depth; iterative DFS uses an explicit stack of the same order.
- **Prefix sums / scans**: `Θ(1)` or `Θ(k)` extra depending on whether outputs overwrite inputs or are written to a separate array of the same length (`Θ(n)` total space).
- **String algorithms**: KMP uses `Θ(m)` for the failure table, where `m` is the pattern length; the real-time variant that keeps a separate failure table per alphabet symbol costs `Θ(m·|Σ|)`. Boyer–Moore is `Θ(k + m)`, the bad-character table sized by the alphabet `k` plus the good-suffix table sized by the pattern.
- **Counting and radix**: Counting sort keeps a `Θ(k)` frequency array, where `k` is the key range; radix uses `Θ(b)` per pass for bucket counts in addition to an output buffer `Θ(n)`.

### Engineering for low space
- Prefer **in-place partitioning** (e.g., Hoare/Lomuto variants with care for stability needs).
- Use **two-pointer** and **sliding-window** techniques to keep `O(1)` state in linear passes.
- Replace recursion with **explicit stacks/queues** for control over memory and to avoid stack limits.
- When a full table is too large, switch to **streaming sketches** (e.g., HyperLogLog for cardinality, Count-Min Sketch for frequencies) at the cost of approximation.

### External memory and streaming
When `n` exceeds RAM, minimize random access and pass count:
- **External merge sort**: sort chunks in memory, spill, then multiway-merge; uses buffers sized to RAM and [[cs/history/magnetic-disk-storage|sequential disk I/O]].
- **Single-pass streaming**: maintain only `o(n)` state (reservoir sampling, quantile sketches, online statistics).
- **Chunked DP**: compute tiles and discard intermediates; recompute on demand if necessary.

### Language/runtime considerations
- **Garbage-collected** languages free memory **eventually**; peak usage depends on GC cycles and retention. Reuse buffers and null references when safe.
- **Allocator overhead**: many small objects (linked structures) incur per-object headers and [[cs/systems/memory-allocators-and-fragmentation|fragmentation]]; a flat array often reduces peak space and improves locality.
- **Immutability/persistence** (functional data structures) increases sharing but may create **versioned** nodes; asymptotic space can remain `Θ(n)` while constants differ.

## Common Misunderstandings
> [!warning]
> **"In-place means zero extra space."** In practice, "in-place" allows a small number of **machine words** for indices/pivots and sometimes `O(log n)` stack space.

> [!warning]
> **"Recursion is free."** Each call consumes a frame; even trivial locals add up on deep inputs. Convert to iterative or add tail-call–friendly structure only if your runtime guarantees elimination.

> [!warning]
> **"Counting space ignores output."** Be clear whether you are reporting **auxiliary** space or **total** space. Constructing a distinct output array necessarily incurs `Θ(n)` additional space.

> [!warning]
> **"Lower space is always better."** Not if it destroys locality or forces multiple passes. Sometimes a modest buffer reduces cache misses enough to win in time and energy.

## Broader Implications
Space bounds shape algorithm choice:
- **Stable sorts** like merge trade `Θ(n)` space for guarantees and predictable access.
- **Hashing vs trees**: hashing uses `Θ(n)` space to get `O(1)` expected time; balanced trees use similar space for ordered operations at `O(log n)`.
- **DP vs recomputation**: memoization uses `Θ(state)` space; if memory is tight, consider **divide-and-conquer DP** with **Hirschberg-style** space reductions (e.g., LCS from `Θ(nm)` to `Θ(min(n,m))` extra with recomputation).
- **Space classes** (theory): `L` (log-space), `PSPACE` (poly-space) bound what is computable within memory caps; in practice, log-space algorithms often correspond to streaming and on-the-fly traversals.

## Summary
Space complexity captures the **working memory** required by algorithms. Distinguish **auxiliary** from **total** space, account for **recursion stacks**, and be explicit about what "**in-place**" means. Use iterative forms, buffer reuse, and streaming when memory is scarce; accept larger buffers when they materially improve **locality** and **throughput**. The best choice balances **time**, **space**, and **system constraints** rather than optimizing one metric in isolation.

## Related Notes
- [[cs/dsa/time-complexity-analysis|Time Complexity Analysis]]
- [[cs/dsa/recursion|Recursion]]
- [[cs/dsa/memory-allocation|Memory Allocation]]
- [[cs/dsa/merge-sort|Merge Sort]]

## Sources

- Space complexity, Wikipedia. https://en.wikipedia.org/wiki/Space_complexity . Backs the auxiliary-versus-total distinction the Overview and Properties sections rest on: auxiliary space is the memory an algorithm needs beyond the input, total space counts the input as well, and which one is being reported has to be stated.
- In-place algorithm, Wikipedia. https://en.wikipedia.org/wiki/In-place_algorithm . Backs the sense of in-place the note argues for in its misunderstandings section: the strictest reading allows only constant extra space counting pointers, the broader and usual reading allows a small non-constant amount, typically O(log n), and quicksort is called in-place despite needing O(log n) stack pointers for its recursion.
- Merge sort, Wikipedia. https://en.wikipedia.org/wiki/Merge_sort . Backs the illustration's second case, the Theta(n) auxiliary buffer the array version of merge sort needs, and the linked-list variant's smaller footprint.
- Quicksort, Wikipedia. https://en.wikipedia.org/wiki/Quicksort . Backs the third case: in-place partitioning with O(log n) auxiliary space in Hoare's formulation, degrading toward linear stack depth when splits are unbalanced and the smaller-side-first guard is absent.
- Binary search algorithm, Wikipedia. https://en.wikipedia.org/wiki/Binary_search . Backs the first case, constant auxiliary space when written iteratively against one stack frame per halving in the recursive form.
- Counting sort, Wikipedia. https://en.wikipedia.org/wiki/Counting_sort . Backs the Theta(k) frequency array in the counting and radix pattern, where k is the key range.
- Knuth-Morris-Pratt algorithm, Wikipedia. https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm . Refuted the note's earlier claim that KMP's failure table is Theta(|Sigma|) or Theta(m): the page gives worst-case space Theta(m) in the pattern length, and the per-alphabet-symbol table belongs to the real-time variant, which is where the alphabet factor enters.
- Boyer-Moore string-search algorithm, Wikipedia. https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore_string-search_algorithm . Backs the corrected Boyer-Moore figure, worst-case space Theta(k + m) for the bad-character table sized by the alphabet k together with the good-suffix table.
- pthread_create(3), Linux manual page, man7.org. https://man7.org/linux/man-pages/man3/pthread_create.3.html . Backs the upper end of the stack-limit range in the overflow warning: on Linux the default thread stack size comes from the stack size resource limit, which is 8 MB.
- Thread Stack Size, Microsoft Learn (Win32 processes and threads). https://learn.microsoft.com/en-us/windows/win32/procthread/thread-stack-size . Backs the lower end of the same range: the default stack reservation size used by the Windows linker is 1 MB.
- Tail call, Wikipedia. https://en.wikipedia.org/wiki/Tail_call . Backs the caution that tail recursion can compile to a loop but that tail-call elimination is not universal and cannot be assumed.
- Hirschberg's algorithm, Wikipedia. https://en.wikipedia.org/wiki/Hirschberg%27s_algorithm . Backs the Broader Implications claim about space-reduced dynamic programming: it keeps Needleman-Wunsch's O(nm) time while needing only O(min{n, m}) space, and is the space-efficient way to compute a longest common subsequence.
- HyperLogLog, Wikipedia. https://en.wikipedia.org/wiki/HyperLogLog . Backs HyperLogLog as the cardinality sketch that trades exactness for sublinear working memory.
- Count-min sketch, Wikipedia. https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch . Backs Count-Min Sketch as the sublinear frequency-estimation structure named alongside it.
- External sorting, Wikipedia. https://en.wikipedia.org/wiki/External_sorting . Backs the external merge sort description: sort chunks that fit in memory, write them out, then merge the runs, with the design driven by sequential rather than random access.
- Reservoir sampling, Wikipedia. https://en.wikipedia.org/wiki/Reservoir_sampling . Backs reservoir sampling as the single-pass streaming technique holding only o(n) state.
- L (complexity), Wikipedia. https://en.wikipedia.org/wiki/L_%28complexity%29 . Backs L as the class decidable with a logarithmic amount of writable space, enough for a constant number of pointers into the input, which is the theoretical anchor for the note's claim that log-space corresponds in practice to on-the-fly traversals.
- PSPACE, Wikipedia. https://en.wikipedia.org/wiki/PSPACE . Backs PSPACE as the class solvable using a polynomial amount of space.
- Breadth-first search, Wikipedia. https://en.wikipedia.org/wiki/Breadth-first_search . Backs the graph-traversal pattern's space figure, which is governed by the vertex count for the queue and visited marks.
- Locality of reference, Wikipedia. https://en.wikipedia.org/wiki/Locality_of_reference . Backs the memory-hierarchy section: contiguous sequential access is the case caches are built for, which is why a smaller or better laid out working set wins over pointer chasing at the same asymptotic space.
