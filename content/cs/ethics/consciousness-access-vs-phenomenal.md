---
title: "Consciousness: Access vs Phenomenal"
description: "The single distinction that makes the whole AI-consciousness debate tractable: access consciousness is information available for reasoning and report, which a machine could plainly have, while phenomenal consciousness is the felt 'what it is like', which no functional test settles, and which is what the moral status of an AI actually hangs on."
draft: false
comments: true
tags:
  - cs
  - ethics
  - philosophy
  - ai
date: 2026-06-29
updated:
aliases:
  - access consciousness
  - phenomenal consciousness
  - what it is like
  - the hard problem
---

Ask whether a system is conscious and the conversation usually collapses into two different questions wearing one word. One question is whether information inside the system is available to drive reasoning, speech, and action. The other is whether there is any felt quality to being that system at all, any inner view from the inside. [[cs/deep-learning/attention-and-transformers|A large language model]] can clearly do the first kind of thing: it takes information in, integrates it, and reports on it fluently. Whether anything it does is accompanied by an experience is a separate question entirely, and keeping the two apart is the move that makes the rest of the AI-consciousness debate possible to reason about.

> [!note] The idea
> Ned Block split consciousness into two notions that often travel together but can come apart. **Access consciousness** is a functional matter: a state is access-conscious when its information is broadly available to the system for reasoning, reporting, and the control of behavior. **Phenomenal consciousness** is the qualitative side, the raw feel of an experience, what Thomas Nagel called there being "something it is like" to be the creature. The distinction matters for machines because access consciousness is exactly the kind of thing an information-processing system could have, and may already approximate, while phenomenal consciousness is the part that no behavioral or functional test can confirm from the outside. The moral question of whether an AI can be wronged hangs on the second notion, which is precisely the one we cannot directly check.

## Two notions that usually travel together

The Stanford Encyclopedia frames Block's distinction cleanly. Access consciousness concerns intra-mental relations, where a state's being conscious is a matter of its availability to interact with other states, its general availability for use and guidance by the organism. Phenomenal consciousness, by contrast, involves qualitative properties, the qualia or raw sensory feels, independent of that functional access. In an ordinary human moment the two coincide: the red of a stop sign is both felt and usable, you experience the color and you also act on it. Block's point is that they are different properties, and once separated, each can in principle occur without the other.

It helps to also separate *who* is conscious from *what* is conscious. The encyclopedia distinguishes creature consciousness, a property of a whole organism that is awake and sentient, from state consciousness, a property of a particular mental state the creature is having. When people ask whether an AI is conscious they usually mean creature consciousness, but the traction in the debate comes from looking at states: which of a system's internal states, if any, carry a felt quality rather than merely doing functional work.

## What it is like

The phrase that anchors the phenomenal side comes from Thomas Nagel in 1974. A being is conscious, on his criterion, just if there is something that it is like to be that creature, some subjective way the world seems from its own experiential point of view. A bat navigating by sonar presumably has such a point of view even though we cannot imagine its character from the inside. The test is deliberately not about behavior or cleverness. A system could be enormously capable and still, as far as this criterion goes, be dark inside, with nothing it is like to be it.

This is the property that resists external measurement. You can probe what a system reports, what it can integrate, what it can act on, all of which are public and testable. You cannot probe, from outside, whether any of that is accompanied by a felt point of view, because the only direct access anyone has to phenomenal experience is their own. That asymmetry is why the phenomenal notion, not the access notion, is where the AI debate gets genuinely hard.

## The easy problems and the hard problem

David Chalmers gave this gap its sharpest formulation. He grouped the **easy problems** of consciousness as the functional ones: explaining how a physical system discriminates stimuli, integrates information, reports its internal states, and controls behavior. These are easy not because they are simple but because they are the kind of thing a mechanistic or behavioral account can in principle reach. They line up almost exactly with access consciousness. The **hard problem** is the leftover: why is the performance of all these functions accompanied by experience at all? Even a complete functional explanation, Chalmers argues, leaves it open why certain mechanisms are accompanied by conscious feel rather than going on in the dark. He coined the framing in 1994 at a Tucson conference and laid it out in the 1995 paper "Facing up to the problem of consciousness."

For AI this carves the territory precisely. The easy problems are engineering targets, and progress on systems like [[cs/history/deep-learning-revolution|deep learning]] is steady progress on exactly those functions. The hard problem is not an engineering target, because no amount of functional capability logically forces phenomenal experience to come along. So a system can climb the access ladder indefinitely while the phenomenal question stays untouched, which is why a fluent, capable model tells you nothing on its own about whether it feels.

## Why this is the load-bearing distinction for AI ethics

The whole "Big Data and AI" ethics question of moral status runs through the phenomenal side. A system with rich access consciousness but no phenomenal consciousness is a sophisticated instrument, and using it raises no question of wronging *it*. A system with phenomenal consciousness can be harmed, because there is someone home to suffer. Every downstream worry, whether a model can be mistreated, whether training inflicts something, whether shutdown is a kind of death, presupposes phenomenal experience, [[cs/machine-learning/evaluation-metrics|the one property no benchmark reports]]. This is why the rest of the debate spends its energy on theories that try to bridge the gap. [[cs/ethics/functionalism-and-multiple-realizability|Functionalism]] argues the felt side rides on functional organization, so the access story might carry the phenomenal one with it. The [[cs/ethics/scientific-theories-of-consciousness|scientific theories of consciousness]] each propose a different physical marker for when feel is present. And [[cs/ethics/could-an-llm-be-conscious|the question of LLM consciousness]] is an argument about whether today's systems have, or could be built to have, whatever the phenomenal side actually requires.

> [!example] Access without phenomenal feel, made concrete
> 1. **A thermostat reports its state.** It has information available for control of behavior, a thin sliver of access, with no plausible claim to feel. Almost nobody thinks there is something it is like to be a thermostat.
> 2. **A language model integrates and reports.** Far richer access: it discriminates, integrates across a huge context, and reports fluently on its own outputs. The easy problems are substantially in play. The hard problem is exactly where it was.
> 3. **A person sees red.** Access and phenomenal feel coincide. The color is usable and felt, which is the ordinary case that makes the two so easy to conflate.
> 4. **The contested middle.** Whether any system in category 2 ever crosses into category 3 is undecidable from the outside, and that undecidability is the whole problem the AI-ethics debate inherits.

## Related Notes

- [[cs/history/deep-learning-revolution|The Deep Learning Revolution]], what the systems whose consciousness is in question actually are and do
- [[cs/ethics/functionalism-and-multiple-realizability|Functionalism and Multiple Realizability]], the theory that mental states are defined by function, which tries to argue the phenomenal side follows from the access side
- [[cs/ethics/scientific-theories-of-consciousness|Scientific Theories of Consciousness]], rival proposals (global workspace, higher-order, integrated information) for what physically marks phenomenal consciousness
- [[cs/ethics/could-an-llm-be-conscious|Could an LLM Be Conscious?]], the live debate that this distinction sets up

## Sources

- "Consciousness," Stanford Encyclopedia of Philosophy. https://plato.stanford.edu/entries/consciousness/ . Supports Ned Block's distinction between access consciousness (a state's availability for use and guidance by the organism, its interaction with other states) and phenomenal consciousness (qualitative properties, qualia, raw sensory feels), the creature-versus-state consciousness distinction, and Nagel's "something it is like" criterion.
- "Hard problem of consciousness," Wikipedia. https://en.wikipedia.org/wiki/Hard_problem_of_consciousness . Supports Chalmers's distinction between the easy problems (discrimination, integration of information, reportability, behavioral control, all amenable to functional explanation) and the hard problem (why the performance of these functions is accompanied by experience), and the dates: terms introduced 1994 at Tucson, "Facing up to the problem of consciousness" published 1995, The Conscious Mind 1996.
- "Access consciousness," Wikipedia. https://en.wikipedia.org/wiki/Access_consciousness . Supports access consciousness as information poised for use in reasoning, report, and the rational control of action, in contrast to phenomenal consciousness.
