---
title: "IEEE 802.11: Wireless LAN as a Document"
description: "The amendments are revoked the moment they are rolled up, yet the market keeps selling them by letter; meanwhile the generation numbers on the box come from a trade association, not from IEEE."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-06-18
updated:
aliases:
  - 802.11
  - Wi-Fi Standard
  - 802.11 Amendments
---

Three naming systems are in play at once. IEEE publishes a base standard with a year on it. IEEE also publishes amendments with letters. And a trade association sells generation numbers. A product box says Wi-Fi 6, a datasheet says 802.11ax, and the normative document is 802.11-2024. All three refer to overlapping but non-identical things, and understanding which is which is most of what reading this standard requires.

> [!note] The idea
> 802.11's central document oddity is that **its amendments are dead the moment they are absorbed and the market keeps selling them anyway**. Each lettered amendment is officially revoked when it is rolled into a base revision, yet vendors market by letter because a letter names a capability while a base-standard year names nothing. The result is a vocabulary in which the units people trade in do not exist as documents.

## The base standard and the shape of its growth

The full title tells you the scope precisely: "Part 11: Wireless LAN Medium Access Control (MAC) and Physical Layer (PHY) Specifications." MAC and PHY, nothing above. "The base version of the standard was released in 1997 and has had subsequent amendments," and the current edition is "IEEE 802.11-2024," published 28 April 2025.

The market did not adopt the base standard. "802.11-1997 was the first wireless networking standard in the family, but 802.11b was the first widely accepted one," followed by a, g, n, ac and ax. So the document everyone treats as the origin was commercially irrelevant, and the first amendment did the work. That is a useful corrective to any tidy story about standards leading technology: this one shipped a specification that nobody bought and then found its market in a follow-up.

The distinguishing constraint on the whole family sits in one sentence: "The 802.11 family consists of a series of half-duplex over-the-air modulation techniques that use the same basic protocol." Half duplex. A radio cannot listen while it transmits, so a station cannot detect a collision the way a station on a shared coax could. Every difference between this MAC and 802.3's follows from that, and the mechanism is described in [[cs/networking/wifi-and-802-11|the Wi-Fi note]]. What belongs here is what the standard was consequently forced to make normative.

Because collisions cannot be detected, success has to be reported: "After receiving a data frame, the receiving station will send an ACK frame to the sending station if no errors are found." Positive acknowledgement is built into the MAC, which is a real departure from Ethernet, where the link layer is unacknowledged and loss is somebody else's problem. Wireless pushes reliability down a layer.

And the famous fix for the hidden node is not mandatory. "The RTS and CTS frames provide an optional collision reduction scheme for access points with hidden stations." Optional. A conforming station need not implement the handshake, and in practice most deployments leave it off because the overhead usually costs more than the collisions it avoids. That is a clean case of the pattern in [[cs/standards/normative-versus-informative-and-the-word-shall|reading requirement levels]]: the mechanism everyone quotes as the solution to the hidden-node problem is a permission, not a requirement.

## Amendments, and the letters that outlive their documents

The growth mechanism is the same as everywhere in 802: lettered amendments, periodically rolled into a base revision. What is unusual is how the market responded. "While each amendment is officially revoked when it is incorporated in the latest version of the standard, the corporate world tends to market to the revisions because they concisely denote the capabilities of their products. As a result, in the marketplace, each revision tends to become its own standard."

Read that as an economic explanation of a naming failure. A letter is a feature bundle: 802.11n means multiple spatial streams and wider channels, and a buyer can use that. A base-standard year means whatever amendments happened to be absorbed by then, which is useless as a purchasing signal. So the letters persist as product categories long after they stop existing as documents, and requirements written against 802.11n are written against something formally revoked. The general version of this problem is in [[cs/standards/amendments-revisions-and-rollups|the note on rollups]].

Not every letter is a feature. Several are "service amendments that are used to extend the current scope of the existing standard," and may carry corrections. The working group's list of task groups makes the mix visible: alongside the throughput work sit "TGbi - Enhanced Privacy Protection (EPP)," "TGbn - Ultra High Reliability (UHR)," and "TGbt - Post-Quantum Cryptography (PQC)." A wireless LAN standard now has a [[cs/security/post-quantum-cryptography|post-quantum]] task group, which is a good indicator of how long these documents expect to live.

There is even a shorthand for the ambiguity: "802.11x is a shorthand for 'any version of 802.11', to avoid confusion with '802.11' used specifically for the original 1997 version." Which collides badly with 802.1X, an unrelated access-control standard, and generates a durable supply of confusion in security documentation.

## The generation numbers are not IEEE's

The third naming system belongs to a different organization entirely. "In 1999, the Wi-Fi Alliance was formed as a trade association to hold the Wi-Fi trademark under which most products are sold." Wi-Fi is a certification mark. It is not the name of a standard, and IEEE does not own it.

The generation numbers came much later: "In 2018, the Wi-Fi Alliance began using a consumer-friendly generation numbering scheme for the publicly used 802.11 protocols," mapping generations one through eight onto 802.11b, a, g, n, ac, ax, be and bn in that order. Two features of that mapping repay attention. It is retroactive, so Wi-Fi 1 through 3 were assigned to amendments that predate the scheme, and indeed "There are only official generation names for Wi-Fi 4 onwards" in the Alliance's own usage. And it is not in publication order: 802.11b is generation 1 and 802.11a is generation 2, even though 802.11a was ratified alongside it, because the numbering follows market adoption rather than the standards record.

The practical consequence for anyone writing a requirement is that "Wi-Fi 6" is a certification claim against a trade association's test program, while "802.11ax" is a claim against an IEEE document, and they are not the same assertion. Certification tests interoperability against a profile; conformance is a claim about a specification. That distinction is the whole subject of `cs/standards/conformance-testing-and-plugfests`.

> [!example] A clause you will never guess from the outside
> In 802.11, "time unit (usually abbreviated TU) is used to indicate a unit of time equal to 1024 microseconds," and "Numerous time constants are defined in terms of TU (rather than the nearly equal millisecond)." Beacon intervals, listen intervals and timeouts are all counted in 1024-microsecond units. A power of two rather than a decimal millisecond, because a counter divided by 1024 is a shift, and the standard was written for hardware that would rather shift than divide. The default beacon interval of 100 TU is therefore not 100 milliseconds; it is 102.4.

## Related Notes

- [[cs/networking/wifi-and-802-11|Wi-Fi and 802.11]] for how the access method behaves on the air.
- [[cs/standards/ieee-802-11i-and-wpa|IEEE 802.11i and WPA]] for the security amendment and the Alliance's role in shipping it early.
- [[cs/standards/amendments-revisions-and-rollups|Amendments, Revisions, and Rollups]] for the mechanism that revokes the letters people keep buying.
- [[cs/standards/normative-versus-informative-and-the-word-shall|Normative vs Informative, and the Word Shall]] for why an optional collision-reduction scheme is optional on purpose.
- [[cs/security/post-quantum-cryptography|Post-Quantum Cryptography]] for what a current 802.11 task group is now specifying.
- [[cs/standards/ieee-802-the-family-and-its-split|IEEE 802: The Family and Its Split]] for the architecture this working group must remain compatible with.

## Sources

- [IEEE 802.11 (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.11) backs the base standard's 1997 release and the 802.11-2024 current edition, the half-duplex characterization, the mandatory ACK frame and optional RTS/CTS scheme, the revocation of amendments on incorporation and the market's contrary naming habit, the service-amendment category, the 802.11x shorthand, the Wi-Fi Alliance's formation and trademark, the 2018 generation numbering and its mapping, and the definition of the time unit.
- [IEEE 802.11 Wireless LAN Working Group](https://www.ieee802.org/11/) backs the working group's current task groups, including enhanced privacy protection, ultra high reliability, and post-quantum cryptography.
