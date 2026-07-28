---
title: Cisco
description: Practitioner notes on Cisco IOS, switching, routing, and security appliances, written to be more useful than the documentation.
draft: false
comments: false
tags:
  - cs
  - cisco
date: 2026-07-27
updated:
aliases:
  - Cisco
---

Notes on running Cisco gear, written for the person who has to make the box work rather than for the person studying for a test. Each one leads with when you reach for the thing and why, names the gotcha that actually bites, and shows the command alongside what it does to the device.

Every command and behavior here is verified against Cisco's own public documentation or the underlying RFC. Where a fact could not be sourced, it was left out rather than guessed, and the note says so.

The protocol theory underneath all of this lives in [[cs/networking/index|Networking]], and the security concepts in [[cs/security/index|Security]]. This section is the vendor-specific layer on top.

### Foundations and IOS

- [[ios-cli-modes|IOS CLI Modes]] - user EXEC, privileged EXEC, global config, and interface config, and how you move between them
- [[running-vs-startup-config|Running vs Startup Config]] - the two configurations, why changes vanish on reload, and the config register
- [[show-and-debug-methodology|Show and Debug Methodology]] - a disciplined approach to both, and why debug can take a production box down
- [[console-ssh-and-device-access|Console, SSH, and Device Access]] - console against VTY lines, enabling SSH correctly, and refusing Telnet
- [[tacacs-vs-radius|TACACS+ vs RADIUS]] - what each protocol actually protects on the wire, TCP against UDP, and command authorization

### Switching

- [[vlans-and-vlan-design|VLANs and VLAN Design]] - the broadcast domain as the unit of segmentation, access ports, and the management VLAN
- [[trunking-and-802-1q|Trunking and 802.1Q]] - carrying many VLANs on one link, the tag, and the native-VLAN mismatch that bites
- [[spanning-tree-protocol|Spanning Tree Protocol]] - why a switched loop is catastrophic, root election, port states, and RSTP convergence
- [[portfast-and-bpdu-guard|PortFast and BPDU Guard]] - skipping listening and learning on access ports, and the guard that must come with it
- [[etherchannel-and-lacp|EtherChannel and LACP]] - bundling links, LACP against PAgP and static, and how traffic is distributed

### Routing

- [[static-routing-and-administrative-distance|Static Routing and Administrative Distance]] - next-hop against exit-interface, floating statics, and AD as the tie-breaker between sources
- [[ospf-fundamentals|OSPF Fundamentals]] - link-state operation, areas, LSA types, and DR/BDR election on multiaccess segments
- [[eigrp-fundamentals|EIGRP Fundamentals]] - DUAL, successors and feasible successors, and the feasibility condition
- [[bgp-fundamentals|BGP Fundamentals]] - path vector, eBGP against iBGP, and why BGP is a policy protocol rather than a shortest-path one
- [[hsrp-vrrp-and-first-hop-redundancy|HSRP, VRRP, and First-Hop Redundancy]] - the default-gateway single point of failure, virtual IP and MAC, and preemption

### ASA and firewalling

Every command in this cluster comes from the ASA 9.17 configuration guides. Check your own version before applying any of it.

- [[asa-security-levels|ASA Security Levels]] - the security-level model and the default inter-interface behavior it implies
- [[asa-access-rules-and-acls|ASA Access Rules and ACLs]] - access rules, how they interact with security levels, and rule order
- [[asa-nat|ASA NAT]] - object NAT against twice NAT, the ordering of the NAT table, and how NAT meets access rules
- [[asa-modular-policy-framework|ASA Modular Policy Framework]] - class maps, policy maps, and service policies
- [[asa-failover|ASA Failover]] - active/standby against active/active, what state replicates, and the failover link

---

*The full file listing follows below, generated automatically by Quartz.*
