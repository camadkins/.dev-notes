---
title: Virtual Memory
description: Address spaces, paging, page tables, and the TLB - how the OS gives each process the illusion of a private, contiguous memory.
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-03-12
updated:
aliases: []
---

## The Big Idea

Every process thinks it owns a huge, private, contiguous chunk of memory starting at address zero. None of that is true. Physical RAM is shared, fragmented, and often smaller than what all running programs collectively need. Virtual memory is the OS + hardware conspiracy that maintains this illusion, and once you understand it, a lot of other systems concepts (process isolation, `fork`, `mmap`, why your program got OOM-killed) suddenly click.

> [!note]
> Virtual memory does three things at once: **translation** (virtual addresses to physical), **isolation** (processes can't touch each other's memory), and **overcommit** (you can allocate more memory than physically exists, and the OS pages things in and out as needed).

---

## Address Spaces and Pages

Each process gets a virtual address space (typically 48-bit on x86-64, giving 256 TB). The space is divided into fixed-size **pages** (commonly 4 KB). Physical memory is divided into **frames** of the same size. The page table maps between them.

```
Virtual address:  [ VPN (high bits) | Offset (low 12 bits) ]
                        |
                   page table
                        |
                        v
Physical address: [ PFN           | Offset (same 12 bits) ]
```

The offset stays the same on both sides. Only the page/frame number gets translated. This is clean and simple, but a flat page table for 48-bit addresses would be enormous, which is why real systems use multi-level page tables.

---

## Multi-Level Page Tables

Modern x86-64 uses 4-level (sometimes 5-level) page table hierarchies. The trick: only allocate table pages for regions the process actually uses. A process with a small heap and stack might only need a handful of page table pages, even though it technically has a 256 TB address space. This makes sparse address spaces cheap.

> [!tip]
> This is one of those things that sounds obvious once you see it, but took me a while to internalize: the page table itself lives in memory and can be paged. The multi-level structure means you're only paying memory costs for the parts of the address space you actually touch.

---

## The TLB

The **Translation Lookaside Buffer** is a small, fast hardware cache of recent virtual-to-physical translations. This is critical for performance because every single memory access needs address translation.

- TLB hit: 1-2 cycles
- TLB miss: triggers a multi-level page-table walk (tens to hundreds of cycles)

Context switches flush or tag the TLB, which is a big part of why context switches are expensive. It's not the register save/restore that hurts; it's the cold TLB afterwards.

> [!warning]
> TLB capacity is limited (typically a few hundred to a few thousand entries). A 4 KB page size means each TLB entry covers only 4 KB. If your working set is 1 GB, you'd need 262,144 entries, far more than any TLB holds. This is where huge pages help.

---

## Demand Paging and Page Faults

Pages don't need to be in RAM when a process starts. When a process touches an absent page, the MMU raises a **page fault**, the OS loads the page from disk (or zero-fills it), updates the page table, and restarts the instruction. This lets the OS overcommit memory and prioritize active pages.

This is also how memory-mapped files work: `mmap` a file, and pages get faulted in from disk on first access. The process reads memory addresses; the OS transparently handles the I/O.

## Page Replacement

When RAM is full and something needs to be paged in, the OS has to evict something. The choice of what to evict matters a lot:

| Policy | Idea | Weakness |
|--------|------|----------|
| FIFO | Evict oldest page | Suffers from Belady's anomaly |
| LRU | Evict least-recently-used page | Expensive to track exactly; approximated in practice |
| Clock (Second Chance) | Circular scan with reference bits | Simple, good approximation of LRU |

> [!note]
> In practice, Linux uses a variant of Clock/LRU with active and inactive lists. True LRU would require updating a data structure on every memory access, which is way too expensive. The approximation works well enough.

---

## Copy-on-Write

After `fork`, parent and child share the same physical pages, all marked read-only. A write triggers a fault; the OS copies just that page and gives the writer its own copy. This makes `fork` fast even for large processes, because most of the address space is never written by the child (especially if it immediately calls `exec`).

---

## Huge Pages

Standard 4 KB pages with a 1 GB working set require 262,144 TLB entries. **Huge pages** (2 MB or 1 GB on x86-64) reduce TLB pressure by covering more memory per entry, at the cost of higher internal fragmentation. Linux exposes them via `mmap` with `MAP_HUGETLB` or transparently via THP (Transparent Huge Pages).

> [!tip]
> Databases and JVMs often benefit significantly from huge pages because they have large, long-lived working sets. If you see TLB miss rates dominating your performance profile, huge pages are worth trying.

---

## Thrashing

When the working set exceeds physical memory, the system **thrashes**: spending more time swapping pages to and from disk than actually executing instructions. The classic symptom is disk I/O pegged at 100% with CPU utilization paradoxically low. The machine feels completely stuck even though the CPU is barely doing useful work.

Solutions: add RAM, reduce the working set, or use memory-aware scheduling.

---

## Address Space Layout

A typical Linux x86-64 process layout:

```
High addresses
  ┌──────────────────┐
  │  Kernel space     │  (upper half, inaccessible to user code)
  ├──────────────────┤
  │  Stack  ↓         │  (grows downward)
  │                    │
  │  Memory-mapped     │  (shared libraries, mmap regions)
  │                    │
  │  Heap  ↑           │  (grows upward via brk/sbrk)
  ├──────────────────┤
  │  BSS (uninitialized)│
  │  Data (initialized) │
  │  Text (code)       │
  └──────────────────┘
Low addresses
```

> [!note]
> ASLR (Address Space Layout Randomization) shuffles the base addresses of the stack, heap, and mmap regions on each execution. This is a security measure against exploits that depend on knowing where things live in memory.

---

## Walkthrough: Translating an Address

A process accesses virtual address `0x00007f3a_bc123456`:

1. **Split**: VPN = `0x7f3abc123`, offset = `0x456`.
2. **TLB lookup**: check for VPN `0x7f3abc123`. Assume a miss.
3. **Page-table walk**: traverse 4 levels of the page table using bits from the VPN as indexes at each level. Find PFN = `0xDEAD`.
4. **TLB fill**: cache the mapping `0x7f3abc123 -> 0xDEAD`.
5. **Physical access**: read from physical address `0xDEAD_456`.

On subsequent accesses to the same page, the TLB hits and the translation costs 1-2 cycles instead of ~100.

## Related Notes

- [[memory-allocation|Memory Allocation]] - how user-space allocators (malloc, arenas) work on top of virtual memory
- [[processes-and-threads|Processes & Threads]] - virtual memory provides the isolation between processes
- [[file-systems|File Systems]] - memory-mapped files bridge virtual memory and the file system
