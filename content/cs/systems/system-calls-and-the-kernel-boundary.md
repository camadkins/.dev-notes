---
title: "System Calls and the Kernel Boundary"
description: "User mode versus kernel mode, the trap that crosses between them, and why the syscall interface is the one narrow, guarded door through which a program asks the OS for anything."
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-06-11
updated:
aliases: []
---

## One Door In

An application cannot read a file, open a socket, or start another process by itself. It has no authority to touch the disk controller or the network card directly. Everything a program does that reaches outside its own memory happens by asking the operating system to do it. The system call is that request, "the programmatic way in which a computer program requests a service from the operating system on which it is executed."

That restriction is not bureaucracy, it is the entire security model. If any program could poke hardware and other programs' memory at will, isolation would not exist.

> [!note] The idea
> The CPU runs in (at least) two privilege levels, and the boundary between them is enforced in hardware, not by convention. User code cannot simply call into the kernel; it must execute a special instruction that traps, which is the only mechanism that raises privilege and transfers control to the kernel at a fixed, kernel-chosen entry point. The syscall interface is deliberately the single narrow gate through which all of a program's requests for privileged service must pass.

## Two worlds: user space and kernel space

Modern operating systems use [[cs/systems/virtual-memory|virtual memory]] to split memory into two regions. "Kernel space is strictly reserved for running a privileged operating system kernel, kernel extensions, and most device drivers. In contrast, user space is the memory area where application software, daemons, and some drivers execute, typically with one address space per process." Each user process runs in its own space and, "unless explicitly allowed, cannot access the memory of other processes. This is the basis for memory protection."

The hardware backs this with privilege levels. Most processors implement a [[cs/military-computing/multics-and-time-sharing-foundations|rings model]]: "hierarchical levels or layers of privilege," "arranged in a hierarchy from most privileged (most trusted, usually numbered zero) to least privileged." Ring 0 is the kernel and "interacts most directly with the physical hardware." Application code runs in an outer, untrusted ring where privileged instructions are simply not allowed to execute.

## The trap across the boundary

So how does an unprivileged program run privileged code safely? It does not get to jump wherever it likes. It raises a software interrupt, a trap. "An interrupt automatically puts the CPU into some elevated privilege level and then passes control to the kernel, which determines whether the calling program should be granted the requested service."

The sequence is fixed and one-way in the sense that user code never chooses the destination: the program loads a register with the system-call number it wants, executes the trap instruction, and the hardware simultaneously raises privilege and jumps to the kernel's registered handler. As Wikipedia puts it, "Interrupts transfer control to the operating system kernel, so software simply needs to set up some register with the system call number needed, and execute the software interrupt." The kernel, now in ring 0, checks whether the request is allowed, performs it, and drops privilege back to user mode on return. The [[cs/systems/interrupts-and-traps|interrupt and trap]] machinery is the same mechanism that hardware devices use to get attention; a syscall is just a trap the program raises on purpose.

## The interface programs actually see

Almost no one writes the raw trap instruction by hand. Systems "provide a library or API that sits between normal programs and the operating system." On Unix-like systems that layer is [[cs/languages/common/c-abi-and-ffi|the C library]]: "On Unix-like systems, that API is usually part of an implementation of the C library (libc), such as glibc, that provides wrapper functions for the system calls, often named the same as the system calls they invoke." So a C program calls `read()`, a normal-looking function, and inside that wrapper is the register setup and the trap. On Windows NT the equivalent layer lives in ntdll.dll's Native API.

> [!warning]
> The wrapper looks like an ordinary function call, and the "call" into libc is exactly that. But the real transition, the moment control actually enters the kernel, is the trap inside the wrapper, and it is "more implementation-dependent and platform-dependent" than a normal subroutine call. Conflating the C function `read()` with the kernel `read` syscall hides where the privilege boundary actually gets crossed. The function is user code; the trap is the crossing.

## Why the narrow gate matters

Funneling every privileged request through a small, numbered set of entry points is what makes the boundary defensible. The kernel validates every crossing, so a [[cs/security/sandboxing-and-isolation|sandbox]] can restrict a process simply by filtering which system calls it is allowed to make. The syscall table is the complete list of things a program can ask the OS to do; controlling that list controls the program.

## Related Notes

- [[cs/systems/interrupts-and-traps|Interrupts and Traps]] - the trap mechanism a syscall rides on, shared with hardware interrupts and exceptions
- [[cs/systems/virtual-memory|Virtual Memory]] - the address-space split that separates user space from kernel space
- [[cs/systems/processes-and-threads|Processes & Threads]] - processes are created and managed through system calls like fork and exec
- [[cs/security/sandboxing-and-isolation|Sandboxing and Isolation]] - restricting a process by filtering the system calls it may issue

## Sources

- "System call," Wikipedia. https://en.wikipedia.org/wiki/System_call . Backs the definition of a system call, that syscalls are usually initiated via interrupts that raise privilege and pass control to the kernel to check the request, the register-plus-software-interrupt sequence, the libc wrapper functions named after the syscalls, the Windows NT ntdll Native API, and that the actual transfer to the kernel is more implementation- and platform-dependent than a normal subroutine call.
- "User space and kernel space," Wikipedia. https://en.wikipedia.org/wiki/User_space_and_kernel_space . Backs the split of memory into kernel space (privileged kernel, extensions, drivers) and user space (applications, one address space per process), and that a process cannot access other processes' memory, the basis of memory protection.
- "Protection ring," Wikipedia. https://en.wikipedia.org/wiki/Protection_ring . Backs protection rings as hardware-enforced hierarchical privilege levels from most privileged (ring 0) to least, with ring 0 interacting most directly with the physical hardware.
