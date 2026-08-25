---
title: "When the Standard Loses to the Implementation"
description: "A standard has no power to make anyone obey it. Three documented cases where the deployed implementation became the real specification, and what each one cost the document."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-08-11
updated:
aliases: []
---

Nothing in a standards document reaches out and stops a vendor. The committee can write `shall`, ballot it, publish it, and sell it, and a shipping product that ignores the clause keeps shipping. What actually enforces a standard is money: a procurement office that will not buy noncompliant gear, a certification mark a customer looks for, a peer implementation that refuses to talk to you. When none of those pressures apply, or when the installed base is large enough that correcting it costs more than tolerating it, the document loses. The interesting part is what losing looks like, because it is rarely a repudiation. Usually the standard quietly changes to match what was already on the wire.

> [!note] The idea
> A standard is a coordination device, and coordination devices are defeated by prior coordination. Once enough implementations agree with each other and disagree with the document, the cheapest resolution is to amend the document, which converts a violation into a permitted alternative and preserves the fiction that everyone conformed all along. The failure mode to watch for is not vendors defying a standard. It is a standard ratifying whatever the vendors already did.

## Case one: the frame everyone actually sends

Ethernet arrived before [[cs/standards/ieee-802-3-ethernet|the IEEE document that standardizes it]]. DEC, Intel and Xerox had shipped a frame format with a two-octet EtherType field naming the encapsulated protocol. Then the committee got hold of it. "As this industry-developed standard went through a formal IEEE standardization process, the EtherType field was changed to a (data) length field in the new 802.3 standard." Since the receiver still had to learn the protocol somehow, 802.3 required an IEEE 802.2 LLC header after the length to carry that information.

The market did not follow. Implementers kept sending the DIX frame, because it was simpler and cost fewer bytes, and the standard eventually gave in: "Many years later, the 802.3x-1997 standard, and later versions of the 802.3 standard, formally approved of both types of framing." The 1997 change is worth reading in its exact form. "In IEEE 802.3x-1997, the IEEE Ethernet standard was changed to explicitly allow the use of the 16-bit field after the MAC addresses to be used as a length field or a type field." The committee did not pick a winner. It legalized the ambiguity and left disambiguation to a numeric convention, since EtherType values must be at least 1536 while the maximum 802.3 payload length is 1500, so the field decodes itself.

Fourteen years of divergence ended with the document changing, and the verdict on the ground is not close: "Ethernet II framing is the most common in Ethernet local area networks, due to its simplicity and lower overhead."

The same page records a harder version of the story. Novell built its IPX transport on an early draft: "They did not use any LLC header but started the IPX packet directly after the length field." The assessment is direct. "This does not conform to the IEEE 802.3 standard." It shipped anyway, in enormous volume, and survived on the wire because IPX packets always began with a byte pattern that LLC headers essentially never used. A nonconforming frame format coexisted with the standard for years on an accident of encoding, and it took a later NetWare release to move the default back onto 802.2 with LLC. Nonconformance is not always punished. Sometimes it is merely lucky.

## Case two: the clause that only recommends

[[cs/standards/ieee-754-floating-point|IEEE 754]] is the most successfully adopted standard in this section, and it still has a region where the implementations rule. The 1985 edition "left aspects of the language interface unspecified, which led to inconsistent behavior between compilers, or different optimization levels in an optimizing compiler." The 2008 revision addressed it, but the strength of the fix is the whole point: "The reproducibility clause recommends that language standards should provide a means to write reproducible programs."

Recommends. So compilers make their own call, and the call is uniform and against the recommendation. Contraction of a multiply and an add into a fused multiply-add, or evaluation of an intermediate in a wider format than the source declared, both change results. "C/C++ Compilers such as GCC and cl.exe generally default to allowing both unless specifically asked not to, as these changes can generate faster code without obvious loss of accuracy." The default is the specification most programs actually run under. A developer who assumed the arithmetic standard governed the expression is reading the wrong document, because [[cs/languages/common/numeric-types-and-overflow-semantics|the language and its compiler]] hold that decision and have spent it on speed.

This is a gentler defeat than the Ethernet one. Nobody violated 754. The committee wrote a clause it knew would not bind, the toolchains exercised the latitude, and the practical semantics of floating-point expressions are now set by compiler defaults and flags rather than by the arithmetic standard.

## Case three: losing the name

The third loss is not about behavior at all. IEEE maintains [[cs/standards/ieee-802-11-wireless-lan|802.11]] as a base standard that periodically absorbs its amendments, and absorption is supposed to retire them: "While each amendment is officially revoked when it is incorporated in the latest version of the standard, the corporate world tends to market to the revisions because they concisely denote the capabilities of their products." The consequence is stated plainly. "As a result, in the marketplace, each revision tends to become its own standard."

A revoked document that is still the thing everybody names, buys, and writes into requirements has not really been revoked. And the naming went further out of IEEE hands in 2018, when "the Wi-Fi Alliance began using a consumer-friendly generation numbering scheme for the publicly used 802.11 protocols." Generations one through eight map onto 802.11b, a, g, n, ac, ax, be and bn in that order. The public vocabulary for a wireless standard is now issued by a trade association that also owns the trademark and runs the certification program, and the ordering follows market adoption rather than publication.

> [!warning] What this is not
> None of these is a case of a bad standard. 802.3, 754 and 802.11 are among the most successful engineering documents ever written, and their success is exactly why the installed base got large enough to outvote them. The pattern belongs to adoption, not to quality.

## Reading the pattern

Three distinct mechanisms, one shape, and the largest instance of it is not in this section at all: [[cs/networking/osi-and-tcp-ip-models|the OSI reference model against TCP/IP]] is the same story told at the scale of an entire protocol stack. The document lost the frame format to an earlier shipping design and amended itself to agree. It lost expression evaluation to compiler defaults because it chose a recommendation over a requirement. It lost its own naming to a trade association because the market wanted a number it could print on a box.

The practical lesson is about where to look for the real specification. When a document permits, look at what the dominant toolchain defaults to, because the default is the de facto rule. When a document is retroactively amended to allow something, ask what was already deployed at the time, because the amendment is usually a receipt for a fight that was already over. And when the popular name for a technology is not the name on the standard, the naming authority has moved, which tells you who now controls the roadmap. This is the failure mode the section's opening note flags when a [[cs/standards/what-a-standard-actually-is|reference implementation gets treated as the authority]]: the erosion starts long before anyone admits the document stopped being in charge.

## Related Notes

- [[cs/standards/amendments-revisions-and-rollups|Amendments, Revisions, and Rollups]] for the maintenance machinery that absorbs a defeat into the next revision.
- [[cs/standards/normative-versus-informative-and-the-word-shall|Normative vs Informative]] for why a clause that recommends was never going to bind a compiler.
- [[cs/standards/conformance-testing-and-plugfests|Conformance Testing and Plugfests]] for the certification program that ended up owning the Wi-Fi name.
- [[cs/military-computing/dod-model-and-tcp-ip-standardization|The DoD Model and TCP/IP Standardization]] for how the winning stack got its own mandate.
- [[cs/networking/mtu-and-fragmentation|MTU and Fragmentation]] for what that 1500-octet limit does to everything above it.

## Sources

- [Ethernet frame (Wikipedia)](https://en.wikipedia.org/wiki/Ethernet_frame) backs the DIX EtherType field becoming a length field in 802.3, the 802.3x-1997 approval of both framings and its exact wording, the prevalence of Ethernet II framing, the 1536 and 1500 disambiguation convention, and the Novell raw 802.3 format and its nonconformance.
- [IEEE 754 (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_754) backs the 1985 edition leaving the language interface unspecified and the resulting inconsistency across compilers and optimization levels, the reproducibility clause being a recommendation, and the GCC and cl.exe defaults on contraction and higher precision.
- [IEEE 802.11 (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.11) backs the revocation of amendments on incorporation, the market habit of marketing to revisions so each becomes its own standard, and the 2018 Wi-Fi Alliance generation numbering and its mapping.
