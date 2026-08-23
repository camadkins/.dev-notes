---
title: Semiconductor Supply Chains
description: How the global semiconductor supply chain - concentrated in a handful of firms and geographies - has become the central chokepoint in technology geopolitics.
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

A modern processor contains billions of [[cs/history/the-transistor|transistors]] etched at nanometer scale. Only a few companies on Earth can manufacture them, and only one company can build the machines those manufacturers depend on.

That concentration turns chip fabrication into a strategic chokepoint as significant as any oil strait or shipping lane. When governments restrict access to this supply chain, they can cripple an adversary's ability to build advanced computing hardware - no shots fired, no sanctions on oil, just a denial of access to photolithography.

The semiconductor supply chain is the physical foundation of the digital world. Whoever controls it holds leverage over everything built on top of it.

## Core Idea

The semiconductor supply chain is a funnel with extreme narrowing at critical stages.

**Design.** A handful of firms design leading-edge chips - Apple, Nvidia, AMD, Qualcomm - almost all using architectures licensed from [[cs/history/smartphone-computing-and-arm|Arm]] (UK/SoftBank) and design tools (EDA) from Synopsys and Cadence, both American companies. China's domestic EDA ecosystem remains generations behind. EDA is a quiet but critical chokepoint: without these tools, even brilliant chip architects cannot tape out a design.

**Fabrication.** TSMC (Taiwan) manufactures roughly 90% of the world's most advanced chips (sub-7nm). Samsung (South Korea) holds most of the remainder. Intel is attempting to re-enter leading-edge foundry work through its IDM 2.0 strategy and the CHIPS and Science Act (2022), which allocated $52.7 billion in subsidies and incentives to domestic US fabrication.

The CHIPS Act represents a bipartisan recognition that the US - which invented the transistor, the [[cs/history/the-integrated-circuit|integrated circuit]], and the foundry model - had offshored fabrication to an extent that constituted a national security risk.

**Lithography.** ASML (Netherlands) is the sole manufacturer of extreme ultraviolet (EUV) lithography systems, required for sub-7nm production. Each machine costs over $150 million, weighs 180 tons, and depends on components from Zeiss (Germany) and Cymer (US/ASML subsidiary).

No EUV machine, no leading-edge fab. This single-vendor dependency is arguably the most concentrated chokepoint in any global supply chain.

**Materials and chemicals.** Ultra-pure silicon wafers, photoresists, etching gases, and specialty chemicals come from a narrow set of suppliers in Japan, Germany, South Korea, and the US. Japan's 2019 export restrictions on photoresists and hydrogen fluoride to South Korea demonstrated this vulnerability - even allies can weaponize materials access during bilateral disputes.

**Assembly, test, and packaging.** Advanced packaging - chiplets, 3D stacking, CoWoS (Chip on Wafer on Substrate) - is increasingly a bottleneck. TSMC, ASE, and Amkor dominate. Packaging innovation is becoming as strategically important as node shrinks, particularly for AI accelerators that require high-bandwidth memory integration. Nvidia's H100 and B200 are packaging-constrained as well as fab-constrained.

**Export controls.** The US Bureau of Industry and Security (BIS) has imposed escalating export controls on China since 2019:

- Entity List restrictions on Huawei (2019) and SMIC (2020).
- October 2022 rules blocking export of advanced chips (A100/H100-class), EDA tools for gate-all-around transistors, and semiconductor manufacturing equipment to China.
- October 2023 updates closing loopholes, restricting more chip designs, and expanding controls to additional Chinese entities.
- Coordinated Dutch and Japanese restrictions on lithography and deposition equipment exports.

These controls represent the most significant use of technology export restrictions since Cold War-era COCOM. They aim to do more than slow China's progress; the goal is to maintain a multi-generational lead in advanced computing.

**China's response.** China has countered with massive state investment through the National Integrated Circuit Industry Investment Fund (the "Big Fund," phases I and II totaling over $50 billion), stockpiling of equipment before restrictions take effect, and accelerated development of domestic alternatives.

SMIC has achieved 7nm-class production using older DUV multi-patterning - technically functional but slower, lower-yield, and not economically competitive at scale. The gap between what China can produce domestically and what the frontier requires remains multiple generations wide. Whether this gap narrows or widens depends on the effectiveness of export controls, the pace of Chinese R&D, and the willingness of third-party suppliers to comply with restrictions.

**The Taiwan question.** TSMC's concentration in Taiwan - a territory China claims - adds a layer of existential risk to the entire global technology supply chain. The "silicon shield" thesis argues Taiwan's semiconductor importance deters military action. The counter-argument is that it makes Taiwan a more attractive target for coercion short of invasion, and that TSMC's planned fabs in Arizona, Japan, and Germany are a deliberate hedge against this concentration risk.

If TSMC's Taiwan fabs were disrupted - by conflict, blockade, earthquake, or coercion - the world would lose the majority of its advanced chip production capacity. There is no short-term substitute. Building a leading-edge fab takes 3-5 years and costs $20-30 billion.

**Downstream consequences.** Chip restrictions cascade through the technology stack. Without access to advanced AI accelerators, Chinese firms face constraints on [[cs/history/deep-learning-revolution|training frontier models]]. Without advanced chips, Huawei cannot compete in premium smartphones. Without EUV lithography, Chinese fabs cannot close the manufacturing gap.

The semiconductor supply chain functions as a technology multiplier - control over it grants leverage across every downstream industry that depends on computation, which in the 2020s is nearly all of them.

**The reshoring dilemma.** The CHIPS Act, the EU Chips Act (43 billion euros), Japan's semiconductor subsidies, and India's incentive programs all reflect a desire to diversify fabrication away from East Asia. But advanced chip manufacturing is more than capital-intensive; it depends on deep tacit knowledge, specialized workforce ecosystems, and supplier clusters that take decades to develop.

TSMC's Arizona fab has faced delays, cost overruns, and workforce challenges. Intel's foundry ambitions require executing on a technology roadmap (five nodes in four years) that the company has never attempted at this pace. Samsung's Taylor, Texas fab has encountered similar difficulties. Reshoring is strategically rational but operationally grueling.

**The long game.** Semiconductor geopolitics is ultimately a contest over the pace and direction of technological development. States that control chip supply chains influence which countries can build AI systems, which militaries can field autonomous weapons, which economies can develop advanced manufacturing, and which societies can participate in the next generation of computing. The chokepoints are narrow, the dependencies are deep, and the stakes are civilizational.

## Example

In September 2020, US export controls took full effect against Huawei, cutting the company off from TSMC fabrication. Huawei's smartphone division - previously the world's second-largest - collapsed within months.

HiSilicon, Huawei's chip design subsidiary, could still design competitive processors. The Kirin 9000, designed before the cutoff, was technically impressive. But design without fabrication is blueprints without a factory. No foundry outside TSMC could manufacture the chip at the required node.

Revenue from Huawei's consumer devices fell by over 50% within a year. The company pivoted to enterprise networking, cloud services, and electric vehicles - businesses less dependent on cutting-edge mobile chips.

The episode demonstrated a structural truth: in the semiconductor supply chain, controlling fabrication access can be as decisive as controlling the technology itself. Design knowledge is necessary but not sufficient. The chokepoint is physical.

## Related Notes

- [[cyber-sovereignty|Cyber Sovereignty]] - export controls are one instrument of the broader digital sovereignty toolkit
- [[ai-governance|AI Governance]] - compute access is a prerequisite for training frontier AI models, linking chip policy to AI policy
- [[surveillance-and-privacy|Surveillance & Privacy]] - hardware backdoors and supply-chain integrity are surveillance concerns
- [[cs/history/the-transistor|The Transistor]] - the switch every advanced chip is built from
- [[cs/history/the-integrated-circuit|The Integrated Circuit]] - the monolithic chip the foundry model manufactures
- [[cs/history/smartphone-computing-and-arm|Smartphone Computing and ARM]] - the architecture most leading-edge designs license
- [[cs/history/moores-law|Moore's Law]] - the scaling cadence the node race chases
- [[cs/history/deep-learning-revolution|The Deep Learning Revolution]] - the AI accelerators export controls target

## Sources

- "TSMC," Wikipedia. https://en.wikipedia.org/wiki/TSMC . Supports TSMC's role as the dominant pure-play foundry for the most advanced chips, its concentration in Taiwan, and its hedging fabs in Arizona.
- "ASML," Wikipedia. https://en.wikipedia.org/wiki/ASML . Supports the claim that ASML (Netherlands) is the sole maker of EUV lithography systems required for leading-edge production, with optics from Zeiss.
- "CHIPS and Science Act," Wikipedia. https://en.wikipedia.org/wiki/CHIPS_and_Science_Act . Supports the 2022 CHIPS Act and its $52.7 billion in semiconductor subsidies and incentives for domestic US fabrication.
- "United States New Export Controls on Advanced Computing and Semiconductors to China," Wikipedia. https://en.wikipedia.org/wiki/United_States_New_Export_Controls_on_Advanced_Computing_and_Semiconductors_to_China . Supports the BIS export controls, the October 2022 rules, the 2023 updates, and Entity List restrictions on Huawei and SMIC.
