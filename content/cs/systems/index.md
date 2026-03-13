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

- [[processes-and-threads|Processes & Threads]] - execution units, context switching, scheduling
- [[file-systems|File Systems]] - inodes, journaling, B-tree indexes

### Memory & Storage

- [[virtual-memory|Virtual Memory]] - address spaces, paging, TLB
- [[file-systems|File Systems]] - on-disk layout and reliability

### Concurrency & Parallelism

- [[processes-and-threads|Processes & Threads]] - OS-level concurrency primitives
- [[concurrency-models-threads-locks-and-actors|Concurrency Models]] - threads, locks, actors, and beyond

### Networking

- [[network-protocols|Network Protocols]] - OSI/TCP-IP, TCP vs UDP, DNS, HTTP

### Distributed Systems

- [[distributed-consensus|Distributed Consensus]] - CAP theorem, Paxos/Raft, Byzantine faults

### Security

- *(coming soon - cryptographic primitives, access control, threat models)*

---

*The full file listing follows below, generated automatically by Quartz.*
