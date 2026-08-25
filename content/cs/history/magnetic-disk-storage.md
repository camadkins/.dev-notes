---
title: Magnetic Disk Storage and Random Access
description: How the IBM RAMAC let a computer jump straight to any record, breaking the tyranny of sequential tape and reshaping how data is stored.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-02-01
updated:
aliases:
  - RAMAC
  - hard disk
  - random access
---

Before 1956, business data lived on punched cards and magnetic tape, and tape you read in order, from the beginning. The IBM RAMAC changed that. It gave a computer a way to jump straight to any record, and that one capability reshaped how data is stored and structured.

> [!note] The idea
> Random access. A moving head over a spinning disk can reach any location in roughly the same short time, instead of winding through a tape in sequence. That property reorganizes how software stores and finds data.

## The RAMAC

The IBM 305 RAMAC, announced in 1956, was the first commercial computer with a moving-head hard disk drive, the IBM 350. It stored five million characters, about the equivalent of 64,000 punched cards, on a unit that weighed over a ton and stood like a wardrobe. The name stood for Random Access Method of Accounting and Control, and random access was the whole selling point.

## Sequential versus random

Tape is sequential: [[cs/dsa/linked-list|to reach the millionth record you must pass the first 999,999]]. A disk is random-access: the head moves directly to the track that holds what you want. That difference is the line between batch processing of whole files and interactive lookup of single records, and it made real-time business computing possible.

![The memory hierarchy: small and fast at the top (registers, cache), large and slow at the bottom (disk, tape), with disk the random-access middle.](cs/history/assets/memory-hierarchy.svg)

## The memory hierarchy

[[cs/systems/memory-hierarchy-and-caching|Disk took its place in a hierarchy]]: fast, small, expensive memory such as [[cs/military-computing/whirlwind-and-core-memory|magnetic core]], and later RAM, on top, and slow, large, cheap storage such as tape at the bottom, with random-access disk in between. That layering still governs how systems are built, from CPU caches down to cloud object stores, and it shapes the design of [[cs/systems/file-systems|file systems]] and [[cs/dsa/bplus-tree|databases]] to this day.

## Related Notes

- [[cs/military-computing/whirlwind-and-core-memory|Whirlwind and Magnetic-Core Memory]], the fast layer above disk
- [[cs/systems/virtual-memory|Virtual Memory]], an abstraction built across the hierarchy
- [[cs/systems/file-systems|File Systems]], how random-access storage is organized
- [[cs/history/ibm-system-360|The IBM System/360]], the mainframe era this storage served
- [[cs/history/index|History of Computing]], the section index

## Sources

- "IBM 305 RAMAC," Wikipedia. https://en.wikipedia.org/wiki/IBM_305_RAMAC . Supports the 305 RAMAC (1956) as the first commercial computer with a moving-head hard disk drive (the IBM 350), its random-access design, and its capacity of five million characters, about 64,000 punched cards.
