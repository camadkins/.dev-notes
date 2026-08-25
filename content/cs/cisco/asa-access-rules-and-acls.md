---
title: ASA Access Rules and ACLs
description: "How the ASA evaluates access rules: the four-step order of operations, why an interface rule beats a global rule, and the two behaviors (implicit permit, real-address matching) that make a correct-looking rule do the wrong thing."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-04-22
updated:
aliases:
  - ASA access rules
  - access-group
  - ASA ACL order
---

An ACL on an ASA looks like an ACL on a router, and that resemblance causes most of the trouble. The list syntax is familiar, the [[cs/security/firewalls|first-match-wins evaluation]] is familiar, and then two ASA-specific behaviors, an implicit permit you did not write and address matching that ignores your NAT, produce results the router mental model cannot explain.

> [!note] The idea
> An ASA access rule does not decide traffic on its own. It sits inside a fixed pipeline: the interface security-level check runs first, then the interface rule, then the BVI rule, then the global rule, then the implicit deny. Rules earlier in that pipeline can permit or block traffic without any rule ever matching, which is why "my ACL says permit" and "the packet passed" are independent facts on this platform.

## The layers

Cisco enumerates several rule types that "work together to implement your access control policy." The ones that matter on a routed-mode box:

- **Extended access rules assigned to interfaces.** "You can apply separate rule sets (ACLs) in the inbound and outbound directions. An extended access rule permits or denies traffic based on the source and destination traffic criteria."
- **Extended access rules assigned globally.** "You can create a single global rule set, which serves as your default access control. The global rules are applied after interface rules."
- **Management access rules**, which "cover traffic directed at an interface, which would typically be management traffic. In the CLI, these are 'control plane' access groups."
- **[[cs/standards/ieee-802-3-ethernet|EtherType rules]]** for Layer 2, available on bridge group member interfaces only, controlling "network access for non-IP traffic."

## Inbound and outbound mean something specific here

This is worth reading twice, because the industry uses the same two words for the opposite concept:

> "'Inbound' and 'outbound' refer to the application of an ACL on an interface, either to traffic entering the ASA on an interface or traffic exiting the ASA on an interface. These terms do not refer to the movement of traffic from a lower security interface to a higher security interface, commonly known as inbound, or from a higher to lower interface, commonly known as outbound."

So `access-group X in interface outside` filters packets arriving at the outside interface, not "internet-to-inside traffic" as a policy direction. The two usually coincide; when they do not, you get a rule applied to a direction you did not intend.

An outbound ACL earns its keep when you want to constrain who may reach a destination rather than enumerating what each source may do. Cisco's example allows exactly three inside hosts to reach one web server:

```
hostname(config)# access-list OUTSIDE extended permit tcp host 10.1.1.14 host 209.165.200.225 eq www
hostname(config)# access-list OUTSIDE extended permit tcp host 10.1.2.67 host 209.165.200.225 eq www
hostname(config)# access-list OUTSIDE extended permit tcp host 10.1.3.34 host 209.165.200.225 eq www
hostname(config)# access-group OUTSIDE out interface outside
```

"Rather than creating multiple inbound ACLs to restrict access, you can create a single outbound ACL that allows only the specified hosts."

## Order of operations

Within a list, the rule is the ordinary one: "the ASA tests the packet against each rule in the order in which the rules are listed in the applied ACL. After a match is found, no more rules are checked." The documented consequence is the classic self-inflicted wound: "if you create an access rule at the beginning that explicitly permits all traffic for an interface, no further rules are ever checked."

Across lists, the pipeline is fixed and documented as an explicit sequence:

1. Interface access rule.
2. For bridge group member interfaces, the Bridge Virtual Interface (BVI) access rule.
3. Global access rule.
4. Implicit deny.

Two facts follow that people get wrong in design reviews. First, "the specific inbound interface access rules are always processed before the general global access rules," so a global rule can never override an interface rule; it only catches what the interface rule did not match. Second, "global access rules apply only to inbound traffic," so a global list is not a way to filter egress.

Bridge groups reverse their internal order depending on direction, which is easy to get backwards: "Inbound, the member access rules are evaluated first, then the BVI access rules. Outbound, the BVI rules are considered first, then the member interface rules."

## Implicit permit and implicit deny

The implicit deny is the familiar one. "ACLs have an implicit deny at the end of the list, so unless you explicitly permit it, traffic cannot pass." With a global rule configured, "the implicit deny comes after the global rule is processed."

The implicit permit is the ASA-specific one, and it comes from [[cs/cisco/asa-security-levels|the security levels]] rather than from any list: "Unicast IPv4 and IPv6 traffic from a higher security interface to a lower security interface is allowed through by default." No rule was written. No rule matched. The traffic passes.

There are two documented exceptions to the implicit-deny rule that are worth memorizing because they change troubleshooting:

- **Management (control plane) ACLs have no implicit deny.** "Any connection that does not match a management access rule is then evaluated by regular access control rules." A management ACL is a filter, not a policy boundary.
- **EtherType ACL implicit deny does not reach IP.** "If you allow EtherType 8037, the implicit deny at the end of the ACL does not now block any IP traffic that you previously allowed with an extended ACL." But an explicit deny-all EtherType rule does reach IP: "if you explicitly deny all traffic with an EtherType rule, then IP and ARP traffic is denied; only physical protocol traffic, such as auto-negotiation, is still allowed."

> [!warning] Rules match real addresses, not translated ones
> "Access rules always use the real IP addresses when determining an access rule match, even if you configure NAT." The documented example: with an inside server at 10.1.1.5 translated to 209.165.201.5 on the outside, "the access rule to allow the outside traffic to access the inside server needs to reference the server's real IP address (10.1.1.5), and not the mapped address (209.165.201.5)." This is the single most common ASA rule bug, and it is invisible on inspection because the rule referencing the public address reads perfectly sensibly. See [[cs/cisco/asa-nat|NAT on the ASA]].

## Return traffic

Statefulness removes an entire class of rules, but only for connection-oriented protocols. "For TCP, UDP, and SCTP connections for both routed and transparent mode, you do not need an access rule to allow returning traffic because the ASA allows all returning traffic for established, bidirectional connections."

ICMP is the exception that generates support tickets: "For connectionless protocols such as ICMP, however, the ASA establishes unidirectional sessions, so you either need access rules to allow ICMP in both directions (by applying ACLs to the source and destination interfaces), or you need to enable the ICMP inspection engine. The ICMP inspection engine treats ICMP sessions as bidirectional connections." Enabling ICMP inspection is the maintainable answer; writing echo and echo-reply rules on both interfaces is the one people write first.

Broadcast and multicast are a separate carve-out: "In routed firewall mode, broadcast and multicast traffic is blocked even if you allow it in an access rule, including unsupported dynamic routing protocols and DHCP. You must configure the dynamic routing protocols or DHCP relay to allow this traffic." A permit rule for UDP 67/68 will not make DHCP work across a routed ASA.

## Applying a list

Binding is one command:

```
access-group access_list { { in | out } interface interface_name [ per-user-override | control-plane ] | global }
```

The constraint to remember: "You can configure one `access-group` command per ACL type per interface per direction, and one control plane ACL." There is no stacking of two extended ACLs inbound on the same interface. The `global` keyword applies "the extended ACL to the inbound direction of all interfaces," and `control-plane` "specifies if the extended ACL is for to-the-box traffic."

Precedence between to-the-box management commands and a control-plane ACL runs the way that keeps you from locking yourself out: "Access control rules for to-the-box management traffic (defined by such commands as `http`, `ssh`, or `telnet`) have higher precedence than a management access rule applied with the `control-plane` option. Therefore, such permitted management traffic will be allowed to come in even if explicitly denied by the to-the-box ACL."

> [!example] Reading a failure
> A permit rule exists on the inside interface for host to DMZ, both interfaces are level 50, and traffic drops. Walk the pipeline in order. The security-level check runs before rules, and inter-interface same-security traffic is denied unless `same-security-traffic permit inter-interface` is configured. The rule base never got a vote. The fix is at the interface layer, not in the ACL, which is why editing the ACL never helped.

## Scale considerations

Large rule bases are not free. "Eventually, the ACLs for the access groups can become so large that they impact overall system performance. If you find that the system is having issues sending syslog messages, communicating for failover synchronization, establishing and maintaining SSH/HTTPS management access connections, and so forth, you might need to prune your access rules."

Two documented levers. Object group search "does not expand network or service objects, but instead searches access rules for matches based on those group definitions," reducing memory "at the expense rule of lookup performance and increased CPU utilization," enabled with `object-group-search access-control`. And the transactional commit model, `asp rule-engine transactional-commit access-group`, which Cisco frames as improving "system performance and reliability."

## Related Notes

- [[cs/cisco/asa-security-levels|ASA Security Levels]] - the check that runs before any access rule
- [[cs/cisco/asa-nat|NAT on the ASA]] - why rules reference real addresses
- [[cs/cisco/asa-modular-policy-framework|ASA Modular Policy Framework]] - where inspection engines like ICMP inspection are turned on
- [[cs/security/firewalls|Firewalls]] - stateful inspection and the return-traffic model
- [[cs/security/ids-and-ips|IDS and IPS]] - what sits beyond permit/deny
- [[cs/security/siem-and-security-logging|SIEM and Security Logging]] - where ACL hit logging should land

## Sources

- Cisco, "CLI Book 2: Cisco ASA Series Firewall CLI Configuration Guide, 9.17 - Access Rules." https://www.cisco.com/c/en/us/td/docs/security/asa/asa917/configuration/firewall/asa-917-firewall-config/access-rules.html . Backs the rule layers (interface, BVI, global, management/control-plane, EtherType), the definition of inbound and outbound as ACL application rather than policy direction, the outbound ACL example with its three `access-list` lines and `access-group OUTSIDE out interface outside`, first-match evaluation and the permit-all-first warning, the four-step order of operations, interface rules processed before global rules, global rules applying only inbound, the BVI/member ordering by direction, implicit deny and its placement after the global rule, the implicit permit for unicast IPv4 and IPv6 from higher to lower security, the absence of implicit deny on management rules, the EtherType 8037 and explicit-deny-all behavior, real-address matching with the 10.1.1.5 / 209.165.201.5 example, stateful return traffic for TCP/UDP/SCTP, the ICMP unidirectional-session behavior and ICMP inspection engine, broadcast and multicast blocking in routed mode, the `access-group` syntax and one-per-type-per-interface-per-direction limit, the `global` and `control-plane` keywords, the precedence of to-the-box management commands over a control-plane ACL, the performance impact of oversized rule bases, and the `object-group-search access-control` and `asp rule-engine transactional-commit access-group` commands.
- Cisco, "CLI Book 1: Cisco ASA Series General Operations CLI Configuration Guide, 9.17 - Routed and Transparent Mode Interfaces." https://www.cisco.com/c/en/us/td/docs/security/asa/asa917/configuration/general/asa-917-general-config/interface-routed-tfw.html . Backs the security-level model that produces the implicit permit referenced above.
