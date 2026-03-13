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

## Intuition

Every process believes it owns a huge, contiguous slab of memory starting at address zero. In reality, physical RAM is shared, fragmented, and often smaller than what programs collectively demand. **Virtual memory** is the OS + hardware mechanism that maintains this illusion: it translates virtual addresses to physical addresses on every memory access, loads pages from disk on demand, and isolates processes so one cannot read or corrupt another's data.

## Core Idea

**Address spaces.** Each process has a virtual address space (typically 48-bit on x86-64, giving 256 TB). The space is divided into fixed-size **pages** (commonly 4 KB). Physical memory is divided into **frames** of the same size.

**Page table.** A per-process data structure that maps virtual page numbers (VPN) to physical frame numbers (PFN). Each entry also stores permission bits (read/write/execute), a present/absent bit, and a dirty bit.

```
Virtual address:  [ VPN (high bits) | Offset (low 12 bits) ]
                        |
                   page table
                        |
                        v
Physical address: [ PFN           | Offset (same 12 bits) ]
```

**Multi-level page tables.** A flat page table for 48-bit addresses would be enormous. Modern systems use 4-level (x86-64) or 5-level hierarchies, allocating table pages only for regions the process actually uses. This makes sparse address spaces cheap.

**Translation Lookaside Buffer (TLB).** A small, fast hardware cache of recent VPN-to-PFN translations. TLB hits resolve in 1-2 cycles; TLB misses trigger a multi-level page-table walk (tens to hundreds of cycles). Context switches flush or tag the TLB, adding to their cost.

**Demand paging.** Pages need not be in RAM at process start. When a process touches an absent page, the MMU raises a **page fault**; the OS loads the page from disk (or zero-fills it), updates the page table, and restarts the instruction. This lets the OS over-commit memory and prioritize active pages.

**Page replacement.** When RAM is full, the OS evicts a page. Policies include:

| Policy | Idea | Weakness |
|--------|------|----------|
| FIFO | Evict oldest page | Suffers from Belady's anomaly |
| LRU | Evict least-recently-used page | Expensive to track exactly; approximated in practice |
| Clock (Second Chance) | Circular scan with reference bits | Simple, good approximation of LRU |

**Copy-on-write (COW).** After `fork`, parent and child share the same physical pages marked read-only. A write triggers a fault; the OS copies just that page. This makes `fork` fast even for large processes.

**Huge pages.** Standard 4 KB pages mean a 1 GB working set requires 262,144 TLB entries - far more than most TLBs hold. **Huge pages** (2 MB or 1 GB on x86-64) reduce TLB pressure by covering more memory per entry, at the cost of higher internal fragmentation. Linux exposes them via `mmap` with `MAP_HUGETLB` or transparently via THP (Transparent Huge Pages).

**Swapping and thrashing.** When physical memory is exhausted, the OS pages out (swaps) infrequently used pages to disk. If the working set exceeds physical memory, the system **thrashes** - spending more time swapping than executing. The classic symptom: disk I/O pegged at 100%, CPU utilization paradoxically low. Solutions include adding RAM, reducing the working set, or using memory-aware scheduling.

**Address space layout.** A typical process virtual address space (simplified, Linux x86-64):

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

## Example

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
