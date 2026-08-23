---
title: "ITAR and Defense Articles"
description: "A defense article is whatever the U.S. Munitions List designates, and the boundary between the ITAR and the EAR is an order of review rather than a judgment about how military a thing feels."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-06-30
updated:
aliases:
  - ITAR
  - US Munitions List
  - USML
---

Engineers usually meet the ITAR as an adjective. A program is ITAR, a drawing is ITAR, a room is ITAR. That usage hides the structure, because the regulation does not classify things by how military they seem. It classifies them by whether they appear on a list, and it tells you in what order to consult the lists.

> [!note] The idea
> The ITAR and the EAR do not divide the world by subject matter. They divide it by lookup order. An item is a defense article if the U.S. Munitions List designates it, and if the Munitions List does not describe it the item falls through to the Commerce Control List, even when the item is used exclusively by militaries. The regulations state this from both sides in their own text. So the question "is this ITAR or EAR" has a procedure for an answer, and the procedure begins with reading a list rather than forming an opinion.

## What a defense article is

The definition is circular by design, and the circularity is the point. "Defense article means any item or technical data designated in" section 121.1 of the subchapter. Designation is the operative act. Nothing about an item's physics or its purpose makes it a defense article. Appearing in the list does.

The definition then extends outward to the things that reveal the item: technical data recorded in any physical form, and models and mockups that reveal technical data directly relating to a listed item. It also extends downward, into unfinished products such as forgings and castings that "have reached a stage in manufacturing where they are clearly identifiable by mechanical properties, material composition, geometry, or function as defense articles." And it stops short of the sales brochure: "It does not include basic marketing information on function or purpose or general system descriptions."

Technical data is defined separately as information, other than software, "which is required for the design, development, production, manufacture, assembly, operation, repair, testing, maintenance, or modification of defense articles," including blueprints, drawings, photographs, plans, instructions, and documentation. A defense service is broader still, covering "the furnishing of assistance (including training) to foreign persons, whether in the United States or abroad in the design, development, engineering, manufacture, production, assembly, testing, repair, maintenance, modification, operation, demilitarization, destruction, processing, or use of defense articles." Helping counts. Explaining counts.

## The list itself

The articles, services, and related technical data designated under the Arms Export Control Act "constitute the U.S. Munitions List (USML)," and it is organized into Roman-numbered categories. Category XI is Military Electronics. Category XII is "Fire Control, Laser, Imaging, and Guidance Equipment," which is the category an [[cs/military-computing/sins-polaris-inertial-navigation|inertial navigation set]] is at home in. Category XV is spacecraft and related articles.

Within a category the ordering is consistent: entries "usually start by enumerating or otherwise describing end-items, followed by major systems and equipment; parts, components, accessories, and attachments; and technical data and defense services directly related to the defense articles of that USML category." End item first, then the pieces, then the knowledge. The knowledge is at the bottom of every category, which is a structural statement about what these regulations think is worth controlling.

Category XIII carries the entry that matters most for anyone from a communications security background: "military or intelligence cryptographic (including key management) systems, equipment, assemblies, modules, integrated circuits, components, and software (including their cryptographic interfaces) capable of maintaining secrecy or confidentiality of information." Military cryptography is a defense article. Commercial cryptography, since the 1990s, is not, and the gap between those two sentences is the entire subject of [[cs/law/encryption-export-history-and-the-crypto-wars|the crypto wars]] and the reason [[cs/security/comsec-principles|COMSEC]] and commercial security engineering sit under different regulators despite doing similar things.

An article can be on the list either because it is enumerated in a category, or because it is "described in a catch-all paragraph that incorporates specially designed as a control parameter." The catch-all is why classification is a procedure rather than a search. Enumerated entries win over catch-alls, and the specially designed test has its own exclusions.

## The boundary, written down

The clearest statement of the ITAR and EAR relationship is buried in a note attached to a rocketry paragraph, and it is worth quoting because it is the whole rule in one sentence: "For controls on spacecraft, see USML Category XV and, if not described therein, then CCL ECCN 9A515."

Check the Munitions List. If the item is not described there, go to the Commerce Control List entry that catches the rest. That is an order of review, and it produces results that surprise people. The [[cs/law/the-export-administration-regulations|Export Administration Regulations]] confirm it from their own side, stating that items subject to the EAR include "items that are exclusively used for military applications but that do not warrant control under the International Traffic in Arms Regulations." A thing can be exclusively military and still be a Commerce item.

Category XV also shows what does pull an item back onto the Munitions List, and the criterion is classification rather than capability. Spacecraft that "are classified, contain classified software or hardware, are manufactured using classified production data, or are being developed using classified information" are USML articles. Two satellites with the same bus and the same orbit can sit under different regimes because of what was used to build one of them.

## Deemed exports, again, and slightly differently

The ITAR has the same deemed export concept as the EAR, and the difference between the two versions is a detail worth carrying. Under the ITAR, export includes "releasing or otherwise transferring technical data to a foreign person in the United States (a deemed export)." Then the destination rule: "any release in the United States of technical data to a foreign person is deemed to be an export to all countries in which the foreign person has held or holds citizenship or holds permanent residency."

All countries held or holds. The Commerce version reaches the most recent country of citizenship or permanent residency. Same concept, different reach, and the ITAR version is broader in a way that follows a person's whole history rather than their current status.

The countervailing carve-out is the public domain definition, which the ITAR spells out as a list of channels. Public domain "means information which is published and which is generally accessible or available to the public" through newsstands, unrestricted subscriptions, public libraries, patent offices, unlimited distribution at a public conference, approved public release, or "through fundamental research in science and engineering at accredited institutions of higher learning in the U.S. where the resulting information is ordinarily published and shared broadly in the scientific community." The fundamental research channel is conditioned: it does not apply if the university or its researchers accept restrictions on publication of the resulting information.

> [!warning] Scope
> This note describes what the International Traffic in Arms Regulations say and how the U.S. Munitions List is organized. It is a description of a regulatory instrument, not legal advice and not a compliance procedure. It does not classify any item, does not determine jurisdiction for any project, and does not tell anyone whether an activity is permitted. Jurisdiction and classification determinations belong to counsel and to the cognizant agency.

## Related Notes

- [[cs/law/the-export-administration-regulations|The Export Administration Regulations]] - the other side of the boundary, and where an item lands when the Munitions List does not describe it
- [[cs/law/encryption-export-history-and-the-crypto-wars|Encryption Export History and the Crypto Wars]] - the episode in which a whole subject moved from one list to the other
- [[cs/law/wassenaar-and-intrusion-software|Wassenaar and Intrusion Software]] - a later fight over what belongs on a control list at all
- [[cs/security/comsec-principles|COMSEC Principles]] - the discipline whose equipment Category XIII designates
- [[cs/military-computing/sins-polaris-inertial-navigation|Inertial Navigation and the Missile Submarine]] - the kind of system Category XII names

## Sources

- 22 CFR Part 120, Purpose and Definitions, eCFR. https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-120 . Backs the definitions of defense article, defense service, technical data, and public domain, the composition and ordering of USML categories, the enumerated versus catch-all control basis, and the ITAR deemed export rule and its destination.
- 22 CFR Part 121, The United States Munitions List, eCFR. https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-121 . Backs the category titles, the Category XIII cryptography entry, the Category XV classification criterion, and the note directing readers to ECCN 9A515 for spacecraft not described on the USML.
- 15 CFR Part 730, General Information, eCFR. https://www.ecfr.gov/current/title-15/subtitle-B/chapter-VII/subchapter-C/part-730 . Backs the statement that items subject to the EAR include military-only items that do not warrant ITAR control.
