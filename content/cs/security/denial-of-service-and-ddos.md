---
title: Denial of Service and DDoS
description: "Why denial of service is an economics problem, not a breach: the attacker wins by making their cost of flooding lower than your cost of absorbing it, through state exhaustion, distribution, and amplification."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-03-11
updated:
aliases:
  - DoS
  - DDoS
  - SYN flood
  - amplification attack
---

Most attacks try to get in. A denial-of-service attack does the opposite: it tries to keep everyone else out, without ever breaching anything. [[cs/standards/what-a-standard-actually-is|RFC 4732]] puts the goal plainly: "A Denial-of-Service (DoS) attack is an attack in which one or more machines target a victim and attempt to prevent the victim from doing useful work." Nothing is stolen and no boundary is crossed. The service simply stops answering. That makes DoS the one attack class where perfect confidentiality and integrity buy you nothing, and where the real contest is arithmetic.

> [!note] The idea
> A DoS attack is a race between the attacker's cost to send load and the defender's cost to absorb it. The attacker wins by finding the target's scarcest finite resource and by making their own effort asymmetrically cheap. Three moves widen that asymmetry: attack *state* rather than bandwidth, *distribute* the source across many hosts, and *amplify* so a small request provokes a large response. Understanding which resource is exhausted is the whole defense.

## Find the scarcest resource, not the biggest pipe

The naive picture of DoS is a firehose of traffic saturating a link. RFC 4732 lists the actual targets more precisely: "The obvious resources that might be exhausted include: Available memory. The CPU cycles available. The disk space available to the application." Bandwidth is only one column in that ledger, and rarely the cheapest to attack.

The [[cs/networking/tcp-three-way-handshake|TCP SYN flood]] is the classic proof. It does not try to fill the wire at all. RFC 4987 is explicit: "The SYN flooding attack does not attempt to overload the network's resources or the end host's memory, but merely attempts to exhaust the backlog of half-open connections associated with a port number." When a server receives a SYN, it moves that connection to SYN-RECEIVED and allocates a slot to remember it while it waits for the handshake to finish. The attacker sends SYNs and never completes the handshake, so "by keeping the backlog full of bogus half-opened connections, legitimate requests will be rejected." A few thousand packets can exhaust a fixed-size table. The scarce resource was never bandwidth. It was *state*.

The defense follows directly from naming the resource. SYN cookies remove the state entirely: as RFC 4987 describes, they "allocate no state at all for connections in SYN-RECEIVED. Instead, they encode most of the state ... into the sequence number transmitted on the SYN-ACK." If you hold no state until the handshake completes, there is no table to flood.

## Distribution and amplification break the arithmetic

A single attacker is limited by their own uplink, so the attack scales by borrowing other people's. RFC 4732 describes how "sufficient scale can be achieved by compromising enough end-hosts (typically using a virus or worm) or routers, and using those compromised hosts to perpetrate the attack. Such an attack is known as a Distributed Denial-of-Service (DDoS) attack." A botnet of compromised machines (see [[cs/security/malware-classes|malware classes]]) turns one attacker's small link into the summed capacity of thousands, defeating any defense that assumes it can outrun a single source.

Amplification is the second multiplier, and it is the more elegant one. The attacker spoofs the victim's address as the source of a request, then picks a service whose reply dwarfs the query. RFC 4732 gives the canonical example with DNS: "An attacker sends a DNS request to a DNS server ... The request is carefully chosen so that the size of the response is significantly greater than the size of the request, thereby providing the amplification." A tiny query becomes a large answer aimed at the victim, so the attacker spends a fraction of the bandwidth the victim receives. This is why spoofed-source reflection off [[cs/systems/dns-the-domain-name-system|open DNS resolvers]] and similar services is so effective, and why source-address validation upstream matters as much as any filter at the target.

> [!warning] You cannot patch your way out of pure volume
> State-exhaustion attacks have clean fixes because they target a design flaw you can remove. Volumetric DDoS has no such fix at the endpoint: once the flood exceeds your ingress capacity, no code change downstream helps, because the damage is done before your server sees a packet. Defense moves upstream to the network, to providers who can absorb or scrub traffic at a scale the individual target cannot. DoS is the security problem you most often solve by buying capacity rather than writing code.

## Related Notes

- [[cs/security/malware-classes|Malware Classes]] - the worms and bots that assemble the distributed source of a DDoS
- [[cs/systems/dns-the-domain-name-system|DNS: The Domain Name System]] - the reflector of choice for amplification attacks
- [[cs/security/firewalls|Firewalls]] - the chokepoint that filters some floods but cannot outrun volumetric ones
- [[cs/systems/network-protocols|Network Protocols]] - the TCP handshake whose half-open state the SYN flood exploits
- [[cs/security/ids-and-ips|IDS and IPS]] - the behavioral monitors that flag flood patterns a static rule misses

## Sources

- "Internet Denial-of-Service Considerations," RFC 4732, IETF. https://www.rfc-editor.org/rfc/rfc4732.txt . Supports the definition of a DoS attack, the list of exhaustible resources (memory, CPU, disk), distributed DoS via compromised end-hosts and worms, and DNS amplification where a small request provokes a much larger spoofed-source response.
- "TCP SYN Flooding Attacks and Common Mitigations," RFC 4987, IETF. https://www.rfc-editor.org/rfc/rfc4987.txt . Supports that the SYN flood exhausts the backlog of half-open connections rather than network or memory resources, that a full backlog rejects legitimate requests, and that SYN cookies allocate no state by encoding it into the SYN-ACK sequence number.
