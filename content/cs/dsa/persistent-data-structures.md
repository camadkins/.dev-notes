---
title: Persistent Data Structures
description: "A structure that preserves every previous version of itself when modified. Structural sharing is what makes that cost a logarithm instead of a copy, and a branching factor of 32 is what makes the logarithm small enough to ignore."
draft: false
comments: true
tags:
  - cs
  - dsa
date: 2026-08-31
updated:
aliases:
  - HAMT
---

A persistent data structure always preserves the previous version of itself when it is modified. Such structures are effectively immutable: their operations do not visibly update the structure in place, but always yield a new updated structure. The term was introduced by Driscoll, Sarnak, Sleator, and Tarjan in 1986. A structure that is not persistent is called *ephemeral*, which is a useful word precisely because almost every structure taught first is one.

> [!note] The idea
> The naive way to keep the old version is to copy, which costs `Θ(n)` per update and makes an immutable structure asymptotically worse than a mutable one. Structural sharing replaces the copy: rebuild only the nodes on the path from the root to the change and let the new root point at the *old* subtrees everywhere else. The cost of an update becomes the length of that path rather than the size of the structure, so a balanced tree gives `O(log n)`. Every persistent structure is some answer to the same question, which is how to make the path short.

## Three grades of persistence

The word covers a spectrum, and papers are precise about which they mean.

**Partially persistent**: all versions can be accessed but only the newest can be modified. This implies a linear ordering among versions.

**Fully persistent**: every version can be both accessed and modified. The version history becomes a tree rather than a line, because two different updates can branch from the same ancestor.

**Confluently persistent**: fully persistent, plus a meld or merge operation that creates a new version from two previous ones. The history is now a DAG. This is the strongest and the hardest, since a merge has to reconcile two independently evolved structures.

Purely functional data structures are automatically persistent, which is why the concept is particularly common in logical and functional programming, where languages discourage or forbid mutable data.

## The mechanism, from cheapest idea to the one that is used

**Copy-on-write.** Store the data in an ephemeral structure such as an array and copy the whole thing on every write. This is inefficient because the entire backing structure must be copied for each write, giving worst-case `O(n·m)` for `m` modifications of an array of size `n`. It is the baseline every other technique is measured against.

**Fat nodes.** Record all changes to node fields in the nodes themselves without erasing old values, letting nodes become arbitrarily fat. Each extra field value carries a field name and a version stamp indicating the version in which that field took that value, and each node carries its own version stamp so it holds at most one value per field name per version. Modification is `O(1)` space and `O(1)` amortized time, since it appends to a history. The cost lands on reads: with `m` modifications, every access takes an `O(log m)` slowdown from finding the nearest modification, because navigating the structure means locating the right version at each node.

**Path copying.** Assume the structure is a linked graph of nodes. On update, copy every node on the path to the node being modified, then cascade: each node that pointed at an old node is modified to point at the new one, which causes more cascading, until the root is reached. This is structural sharing stated as an algorithm, and its cost is exactly the shape of the graph. In a balanced binary search tree without parent pointers, worst-case modification is `O(log n + update cost)`; in a [[cs/dsa/linked-list|linked list]] it is `O(n + update cost)`. Path copying costs `O(log m)` additive lookup time with `m` modifications.

The list case is the one worth pausing on, because it shows structural sharing is not automatically cheap. A cons list is persistent for free at the *front*: taking the tail and consing a new node in front shares the entire tail between the old list and the new one, and as long as the contents are immutable the sharing is invisible to the program. Modify the last element instead and every node ahead of it must be copied. Persistence is cheap exactly where the path to the change is short.

**The combination.** Driscoll, Sarnak, Sleator, and Tarjan combined fat nodes with path copying to get `O(1)` access slowdown and `O(1)` amortized overhead in both space and time per modification, assuming a linked structure with at most `d` incoming pointers per node for a known constant `d`. Each node carries one modification box holding a single change plus a timestamp. On access, the box's timestamp is compared against the version being read and either used or ignored. On modification, an empty box is filled; a full one forces a copy of the node with latest values, which cascades to the parent exactly as in path copying. The `O(1)` amortized bound comes from [[cs/dsa/amortized-analysis-methods|a potential function]] counting full live nodes: each copy costs `O(1)` and drops the potential by one, and the final box fill raises it by one, so `Δφ = 1 - k` and the whole modification is `O(1)`.

## Why the logarithm reads as a constant

Path copying gives `O(log n)`, and the practical objection is that a persistent map should therefore be measurably worse than a [[cs/dsa/hash-tables|hash table]]'s `O(1)`. The answer is arithmetic on the base of the logarithm.

The structure that wins is the **hash array mapped trie** (HAMT), an implementation of an associative array combining the characteristics of a hash table and an array mapped trie, described in Phil Bagwell's 2000 report *Ideal Hash Trees*. Keys are hashed first, which ensures an even distribution and a constant key length, and the hash is then consumed a few bits at a time as a path through [[cs/dsa/tries|a trie]]. Each node holds a table of `N` slots, each either nil or a pointer to another node, and `N` is commonly 32.

Thirty-two slots means five bits of hash consumed per level, so the depth is `log₃₂ n`. That is 4 levels for a million entries, 6 for a billion, and 13 for `2^64` of them. The `O(log n)` is real, and its value over any structure that fits in an address space is a small integer. This is the same observation Racket's documentation makes about its immutable hash tables, which provide logarithmic access and update while `log n` is bounded by the address space at under 30 or 62 depending on platform, so it can be treated reasonably as a constant.

> [!warning]
> The constant factor is where the honest comparison lives. Persistent operations allocate on every update, chase four to six pointers instead of one, and hash before they can start; a mutable hash table does one hash and one indexed load. The asymptotic gap closes into a constant-factor gap with a known ceiling, and whether that factor is worth paying is a question about the algorithm rather than about the data structure.

Allocating `N` pointers per node would be wasteful when most slots are empty, so a HAMT node instead holds an `N`-bit bitmap where each bit indicates the presence of a non-nil pointer, followed by an array of pointers equal in length to the [[cs/dsa/bitwise-operations|Hamming weight]] of that bitmap. Indexing a child means masking the bitmap below the target bit and counting the remaining ones, so the implementation depends on the population count function. It is available in many instruction set architectures, in only some high-level languages, and although it can be implemented in software in `O(1)` time with a series of shifts and adds, doing so may run an order of magnitude slower. A structure whose whole reputation rests on a small branching factor turns out to rest on one machine instruction underneath.

> [!example] What one update touches
> A HAMT holding a million keys is 4 levels deep. Inserting a key rebuilds 4 nodes: the leaf's parent chain up to the root, each a fresh allocation containing an updated bitmap and a pointer array of at most 32 entries.
>
> Everything else, which is essentially the entire structure, is pointed at by both the old root and the new one. Two versions of a million-entry map differ by roughly a hundred words of memory, and both remain fully usable. That is the whole trade in one sentence: you pay a handful of small allocations to keep a version you would otherwise have had to copy.

## Where they earn their cost

Persistent structures win wherever old versions still have readers. Undo stacks, backtracking search, snapshot isolation in a database, an environment threaded through a recursive traversal, and any structure handed to another thread that may outlive the caller's use of it. In each case the alternative is a copy, and the copy is linear where the update is logarithmic.

The concurrency case is the strongest and is often understated. A persistent structure needs no lock for readers, because a reader holds a root that no writer can reach. Writers publish by swapping a single root pointer, which turns a data-structure-wide synchronization problem into one compare-and-swap.

Many common reference-based structures adapt easily to a persistent version, including [[cs/dsa/rb-tree|red-black trees]], [[cs/dsa/stack|stacks]], and treaps. Others need more effort, notably queues, deques, and their extensions.

> [!warning]
> Persistence and sharing are difficult to manage without some form of [[cs/pl/garbage-collection-concepts|garbage collection]] to automatically free nodes with no live references, and this is why GC is a feature commonly found in functional programming languages. Nothing in a persistent structure knows how many versions still point at a given node, so reference counting or tracing has to answer that question. This is the real reason persistent collections are a library in Rust rather than the default: without a tracing collector, someone has to own the shared subtrees.

## Related Notes

- [[cs/dsa/tries|Tries]] - the prefix tree a HAMT walks, with hashed keys standing in for strings
- [[cs/dsa/types-of-tries|Types of Tries]] - the standard, compressed, and suffix variants, and the memory-versus-depth trade a HAMT resolves with a bitmap
- [[cs/dsa/hash-tables|Hash Tables]] - the mutable baseline the persistent version is measured against
- [[cs/dsa/linked-list|Linked Lists]] - persistent at the front for free, and linear at the back
- [[cs/dsa/rb-tree|Red-Black Tree]] - one of the structures that adapts easily to a persistent version
- [[cs/dsa/amortized-analysis-methods|Amortized Analysis]] - the potential-function argument behind the `O(1)` combined method
- [[cs/dsa/bitwise-operations|Bitwise Operations]] - the population count that makes a sparse 32-slot node cheap to index
- [[cs/dsa/logarithmic-functions|Logarithmic Functions]] - why the base of the logarithm decides whether `O(log n)` is felt
- [[cs/dsa/space-complexity|Space Complexity]] - the accounting for what two versions of one structure actually cost
- [[cs/pl/garbage-collection-concepts|Garbage Collection: Concepts]] - what has to exist for shared subtrees to be freed at all
- [[cs/languages/Racket/immutable-data-and-persistent-structures|Immutable Data and Persistent Structures]] - one language's published cost model for exactly these structures

## Sources

- "Persistent data structure," Wikipedia. https://en.wikipedia.org/wiki/Persistent_data_structure . Backs the definition of a persistent structure as one always preserving its previous version, being effectively immutable and yielding a new structure rather than updating in place, the term's introduction in Driscoll, Sarnak, Sleator, and Tarjan's 1986 article, and the term ephemeral for non-persistent structures; the partial, full, and confluent grades with their access and modification rules and the linear ordering implied by partial persistence; purely functional structures being automatically persistent and the concept's prevalence in logical and functional programming; copy-on-write with its `O(n·m)` cost for `m` modifications of an array of size `n`; the fat node method with per-field version stamps, per-node version stamps ensuring one value per field name per version, `O(1)` space and amortized time per modification and `O(log m)` access slowdown; path copying with its cascade to the root, `O(log m)` additive lookup, and the `O(log n + update cost)` balanced-tree versus `O(n + update cost)` linked-list modification bounds; the Driscoll et al. combination with modification boxes, timestamps, the `d`-incoming-pointer assumption, `O(1)` access slowdown, and the potential-function proof giving `Δφ = 1 - k`; the cons list sharing its tail invisibly between old and new lists; red-black trees, stacks, and treaps adapting easily while queues and deques need more effort; and the need for garbage collection to free nodes with no live references, explaining why GC is common in functional languages.
- "Hash array mapped trie," Wikipedia. https://en.wikipedia.org/wiki/Hash_array_mapped_trie . Backs the HAMT as an implementation of an associative array combining the characteristics of a hash table and an array mapped trie, attributed to Phil Bagwell's 2000 report "Ideal Hash Trees" for the Infoscience Department at EPFL; keys being hashed first to ensure even distribution and constant key length; nodes holding a table of `N` slots each nil or a pointer with `N` commonly 32; the bitmap of `N` bits plus a pointer array equal in length to its Hamming weight, adopted because allocating `N` pointers per node would be expensive; the dependence on the population count function, its availability in many instruction set architectures and only some high-level languages, and the order-of-magnitude penalty for a software implementation; and the use of persistent HAMT variants for the native hash map types of Clojure, Scala, and Frege, in Haskell's unordered-containers, in Erlang since release 18.0, and in Rust's im and im-rc crates.
