---
title: AI Governance
description: The emerging regulatory and policy landscape around artificial intelligence - how the EU, US, China, and the open-source community are shaping the rules for AI development and deployment.
draft: false
comments: true
tags:
  - cs
  - geopolitics
date: 2026-03-12
updated:
aliases: []
---

## Intuition

Artificial intelligence is powerful enough to matter to governments but novel enough that no one agrees on how to regulate it. The result is a patchwork of national and regional approaches, each reflecting different values and strategic calculations.

Europe regulates risk. America regulates loosely and invests heavily. China regulates content and channels AI toward state priorities. Meanwhile, the open-source community argues that the most important governance question is whether powerful models should be open or closed at all.

The stakes are high because AI governance decisions made now - while the technology is still maturing - will shape the distribution of power, the structure of markets, and the boundaries of civil liberties for decades.

## Core Idea

**The EU AI Act (2024).** The world's first comprehensive AI law classifies AI systems into risk tiers:

- **Unacceptable risk** - banned outright. Includes social scoring by governments, real-time biometric identification in public spaces (with narrow law-enforcement exceptions), and manipulative AI targeting vulnerable groups.
- **High risk** - [[cs/standards/conformance-testing-and-plugfests|subject to conformity assessments]], transparency requirements, human oversight mandates, and registration in an EU database. Covers AI in hiring, credit scoring, law enforcement, critical infrastructure, and education.
- **Limited risk** - transparency obligations only. Users must be told they are interacting with an AI system (chatbots, deepfake generators).
- **Minimal risk** - largely unregulated. Spam filters, video game AI, inventory optimization.

General-purpose AI models (including [[cs/history/deep-learning-revolution|large language models]]) face additional obligations: technical documentation, copyright compliance disclosures, and - for models deemed to pose "systemic risk" - adversarial testing, incident reporting, and cybersecurity requirements. The systemic-risk threshold is set at 10^25 FLOPs of training compute, a bright line that will require periodic revision as training efficiency improves.

The Act's enforcement timeline stretches from 2024 to 2027, with different provisions taking effect at different dates. The full regulatory apparatus - notified bodies, conformity assessments, market surveillance - is still being built.

**US approach.** The US has favored executive action and voluntary commitments over binding legislation:

- **Executive Order 14110 (October 2023)** required developers of powerful models to share safety test results with the government, directed NIST to develop AI safety standards, and tasked agencies with sector-specific guidance.
- Voluntary commitments from leading labs (OpenAI, Google, Anthropic, Meta, Microsoft) on safety testing, watermarking, and information sharing - non-binding and unenforceable.
- Sector-specific regulation: FDA for medical AI, NHTSA for autonomous vehicles, financial regulators for algorithmic trading, FTC for deceptive AI practices.
- State-level activity: California's SB 1047 proposed liability for catastrophic harms from frontier models but was vetoed. Other states have pursued narrower measures around deepfakes, hiring algorithms, and facial recognition in law enforcement.

The regulatory posture shifts with administrations. The Trump administration rescinded EO 14110 in early 2025, favoring deregulation and competitiveness over precautionary governance. This oscillation creates uncertainty for companies planning compliance on multi-year timelines and raises the question of whether meaningful AI governance in the US requires legislation rather than executive action.

**China's approach.** China regulates AI through a series of targeted rules rather than a single omnibus law:

- **Algorithmic recommendation regulations (2022)** - require transparency in recommendation algorithms, user opt-out mechanisms, and prohibitions on algorithmic discrimination.
- **Deep synthesis (deepfake) regulations (2023)** - mandate labeling, traceability, and real-name registration for AI-generated content.
- **Generative AI regulations (2023)** - require that AI-generated content adheres to "core socialist values," mandate security assessments before public release, and hold providers liable for outputs.

Strategically, China's national AI plan targets global leadership by 2030, backed by massive state funding, talent recruitment programs, and data-access advantages stemming from weaker privacy constraints on training data. The regulatory framework is designed to maintain party control over AI outputs - particularly political speech - while accelerating AI capability development. This dual objective (capability + control) distinguishes the Chinese approach from both the EU (precautionary) and US (permissive) models.

**Open vs. closed models.** A governance debate that cuts across national boundaries:

- **Closed-model advocates** (OpenAI, Anthropic) argue that restricting model weights prevents misuse - bioweapons synthesis, large-scale disinformation, automated cyberattacks - and enables responsible deployment through API-level monitoring and controls.
- **Open-model advocates** (Meta's Llama, Mistral, EleutherAI, academic community) argue that openness enables independent security auditing, reduces concentration of power, prevents vendor lock-in, and democratizes access to foundational technology. They contend that restricting model release is both technically futile (weights leak, architectures are published, training recipes are known) and counterproductive (it concentrates capability in a few firms with minimal external accountability).

The EU AI Act treats open-source models more leniently below the systemic-risk threshold. The US has not taken a clear legislative position. The debate is fundamentally about whether AI safety is better served by centralized control or distributed scrutiny - a question with no empirical resolution yet.

**International coordination.** The UK AI Safety Summit (Bletchley Park, November 2023) produced the Bletchley Declaration - a non-binding agreement among 28 countries acknowledging the importance of AI safety. The AI Safety Institutes in the US and UK coordinate on evaluation methodology. The G7 Hiroshima AI Process established voluntary codes of conduct.

But binding international AI governance remains distant. The incentive structures resemble climate negotiations more than arms control: every state wants others to regulate while preserving its own competitive advantage. There is no equivalent of the IAEA for AI, and proposals for one face the fundamental difficulty that AI capabilities are diffuse, dual-use, and rapidly evolving.

**Compute governance.** An emerging approach that regulates AI through its physical prerequisites rather than its software. [[cs/law/the-export-administration-regulations|Export controls on advanced chips]] (see [[cs/geopolitics/semiconductor-supply-chains|Semiconductor Supply Chains]]), reporting requirements for large training runs, and proposals for international compute monitoring draw on non-proliferation precedents.

Compute is measurable, physical, and concentrated - making it more tractable to govern than code or data. But compute governance has limitations: training efficiency improves over time, reducing the compute needed for a given capability level. A bright-line compute threshold that captures frontier models today may miss them in three years.

**The talent dimension.** AI governance extends beyond rules and hardware to the people who build the systems. Immigration policy, export controls on research collaboration, and university funding all shape the distribution of AI talent. The US benefits from attracting global AI researchers but risks losing them through restrictive immigration policy. China has invested heavily in domestic AI education while also recruiting overseas talent through programs like the Thousand Talents Plan. The concentration of AI expertise in a small number of countries and companies is itself a governance-relevant fact.

**Liability and accountability.** An unresolved question across all jurisdictions: [[cs/ethics/the-responsibility-gap|when an AI system causes harm, who is liable?]] The developer who trained the model, the deployer who integrated it, the user who prompted it, or the data subjects whose data trained it? The EU AI Act assigns primary responsibility to deployers of high-risk systems. US tort law has no clear framework for AI-caused harms. China holds providers liable for outputs. The absence of settled liability frameworks creates uncertainty that shapes both investment decisions and safety incentives.

## Example

In February 2024, the EU Parliament approved the AI Act with broad cross-party support. One immediate consequence: companies deploying AI hiring tools in Europe must now conduct fundamental-rights impact assessments, provide candidates with explanations of automated decisions, and maintain human oversight over reject/accept outcomes.

A US-based HR-tech startup serving European clients must comply regardless of where its servers are located - illustrating the extraterritorial reach of EU technology regulation (the "Brussels effect"). Companies that previously used opaque resume-screening models began publishing transparency reports and offering candidate appeal mechanisms months before enforcement deadlines.

The pattern echoes GDPR: the EU sets a standard, multinational companies adopt it globally to avoid maintaining separate systems, and the regulation effectively exports European values through market power rather than diplomatic pressure.

## Related Notes

- [[cs/geopolitics/semiconductor-supply-chains|Semiconductor Supply Chains]] - compute access is a prerequisite for frontier AI, making chip policy and AI policy inseparable
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]] - AI governance is the newest layer in the broader contest over digital sovereignty
- [[cs/geopolitics/surveillance-and-privacy|Surveillance & Privacy]] - AI-powered surveillance (facial recognition, predictive policing) is a primary driver of AI regulation
- [[cs/history/deep-learning-revolution|The Deep Learning Revolution]] - the frontier models and training-compute thresholds these regimes regulate
- [[cs/ethics/could-an-llm-be-conscious|Could an LLM Be Conscious?]] - the moral-status question these governance regimes quietly assume an answer to

## Sources

- "Artificial Intelligence Act," Wikipedia. https://en.wikipedia.org/wiki/Artificial_Intelligence_Act . Supports the 2024 EU AI Act, its risk-based tiers (unacceptable / high / limited / minimal), bans on social scoring and biometric identification, general-purpose AI obligations, and the 10^25 FLOPs systemic-risk threshold.
- "Executive Order 14110," Wikipedia. https://en.wikipedia.org/wiki/Executive_Order_14110 . Supports the October 30, 2023 order requiring developers to share safety-test results, the NIST safety-standards tasking, and its rescission by the Trump administration in January 2025.
- "Regulation of artificial intelligence," Wikipedia. https://en.wikipedia.org/wiki/Regulation_of_artificial_intelligence . Supports China's deep-synthesis and generative-AI rules, the Bletchley Park AI Safety Summit, and the G7 Hiroshima AI Process.
