---
title: The Cyber Kill Chain and MITRE ATT&CK
description: "Two ways to give defenders a shared vocabulary for attacks: one a linear sequence you break by cutting any single link, the other a non-sequential matrix cataloged from what adversaries actually do."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-06-11
updated:
aliases:
  - Cyber Kill Chain
  - MITRE ATT&CK
  - kill chain
  - intrusion kill chain
---

Defenders were long stuck describing attacks as single events: a breach happened, data left. That framing offers nowhere to intervene, because by the time you name the event it is over. Both frameworks here exist to replace the event with a structure, so that "an attack" becomes a sequence of observable stages a defender can map, detect, and disrupt. They do it with opposite structural commitments, and the contrast is the point: one bets that attacks are strictly ordered, the other refuses to assume any order at all.

> [!note] The idea
> Lockheed Martin's Cyber Kill Chain models an intrusion as seven ordered phases an adversary must complete in sequence, which hands the defender a specific kind of leverage: interrupt any one link and the whole chain fails. MITRE ATT&CK makes the opposite bet. It is a knowledge base of adversary tactics and techniques cataloged from real-world observations, arranged as a matrix rather than a timeline, precisely because real intrusions do not march through fixed stages. The kill chain is a theory of how an attack must unfold; ATT&CK is an empirical dictionary of what attackers have actually been seen to do.

## The kill chain: an ordered sequence you break by cutting one link

Lockheed Martin adapted [[cs/military-computing/cyber-warfare-and-the-fifth-domain|the military concept of a kill chain]] to network defense in 2011. Its own description ties the model to a defensive philosophy: "the Cyber Kill Chain framework is part of the Intelligence Driven Defense model for identification and prevention of cyber intrusions activity," and "the model identifies what the adversaries must complete in order to achieve their objective." The load-bearing word is *must*. If every successful intrusion has to pass through each stage, then a defender who blocks any single stage has stopped the attack.

The seven phases, per Wikipedia's rendering of the model, run: Reconnaissance (select and research the target), Weaponization (build the malware payload), Delivery (transmit it), Exploitation (trigger the vulnerability), Installation (plant a backdoor), Command and Control (establish "hands on the keyboard" persistent access), and Actions on Objective (exfiltrate, destroy, or ransom). The framework pairs each phase with defensive courses of action, because, as the Lockheed researchers wrote, "attacks may occur in phases and can be disrupted through controls established at each phase." That is the whole value proposition: a map of the attack timeline annotated with where you can cut it.

## Where the sequence assumption breaks

The kill chain's ordering is also its weakness, and the critiques are structural rather than cosmetic. Wikipedia collects them: "the first phases happen outside the defended network, making it difficult to identify or defend against actions in these phases," and the model "is said to reinforce traditional perimeter-based and malware prevention-based defensive strategies." Worse for the "must complete every stage" premise, "the traditional cyber kill chain isn't suitable to model the insider threat," because an insider who already has access skips the early links entirely. An attacker inside the perimeter does not obey the sequence the whole framework is built on.

## ATT&CK: a matrix cataloged from reality

MITRE ATT&CK answers those gaps by dropping the linear assumption. It describes itself as "a globally-accessible knowledge base of adversary tactics and techniques based on [[cs/forensics/incident-response-and-where-forensics-begins|real-world observations]]," used "as a foundation for the development of specific threat models and methodologies." Two structural choices matter. First, it is organized as a matrix of *tactics* (the adversary's goal at a moment, such as persistence or lateral movement) against *techniques* (the concrete ways to achieve each). Second, it is empirical: entries earn their place by having been observed in real intrusions, not by fitting a theory of attack progression. This is why the analysis behind the Unified Kill Chain describes the "time-agnostic nature of tactics in MITRE's ATT&CK," in contrast to the kill chain's ordered stages. ATT&CK does not tell you what stage an adversary must reach next. It gives a shared, evidence-backed vocabulary for whatever behavior you actually detect, in whatever order it appears.

> [!warning] They are complements, not competitors
> The kill chain's strength is a clean narrative of an external intrusion and clear intervention points; its weakness is the rigid ordering and perimeter focus. ATT&CK's strength is coverage of real, non-linear behavior including post-compromise activity; its cost is that a flat matrix gives you less of a story about sequence. Mature defense uses the kill chain to reason about disrupting an intrusion's progression and ATT&CK to name and detect the specific techniques at each point. The shared vocabulary each provides is the actual deliverable, letting analysts, tools, and threat intel refer to the same adversary behavior.

## Related Notes

- [[stride-threat-modeling|STRIDE Threat Modeling]], a complementary framework aimed at design-time threats rather than live intrusions
- [[malware-classes|Malware Classes]], the weaponization and installation payloads these frameworks track moving through the stages
- [[ids-and-ips|IDS and IPS]], the detection and disruption controls a kill-chain or ATT&CK mapping is used to place
- [[zero-trust-architecture|Zero Trust Architecture]], a response to exactly the perimeter and insider gaps the kill chain is criticized for

## Sources

- "Cyber Kill Chain," Lockheed Martin. https://www.lockheedmartin.com/en-us/capabilities/cyber/cyber-kill-chain.html . Supports that the Cyber Kill Chain "is part of the Intelligence Driven Defense model," that "the model identifies what the adversaries must complete in order to achieve their objective," and that it has "seven steps."
- "Cyber kill chain," Wikipedia. https://en.wikipedia.org/wiki/Cyber_kill_chain . Supports Lockheed Martin's 2011 adaptation, the seven phases (Reconnaissance, Weaponization, Delivery, Exploitation, Installation, Command and Control, Actions on Objective), that "attacks may occur in phases and can be disrupted through controls established at each phase," and the critiques that early phases "happen outside the defended network" and that the model "isn't suitable to model the insider threat," plus the "time-agnostic nature of tactics in MITRE's ATT&CK."
- "MITRE ATT&CK," The MITRE Corporation. https://attack.mitre.org/ . Supports that ATT&CK is "a globally-accessible knowledge base of adversary tactics and techniques based on real-world observations" used "as a foundation for the development of specific threat models and methodologies."
