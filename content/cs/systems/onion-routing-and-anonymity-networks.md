---
title: Onion Routing and Anonymity Networks
description: How layered encryption hides who is talking to whom, why three relays beat one, the traffic-confirmation attack no low-latency network can dodge, and the trilemma that says you cannot have strong anonymity, low latency, and low cost at once.
draft: false
comments: true
tags:
  - cs
  - systems
date: 2026-06-28
updated:
aliases:
  - Tor
  - onion routing
  - anonymity networks
---

Encryption hides what you say. It does not hide that you are saying it, or to whom. A wiretap that cannot read your message can still see that your machine talked to a particular server at a particular time, and for many people in many places that metadata is the dangerous part. Onion routing attacks exactly that gap. It hides the relationship between sender and receiver by passing the message through a chain of relays, each of which learns only one link of the path, so no single point on the network sees both ends at once.

> [!note] The idea
> Wrap a message in nested layers of encryption, one per relay on its path, like the layers of an onion. Each relay peels off exactly one layer, which reveals only where to send the message next, never the original source or the final destination. The first relay knows who you are but not what you want; the last knows what you want but not who you are; the middle knows neither. Anonymity comes from no single relay holding both halves of the secret.

## Peeling the onion

The sender chooses a path through several relays and encrypts the message once for each, innermost layer first. When the package travels, the first router removes the outermost layer and learns only the next hop, the second removes the next layer and learns its next hop, and the final router removes the last layer and delivers the original message to its destination. Each intermediary knows only the node immediately before it and the node immediately after it, never the whole route. That is the entire trick, and it is why the technique provides strong anonymity against an observer sitting at any one relay.

Onion routing was developed in the mid-1990s at the U.S. Naval Research Laboratory by Paul Syverson, Michael Reed, and David Goldschlag, refined under DARPA, and patented by the Navy in 1998. Its first purpose was protecting U.S. intelligence communications, a reminder that the same property that shields a dissident also shields a spy. The trust model that [[tls-and-the-https-handshake|TLS]] solves (proving who you are talking to) is almost the opposite of the one here, where the whole goal is that nobody can prove who you are talking to.

## Why three relays

Tor, the best-known implementation of onion routing, nests its encryption over exactly three relays: a guard, a middle, and an exit. The split of roles is deliberate. The guard relay sees your real address but not your destination. The exit relay sees the destination, and the cleartext if the inner connection is not itself encrypted, but not your address. The middle relay exists so that the guard and exit never talk directly, so neither can be the single hop that links you to your traffic. The relays are run by volunteers around the world, which spreads trust across many jurisdictions rather than concentrating it in one. This is anonymity layered on top of ordinary [[network-protocols|network protocols]], not a replacement for them.

> [!example] One request through a circuit
> 1. Your client builds a circuit: it picks a guard, a middle, and an exit relay, and negotiates a separate key with each.
> 2. It encrypts the request three times, once per relay, outermost layer for the guard.
> 3. The guard peels its layer, sees only "send this to the middle relay," and forwards it. It knows your address but not your request.
> 4. The middle peels its layer, sees only "send this to the exit relay." It knows neither your address nor your request.
> 5. The exit peels the final layer and makes the actual connection to the destination. It knows the request but believes the traffic originates at the exit, not at you.
> 6. The reply travels back along the same circuit, re-wrapped layer by layer, and only your client can read it whole.

## The attack no low-latency network can dodge

Onion routing is strong against an attacker with one vantage point and weak against an attacker with two. If an adversary can watch the traffic entering the network near you and the traffic leaving it near your destination, the timing and volume of the two flows match closely enough to correlate, and the anonymity collapses. Tor states plainly that, like all current low-latency anonymity networks, it cannot defend against an attacker monitoring both boundaries at once. This is the traffic-confirmation attack, and it is a structural limit, not a bug to be patched. Simpler still, timing analysis alone can erode anonymity even without full end-to-end control. This is the front line of [[surveillance-and-privacy|surveillance and privacy]] on anonymity networks.

The deeper reason this limit is so stubborn is a proven tradeoff. The anonymity trilemma states that a system cannot simultaneously deliver strong anonymity, low latency, and low bandwidth overhead: you can have any two, never all three. Tor chooses low latency and low overhead so it is usable for everyday browsing, and accepts that a global passive adversary can in principle break it. A network that instead chose strong anonymity against such an adversary would have to add heavy cover traffic or large delays, and would no longer feel like the live web.

## Circumvention and the censorship arms race

The same design that hides destinations also helps people reach destinations a state has blocked. Because the addresses of public relays are listed so clients can find them, a censor can simply block that list. The countermeasure is the bridge relay: an entry point kept off the public list and handed out in limited ways, so a censor who does not know its address cannot block it. The censor responds by trying to recognize the shape of the traffic itself, and the network responds by disguising that shape, an arms race that ties anonymity networks directly to [[cyber-sovereignty|cyber sovereignty]] and national censorship. Onion routing began as a tool to protect spies; today its sharpest political use is letting ordinary people route around their own governments.

## Related Notes

- [[tls-and-the-https-handshake|TLS and the HTTPS Handshake]], the opposite trust problem: proving identity rather than hiding it
- [[rsa-and-computational-hardness|RSA and Computational Hardness]], the public-key cryptography that makes per-relay layers possible
- [[cyber-sovereignty|Cyber Sovereignty]], blocking relays and the censorship arms race bridges are built to lose slowly
- [[surveillance-and-privacy|Surveillance & Privacy]], traffic analysis and the metadata that encryption alone does not hide
- [[network-protocols|Network Protocols]], the ordinary routing this anonymity layer sits on top of

## Sources

- "Onion routing," Wikipedia. https://en.wikipedia.org/wiki/Onion_routing . Supports the layered-encryption model in which each onion router peels one layer and learns only the immediately preceding and following nodes, the development at the U.S. Naval Research Laboratory in the mid-1990s by Paul Syverson, Michael Reed, and David Goldschlag, refinement under DARPA and the Navy's 1998 patent, the original purpose of protecting U.S. intelligence communications, and timing analysis as a method to break the anonymity.
- "Tor (network)," Wikipedia. https://en.wikipedia.org/wiki/Tor_%28network%29 . Supports Tor as an implementation of onion routing nesting encryption over three relays (a guard, a middle, and an exit) run by volunteers, the use of secret bridge relays to evade censorship that blocks public relays, and the statement that, like all current low-latency anonymity networks, Tor cannot protect against an adversary monitoring traffic at both boundaries of the network (end-to-end traffic confirmation).
- "Anonymity Trilemma: Strong Anonymity, Low Bandwidth Overhead, Low Latency, Choose Two," Das, Meiser, Mohammadi, and Kate, IACR ePrint Archive. https://eprint.iacr.org/2017/954 . Supports the formal result that an anonymous communication system cannot simultaneously achieve strong anonymity, low latency, and low bandwidth overhead.
