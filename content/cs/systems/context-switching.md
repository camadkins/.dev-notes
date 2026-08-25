---
title: Context Switching
description: "Saving and restoring process state through the process control block, and why the real cost is not the register copy but the cold cache and flushed TLB left behind."
draft: false
comments: true
tags:
  - cs
  - systems
  - computer-architecture
date: 2026-01-22
updated:
aliases:
  - Context Switch
---

Every time the OS takes the CPU away from one process and hands it to another, it has to perform an act of near-perfect memory: freeze everything the outgoing process was in the middle of, tuck it away, and later restore it so exactly that the process never notices it was paused. That act is the context switch, and it is what makes one CPU look like many.

A context switch is "the process of storing the state of a process or thread, so that it can be restored and resume execution at a later point, and then restoring a different, previously saved, state." Do that fast enough, thousands of times a second, and [[cs/military-computing/multics-and-time-sharing-foundations|hundreds of processes appear to run at once]] on a handful of cores.

> [!note] The idea
> The visible work of a context switch, copying registers in and out, is cheap and bounded. The expensive part is invisible and happens *after* the switch: the incoming process inherits a CPU cache and TLB full of the previous process's data, so it runs slow until it rebuilds its own working set. The switch costs microseconds; the pollution it leaves behind can cost far more.

## What "context" means

The context is the complete snapshot of a running process's CPU state. Concretely that is the general-purpose registers, the stack pointer, the program counter, and (if used) the floating-point and SIMD register file. On a full process switch the OS also changes the page-table base register, which is what gives the incoming process its own [[cs/systems/virtual-memory|virtual address space]].

Where does the saved state live? In the process control block (PCB), also called the process descriptor, "a data structure used by a computer operating system to store all the information about a process." The kernel keeps PCBs in a process table. The PCB tracks the process state (new, ready, running, waiting, terminated), so it "plays a key role in context switching": saving a context means writing the outgoing process's registers into its PCB, and restoring means loading the incoming process's PCB back into the hardware.

## The direct cost

The mechanical part is administration: saving and loading registers and memory maps, flushing and reloading structures, updating tables and lists. Wikipedia notes context switches "are usually computationally intensive, and much of the design of operating systems is to optimize the use of context switches." On modern hardware this direct cost is on the order of microseconds. Real but small.

## The indirect cost

The larger cost does not show up in the switch routine at all. Two hardware caches get poisoned:

- **The CPU cache.** The outgoing process left the cache full of its own data. The incoming process's data is not there, so its first accesses miss and pull from main memory until the cache warms up.
- **The TLB.** On a full process switch the [[cs/systems/virtual-memory|TLB]] "must be flushed. This negatively affects performance because every memory reference to the TLB will be a miss because it is empty after most context switches." Every early memory access now pays a full page-table walk.

This is why thread switches within one process are cheaper than switching between separate processes. Threads "share the same virtual memory maps, so a TLB flush is not necessary." Same reason [[cs/languages/Go/goroutines-and-the-scheduler|green-thread]] and user-level switches are lighter still: they save and restore minimal state and never touch the page tables.

> [!warning]
> "Context switches are expensive" is true but the phrasing hides the cause. The register save/restore is trivial. What hurts is that the new process starts with a cold cache and (across processes) an empty TLB, so it runs at reduced speed until its working set is re-cached. If you shrink the scheduling quantum to force more switches, you pay this rebuild cost more often, which is the real ceiling on how finely you can time-slice.

## Related Notes

- [[cs/systems/processes-and-threads|Processes & Threads]] - the execution units whose state gets saved and restored
- [[cs/systems/virtual-memory|Virtual Memory]] - the TLB and page-table base register that make a process switch heavier than a thread switch
- [[cs/systems/process-scheduling-algorithms|Process Scheduling Algorithms]] - the policies that decide when to pay this cost, and why quantum length is a trade-off

## Sources

- "Context switch," Wikipedia. https://en.wikipedia.org/wiki/Context_switch . Backs the definition of a context switch as storing and restoring process/thread state, that switches are computationally intensive and a target of OS optimization, the TLB flush causing every subsequent TLB reference to miss, that same-process thread switches avoid a TLB flush because they share memory maps, and that green-thread switches are lightweight.
- "Process control block," Wikipedia. https://en.wikipedia.org/wiki/Process_control_block . Backs the PCB as the data structure storing all information about a process, tracking process state, being kept by the kernel in a process table, and playing a key role in context switching.
