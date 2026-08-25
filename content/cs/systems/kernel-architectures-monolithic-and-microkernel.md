---
title: Kernel Architectures
description: "Where the privilege boundary goes: what runs in kernel space, what gets pushed out to user space, and the performance cost of the isolation you buy."
draft: false
comments: true
tags:
  - cs
  - systems
  - operating-systems
date: 2026-02-09
updated:
aliases: []
---

Every operating system has to answer one structural question before it answers any other: how much code gets to run at the hardware's most privileged level? The file system, the network stack, the driver for your graphics card, all of them need to do things ordinary programs cannot. The monolithic answer is to put them inside the kernel and be done with it. The microkernel answer is to push them out into ordinary processes and let them ask the kernel for the few things only the kernel can do. Both designs ship in production systems today, which is the first clue that neither one simply won.

> [!note] The idea
> The monolithic/microkernel split is not really an argument about code organization. It is an argument about where the [[cs/systems/system-calls-and-the-kernel-boundary|privilege boundary]] sits, and every service you move across that boundary trades a cheap function call for an expensive message round trip. Isolation is not free, and the entire history of microkernel research is the story of trying to make that one crossing cheap enough that the isolation becomes worth having.

## The monolithic design

A monolithic kernel is "an operating system architecture with the entire operating system running in kernel space." It "alone defines a high-level virtual interface over computer hardware," and "a set of primitives or system calls implement all operating system services such as process management, concurrency, and memory management." Linux, the BSDs, Solaris, and AIX all sit here.

This is not a design that failed to modernize. It grew for a reason. Early Unix kernels "were generally small, even though they contained various device drivers and file system implementations." What changed was scale: "when address spaces increased from 16 to 32 bits, kernel design was no longer constrained by the hardware architecture, and kernels grew larger." BSD "added a complete TCP/IP networking system and a number of 'virtual' devices," and "this growth continued for many years, resulting in kernels with millions of lines of source code. As a result of this growth, kernels were prone to bugs and became increasingly difficult to maintain."

Modern monolithic kernels are modular, but the modularity is a different kind than it looks. Systems like Linux, FreeBSD, and Solaris "can dynamically load (and unload) executable kernel modules at runtime." That capability is real and useful, and it is also strictly a packaging convenience: "this modularity of the operating system is at the binary (image) level and not at the architecture level." A loaded module runs in kernel space with full kernel privileges. Nothing about being a module isolates it.

## The microkernel design

A microkernel is "the near-minimum amount of software that can provide the mechanisms needed to implement an operating system." That minimum is short: "low-level address space management, thread management, and inter-process communication (IPC)." Everything else moves out. "Traditional operating system functions, such as device drivers, protocol stacks and file systems, are typically removed from the microkernel and are instead run in user space."

The displaced services become servers, which "are essentially daemon programs like any others, except that the kernel grants some of them privileges to interact with parts of physical memory that are otherwise off limits to most programs." A general-purpose set "includes file system servers, device driver servers, networking servers, display servers, and user interface device servers," and that set "provides roughly the set of services offered by a Unix monolithic kernel."

The code-size difference is not marginal. "Microkernels often have less source code than monolithic kernels. The MINIX 3 microkernel, for example, has only approximately 12,000 lines of code."

What decides whether a given feature belongs inside is Jochen Liedtke's minimality principle, which is the sharpest statement of the whole design philosophy:

> A concept is tolerated inside the microkernel only if moving it outside the kernel, i.e., permitting competing implementations, would prevent the implementation of the system's required functionality.

The rule is honored imperfectly even by its adherents. "For efficiency, most microkernels contain schedulers and manage timers, in violation of the minimality principle and the principle of policy-mechanism separation." Some, "such as LynxOS and the original Minix, simplify [booting] by placing some key drivers inside the kernel."

## What the isolation buys

The stability argument is concrete. In a microkernel system, "if a networking service crashed due to [[cs/security/buffer-overflows|buffer overflow]], only the networking service's memory would be corrupted, leaving the rest of the system still functional." Better, "many 'crashes' can be corrected by simply stopping and restarting the server, which would not be feasible if the entire kernel had to reboot."

That recovery is not transparent, and the note the article makes about it is the honest one: "part of the system state is lost with the failing server, hence this approach requires applications to cope with failure." Restarting a TCP/IP server means applications "will experience a 'lost' connection, a normal occurrence in a networked system." For other services, though, "failure is less expected and may require changes to application code." You get restartability by pushing failure handling up into the applications.

The security argument runs through the [[cs/military-computing/tcsec-and-graded-assurance|trusted computing base]]. "As the kernel (the code that executes in the privileged mode of the hardware) has unvetted access to any data and can thus violate its integrity or confidentiality, the kernel is always part of the TCB. Minimizing it is natural in a security-driven design." This is why "microkernel designs have been used for systems designed for high-security applications, including KeyKOS, EROS and military systems," and why Common Criteria at EAL 7 "has an explicit requirement that the target of evaluation be 'simple'."

There is measured evidence, though it comes from microkernel advocates and should be read that way. A 2018 Asia-Pacific Systems Conference paper by Biggs, Lee, and Heiser investigated all published critical Linux kernel [[cs/security/vulnerability-scoring-cve-and-cvss|CVEs]] at the time and "concluded that 40% of the issues could not occur at all in a formally verified microkernel, and only 4% of the issues would remain entirely unmitigated in such a system."

## What the isolation costs

Here is the mechanism, and it is worth being precise because the cost is structural rather than incidental. "On most mainstream processors, obtaining a service is inherently more expensive in a microkernel-based system than a monolithic system. In the monolithic system, the service is obtained by a single system call, which requires two mode switches. In the microkernel-based system, the service is obtained by sending an IPC message to a server, and obtaining the result in another IPC message from the server. This requires a context switch if the drivers are implemented as processes, or a function call if they are implemented as procedures."

And then the data movement: "passing actual data to the server and back may incur extra copying overhead, while in a monolithic system the kernel can directly access the data in the client's buffers." Two [[cs/systems/context-switching|context switches]] and two copies where the monolith had one trap and a pointer dereference.

This is why "first-generation microkernels such as Mach and ChorusOS indeed performed poorly." The interesting part is what happened next. Liedtke argued that "Mach's performance problems were the result of poor design and implementation, specifically Mach's excessive cache footprint," and demonstrated with L4 "that through careful design and implementation, and especially by following the minimality principle, IPC costs could be reduced by more than an order of magnitude compared to Mach."

Chen and Bershad's earlier experiments had already complicated the simple story: comparing memory cycles per instruction of monolithic Ultrix against Mach with a 4.3BSD server in user space, "their results explained Mach's poorer performance by higher MCPI and demonstrated that IPC alone is not responsible for much of the system overhead, suggesting that optimizations focused exclusively on IPC will have a limited effect." Liedtke later attributed "the bulk of the difference" to "capacity cache-misses."

> [!warning] The benchmark that proves less than it looks
> A monolithic Linux server ported to L4 "exhibits only a few percent overhead over native Linux." That sounds like a decisive result until you read the caveat: "such a single-server system exhibits few, if any, of the advantages microkernels are supposed to provide by structuring operating system functionality into separate servers." Putting all of Linux in one user-space server is cheap precisely because it does not decompose anything. The configuration that performs well is the one that gave up the isolation.

## The driver question

Drivers are where the argument gets most interesting, because the usual intuition is wrong. "Device drivers frequently perform direct memory access (DMA), and therefore can write to arbitrary locations of physical memory, including various kernel data structures. Such drivers must therefore be trusted." But, and this is the part people skip, "it is a common misconception that this means that they must be part of the kernel. In fact, a driver is not inherently more or less trustworthy by being part of the kernel."

Running a driver in user space "does not necessarily reduce the damage a misbehaving driver can cause," yet "in practice it is beneficial for system stability in the presence of buggy (rather than malicious) drivers: memory-access violations by the driver code (as opposed to the device) may still be caught by the memory-management hardware." And hardware has been moving the goalposts: "an increasing number of computers feature IOMMUs, many of which can be used to restrict a device's access to physical memory. This also allows user-mode drivers to become untrusted."

The historical accident that produced the status quo is stated plainly: "historically, drivers were less of a problem, as the number of devices was small and trusted anyway, so having them in the kernel simplified the design and avoided potential performance problems. This led to the traditional driver-in-the-kernel style of Unix, Linux, and Windows NT." That decision has aged into a scaling problem, since "with the proliferation of various kinds of peripherals, the amount of driver code escalated and in modern operating systems dominates the kernel in code size." The largest attack surface in a monolithic kernel is the part nobody designed to be there.

For what it is worth, user-space drivers are older than microkernels: the Michigan Terminal System supported them in 1967, "the first operating system to be designed with that capability."

> [!tip]
> The question to carry away is not which architecture is correct. It is: for this system, is the cost of one extra IPC round trip per service request smaller than the expected cost of a kernel-space fault? Commercial multi-server microkernels exist and ship, "in particular the real-time systems QNX and Integrity," and the article is explicit that for them "performance does not seem to be the overriding concern," since they "instead emphasize reliably quick interrupt handling response times (QNX) and simplicity for the sake of robustness." Different objective function, different answer.

## Related Notes

- [[cs/systems/system-calls-and-the-kernel-boundary|System Calls and the Kernel Boundary]] - the mode switch whose cost this whole argument is denominated in
- [[cs/systems/inter-process-communication|Inter-Process Communication]] - the mechanism microkernels rely on for every service invocation
- [[cs/systems/context-switching|Context Switching]] - what an IPC round trip to a server process actually costs
- [[cs/systems/io-devices-and-drivers|I/O Devices and Drivers]] - the DMA capability that makes driver trust the hard case
- [[cs/systems/virtualization-vms-and-containers|Virtualization, VMs, and Containers]] - hypervisors as another answer to the same isolation question

## Sources

- "Monolithic kernel," Wikipedia. https://en.wikipedia.org/wiki/Monolithic_kernel . Backs the definition of a monolithic kernel as the entire OS in kernel space, the claim that a set of primitives or system calls implement all OS services including process management and memory management, the list of monolithic systems, and the point that loadable-module modularity is at the binary image level rather than the architecture level.
- "Microkernel," Wikipedia. https://en.wikipedia.org/wiki/Microkernel . Backs the microkernel definition and its minimum mechanisms, the removal of drivers/protocol stacks/file systems to user space, the MINIX 3 line count, the growth-of-kernels history, the server model and restart behavior, Liedtke's minimality principle, the mode-switch versus IPC performance comparison, the Mach and L4 results, the Chen and Bershad findings, the TCB and EAL 7 security argument, the 2018 CVE study figures, and the device-driver trust and IOMMU discussion.
