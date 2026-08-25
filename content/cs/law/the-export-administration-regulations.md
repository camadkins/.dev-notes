---
title: "The Export Administration Regulations"
description: "The EAR classify items on the Commerce Control List by ECCN, and their most consequential rule for a working engineer is the deemed export, which treats a release of technology to a foreign person inside the United States as an export."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-06-16
updated:
aliases:
  - EAR
---

Export control sounds like a shipping problem. Something goes in a crate, the crate crosses a border, someone checks a form. The Export Administration Regulations do cover that, and then they define export in a way that has nothing to do with crates or borders, and that second definition is the one that reaches into an engineering organization.

> [!note] The idea
> Under the EAR, showing controlled technology to a foreign national standing next to you in a lab in Ohio is an export. The regulation says so in the definition itself: releasing technology or source code to a foreign person in the United States is a "deemed export," and release includes visual inspection and oral exchange. Nothing moved. No border was crossed. The regulated event is a transfer of understanding between two people in the same room, which makes the EAR a rule about who is in the meeting rather than a rule about logistics.

## What the regulations cover

The EAR are administered by the Bureau of Industry and Security at the Department of Commerce, and the shorthand for their subject is dual use. The regulation defines the term: a dual-use "item is one that has civil applications as well as terrorism and military or weapons of mass destruction (WMD)-related applications."

The shorthand undersells the scope, and the regulation says so in the same section. "The EAR control any item warranting control that is not exclusively controlled for export, reexport, or transfer (in-country) by another agency of the U.S. Government." That sweep pulls in purely civilian items and, at the far edge, "items that are exclusively used for military applications but that do not warrant control under the International Traffic in Arms Regulations." A military item can sit under Commerce jurisdiction rather than State jurisdiction, which is the seam that [[cs/law/itar-and-defense-articles|the ITAR note]] takes up.

## The list and the number

The classification machinery is a list. "The Bureau of Industry and Security (BIS) maintains the Commerce Control List (CCL) that includes" commodities, software, and technology subject to its authority. The list is divided into ten numbered categories and, within each, into product groups running A through E for equipment, test equipment, materials, software, and technology. Category 3 is Electronics, Category 4 is Computers, Category 5 is Telecommunications and Information Security and splits into a telecommunications half and an information security half.

An entry on the list is an Export Control Classification Number. The categories and product groups are the first two characters, which is why 5A002 and 5D002 are recognizably the equipment and software forms of the same subject. "The CCL does not include items exclusively controlled for export by another department or agency of the U.S. Government," so the absence of an entry can mean the item belongs to somebody else's regime rather than that it is uncontrolled. Items subject to the EAR "but not identified on the CCL are identified by the designator" EAR99, which is a classification and not an exemption.

An ECCN is a technical specification with legal effect, and modern ones read like datasheets. ECCN 3A090 controls "integrated circuits having one or more digital processing units having either of the following," the first branch being "a 'total processing performance' of 4800 or more." A threshold on arithmetic throughput, written into a regulation, deciding what may leave the country. That is what it looks like when [[cs/geopolitics/compute-as-a-governable-resource|compute becomes a governable resource]], and it is the mechanism underneath the policy fights over [[cs/geopolitics/semiconductor-supply-chains|semiconductor supply chains]]. The control lives in a number in a table, not in a speech.

## The deemed export rule

Section 734.13 defines export in three limbs. The first is the intuitive one: "an actual shipment or transmission out of the United States, including the sending or taking of an item out of the United States, in any manner."

The second is the one people miss. Export also means "releasing or otherwise transferring technology or source code (but not object code) to a foreign person in the United States (a deemed export)." Source code is in. Object code is expressly out of that limb, a distinction that has been in these regulations since the cryptography fights of the 1990s.

Paragraph (b) tells you where the notional shipment goes. "Any release in the United States of technology or source code to a foreign person is a deemed export to the foreign person's most recent country of citizenship or permanent residency." The destination is a property of the person, not of any place. Two colleagues at the same desk can require different authorizations for the same conversation.

The definition of release is what gives the rule its reach. Technology and software are released through "visual or other inspection by a foreign person of items that reveals technology or source code subject to the EAR to a foreign person," or through "oral or written exchanges with a foreign person of technology or source code in the United States or abroad." A glance at a screen qualifies. So does a conversation. And the closing rule sweeps up the indirect routes: "any act causing the release of technology or software, through use of access information or otherwise, to yourself or another person requires an authorization to the same extent an authorization would be required to export or reexport such technology or software to that person."

Handing over a credential is therefore reachable by the same rule that reaches handing over the code. That is a regulation written by people who understood that access control and data transfer are the same event viewed from different sides.

> [!warning] Scope
> This note describes what the Export Administration Regulations say. It is a description of a regulatory instrument, not legal advice or a compliance procedure. It does not classify any item, does not say whether a particular activity requires a license, and does not tell anyone what to do. Classification, license determination, and the many exceptions and country-specific rules that the regulation contains are matters for counsel and for the licensing agency.

## Why this shape

The structure is worth noticing on its own terms. The EAR do not enumerate forbidden acts. They define a jurisdiction (items subject to the EAR), a classification scheme (the CCL and its ECCNs), a set of regulated events (export, reexport, transfer in country, release), and a matrix of destinations, and then compose them. Change one ECCN threshold and the reach of the whole system moves without a word of the operative text changing.

That composability is also why the regime absorbs international agreements so readily. When a multilateral body adds a control, the change arrives as a new or amended entry rather than as new law, which is the subject of [[cs/law/wassenaar-and-intrusion-software|the note on intrusion software]]. It is also why the fight over cryptography was a fight over which list an item sat on, covered in [[cs/law/encryption-export-history-and-the-crypto-wars|the crypto wars note]].

## Related Notes

- [[cs/law/itar-and-defense-articles|ITAR and Defense Articles]] - the other regime, and the boundary the EAR text points at
- [[cs/law/encryption-export-history-and-the-crypto-wars|Encryption Export History and the Crypto Wars]] - what happened when cryptography moved between the two lists
- [[cs/law/wassenaar-and-intrusion-software|Wassenaar and Intrusion Software]] - how a multilateral decision becomes a CCL entry
- [[cs/geopolitics/compute-as-a-governable-resource|Compute as a Governable Resource]] - the policy idea that ECCN 3A090 implements as a number
- [[cs/geopolitics/semiconductor-supply-chains|Semiconductor Supply Chains]] - the industry the electronics categories act on

## Sources

- 15 CFR Part 730, General Information, eCFR. https://www.ecfr.gov/current/title-15/subtitle-B/chapter-VII/subchapter-C/part-730 . Backs the definition of a dual-use item, the statement that the EAR control any item not exclusively controlled by another agency, and the inclusion of military-only items that do not warrant ITAR control.
- 15 CFR Part 734, Scope of the Export Administration Regulations, eCFR. https://www.ecfr.gov/current/title-15/subtitle-B/chapter-VII/subchapter-C/part-734 . Backs the three limbs of the export definition, the deemed export rule and its destination, the definition of release by visual inspection and oral exchange, and the access information provision.
- 15 CFR Part 774, The Commerce Control List, eCFR. https://www.ecfr.gov/current/title-15/subtitle-B/chapter-VII/subchapter-C/part-774 . Backs BIS maintenance of the CCL, the exclusion of items controlled by other agencies, the EAR99 designator, the category structure, and the control parameters of ECCN 3A090.
