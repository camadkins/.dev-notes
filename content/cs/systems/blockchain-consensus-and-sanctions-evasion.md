---
title: Blockchain Consensus and Sanctions Evasion
description: "Why a Byzantine-fault-tolerant ledger lets strangers who distrust each other agree on who owns what with no bank in the middle, how that same property makes it money outside state control, and the pseudonymity that chain analysis keeps chipping away at."
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-06-28
updated:
aliases:
  - blockchain
  - distributed ledger
  - consensus
---

Money has always needed a referee. When you pay someone, a bank or a card network confirms the money was yours and is now theirs, and stops you from spending the same dollar twice. That referee is a single trusted party, and a single trusted party is also a single point of control: it can freeze your account, reverse your payment, or be ordered by a state to do both. A blockchain asks a stranger question. Can a crowd of machines that do not trust each other, with no referee, still agree on who owns what? When the answer is yes, you get money that no one can freeze, which is the whole story of why blockchains matter politically.

> [!note] The idea
> A blockchain is a Byzantine-fault-tolerant distributed consensus system: a way for many machines, some of which may be faulty or lying, to agree on a single shared history of transactions with no central authority. The history is an append-only ledger, chained block by block with cryptographic hashes so that altering an old entry would require redoing everything after it and convincing the network to accept the change. That property, agreement without a trusted middleman, is exactly what makes the ledger usable as money outside state control. The catch is that the ledger is public and permanent, so every payment is pseudonymous rather than anonymous, and analysis of the chain can often unmask who is behind an address.

## The double-spend problem and agreement among liars

The hard part of digital money is not sending it, it is stopping someone from sending the same coin to two people at once. A physical coin solves this for free: handing it over means you no longer have it. A digital token is just data, copyable at no cost, so something has to enforce that a coin spent here cannot also be spent there. Banks solve it by being the one authority that keeps score. Take the authority away and you face a classic problem from distributed computing: reaching consensus, agreement on a single data value, while some of the participating machines may fail or actively lie.

This is the Byzantine generals problem. A group of actors must agree on a common decision to avoid catastrophic failure, but some of them are unreliable in ways that make the honest ones disagree without realizing it. A system that stays correct despite such actors has Byzantine fault tolerance. A blockchain is a working answer at internet scale. Bitcoin's design reaches agreement through proof-of-work: machines compete to extend the ledger by spending real computation, and the chain that represents the most accumulated work is the one the network treats as true. Rewriting history then means out-computing everyone else, which is expensive enough to make tampering uneconomic. Other systems reach the same agreement by other means, such as staking value rather than burning energy, but the goal is identical: let mutually distrusting parties converge on one history without anyone in charge. This is the same family of problem that classical [[distributed-consensus|distributed consensus]] protocols solve inside a single trusted datacenter, pushed out to an open network full of anonymous strangers.

## An append-only ledger with no one in charge

What the consensus produces is a ledger built only by appending. Each block carries a cryptographic hash of the block before it, so the blocks form a chain in which every entry commits to all of its history. Change one old transaction and its hash changes, which breaks the next block's reference, which breaks the one after that, all the way to the tip. Undoing a buried transaction therefore means redoing every block on top of it and then persuading the network to accept your version over the one backed by all the honest work. Practically, the deeper a transaction sits, the more settled it is.

The ledger lives on a peer-to-peer network where nodes collectively follow the consensus protocol to add and validate new blocks. No node is the master copy. That decentralization is the point: there is no account to close, no server to seize, no office to serve a court order. The same removal of a central party that the design celebrates as censorship resistance is what a regulator sees as the absence of anyone to hold responsible.

## Money outside the state

Put those properties together and you have value that moves between people without passing through any institution a government can lean on. For someone living under capital controls, who is legally barred from moving savings out of a collapsing currency, a ledger that no central bank operates is an exit. For a sanctioned entity cut off from the banking system, the same ledger is a payment rail that does not ask permission. The technology does not distinguish the dissident moving money past a censoring regime from the sanctioned actor moving money past an embargo. The neutrality is structural, the same neutrality that makes [[onion-routing-and-anonymity-networks|onion routing]] shield both a journalist and a criminal.

This is why blockchains sit squarely inside debates over [[cs/geopolitics/cyber-sovereignty|cyber sovereignty]]. A state's monetary power rests partly on its control of the rails that money runs on. A settlement system that runs on volunteer machines spread across many jurisdictions weakens that control by design. States respond not by breaking the math, which they cannot, but by pressuring the on-ramps and off-ramps, the exchanges where digital tokens become spendable national currency.

## Pseudonymity is not anonymity

The escape from control comes with a feature that cuts the other way. Because the ledger is public and permanent, every transaction is visible to everyone, forever. Addresses are not names, so the system is pseudonymous, but pseudonymity is fragile. Blockchain analysis studies the full, open record of payments, clustering addresses that move together and following the flow of funds across the chain. The moment a pseudonymous address touches an identified one, an exchange that collected a real name, a public donation address, a leaked wallet, the link can propagate outward through the graph and de-anonymize a swath of activity at once.

So a blockchain offers a strange bargain. It gives you money no authority can freeze, and in exchange it writes every payment you ever make into a permanent public record that a determined analyst can read backward. A traditional bank knows everything about your transactions but shows the world nothing; a public chain shows the world everything but starts out knowing nothing about you. Which of those is more private depends entirely on who is doing the looking, the central tension running through [[cs/geopolitics/surveillance-and-privacy|surveillance and privacy]] in this domain.

> [!example] Why a buried transaction is hard to reverse
> 1. You pay someone, and your transaction is bundled into a new block.
> 2. Through the consensus protocol, the network agrees that block belongs at the tip of the chain.
> 3. More blocks pile on top, each one committing to the hash of the block beneath it.
> 4. To erase your payment now, an attacker must rebuild your block and every block above it.
> 5. Then they must out-compete the entire honest network to make their rewritten chain the accepted one, which is the cost the design makes deliberately huge.

## Related Notes

- [[distributed-consensus|Distributed Consensus]], the agreement problem blockchains solve in an open, untrusted network rather than a controlled datacenter
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]], the contest between state control of money's rails and a settlement layer no state operates
- [[onion-routing-and-anonymity-networks|Onion Routing]], the same dual-use neutrality that shields both the dissident and the criminal
- [[cs/geopolitics/surveillance-and-privacy|Surveillance & Privacy]], pseudonymity versus chain analysis and the public permanent record

## Sources

- "Blockchain," Wikipedia. https://en.wikipedia.org/wiki/Blockchain . Supports the definition of a blockchain as a distributed ledger of blocks linked by cryptographic hashes, the append-only structure where altering a block requires redoing all subsequent blocks and obtaining network consensus, management by a peer-to-peer network whose nodes follow a consensus algorithm, the characterization as a distributed system with high Byzantine fault tolerance, the use as a public distributed ledger that solved the double-spending problem without a trusted authority or central server, the description as a payment rail, and blockchain analysis as a technique applied to the ledger.
- "Consensus (computer science)," Wikipedia. https://en.wikipedia.org/wiki/Consensus_%28computer_science%29 . Supports consensus as the problem of getting distributed processes to agree on a single data value despite faulty or unreliable processes, the need for fault-tolerant protocols, the majority-agreement approach, and blockchain as a named application of consensus.
- "Byzantine fault," Wikipedia. https://en.wikipedia.org/wiki/Byzantine_fault . Supports the Byzantine generals allegory in which actors must agree on a common strategy while some are unreliable in ways that make honest actors disagree, and the definition of Byzantine fault tolerance as a system's resilience to such conditions.
