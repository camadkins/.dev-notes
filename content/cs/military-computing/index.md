---
title: Computing & the U.S. Military
description: How computing technology evolved through U.S. military history - ballistics tables to ENIAC, SAGE, ARPANET, GPS, cryptanalysis, and the cyber domain, told from a computer-science perspective.
draft: false
comments: false
tags:
  - cs
  - military
date: 2026-06-18
updated:
aliases: []
---

Much of modern computing was not born in a garage - it was born from a military requirement. Artillery firing tables drove the first programmable electronic computer. Air defense drove real-time interactive computing. Surviving a nuclear strike drove packet switching. Navigation drove a planetary-scale distributed system. Each breakthrough started as a problem someone in uniform needed solved.

This cluster re-tells the arc of computing as a sequence of those problems, **from a computer-science perspective**. Every note here is anchored to one CS concept - programmability, real-time systems, packet switching, distributed time, cryptanalysis, network security - using the military history as the frame and the CS as the payload. Where these notes touch the broader story, they cross-link into [[cs/history/index | History of Computing]].

> [!note] Scope
> These notes stay on **published, historical, citable** material only - no operational or current-posture detail. The value here is the engineering lineage, not the operations.

### The Arc

#### 1940s - Computation Becomes a Machine
The shift from human "computers" calculating trajectories by hand to the first general-purpose programmable electronic machine.

- [[cs/military-computing/ballistics-tables-and-eniac|Ballistics Tables & ENIAC]] - programmability is born

#### 1950s - Computers Become Real-Time and Interactive
Cold War air defense forces computing to react in real time, drive interactive displays, and link sites over wires.

- [[cs/military-computing/sage-and-real-time-systems|SAGE & Real-Time Systems]] - real-time, interactive, networked

#### The Machines That Made It Possible (1950s to 1970s)
The hardware lineage underneath the systems above, from the first real-time computer to massively parallel and vector supercomputers.

- [[cs/military-computing/whirlwind-and-core-memory|Whirlwind & Magnetic-Core Memory]] - random-access memory, real-time computing
- [[cs/military-computing/anfsq7-and-fault-tolerant-hardware|The AN/FSQ-7 & Fault-Tolerant Hardware]] - redundancy and fault tolerance
- [[cs/military-computing/apollo-guidance-computer-and-embedded-systems|The Apollo Guidance Computer]] - embedded systems, priority scheduling
- [[cs/military-computing/minuteman-guidance-and-integrated-circuits|Minuteman Guidance & the Integrated Circuit]] - the military demand that built the chip industry
- [[cs/military-computing/harvest-and-nsa-supercomputing|IBM Harvest & NSA Supercomputing]] - special-purpose hardware acceleration
- [[cs/military-computing/illiac-iv-and-parallel-processing|ILLIAC IV & Parallel Processing]] - SIMD parallelism
- [[cs/military-computing/cray-1-and-vector-processing|The Cray-1 & Vector Processing]] - vector data-parallelism

#### Software, Languages, and the People Who Built It
How programming itself became a discipline, from the first programmers and compilers to mandated languages and ultra-reliable flight code.

- [[cs/military-computing/eniac-programmers-and-the-first-software|The ENIAC Programmers & the Invention of Programming]] - programming as distinct from hardware
- [[cs/military-computing/grace-hopper-and-the-compiler|Grace Hopper & the Birth of the Compiler]] - compilers, high-level languages
- [[cs/military-computing/jovial-and-command-control-languages|JOVIAL & Languages for Command and Control]] - domain-specific systems languages
- [[cs/military-computing/multics-and-time-sharing-foundations|Multics & the Engineering of Time-Sharing]] - time-sharing, segmentation, protection rings
- [[cs/military-computing/nato-conferences-and-software-engineering|The NATO Conferences & the Software Crisis]] - software engineering as a discipline
- [[cs/military-computing/ada-and-language-standardization|Ada & Language Standardization by Mandate]] - standardization, strong typing
- [[cs/military-computing/margaret-hamilton-and-reliable-software|Margaret Hamilton & Ultra-Reliable Software]] - error detection and recovery

#### 1960s to 1990s - Networks Become Survivable, Then Universal
The requirement to keep command-and-control alive through a nuclear strike produces packet switching, and the decades after wire it into a universal, self-synchronizing fabric.

- [[cs/military-computing/paul-baran-and-packet-switching|Paul Baran & the Birth of Packet Switching]] - distributed networks, hot-potato routing
- [[cs/military-computing/arpanet-survivable-communications|ARPANET & Survivable Communications]] - packet switching, fault tolerance
- [[cs/military-computing/imp-the-first-router|The IMP, the First Router]] - store-and-forward packet switching
- [[cs/military-computing/internetworking-prnet-satnet|Cerf, Kahn & the Internetworking Problem]] - gateways, layered protocols
- [[cs/military-computing/dod-model-and-tcp-ip-standardization|The DoD Model & the TCP/IP Flag Day]] - layered reference models
- [[cs/military-computing/alohanet-random-access|ALOHAnet & Random Access]] - random-access channel arbitration
- [[cs/military-computing/link-16-tactical-data-links|Link 16 & Time-Slotted Tactical Data]] - TDMA scheduling
- [[cs/military-computing/ntp-distributed-clock-synchronization|NTP & Distributed Clock Synchronization]] - synchronizing clocks across a network
- [[cs/military-computing/gps-control-segment|The GPS Control Segment]] - distributed state estimation and feedback control

#### 1940s-present - Secrecy Becomes a Compute Race
Codemaking and codebreaking turn cryptography into one of the earliest and largest drivers of raw computing power.

- [[cs/military-computing/cryptography-codebreaking-and-the-nsa|Cryptography, Codebreaking & the NSA]] - cryptanalysis as a computing driver
- [[cs/military-computing/shannon-and-information-theory|Shannon & Information Theory]] - information measured in bits
- [[cs/military-computing/perfect-secrecy-and-the-one-time-pad|Perfect Secrecy & the One-Time Pad]] - provably unbreakable, and its cost
- [[cs/military-computing/sigaba-cipher-machine|SIGABA, the Cipher That Was Never Broken]] - irregular rotor stepping
- [[cs/military-computing/venona-and-one-time-pad-reuse|VENONA & the Cost of Reusing a One-Time Pad]] - implementation, not algorithm, fails
- [[cs/military-computing/des-standardization-and-symmetric-crypto|DES & the Politics of a Standard Cipher]] - symmetric ciphers, key length, trust
- [[cs/military-computing/rsa-and-computational-hardness|RSA & Computational Hardness]] - public-key crypto from hard problems
- [[cs/military-computing/bell-lapadula-and-mandatory-access-control|Bell-LaPadula & Mandatory Access Control]] - confidentiality as a formal model
- [[cs/military-computing/tcsec-and-graded-assurance|The Orange Book & Graded Assurance]] - rating trustworthiness on a scale

#### 1970s-1990s - Position Becomes a Distributed System
Military navigation yields a working, planetary-scale distributed system built on precise time.

- [[cs/military-computing/gps-and-distributed-time|GPS & Distributed Time]] - distributed systems, time synchronization

#### 2000s-present - Conflict Adds a Fifth Domain
Military doctrine absorbs network security, exploitation, and electronic warfare as core computer-science disciplines.

- [[cs/military-computing/cyber-warfare-and-the-fifth-domain|Cyber Warfare & the Fifth Domain]] - network security, the cyber domain
- [[cs/military-computing/morris-worm-and-buffer-overflows|The Morris Worm & the Buffer Overflow]] - the buffer-overflow vulnerability class
- [[cs/military-computing/stuxnet-and-cyber-physical-exploitation|Stuxnet & Cyber-Physical Exploitation]] - chained exploits that cross into the physical world

#### The Navy at Sea
Computing afloat, from mechanical fire control to digital combat systems, undersea acoustics, inertial navigation, and the Navy's own codebreakers.

- [[cs/military-computing/naval-tactical-data-system|The Naval Tactical Data System]] - real-time computing, sensor fusion
- [[cs/military-computing/ford-rangekeeper-analog-fire-control|The Ford Rangekeeper & Analog Fire Control]] - analog computation
- [[cs/military-computing/sosus-undersea-signal-processing|SOSUS & Undersea Signal Processing]] - spectral analysis, detection in noise
- [[cs/military-computing/sins-polaris-inertial-navigation|Inertial Navigation & the Missile Submarine]] - dead-reckoning state estimation
- [[cs/military-computing/an-uyk-navy-standard-computers|The AN/UYK Family, the Navy's Standard Computers]] - standardized embedded computing
- [[cs/military-computing/naval-cryptology-roof-gang|OP-20-G & the On-the-Roof Gang]] - naval cryptanalysis

#### Bridges Into the Rest of the Garden
Military computing that reaches straight into the quantitative and AI clusters: randomized algorithms, error-correcting codes, and the funding behind artificial intelligence.

- [[cs/military-computing/monte-carlo-method-and-the-bomb|Monte Carlo & the Bomb]] - randomized algorithms
- [[cs/military-computing/error-correcting-codes-military-comms|Error-Correcting Codes for Noisy Channels]] - Hamming & Reed-Solomon codes
- [[cs/military-computing/darpa-and-the-funding-of-ai|DARPA & the Funding of AI]] - the money behind machine intelligence

### Roadmap

Planned notes, not yet scaffolded - each will follow the same one-concept, CS-payload form:

- **Semiconductors & Defense Funding** - the DoD (Minuteman, Apollo) as the early integrated-circuit customer that bootstrapped the chip industry.
- **Military Simulation & Real-Time 3D** - SIMNET and Distributed Interactive Simulation as ancestors of networked graphics.
- **Autonomy, Drones & Guidance** - the control theory and machine learning underneath uncrewed systems.

### How This Cluster Connects

The throughline runs straight into the general computing history notes:

- [[cs/history/von-neumann-architecture|Von Neumann Architecture]] - the stored-program idea ENIAC's successors realized
- [[cs/history/history-of-the-internet|History of the Internet]] - what ARPANET became
- [[cs/history/turing-and-computability|Turing & Computability]] - the theory behind codebreaking and computation

---

*The full file listing follows below, generated automatically by Quartz.*
