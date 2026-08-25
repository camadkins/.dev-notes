---
title: Minuteman Guidance and the Integrated Circuit
description: How the military's need for small missile guidance computers kept the integrated circuit alive long enough to become cheap.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-01-28
updated:
aliases:
  - Minuteman guidance computer
  - D-17B
---

[[cs/history/the-integrated-circuit|The integrated circuit]] was invented at the end of the 1950s, and for a few years afterward it was a curiosity that almost nothing used. It was too expensive for industrial electronics and far too expensive for consumers. What carried it through those early years, and drove its price down to where the rest of the world could afford it, was the military's need to put a thinking computer inside a missile.

> [!note] The idea
> Military demand for small missile-guidance computers kept the integrated circuit alive in its expensive infancy and drove its price down until the rest of the world could afford it.

## The guidance problem

A ballistic missile has to compute its own course in flight, inside a package that is small, light, and rugged enough to survive launch. Minuteman I solved this with the Autonetics D-17B guidance computer, built from discrete parts: [[cs/history/the-transistor|more than 1,500 individual transistors]], along with thousands of diodes, capacitors, and resistors. That was close to the practical ceiling of pre-integrated electronics. To go smaller and more capable, the field needed a denser kind of part.

## The demand that built an industry

Two programs, Minuteman and [[cs/military-computing/apollo-guidance-computer-and-embedded-systems|Apollo]], needed exactly that, and they bought integrated circuits in volume when no one else would. NASA's Apollo program was the largest single consumer of integrated circuits between 1961 and 1965. The Minuteman missile program, together with U.S. Navy programs, accounted for essentially the entire integrated-circuit market of 4 million dollars in 1962.

## The price collapse

[[cs/geopolitics/semiconductor-supply-chains|Guaranteed military and space demand]] let manufacturers scale up production, and scale drove the price down hard. [[cs/history/moores-law|The average price of an integrated circuit fell]] from about 50 dollars in 1962 to 2.33 dollars in 1968. By 1968, government space and defense spending still accounted for 37 percent of a market that had grown to 312 million dollars, but chips had finally become cheap enough to reach industrial products, and soon after, consumer ones. The integrated circuit in every device you own descends, in part, from a missile that had to think for itself.

## Related Notes

- [[cs/military-computing/apollo-guidance-computer-and-embedded-systems|The Apollo Guidance Computer]], the other program that drove early integrated circuits
- [[cs/geopolitics/semiconductor-supply-chains|Semiconductor Supply Chains]], the modern shape of the industry this demand seeded
- [[cs/history/von-neumann-architecture|Von Neumann Architecture]], the machine these parts build
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "D-17B," Wikipedia. https://en.wikipedia.org/wiki/D-17B . Supports the D-17B as the Minuteman I guidance computer and its discrete-component construction (1,521 transistors and thousands of other parts).
- "Integrated circuit," Wikipedia. https://en.wikipedia.org/wiki/Integrated_circuit . Supports Minuteman and Apollo as the largest early buyers, Apollo as the largest single consumer from 1961 to 1965, Minuteman and Navy programs as essentially the entire 4 million dollar 1962 market, the 37 percent government share of a 312 million dollar market in 1968, and the price drop from about 50 dollars in 1962 to 2.33 dollars in 1968.
