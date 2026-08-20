---
title: Error-Correcting Codes for Noisy Channels
description: How carefully structured redundancy lets a receiver repair a corrupted message, the math that makes deep-space links and every storage device reliable.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-03-05
updated:
aliases:
  - error-correcting codes
  - Hamming code
  - Reed-Solomon
---

Every real communication channel corrupts some of what crosses it. A bit flips on a long radio link, a scratch crosses a disk, cosmic noise garbles a signal from deep space. Error-correcting codes let the receiver do more than notice the damage. They let it repair the damage, reconstructing the original message from a corrupted copy, with no second transmission. The need to communicate reliably over hostile and distant channels is what drove their invention.

> [!note] The idea
> Add carefully structured redundancy to a message, so that even after part of it is corrupted, the original can be rebuilt exactly. The point is reconstruction, not retransmission.

## Hamming codes

Richard Hamming, working at Bell Labs, published in 1950 a family of linear error-correcting codes that still bear his name. A Hamming code adds parity bits in a structured pattern, positioned so that different corrupted bits produce different patterns of failed parity checks. From which checks fail, the receiver can detect one-bit and two-bit errors and pinpoint and correct a single-bit error, all without asking for the data again.

## Reed-Solomon codes

Irving Reed and Gustave Solomon introduced their codes in 1960, and they handle harder damage. A Reed-Solomon code adds check symbols to the data, and with them it can locate and correct multiple corrupted symbols, including bursts of errors clustered together, which are exactly what a physical scratch or a fade on a channel produces.

## Reaching across the solar system

The marquee application is distance. Reed-Solomon coding encoded the digital pictures Voyager sent back to Earth, concatenated with convolutional codes, an approach that has since become widespread in deep-space and satellite communication and was used on Mars Pathfinder, Galileo, the Mars Exploration Rovers, and Cassini. A faint signal crossing billions of kilometers arrives full of errors, and the code reconstructs the picture anyway.

## The lesson

Reliable communication over an unreliable channel is the practical fulfillment of [[shannon-and-information-theory|Shannon's]] proof that such communication is possible at all. Error-correcting codes are how that promise is kept, in every hard drive, every wireless link, and every spacecraft sending data home.

## Related Notes

- [[shannon-and-information-theory|Shannon and Information Theory]], the proof that reliable communication is possible
- [[huffman-coding|Huffman Coding]], the compression side of coding theory
- [[discrete-probability|Discrete Probability]], the mathematics of errors and their correction
- [[gps-control-segment|The GPS Control Segment]], another system depending on clean signals from space
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "Hamming code," Wikipedia. https://en.wikipedia.org/wiki/Hamming_code . Supports Richard Hamming inventing the codes at Bell Labs and publishing in 1950, their nature as a family of linear error-correcting codes, and their use of parity bits to detect one-bit and two-bit errors and correct single-bit errors.
- "Reed-Solomon error correction," Wikipedia. https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction . Supports the introduction by Irving Reed and Gustave Solomon in 1960, the correction of multiple and burst errors via added check symbols, and the use in Voyager and later deep-space missions including Mars Pathfinder, Galileo, the Mars Exploration Rovers, and Cassini.
