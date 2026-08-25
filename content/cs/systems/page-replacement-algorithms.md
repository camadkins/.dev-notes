---
title: Page Replacement Algorithms
description: "FIFO, clock, and LRU as approximations of an oracle you cannot build, and the anomaly that showed more memory can mean more faults."
draft: false
comments: true
tags:
  - cs
  - systems
  - memory
date: 2026-06-14
updated:
aliases:
  - Belady's Anomaly
  - Clock Algorithm
---

Physical memory is full, a process touches a page that is not resident, and the operating system has to throw something out to make room. Which one? Every answer to that question is a guess about the future made from evidence about the past, and the quality of the guess is measured in wall-clock time, since "when the page that was selected for replacement and paged out is referenced again it has to be paged in (read in from disk), and this involves waiting for I/O completion. This determines the *quality* of the page replacement algorithm: the less time waiting for page-ins, the better the algorithm."

> [!note] The idea
> The optimal policy is known exactly and is unimplementable, which is the useful fact. Because OPT exists as a definition, every practical algorithm can be scored against a fixed ceiling instead of only against its rivals, and the design problem becomes narrow: approximate "farthest next use" using only the reference and dirty bits the hardware happens to set for free. Clock and LRU are not clever heuristics that happened to work. They are cheap estimators of a quantity nobody can measure.

## The setup

Page replacement fires "when a requested page is not in memory (page fault) and a free page cannot be used to satisfy the allocation, either because there are none, or because the number of free pages is lower than some threshold." The algorithm then "looks at the limited information about accesses to the pages provided by hardware, and tries to guess which pages should be replaced to minimize the total number of page misses, while balancing this with the costs (primary storage and processor time) of the algorithm itself."

That limited information is specific and worth naming, because it constrains every algorithm below. "In most architectures the page table holds an 'access' bit and a 'dirty' bit for each page in the page table. The CPU sets the access bit when the process reads or writes memory in that page. The CPU sets the dirty bit when the process writes memory in that page." Two bits per page, set by hardware, cleared by the OS. That is the entire sensor array.

There is a second sampling technique with a very different cost profile. The OS can detect access "by removing pages from the process' page table without necessarily removing them from physical memory. The next access to that page is detected immediately because it causes a page fault. This is slow because a page fault involves a context switch to the OS, software lookup for the corresponding physical address, modification of the page table and a context switch back to the process and accurate because the access is detected immediately after it occurs." Scanning the access bit, by contrast, "is fast because the access bit is set automatically by the CPU and inaccurate because the OS does not immediately receive notice of the access nor does it have information about the order in which the process accessed these pages."

Accurate and slow, or fast and blurry. Every algorithm below lives somewhere on that line.

One orthogonal choice before the algorithms: scope. "When a process incurs a page fault, a local page replacement algorithm selects for replacement some page that belongs to that same process," while "a global replacement algorithm is free to select any page in memory." The trade is stated plainly: "the advantage of local page replacement is its scalability: each process can handle its page faults independently, leading to more consistent performance for that process. However global page replacement is more efficient on an overall system basis." Predictability per process, or throughput per machine.

## OPT, the bound

The theoretically optimal algorithm, "also known as OPT, clairvoyant replacement algorithm, or Bélády's optimal page replacement policy," is one sentence long: "when a page needs to be swapped in, the operating system swaps out the page whose next use will occur farthest in the future. For example, a page that is not going to be used for the next 6 seconds will be swapped out over a page that is going to be used within the next 0.4 seconds."

It "cannot be implemented in a general purpose operating system because it is impossible to compute reliably how long it will be before a page is going to be used." The stated exceptions are narrow: unless "all software that will run on a system is either known beforehand and is amenable to static analysis of its memory reference patterns, or only a class of applications allowing run-time analysis."

The escape hatch is profile-guided rather than clairvoyant. Algorithms exist "that can offer near-optimal performance: the operating system keeps track of all pages referenced by the program, and it uses those data to decide which pages to swap in and out on subsequent runs." The two caveats are the interesting part, since near-optimal performance is available "but not on the first run of a program, and only if the program's memory reference pattern is relatively consistent each time it runs."

Use OPT the way it is meant to be used: as a yardstick, not a candidate.

## FIFO

"The simplest page-replacement algorithm is a FIFO algorithm," and it "is a low-overhead algorithm that requires little bookkeeping on the part of the operating system. The idea is obvious from the name: the operating system keeps track of all the pages in memory in a [[cs/dsa/queue|queue]], with the most recent arrival at the back, and the oldest arrival in front. When a page needs to be replaced, the page at the front of the queue (the oldest page) is selected."

The verdict is blunt. "While FIFO is cheap and intuitive, it performs poorly in practical application. Thus, it is rarely used in its unmodified form." Its failure mode is obvious in retrospect: age since arrival has no relationship to probability of future use. A page loaded at boot and read on every single instruction is exactly as old as one loaded at boot and never touched again.

It does appear in production, though in a hardened form. "FIFO page replacement algorithm is used by the OpenVMS operating system, with some modifications. Partial second chance is provided by skipping a limited number of entries with valid translation table references, and additionally, pages are displaced from process working set to a systemwide pool from which they can be recovered if not already re-used."

## Second-chance and clock

Second-chance is FIFO plus one bit of evidence. It "works by looking at the front of the queue as FIFO does, but instead of immediately paging out that page, it checks to see if its referenced bit is set. If it is not set, the page is swapped out. Otherwise, the referenced bit is cleared, the page is inserted at the back of the queue (as if it were a new page) and this process is repeated." The rationale is the one-line intuition the whole family rests on: "an old page that has been referenced is probably in use, and should not be swapped out over a new page that has not been referenced."

Two boundary behaviors define its range. "If all the pages have their referenced bit set, on the second encounter of the first page in the list, that page will be swapped out, as it now has its referenced bit cleared." And "if all the pages have their reference bit cleared, then second chance algorithm degenerates into pure FIFO." Perfect information and zero information both collapse it to the thing it was trying to improve on.

Clock is the same policy with the data structure fixed. It "is a more efficient version of FIFO than Second-chance because pages don't have to be constantly pushed to the back of the list, but it performs the same general function as Second-Chance. The clock algorithm keeps a [[cs/dsa/circular-linked-list|circular list]] of pages in memory, with the 'hand' (iterator) pointing to the last examined page frame in the list. When a page fault occurs and no empty frames exist, then the R (referenced) bit is inspected at the hand's location. If R is 0, the new page is put in place of the page the 'hand' points to, and the hand is advanced one position. Otherwise, the R bit is cleared, then the clock hand is incremented and the process is repeated until a page is replaced."

Nothing moves. Only a pointer advances. This algorithm "was first described in 1969 by [[cs/military-computing/multics-and-time-sharing-foundations|Fernando J. Corbató]]," and the reason it survives is right there in the description: one bit inspection and one hand increment per candidate, no list surgery at all.

## LRU

LRU "works on the idea that pages that have been most heavily used in the past few instructions are most likely to be used heavily in the next few instructions too." It differs from the coarser not-recently-used policy in resolution: "LRU keeps track of page usage over a short period of time, while NRU just looks at the usage in the last clock interval."

The theory is good and the implementation is the problem. "While LRU can provide near-optimal performance in theory (almost as good as adaptive replacement cache), it is rather expensive to implement in practice."

Two exact implementations, both unaffordable:

- Linked list. "At the back of this list is the least recently used page, and at the front is the most recently used page. The cost of this implementation lies in the fact that items in the list will have to be moved about every memory reference, which is a very time-consuming process."
- Hardware counter. "Suppose the hardware has a 64-bit counter that is incremented at every instruction. Whenever a page is accessed, it acquires the value equal to the counter at the time of page access. Whenever a page needs to be replaced, the operating system selects the page with the lowest counter and swaps it out."

Both are correct. Both put work on the critical path of every single memory reference, which is why clock exists.

LRU does come with a guarantee, and it is the reason LRU is the reference point rather than merely a popular choice: "it has been proven, for example, that LRU can never result in more than N-times more page faults than OPT algorithm, where N is proportional to the number of pages in the managed pool."

> [!warning] The loop that defeats LRU
> "LRU's weakness is that its performance tends to degenerate under many quite common reference patterns. For example, if there are N pages in the LRU pool, an application executing a loop over array of N + 1 pages will cause a page fault on each and every access." Every page is evicted precisely one step before it is needed again. One page over the line takes the hit rate from near-total to zero. "As loops over large arrays are common, much effort has been put into modifying LRU to work better in such situations. Many of the proposed LRU modifications try to detect looping reference patterns and to switch into suitable replacement algorithm, like Most Recently Used (MRU)."
>
> Random replacement, for all its crudeness, "eliminates the overhead cost of tracking page references. Usually it fares better than FIFO, and for looping memory references it is better than LRU, although generally LRU performs better in practice." OS/390 leans on exactly this: it "uses global LRU approximation and falls back to random replacement when LRU performance degenerates."

## Bélády's anomaly

Here is the result that broke an assumption everyone held. "Bélády's anomaly is the phenomenon in which increasing the number of page frames results in an increase in the number of page faults for certain memory access patterns. This phenomenon is commonly experienced when using the first-in first-out (FIFO) page replacement algorithm." László Bélády demonstrated it in 1969.

The prior belief was explicit and reasonable: "until Bélády's anomaly was demonstrated, it was believed that an increase in the number of page frames would always result in the same number of, or fewer, page faults." Buying RAM should not make things worse. For FIFO, sometimes it does.

> [!example] Nine faults with three frames, ten with four
> The reference string is `3 2 1 0 3 2 4 3 2 1 0 4`. Run it under FIFO and, in the article's own summary of its worked tables: "Using three page frames, nine page faults occur. Increasing to four page frames causes ten page faults to occur."
>
> Trace it and the reason is visible: FIFO evicts strictly by arrival order, so adding a frame changes which pages are resident at each step, which changes arrival order, which changes every eviction downstream. The two runs are not nested versions of each other. They are different runs.

Which algorithms are immune is stated directly. "In FIFO, the page fault may or may not increase as the page frames increase, but in optimal and stack-based algorithms like Least Recently Used (LRU), as the page frames increase, the page fault decreases." Being a stack algorithm is the property that buys monotonicity, and FIFO does not have it.

The severity was underestimated at first. "Bélády, Nelson and Shedler constructed reference strings for which the FIFO page replacement algorithm produced nearly twice as many page faults in a larger memory than in a smaller one and they conjectured that 2 is a general bound." That conjecture stood for four decades. "In 2010, Fornai and Iványi showed that the anomaly is in fact unbounded and that one can construct a reference string to any arbitrary page fault ratio."

There is no bound. FIFO can be made arbitrarily worse by giving it more memory.

## What runs in practice

| Policy | Evidence used | Cost | Anomaly-free |
|--------|--------------|------|--------------|
| OPT | future references | unimplementable | yes (stated for optimal algorithms) |
| FIFO | arrival order | lowest | no |
| Second-chance / Clock | reference bit | one bit test per candidate | not stated |
| LRU (exact) | full recency order | work on every memory reference | yes (stack algorithm) |
| Random | none | none | not stated |

Linux does not pick one row. Its "pages in the page cache are divided in an 'active' set and an 'inactive' set. Both sets keep a LRU list of pages. In the basic case, when a page is accessed by a user-space program it is put in the head of the inactive set. When it is accessed repeatedly, it is moved to the active list." Demotion is deliberate and two-staged: "when a page is moved to the inactive set it is removed from the page table of any process address space, without being paged out of physical memory," and only "when a page is removed from the inactive set, it is paged out of physical memory." That intermediate state is a free re-reference test, catching a page that still matters before it costs a disk write. The lists are observable in `/proc/meminfo` under "Active", "Inactive", and their anon and file variants.

Worth noting that the modern kernel does not treat this as a [[cs/systems/virtual-memory|virtual memory]] problem in isolation. "Most modern OS kernels have unified virtual memory and file system caches, requiring the page replacement algorithm to select a page from among the pages of both user program virtual address spaces and cached files," so "page replacement in modern kernels (Linux, FreeBSD, and Solaris) tends to work at the level of a general purpose kernel memory allocator, rather than at the higher level of a virtual memory subsystem."

> [!tip]
> The reason 1960s research on this quieted down and then restarted is instructive. It "mostly ended with the development of sophisticated LRU approximations and working set algorithms," but hardware moved: primary storage grew "by multiple orders of magnitude," so "algorithms that require a periodic check of each and every memory frame are becoming less and less practical," and software locality "has weakened," attributed partly to object-oriented styles favoring "large numbers of small functions," to trees and hash tables that "tend to result in chaotic memory reference patterns," and to garbage collection. An algorithm tuned to a 1975 machine is not tuned to yours.

## Related Notes

- [[cs/systems/virtual-memory|Virtual Memory]] - the paging machinery whose eviction decision this note is about
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - the same replacement question one level up, in silicon
- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] - why modern kernels handle replacement at the allocator level
- [[cs/systems/process-scheduling-algorithms|Process Scheduling Algorithms]] - the other classic OS policy problem with an unimplementable optimum
- [[cs/systems/file-systems|File Systems]] - the file cache that modern kernels unified with the page cache

## Sources

- "Page replacement algorithm," Wikipedia. https://en.wikipedia.org/wiki/Page_replacement_algorithm . Backs the trigger condition for replacement and the quality criterion, the access/dirty bit mechanism and the two detection techniques with their speed/accuracy trade, local versus global replacement, the OPT definition and its unimplementability plus the profile-guided near-optimal caveat, FIFO's description and poor practical performance and OpenVMS usage, second-chance and its two degenerate cases, clock's circular list and 1969 Corbató attribution, LRU's premise and its linked-list and counter implementations, the N-times-OPT bound, the N+1 loop weakness and MRU response, random replacement and OS/390's fallback, the Linux active/inactive page cache mechanics, the unified VM and file-system cache in modern kernels, and the history of hardware and software trends that revived the research.
- "Bélády's anomaly," Wikipedia. https://en.wikipedia.org/wiki/B%C3%A9l%C3%A1dy%27s_anomaly . Backs the anomaly definition and its association with FIFO, the 1969 Bélády demonstration, the prior belief that more frames never increases faults, the worked reference string with nine faults at three frames and ten at four, the contrast with optimal and stack-based algorithms like LRU, the Bélády/Nelson/Shedler nearly-twice result and their conjectured bound of 2, and the 2010 Fornai and Iványi result that the anomaly is unbounded.
