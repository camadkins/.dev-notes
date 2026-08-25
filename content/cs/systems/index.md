---
title: Systems
description: Operating systems, memory hierarchies, networking, concurrency, distributed systems, and security - the infrastructure that makes software run.
draft: false
comments: false
tags:
  - cs
  - systems
date: 2026-03-12
updated:
aliases: []
---

Systems is the study of how software meets hardware - how processes get scheduled, memory gets managed, packets get routed, and machines coordinate at scale. The notes below are grouped by concept cluster; start with an anchor note and follow links into specifics.

### OS Fundamentals

- [[cs/systems/processes-and-threads|Processes & Threads]] - execution units, context switching, scheduling
- [[cs/systems/file-systems|File Systems]] - inodes, journaling, B-tree indexes
- [[cs/systems/process-scheduling-algorithms|Process Scheduling Algorithms]] - how the scheduler decides who runs next
- [[cs/systems/context-switching|Context Switching]] - saving and restoring execution state, and what it costs
- [[cs/systems/system-calls-and-the-kernel-boundary|System Calls and the Kernel Boundary]] - the controlled crossing into privileged code
- [[cs/systems/interrupts-and-traps|Interrupts and Traps]] - how hardware and software force the kernel's attention

### Memory & Storage

- [[cs/systems/virtual-memory|Virtual Memory]] - address spaces, paging, TLB
- [[cs/systems/file-systems|File Systems]] - on-disk layout and reliability
- [[cs/systems/memory-hierarchy-and-caching|Memory Hierarchy and Caching]] - the latency pyramid and why locality decides performance
- [[cs/systems/cache-coherence|Cache Coherence]] - keeping per-core caches agreeing on shared memory

### Concurrency & Parallelism

- [[cs/systems/processes-and-threads|Processes & Threads]] - OS-level concurrency primitives
- [[cs/pl/concurrency-models-threads-locks-and-actors|Concurrency Models]] - threads, locks, actors, and beyond
- [[cs/systems/concurrency-primitives|Concurrency Primitives]] - mutexes, semaphores, condition variables
- [[cs/systems/deadlock|Deadlock]] - the four conditions, and prevention against detection
- [[cs/systems/inter-process-communication|Inter-Process Communication]] - pipes, message queues, shared memory

### Kernel design

- [[cs/systems/kernel-architectures-monolithic-and-microkernel|Kernel Architectures]] - monolithic against microkernel, what moves to user space, and the isolation/performance trade
- [[cs/systems/io-devices-and-drivers|I/O Devices and Drivers]] - how the kernel talks to hardware, and polling against interrupts against DMA

### Memory management

- [[cs/systems/memory-allocators-and-fragmentation|Memory Allocators and Fragmentation]] - how allocators work, and internal against external fragmentation
- [[cs/systems/page-replacement-algorithms|Page Replacement Algorithms]] - FIFO, LRU, clock, optimal as a bound, and Bélády's anomaly
- [[cs/systems/numa-and-multiprocessor-memory|NUMA and Multiprocessor Memory]] - non-uniform access, locality across sockets, and the scheduling consequence

### Storage

- [[cs/systems/raid-and-storage-redundancy|RAID and Storage Redundancy]] - the standard levels, what each trades, and why RAID is not a backup

### Virtualization

- [[cs/systems/virtualization-vms-and-containers|Virtualization, VMs, and Containers]] - two different things people call the same word

### Networking

- [[cs/systems/network-protocols|Network Protocols]] - OSI/TCP-IP, TCP vs UDP, DNS, HTTP
- [[cs/systems/dns-the-domain-name-system|DNS - The Domain Name System]] - hierarchical, cached, distributed name resolution
- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - authenticated, encrypted connections over an open wire
- [[cs/systems/bgp-and-internet-routing-as-control|BGP and Internet Routing as Control]] - path-vector routing, trust-by-default, and route hijacking
- [[cs/systems/physical-layer-of-the-internet|The Physical Layer of the Internet]] - submarine cables, exchange points, and chokepoints
- [[cs/systems/content-delivery-networks-and-the-centralization-of-control|Content Delivery Networks]] - edge caching, anycast, and centralization

### Distributed Systems

- [[cs/systems/distributed-consensus|Distributed Consensus]] - CAP theorem, Paxos/Raft, Byzantine faults
- [[cs/systems/cap-theorem|CAP Theorem]] - the consistency/availability choice under partition, and PACELC's latency extension
- [[cs/systems/consistency-models|Consistency Models]] - the spectrum from linearizable down to eventual, and its cost in latency
- [[cs/systems/logical-clocks-lamport-and-vector|Logical Clocks: Lamport and Vector]] - ordering events by causality without synchronized time
- [[cs/systems/two-phase-commit-and-distributed-transactions|Two-Phase Commit and Distributed Transactions]] - atomic commit across nodes, the blocking problem, 3PC and sagas
- [[cs/systems/replication-and-quorums|Replication and Quorums]] - primary-backup vs multi-primary, and the R + W > N quorum rule
- [[cs/systems/blockchain-consensus-and-sanctions-evasion|Blockchain Consensus & Sanctions Evasion]] - Byzantine agreement without a central party, and money outside the state

### Security

- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - public-key bootstrap, certificate trust, and forward secrecy
- [[cs/systems/onion-routing-and-anonymity-networks|Onion Routing & Anonymity Networks]] - layered encryption, the traffic-confirmation limit, and the anonymity trilemma
- [[cs/systems/end-to-end-encryption-and-the-lawful-access-debate|End-to-End Encryption & the Lawful-Access Debate]] - endpoint keys, key escrow, and why a backdoor cannot be selective

---

*The full file listing follows below, generated automatically by Quartz.*
