---
title: Firewalls
description: "How a firewall's power and its blind spots both follow from being a chokepoint that only sees what crosses it, from stateless filters to application-layer inspection."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-02-27
updated:
aliases:
  - firewall
  - packet filter
  - stateful inspection
---

A firewall is a policy made physical: a single point that all traffic between two zones must cross, where a rule decides what passes. [[cs/standards/what-a-standard-actually-is|NIST SP 800-41]] defines it functionally as devices or programs "that control the flow of network traffic between networks or hosts that employ differing security postures." That phrase, *differing security postures*, is the whole reason a firewall exists. It sits on the seam between a zone you trust less and one you trust more, and every capability and every limitation flows from that position.

> [!note] The idea
> A firewall's strength is that it is a mandatory chokepoint: nothing gets between the zones without passing its rules. Its limitation is the same fact from the other side: it can only act on what it can see as traffic crosses it. The history of firewall technology is the history of teaching that chokepoint to see more, from raw packet headers up to application content.

## The evolution is about visibility

SP 800-41 walks the ladder, and each rung adds sight.

The most basic firewall is a **packet filter**. Per the guide, "the most basic feature of a firewall is the packet filter," and older firewalls that were only packet filters "were essentially routing devices that provided access control functionality for host addresses and communication sessions." These are "also known as stateless inspection firewalls." A stateless filter judges each packet in isolation, by its source and destination addresses and ports. It is fast and simple, and it is blind to context: it cannot tell a legitimate reply from a forged packet that merely looks like one.

**Stateful inspection** fixes that blindness. It "improves on the functions of packet filters by tracking the state of connections and blocking packets that deviate from the expected state," accomplished "by incorporating greater awareness of [[cs/networking/osi-and-tcp-ip-models|the transport layer]]." Now the firewall remembers that you opened a connection outbound, so it can admit the return traffic and reject a packet claiming to be a reply to a conversation that never started. The cost is state: the firewall must hold a table of live connections.

At the top is **application-layer inspection**, the application-proxy gateway. Here the firewall understands the protocol riding inside the packets, which unlocks capabilities the lower layers cannot reach. SP 800-41 notes the contrast directly: "a firewall that only handles lower layers cannot usually identify specific users, but a firewall with application layer capabilities can enforce user authentication and log events to specific users."

## The chokepoint's blind spot

The same guide names the fundamental limit, and it is not a bug but a consequence of the design. First, threats have moved up: attacks "have gradually moved from being most prevalent in lower layers of network traffic to the application layer, which has reduced the general effectiveness of firewalls in stopping threats carried through network communications." A firewall inspecting layers 3 and 4 simply cannot see an attack that lives in the HTTP body.

Second, and more fundamentally, a firewall cannot inspect what it cannot read. SP 800-41 observes that policies may "require VPN traffic to be passed through the firewall while encrypted, preventing the firewall from inspecting the traffic." Encryption, the thing that protects the traffic, also blinds the chokepoint. This is why a [[vpns-and-tunneling|VPN tunnel]] or a [[tls-and-the-https-handshake|TLS session]] passing through a firewall is, to that firewall, an opaque pipe. The firewall knows the pipe exists and where it goes, but not what flows inside.

> [!tip] Why the perimeter model was never enough
> A firewall only sees traffic that crosses *it*. It says nothing about the host already inside the perimeter, the encrypted payload it cannot read, or the attack that arrives as valid-looking application traffic. Those blind spots are precisely the gap that [[ids-and-ips|intrusion detection]] tries to fill by watching behavior, and that [[zero-trust-architecture|zero trust]] closes by refusing to trust the interior at all.

## Related Notes

- [[zero-trust-architecture|Zero-Trust Architecture]] - the model that rejects the trusted interior a firewall perimeter creates
- [[ids-and-ips|Intrusion Detection and Prevention]] - the complementary defense that watches behavior a firewall's rules miss
- [[vpns-and-tunneling|VPNs and Tunneling]] - the encrypted traffic a firewall passes through but cannot read
- [[network-protocols|Network Protocols]] - the layered stack whose levels define what each firewall type can see
- [[tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - why so much modern traffic is opaque to inspection

## Sources

- "NIST Special Publication 800-41 Revision 1: Guidelines on Firewalls and Firewall Policy." https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-41r1.pdf . Supports the definition of firewalls as controlling traffic flow between networks of differing security postures; the packet-filter as the most basic, stateless feature; stateful inspection tracking connection state via transport-layer awareness; application-layer firewalls being able to identify and authenticate specific users where lower-layer ones cannot; threats moving to the application layer reducing firewall effectiveness; and encrypted VPN traffic passing through the firewall preventing inspection.
