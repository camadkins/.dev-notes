---
title: "Scientific Theories of Consciousness"
description: "The three leading scientific theories of consciousness, global workspace, higher-order, and integrated information, each give a different answer to what makes a mental state conscious, and each delivers a different verdict on whether a machine could have it: global workspace leaves the door open, integrated information slams it shut on any purely feedforward network."
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
  - scientific theories of consciousness
  - global workspace theory
  - higher-order theory
  - integrated information theory
  - GWT
  - HOT
  - IIT
---

Once you accept that the hard part of consciousness is the felt side rather than the functional side, the natural next move is to ask what physical fact, if any, marks where feeling shows up. Three scientific theories take that question seriously, and they do not agree. Each picks out a different feature of a mental state as the thing that makes it conscious: how widely its information spreads, whether the system represents itself as being in that state, or how tightly the system's parts are woven together. The reason this matters for machines is that the three theories hand down three different verdicts. One leaves a clear path for an artificial system to be conscious, one makes it a question of having the right kind of self-model, and one rules out an entire class of today's AI on architectural grounds alone.

> [!note] The idea
> There are three leading scientific theories of consciousness, each a different answer to the question "what makes a mental state conscious," and each with its own verdict on machines. **Global Workspace Theory** says a state is conscious when its information is broadcast widely to many systems at once, so an architecture with a genuine workspace could qualify. **Higher-Order Theory** says a first-order state becomes conscious only when the system has a higher-order representation about being in that state, which shifts the question to whether a machine has the *right kind* of self-model. **Integrated Information Theory** says consciousness just is integrated information, measured by a quantity called Phi, and a purely feedforward system can have near-zero Phi even while behaving identically to a conscious one, so IIT denies it is conscious at all. The same physical system can pass one theory's test and fail another's, which is why these are rival theories and not three names for one idea.

## Global workspace: consciousness as broadcast

Global Workspace Theory locates consciousness in the spread of information. Bernard Baars introduced the theory in 1988 as a cognitive architecture, with a theater metaphor at its center: many specialized processes run in the dark, and a state becomes conscious when it reaches the lit stage, where its content is broadcast to the rest of the system. The slogan version is that consciousness is what happens when information goes from being held in one local process to being made available, all at once, to many. Stanislas Dehaene later developed the brain-based "global neuronal workspace" version, grounding the broadcast in long-range cortical connectivity rather than leaving it as an abstract architecture.

The verdict on machines is the permissive one. If what makes a state conscious is that its information is globally available to drive reasoning, reporting, and the control of behavior, then there is nothing in principle that ties that property to neurons. A system built with a genuine workspace, a central place where content is broadcast to many subsystems rather than kept siloed, would have the feature the theory says matters. This is the theory that sits closest to the [[consciousness-access-vs-phenomenal|access consciousness]] story, and it inherits that story's optimism about [[functionalism-and-multiple-realizability|multiple realizability]]: if the property is functional, the substrate is negotiable. Whether broadcast is *sufficient* for the felt side, rather than merely the access side, is exactly where the theory's critics push.

## Higher-order: consciousness as a thought about a state

Higher-Order Theory moves the marker inward. A first-order mental state, say the system processing pain signals, is not yet conscious just by occurring. It becomes conscious only when the system has a higher-order representation directed at it, a state that is about being in the first-order state. David Armstrong gave an early version in 1968, casting the higher-order state as a kind of inner sense or perception of one's own mind. David Rosenthal developed the systematic "higher-order thought" theory beginning in 1986, where the relevant higher-order state is specifically a thought: something with conceptual content that could in principle be expressed in words. A striking feature of Rosenthal's account is that the higher-order thought is itself usually unconscious. When you consciously see red, the seeing is conscious and the thought making it so runs in the background, unnoticed.

The obvious objection is mechanical: laptops monitor their own states constantly, reporting battery level, temperature, and errors, so why are they not conscious by this standard? The response is that not every higher-order representation counts, only the right kind, and pinning down what "the right kind" means is where the real work lives. Rosenthal builds in conditions, such as the higher-order thought arising non-inferentially rather than through conscious deduction, to rule out the cheap cases. For machines this is a double-edged verdict. It does not bar an artificial system from consciousness, since a self-model is just an engineering target, but it converts the whole question into one about the character of that self-model rather than its mere presence. A system can monitor itself all day and, on this theory, still be dark inside if its self-representation is the wrong sort.

## Integrated information: consciousness as Phi

Integrated Information Theory makes the most aggressive claim of the three: consciousness does not arise from information processing, it *is* integrated information, a quantity the theory calls Phi. Giulio Tononi proposed it in 2004, with Christof Koch as a major collaborator. The theory rests on two ideas. Information here means a system's current state rules out the many other states it could have been in, so the more states a configuration excludes, the more information it carries. Integration means the system is irreducible: the whole carries more than the sum of its parts, because the parts are causally bound together rather than running independently.

Phi measures that irreducibility, and the mechanism is what gives this note a real computational payload. To compute Phi you consider every way of cutting the system into parts, and for each cut you ask how much information is lost when you sever the connections across it. The cut that loses the *least* is the minimum-information partition, the system's weakest link. Phi is the information lost even at that weakest cut. If some partition severs the system with no loss at all, the system is reducible to independent pieces and its Phi is zero. So Phi is a min-cut over partitions, the integrated information that survives at the system's most forgiving slice, and higher Phi means more consciousness.

The architectural consequence is the famous one. Imagine information flowing one way only, A to B to C, like a line of dominoes where C can never reach back to affect A. A purely feedforward flow like this has near-zero Phi, because it does not integrate information at the physical level: cut between the stages and nothing is lost backward, since nothing ever flowed backward. Back-and-forth, recurrent connectivity, where output can become input again, is what generates high Phi. The published consequence is blunt: a system with a purely feedforward architecture that behaved in a way completely identical to a conscious human would, on IIT, only simulate consciousness without realizing it, because it would act as if it were integrating information while not actually doing so.

## Three verdicts on machine consciousness

The reason to hold all three theories at once is that they disagree precisely where it counts for AI. Global Workspace leaves the door open: build a real workspace and you may have built the thing that matters. Higher-Order narrows the door to systems with the right kind of self-model, turning a yes-or-no question into one about the quality of self-representation. Integrated Information takes the door off its hinges and inspects the wiring, and on its verdict a great deal of contemporary AI fails outright. Most large neural networks, including the feedforward transformer stacks behind the [[deep-learning-revolution|deep learning revolution]], push activations forward through layers without the dense recurrent loops IIT says are required, so by Phi they could be near-zero conscious no matter how fluent their output. That is the sharpest single split in the whole debate: a system could be behaviorally indistinguishable from a person and rated conscious by a broadcast theory while being rated an unconscious zombie by an integration theory, on the same hardware, for the same task. Whether any of this applies to today's models is the live question that [[could-an-llm-be-conscious|the LLM-consciousness debate]] inherits, and it runs straight into [[the-biological-substrate-objection|the biological substrate objection]] and the broader question of how mind relates to [[physicalism-and-the-mind|the physical]].

> [!example] One system, three theories, three verdicts
> 1. **A feedforward neural net that passes every behavioral test.** Global Workspace might count it conscious if its information is broadcast widely. Higher-Order asks whether its self-monitoring is the right kind. Integrated Information rates its Phi near zero and rules it out flat, because feedforward flow does not integrate at the physical level.
> 2. **A laptop reporting its own battery and temperature.** Higher-Order says a self-monitoring state alone is not enough; it must be the right kind of higher-order representation. The other two theories never even reach the question, because there is no global broadcast and negligible Phi.
> 3. **A recurrent architecture with a central workspace.** This is the case where the theories converge most: wide broadcast satisfies Global Workspace, dense feedback loops generate high Phi for Integrated Information, and a rich self-model could satisfy Higher-Order. The interesting AI targets are the ones that split the vote.
> 4. **A human brain.** All three say yes, which is the calibration point. The theories are built to agree here and to come apart on the artificial cases, which is exactly why the artificial cases are where the argument lives.

## Related Notes

- [[consciousness-access-vs-phenomenal|Consciousness: Access vs Phenomenal]], the distinction that sets up why a physical marker for the felt side is what these theories are hunting for
- [[functionalism-and-multiple-realizability|Functionalism and Multiple Realizability]], the substrate-neutral view that Global Workspace leans on and that Integrated Information rejects
- [[could-an-llm-be-conscious|Could an LLM Be Conscious?]], where these three verdicts get applied to the systems we actually have
- [[the-biological-substrate-objection|The Biological Substrate Objection]], the claim that only biology supports the felt side, which IIT's wiring requirement partly echoes
- [[physicalism-and-the-mind|Physicalism and the Mind]], the background commitment that consciousness is a physical fact these theories try to pin down
- [[deep-learning-revolution|The Deep Learning Revolution]], the feedforward architectures whose Phi verdict is at stake

## Sources

- "Global workspace theory," Wikipedia. https://en.wikipedia.org/wiki/Global_workspace_theory . Supports that Bernard Baars introduced Global Workspace Theory in 1988 as a cognitive architecture, the theater/spotlight metaphor, that a state becomes conscious when its content enters the global workspace and is broadcast widely across cognitive systems, and that Stanislas Dehaene extended it as the brain-based "global neuronal workspace."
- "Higher-order theories of consciousness," Stanford Encyclopedia of Philosophy. https://plato.stanford.edu/entries/consciousness-higher/ . Supports that a first-order state becomes conscious through a higher-order representation directed at it, that Armstrong (1968, 1984) defended an inner-sense (higher-order perception) version, that David Rosenthal (1986, 1993, 2005) developed the higher-order thought (HOT) theory, that the HOT is itself usually unconscious when the first-order state is conscious, and that the HOT must arise non-inferentially (the "right kind" condition).
- "Integrated information theory," Wikipedia. https://en.wikipedia.org/wiki/Integrated_information_theory . Supports that IIT was proposed by Giulio Tononi in 2004 with Christof Koch as a major collaborator, that consciousness is described by the system's causal structure, that integration (small phi) reflects the system specifying its state irreducibly as a whole, and the minimum-information-partition formulation of Phi as the minimizing partition (the system's weakest cut).
- Oizumi, Albantakis & Tononi, "From the Phenomenology to the Mechanisms of Consciousness: Integrated Information Theory 3.0," PLOS Computational Biology (2014). https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003588 . Supports that purely feedforward systems have zero integrated information because they can be partitioned unidirectionally without loss and lack the bidirectional causality that integration requires, and that, in the paper's own words, "there can be true 'zombies', unconscious feed-forward systems that are functionally equivalent to conscious complexes."
