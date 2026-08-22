---
title: Standards
description: "The documents that govern the technologies the rest of this garden explains: what a standard is, how IEEE makes one, what its clauses bind, and where a document stops having power."
draft: false
comments: false
tags:
  - cs
  - standards
date: 2026-08-14
updated:
aliases:
  - Standards
  - IEEE Standards
---

Everywhere else, this garden documents technologies. This section documents the documents. A standard is a negotiated contract between vendors who would rather not interoperate, and reading one tells you things the technology's own manual never will: what was contested, what was left optional, and whose interest the compromise served. Every note here links back to the technology it standardizes, because a standards note that does not connect to the rest of the garden has no reason to exist.

Start with the meta layer. Almost every confusion people have about standards is a confusion about the process, the word `shall`, or which edition is current, and those four notes settle all three before you open a real document.

#### What a standard is

The vocabulary and the machinery. Read this arc first, in order, and the rest of the section becomes readable without further scaffolding.

- [[cs/standards/what-a-standard-actually-is|What a Standard Actually Is]] - a contract about conformance, not a description of a technology
- [[cs/standards/how-ieee-makes-a-standard|How IEEE Makes a Standard]] - the PAR, the working group, and why a 75 percent ballot rule produces optional features
- [[cs/standards/normative-versus-informative-and-the-word-shall|Normative vs Informative, and the Word Shall]] - shall binds, should recommends, may permits, and an informative annex binds nothing
- [[cs/standards/amendments-revisions-and-rollups|Amendments, Revisions, and Rollups]] - the letters, the rollup, and how to work out which document is current
- [[cs/standards/standards-patents-and-frand|Standards, Patents, and FRAND]] - what happens when a mandatory clause reads on somebody's patent

#### The 802 family

The LAN and MAN spine, and the densest link target in the garden. The split note explains the numbering; after that the notes go up the stack, from the wire through bridging and access control to radio.

- [[cs/standards/ieee-802-the-family-and-its-split|IEEE 802: The Family and Its Split]] - why the numbers look the way they do, and what 802.1 owns that the others do not
- [[cs/standards/ieee-802-3-ethernet|IEEE 802.3: Ethernet as a Document]] - a standard still named for an access method almost nothing uses
- [[cs/standards/ieee-802-1q-vlan-tagging|IEEE 802.1Q: VLAN Tagging as Specified]] - the four-byte tag, the reserved VID values, and the revision that swallowed bridging
- [[cs/standards/ieee-802-1d-and-spanning-tree|IEEE 802.1D and Spanning Tree]] - the bridging standard that deleted its own headline protocol and then ceased to exist
- [[cs/standards/ieee-802-1ax-link-aggregation|IEEE 802.1AX: Link Aggregation]] - the clause that changed working groups in 2008 and the name everyone still gets wrong
- [[cs/standards/ieee-802-1x-port-based-access-control|IEEE 802.1X: Port-Based Access Control]] - an envelope and two logical ports, with the authentication method left out on purpose
- [[cs/standards/ieee-802-1ae-macsec|IEEE 802.1AE: MACsec]] - encrypting the wire hop by hop while refusing to say where keys come from
- [[cs/standards/ieee-802-11-wireless-lan|IEEE 802.11: Wireless LAN as a Document]] - three naming systems in play at once, only one of them IEEE's
- [[cs/standards/ieee-802-11i-and-wpa|IEEE 802.11i and WPA]] - a trade association certifying products against a subset of the unfinished draft, then renaming it on ratification
- [[cs/standards/ieee-802-15-4-and-low-rate-wireless|IEEE 802.15.4 and Low-Rate Wireless]] - a standard written as a substrate, deliberately stopping below the network layer

#### Arithmetic and system interfaces

Standards that govern what a program computes and what it is allowed to call. These are the documents your language reference is quietly citing.

- [[cs/standards/ieee-754-floating-point|IEEE 754 as a Document]] - what the standard requires of an implementation and what it hands to the language binding
- [[cs/standards/ieee-754-rounding-and-exceptions|Rounding Modes and Sticky Flags in IEEE 754]] - five rounding rules, five exceptions, and default handling that never stops the program
- [[cs/standards/posix-and-ieee-1003|POSIX, or IEEE 1003]] - an interface standard, three publishers, and a certificate the dominant platform never bought
- [[cs/standards/ieee-1588-precision-time-protocol|IEEE 1588 and the Precision Time Protocol]] - a clock hierarchy, industry profiles, and an accuracy claim that is really a hardware requirement

#### Engineering process standards

The documents that specify how software gets built rather than what it does. They share a habit worth noticing: each one defines a vocabulary, then declines to mandate the thing everyone assumes it mandates.

- [[cs/standards/ieee-12207-software-life-cycle|ISO/IEC/IEEE 12207, the Life Cycle Process Framework]] - life cycle processes without a life cycle, and three different conformance modes
- [[cs/standards/ieee-29148-requirements-engineering|ISO/IEC/IEEE 29148 and What Makes a Requirement Good]] - properties of a single requirement statement, not sections of a document
- [[cs/standards/ieee-1012-verification-and-validation|IEEE 1012 and the Integrity Level]] - effort scaled by consequence of failure rather than by project size
- [[cs/standards/iso-iec-ieee-42010-architecture-description|ISO/IEC/IEEE 42010, the Vocabulary Everyone Borrows]] - stakeholders, concerns, viewpoints and views, with no viewpoint mandated at all

#### Where a standard binds

A document has no force of its own. Three notes on the mechanisms that give it force, the machinery that proves a claim against it, and the cases where neither one held.

- [[cs/standards/standards-in-procurement-and-defense-acquisition|How a Standard Becomes a Contract]] - a citation in a solicitation turning an industry document into an obligation
- [[cs/standards/conformance-testing-and-plugfests|Conformance Testing and Plugfests]] - what a suite can ask, what a certification mark licenses, and why vendors still meet in a room
- [[cs/standards/when-the-standard-loses-to-the-implementation|When the Standard Loses to the Implementation]] - three cases where the deployed implementation became the real specification

---

*The full file listing follows below, generated automatically by Quartz.*
