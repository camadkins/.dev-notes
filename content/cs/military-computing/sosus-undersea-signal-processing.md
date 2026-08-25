---
title: SOSUS and Undersea Signal Processing
description: How the Navy learned to hear submarines across an ocean by analyzing sound in the frequency domain, a Cold War proving ground for signal processing.
draft: false
comments: true
tags:
  - cs
  - military
date: 2026-04-25
updated:
aliases:
  - SOSUS
  - Sound Surveillance System
---

A submarine is quiet, but it is not silent. Its machinery makes faint, low-frequency sound that carries a long way through water. Hearing that sound across an ocean, and telling it apart from waves, whales, and merchant ships, is a signal-processing problem. The Cold War system that solved it, SOSUS, was a proving ground for the frequency-domain analysis at the heart of modern signal processing.

> [!note] The idea
> The information is not in how loud a sound is but in its frequency content. Decompose a noisy recording into its component frequencies, and a submarine's machinery reveals itself as telltale spectral lines that a broadband listener would never pick out.

## Passive listening at scale

SOSUS, the Sound Surveillance System, was a passive sonar system built to track Soviet submarines. Passive means it only listened; [[cs/security/port-scanning-and-network-reconnaissance|it sent out no ping that could give it away]]. It consisted of bottom-mounted hydrophone arrays connected by [[cs/systems/physical-layer-of-the-internet|underwater cables]] to facilities ashore, where the listening and analysis happened.

## LOFAR, the spectral analyzer

The analysis was done by equipment called the Low Frequency Analyzer and Recorder, or LOFAR, based on AT&T's sound spectrograph and modified to analyze low-frequency underwater sound. A spectrograph takes a stretch of sound and shows how its energy is distributed across frequencies over time. [[cs/machine-learning/features-and-representations|That is spectral analysis]]: turning a wall of noise into a picture in which structure becomes visible.

## Detection in noise

Underneath the hardware is one of the core problems of signal processing and statistics: detection, the [[cs/statistics/hypothesis-testing|decision of whether a faint signal is actually present]] in a sea of noise, or whether you are fooling yourself. SOSUS made that decision continuously, at continental scale, for decades, before being officially declassified in 1991.

## Related Notes

- [[cs/military-computing/cryptography-codebreaking-and-the-nsa|Cryptography, Codebreaking, and the NSA]], the other great signals-analysis discipline
- [[cs/statistics/hypothesis-testing|Hypothesis Testing]], the statistics of deciding signal from noise
- [[cs/statistics/bayesian-inference|Bayesian Inference]], updating belief as faint evidence arrives
- [[cs/military-computing/index|Computing and the U.S. Military]], the cluster index

## Sources

- "SOSUS," Wikipedia. https://en.wikipedia.org/wiki/SOSUS . Supports SOSUS as a U.S. Navy passive-sonar submarine-detection system, its bottom-mounted hydrophone arrays connected by underwater cables to facilities ashore, the Low Frequency Analyzer and Recorder (LOFAR) based on AT&T's sound spectrograph for low-frequency spectral analysis, and its official declassification in 1991.
