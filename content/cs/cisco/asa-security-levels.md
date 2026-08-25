---
title: ASA Security Levels
description: "The 0 to 100 number on every ASA interface is not documentation: it is an access-control decision that runs before your ACLs do, and it silently permits traffic you never wrote a rule for."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-03-11
updated:
aliases:
  - security-level
  - ASA security level
  - same-security-traffic
---

Someone hands you a working ASA and asks why a host on the DMZ can reach the internet when there is no ACL on the DMZ interface at all. Nothing in the running config permits it. The answer is the one-line `security-level` statement under the interface, which is not a label. It is policy.

> [!note] The idea
> A security level is a total ordering over interfaces, and the ASA derives a default forwarding decision from that ordering before it ever consults an access list. Two consequences fall out and both bite people: traffic from high to low is permitted with no rule written anywhere, and traffic between two interfaces at the *same* level is dropped by a check that happens *before* your ACL is evaluated, so a permit rule that looks correct never gets a vote.

## What the number actually is

Every interface carries one: "Each interface must have a security level from 0 (lowest) to 100 (highest), including bridge group member interfaces." The convention Cisco documents is to "assign your most secure network, such as the inside host network, to level 100. While the outside network connected to the Internet can be level 0. Other networks, such as DMZs can be in between." Levels are not required to be unique: "You can assign interfaces to the same security level."

Configuration is two commands under the interface, a name and a level:

```
ciscoasa(config)# interface vlan 101
ciscoasa(config-if)# nameif inside
ciscoasa(config-if)# security-level 100
ciscoasa(config-if)# ip address 10.1.1.1 255.255.255.0
```

The `security-level` argument is "an integer between 0 (lowest) and 100 (highest)."

> [!warning] The default is 0, except for one magic name
> "The default security level is 0. If you name an interface 'inside,' and you do not set the security level explicitly, then the ASA sets the security level to 100." That is a real special case on the literal string `inside`. Name an interface `INSIDE-CORP` or `inside-dmz` and you get level 0, which is the most permissive-to-nothing and most permitted-from-everything position on the box. Set the level explicitly on every interface and never rely on the name.

## What the level controls

The primary effect is the implicit permit. From the interface chapter: "By default, there is an implicit permit from a higher security interface to a lower security interface (outbound). Hosts on the higher security interface can access any host on a lower security interface. You can limit access by applying an ACL to the interface." The access-rules chapter states it in terms of the packet: "Unicast IPv4 and IPv6 traffic from a higher security interface to a lower security interface is allowed through by default."

Read the direction carefully. [[cs/security/zero-trust-architecture|High to low is open by default]]; low to high is not, and is governed by the ACL you apply plus [[cs/security/privilege-separation-and-least-privilege|the implicit deny at the end of it]]. That asymmetry is the entire "inside can browse the internet, internet cannot browse inside" behavior, and it exists with an empty rule base.

The level also feeds a second, less obvious subsystem. "Some application inspection engines are dependent on the security level. For same-security interfaces, inspection engines apply to traffic in either direction." Two named cases: the NetBIOS inspection engine is "Applied only for outbound connections," and for SQL*Net, "If a control connection for the SQL*Net (formerly OraServ) port exists between a pair of hosts, then only an inbound data connection is permitted through the ASA."

## The same-level trap

This is the failure that wastes an afternoon. You build two interfaces at level 50, write a clean permit rule between them, apply it, and nothing passes. The reason is ordering, and the documentation is explicit about it:

> "Each interface has a security level, and security level checking is performed before access rules are considered. Thus, even if you allow a connection in an access rule, it can be blocked due to same-security-level checking at the interface level."

Two distinct checks exist, for two distinct topologies:

- **Between two different interfaces at the same level.** "Connections between the same security level ingress and egress interfaces are subject to the same-security-traffic inter-interface check. To allow these connections, enter the `same-security-traffic permit inter-interface` command."
- **In and back out the same interface.** "Connections with the same ingress and egress interfaces are subject to the same-security-traffic intra-interface check. To allow these connections, enter the `same-security-traffic permit intra-interface` command."

Once same-security communication is enabled, the implicit permit widens with it: "If you enable communication for same-security interfaces, there is an implicit permit for interfaces to access other interfaces on the same security level or lower."

Cisco's own recommendation is the pragmatic one: "You might want to ensure that your configuration allows same-security-level connections so that your access rules are always considered for permit/deny decisions." In other words, turn the interface-level check off so the only thing deciding traffic is the rule base you can read, review, and diff.

## Changing a level on a live box

Levels feed the connection table, and existing connections are not re-evaluated. "If you change the security level of an interface, and you do not want to wait for existing connections to time out before the new security information is used, you can clear the connections using the `clear conn` command." Plan that: the change looks like it did nothing until the old flows age out, and `clear conn` is a blunt instrument on a production firewall.

## Bridge groups change the scope

In transparent mode the abstraction is different. "In transparent mode, the BVI interface does not have a security level because it does not participate in routing between interfaces." In routed mode with bridge groups, the levels partition into two independent scopes: "the security level on a bridge group member interface only applies for communication within the bridge group. Similarly, the BVI security level only applies for inter-BVI/Layer 3 interface communication."

The implicit permit narrows to match. "For bridge group member interfaces, this implicit permit from a higher to a lower security interface applies to interfaces within the same bridge group only. There are no implicit permits between a bridge group member interface and a routed interface or a member of a different bridge group."

> [!tip] How to reason about it
> Ask two questions of any flow before you look at a single ACL. Which direction is it going relative to the levels, and are the two interfaces at the same level? Those answers determine whether your rule base is even consulted. See [[cs/cisco/asa-access-rules-and-acls|ASA access rules]] for what happens after the level check passes.

## Related Notes

- [[cs/cisco/asa-access-rules-and-acls|ASA Access Rules and ACLs]] - the rule base that runs after the security-level check
- [[cs/cisco/asa-nat|NAT on the ASA]] - why access rules match real addresses, not translated ones
- [[cs/security/firewalls|Firewalls]] - the general stateful-firewall model the ASA implements
- [[cs/cisco/vlans-and-vlan-design|VLANs and VLAN Design]] - the segments an ASA interface usually terminates
- [[cs/security/zero-trust-architecture|Zero Trust Architecture]] - the argument against trusting a network by its position in an ordering
- [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] - the principle a default-permit direction works against

## Sources

- Cisco, "CLI Book 1: Cisco ASA Series General Operations CLI Configuration Guide, 9.17 - Routed and Transparent Mode Interfaces." https://www.cisco.com/c/en/us/td/docs/security/asa/asa917/configuration/general/asa-917-general-config/interface-routed-tfw.html . Backs the 0 to 100 range and its inclusion of bridge group members, the inside/outside/DMZ assignment convention, interfaces sharing a level, the implicit permit from higher to lower, the same-security implicit permit, the inspection-engine dependency including NetBIOS and SQL*Net, the `security-level` command and its integer range, the `nameif`/`security-level`/`ip address` example on VLAN 101, the default level of 0 and the `inside` special case, the `clear conn` note on changing a level, and the transparent-mode/BVI scoping rules.
- Cisco, "CLI Book 2: Cisco ASA Series Firewall CLI Configuration Guide, 9.17 - Access Rules." https://www.cisco.com/c/en/us/td/docs/security/asa/asa917/configuration/firewall/asa-917-firewall-config/access-rules.html . Backs the statement that security level checking runs before access rules are considered, the inter-interface and intra-interface same-security checks and their `same-security-traffic permit` commands, the recommendation to allow same-security-level connections, the implicit permit for unicast IPv4 and IPv6 from higher to lower, and the bridge-group scoping of that implicit permit.
