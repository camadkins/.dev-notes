---
title: SIGABA, the Cipher That Was Never Broken
description: How one design idea, advancing the rotors irregularly, kept the U.S. wartime cipher machine secure while Enigma fell.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-02-24
updated:
aliases:
  - SIGABA
  - ECM Mark II
---

Rotor cipher machines were the strongest practical encryption of the Second World War, and most of them were broken. Enigma is the famous case. The principal American machine, SIGABA, was not broken, and the difference comes down to a single idea about how the machine moves.

> [!note] The idea
> A rotor machine is only as strong as the pattern in which its rotors turn. Enigma turned its rotors in a regular, predictable way. SIGABA turned them irregularly, in a pseudorandom pattern, which removed the regularity that codebreakers exploited.

## Rotors and their weakness

A rotor machine encrypts each letter by passing it through a stack of wired wheels, and after each letter one or more wheels advance, changing the wiring for the next letter. The security lives in that motion. In Enigma the wheels stepped like an odometer, in a fixed and predictable sequence. That regularity gave [[cryptography-codebreaking-and-the-nsa|cryptanalysts]] a foothold: knowing how the machine would move next is a large part of working backward to the message.

## Irregular stepping

SIGABA, also known as the ECM Mark II, was designed by William Friedman and Frank Rowlett to advance its main rotors in a complex, pseudorandom fashion rather than a regular one. The wheels still turned, but when and which ones turned was hard to predict, so the attacks that broke machines with simpler stepping became far harder. The machine bought its strength not from more rotors but from less predictable motion.

## Never broken

The record is blunt. No successful cryptanalysis of the machine during its service lifetime is publicly known. SIGABA carried high-level American traffic from the Second World War into the 1950s without a known break, a rare thing among the cipher machines of its era.

## Related Notes

- [[perfect-secrecy-and-the-one-time-pad|Perfect Secrecy and the One-Time Pad]], the theoretical ceiling SIGABA approached in practice
- [[cryptography-codebreaking-and-the-nsa|Cryptography, Codebreaking, and the NSA]], the wider codemaking and codebreaking story
- [[discrete-probability|Discrete Probability]], the randomness that irregular stepping imitates
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "SIGABA," Wikipedia. https://en.wikipedia.org/wiki/SIGABA . Supports SIGABA (the ECM Mark II) as a U.S. cipher machine used from World War II into the 1950s, its complex pseudorandom rotor stepping that made attacks effective against simpler machines like Enigma much harder, the statement that no successful cryptanalysis during its service is publicly known, and the roles of William Friedman and Frank Rowlett.
