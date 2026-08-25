---
title: "Maps and Randomized Iteration Order"
description: "Swiss Tables under the built-in map, and why the runtime spends two calls to rand() making iteration order actively unstable rather than merely undefined."
draft: false
comments: true
tags:
  - cs
  - languages
  - data-structures
date: 2026-07-02
updated:
aliases: []
---

Print the contents of a Go map twice in the same process and the lines come out in different orders. The usual first guess is that something concurrent leaked in, or that the hash function is doing something clever. Neither. Two calls to `rand()` at the top of every map iteration put the disorder there deliberately, and the runtime pays for them on every `range` over every map.

> [!note] The idea
> The specification says iteration order is *unspecified*. The runtime goes one step further and makes it *actively random*, and those are different commitments. Unspecified permits an implementation that returns keys in insertion order forever. Randomized forbids it. Go chose the stronger property because a stable order that is merely unpromised is an order programs will silently come to depend on, and the only reliable way to stop that dependence from forming is to break it on the first run rather than on some future release.

## What the language actually promises

The spec is short about it. "A map is an unordered group of elements of one type" indexed by unique keys, and in the section on `range`, "The iteration order over maps is not specified" and it "is not guaranteed to be the same from one iteration to the next." The second clause is the interesting half. It rules out per-process stability, and cross-implementation stability along with it.

The spec also spells out what happens when you mutate a map mid-loop, which most languages simply forbid. If an entry that has not yet been reached is removed, "the corresponding iteration value will not be produced." If one is created, it may be produced or skipped, and "the choice may vary for each entry created and from one iteration to the next." That permissiveness turns out to be expensive, and the implementation notes say so directly: the permissiveness of Go maps with iteration results in iteration being the most complex part of the map implementation.

One more constraint shapes everything below. The equality operators must be fully defined on the key type, so "the key type must not be a function, map, or slice." This is the same requirement the [[cs/languages/Go/comparable-ordered-and-the-constraint-library|comparable constraint]] expresses in the type system, arriving from the other direction: a key you cannot compare is a key you cannot look up after a hash collision.

## The table underneath

Since Go 1.24 the built-in map is "a completely new implementation of the built-in map type, based on the Swiss Table design," replacing the implementation that shipped for the language's first decade. Swiss Tables are open addressed, so every entry lives in one backing array and collisions are resolved by probing elsewhere in that array rather than by hanging a list off a bucket. The classic tradeoffs of that choice belong to [[cs/dsa/hash-tables|hash tables]] generally.

What Swiss Tables add is a metadata trick. The backing array is cut into groups of eight slots, and "each group has a 64-bit control word for metadata." One byte per slot records empty, deleted, or in use, and when in use, "the byte contains the lower 7 bits of the hash for that" slot's key. A lookup broadcasts the seven-bit fragment of the key it wants across the control word and compares all eight bytes in a single operation. The blog's summary of the payoff is the whole design in one line: "we have effectively performed 8 steps of a probe sequence at once, in parallel."

That one word of metadata is why the structure is fast on real hardware and not merely on paper. Eight probe steps that would each have touched a different key now touch one aligned 64-bit word, which is a single line in the [[cs/systems/memory-hierarchy-and-caching|memory hierarchy]]. The keys themselves are read only for the candidates that survive the seven-bit filter.

Go then departs from the C++ original in one structural way. Abseil grows a Swiss Table all at once, and Go would not accept the tail-latency spike that implies for a large map. Instead "Go maps grow incrementally, so that each insertion has an upper bound on the amount of growth work it must do." A Go map is a directory of independent tables selected by the upper bits of the hash, "a form of extendible hashing," and `maxTableCapacity = 1024` caps how much any single grow can copy. The [[cs/dsa/amortized-analysis-methods|amortized cost]] is unchanged; the worst single insertion is what got bounded.

## Where the randomness enters

The iterator carries two random offsets, and the source comment states the purpose without hedging: "Randomize iteration order by starting iteration at a random slot" offset. There are two because there are two levels to walk. `entryOffset` rotates the walk within a table, and the directory needs its own because, as the comment says, "The offset into the directory uses a separate offset, as it" must adjust when the directory grows. `Init` sets both from `rand()` and nothing else consults them.

The arithmetic is worth reading closely. Within a group the code computes `uintptr(it.entryIdx+it.entryOffset) % abi.MapGroupSlots`, and at the directory level `(uint64(it.dirIdx) + it.dirOffset) & uint64(it.m.dirLen-1)`. Both are additions modulo the container size.

> [!warning] Rotation, not shuffle
> Adding a constant offset modulo the length is a rotation. Two keys adjacent in the underlying layout stay adjacent in the walk; only the starting point moves. Map iteration is therefore not a permutation of your keys and is not a source of randomness. Reaching for `for k := range m` to pick a random element gives you a value biased by memory layout, and shrinking the map does not make it fairer.

Placement is randomized separately and for a different reason. Every hash goes through `typ.Hasher(key, m.seed)`, so the slot a key lands in is not a property of the key alone. Two maps holding identical keys in the same program do not agree on their layouts.

## What it buys

The failure this prevents is the one that does not look like a failure. Suppose iteration were stable within a process. A test that compares printed output against a golden file passes. A cache key built by concatenating map entries is consistent. A protocol that serializes a map field round-trips byte for byte. Every one of those works, for years, until a runtime release changes a growth threshold or a different architecture picks a different bucket size, and then it breaks in production for reasons no local run reproduces.

Randomization moves that break to the earliest, cheapest, most local moment: the second time anyone runs the program. The bug surfaces in the developer's terminal, in a form that points straight at the map, before it has been written into anyone's expectations.

The remedy is mechanical. Collect the keys, sort them, and iterate the sorted slice. The order then exists in your code where a reader can see it, rather than in a memory layout that nobody promised you.

## Related Notes

- [[cs/dsa/hash-tables]] - open addressing, probe sequences, and load factor, the vocabulary this implementation is written in
- [[cs/dsa/maps-and-hashtable]] - the abstract map as a data type, independent of any one runtime
- [[cs/systems/memory-hierarchy-and-caching]] - why a single 64-bit control word beats eight scattered key comparisons
- [[cs/dsa/amortized-analysis-methods]] - the analysis that incremental growth deliberately declines to rely on
- [[cs/languages/Go/comparable-ordered-and-the-constraint-library]] - the same comparability requirement, stated as a type constraint
- [[cs/languages/Java/the-equals-and-hashcode-contract]] - the other mainstream answer to what a key must guarantee

## Sources

- [The Go Programming Language Specification](https://go.dev/ref/spec) - maps as unordered, the unspecified and unstable iteration order, mutation-during-range semantics, and the comparability requirement on key types
- [Faster Go maps with Swiss Tables](https://go.dev/blog/swisstable) - the Go 1.24 Swiss Table implementation, control words and parallel probing, extendible hashing for incremental growth, and the complexity cost of Go's iteration semantics
- [internal/runtime/maps/table.go](https://go.dev/src/internal/runtime/maps/table.go) - the iterator's two random offsets, the modular arithmetic that applies them, the 1024-entry table cap, and the per-map hash seed
