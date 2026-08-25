---
title: Memory Allocators and Fragmentation
description: How malloc-style allocators carve up the heap, why internal and external fragmentation are opposite failures, and the strategies that trade one for the other.
draft: false
comments: true
tags:
  - cs
  - systems
  - memory
date: 2026-05-03
updated:
aliases: []
---

A program asks for 29 bytes. It gets 32. Later it frees a block in the middle of three, and the resulting hole is real free memory that no sufficiently large request can ever use. Those two sentences are the entire subject: an allocator wastes memory either inside the blocks it hands out or in the gaps between them, and almost every design decision in a heap allocator is a choice about which of those two wastes to prefer.

> [!note] The idea
> Internal and external fragmentation are not two flavors of the same problem. They are opposite failures created by opposite fixes. Round allocations up to fixed sizes and you eliminate the unusable gaps but waste space inside every block. Cut blocks to exactly the size requested and you waste nothing inside but shatter the free space into pieces too small to reuse. There is no allocator that avoids both, so an allocator is best understood as a policy for choosing where to lose.

## What an allocator actually does

The job is smaller than it sounds. "The task of fulfilling an allocation request consists of locating a block of unused memory of sufficient size. Memory requests are satisfied by allocating portions from a large pool of memory called the *heap* or *free store*. At any given time, some parts of the heap are in use, while some are 'free' (unused) and thus available for future allocations." In C, "the function which allocates memory from the heap is called `malloc` and the function which takes previously allocated memory and marks it as 'free' (to be used by future allocations) is called `free`."

The complications arrive immediately. External fragmentation "arises when there are many small gaps between allocated memory blocks, which invalidates their use for an allocation request." And the bookkeeping is not free: "the allocator's metadata can also inflate the size of (individually) small allocations." Meanwhile "the memory management system must track outstanding allocations to ensure that they do not overlap and that no memory is ever 'lost' (i.e. that there are no memory leaks)."

One thing worth internalizing early: on a modern system there are two independent allocation layers, not one. "In modern operating systems, the program receives fixed-size pages which it then allocates among different parts of itself (often by an allocator such as [[cs/languages/Cpp/the-allocator-model|malloc]]). As a result, there are two layers of *allocation* that may each result in their own internal and external fragmentation: on the level of the memory allocator (e.g. malloc) and on the level of pages." The kernel fragments page frames; your allocator fragments the pages it was given. Fixing one does nothing for the other.

The cost of the operation is not negligible either. A 1994 Digital Equipment Corporation study of allocator overheads found that "the lowest average instruction path length required to allocate a single memory slot was 52 (as measured with an instruction level profiler on a variety of software)." That is the floor for the best measured allocator in that study, not a typical figure, and it is worth remembering when someone calls malloc "just a pointer bump."

## Internal fragmentation

Internal fragmentation is waste that lives inside a block you were given. "Due to the rules governing memory allocation, more computer memory is sometimes allocated than is needed. When this happens, the excess memory goes to waste. In this scenario, the unusable memory, known as **slack space**, is contained within an allocated region."

Two mechanisms produce it constantly, and both are deliberate:

- Paging. "Memory paging creates internal fragmentation because an entire page frame (typically 4 to 64 KiB) will be allocated whether or not that much storage is needed."
- [[cs/dsa/memory-allocation|Alignment]]. "malloc and similar allocators tend to provide a degree of *alignment*, so that memory can only be provided to programs in chunks (usually a multiple of 4 bytes). As a result if a program requests perhaps 29 bytes, it will actually get a chunk of 32 bytes."

Neither is a bug. Alignment exists because unaligned access is slow or illegal depending on the architecture, and page granularity exists because tracking memory at byte resolution would cost more in metadata than it saves. Internal fragmentation is the bill for those choices.

## External fragmentation

External fragmentation is waste that lives between blocks. It "arises when free memory is separated into small blocks and is interspersed by allocated memory." The consequence is the ugly one: "although free storage is available, it is effectively unusable because it is divided into pieces that are too small individually to satisfy the demands of the application." The naming is literal, since "the term 'external' refers to the fact that the unusable storage is outside the allocated regions."

It "is a weakness of certain storage allocation algorithms when they fail to order memory used by programs efficiently," which is the polite way of saying your allocation order and your free order did not match.

> [!example] Three blocks, one free
> "Consider a situation wherein a program allocates three continuous blocks of memory and then frees the middle block. The memory allocator can use this free block of memory for future allocations. However, it cannot use this block if the memory to be allocated is larger in size than this free block."
>
> Blocks A, B, and C each of size `0x1000` sit contiguously. Free B, and per the article's own table, "the memory that B used cannot be included for a block larger than B's size." Move C down into B's slot and the story changes: that relocation allows "the remaining space to be used for a larger block of size `0x4000`." The free bytes never changed. Only their arrangement did, and arrangement is the whole game.

There is a standard way to put a number on it. External fragmentation is defined as one minus the ratio of the largest free block to total free memory. "Fragmentation of 0% means that all the free memory is in a single large block; fragmentation is 90% (for example) when 100 MB of free memory is present but the largest free block of memory for storage is just 10 MB."

## Why external fragmentation kills and internal fragmentation only taxes

"The most severe problem caused by fragmentation is causing a process or system to fail due to premature resource exhaustion: if a contiguous block must be stored and cannot be stored, failure occurs. Fragmentation causes this to occur even if there is enough of the resource, but not a *contiguous* amount." The article's example is stark: "if a computer has 4 GiB of memory and 2 GiB are free, but the memory is fragmented in an alternating sequence of 1 MiB used, 1 MiB free, then a request for 1 contiguous GiB of memory cannot be satisfied even though 2 GiB total are free."

The escape hatch is expensive. Rather than failing, "the allocator may... trigger a defragmentation (or memory compaction cycle) or other resource reclamation, such as a major [[cs/pl/garbage-collection-concepts|garbage collection]] cycle, in the hope that it will then be able to satisfy the request. This allows the process to proceed, but can severely impact performance."

And even short of failure, fragmentation degrades things quietly. "Fragmentation increases the work required to allocate and access a resource." If free memory is unfragmented, "allocation requests can simply be satisfied by returning a single block from the start of the free area." If it is fragmented, "the request requires either searching for a large enough free block, which may take a long time, or fulfilling the request by several smaller blocks (if this is possible), which results in this allocation being fragmented, and requiring additional overhead to manage the several pieces."

The subtlest cost is one people rarely connect to allocation at all. "Fragmentation may prematurely exhaust a cache, causing thrashing, due to caches holding blocks, not individual data." Take a program with a 256 KiB working set on a machine with a 256 KiB L2 and 64 TLB entries covering 4 KiB pages each. "If the working set is unfragmented, then it will fit onto exactly 64 pages... and all memory lookups can be served from cache. However, if the working set is fragmented, then it will not fit into 64 pages, and execution will slow due to thrashing: pages will be repeatedly added and removed from the TLB during operation." The conclusion drawn from this is a design rule: "cache sizing in system design must include a margin to account for fragmentation." The same bytes, spread differently, blow past your [[cs/systems/memory-hierarchy-and-caching|cache]] budget.

Weighed against all that, the article's own verdict on internal fragmentation is dismissive: "compared to external fragmentation, overhead and internal fragmentation account for little loss in terms of wasted memory and reduced performance."

## Strategies

Each of these is a different answer to the same question, and each buys its property by paying in the other currency.

**Fixed-size blocks (memory pools).** This approach "uses a free list of fixed-size blocks of memory (often all of the same size). This works well for simple embedded systems where no large objects need to be allocated but suffers from fragmentation especially with long memory addresses. However, due to the significantly reduced overhead, this method can substantially improve performance for objects that need frequent allocation and deallocation, and so it is often used in video games." Every allocation is O(1) because there is nothing to search.

**Buddy allocation.** Memory is divided "into several pools of memory instead of just one, where each pool represents blocks of memory of a certain power of two in size." When a request is too big for the available small blocks, "the smallest available size is selected and split. When a block is split, it is divided into two smaller blocks, and each smaller block becomes a unique 'buddy' to the other." Freeing runs the process backward: "when a block is freed, it is compared to its buddy. If they are both free, they are combined and placed in the correspondingly larger-sized buddy-block list."

The power-of-two constraint is what makes the whole thing cheap. "Power-of-two block sizes make address computation simple, because all buddies are aligned on memory address boundaries that are powers of two," and finding a buddy is a single operation: "the address of a block's 'buddy' is equal to the bitwise exclusive OR (XOR) of the block's address and the block's size." Coalescing is bounded, with "the maximal number of compactions required equal to O(highest order) = O(log2(total memory size))."

The result is a system with "little external fragmentation," which "allows for compaction of memory with little overhead." The bill lands exactly where the trade predicts: "there still exists the problem of internal fragmentation, memory wasted because the memory requested is a little larger than a small block, but a lot smaller than a large block. Because of the way the buddy memory allocation technique works, a program that requests 66 K of memory would be allocated 128 K, which results in a waste of 62 K of memory." Nearly half the block, thrown away, to keep the free list clean.

The buddy system is old and still current. Knuth attributes its invention to Harry Markowitz in 1963, "first described by Kenneth C. Knowlton (published 1965)." Today, "the Linux kernel also uses the buddy system, with further modifications to minimise external fragmentation, along with various other allocators to manage the memory within blocks," and `jemalloc` "is a modern memory allocator that employs, among others, the buddy technique."

**Slab allocation.** The standard fix for buddy's internal waste. Slab allocation "preallocates memory chunks suitable to fit objects of a certain type or size. These chunks are called caches and the allocator only has to keep track of a list of free cache slots." Since "any open slot will suffice," there is "no need to search for a suitable portion of memory," and the technique "alleviates memory fragmentation." Layering is the intended usage: slab "may be layered on top of the more coarse buddy allocator to provide more fine-grained allocation."

## The page-level escape

There is one recovery route available to the OS that a user-space allocator does not have. "External fragmentation on the page level can also be reclaimed by the operating system by moving pages in the physical address space and editing the page table to match. This is called *page migration*. The application is oblivious to the process because the virtual memory addresses remain unchanged."

This is [[cs/systems/virtual-memory|virtual memory]] doing something no heap allocator can do, and the reason is instructive. A `malloc` implementation cannot move a live allocation, because the program is holding raw pointers to it. The kernel can move a physical page freely, because the program only ever holds a virtual address. Indirection is what makes compaction legal.

> [!warning] Files fragment differently
> The intuition from RAM does not transfer to storage. "External fragmentation tends to be less of a problem in file systems than in primary memory (RAM) storage systems, because programs usually require their RAM storage requests to be fulfilled with contiguous blocks, but file systems typically are designed to be able to use any collection of available blocks (fragments) to assemble a file which logically appears contiguous." A fragmented [[cs/systems/file-systems|file system]] gets slow, since "on a hard drive or tape drive, sequential data reads are very fast, but seeking to a different address is slow, so reading or writing a fragmented file requires numerous seeks." A fragmented heap gets a failed allocation. Slow and dead are different outcomes.

## Related Notes

- [[cs/systems/virtual-memory|Virtual Memory]] - the page layer beneath the allocator, and the indirection that makes page migration possible
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - why a fragmented working set blows the cache and TLB budget
- [[cs/systems/file-systems|File Systems]] - the other allocator, with different contiguity requirements
- [[cs/dsa/memory-allocation|Memory Allocation]] - the data-structures view of static, stack, and heap allocation
- [[cs/security/use-after-free-and-heap-exploitation|Use-After-Free and Heap Exploitation]] - what happens when allocator metadata becomes an attack surface

## Sources

- "Fragmentation (computing)," Wikipedia. https://en.wikipedia.org/wiki/Fragmentation_%28computing%29 . Backs the internal/external definitions, slack space, the paging and alignment causes with the 29-to-32-byte example, the two-layer (malloc and page) allocation structure, the three-block A/B/C worked example, the external-fragmentation percentage formula and the 100 MB / 10 MB illustration, the storage-failure argument with the 4 GiB alternating-1-MiB example, compaction as an expensive escape, the performance-degradation and cache/TLB thrashing analysis, page migration, and the file-system contrast.
- "Memory management," Wikipedia. https://en.wikipedia.org/wiki/Memory_management . Backs the description of the heap and the malloc/free pair, allocator metadata inflating small allocations and the leak-tracking requirement, the 1994 DEC study's lowest measured average instruction path length of 52, and the descriptions of fixed-size block (memory pool), buddy block, and slab allocation.
- "Buddy memory allocation," Wikipedia. https://en.wikipedia.org/wiki/Buddy_memory_allocation . Backs the power-of-two order scheme and buddy-alignment rationale, the XOR buddy-address trick, the O(log2(total memory size)) coalescing bound, the low-external-fragmentation result, the 66 K request wasting 62 K internal-fragmentation example, slab layering as the fix, the Markowitz 1963 / Knowlton 1965 attribution, and the Linux kernel and jemalloc usage.
