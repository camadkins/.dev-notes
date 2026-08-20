---
title: Port Scanning and Network Reconnaissance
description: "How the TCP handshake becomes an oracle: a half-open SYN scan reads a port's state from the stack's own reply, distinguishing open, closed, and filtered without ever completing a connection."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-06-27
updated:
aliases:
  - port scanning
  - SYN scan
  - half-open scan
  - reconnaissance
  - nmap
---

Before anyone attacks a system, they have to find it, and find out what it runs. Reconnaissance is the unglamorous first phase: which hosts are alive, which ports are open, which services and versions sit behind them. The elegant part is that a target volunteers most of this. The TCP state machine answers a probe differently depending on a port's state, so an attacker (or a defender auditing their own exposure) can read the state straight off the reply without logging in to anything.

> [!note] The idea
> The TCP three-way handshake is an oracle you can query. Send a lone SYN and the remote stack's response reveals the port's state: a SYN/ACK means open, a RST means closed, and silence means filtered by something upstream. The SYN scan weaponizes this by never sending the final ACK, so it learns the answer while leaving the connection half-open and unestablished. The same three-way distinction is the defender's map of their own attack surface.

## The half-open scan reads the reply, not the connection

A normal TCP connection completes a three-way handshake: SYN, SYN/ACK, ACK. A SYN scan stops one step short. As the Nmap reference explains, "because the three-way handshake is never completed, SYN scan is sometimes called half-open scanning." The scanner sends the opening SYN, reads whatever comes back, and never sends the ACK that would finalize a connection. That is enough, because the diagnostic information is entirely in the response.

The value is precision. A SYN scan "allows clear, reliable differentiation between `open`, `closed`, and `filtered` states." Those three states map directly to three behaviors of the remote stack. A SYN/ACK reply means a service is listening: the port is open. A RST reply means the host is reachable but nothing is listening there: the port is closed. No reply at all, even after retransmissions, means a firewall or filter silently dropped the probe: the port is filtered. That last state is why a scan doubles as [[firewalls|firewall]] reconnaissance, because the absence of an answer is itself an answer about what sits in front of the host.

## Why half-open is the default

Not completing the handshake is not only informative, it is efficient and quiet. The reference notes that a SYN scan "is relatively unobtrusive and stealthy, since it never completes TCP connections," and it is fast: "it can be performed quickly, scanning thousands of ports per second on a fast network not hampered by intrusive firewalls." Historically, leaving the connection half-open also meant the target application never saw a completed connection to log, though modern monitoring closes much of that gap. For those reasons the reference calls it plainly "the default and most popular scan option for good reason."

> [!tip] Reconnaissance is symmetric, so run it on yourself
> Every technique here is available to both sides. The map an attacker builds of your open ports and service versions is the same map you should build first, because you cannot defend an exposure you do not know you have. Scanning your own address space and comparing it to what should be reachable is how you catch the forgotten service, the misconfigured rule, the port a deploy quietly opened. What a scan reveals to an attacker, an [[ids-and-ips|intrusion detection system]] tries to catch in the act, and a tightly scoped [[firewalls|firewall]] tries to make boring: mostly filtered, nothing listening.

## Related Notes

- [[firewalls|Firewalls]] - the device whose presence a scan infers from filtered, unanswered ports
- [[network-protocols|Network Protocols]] - the TCP handshake and state machine the scan interrogates
- [[ids-and-ips|IDS and IPS]] - the monitors that try to detect a scan sweeping across ports
- [[stride-threat-modeling|STRIDE Threat Modeling]] - reconnaissance maps the surface that threat modeling reasons about
- [[denial-of-service-and-ddos|Denial of Service and DDoS]] - the SYN packet reused, this time to exhaust rather than probe

## Sources

- "TCP SYN (Stealth) Scan (-sS)," Nmap Network Scanning reference guide, nmap.org. https://nmap.org/book/synscan.html . Supports that a SYN scan is called half-open scanning because the three-way handshake is never completed, that it allows clear differentiation between open, closed, and filtered states, that it never completes TCP connections and is relatively stealthy, that it can scan thousands of ports per second, and that it is the default and most popular scan option.
