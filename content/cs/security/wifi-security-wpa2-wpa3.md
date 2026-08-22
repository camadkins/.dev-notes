---
title: "Wi-Fi Security: WPA2 and WPA3"
description: "A wireless link is a broadcast anyone in range can hear, so all of its security rests on the key-negotiation handshake, and the story of WPA2 to WPA3 is two handshake flaws (nonce reinstallation and offline password guessing) and their fixes."
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-04-19
updated:
aliases:
  - WPA2
  - WPA3
  - SAE
  - 802.11 security
  - four-way handshake
---

A wired network gives you a small physical secret: to read the traffic, you have to touch the cable. Wi-Fi throws that away. [[cs/standards/ieee-802-11-wireless-lan|An 802.11 radio]] broadcasts to everyone in range, so an attacker never has to get on the wire; they only have to be nearby with an antenna. Every byte of confidentiality and authentication therefore has to be manufactured by cryptography, and specifically by the handshake that turns a shared password into fresh session keys. When that handshake has a flaw, the whole link has a flaw.

> [!note] The idea
> On a shared broadcast medium, security is only as strong as the handshake that derives and installs the session keys. WPA2's four-way handshake was broken by KRACK, which forces a key to be reinstalled and its nonces reset, defeating the guarantee that each packet uses a fresh keystream. WPA3 replaces the password step with SAE (Dragonfly), a password-authenticated key exchange whose defining property is resistance to *offline* dictionary attack: recording the exchange no longer lets an attacker brute-force the password at leisure.

## WPA2 and the key reinstallation attack

WPA2 authenticates a client and derives keys through a four-way handshake. In 2017 Mathy Vanhoef of imec-DistriNet, KU Leuven showed that the handshake could be manipulated so that an already-in-use key is installed again. The mechanism is a replay: "an attacker can force these nonce resets by collecting and replaying retransmissions of message 3 of the 4-way handshake." The damage is in what resetting does. "When the victim reinstalls the key, associated parameters such as the incremental transmit packet number (i.e. nonce) and receive packet number (i.e. replay counter) are reset to their initial value."

That reset is fatal because stream ciphers depend on never reusing a nonce with the same key. Reset the nonce and [[cs/military-computing/venona-and-one-time-pad-reuse|the same keystream is generated twice]], which lets an attacker recover plaintext by comparison, exactly the guarantee the handshake existed to prevent. Crucially, this was not one vendor's bug. Per the disclosure, "the weaknesses are in [[cs/networking/wifi-and-802-11|the Wi-Fi standard itself]], and not in individual products or implementations. Therefore, any correct implementation of WPA2 is likely affected," and "the attack works against all modern protected Wi-Fi networks." A flaw in the shared handshake is a flaw in every device that speaks it.

## WPA3 and offline-dictionary resistance

WPA3's headline change is replacing WPA2's pre-shared-key exchange with SAE, built on the Dragonfly key exchange of RFC 7664. Dragonfly is a "key exchange using [[cs/math/number-theory-and-modular-arithmetic|discrete logarithm cryptography]] that is authenticated using a password or passphrase," a password-authenticated key exchange rather than a raw shared secret. Its central security property is the one WPA2-PSK lacked: "it is resistant to active attack, passive attack, and offline dictionary attack."

Offline resistance is the subtle, important part. Against WPA2-PSK, an attacker could capture the handshake and then guess passwords against it forever on their own hardware, no further contact with the network required. Dragonfly forecloses that. RFC 7664 states that "any advantage an adversary can gain must be directly related to the number of interactions she makes with an honest protocol participant and not through computation," and that "the adversary will not be able to obtain any information about the password except whether a single guess from a protocol run is correct or incorrect." Each guess now costs one live, detectable interaction with the access point instead of one cheap offline hash. That turns an unlimited offline search into a rate-limited online one, which is the difference between a weak password falling in minutes and it standing up to lockout.

> [!tip] The shared medium concentrates all trust in one exchange
> Both stories are the same lesson from opposite ends. Because anyone in range receives the ciphertext, the attacker's whole job reduces to attacking the key negotiation: reuse a nonce (KRACK) or grind the password offline (WPA2-PSK). WPA3 hardens exactly those two points. It is a clean example of why, on a broadcast channel, you spend your security budget on the handshake and the [[symmetric-vs-asymmetric-cryptography|key material]] it produces, not on the link itself.

## Related Notes

- [[diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]] - the discrete-log key agreement SAE authenticates with a password
- [[password-hashing-and-salting|Password Hashing and Salting]] - the other front in the fight against offline password guessing
- [[symmetric-vs-asymmetric-cryptography|Symmetric vs Asymmetric Cryptography]] - the session keys the handshake installs for bulk encryption
- [[arp-spoofing-and-lan-attacks|ARP Spoofing and LAN Attacks]] - the wired analog of a shared medium an attacker can join
- [[man-in-the-middle-attacks|Man-in-the-Middle Attacks]] - what a rogue access point becomes once it sits between client and network

## Sources

- Vanhoef, M., "Key Reinstallation Attacks: Breaking WPA2 by forcing nonce reuse," krackattacks.com. https://www.krackattacks.com/ . Supports that the attack replays message 3 of the four-way handshake to force nonce resets, that reinstalling the key resets the transmit nonce and receive replay counter to their initial values, that the weakness is in the Wi-Fi standard so any correct WPA2 implementation is likely affected, and that it works against all modern protected Wi-Fi networks; also the discoverer's name and affiliation.
- "Dragonfly Key Exchange," RFC 7664, IETF. https://www.rfc-editor.org/rfc/rfc7664.txt . Supports that Dragonfly is a discrete-logarithm key exchange authenticated by a password or passphrase, that it is resistant to active, passive, and offline dictionary attack, that an adversary's advantage relates only to the number of live interactions and not to offline computation, and that a run reveals only whether a single guess is correct or incorrect.
