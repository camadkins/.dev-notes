---
title: The First Electronic Computers
description: How the 1940s machines moved from electronics to the stored program, the feature that defines every computer since.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-05-02
updated:
aliases:
  - Colossus
  - Manchester Baby
  - first electronic computers
---

The 1940s produced the first computers built from electronics rather than gears and relays. Within a few years those machines gained the one feature that defines a modern computer: the stored program, instructions held in memory rather than wired into the machine.

> [!note] The idea
> A stored-program computer keeps its instructions in the same memory as its data. You redirect it by loading new instructions, not by rewiring it, which is what makes a single machine able to run any program.

## Electronic, but not yet stored-program

Colossus, [[cs/military-computing/cryptography-codebreaking-and-the-nsa|built by British codebreakers at Bletchley Park]] between 1943 and 1945, is regarded as the world's first programmable electronic digital computer. It was built to break the German Lorenz cipher, not [[cs/military-computing/sigaba-cipher-machine|Enigma]], which was the job of the earlier electromechanical Bombe. Across the Atlantic, [[cs/military-computing/ballistics-tables-and-eniac|ENIAC]] (1945) was general-purpose but was programmed by plugboard wiring and switches. Both machines were electronic, and neither yet held its program in memory.

## The stored-program leap

The decisive step was to store the program in memory alongside the data, the idea at the heart of the [[cs/history/von-neumann-architecture|von Neumann architecture]]. The Manchester Baby ran the first such program on 21 June 1948. It was a tiny machine built to prove a point, and the point was the most important one in computing: the modern computer's defining feature worked.

## Why it matters

Every general-purpose computer since is a stored-program electronic machine. Colossus and ENIAC proved that electronics could compute; the Baby proved the architecture that organizes how they compute. The [[cs/military-computing/eniac-programmers-and-the-first-software|people who programmed ENIAC]] were doing by plugboard what the stored program would soon let software do in memory.

## Related Notes

- [[cs/history/von-neumann-architecture|Von Neumann Architecture]], the stored-program model these machines reached
- [[cs/military-computing/ballistics-tables-and-eniac|Ballistics Tables and ENIAC]], the American general-purpose machine
- [[cs/military-computing/eniac-programmers-and-the-first-software|The ENIAC Programmers]], who programmed it by hand
- [[cs/history/magnetic-disk-storage|Magnetic Disk Storage]], the storage that came next
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Colossus computer," Wikipedia. https://en.wikipedia.org/wiki/Colossus_computer . Supports Colossus as a British codebreaking machine of 1943-1945 regarded as the world's first programmable electronic digital computer, used against the Lorenz cipher rather than Enigma.
- "Manchester Baby," Wikipedia. https://en.wikipedia.org/wiki/Manchester_Baby . Supports the Baby as the first electronic stored-program computer, running its first program on 21 June 1948, and the stored-program concept of holding program and data in the same memory.
