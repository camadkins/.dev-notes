---
title: Leibniz and Binary
description: How Leibniz worked out the two-symbol number system that, centuries later, every computer would run on.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-03-21
updated:
aliases: []
---

Gottfried Leibniz did more than build a [[cs/history/pascaline-and-stepped-reckoner|calculating machine]]. He worked out the number system that every computer would eventually run on, centuries before there was a computer to run it.

> [!note] The idea
> Represent every number with just two symbols, 0 and 1. Two symbols map perfectly onto two physical states, on or off, high or low, which is why binary, not decimal, became the native language of machines.

## Two symbols

Binary represents the natural numbers using only 0 and 1. [[cs/math/logarithms-and-exponentials|Each position is a power of two]], so [[cs/dsa/bitwise-operations|a string of bits is a sum of the powers whose bit is 1]].

![Binary place values: the bits 1101 stand for 8 + 4 + 1, which is 13.](cs/history/assets/binary-place-values.svg)

## Leibniz's binary

Leibniz is credited with the invention of the modern binary system. He wrote more than a hundred manuscripts on it, and his best-known account, Explication de l'Arithmetique Binaire, was published in 1703. For Leibniz the appeal was partly philosophical, a system that built every number from a kind of something and nothing.

## Why it won

Binary had to wait a long time to matter. Its decisive advantage is physical: two symbols match two-state devices exactly, first relays, then transistors, where decimal would need ten distinguishable levels and far more fragile hardware. [[cs/standards/ieee-754-floating-point|Almost all modern computers use binary]] for this reason. Paired with [[cs/history/boole-and-boolean-algebra|Boole's two-valued logic]], it is half of what [[cs/history/shannon-boolean-algebra-switching|Shannon]] later wired into circuits.

## Related Notes

- [[cs/history/boole-and-boolean-algebra|George Boole and the Algebra of Logic]], the two-valued logic that pairs with binary
- [[cs/history/shannon-boolean-algebra-switching|Shannon's Master's Thesis]], where binary and logic met hardware
- [[cs/history/pascaline-and-stepped-reckoner|Pascal, Leibniz, and Mechanizing Arithmetic]], Leibniz's other contribution
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Binary number," Wikipedia. https://en.wikipedia.org/wiki/Binary_number . Supports Leibniz being credited with the invention of the modern binary system, his publication of Explication de l'Arithmetique Binaire in 1703 and his many manuscripts on binary, the use of only the two symbols 0 and 1, and the fact that almost all modern computers use binary.
