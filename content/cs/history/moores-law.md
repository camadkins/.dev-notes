---
title: Moore's Law
description: How one engineer's 1965 observation about chip density became the organizing forecast of the whole computing industry.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-01-01
updated:
aliases: []
---

In 1965 Gordon Moore noticed a pattern in how fast chips were improving and wrote it down. His observation became the organizing forecast of an entire industry, the reason performance growth was assumed, planned around, and ultimately delivered for half a century.

> [!note] The idea
> The number of transistors on a chip doubles about every two years, at little extra cost per transistor. It is an empirical observation, not a law of nature, but treating it as a deadline helped make it self-fulfilling.

## What Moore said

Moore, a co-founder of Intel, projected in 1965 that the number of components on a chip would keep doubling, and he revised the rate to roughly every two years in 1975. Despite the name, Moore's law describes an empirical relationship rather than a scientific law; it held because the industry organized itself around keeping it true.

![Transistors per chip on a logarithmic scale climb in a straight line: a doubling roughly every two years.](cs/history/assets/moores-law-curve.svg)

## Why it mattered

Doubling density every two years meant [[cs/math/logarithms-and-exponentials|exponential growth in computing power]], a driving force behind decades of technological and economic change. Software could be written on the assumption that next year's hardware would be faster, a free lunch that lasted until the underlying physics began to slow.

## Connected

Moore's law is the macro-scale consequence of shrinking [[cs/history/the-mosfet|MOSFETs]] and packing more of them onto each [[cs/history/the-integrated-circuit|integrated circuit]]. When straightforward shrinking began to falter, the industry turned to [[cs/systems/numa-and-multiprocessor-memory|multicore processors]] and specialized chips to keep the gains coming, which is why [[cs/geopolitics/semiconductor-supply-chains|who can fabricate the smallest transistors]] became a matter of national strategy.

## Related Notes

- [[cs/history/the-integrated-circuit|The Integrated Circuit]], the thing whose density doubles
- [[cs/history/the-mosfet|The MOSFET]], the device being shrunk
- [[cs/history/the-microprocessor|The Microprocessor]], the product that rode the curve
- [[cs/geopolitics/semiconductor-supply-chains|Semiconductor Supply Chains]], the geopolitics of the frontier
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Moore's law," Wikipedia. https://en.wikipedia.org/wiki/Moore%27s_law . Supports the observation that transistor counts double about every two years at minimal added cost, its statement by Gordon Moore in 1965 and revision in 1975, its nature as an empirical relationship rather than a physical law, and its role driving exponential growth in computing.
