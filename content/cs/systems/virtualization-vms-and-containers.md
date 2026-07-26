---
title: "Virtualization: VMs and Containers"
description: "Hypervisors type 1 and 2, full vs paravirtualization, and containers built from namespaces and cgroups - two answers to running many isolated workloads on one machine."
draft: false
comments: true
tags:
  - cs
  - systems
  - operating-systems
date: 2026-05-03
updated:
aliases:
  - Hypervisors
  - Containers vs VMs
  - Namespaces and cgroups
---

Running many isolated workloads on one physical machine has two fundamentally different answers, and the difference comes down to what you duplicate. A virtual machine duplicates the whole computer, hardware and operating system and all, so each guest believes it owns a machine. A container duplicates almost nothing: it shares one kernel and just walls off what each workload can see. Both give you isolation on shared hardware, and the choice between them is the choice between a heavier boundary and a lighter one.

> [!note] The idea
> The VM-versus-container split is a split over where the isolation boundary sits. A hypervisor draws the line at the hardware interface, so each guest brings its own kernel and the boundary is strong but expensive. A container draws the line inside a single shared kernel, using kernel features to give each workload its own private view of the system, so the boundary is cheap but only as strong as the kernel that enforces it. Everything else, boot time, image size, density, blast radius, follows from where that one line is drawn.

## The hypervisor: virtualizing the machine

A VM is created and run by a hypervisor. A hypervisor, "also known as a virtual machine monitor (VMM), is a type of computer software, firmware or hardware that creates and runs virtual machines." The physical computer is the "host machine" and each VM is a "guest machine." The hypervisor "presents the guest operating systems with a virtual operating platform and manages the execution of the guest operating systems." What separates this from plain emulation is efficiency: "unlike an emulator, the guest executes most instructions on the native hardware."

Robert P. Goldberg's 1973 thesis classified two types, and the split is about what the hypervisor runs on:

- **Type-1 (native or bare-metal)** hypervisors "run directly on the host's hardware to control the hardware and to manage guest operating systems." There is no host OS beneath them. Examples: "Hyper-V, Xen and VMware ESXi." This is the datacenter configuration.
- **Type-2 (hosted)** hypervisors "run on a conventional operating system (OS) just as other computer programs do. A virtual machine monitor runs as a process on the host, such as VirtualBox." This is the run-a-VM-on-your-laptop configuration.

## Full virtualization vs paravirtualization

Within hardware virtualization there are two ways to present the machine to the guest, and they differ on whether the guest OS has to know it is virtualized.

**Full virtualization** is "almost complete virtualization of the actual hardware to allow software environments, including a guest operating system and its apps, to run unmodified." The guest OS is fooled completely; it runs as if on bare metal, no changes required. The cost is the effort the hypervisor spends maintaining that illusion for privileged instructions.

**Paravirtualization** trades transparency for speed. It "is a virtualization technique that presents a software interface to the virtual machines which is similar, yet not identical, to the underlying hardware-software interface." Because the interface is not identical, "guest programs need to be specifically modified to run" in it. The payoff: paravirtualization "improves performance and efficiency, compared to full virtualization, by having the guest operating system communicate with the hypervisor" directly, rather than forcing the hypervisor to trap and emulate. Full virtualization asks nothing of the guest and pays for it in overhead; paravirtualization asks the guest to cooperate and is faster for it.

## The container: virtualizing the OS

Containers take the opposite approach. OS-level virtualization "is an operating system (OS) virtualization paradigm in which the kernel allows the existence of multiple isolated user space instances, including containers" such as Docker and LXC. There is no guest kernel and no virtual hardware. One kernel runs, and it hands each container a private view of the system.

On Linux this rests on two kernel features. Containers "are all based on the virtualization, isolation, and resource management mechanisms provided by the Linux kernel, notably Linux namespaces and cgroups."

- **Namespaces** provide the isolation: what a container can *see*. "Programs running inside a container can only see the container's contents and devices assigned to the container." Wikipedia frames this as "an advanced implementation of the standard chroot mechanism, which changes the apparent root folder for the current running process." Namespaces extend that idea from the filesystem to process IDs, network interfaces, mounts, and users, each container getting its own.
- **cgroups** provide the resource management: what a container can *use*. Beyond isolation, "the kernel often provides resource-management features to limit the impact of one container's activities on other containers." cgroups cap a container's CPU, memory, and I/O so one container cannot starve the others.

Seeing (namespaces) and using (cgroups) are the two axes of containment, and together they reconstruct most of what a VM's boundary provides, without a second kernel.

## The tradeoff

| | Virtual machine | Container |
|---|---|---|
| Boundary sits at | The hardware interface (hypervisor) | Inside one shared kernel |
| Each instance ships | Its own full guest OS + kernel | Only its user-space files |
| Isolation strength | Strong (separate kernels) | Weaker (shared kernel is the trust boundary) |
| Startup / footprint | Heavy (boot an OS) | Light (start a process) |
| Enforced by | Hypervisor (type 1 or 2) | Namespaces + cgroups |

The rule that falls out: reach for a VM when you need a different OS, a hard security boundary, or a kernel of your own, and reach for a container when you want many instances of the same OS to start fast and pack densely. A shared kernel is a container's great efficiency and its one real weakness, since a kernel exploit crosses the boundary that a hypervisor's separate kernels would have held. The two are also composable in practice: containers are frequently run *inside* VMs, putting a hypervisor boundary around a pack of shared-kernel workloads to get both properties at once.

## Related Notes

- [[processes-and-threads|Processes & Threads]] - a container is essentially a process group with a private view, drawn by namespaces
- [[system-calls-and-the-kernel-boundary|System Calls and the Kernel Boundary]] - the shared kernel that containers isolate against and VMs replace
- [[virtual-memory|Virtual Memory]] - the same isolation instinct one level down, per process rather than per machine

## Sources

- "Hypervisor," Wikipedia. https://en.wikipedia.org/wiki/Hypervisor . Backs the definition of a hypervisor (VMM) that creates and runs virtual machines, host and guest terminology, the guest executing most instructions on native hardware unlike an emulator, and Goldberg's type-1 (bare-metal: Hyper-V, Xen, ESXi) versus type-2 (hosted: VirtualBox) classification.
- "Virtualization," Wikipedia. https://en.wikipedia.org/wiki/Virtualization . Backs the definitions of full virtualization (running a guest OS and apps unmodified) and paravirtualization (a similar-but-not-identical software interface requiring modified guests, improving performance by having the guest communicate with the hypervisor).
- "OS-level virtualization," Wikipedia. https://en.wikipedia.org/wiki/OS-level_virtualization . Backs OS-level virtualization as a kernel allowing multiple isolated user-space instances (containers), Linux containers resting on namespaces and cgroups, containers seeing only their own contents (an advanced chroot), and cgroups as resource-management limiting one container's impact on others.
