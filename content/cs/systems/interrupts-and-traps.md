---
title: Interrupts and Traps
description: "Hardware interrupts, software traps, and exceptions all divert the CPU to a handler through the interrupt vector table. What separates them is only where the signal comes from."
draft: false
comments: true
tags:
  - cs
  - systems
  - computer-architecture
date: 2026-04-03
updated:
aliases:
  - Interrupts
  - Traps and Exceptions
  - Interrupt Handling
---

A CPU running a program is single-minded: it fetches the next instruction, executes it, repeats. Interrupts are the mechanism that lets the outside world, and the program's own mistakes, break into that loop. Without them the processor would have to poll every device in a busy wait to notice anything, wasting the cycles it spends asking "anything yet?"

An interrupt is "a request for the processor to interrupt currently executing code (when permitted), so that the event can be processed in a timely manner. If the request is accepted, the processor will suspend its current activities, save its state, and execute a function called an interrupt handler (or an interrupt service routine, ISR) to deal with the event." Handle it, then resume where you left off, as if nothing happened.

> [!note] The idea
> Hardware interrupts, software traps, and exceptions are not three different mechanisms. They are one mechanism (suspend, save state, jump to a handler) fired by three different sources: a device outside the CPU, an instruction the program ran on purpose, or an error the program hit by accident. Sorting them by source is the whole taxonomy.

## The one mechanism

Whatever the trigger, the hardware does the same dance. It finishes or suspends the current instruction at a clean boundary, saves enough state to return, looks up the handler's address, and jumps there. Hardware interrupts are asynchronous, they can arrive "at any time during instruction execution," so incoming signals are synchronized to the processor clock and "acted upon only at instruction execution boundaries." The CPU never stops mid-instruction; it stops between instructions.

## Sorting by source

**Hardware interrupts** come from outside the processor. A hardware interrupt is "a condition related to the state of the hardware that may be signaled by an external hardware device," a disk finishing a read, a network packet arriving, a timer firing, a key being pressed. These are asynchronous: they bear no relation to what the program was doing when they hit. The periodic timer interrupt is the one that makes preemptive [[process-scheduling-algorithms|scheduling]] possible, it is what lets the OS reliably take the CPU back from a running process.

Some hardware interrupts can be temporarily disabled by setting an interrupt mask; those are maskable. A few cannot: "Some interrupt signals are not affected by the interrupt mask and therefore cannot be disabled; these are called non-maskable interrupts (NMIs). These indicate high-priority events which cannot be ignored under any circumstances."

**Software interrupts (traps)** are raised by the processor itself while executing instructions. "A software interrupt is requested by the processor itself upon executing particular instructions or when certain conditions are met." The intentional kind is a program deliberately executing a special instruction to invoke a handler: "Such instructions function similarly to subroutine calls and are used for a variety of purposes, such as requesting operating system services and interacting with device drivers." This is exactly the trap a [[system-calls-and-the-kernel-boundary|system call]] uses to cross into the kernel.

**Exceptions** are the unintentional software interrupts: the ones "triggered by program execution errors or by the virtual memory system." A divide-by-zero, an invalid memory access, or a page fault all raise one. Some are fatal to the program, surfacing as errors like an access violation. Others are handled invisibly, "the normal resolution of a page fault is to make the required page accessible in physical memory" and quietly restart the instruction, which is how [[virtual-memory|demand paging]] works.

## The interrupt vector table

When a signal arrives, how does the CPU find the right handler? Through a lookup table. The interrupt vector table (IVT) is "a data structure that associates a list of interrupt handlers with a list of interrupt requests in a table of interrupt vectors. Each entry of the interrupt vector table, called an interrupt vector, is the address of an interrupt handler." Each interrupt type carries a number; that number indexes the table; the table entry is the address the CPU jumps to. Nearly every processor has one, "including chips from Intel, AMD, Infineon, Microchip Atmel, NXP, ARM."

> [!example]
> Trace a keystroke on a running machine.
> 1. You press a key. The keyboard controller asserts a hardware interrupt line.
> 2. The CPU finishes its current instruction, then accepts the request at the instruction boundary.
> 3. It saves the interrupted program's state and reads the interrupt's number.
> 4. It indexes the IVT with that number and jumps to the keyboard ISR's address.
> 5. The ISR reads the scancode, buffers it, and acknowledges the controller.
> 6. State is restored and the interrupted program resumes, none the wiser.
>
> A page fault would run the same steps 2 through 6; only step 1 differs, an internal exception instead of an external device.

## Related Notes

- [[system-calls-and-the-kernel-boundary|System Calls and the Kernel Boundary]] - the intentional software trap that raises privilege and enters the kernel
- [[process-scheduling-algorithms|Process Scheduling Algorithms]] - the timer hardware interrupt is what makes preemption possible
- [[virtual-memory|Virtual Memory]] - the page fault is an exception the OS resolves by loading the missing page

## Sources

- "Interrupt," Wikipedia. https://en.wikipedia.org/wiki/Interrupt . Backs the definition of an interrupt (suspend, save state, run an ISR), the asynchronous hardware interrupt acted on at instruction boundaries, hardware interrupts as external device conditions, maskable versus non-maskable interrupts, software interrupts requested by the processor on executing particular instructions and functioning like subroutine calls for OS services, and exceptions triggered by execution errors or the virtual memory system with the page-fault resolution example.
- "Interrupt vector table," Wikipedia. https://en.wikipedia.org/wiki/Interrupt_vector_table . Backs the IVT as a table associating interrupt handlers with interrupt requests, each vector being the address of an ISR, and its presence across Intel, AMD, Infineon, Microchip Atmel, NXP, and ARM processors.
