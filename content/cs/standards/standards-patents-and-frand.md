---
title: Standards, Patents, and FRAND
description: "A standard-essential patent turns an exclusion right into a toll, and FRAND is the voluntary contract that keeps the toll bounded; the disclosure letter is the mechanism, the ambush is the failure mode, and antitrust law is the only enforcement anyone actually has."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-08-04
updated:
aliases:
  - FRAND
---

A patent is a right to stop other people from doing something. A standard is a document telling everyone in an industry to do exactly one specific thing. Put those two instruments in the same room and the second one manufactures monopolies out of the first, because the moment a technique is written into a standard, everyone who wants to interoperate must practise it, whether or not somebody owns it.

> [!note] The idea
> A standard-essential patent converts a **right to exclude** into a **right to charge**, and the entire patent machinery around standards exists to bound that conversion in advance. Disclosure letters surface the patents before the group commits, a FRAND commitment caps what the holder may demand, and if a holder refuses, the technique gets designed out. None of that is enforced by the standards body, which has no such power; it is enforced by contract law and by competition regulators after the fact.

## Essentiality is created by the committee, not the invention

The vocabulary matters here because the causation runs backwards from intuition. "A patent becomes standard-essential when a standard-setting organization sets a standard that adopts the technology that the patent covers." Nothing about the invention changes. Its value changes, because a committee just made practising it mandatory for an entire market.

That is why standards bodies negotiate the licence before adopting the technique rather than after. FRAND terms "denote a voluntary licensing commitment that standards organizations often request from the owner of an intellectual property right (usually a patent) that is, or may become, essential to practice a technical standard." The leverage runs one way and only in advance: "If the patent holder refuses upon request to license a patent that has become essential to a standard, then the standard-setting organization must exclude that technology." Before adoption, the group can walk. After adoption, it cannot, and everyone in the room knows it.

The non-discrimination half has teeth that engineers usually miss. "Once an organization is offering a FRAND license they are required to offer that license to anyone" implementing the standard, not only to the members who sat in the working group. Without that, participation in a standards body would become a licensing club and non-members would be locked out of a market they had no say in defining.

## The disclosure letter

The mechanism that makes any of this possible is a piece of paperwork filed before the technical decision. Standards organizations "typically require each member of their standard-setting committees to file letters with them that either deny knowledge of company patents that are relevant to the standard, or identify the patents they do know about."

The choice the group then faces is genuinely engineering-shaped: "When an organization is advised of relevant patents, it will often either seek to use a different technology for the standard, or obtain a commitment from the patent owner that it will license users of the standard on fair reasonable and non-discriminatory (FRAND) terms." Design around it or license it. The first option is why some standards contain a mechanism that looks slightly worse than the obvious one. That awkward second-best construction in the clause is frequently not incompetence, it is a patent being routed around, and it is invisible unless you know to look for it.

IEEE codifies this in its bylaws. "An important part of the IEEE patent policy is the FRAND commitment, which is a voluntary contractual commitment" by a holder whose technology entered a standard. Voluntary is precise and load-bearing. IEEE cannot compel a licence. It can only decline to standardize what it cannot get one for.

## What the terms are supposed to mean

Fair, reasonable, and non-discriminatory are three separate constraints. Fair targets the shape of the deal, ruling out tying, coerced grant-backs of the licensee's own IP, and exclusivity conditions. Reasonable targets the rate, and the usual test asks what the aggregate royalty burden on the industry would be if every implementer paid a comparable rate. Non-discriminatory targets consistency across licensees, so that a new entrant faces the same underlying conditions as an incumbent.

The unresolved question sits inside "reasonable." "The most controversial issue in RAND licensing is whether the" reasonable price should capture the extra value that adoption itself created. A technique is worth more once a standard has made it compulsory than it was when it was one candidate among several, and charging for the increment means charging for the committee's decision rather than for the invention.

There is also a category of implementer for whom FRAND does not work at all. "RAND terms exclude intangible goods which the producer may decide to distribute at no cost and where third parties may make further copies." A per-copy royalty, however small, is unpayable by a project that does not count its copies, which is why [[cs/history/gnu-stallman-and-free-software|the free software world treats a royalty-bearing standard as a closed one]] no matter how modest the fee.

## The ambush

The failure mode has a name. "A patent ambush occurs when a member of a standard-setting organization, while participating in development and setting a standard, withholds information about a patent" relevant to that standard, and then asserts it against implementations once the standard has been adopted.

The economics of the ambush are what make it worth doing. The value of the patent is highest precisely when the industry has already retooled around the standard and cannot cheaply back out, so waiting maximizes the payout. The standards body has no remedy of its own to apply, and so the sanction has to come from outside: "Consequently, the practice has been considered to be in breach of antitrust or competition law in the United States" and in the European Union, with litigation and regulatory action following.

IEEE has been through the resulting policy fight in public. Its 2015 patent policy amendments were contentious, and "One particularly controversial amendment was a provision that prohibited patent holders from seeking injunctions and exclusion orders (from the ITC) against infringers of standard-essential patents." That provision goes at the heart of the conversion described above: an injunction is the exclusion right reasserting itself, and forbidding it makes a standard-essential patent a claim for money and nothing more.

> [!warning] The document you are reading may be paywalled by the same economics
> IEEE standards are generally sold, not published. The exception is narrow: "The IEEE Get Program makes some standards publicly available for download" at no charge. Sales revenue funds the process, which means the artifact everyone must conform to is frequently one that most implementers have never read in full.

## Why this belongs in an engineer's model

The patent layer explains textual features that look arbitrary from the inside: the clause that specifies a strange but patent-free construction, the optional feature that exists because one member would not commit, the algorithm that is named but not described. It also sets the timeline. Patents expire, and techniques that were designed around for twenty years suddenly become available, which is why old standards sometimes acquire clean re-specifications of things they once carefully avoided. The same clock governed [[cs/military-computing/rsa-and-computational-hardness|the patent that covered RSA]] and the protocols that waited it out.

## Related Notes

- [[cs/standards/how-ieee-makes-a-standard|How IEEE Makes a Standard]] for the working group where disclosure letters are filed and the design-around gets chosen.
- [[cs/standards/what-a-standard-actually-is|What a Standard Actually Is]] for the negotiation this is the commercial half of.
- [[cs/standards/ieee-802-1ae-macsec|IEEE 802.1AE, MACsec]] for a security standard whose cipher-suite choices are shaped by the same constraints.
- [[cs/history/gnu-stallman-and-free-software|GNU, Stallman, and Free Software]] for the licensing model FRAND structurally excludes.
- [[cs/military-computing/rsa-and-computational-hardness|RSA and Computational Hardness]] for a foundational algorithm whose patent shaped a generation of protocol design.
- [[cs/military-computing/des-standardization-and-symmetric-crypto|DES and the Politics of a Standard Cipher]] for a case where the contested asset was the parameter rather than the patent.

## Sources

- [Reasonable and non-discriminatory licensing (Wikipedia)](https://en.wikipedia.org/wiki/Reasonable_and_non-discriminatory_licensing) backs the FRAND definition, how a patent becomes standard-essential, the exclusion of refused technology, the obligation to license anyone, the disputed treatment of adoption-created value, and the exclusion of costless distribution schemes.
- [Patent ambush (Wikipedia)](https://en.wikipedia.org/wiki/Patent_ambush) backs the definition of a patent ambush, the disclosure-letter requirement placed on committee members, the design-around-or-license response, and the antitrust treatment of the practice.
- [IEEE Standards Association (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_Standards_Association) backs the FRAND commitment inside IEEE's patent policy, the contested 2015 injunction provision, and the IEEE Get Program.
