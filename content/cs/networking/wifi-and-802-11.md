---
title: Wi-Fi and 802.11
description: How wireless LANs share one radio channel with CSMA/CA, why a station cannot hear collisions the way wired Ethernet does, and the hidden-node problem that RTS/CTS exists to patch.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-03-12
updated:
aliases:
  - 802.11
  - WLAN
  - CSMA/CA
  - hidden node problem
---

[[cs/standards/ieee-802-3-ethernet|Wired Ethernet]] detects collisions. A station transmits while listening, and if it hears its own signal garbled by someone else's, it knows two frames overlapped and both need resending. A radio cannot do this. Its own transmission is so much louder than any distant signal that listening while sending is pointless, so the wireless world had to invent a different strategy: not detect collisions after they happen, but avoid them before they start. Everything distinctive about Wi-Fi follows from that one physical constraint.

> [!note] The idea
> IEEE 802.11 specifies the MAC and physical layers of a wireless LAN, and because a radio cannot detect a collision while transmitting, it replaces Ethernet's collision *detection* (CSMA/CD) with collision *avoidance* (CSMA/CA): listen for a quiet channel, transmit the whole frame, and wait for an acknowledgement. The catch is that carrier sense is unreliable, because a station may not hear a competitor that is hidden behind the access point, which is the single fact that explains RTS/CTS and per-frame ACKs.

## What 802.11 actually is

IEEE 802.11 is part of the [[cs/standards/ieee-802-the-family-and-its-split|IEEE 802 family of LAN standards]], and it specifies the set of medium access control (MAC) and physical layer (PHY) protocols for implementing wireless local area network computer communication. The standard is the machinery; Wi-Fi is the brand. Products that pass the Wi-Fi Alliance's interoperability tests carry the Wi-Fi trademark, but the protocol underneath is 802.11, released first in 1997 and [[cs/standards/ieee-802-11-wireless-lan|amended ever since]] (802.11b, a, g, n, ac, ax). The protocols are designed to interwork with [[cs/networking/arp-and-mac-addressing|Ethernet]] and most often carry Internet Protocol traffic, so from the layer above, a Wi-Fi link is meant to look like just another link.

## CSMA/CA: listen, send, confirm

The 802.11 family employs carrier-sense multiple access with collision avoidance, whereby equipment listens to a channel for other users before transmitting each frame. Nodes attempt to avoid collisions by beginning transmission only after the channel is sensed to have no traffic, and when they do transmit, they send frames in their entirety. If the channel is busy, a node waits a period of time, usually random, before listening again.

The confirmation step matters because sensing alone is not enough. Since a wireless node cannot listen while it transmits, it has no way to know mid-frame that a collision occurred. Instead it awaits an acknowledgement packet from the access point indicating the frame arrived and checksummed correctly. If that ACK does not arrive in time, the node assumes its frame collided and enters a period of [[cs/military-computing/alohanet-random-access|binary exponential backoff]] before retrying. The ACK, not the act of sending, is what tells a station its transmission succeeded.

## The hidden node problem

CSMA/CA rests on carrier sense, and carrier sense rests on an assumption that quietly fails in radio: that every competitor can hear every other. The hidden node problem occurs when a node can communicate with an access point but cannot directly communicate with other nodes that are also talking to that AP. Picture a star of clients around one AP: a client at one edge, A, can reach the AP, but a client at the opposite edge, C, is out of A's range, or behind an obstacle that absorbs radio waves. A and C are hidden from each other.

When A and C transmit to the AP at the same time, neither heard the other's carrier, so neither backed off, and their frames collide at the AP where nobody was listening for a collision. This is why 802.11 offers an optional Request To Send / Clear To Send exchange: a node asks the AP for permission with a short RTS, and the AP replies with a CTS that all nodes in range can hear, so they hold off. RTS/CTS is not a full fix and adds overhead that can exceed its benefit for small frames, which is why implementations often disable it for short packets or turn it off entirely.

## Bands and channels

802.11 uses several radio bands, including 2.4 GHz, 5 GHz, 6 GHz, and 60 GHz, though which frequencies are legal varies by regulatory domain. The band choice has a direct performance consequence in how many stations can operate without stepping on each other. The 2.4 GHz ISM band offers only three non-overlapping 20 MHz channels, and adjacent channels overlap, which is also why 2.4 GHz equipment suffers interference from microwave ovens, cordless phones, and Bluetooth. The 5 GHz band, by contrast, offers at least 23 non-overlapping 20 MHz channels in much of the world, which is the main reason denser deployments prefer it.

> [!warning] Association is a separate handshake, not part of CSMA/CA
> Before a station exchanges data, it joins a network. That joining is carried by 802.11 *management* frames, one of the frame types the standard defines (Type and Subtype fields in the header identify the exact frame). CSMA/CA governs *access* to the channel; management frames like association govern *membership* in the network. Do not conflate the two: a station can contend for the medium only after it has associated.

## Related Notes

- [[cs/networking/arp-and-mac-addressing|ARP and MAC Addressing]] - the link layer 802.11 is designed to interwork with
- [[cs/networking/vlans-and-802-1q-trunking|VLANs and 802.1Q Trunking]] - another 802 standard shaping how the link layer is segmented
- [[cs/networking/multicast-broadcast-anycast|Multicast, Broadcast, Anycast]] - delivery modes the shared radio medium makes cheap
- [[cs/networking/tcp-congestion-control|TCP Congestion Control]] - how the layer above copes with the loss a noisy radio link introduces

## Sources

- "IEEE 802.11," Wikipedia. https://en.wikipedia.org/wiki/IEEE_802.11 . Backs 802.11 as the IEEE 802 standard specifying MAC and PHY protocols for WLAN, its use of CSMA/CA (listen before transmitting each frame), the Wi-Fi brand relationship, the 2.4/5/6/60 GHz bands, the three non-overlapping 2.4 GHz channels versus at least 23 in the 5 GHz band, interference sources in 2.4 GHz, and management being one of the defined frame types identified by Type/Subtype.
- "Carrier-sense multiple access with collision avoidance," Wikipedia. https://en.wikipedia.org/wiki/Carrier-sense_multiple_access_with_collision_avoidance . Backs CSMA/CA as a link-layer method where nodes transmit only after sensing no traffic and send frames in their entirety, the reason CSMA/CD is not possible on radio (cannot detect other transmissions while transmitting), the ACK-and-binary-exponential-backoff retry, and CSMA/CA being unreliable due to the hidden node problem.
- "Hidden node problem," Wikipedia. https://en.wikipedia.org/wiki/Hidden_node_problem . Backs the definition (a node reaches the AP but not other nodes talking to that AP), the A/C-around-an-AP example including the obstacle case, simultaneous transmissions colliding at the AP, and RTS/CTS as a partial solution that can decrease throughput.
