---
title: Blockchain and Nakamoto Consensus
description: How Bitcoin's 2008 design got mutually distrusting computers to agree on a shared ledger with no central authority, using proof of work.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-02-15
updated:
aliases: []
---

Getting computers that do not trust each other to agree on a single shared record, with no central authority to settle disputes, is one of the hardest problems in distributed systems. In 2008 an author writing under the name Satoshi Nakamoto proposed a working answer and called it Bitcoin.

> [!note] The idea
> A blockchain is an append-only public ledger that mutually distrusting nodes agree on without any central authority, using proof of work, deliberate and costly computation, to decide whose version of the record stands.

## The whitepaper

On 31 October 2008, a paper titled "Bitcoin: A Peer-to-Peer Electronic Cash System," authored under the name Satoshi Nakamoto, was posted to a cryptography mailing list. It described the first decentralized cryptocurrency, a money system with [[cs/systems/blockchain-consensus-and-sanctions-evasion|no bank or government at its center]].

## How agreement works

Bitcoin runs as a peer-to-peer network in which [[cs/systems/replication-and-quorums|each node keeps its own copy of a public ledger]], the blockchain. Consensus on the contents of that ledger is reached through [[cs/security/cryptographic-hash-functions|proof of work]], a computationally intensive process called mining. Because rewriting history would require out-computing the rest of the network combined, the record is hard to forge without controlling most of the world's mining power.

## Why it matters

Whatever one makes of cryptocurrency, the technical achievement is real: agreement among untrusting parties with no trusted middleman. That is a genuinely new point in the design space of [[cs/systems/distributed-consensus|distributed consensus]], which had always assumed either trust or a coordinator. It leans on [[cs/dsa/hash-tables|hashing]] to chain each block to the last, making the ledger tamper-evident.

## Related Notes

- [[cs/systems/distributed-consensus|Distributed Consensus]], the problem blockchain attacks from a new angle
- [[cs/dsa/hash-tables|Hash Tables]], the hashing that chains the ledger
- [[cs/geopolitics/surveillance-and-privacy|Surveillance and Privacy]], the politics of decentralized money
- [[cs/history/history-of-the-internet|History of the Internet]], the network it runs on
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Bitcoin," Wikipedia. https://en.wikipedia.org/wiki/Bitcoin . Supports the 31 October 2008 whitepaper under the name Satoshi Nakamoto, Bitcoin as a decentralized cryptocurrency whose peer-to-peer nodes each keep a copy of a public ledger (the blockchain), and consensus achieved through the proof-of-work process called mining without a central authority.
