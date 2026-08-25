---
title: Cyber Operations and the Law of Armed Conflict
description: "The Charter forbids force without defining it and preserves self-defence against armed attack without defining that either. Everything contested about cyber operations lives in that gap."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-19
updated:
aliases: []
---

Two separate bodies of law govern armed conflict, and conflating them is the most common error in this subject. One asks whether resort to force was lawful at all, and it is a question about the United Nations Charter. The other asks how hostilities may be conducted once a conflict exists, and it is a question about the Geneva Conventions and their Additional Protocols. A cyber operation raises both, separately, and the answers do not depend on each other.

> [!note] The idea
> The governing instruments supply the vocabulary and decline to supply the thresholds. Article 2(4) of the Charter prohibits "the threat or use of force" without defining force. Article 51 preserves self-defence "if an armed attack occurs" without defining armed attack, and the two terms are deliberately different. Additional Protocol I defines attacks as "acts of violence against the adversary" without saying what violence is when nothing is broken. Every disputed question about cyber operations sits in those gaps, and the most cited attempt to fill them describes itself, in its publisher's own words, as not law.

> [!warning] Scope
> This note states what three documents say: two treaty texts and one research centre's description of its own project. It attributes every position to its source and adjudicates none of them. It is not legal advice, it does not state the law applicable to any operation, and it does not represent the position of any state.

## The Charter layer

Article 2(4) is the prohibition. "All Members shall refrain in their international relations from the threat or use of force against the territorial integrity or political independence of any state, or in any other manner inconsistent with the Purposes of the United Nations."

Article 51 is the exception. "Nothing in the present Charter shall impair the inherent right of individual or collective self-defence if an armed attack occurs against a Member of the United Nations, until the Security Council has taken measures necessary to maintain international peace and security." The article adds a procedural duty: measures taken in self-defence "shall be immediately reported to the Security Council."

Two terms, two thresholds, and no definition of either in the Charter's text. The gap between "use of force" and "armed attack" is not an accident of drafting; the articles were written with different words and different consequences attached. An operation might be argued to cross one line and not the other, and nothing in the Charter resolves where either line falls for an operation conducted through a network.

## The conduct-of-hostilities layer

Additional Protocol I of 1977 supplies the rules that apply once an armed conflict exists. Its Article 49 defines the operative term: "'Attacks' means acts of violence against the adversary, whether in offence or in defence."

Article 48 states the basic rule of distinction. "In order to ensure respect for and protection of the civilian population and civilian objects, the Parties to the conflict shall at all times distinguish between the civilian population and combatants and between civilian objects and military objectives and accordingly shall direct their operations only against military objectives."

Article 51 protects civilians. "The civilian population as such, as well as individual civilians, shall not be the object of attack." It then prohibits indiscriminate attacks and defines them in three limbs: those "not directed at a specific military objective," those employing "a method or means of combat which cannot be directed at a specific military objective," and those employing a method or means "the effects of which cannot be limited as required by this Protocol." That third limb is the one that carries the most weight for an engineer. A tool whose propagation cannot be bounded is described in the treaty by its effects, not by its intent, which is the same property that separates a targeted intrusion from [[cs/security/malware-classes|self-propagating malware]].

Proportionality appears as a category of prohibited attack rather than as a named principle. Among the attacks to be considered indiscriminate is one "which may be expected to cause incidental loss of civilian life, injury to civilians, damage to civilian objects, or a combination thereof, which would be excessive in relation to the concrete and direct military advantage anticipated."

Article 52 defines the lawful target. "Attacks shall be limited strictly to military objectives," and objects qualify as military objectives when they are "limited to those objects which by their nature, location, purpose or use make an effective contribution to military action and whose total or partial destruction, capture or neutralization, in the circumstances ruling at the time, offers a definite military advantage." Where an object normally dedicated to civilian purposes is in doubt, "it shall be presumed not to be so used."

Article 57 converts the principles into obligations on the people planning the operation. "In the conduct of military operations, constant care shall be taken to spare the civilian population, civilians and civilian objects." Planners must "do everything feasible to verify that the objectives to be attacked are neither civilians nor civilian objects," must "take all feasible precautions in the choice of means and methods of attack" to avoid or minimize incidental harm, and must cancel or suspend an attack if it becomes apparent that the target is not a military one or that expected incidental harm would be excessive.

## Where a cyber operation meets those words

Read the two layers together and the friction points are specific rather than philosophical.

The Charter's terms are undefined, so the argument about whether an operation that disables a service constitutes force or an armed attack has no textual anchor to settle it. The Protocol's term is defined, but defined as "acts of violence," which places the whole class of operations that impair availability without breaking anything at the centre of the dispute. A [[cs/security/denial-of-service-and-ddos|distributed denial of service]] that takes a hospital's systems offline for a day damages no object in the ordinary sense and may harm people considerably.

Article 52(2) then asks a question that modern infrastructure answers badly. Its test is whether an object "by nature, location, purpose or use" makes an effective contribution to military action. Shared civilian infrastructure that also carries military traffic satisfies part of that test and not obviously the rest, and Article 52(3)'s presumption in case of doubt runs the other way.

Article 57's precautions are addressed to those who "plan or decide upon an attack," and its verification duty is expressed as doing "everything feasible." Feasibility in a network operation is bounded by the reconnaissance the operator performed, which puts the legal obligation and the technical [[cs/military-computing/cyber-warfare-and-the-fifth-domain|domain question]] on the same footing. None of these observations resolves anything. The instruments supply the terms; states and tribunals supply the applications, and this note reports neither as settled.

## What the Tallinn Manual is

The most cited scholarly attempt at applying these rules to cyber operations is the Tallinn Manual, produced under the auspices of the NATO Cooperative Cyber Defence Centre of Excellence. Its status is worth stating precisely, because it is routinely cited as though it were an instrument.

By the Centre's own description, the original Manual, published in 2013 by Cambridge University Press, "addressed the most severe cyber operations, those that violate the prohibition of the use of force, entitle states to exercise their right of self-defence, or occur during armed conflict." The Tallinn Manual 2.0, published in 2017, "built on that work by considering the rules of international law governing cyber incidents that states encounter on a day-to-day basis but which fall below the thresholds of the use of force or armed conflict." In 2021 the Centre launched a Tallinn Manual 3.0 project described as "a five-year venture," directed by Professor Michael Schmitt, who was general editor of both earlier editions.

The Centre states the document's legal character without hedging. The Manual "will continue to be a non-legally-binding scholarly work by distinguished international law academics and practitioners intended to provide an objective restatement of international law as applied in the cyber context," and it "will not represent the legal position or doctrine of any State or international organisation, including the CCDCOE." An International Group of Experts develops and approves it.

That is a description of scholarship, and scholarship of a particular kind: a restatement, which is an assertion about what the law already is rather than a source of it. Cite it as evidence of expert opinion and it is doing the work its authors intended. Cite it as a rule and the citation misstates the instrument. The binding texts remain the Charter and the treaties, which is why the arguments in this area are conducted in the vocabulary of 1945 and 1977 and not in the vocabulary of the network.

## Related Notes

- [[cs/law/attribution-and-state-responsibility|Attribution and State Responsibility]] for the prior question of whether an operation is a state's act at all.
- [[cs/law/title-10-and-title-50-authorities|Title 10 and Title 50 Authorities]] for the domestic American authorities under which such operations are conducted.
- [[cs/military-computing/cyber-warfare-and-the-fifth-domain|Cyber Warfare and the Fifth Domain]] for the doctrinal framing these legal categories were retrofitted onto.
- [[cs/security/denial-of-service-and-ddos|Denial of Service and DDoS]] because availability loss without physical damage is the hardest case for a treaty defining attacks as acts of violence.
- [[cs/security/malware-classes|Classes of Malware]] because Article 51(4) describes uncontrolled propagation in terms of effects that cannot be limited.
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]] for the state practice that runs alongside these texts.

## Sources

- <https://www.un.org/en/about-us/un-charter/full-text> for Article 2(4) and Article 51 of the United Nations Charter, including the reporting duty to the Security Council.
- <https://www.icrc.org/sites/default/files/external/doc/en/assets/files/other/icrc_002_0321.pdf> for the text of Additional Protocol I of 1977: Article 48 on distinction, Article 49's definition of attacks, Article 51 on civilian protection and indiscriminate attacks, Article 52 on military objectives, and Article 57 on precautions in attack.
- <https://ccdcoe.org/research/tallinn-manual/> for the CCDCOE's description of the Tallinn Manual editions, the 3.0 project, and the Manual's status as a non-binding scholarly restatement representing no state's position.
