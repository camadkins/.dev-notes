---
title: What a Standard Actually Is
description: "A standard is a negotiated contract between parties who would rather not interoperate, and reading one as a technical manual misses the point: it fixes what conformance means without ever compelling anyone to adopt it or guaranteeing the result is fit for use."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-06-21
updated:
aliases: []
---

Two vendors sell switches. Each would prefer the other's boxes did not work on the same wire, because a customer who has already bought one port of your gear and cannot mix it is a customer who buys the next port from you too. Interoperability is a cost to the incumbent and a gift to the challenger. And yet both vendors send engineers to the same meetings, argue for months over a field width, and sign a document that makes their products substitutable. That tension is the whole subject. A standard is not a tutorial written by a benevolent authority. It is a treaty, and like a treaty it records what the parties conceded rather than what any one of them wanted.

> [!note] The idea
> A standard is a **contract about conformance**, not a description of a technology. It fixes the minimum set of behaviors an implementation must exhibit to be called conforming, deliberately leaves the rest open so that competitors still have somewhere to compete, and carries no power of its own to make anyone implement it or to make a conforming product any good.

## The document, and what it is not

Wikipedia's working definition is deliberately dry: a technical standard "is usually a formal document that establishes uniform engineering or technical criteria, methods, processes, and practices." Notice what that sentence does not promise. It does not say the criteria are the best available, or that they describe how a working system is built, or that they were chosen by the engineers who understood the problem best. It says the document establishes criteria, uniformly, so that two parties can point at the same paragraph and agree on whether a thing passes.

That framing explains the reading strategy for the whole of `cs/standards`. When you open a standard looking for an explanation of how the technology works, you will find a bad explanation, because explanation is not the document's job. Its job is to be unambiguous under adversarial reading, by two engineers from two companies who each want the clause to mean the thing that favors their existing silicon. Prose that is beautiful to read is prose with room to argue in it, and standards prose has been sanded until there is nowhere left to stand.

The process that produces the document varies more than people assume. It "may be by edict or may involve the formal consensus of technical experts." Both routes produce something you would call a standard, and they produce very different documents. An edict standard is short, opinionated, and usually written by whoever has the authority to make it stick, which is why [[cs/military-computing/des-standardization-and-symmetric-crypto|DES arrived as a federal cipher]] with a key length nobody outside the process got to argue about, and why [[cs/military-computing/ada-and-language-standardization|Ada was imposed on the Department of Defense by mandate]] rather than adopted by preference. A consensus standard is long, hedged, and full of options, because every option is a place where two members refused to converge and the group chose to ship rather than deadlock.

## De jure, de facto, and the gap between them

The formal vocabulary distinguishes a standard that is defined by a recognized body or required by law from one that simply won. A de facto standard "is a custom or convention that is commonly used even though its use is not required." Nothing about a de facto standard is weaker in practice. QWERTY is not weaker for being a habit. The difference is where the authority lives: in a document you can cite, or in an installed base you cannot dislodge.

The interesting cases run in both directions. A de facto standard can be formalized after the fact, which is what happened when Adobe's format was taken through the process and "In 2005, PDF/A became a de jure standard as ISO 19005-1:2005." The technology did not change. What changed was that a procurement officer could now write a requirement referencing a document rather than referencing a company. That is most of what de jure status buys, and it is worth a great deal in any market where purchasing is done by reference.

The other direction is the one that generates the interesting failures. A de jure standard exists, is technically fine, and loses anyway, because the market coordinated on something else first. [[cs/history/world-wide-web-browser-wars|The browser wars]] are the canonical example: the specification said one thing, the dominant implementation did another, and for years the thing you had to conform to was the implementation. A standard has no enforcement arm. It can only be adopted.

## The reference implementation as an interpretation of last resort

Standards bodies learned that natural language, even sanded natural language, is not enough. Hence the reference implementation, which "often accompanies a technical standard, and demonstrates what should or what must" be treated as correct behavior. It resolves the arguments the prose could not close, and it does two structural jobs before the standard even ships: it verifies that the specification is implementable at all, and it "serves as a Gold Standard against which other implementations can be measured."

The trap is treating the reference as the target. A reference implementation "may or may not be production quality," and typically is not, because its author optimized for legibility against the spec rather than for throughput. When a reference and a standard disagree, the standard is the authority and the disagreement is a defect report. When implementers quietly treat the reference as the authority, the standard has already begun to erode, which is the failure mode discussed in `cs/standards/when-the-standard-loses-to-the-implementation`.

## What a standard cannot do

Three limits are worth internalizing before reading a single clause.

It cannot make you compliant with your own requirements. "The existence of a published standard does not imply that it is always useful or correct," and more sharply, "if an item complies with a certain standard, there is not necessarily assurance that it is fit for any particular use." Conformance is a claim about a document, not about your deployment. The specifier carries the burden of choosing the right standard and the right options within it.

It cannot compel adoption. Standards bodies "often have more diverse input and usually develop voluntary standards," and voluntary is the operative word. A standard acquires force only when something outside it (a regulator, a procurement contract, a certification mark) chooses to reference it. That borrowed force is the subject of `cs/standards/standards-in-procurement-and-defense-acquisition`.

It cannot close what the parties refused to close. Every optional feature, every configurable parameter, every "implementation dependent" is the fossil of an argument. Reading a standard well means noticing those fossils, because they mark exactly where two conforming products will fail to work together.

## Related Notes

- [[cs/standards/normative-versus-informative-and-the-word-shall|Normative vs Informative, and the Word Shall]] for how the contract's binding clauses are marked.
- [[cs/standards/how-ieee-makes-a-standard|How IEEE Makes a Standard]] for the process that produces the concessions described here.
- [[cs/standards/standards-patents-and-frand|Standards, Patents, and FRAND]] for the commercial interest that makes the negotiation adversarial.
- [[cs/military-computing/des-standardization-and-symmetric-crypto|DES and the Politics of a Standard Cipher]] for a standard written by edict and the parameter nobody outside got to argue.
- [[cs/military-computing/ada-and-language-standardization|Ada and Language Standardization by Mandate]] for what happens when adoption is compelled by a customer rather than chosen.
- [[cs/software-engineering/semantic-versioning|Semantic Versioning]] for a de facto standard whose force comes entirely from tooling that assumes it.

## Sources

- [Technical standard (Wikipedia)](https://en.wikipedia.org/wiki/Technical_standard) backs the definition of a technical standard, the edict-versus-consensus split, the voluntary nature of standards-body output, and the limits on what conformance assures.
- [De facto standard (Wikipedia)](https://en.wikipedia.org/wiki/De_facto_standard) backs the de facto definition and the PDF/A path from de facto format to ISO 19005-1:2005.
- [Reference implementation (Wikipedia)](https://en.wikipedia.org/wiki/Reference_implementation) backs the role of a reference implementation, its gold-standard function, and the caveat about production quality.
