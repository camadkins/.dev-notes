---
title: Memory Acquisition
description: "RAM is captured first because it cannot be recaptured, and the capture is never a snapshot: the tool runs inside the system it measures, pages are read in address order while the kernel keeps writing, and the result is a set of pages taken at different moments."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-08-08
updated:
aliases: []
---

There is one artifact class that a second visit cannot recover. Disks keep their contents through a power cycle and a shipping label. Volatile memory does not, and everything that exists only in memory, which today includes decrypted keys, injected code, unwritten buffers, and entire malware families, exists exactly as long as the machine stays powered.

That constraint places memory at the top of the collection order. What it does not do is make the capture clean.

> [!note] The idea
> A memory image is **not a snapshot**, it is a time series flattened into a file. Acquisition tools read physical pages in ascending address order while the kernel continues to run, so the image is a collection of pages captured at different moments. The consequence is not theoretical: page tables acquired early can reference lower-level tables whose contents change before they are read, producing an image that is internally inconsistent in ways that analysis tools cannot always detect.

## Why it goes first, and what it costs

NIST is careful to present live collection as a tradeoff rather than a default. In deciding whether to collect volatile data, the risks associated with such collection should be weighed against the potential for recovering important information, and if the effort needed to collect the volatile data is not merited, analysts might instead decide to perform a shutdown. Before touching anything, if evidence may be needed, the analyst should fully document what is seen on the screen before touching the system.

The risk being weighed is that everything you run changes the machine. Tools have to come from outside it, because a user might have replaced system commands with malicious programs, and NIST recommends statically linked binaries, since such an executable contains all of the functions and library functions that it references so separate dynamic link libraries and other supporting files are not needed, which increases the reliability of the tools.

Then the caveat that governs the entire enterprise: use of forensic tools is no guarantee that the data retrieved will be accurate, because if a system has been fully compromised it is possible that rootkits and other malicious utilities have been installed that alter the system's functionality at the kernel level, which can cause false data to be returned to user-level tools. That is the argument for physical memory acquisition over live enumeration. Asking the operating system what processes exist trusts the operating system. Reading physical memory and reconstructing the process list yourself trusts only the [[cs/systems/kernel-architectures-monolithic-and-microkernel|kernel]] data structures, which a rootkit must corrupt rather than merely lie about.

NIST also asks for a discipline that reads as pedantic until the first time it matters: the analyst should know how each tool affects or alters the system before collecting the volatile data, the message digest of each tool should be computed and stored safely, and the exact commands used to run each tool should be documented, including command line arguments and switches.

## How the capture happens

Software acquisition on Linux is typically a loadable kernel module, and LiME is the canonical example. It describes itself as a loadable kernel module for volatile memory acquisition from Linux and Linux-based devices such as Android, which minimizes its interaction between user and kernel space processes during acquisition, producing memory captures that are more forensically sound than those of other tools designed for Linux memory acquisition.

Two of its options make the observer effect concrete.

The first is output destination. LiME supports acquisition over a network interface or to local disk, which matters because writing a multi-gigabyte image to the subject machine's own disk overwrites unallocated space on the very media you are about to image. Streaming over TCP moves that damage off the evidence.

The second is more instructive. LiME can hash the RAM and provide a sidecar digest file, and the documentation warns that enabling digest increases code complexity during acquisition and will overwrite additional memory, so it should only be used when integrity verification is required. That is the measurement problem stated as a build flag. Verifying the capture consumes some of the thing being captured, and the tool authors decline to make that choice for you.

The output formats encode the same honesty about structure. The lime format prepends each range with a fixed-size header containing address space information; the padded format pads all non-System RAM ranges with zeros starting from physical address 0; and the raw format concatenates all System RAM ranges, with the documented warning that the original position of dumped memory is likely to be lost, making analysis in most forensic tools impossible. A memory image without physical address metadata is a bag of bytes, because [[cs/systems/virtual-memory|virtual memory]] translation needs to know where each page actually lived.

## The smear problem

The assumption that a memory dump faithfully reflects the content of memory at the moment of its capture is described in the literature as a common misconception. On a bare-metal machine, acquisition occurs while the system is still running, so memory dumps are not true atomic snapshots of the system's state but rather a collection of memory pages captured at different moments in time.

The reason is a design choice repeated across nearly every tool. Acquisition usually retrieves the content of physical pages in ascending order according to their address in the physical address space, because that technique is easy to implement and minimizes the logic required to track which pages have already been acquired, reducing the memory footprint of the acquisition tool. It is also the only technique available when the operating system is unknown.

The specific failure that results has a name. Page table smearing occurs when an acquired page table references page tables of lower levels whose content is modified by the kernel before they get acquired, resulting in inconsistencies and errors in the virtual-to-physical address translation later performed by the analysis tool. The consequences listed are exactly the ones that would ruin a finding: the post-mortem analysis might miss entire regions of the virtual space, show inconsistent permission bits, or make errors in reconstructing a process's virtual memory, for example by including data pages that originally belonged to other processes.

How common is it? Prior work reported inconsistencies in page tables in at least 20% of acquired images, and a 2025 measurement study of Linux acquisitions found that page smearing affected user-space processes in 100% of the dumps in its dataset and kernel memory in 60% of them, with one observed case where up to 64 MiB of a process's private address space was affected by anomalies.

The one clean escape is not available on physical hardware. The same work notes that non-atomicity does not apply to virtual machines, where the hypervisor can suspend the guest execution during the acquisition process. [[cs/systems/virtualization-vms-and-containers|Virtualization]] gives the analyst a real snapshot, which is one of the few places where a virtualized target is forensically better than a physical one.

> [!warning] What to write in the report
> "The memory image was acquired at 03:14" is a simplification that an informed opponent can attack. The defensible formulation names the tool, the acquisition order, the duration of the capture, and the fact that the image represents system state over that interval rather than at an instant. Inconsistency is expected; failing to disclose that it is expected is the problem.

## Related Notes

- [[cs/forensics/the-order-of-volatility|The Order of Volatility]] is why this happens first and what has to wait.
- [[cs/forensics/memory-analysis-and-process-reconstruction|Memory Analysis and Process Reconstruction]] is what the image is for, and inherits every inconsistency described here.
- [[cs/forensics/the-page-file-and-hibernation-artifacts|The Page File and Hibernation Artifacts]] covers the volatile state that reached disk and can be acquired without any of these problems.
- [[cs/systems/virtual-memory|Virtual Memory]] supplies the page tables whose inconsistency is the central failure mode.
- [[cs/systems/virtualization-vms-and-containers|Virtualization]] is the only setting where an atomic capture is available.
- [[cs/security/malware-classes|Classes of Malware]] covers the kernel-level subversion that motivates capturing physical memory rather than asking the operating system.

## Sources

- [NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) backs the collection tradeoff, the tool preparation requirements, the statically linked binaries guidance, and the rootkit caveat about user-level tools.
- [LiME, Linux Memory Extractor](https://raw.githubusercontent.com/504ensicsLabs/LiME/master/README.md) backs the loadable kernel module design, network and disk output, the digest warning, and the three output formats.
- [A Comprehensive Quantification of Inconsistencies in Memory Dumps, Oliveri and Balzarotti, arXiv 2503.15065](https://arxiv.org/pdf/2503.15065.pdf) backs the non-atomic snapshot argument, the ascending-page-order acquisition technique, the definition and consequences of page table smearing, the prevalence figures, and the virtual machine exception.
