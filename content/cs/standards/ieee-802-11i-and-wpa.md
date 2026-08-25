---
title: "IEEE 802.11i and WPA"
description: "An amendment that replaced one clause of the base standard, shipped in products a year before it was ratified because a trade association published a draft subset, and made one of its two ciphers mandatory and the other a concession to old hardware."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-07-30
updated:
aliases:
  - 802.11i
  - WPA2
---

The security amendment to 802.11 is the best case study in the family of a standard and a brand doing different jobs. IEEE wrote a specification. A trade association took a subset of the unfinished draft, gave it a name, and shipped it into products. Then when the real thing was ratified, the same association gave it a second name, and that name is the one everybody uses. Almost nobody outside the working group says 802.11i.

> [!note] The idea
> 802.11i is an amendment whose content is **one replaced clause plus two protocols**, and it separates cleanly into what the standard mandates and what it merely tolerated. CCMP is mandatory; TKIP exists only so that hardware built for a broken scheme could run the new one. The four-way handshake is where the amendment does its actual work, and it delegates the identity question entirely to 802.1X.

## What the amendment replaced

The scope is unusually crisp for an amendment. "IEEE 802.11i-2004, or 802.11i for short, is an amendment to the original IEEE 802.11, implemented as Wi-Fi Protected Access II (WPA2)," and its editorial effect was to replace one clause: "This standard specifies security mechanisms for wireless networks, replacing the short Authentication and privacy clause of the original standard with a detailed Security clause."

Notice the word short. The 1997 base standard treated security in a brief clause containing WEP, and the amendment's contribution was to swap that clause for a much longer one. Amendments are edits, and this one is a wholesale replacement rather than an addition. "In the process, the amendment deprecated broken Wired Equivalent Privacy (WEP), while it was later incorporated into the published IEEE 802.11-2007 standard," so 802.11i itself no longer exists as a live document, having been absorbed in the first rollup after its ratification.

## The brand arrived before the standard

This is the part worth understanding structurally, because it recurs whenever a standard is too slow for a crisis. WEP had been publicly broken, deployed equipment was insecure, and the amendment was years from ratification. "Wi-Fi Protected Access (WPA) had previously been introduced by the Wi-Fi Alliance as an intermediate solution to WEP insecurities," and critically "WPA implemented a subset of a draft of 802.11i." A trade association published a profile of an unfinished IEEE draft and certified products against it.

When ratification came, the naming was tidied rather than corrected: "The Wi-Fi Alliance refers to their approved, interoperable implementation of the full 802.11i as WPA2, also called RSN (Robust Security Network)." So WPA2 is a certification program and RSN is the term the standard uses, and the same thing has three names depending on who is speaking.

The force behind the brand is contractual, not technical. "WPA2, which requires testing and certification by the Wi-Fi Alliance, implements the mandatory elements of IEEE 802.11i," and "From March 13, 2006, to June 30, 2020, WPA2 certification was mandatory for all new devices to bear the Wi-Fi trademark." A trademark condition, enforced by a private association, did what the standard could never do on its own: it made adoption compulsory for anyone who wanted the logo. That is the borrowed-force mechanism from [[cs/standards/what-a-standard-actually-is|the note on what a standard cannot do]], and here the borrower is a trademark rather than a regulator.

## Mandatory and tolerated

The amendment provides two data protection protocols and treats them very differently. "The standard also provides two RSNA data confidentiality and integrity protocols, TKIP and CCMP, with implementation of CCMP being mandatory since the confidentiality and integrity mechanisms of TKIP are not as robust as those of CCMP."

The reason TKIP is in the document at all is stated plainly: "The main purpose to implement TKIP was that the algorithm should be implementable within the capabilities of most of the old devices supporting only WEP." TKIP was designed to run on silicon built for RC4, so an installed base of access points and cards could be upgraded by firmware instead of replacement.

That is a specification decision made against an installed base rather than against a threat model, and the standard is honest about the trade: the weaker mechanism is permitted, the stronger one is required, and a conforming device therefore always has CCMP available even if it also offers TKIP. Everything about the eventual deprecation of TKIP was set up by that asymmetry. CCMP itself is "based on the Counter with CBC-MAC (CCM) mode of the AES encryption algorithm," an authenticated encryption construction of the kind covered in [[cs/security/authenticated-encryption-aead|AEAD]].

## The four-way handshake as specified

"IEEE 802.11i enhances IEEE 802.11-1999 by providing a Robust Security Network (RSN) with two new protocols: the four-way handshake and the group key handshake." And the delegation is explicit: "These utilize the authentication services and port access control described in IEEE 802.1X to establish and change the appropriate cryptographic keys."

802.11i does not specify how you prove who you are. It consumes [[cs/standards/ieee-802-1x-port-based-access-control|802.1X]] for that and starts from the result, a Pairwise Master Key. With a passphrase, "In PSK authentication, the PMK is actually the PSK," derived from the password through a key derivation function. With enterprise authentication, the PMK falls out of the EAP exchange with the authentication server.

The handshake's job is to turn that long-lived secret into session keys without transmitting it. "The PTK is generated by concatenating the following attributes: PMK, AP nonce (ANonce), STA nonce (SNonce), AP MAC address, and STA MAC address," then passing the concatenation through a pseudo-random function. Both parties can compute it; neither has to send it. Each side contributes a nonce, so neither can force the session key alone, and the two MAC addresses bind the key to this specific pair of stations. "The handshake also yields the GTK (Group Temporal Key), used to decrypt multicast and broadcast traffic."

All four messages are EAPOL-Key frames, which is to say the handshake rides on the encapsulation from a different standard entirely. And the anti-replay mechanism is a field in the message: each message carries "a Key Replay Counter, which is a number that is used to match each pair of messages sent, and discard replayed messages."

That counter is where the specification's most famous problem lived. A handshake whose correctness depends on replay handling and on a retransmission rule is a state machine, and a state machine specified in prose is a state machine some implementations will get wrong. The attack that resulted, and its consequences, belong to [[cs/security/wifi-security-wpa2-wpa3|the WPA2 and WPA3 note]]; what belongs here is the observation that the vulnerability was found in the standard's own text rather than in a single vendor's code, which is the rarest and most expensive kind of defect a standards body can ship.

## Where certification narrows what the standard permits

One more instance of the brand doing work the standard declined to do. 802.11i inherits EAP's method-agnosticism, so an enterprise deployment may use any EAP method. That is maximum flexibility and minimum interoperability. "Originally, only EAP-TLS (Extensible Authentication Protocol - Transport Layer Security) was certified by the Wi-Fi alliance," and the certification program was later widened, explicitly so that certified enterprise products could interoperate with one another. Even so, "their failure to do so as of 2013" remained one of the major obstacles to deploying 802.1X across heterogeneous networks.

A standard that permits everything guarantees nothing, and the certification program is where the permitted set gets narrowed to a workable one. That is the general relationship between conformance and certification, and it is why a purchasing requirement usually needs to name both.

## Related Notes

- [[cs/security/wifi-security-wpa2-wpa3|Wi-Fi Security: WPA2 and WPA3]] for the handshake flaw and what WPA3 changed.
- [[cs/standards/ieee-802-1x-port-based-access-control|IEEE 802.1X, Port-Based Access Control]] for the authentication and key transport 802.11i delegates to.
- [[cs/standards/ieee-802-11-wireless-lan|IEEE 802.11, Wireless LAN as a Document]] for the base standard this amendment edits.
- [[cs/standards/what-a-standard-actually-is|What a Standard Actually Is]] for why a trademark can compel adoption when a standard cannot.
- [[cs/security/authenticated-encryption-aead|Authenticated Encryption and AEAD]] for the construction CCMP is an instance of.
- [[cs/security/key-derivation-functions|Key Derivation Functions]] for how a passphrase becomes the PMK.

## Sources

- [IEEE 802.11i-2004 (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.11i-2004) backs the amendment's scope and clause replacement, the deprecation of WEP and incorporation into 802.11-2007, WPA as a subset of the draft, the WPA2 and RSN naming, the four-way and group key handshakes and their reliance on 802.1X, the TKIP and CCMP mandate asymmetry and TKIP's legacy-hardware rationale, the PMK and PSK relationship, the PTK derivation inputs, the GTK, and the key replay counter.
- [Wi-Fi Protected Access (Wikipedia)](https://en.wikipedia.org/wiki/Wi-Fi_Protected_Access) backs WPA2 as a certification program implementing the mandatory elements of 802.11i, the trademark requirement between 2006 and 2020, and the EAP certification history and its interoperability shortfall.
- [IEEE 802.11 (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.11) backs the Wi-Fi Alliance's interim WPA specification based on a subset of the then-current 802.11i draft.
