---
title: "How a Standard Becomes a Contract"
description: "The mechanism by which a citation in a solicitation turns an industry document into a binding obligation, why the edition and its amendments have to be named, and the difference between compliance and conformance when money is attached."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-08-14
updated:
aliases: []
---

A standard published by IEEE or ISO binds nobody. It is a private document written by a consortium, and no engineer is obliged to open it. What changes that is a citation: the moment a solicitation names the document, the standard stops being advice and becomes a term of the agreement, enforceable the same way a delivery date is. The mechanism by which that happens is written down, it is public, and it is more specific than most engineers expect.

> [!note] The idea
> Federal acquisition regulation does not tell you to follow good standards. It tells you *how to cite one*, and the citation rules are where the engineering consequences live. A solicitation citing a standard shall identify the document's approval date and the dates of any applicable amendments and revisions, and it is forbidden from using a general reference such as the issue in effect on the date of the solicitation. The contract therefore binds a *frozen text*, not a living standard. When the working group publishes a revision next year, your obligation does not move, and neither does your defense if the government claims you fell short.

## What the regulation is actually for

Part 11 of the Federal Acquisition Regulation "prescribes policies and procedures for describing agency needs," and its opening policy is a preference for describing outcomes rather than designs. Acquisition officials are directed, to the maximum extent practicable, to state requirements in terms of functions to be performed, performance required, or essential physical characteristics. Requiring agencies "should not dictate detailed design solutions prematurely," and should apply specifications and standards "initially for guidance only, making final decisions on the application and tailoring of these documents as a product of the design and development process."

That is the same discipline the [[cs/standards/ieee-29148-requirements-engineering|requirements standard]] calls *appropriate*, applied at the scale of a program: a requirement that names an implementation has decided the design before anyone compared alternatives. The motive is competition rather than elegance. A performance requirement can be met by several vendors; a design requirement can often be met by one.

## The order of precedence

When an agency does need a requirements document, it may select an existing one, modify or combine existing ones, or write a new one, consistent with a stated order of precedence: documents mandated for use by law first, then performance-oriented documents such as a performance work statement or statement of objectives, then detailed design-oriented documents, then government-issued standards outside the Defense or Federal series for non-repetitive acquisitions.

Sitting above that ordering is the rule that reshaped defense engineering in the 1990s. Under OMB Circular A-119 and the National Technology Transfer and Advancement Act of 1995, agencies must use voluntary consensus standards, when they exist, in lieu of government-unique standards, except where inconsistent with law or otherwise impractical. The regulation is explicit that the private sector manages and administers those standards and that they are not mandated by law, naming ISO 9000 and IEEE 1680 as examples.

That single policy is why so many military-unique documents disappeared. The clearest software example is dated: IEEE/EIA 12207 officially replaced MIL-STD-498 for the development of Department of Defense software systems on 27 May 1998. A standard written by and for the government was retired in favor of one written by an industry consortium that the government then cited. The engineering did not change much. The ownership of the document did, and with it the ability of a contractor to buy the same standard its commercial customers were already using. That transition is the practical counterweight to the older pattern of [[cs/military-computing/ada-and-language-standardization|standardization by mandate]], where the government wrote the specification itself and required it by fiat.

## Naming the edition, and everything attached to it

This is the clause worth memorizing. Solicitations citing requirements documents listed in the GSA Index or available on the Defense Department's ASSIST website shall identify each document's approval date and the dates of any applicable amendments and revisions. And then the prohibition, stated flatly: do not use general identification references, such as the issue in effect on the date of the solicitation.

A standard is not one text. It is a base document plus amendments plus corrigenda plus rollups, and which combination applies is a substantive engineering question. A protocol amendment can change conformance requirements; a corrigendum can change a formula. Binding "the current version" would move a contractor's obligations whenever a working group balloted something, so the regulation freezes instead. Understanding what you are frozen to means understanding [[cs/standards/amendments-revisions-and-rollups|how amendments, revisions, and rollups accumulate]] on a base document.

References inside a cited document get the same treatment. Where documents refer to other documents, the references shall be restricted to documents or portions that apply in the acquisition, shall cite the extent of their applicability, shall not conflict with other provisions of the solicitation, and shall identify all applicable first-tier references. First tier. The chain of incorporation by reference has a stated depth, which is the regulation admitting that a citation graph left unbounded would swallow the contract. That bounded flow-down is the same problem as tracking transitive dependencies in a [[cs/languages/common/software-supply-chain-and-provenance|software supply chain]], with the same failure mode: an obligation you inherited three hops down and never read.

Contracting offices do not normally furnish the cited documents. They insert a solicitation provision instead, 52.211-1 for GSA Index documents and 52.211-2 for those in ASSIST, telling offerors where to get them. Most unclassified defense specifications and standards may be downloaded from ASSIST, which is why a defense engineer reads MIL-STD text for free while the IEEE standard cited beside it costs several hundred dollars.

## Compliance is not conformance

The two words are used interchangeably in engineering conversation and they are not interchangeable in a contract.

*Conformance* is a demonstrated result: a named product, tested against a named edition, with the result on record. POSIX is the cleanest example, where certification means a product passed the automated conformance tests, its certification has not expired, and the product has not been discontinued. That is checkable by a third party who was not in the room.

*Compliance*, in ordinary usage, is a self-assessment. The POSIX case makes the gap visible in a single sentence: systems that are not certified as POSIX conforming, yet are considered partially conforming, are sometimes called compliant. Somebody read the standard and formed a view. Nothing was measured, and the pattern generalizes to every standards claim on a datasheet.

A third pattern sits between them and is easy to miss. Process standards define their own conformance modes: 12207 distinguishes full conformance to tasks, full conformance to outcomes, and tailored conformance, and expects the supplier to *declare* which processes are in scope. A supplier claiming conformance to outcomes on six declared processes and one claiming conformance to tasks on twenty have both said "we conform to 12207," and the statements are not close to equivalent.

> [!tip] The four questions to ask any standards claim
> Which document, by number. Which edition, by year, and which amendments. Conformance demonstrated against what evidence, or compliance asserted by whom. And what was declared in scope, since most process standards let you conform to a subset you chose yourself. A claim that survives all four is worth something. Most do not get past the second.

## Why security procurement solved this first

Security requirements are where the gap costs the most, because the claim is about the absence of something. The Orange Book made assurance a graded, evaluated property with a published product list, so a procurement could name a level instead of trusting a vendor letter. That model of [[cs/military-computing/tcsec-and-graded-assurance|graded assurance]] is the ancestor of every later scheme that pairs a standard with an evaluation regime, and it exists because a self-asserted security claim is worth nothing to the party carrying the risk.

## Related Notes

- [[cs/standards/posix-and-ieee-1003|POSIX, or IEEE 1003]] - a certification regime you can inspect, and the compliance claims that surround it
- [[cs/standards/ieee-12207-software-life-cycle|ISO/IEC/IEEE 12207]] - the process standard that replaced MIL-STD-498 and defines its own conformance modes
- [[cs/military-computing/ada-and-language-standardization|Ada and Language Standardization by Mandate]] - what the government did before it preferred commercial consensus standards
- [[cs/military-computing/tcsec-and-graded-assurance|The Orange Book and Graded Assurance]] - pairing a standard with an evaluation so a claim means something
- [[cs/standards/amendments-revisions-and-rollups|Amendments, Revisions, and Rollups]] - why naming the edition is the whole ballgame

## Sources

- Federal Acquisition Regulation, Part 11, Describing Agency Needs. https://www.acquisition.gov/far/part-11 . Backs the scope of the part, the performance-oriented policy and the prohibition on prematurely dictating design solutions, the order of precedence for requirements documents, the OMB Circular A-119 and NTTAA preference for voluntary consensus standards, the requirement to identify approval dates and applicable amendments and revisions, the prohibition on general identification references, the first-tier reference rule, the 52.211-1 and 52.211-2 solicitation provisions, and free ASSIST availability of defense standards.
- "ISO/IEC 12207," Wikipedia. https://en.wikipedia.org/wiki/ISO/IEC_12207 . Backs the replacement of MIL-STD-498 by IEEE/EIA 12207 for DoD software development on 27 May 1998 and the three conformance modes the standard defines.
- "POSIX," Wikipedia. https://en.wikipedia.org/wiki/POSIX . Backs what a conformance certification means and the usage in which uncertified but partially conforming systems are called compliant.
