---
title: Logarithms and Exponentials
description: "The inverse pair that turns multiplication into addition, why the base is only ever a constant factor, and how one identity ends up underneath both O(log n) and the bit."
draft: false
comments: true
tags:
  - cs
  - math
  - algorithms
date: 2026-01-22
updated:
aliases:
  - logarithms
  - exponentials
  - natural-logarithm
  - change-of-base
---

## Two Names for the Same Relationship

Start with the definition, which is entirely about exponents. "In mathematics, the logarithm of a number is the exponent by which another fixed value, the base, must be raised to produce that number. For example, the logarithm of 1000 to base 10 is 3, because 1000 is 10 to the 3rd power." Written generally, "if x = b^y, then y is the logarithm of x to base b, written log_b x = y, so log_10 1000 = 3." The two operations are the same relationship read in opposite directions: "as a single-variable function, the logarithm to base b is the inverse of exponentiation with base b."

The exponential side is characterized by a property rather than a construction. "In mathematics, the exponential function is the unique real function which maps zero to one and has a derivative everywhere equal to its value." That is a strange and strong sentence: the function is pinned down completely by "my slope is my height." Geometrically, the identity $\frac{d}{dx}e^{x} = e^{x}$ "means that the slope of the tangent to the graph at each point is equal to its height (its y-coordinate) at that point." The resulting curve "is upward-sloping, and increases faster than every power of $x$," and it "always lies above the x-axis, but becomes arbitrarily close to it for large negative x."

> [!note] The idea
> The load-bearing property is not inversion, it is that each function trades one arithmetic operation for another. "The exponential function converts sums to products: $\exp(x + y) = \exp x \cdot \exp y$. Its inverse function, the natural logarithm, $\ln$ or $\log$, converts products to sums: $\ln(x \cdot y) = \ln x + \ln y$." Every appearance of a logarithm in computing is that trade being cashed in. It was the original motive, since logarithms were "introduced by John Napier in 1614 as a means of simplifying calculations," which worked "because the logarithm of a product is the sum of the logarithms of the factors." The modern uses are the same move applied to two different multiplicative quantities: problem sizes that shrink by a constant factor per step, and probabilities of independent events that multiply. Turn either into a sum and you get a count you can reason about linearly.

## The History Was a Computing Problem

The first users of logarithms were not mathematicians looking for elegance. "They were rapidly adopted by navigators, scientists, engineers, surveyors, and others to perform high-accuracy computations more easily. Using logarithm tables, tedious multi-digit multiplication steps can be replaced by table look-ups and simpler addition." Hardware followed: "the slide rule, also based on logarithms, allows quick calculations without tables, but at lower precision."

The naming is literal. "Napier coined the term for logarithm in Middle Latin, logarithmus, literally meaning 'ratio-number', derived from the Greek logos 'proportion, ratio, word' + arithmos 'number'." The pairing with the exponential came later: "the present-day notion of logarithms comes from Leonhard Euler, who connected them to the exponential function in the 18th century, and who also introduced the letter e as the base of natural logarithms."

## The Base Is a Constant Factor

"Among all choices for the base, three are particularly common. These are b = 10, b = e (the irrational mathematical constant e ≈ 2.71828183 ), and b = 2 (the binary logarithm)." Switching among them costs a division:

$$\log_b x = \frac{\log_k x}{\log_k b}$$

which is the statement that "the logarithm $\log_b x$ can be computed from the logarithms of x and b with respect to an arbitrary base k."

For complexity analysis that identity has a specific consequence, and the article states it as a rule rather than a convenience. Discussing binary search and merge sort, it notes that "the base of the logarithm is not specified here, because the result only changes by a constant factor when another base is used. A constant factor is usually disregarded in the analysis of algorithms under the standard uniform cost model." An unqualified $\log n$ in a running time is therefore not sloppy notation, it is a claim that the base cannot matter.

Which base a bare `log` means depends on who is writing. "In computer science and information theory, log often refers to binary logarithms (base 2)," while "in mathematics log x usually refers to the natural logarithm (base e)," and in measurement and engineering contexts "log x still often means the base ten logarithm." The binary case earns its dominance honestly: binary logarithms are "used in computer science, where the binary system is ubiquitous."

> [!example]
> Base 10 counts decimal digits. "log10 (x) is related to the number of decimal digits of a positive integer x: The number of digits is the smallest integer strictly bigger than log10 (x)." Check it on the article's own case: "log10(5986) is approximately 3.78 . The next integer above it is 4, which is the number of digits of 5986."
>
> Base 2 does the same job for storage. "Any natural number N can be represented in binary form in no more than log2 N + 1 bits. In other words, the amount of memory needed to store N grows logarithmically with N." Doubling the largest value a counter must hold costs one more bit, not twice the memory. That is the sums-to-products trade showing up as a hardware budget.

## Growth Rates

The two functions sit at opposite extremes of the growth spectrum, and both extremes get used deliberately.

Exponential growth is defined by proportionality to the current value: functions of the form $f(x) = ab^{x}$ "grow or decay exponentially in that the rate that $f(x)$ changes when $x$ is increased is proportional to the current value of $f(x)$." That self-reinforcement is why $e^{x}$ "increases faster than every power of $x$," and it is the reason an exponential-time algorithm is not merely slower than a polynomial one but categorically out of reach past small inputs.

The logarithm is the mirror image, and its slowness is the point. "Because the logarithmic function log(x) grows very slowly for large x, logarithmic scales are used to compress large-scale scientific data." The formal label: "a function f(x) is said to grow logarithmically if f(x) is (exactly or approximately) proportional to the logarithm of x."

## In Algorithm Analysis

"Analysis of algorithms is a branch of computer science that studies the performance of algorithms (computer programs solving a certain problem). Logarithms are valuable for describing algorithms that divide a problem into smaller ones, and join the solutions of the subproblems." The connection is one of self-similarity: "logarithms appear in the analysis of algorithms that solve a problem by dividing it into two similar smaller problems and patching their solutions."

Two canonical instances. For search: "to find a number in a sorted list, the binary search algorithm checks the middle entry and proceeds with the half before or after the middle entry if the number is still not found. This algorithm requires, on average, log2 (N) comparisons, where N is the list's length." For sorting: "the merge sort algorithm sorts an unsorted list by dividing the list into halves and sorting these first before merging the results. Merge sort algorithms typically require a time approximately proportional to N · log(N)."

The [[cs/dsa/logarithmic-functions|DSA-side treatment]] covers the identities and floor/ceiling handling that show up when you turn these into concrete instruction counts. See also [[cs/dsa/asymptotic-notation|Asymptotic Notation]] for the machinery that lets the base be dropped.

## In Information Theory

The unit of information is a logarithm by construction. "Both the natural logarithm and the binary logarithm are used in information theory, corresponding to the use of nats or bits as the fundamental units of information, respectively." In the simplest case, "if a message recipient may expect any one of N possible messages with equal likelihood, then the amount of information conveyed by any one such message is quantified as log2 N bits."

The general definition weights that by probability. "In information theory, the entropy of a random variable quantifies the average level of uncertainty or information associated with the variable's potential states or possible outcomes," and for a discrete random variable $X$ distributed according to $p$,

$$\mathrm{H}(X) := -\sum_{x \in \mathcal{X}} p(x) \log p(x)$$

Base selection is again a choice of unit rather than of substance: "the choice of base for log, the logarithm, varies for different applications. Base 2 gives the unit of bits (or "shannons"), while base e gives "natural units" nat, and base 10 gives units of "dits", "bans", or "hartleys"." Those units "are constant multiples of each other," exactly as change of base predicts.

Why a logarithm and not some other decreasing function of probability? Because the surprisal of an event $E$ is $\log(1/p(E))$, "which gives 0 surprise when the probability of the event is 1. In fact, log is the only function that satisfies a specific set of conditions defined in section § Characterization." Uniqueness, not convention.

The additivity it buys is visible in the smallest example. "In case of a fair coin toss, heads provides log2(2) = 1 bit of information, which is approximately 0.693 nats or 0.301 decimal digits. Because of additivity, n tosses provide n bits of information." Independent outcomes multiply in probability and add in information, which is the sums-to-products identity in its most consequential form.

The consequence is a hard bound rather than a heuristic. "The concept of information entropy was introduced by Claude Shannon in his 1948 paper "A Mathematical Theory of Communication", and is also referred to as Shannon entropy," and Shannon "proved in his source coding theorem that the entropy represents an absolute mathematical limit on how well data from the source can be losslessly compressed onto a perfectly noiseless channel." That limit is approachable in practice: "the minimum channel capacity can be realized in theory by using the typical set or in practice using Huffman, Lempel–Ziv or arithmetic coding."

> [!warning]
> The inverse relationship carries domain restrictions that are easy to lose in code. A logarithm is defined for "a positive real number x with respect to base b" given "a positive real number b such that b ≠ 1." Beyond the reals the function stops being single-valued at all: "in general settings, the logarithm tends to be a multi-valued function. For example, the complex logarithm is the multi-valued inverse of the complex exponential function." A related multi-valued case is load-bearing for security, since "the discrete logarithm is the multi-valued inverse of the exponential function in finite groups; it has uses in public-key cryptography."

## Related Notes

- [[cs/dsa/logarithmic-functions|Logarithmic Functions]] - the algorithms-side treatment, with identities, bit lengths, and tree heights
- [[cs/dsa/asymptotic-notation|Asymptotic Notation]] - why the constant factor from a base change disappears
- [[cs/dsa/binary-search|Binary Search]] - the halving search whose comparison count is a base-2 logarithm
- [[cs/dsa/divide-and-conquer|Divide and Conquer]] - the self-similar decomposition that logarithms describe
- [[cs/military-computing/shannon-and-information-theory|Shannon and Information Theory]] - entropy, source coding, and the bit as a unit
- [[cs/dsa/huffman-coding|Huffman Coding]] - one of the codes that approaches the entropy bound
- [[derivatives-and-gradients|Derivatives and Gradients]] - the derivative property that defines the exponential function

## Sources

- [Logarithm (Wikipedia)](https://en.wikipedia.org/wiki/Logarithm) - the exponent definition and inverse relationship, Napier's 1614 introduction and the etymology, log tables and slide rules, Euler's connection to the exponential and the letter e, the three common bases and change-of-base formula, digit counting, discipline-specific notation, slow growth and logarithmic scales, binary search and merge sort costs, the constant-factor argument for dropping the base, binary storage size, nats versus bits, and the complex and discrete logarithm as multi-valued inverses.
- [Exponential function (Wikipedia)](https://en.wikipedia.org/wiki/Exponential_function) - the derivative-equals-value characterization, the tangent-slope reading of the graph, growth faster than every power of x, the sums-to-products identity and its inverse, and the definition of exponential growth as a rate proportional to the current value.
- [Entropy (information theory) (Wikipedia)](https://en.wikipedia.org/wiki/Entropy_%28information_theory%29) - entropy as average uncertainty, the summation formula, the base-to-unit mapping, the uniqueness of the logarithm as the surprisal function, additivity across coin tosses, Shannon's 1948 paper, the source coding theorem as a compression limit, and the practical codes that realize it.
