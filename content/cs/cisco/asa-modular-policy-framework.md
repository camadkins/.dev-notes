---
title: ASA Modular Policy Framework
description: "Class map, policy map, service policy: the ASA's three-noun structure for applying inspection, QoS, and connection settings to traffic the access rules already permitted."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-02-17
updated:
aliases:
  - MPF
  - service policy
  - class-map
  - policy-map
---

Every ASA ships with a policy you did not write. `policy-map global_policy` is in the running config on a factory box, it is already inspecting a list of protocols, and it is the reason FTP works through the firewall without you configuring anything. Understanding Modular Policy Framework starts with understanding that you are editing an existing policy, not creating one.

> [!note] The idea
> MPF separates *which traffic* (class map) from *what to do to it* (policy map) from *where it applies* (service policy), and that separation is what lets one action set be reused across interfaces. The consequence people trip over is that a packet matches at most one class map **per feature type**, so two class maps both requesting HTTP inspection means the second one silently does nothing, while a class map requesting connection limits and another requesting inspection both apply to the same packet.

## Where MPF sits

Access rules decide whether a packet lives. MPF decides what happens to the survivors: "The point of service policies is to apply advanced services to the traffic you are allowing. Any traffic permitted by access rules can have service policies applied, and thus receive special processing, such as being redirected to a service module or having application inspection applied."

The features that live here, per the documented table, are application inspection, NetFlow Secure Event Logging filtering, [[cs/networking/qos-and-traffic-shaping|QoS input and output policing]], the QoS standard priority queue, TCP and UDP connection limits and timeouts, [[cs/security/cryptographically-secure-randomness|TCP sequence number randomization]], TCP normalization, TCP state bypass, and user statistics for the Identity Firewall. Some apply to through traffic only. QoS policing and the priority queue, TCP normalization, and TCP state bypass are all listed as through-traffic-only, not available for management traffic.

## The three nouns

- **Class map** defines the match: "The `class` command defines the traffic matching criteria for the rule."
- **Policy map** is the ordered rule set: "Service policy map, which is the ordered set of rules, and is named on the `service-policy` command." Each rule is a `class` command plus its actions.
- **Actions** are the commands under the class: "The commands associated with class, such as `inspect`, `set connection timeout`, and so forth, define the services and constraints to apply to matching traffic."

There is a fourth noun that causes real confusion, and Cisco flags it explicitly: "`inspect` commands can point to inspection policy maps, which define actions to apply to inspected traffic. Keep in mind that inspection policy maps are not the same as service policy maps." A service policy map is `policy-map NAME`. An inspection policy map is `policy-map type inspect PROTOCOL NAME` and it tunes the behavior of one inspection engine.

The documented CLI example puts all of it together:

```
class-map sip-class-inside
 match access-list inside_mpc

policy-map test-inside-policy
 class sip-class-inside
  inspect sip sip-high
 class inside-class
  inspect snmp snmp-v3only
 class inside-class1
  inspect icmp
 class class-default
  set connection timeout embryonic 0:00:30 half-closed 0:10:00 idle 1:00:00
  reset dcd 0:15:00 5
  user-statistics accounting

service-policy test-inside-policy interface inside
```

The last line is the one that turns the configuration into behavior: "The `service-policy` command applies the policy map rule set to the inside interface. This command activates the policies."

## The default global policy

You will meet this on every box. "By default, the configuration includes a policy that matches all default application inspection traffic and applies certain inspections to the traffic on all interfaces (a global policy). Not all inspections are enabled by default."

The named default inspections are DNS, FTP, H323 (H225), H323 (RAS), RSH, RTSP, ESMTP, SQLnet, Skinny (SCCP), SunRPC, SIP, NetBios, TFTP, and IP Options. The configuration that produces them:

```
class-map inspection_default
 match default-inspection-traffic

policy-map global_policy
 class inspection_default
  inspect dns preset_dns_map
  inspect ftp
  ...
service-policy global_policy global
```

`match default-inspection-traffic` deserves attention because it violates the rule stated everywhere else. It "is a special CLI shortcut to match the default ports for all inspections. When used in a policy map, this class map ensures that the correct inspection is applied to each packet, based on the destination port of the traffic. For example, when UDP traffic for port 69 reaches the ASA, then the ASA applies the TFTP inspection; when TCP traffic for port 21 arrives, then the ASA applies the FTP inspection. So in this case only, you can configure multiple inspections for the same class map."

The generalization matters more than the exception: "Normally, the ASA does not use the port number to determine which inspection to apply, thus giving you the flexibility to apply inspections to non-standard ports." An `inspect http` under a class matching TCP/8443 inspects HTTP on 8443. The engine is not port-derived.

`class-default` is the other one you inherit. "Another class map that exists in the default configuration is called class-default, and it matches all traffic. This class map appears at the end of all Layer 3/4 policy maps." Cisco adds a reason to prefer it over rolling your own catch-all: "some features are only available for class-default."

> [!warning] There can be only one
> "You can only apply one global policy. For example, you cannot create a global policy that includes feature set 1, and a separate global policy that includes feature set 2. All features must be included in a single policy." And per interface: "You can only assign one policy map per interface." So adding a global inspection means editing `global_policy`, not adding a second global service policy. You can, however, "apply the same policy map to multiple interfaces."

## Matching, and the rule that surprises people

The matching model is per feature type, not per packet:

> "A packet can match only one class map in the policy map for each feature type. When the packet matches a class map for a feature type, the ASA does not attempt to match it to any subsequent class maps for that feature type. If the packet matches a subsequent class map for a different feature type, however, then the ASA also applies the actions for the subsequent class map, if supported."

Cisco's four worked cases make the boundary concrete:

- Connection limits in one class, application inspection in another: **both apply.**
- HTTP inspection in one class, HTTP inspection in another: the second **does not apply.**
- HTTP inspection in one class, FTP inspection in another: the second **does not apply**, "because HTTP and FTP inspections cannot be combined."
- HTTP inspection in one class, IPv6 inspection in another: **both apply**, "because the IPv6 inspection can be combined with any other type of inspection."

The combinable inspections are named: IPv6, IP options, and WAAS. Everything else is effectively exclusive, and the general statement is that "most inspections should not be combined with another inspection, so the ASA only applies one inspection if you configure multiple inspections for the same traffic."

> [!example] The typo that costs a day
> Cisco documents this as a misconfiguration example, and it is exactly the shape of a real one. A class map for HTTP is written with the wrong port:
>
> ```
> class-map ftp
>  match port tcp eq 21
> class-map http
>  match port tcp eq 21   [it should be 80]
> policy-map test
>  class ftp
>   inspect ftp
>  class http
>   inspect http
> ```
>
> Port 21 traffic now matches both classes. "In both cases of misconfiguration examples, only the FTP inspection is applied, because FTP comes before HTTP in the order of inspections applied." No error is raised. HTTP inspection simply never runs, and the reason is a fixed internal ordering, not the order you wrote the classes in.

## Action order is fixed, not configured

This is the second half of the same lesson: "The order in which different types of actions in a policy map are performed is independent of the order in which the actions appear in the policy map."

The documented sequence:

1. QoS input policing
2. TCP normalization, TCP and UDP connection limits and timeouts, TCP sequence number randomization, and TCP state bypass
3. Application inspections that can be combined with other inspections (IPv6, IP options, WAAS)
4. Application inspections that cannot be combined with other inspections
5. QoS output policing
6. QoS standard priority queue

NetFlow Secure Event Logging filtering and Identity Firewall user statistics are "order-independent."

Two incompatibilities are called out directly: "You cannot configure QoS priority queuing and QoS policing for the same set of traffic," and the inspection-combination limit above.

## Direction, and the global-policy asymmetry

"Actions are applied to traffic bidirectionally or unidirectionally depending on the feature." Application inspection, connection limits and timeouts, TCP normalization, TCP state bypass, and user statistics are all bidirectional on a single interface. QoS input policing is ingress; QoS output policing and the priority queue are egress.

Applying the same policy globally changes that: "When you use a global policy, all features are unidirectional; features that are normally bidirectional when applied to a single interface only apply to the ingress of each interface when applied globally. Because the policy is applied to all interfaces, the policy will be applied in both directions so bidirectionality in this case is redundant." The Feature Directionality table lists inspection, connection limits, TCP normalization, TCP state bypass, and user statistics as Ingress under a global policy.

## Precedence between interface and global policies

The rule is per feature, not per policy:

> "Interface service policies on ingress interfaces take precedence over the global service policy for a given feature. For example, if you have a global policy with FTP inspection, and an interface policy with TCP normalization, then both FTP inspection and TCP normalization are applied to the interface. However, if you have a global policy with FTP inspection, and an ingress interface policy with FTP inspection, then only the ingress interface policy FTP inspection is applied to that interface. If no ingress or global policy implements a feature, then an interface service policy on the egress interface that specifies the feature is applied."

Flows are also claimed by the first policy that touches them: "If traffic is part of an existing connection that matches a feature in a policy on one interface, that traffic flow cannot also match the same feature in a policy on another interface; only the first policy is used." Concretely, HTTP inspected on the inside interface is not inspected again on the outside egress, and "the return traffic for that connection will not be inspected by the ingress policy of the outside interface, nor by the egress policy of the inside interface." Traffic not treated as a flow, such as ICMP without stateful ICMP inspection, can match a different policy map on the return interface.

## Limits and the change-window gotcha

The scale numbers, verbatim from the guidelines: "The maximum number of class maps (traffic classes) of all types is 255 in single mode or per context in multiple mode," which "also includes default class maps of all types, limiting user-configured class maps to approximately 235." You "can create up to 64 policy maps in the configuration" and "can identify up to 63 Layer 3/4 class maps in a Layer 3/4 policy map."

> [!warning] A policy change does not touch existing connections
> "When you make service policy changes to the configuration, all new connections use the new service policy. Existing connections continue to use the policy that was configured at the time of the connection establishment. Output for the `show` command will not include data about the old connections." That last sentence is the real trap during a change window: `show service-policy` counters look wrong because they only cover new flows. "To ensure that all connections use the new policy, you need to disconnect the current connections so they can reconnect using the new policy. Use the `clear conn` or `clear local-host` commands."

## Related Notes

- [[asa-access-rules-and-acls|ASA Access Rules and ACLs]] - the permit decision that runs before any service policy
- [[asa-security-levels|ASA Security Levels]] - the interface model service policies are attached to
- [[asa-nat|NAT on the ASA]] - the `nat-rewrite` parameter in the default DNS inspection map
- [[qos-and-traffic-shaping|QoS and Traffic Shaping]] - the policing and priority-queue features MPF exposes
- [[ids-and-ips|IDS and IPS]] - application inspection as a lighter cousin of protocol-aware detection
- [[firewalls|Firewalls]] - where deep protocol inspection sits in the firewall taxonomy

## Sources

- Cisco, "CLI Book 2: Cisco ASA Series Firewall CLI Configuration Guide, 9.17 - Service Policy." https://www.cisco.com/c/en/us/td/docs/security/asa/asa917/configuration/firewall/asa-917-firewall-config/inspect-service-policy.html . Backs the definition of service policies as applying advanced services to access-rule-permitted traffic, the feature table and its through-traffic and management-traffic columns, the service policy map / rule / class / action component model, the distinction between inspection policy maps and service policy maps, the `test-inside-policy` CLI example and the `service-policy ... interface inside` activation line, the default global policy and its list of default inspections, the `class-map inspection_default` / `match default-inspection-traffic` / `policy-map global_policy` / `service-policy global_policy global` configuration, the `default-inspection-traffic` port-shortcut behavior and the TFTP-on-69 and FTP-on-21 examples, the normal port-independence of inspection selection, `class-default` matching all traffic and being required by some features, the one-global-policy and one-policy-map-per-interface limits, applying one policy map to multiple interfaces, per-feature-type single class map matching and the four packet-matching examples, the combinable inspections IPv6 / IP options / WAAS, the FTP-and-HTTP-on-port-21 misconfiguration example and FTP-before-HTTP ordering, the fixed action order list and the order-independence of NetFlow and user statistics, the QoS priority-queuing and policing incompatibility, feature directionality including the global-policy ingress-only behavior, interface-over-global per-feature precedence and the egress fallback, single-policy flow claiming across interfaces, the 255 class map / approximately 235 user-configured / 64 policy map / 63 class-maps-per-policy-map limits, and the new-connections-only behavior of policy changes with `clear conn` and `clear local-host`.
