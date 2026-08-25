---
title: NUMA and Multiprocessor Memory
description: When memory access time depends on which socket you are running on, locality stops being an optimization and becomes a scheduling constraint.
draft: false
comments: true
tags:
  - cs
  - systems
  - computer-architecture
date: 2026-07-08
updated:
aliases:
  - NUMA
---

Open a two-socket server and you see the architecture directly: two CPU sockets, each surrounded by its own bank of DIMM slots. That physical layout is the whole idea. The RAM next to socket 0 is not the same distance from socket 1, and on a NUMA machine the hardware does not pretend otherwise. "Non-uniform memory access (NUMA) is a computer memory design used in multiprocessing, where the memory access time depends on the memory location relative to the processor. Under NUMA, a processor can access its own local memory faster than non-local memory (memory local to another processor or memory shared between processors)."

The flat address space is still there. What is gone is the flat cost model.

> [!note] The idea
> NUMA is a bandwidth architecture that presents as a latency problem. Vendors do not build it for locality's sake; per the Linux kernel documentation, "platform vendors don't build NUMA systems just to make software developers' lives interesting. Rather, this architecture is a means to provide scalable memory bandwidth." But the scalability is conditional, not automatic: "to achieve scalable memory bandwidth, system and application software must arrange for a large majority of the memory references [cache misses] to be to 'local' memory." Buy a NUMA machine and you have bought a *contract*, and if the software does not keep locality, you have paid for interconnect hops instead of throughput.

## The problem it solves

The starting condition is the one that has driven memory architecture since the 1960s. "Modern CPUs operate considerably faster than the main memory they use. In the early days of computing and data processing, the CPU generally ran slower than its own memory. The performance lines of processors and memory crossed in the 1960s with the advent of [[cs/military-computing/illiac-iv-and-parallel-processing|the first supercomputers]]. Since then, CPUs increasingly have found themselves 'starved for data' and forced to stall to wait for data to arrive from memory."

The commodity answer was [[cs/systems/memory-hierarchy-and-caching|cache]]: "for commodity processors, this meant installing an ever-increasing amount of high-speed cache memory and using increasingly sophisticated algorithms to avoid cache misses." It stopped being enough, because "the dramatic increase in size of both the operating systems and the applications that run on them has generally overwhelmed these cache-processing improvements."

Adding processors to a single shared memory makes the situation strictly worse, and the reason is a serialization bottleneck rather than a bandwidth shortage. "Multi-processor systems without NUMA make the problem considerably worse. Now a system can starve several processors at the same time, notably because only one processor can access the computer's memory at a time."

NUMA's move is to stop sharing the resource that was the bottleneck: it "attempts to address this problem by providing separate memory for each processor, avoiding the performance hit when several processors attempt to address the same memory." The upside, when the workload cooperates, is large. "For problems involving spread data (common for servers and similar applications), NUMA can improve the performance over a single shared memory by a factor of roughly the number of processors (or separate memory banks)."

Note the conditional buried in that sentence. Spread data. NUMA is good "for workloads with high memory locality of reference and low lock contention, because a processor may operate on a subset of memory mostly or entirely within its own cache node, reducing traffic on the memory bus." Those two conditions are load-bearing.

And when they fail, the machinery works against you. "Not all data ends up confined to a single task, which means that more than one processor may require the same data. To handle these cases, NUMA systems include additional hardware or software to move data between memory banks. This operation slows the processors attached to those banks, so the overall speed increase due to NUMA heavily depends on the nature of the running tasks."

## The hardware picture

The kernel documentation gives the cleanest structural account. "From the hardware perspective, a NUMA system is a computer platform that comprises multiple components or assemblies each of which may contain 0 or more CPUs, local memory, and/or IO buses," which it calls **cells**. Each cell "may be viewed as an SMP [symmetric multi-processor] subset of the system," and "the cells of the NUMA system are connected together with some sort of system interconnect, e.g., a crossbar or point-to-point link are common types."

Distance is not binary. "Both of these types of interconnects can be aggregated to create NUMA platforms with cells at multiple distances from other cells," and consequently "NUMA platforms can have cells at multiple remote distances from any given cell." Local versus remote is a simplification; real topologies are a distance matrix.

Two properties vary with distance, not one: "memory access time and effective memory bandwidth varies depending on how far away the cell containing the CPU or IO bus making the memory access is from the cell containing the target memory. For example, access to memory by CPUs attached to the same cell will experience faster access times and higher bandwidths than accesses to memory on other, remote cells." A remote access is both slower to arrive and thinner while it flows.

The lineage: NUMA architectures "logically follow in scaling from symmetric multiprocessing (SMP) architectures," developed commercially in the 1990s by a list of vendors including Unisys, Convex, Silicon Graphics, Sequent, Data General, and Digital, with the techniques later appearing "in a variety of Unix-like operating systems, and to an extent in Windows NT." In commodity hardware, "AMD implemented NUMA with its Opteron processor (2003), using HyperTransport," and "Intel announced NUMA compatibility for its x86 and Itanium servers in late 2007 with its Nehalem and Tukwila CPUs." Intel's interconnect was QuickPath Interconnect, "replaced by a new version called Intel UltraPath Interconnect with the release of Skylake (2017)."

## Coherence on top of non-uniformity

The NUMA platforms that matter in practice are the cache-coherent ones. "For Linux, the NUMA platforms of interest are primarily what is known as Cache Coherent NUMA or ccNUMA systems. With ccNUMA systems, all memory is visible to and accessible from any CPU attached to any cell and cache coherency is handled in hardware by the processor caches and/or the system interconnect."

Why not skip coherence and save the overhead? Because the programming cost is worse than the hardware cost. "With NUMA, maintaining cache coherence across shared memory has a significant overhead. Although simpler to design and build, non-cache-coherent NUMA systems become prohibitively complex to program in the standard [[cs/history/von-neumann-architecture|von Neumann architecture]] programming model." Somebody pays for coherence. ccNUMA decides it should be the hardware, once, rather than every programmer, forever.

The overhead is real and it has a characteristic bad case. "Typically, ccNUMA uses inter-processor communication between cache controllers to keep a consistent memory image when more than one cache stores the same memory location. For this reason, ccNUMA may perform poorly when multiple processors attempt to access the same memory area in rapid succession." That is [[cs/systems/cache-coherence|cache coherence]] traffic, except that here the coherence messages cross a socket interconnect instead of staying on one die.

Two mitigations get named. Protocol-level: "cache coherency protocols such as the MESIF protocol attempt to reduce the communication required to maintain cache coherency." Structural: "Scalable Coherent Interface (SCI) is an [[cs/standards/how-ieee-makes-a-standard|IEEE standard]] defining a directory-based cache coherency protocol to avoid scalability limitations found in earlier multiprocessor systems," and "SCI is used as the basis for the NumaConnect technology."

The other mitigation is the operating system's job, which is where this note is going: "support for NUMA in operating systems attempts to reduce the frequency of this kind of access by allocating processors and memory in NUMA-friendly ways and by avoiding scheduling and locking algorithms that make NUMA-unfriendly accesses necessary."

## The scheduling consequence

Here is where NUMA stops being a hardware fact and becomes a scheduling problem, and the Linux documentation is unusually direct about the seam.

Linux mirrors cells as **nodes**: it "divides the system's hardware resources into multiple software abstractions called 'nodes'. Linux maps the nodes onto the physical cells of the hardware platform." For each node with memory, "Linux constructs an independent memory management subsystem, complete with its own free page lists, in-use page lists, usage statistics and locks to mediate access." Separate allocators, separate locks, per node. The [[cs/systems/memory-allocators-and-fragmentation|allocator]] is not one shared structure to contend over.

The default allocation policy follows the CPU. "By default, Linux will attempt to satisfy memory allocation requests from the node to which the CPU that executes the request is assigned. Specifically, Linux will attempt to allocate from the first node in the appropriate zonelist for the node where the request originates. This is called 'local allocation.' If the 'local' node cannot satisfy the request, the kernel will examine other nodes' zones in the selected zonelist looking for the first zone in the list that can satisfy the request."

Fallback ordering is itself a considered decision, since "some nodes contain multiple zones containing different types of memory" and some zones "such as DMA or DMA32, represent relatively scarce resources." The resolution: "Linux chooses a default Node ordered zonelist. This means it tries to fallback to other zones from the same node before using remote nodes which are ordered by NUMA distance."

> [!warning] The gap that makes NUMA tuning a real job
> Local allocation only holds "as long as the task on whose behalf the kernel allocated some memory does not later migrate away from that memory."
>
> And migration is not fully prevented. The scheduler is topology-aware, "embodied in the 'scheduling domains' data structures," and it "attempts to minimize task migration to distant scheduling domains." But then comes the admission: "the scheduler does not take a task's NUMA footprint into account directly. Thus, under sufficient imbalance, tasks can migrate between nodes, remote from their initial node and kernel data structures."
>
> That is the whole problem in two sentences. Memory was placed where the task was. The scheduler, optimizing for load balance, can move the task. Nothing moves the memory back automatically, so the task now runs remote from every page it allocated, and it will keep paying interconnect latency and reduced bandwidth on every access until something intervenes. Load balancing and memory locality are separate objectives, and the load balancer is the one holding the steering wheel.

The intervention is manual, and the interfaces are worth knowing by name. "System administrators and application designers can restrict a task's migration to improve NUMA locality using various CPU affinity command line interfaces, such as `taskset(1)` and `numactl(1)`, and program interfaces such as `sched_setaffinity(2)`." Allocation behavior is separately tunable: "one can modify the kernel's default local allocation behavior using Linux NUMA memory policy." And the whole thing can be scoped per user: administrators "can restrict the CPUs and nodes' memories that a non-privileged user can specify in the scheduling or NUMA commands and functions using control groups and CPUsets."

The kernel grew into this over years rather than arriving with it. "Version 2.5 provided a basic NUMA support, which was further improved in subsequent kernel releases." Version 3.8 "brought a new NUMA foundation that allowed development of more efficient NUMA policies in later kernel releases." Version 3.13 "brought numerous policies that aim at putting a process near its memory, together with the handling of cases such as having memory pages shared between processes, or the use of transparent huge pages," plus "new sysctl settings [that] allow NUMA balancing to be enabled or disabled." Beyond the kernel, "Windows 7 and Windows Server 2008 R2 added support for NUMA architecture over 64 logical cores," and "Java 7 added support for NUMA-aware memory allocator and garbage collector."

> [!example] Memoryless nodes, and why "local" can lie
> A wrinkle that punishes anyone who assumes node identity implies uniform latency. "For some architectures, such as x86, Linux will 'hide' any node representing a physical cell that has no memory attached, and reassign any CPUs attached to that cell to a node representing a cell that does have memory. Thus, on these architectures, one cannot assume that all CPUs that Linux associates with a given node will see the same local memory access times and bandwidth."
>
> On architectures that do not hide them, the redefinition is explicit: "for a memoryless node the 'local memory node', the node of the first zone in CPU's node's zonelist, will not be the node itself. Rather, it will be the node that the kernel selected as the nearest node with memory when it built the zonelists."
>
> Some kernel code cannot live with that fuzziness. "Some kernel allocations do not want or cannot tolerate this allocation fallback behavior. Rather they want to be sure they get memory from the specified node or get notified that the node has no free memory. This is usually the case when a subsystem allocates per CPU memory resources." Such code gets the node id "using one of the kernel's `numa_node_id()` or `CPU_to_node()` functions and then request[s] memory from only the node id returned." The slab allocator falls back to its own path on failure; "the kernel profiling subsystem" instead "may choose to disable or not to enable itself on allocation failure."

## Related Notes

- [[cs/systems/cache-coherence|Cache Coherence]] - the protocol traffic that ccNUMA pushes across a socket interconnect
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - the response to the processor/memory speed gap that NUMA extends
- [[cs/systems/process-scheduling-algorithms|Process Scheduling Algorithms]] - the load balancer whose objective conflicts with memory locality
- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] - per-node free lists as the allocator side of the design
- [[cs/systems/virtual-memory|Virtual Memory]] - the page-level machinery that makes software NUMA possible at all
- [[cs/systems/concurrency-primitives|Concurrency Primitives]] - lock contention, the second condition NUMA's benefit depends on

## Sources

- "Non-uniform memory access," Wikipedia. https://en.wikipedia.org/wiki/Non-uniform_memory_access . Backs the NUMA definition and the local-faster-than-remote property, the locality-and-low-lock-contention benefit condition, the processor/memory speed gap history and the 1960s crossover, the cache response being overwhelmed by OS and application growth, the one-processor-at-a-time bottleneck in non-NUMA multiprocessors, the separate-memory-per-processor solution and the roughly-number-of-processors improvement for spread data, the data-movement cost when data is shared, the SMP lineage and 1990s commercial vendors, the AMD Opteron 2003 HyperTransport and Intel Nehalem/Tukwila late-2007 implementations plus QPI and UltraPath, the ccNUMA overhead and programming-complexity argument, the rapid-succession same-area performance problem, MESIF and Scalable Coherent Interface with NumaConnect, the OS-support statement, the two-socket motherboard layout with DIMM slots surrounding each socket, and the Linux 2.5/3.8/3.13, Windows 7, and Java 7 support milestones.
- "What is NUMA?" The Linux Kernel documentation. https://www.kernel.org/doc/html/latest/mm/numa.html . Backs the cells-and-interconnect hardware model with crossbar and point-to-point links and multiple distances, the variation of both access time and effective bandwidth with distance, the scalable-memory-bandwidth rationale and the requirement that software keep most references local, the ccNUMA definition for Linux, the software node abstraction and per-node independent memory management subsystems, zonelists and fallback with the node-ordered default, local allocation and its dependence on the task not migrating, the scheduling domains and the statement that the scheduler does not account for a task's NUMA footprint so tasks can migrate under imbalance, the taskset/numactl/sched_setaffinity and NUMA memory policy and CPUsets interfaces, and the memoryless-node behavior including x86 node hiding, the redefinition of local memory node, and the numa_node_id()/CPU_to_node() pattern with slab and kernel profiling as contrasting fallback examples.
