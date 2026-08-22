---
title: Attribution and State Responsibility
description: "Forensic attribution names a machine and an operator. Legal attribution asks a different question entirely, and answering the first one perfectly can leave the second untouched."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-11
updated:
aliases:
  - State Responsibility
  - ILC Articles on State Responsibility
  - Effective Control and Overall Control
---

Two professions use the word attribution and mean different things by it. In an incident report, attribution is the claim that a particular group, operating particular infrastructure, using particular tooling, conducted the intrusion. In international law, attribution is the claim that some conduct counts as an act of a state. The first is a statement about people and machines. The second is a statement about a legal relationship, and the strongest possible version of the first does not by itself establish the second.

> [!note] The idea
> The International Law Commission's articles make attribution a question about the relationship between an actor and a state, never about the actor's identity. Article 8's test is whether a person acted "on the instructions of, or under the direction or control of" the state. A forensic identification that names an individual with certainty establishes nothing under that article unless it also establishes the relationship, and the two leading judicial formulations of what control means, effective control and overall control, were produced by two different courts answering two different legal questions.

> [!warning] Scope
> This note states what one non-binding instrument and its official commentary say, and quotes how that commentary characterizes two judicial decisions. It is not legal advice, it takes no position on the responsibility of any state for any incident, and it does not assert that any technical attribution claim is correct.

## The instrument and its status

The text is "Responsibility of States for Internationally Wrongful Acts," adopted by the International Law Commission at its fifty-third session in 2001 and submitted to the General Assembly as part of the Commission's report on that session. The published text is "reproduced as it appears in the annex to General Assembly resolution 56/83 of 12 December 2001." It is not a treaty. The Commission calls its own product draft articles with commentaries, and describes the project's aim as an attempt "to formulate, by way of codification and progressive development, the basic rules of international law concerning the responsibility of States for their internationally wrongful acts."

The articles are deliberately second-order. "The emphasis is on the secondary rules of State responsibility: that is to say, the general conditions under international law for the State to be considered responsible for wrongful actions or omissions, and the legal consequences which flow therefrom." They do not say what states must do. They say what follows when a state has failed to do it, and who counts as the state for that purpose.

Article 2 sets out the two elements. There is an internationally wrongful act of a state when conduct "is attributable to the State under international law" and "constitutes a breach of an international obligation of the State." Attribution is one of two independent conditions, which is why an operation can be unambiguously wrongful and still produce no state responsibility, and why a state can be responsible for conduct nobody has proven it ordered.

## The attribution rules

Chapter II supplies the routes. Article 4 covers organs: "The conduct of any State organ shall be considered an act of that State under international law," whatever its function and whatever its position in the organization of the state. Article 5 extends that to a person or entity "empowered by the law of that State to exercise elements of the governmental authority," provided it is acting in that capacity in the particular instance.

Article 7 forecloses a familiar defence. Conduct of an organ or an empowered entity is attributable "if the organ, person or entity acts in that capacity, even if it exceeds its authority or contravenes instructions." A unit acting beyond its orders is still the state acting.

Article 8 is the one that matters for operations conducted through people who are not on the payroll. "The conduct of a person or group of persons shall be considered an act of a State under international law if the person or group of persons is in fact acting on the instructions of, or under the direction or control of, that State in carrying out the conduct."

Article 11 supplies a route that requires proving no relationship at all in advance. Conduct not otherwise attributable "shall nevertheless be considered an act of that State under international law if and to the extent that the State acknowledges and adopts the conduct in question as its own." A public claim of credit can do what months of forensics cannot.

## Two courts, two tests

The phrase "direction or control" in Article 8 is where the argument lives, and the commentary sets out the two competing formulations.

The first comes from the International Court of Justice in the Nicaragua case. The Court rejected the claim that all conduct of the contras was attributable to the United States on the basis of its control over them, holding that "despite the heavy subsidies and other support provided to them by the United States, there is no clear evidence of the United States having actually exercised such a degree of control in all fields as to justify treating the contras as acting on its behalf." For the conduct in question to engage American responsibility, "it would in principle have to be proved that that State had effective control of the military or paramilitary operations in the course of which the alleged violations were committed." The commentary summarizes the holding: "a general situation of dependence and support would be insufficient to justify attribution of the conduct to the State."

The second comes from the Appeals Chamber of the International Tribunal for the Former Yugoslavia in Tadić, which declined to require so much. "The degree of control may, however, vary according to the factual circumstances of each case. The Appeals Chamber fails to see why in each and every circumstance international law should require a high threshold for the test of control." The Chamber held that the control required "was overall control going beyond the mere financing and equipping of such forces and involving also participation in the planning and supervision of military operations."

The commentary then does something worth noticing: it declines to declare a winner, and it explains why the two decisions are not straightforwardly in conflict. "The legal issues and the factual situation in the Tadić case were different from those facing the Court in that case. The tribunal's mandate is directed to issues of individual criminal responsibility, not State responsibility, and the question in that case concerned not responsibility but the applicable rules of international humanitarian law." Its own conclusion is a refusal to generalize: "it is a matter for appreciation in each case whether particular conduct was or was not carried out under the control of a State, to such an extent that the conduct controlled should be attributed to it."

The commentary adds a related caution for the state-linked contractor case. "The fact that the State initially establishes a corporate entity, whether by a special law or otherwise, is not a sufficient basis for the attribution to the State of the subsequent conduct of that entity."

## What the forensics can carry

Set the technical work beside those rules and the division of labour becomes clear.

What [[cs/security/the-cyber-kill-chain-and-mitre-attack|intrusion analysis]] produces is evidence about infrastructure, tooling, tradecraft, timing, and language. That evidence can bear directly on Article 4, if it identifies the actor as an organ of a state, and it can bear on Article 8, if it shows instruction, direction, or control. What it cannot do is convert one into the other. Establishing that an operator sat in a particular country, used tooling seen before in that country's operations, and worked its business hours is, in the vocabulary of the commentary, closer to dependence and support than to effective control over the specific operation.

The asymmetry runs both ways. Article 7 means a state does not escape by showing the operator exceeded instructions. Article 11 means a state can acquire responsibility for an operation it never ordered by embracing it afterward. And Article 2 means that even a clean attribution answers only half the question, since the conduct must also breach an obligation the state actually owed, which returns to the [[cs/law/cyber-operations-and-the-law-of-armed-conflict|instruments governing conduct]] and to the [[cs/geopolitics/cyber-sovereignty|state practice]] built around them.

Public attribution statements by governments are political acts as much as legal ones, and this note takes no position on any of them. What the instrument shows is narrower and more useful: the legal test was written about relationships, the forensic method measures artifacts, and the distance between the two is not a gap in the technique. It is the design of the rule.

## Related Notes

- [[cs/law/cyber-operations-and-the-law-of-armed-conflict|Cyber Operations and the Law of Armed Conflict]] for the primary rules whose breach the second element of Article 2 requires.
- [[cs/law/title-10-and-title-50-authorities|Title 10 and Title 50 Authorities]] for how one state internally categorizes the operations that raise these questions.
- [[cs/security/the-cyber-kill-chain-and-mitre-attack|The Cyber Kill Chain and MITRE ATT&CK]] for the technical vocabulary in which attribution claims are actually made.
- [[cs/security/malware-classes|Classes of Malware]] because tool reuse across groups is one reason artifact evidence underdetermines the relationship the law asks about.
- [[cs/military-computing/stuxnet-and-cyber-physical-exploitation|Stuxnet and Cyber-Physical Exploitation]] for a case where technical analysis and formal acknowledgment came apart entirely.
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]] for the state practice surrounding public attribution.

## Sources

- <https://legal.un.org/ilc/texts/instruments/english/draft_articles/9_6_2001.pdf> for the text of the 2001 articles on Responsibility of States for Internationally Wrongful Acts: their adoption and publication status, Article 2's two elements, and Articles 4, 5, 7, 8 and 11 on attribution.
- <https://legal.un.org/ilc/texts/instruments/english/commentaries/9_6_2001.pdf> for the Commission's commentaries: the general commentary on codification and secondary rules, the account of the Nicaragua effective control holding, the Tadić overall control holding, the commentary's treatment of the difference between the two, and its caution about state-established corporate entities.
