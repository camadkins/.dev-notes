---
title: Fuzzing
description: "Why a test whose only verdict is crash-or-hang became the most productive bug finder in security, and how coverage feedback turned blind random input into a guided search."
draft: false
comments: true
tags:
  - cs
  - security
  - testing
date: 2026-02-14
updated:
aliases:
  - fuzz testing
  - fuzzer
  - coverage-guided fuzzing
---

Fuzzing began as a graduate class project that sounds too crude to work. In 1988, Barton Miller's students at Wisconsin fed random character streams to standard UNIX command-line utilities and watched what happened. What happened was that a quarter to a third of the programs crashed. No models of expected behavior, no crafted test cases, no specification of correctness. Just noise, poured in at high volume, and a single question asked of each program: did it fall over? That deliberately primitive setup is not a historical curiosity. It is the reason the technique scaled, and a version of it now runs continuously against much of the world's critical open-source code.

> [!note] The idea
> A fuzzer generates invalid, unexpected, or random inputs and watches the target for crashes, hangs, or failing assertions. Its power comes from an oracle so simple it is nearly free: a program passes if it survives and fails if it crashes, which sidesteps the hard problem of specifying what "correct output" even means. That universal, cheap verdict lets fuzzing run millions of inputs unattended, and modern coverage-guided fuzzers close a feedback loop on top of it, keeping the inputs that reach new code so a blind random process becomes a directed search toward untested paths.

## The technique, and its deliberately dumb oracle

Wikipedia's definition is the whole shape of it: fuzzing is "an automated software testing technique that involves providing invalid, unexpected, or random data as inputs to a computer program," which "is then monitored for exceptions such as crashes, failing built-in code assertions, or potential memory leaks." The genius is in what it refuses to do. Most testing drowns in the test oracle problem, the difficulty of deciding whether an output is right. Miller's project cut that knot. As Wikipedia records, "a program failed its test if it crashed or hung under the random input and was considered to have passed otherwise," an oracle that "was simple and universal to apply." Miller's own site puts the criterion identically: "if the application crashes or hangs, it is considerd to fail the test, otherwise it passes." A verdict that cheap is what makes automation at scale possible, because no human has to look at any single result.

The original numbers landed hard. Miller's team "was able to crash 25 to 33 percent of the utilities that they tested," published as "An Empirical Study of the Reliability of UNIX Utilities" in the Communications of the ACM in 1990. Random noise, it turned out, found bugs that careful hand-written tests had missed for years.

## Why crashes are security bugs, and why absence proves nothing

A crash is more than a robustness defect. In a memory-unsafe language a crash frequently marks a corrupted pointer or an out-of-bounds access, which is to say the raw material of a [[cs/security/buffer-overflows|buffer overflow]] or worse. Wikipedia is careful about the boundary: for a C program that overflows a buffer, "the program's [[cs/languages/common/undefined-behavior-as-a-contract|behavior is undefined]]," so it "may or may not crash." Crashes are a lower bound on the bugs present, not an upper bound. That cuts both ways, and it is the epistemic honesty at the center of the method: "fuzzing is used to demonstrate the presence of bugs rather than their absence. Running a fuzzing campaign for several weeks without finding a bug does not prove the program correct." Fuzzing is a bug finder, never a correctness proof.

## Coverage feedback: from dumb to guided

The modern leap is to stop fuzzing blind. A "dumb" mutation fuzzer like early AFL just "modifies a seed file by flipping random bits" and hoping. A coverage-guided (gray-box) fuzzer adds lightweight instrumentation: as Wikipedia describes, tools like "AFL and libFuzzer utilize lightweight instrumentation to trace [[cs/pl/intermediate-representations-and-ssa|basic block]] transitions exercised by an input," which "informs the fuzzer about the increase in code coverage during fuzzing." Now the loop has direction. An input that reaches a basic block no previous input touched is saved and mutated further; inputs that explore nothing new are discarded. Random generation supplies variety while coverage supplies a fitness signal, and the fuzzer effectively climbs toward the deep, rarely-exercised code where the interesting bugs hide. Wikipedia calls the result "extremely efficient vulnerability detection tools."

That efficiency is why fuzzing moved from a research trick to infrastructure. Google's OSS-Fuzz, launched in 2016, describes its own origin as a direct response to a fuzzable disaster: the Heartbleed vulnerability "was caused by a relatively simple memory buffer overflow bug that could have been detected by fuzzing," yet at the time "fuzzing was not widely used and was cumbersome for developers." OSS-Fuzz now runs continuous fuzzing as a free service for open-source projects, making a stage that was once a one-off experiment a permanent part of the [[cs/software-engineering/testing-strategies|testing pipeline]].

> [!tip] The lesson Miller drew is that simplicity scaled
> The reason random noise beat careful tests is not that noise is smart. It is that the crash-or-hang oracle is so cheap that you can run astronomically more of it, and volume plus a trivial verdict finds corner cases no human enumerates. Coverage feedback did not replace that principle; it aimed it. Keep the cheap universal oracle, add a signal that tells you when an input reached somewhere new, and let the machine grind.

## Related Notes

- [[cs/security/buffer-overflows|Buffer Overflows]], the memory-safety bug class that fuzzer-found crashes most often reveal
- [[cs/software-engineering/testing-strategies|Testing Strategies]], the broader pipeline into which continuous fuzzing now fits
- [[cs/security/memory-protections-aslr-dep-canaries|Memory Protections: ASLR, DEP, and Stack Canaries]], the runtime defenses that turn a latent memory bug into a detectable crash a fuzzer can catch
- [[cs/security/vulnerability-scoring-cve-and-cvss|CVE and CVSS: Naming and Scoring Vulnerabilities]], where the bugs a fuzzing campaign finds get identified and rated

## Sources

- "Fuzzing," Wikipedia. https://en.wikipedia.org/wiki/Fuzzing . Supports the definition of fuzzing as providing "invalid, unexpected, or random data" and monitoring for "crashes, failing built-in code assertions, or potential memory leaks," the 1988 origin and "25 to 33 percent" crash figure, the "simple and universal" crash-or-hang oracle, that a buffer-overflowing C program's behavior "is undefined" so it "may or may not crash," that fuzzing demonstrates "the presence of bugs rather than their absence," and that AFL and libFuzzer use "lightweight instrumentation to trace basic block transitions" for coverage guidance.
- Barton Miller, "Fuzz Testing of Application Reliability," University of Wisconsin-Madison. https://pages.cs.wisc.edu/~bart/fuzz/ . Supports the crash-or-hang oracle ("if the application crashes or hangs, it is considerd to fail the test, otherwise it passes") and the 1990 CACM paper "An Empirical Study of the Reliability of UNIX Utilities" by Miller, Fredriksen, and So.
- "OSS-Fuzz," Google. https://google.github.io/oss-fuzz/ . Supports that OSS-Fuzz launched in 2016 in response to Heartbleed, that the vulnerability "was caused by a relatively simple memory buffer overflow bug that could have been detected by fuzzing," and that OSS-Fuzz runs continuous fuzzing for open-source projects.
