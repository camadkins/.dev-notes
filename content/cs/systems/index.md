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
- [[dns-the-domain-name-system|DNS - The Domain Name System]] - hierarchical, cached, distributed name resolution
- [[tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - authenticated, encrypted connections over an open wire
- [[bgp-and-internet-routing-as-control|BGP and Internet Routing as Control]] - path-vector routing, trust-by-default, and route hijacking
- [[physical-layer-of-the-internet|The Physical Layer of the Internet]] - submarine cables, exchange points, and chokepoints
- [[content-delivery-networks-and-the-centralization-of-control|Content Delivery Networks]] - edge caching, anycast, and centralization

### Distributed Systems

- [[distributed-consensus|Distributed Consensus]] - CAP theorem, Paxos/Raft, Byzantine faults
- [[blockchain-consensus-and-sanctions-evasion|Blockchain Consensus & Sanctions Evasion]] - Byzantine agreement without a central party, and money outside the state

### Security

- [[tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - public-key bootstrap, certificate trust, and forward secrecy
- [[onion-routing-and-anonymity-networks|Onion Routing & Anonymity Networks]] - layered encryption, the traffic-confirmation limit, and the anonymity trilemma
- [[end-to-end-encryption-and-the-lawful-access-debate|End-to-End Encryption & the Lawful-Access Debate]] - endpoint keys, key escrow, and why a backdoor cannot be selective

---

*The full file listing follows below, generated automatically by Quartz.*
