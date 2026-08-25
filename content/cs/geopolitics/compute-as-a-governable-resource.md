---
title: "Compute as a Governable Resource"
description: Why compute, not code or data, became the natural lever for governing AI - it is measurable in FLOP, it concentrates in a few hands and physical locations, and it can be metered with thresholds and choked with export controls.
draft: false
comments: true
tags:
  - cs
  - geopolitics
date: 2026-06-28
updated:
aliases:
  - compute governance
  - FLOP threshold
---

A government that wants to govern artificial intelligence has to grab onto something it can actually see and count. The model's weights are a file that copies in seconds. The training data is scattered across the open web and private archives, diffuse and hard to define. But the third ingredient, the raw computation that turns data into a model, is different. A frontier training run needs a large, power-hungry cluster of advanced chips running for weeks, drawing megawatts, sitting in a building someone owns. That physical, expensive, hard-to-hide quality is why compute has become the lever regulators reach for first.

> [!note] The idea
> Of the three inputs to a frontier model, code, data, and compute, only compute is uniquely measurable, concentrated, and governable. Code copies freely and data is diffuse, so neither makes a clean control point. Compute is a physical quantity you can measure in floating-point operations, it concentrates in a handful of firms and data centers because the chips are scarce and the power bills are enormous, and it can be governed both by metering training runs against numeric thresholds and by restricting who can buy the chips. That combination, measurable plus concentrated plus chokeable, is what makes compute the natural instrument for governing AI.

## Compute is a quantity you can measure

Computation has a unit. [[cs/standards/ieee-754-floating-point|FLOPS stands for floating point operations per second]], a standard measure of computer performance, and the total work of a training run is counted in floating-point operations (FLOP), the running multiply-and-add steps a model performs as it learns. Unlike "how good is this model," which is fuzzy and contested, the size of a training run is a number you can estimate in advance from the chips used and the time they ran. That measurability is the precondition for governance. You cannot put a threshold on a quantity you cannot count, and [[cs/history/deep-learning-revolution|the deep learning revolution]] made the relevant quantity legible: progress over the last decade has tracked, more than anything, the sheer scale of compute poured into training.

A threshold also gives regulators a knob that scales with capability without naming any specific model. Set a line in FLOP, and the rule automatically catches tomorrow's larger runs while leaving smaller, lower-risk work untouched.

## Why it concentrates, unlike code or data

Code and data resist control because they spread. An open-weights model, once released, is mirrored everywhere within hours, and there is no recall. Training data is even harder to pin down, since it is assembled from countless sources and no single party holds the canonical copy. Compute behaves the opposite way. The advanced chips capable of frontier training come from a very short list of designers and an even shorter list of fabs, the clusters that assemble thousands of them are owned by a handful of cloud providers and labs, and the electricity and cooling they demand tie them to specific physical sites. This is the link to [[cs/geopolitics/semiconductor-supply-chains|semiconductor supply chains]]: the chokepoints in chip manufacturing are exactly what makes compute concentrated, and concentration is what makes it governable. You can audit a data center. You cannot audit every copy of a leaked file.

## Thresholds: metering the training run

The first governance mechanism is to meter compute and regulate above a line. The EU AI Act treats general-purpose models that require more than 10^25 floating-point operations to train as posing systemic risk, and those high-impact models must undergo extra obligations including model evaluation and adversarial testing. The exponent is doing real work here: it is a bet that capability rises with scale, so the largest runs warrant the most scrutiny. The United States has pursued a parallel logic through compute-reporting requirements, where developers of the largest training runs must notify the government, again keyed to a numeric compute threshold rather than to any judgment about the model itself. In both cases the design principle is the same, regulate the measurable quantity, and let the threshold sort frontier work from routine work. This is the demand side of [[cs/geopolitics/ai-governance|AI governance]]: rules that bite at the moment a run crosses a counted line.

## Export controls: the enforcement arm

A threshold only constrains the people willing to comply. The harder edge of compute governance is controlling who can obtain the chips at all. Effective October 7, 2022, [[cs/law/the-export-administration-regulations|the United States implemented new export controls]] targeting the People's Republic of China's ability to access and develop advanced computing and semiconductor manufacturing, restricting the sale of the most capable AI accelerators and the equipment used to make them. The move only works because of the same property that makes thresholds workable: compute is concentrated at a few physical chokepoints, so cutting off the chips is a tractable act of policy in a way that cutting off code or data never could be. Export controls turn the supply chain itself into the enforcement mechanism, an exercise of leverage that sits alongside [[cs/geopolitics/cyber-sovereignty|cyber sovereignty]] as states try to draw borders around a borderless technology.

> [!example] What a FLOP threshold means in hardware
> A line drawn in FLOP is implicitly a line drawn in chips, time, and money. A run on the order of 10^25 floating-point operations is not something you do on a workstation. It implies thousands of top-tier AI accelerators running in parallel for weeks, a dedicated cluster, a serious power and cooling budget, and a bill that runs into the millions of dollars. That is the whole point of choosing compute as the control surface: the threshold is hard to cross quietly, because crossing it requires hardware that is expensive, scarce, and physically conspicuous. The number on the page maps to a building full of chips that someone had to buy.

## Related Notes

- [[cs/history/deep-learning-revolution|The Deep Learning Revolution]] - why capability tracked compute scale, making the quantity worth governing
- [[cs/geopolitics/semiconductor-supply-chains|Semiconductor Supply Chains]] - the manufacturing chokepoints that make compute concentrated and therefore chokeable
- [[cs/geopolitics/ai-governance|AI Governance]] - the regulatory demand side, where FLOP thresholds turn into legal obligations
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]] - export controls as one front in states drawing borders around technology

## Sources

- "Artificial Intelligence Act," Wikipedia. https://en.wikipedia.org/wiki/Artificial_Intelligence_Act . Supports the EU AI Act treating general-purpose models that require more than 10^25 floating-point operations to train as posing systemic risk, with those models subject to extra evaluation and adversarial testing.
- "Floating point operations per second," Wikipedia. https://en.wikipedia.org/wiki/FLOPS . Supports FLOPS standing for floating point operations per second and being a standard measure of computer performance.
- "United States New Export Controls on Advanced Computing and Semiconductors to China," Wikipedia. https://en.wikipedia.org/wiki/United_States_New_Export_Controls_on_Advanced_Computing_and_Semiconductors_to_China . Supports the United States implementing new export controls effective October 7, 2022 targeting the PRC's ability to access and develop advanced computing and semiconductor manufacturing.
