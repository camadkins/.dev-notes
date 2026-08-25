---
title: Trunking and 802.1Q
description: "Configuring a trunk on IOS: DTP modes and why you turn them off, the native VLAN mismatch that produces spanning-tree loops, and pruning the allowed VLAN list."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-05-11
updated:
aliases:
  - switchport mode trunk
  - native VLAN mismatch
  - switchport trunk allowed vlan
  - DTP
---

The moment a VLAN needs to exist on two switches, you need a trunk. Cisco's framing: trunks are used to carry traffic that belongs to multiple VLANs between devices over the same link, and a device can determine which VLAN the traffic belongs to by its VLAN identifier. One cable, many broadcast domains, a tag telling the far end which is which.

The configuration is three or four lines. The reason people get hurt is that two of those lines have defaults that silently negotiate, and one VLAN on every trunk travels with no tag at all.

> [!note] The idea
> An 802.1Q trunk is not symmetric with respect to VLANs. The trunking device inserts a 4-byte tag into the original frame and recomputes the frame check sequence before sending it over the trunk, but 802.1Q does not tag frames on the native VLAN, and it tags all other frames that are transmitted and received on the trunk. So exactly one VLAN per trunk is carried by *implication* rather than by label, and its identity is a local configuration choice on each end. Cisco's requirement follows directly: when you configure an 802.1Q trunk, you must make sure that you configure the same native VLAN on both sides of the trunk. Every native VLAN failure is a failure to agree about frames that carry no evidence of what they are.

## What the tag actually is

[[cs/standards/ieee-802-1q-vlan-tagging|The 802.1Q tag is 4 bytes]] inserted into the Ethernet frame, and the resulting Ethernet frame can be as large as 1522 bytes. Four fields live in it:

| Field | Width | What it holds |
|---|---|---|
| TPID | 16 bits | Set to 0x8100 to identify the frame as an IEEE 802.1Q-tagged frame |
| Priority | 3 bits | The IEEE 802.1p priority, 8 levels, 0 through 7 |
| CFI | 1 bit | Canonical Format Indicator: 1 means the MAC address is in noncanonical format, 0 means canonical |
| VID | 12 bits | The VLAN Identifier, a value between 0 and 4095 |

The practical consequences are two. First, the extra 4 bytes are a real MTU consideration on anything that cares about frame size, which is the same arithmetic as [[cs/networking/mtu-and-fragmentation|MTU and fragmentation]] one layer up. Second, the 3-bit priority field is where switch-level [[cs/networking/qos-and-traffic-shaping|QoS]] marking lives on a trunk, and it disappears on the native VLAN along with the rest of the tag. Untagged means unmarked.

The tag format details are in the [[cs/networking/vlans-and-802-1q-trunking|vendor-neutral 802.1Q note]]. What follows is what IOS does with it.

## DTP: the negotiation you should turn off

Trunk negotiation is managed by the Dynamic Trunking Protocol, which is a point-to-point protocol. The default matters: the default switchport mode for all Ethernet interfaces is `dynamic auto`. A factory-default port will become a trunk if the neighbor asks nicely.

| Mode | Behavior |
|---|---|
| `switchport mode access` | Permanent nontrunking mode; the interface becomes a nontrunk interface regardless of the neighbor |
| `switchport mode dynamic auto` | Becomes a trunk if the neighboring interface is set to trunk or desirable mode. This is the default |
| `switchport mode dynamic desirable` | Actively attempts to convert the link to a trunk; becomes a trunk if the neighbor is trunk, desirable, or auto |
| `switchport mode trunk` | Permanent trunking mode; the interface becomes a trunk even if the neighboring interface is not a trunk interface |
| `switchport nonegotiate` | Prevents the interface from generating DTP frames |

Cisco's own guidance is to shut DTP off at both ends of the decision. Some internetworking devices might forward DTP frames improperly, which could cause misconfigurations. If you do not intend to trunk across a link, use `switchport mode access` to disable trunking. To enable trunking to a device that does not support DTP, use `switchport mode trunk` and `switchport nonegotiate` to cause the interface to become a trunk but to not generate DTP frames.

Two constraints on `switchport nonegotiate` are worth knowing before you reach for it: you can use the command only when the interface switchport mode is access or trunk, and you must manually configure the neighboring interface as a trunk interface to establish a trunk link. It is not a mode, it is a suppression flag on a mode you already chose.

```
Switch(config)# interface gigabitethernet0/1
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport nonegotiate
Switch(config-if)# switchport trunk native vlan 999
Switch(config-if)# switchport trunk allowed vlan 10,20,30
```

## The native VLAN mismatch

This is the one that shows up in incident reviews. Cisco states the rule and the consequence in the same breath: make sure the native VLAN for an IEEE 802.1Q trunk is the same on both ends of the trunk link, and if the native VLAN on one end of the trunk is different from the native VLAN on the other end, spanning-tree loops might result.

The mechanism is straightforward once you hold the tagging rule next to it. Cisco's statement of that rule: if a packet has a VLAN ID that is the same as the outgoing port native VLAN ID, the packet is sent untagged, otherwise the switch sends the packet with a tag. And on receipt, by default the switch forwards untagged traffic in the native VLAN configured for the port. So an untagged frame leaves switch A as VLAN 10 and arrives at switch B as VLAN 20, purely because the two ends disagree about what "untagged" means. Two VLANs are now bridged together at a point neither switch's topology accounts for, and [[cs/cisco/spanning-tree-protocol|spanning tree]] is calculating loop-free topologies for VLANs that are not actually separate.

Configure it explicitly:

```
Switch(config-if)# switchport trunk native vlan 999
```

The range is 1 to 4094 and the native VLAN can be assigned any VLAN ID. To return to the default native VLAN, VLAN 1, use `no switchport trunk native vlan`.

> [!warning] Do not disable spanning tree on the native VLAN
> Cisco is specific about this one: disabling spanning tree on the native VLAN of an IEEE 802.1Q trunk without disabling spanning tree on every VLAN in the network can potentially cause spanning-tree loops. The recommendation is to leave spanning tree enabled on the native VLAN of an IEEE 802.1Q trunk, or disable spanning tree on every VLAN in the network, and to make sure your network is loop-free before you disable spanning tree anywhere.

## The allowed VLAN list

A trunk port is a member of all VLANs by default, including extended-range VLANs, and membership can be limited by configuring the allowed-VLAN list. Concretely: by default, a trunk port sends traffic to and receives traffic from all VLANs, and all VLAN IDs, 1 to 4094, are allowed on each trunk.

That default is worth pruning for reasons beyond tidiness. Cisco's STP troubleshooting guidance walks through a design where trunks carry all the VLANs defined in the VTP domain, and observes that a distribution switch then receives unnecessary broadcast and multicast traffic for VLANs whose users are not on it, while also blocking one of its ports for those VLANs. The result is more redundant paths than the design intended, which means more blocked ports and a higher likelihood of a loop. Pruning the allowed list is a topology decision, not a bandwidth optimization.

```
Switch(config)# interface gigabitethernet0/1
Switch(config-if)# switchport trunk allowed vlan remove 2
Switch(config-if)# end
```

The keywords are `add`, `all`, `except`, and `remove`. The `vlan-list` parameter is either a single VLAN number from 1 to 4094 or a range of VLANs described by two VLAN numbers, the lower one first, separated by a hyphen, and you must not enter any spaces between comma-separated VLAN parameters or in hyphen-specified ranges. `no switchport trunk allowed vlan` puts everything back.

One membership subtlety that catches people using VTP: a trunk port can become a member of a VLAN if the VLAN is enabled, if VTP knows of the VLAN, and if the VLAN is in the allowed list for the port. When VTP detects a newly enabled VLAN and the VLAN is in the allowed list for a trunk port, the trunk port automatically becomes a member of the enabled VLAN. When VTP detects a new VLAN and the VLAN is not in the allowed list, the trunk port does not become a member. A pruned trunk does not auto-join new VLANs, which is usually what you want and occasionally the reason a new VLAN does not appear where you expected.

And a conversion detail that produces confusing results during a change: if a trunk port with VLAN 1 disabled is converted to a nontrunk port, it is added to the access VLAN, and if the access VLAN is set to 1, the port will be added to VLAN 1 regardless of the `switchport trunk allowed` setting.

> [!example] Verifying a trunk you just built
> ```
> Switch# show interfaces gigabitethernet0/1 switchport
> Switch# show interfaces gigabitethernet0/1 trunk
> ```
> The first command shows the switchport configuration in the Administrative Mode and Administrative Trunking Encapsulation fields, verifies the native VLAN in the Trunking Native Mode VLAN field, and shows the allowed list in the Trunking VLANs Enabled field. The second shows the trunk configuration of the interface. Run them on *both* ends and compare the native VLAN line before you believe the link is healthy. A one-sided check cannot detect a mismatch by construction.

## Related Notes

- [[cs/cisco/vlans-and-vlan-design|VLANs and VLAN Design]] - the VLANs a trunk carries, and where their definitions live
- [[cs/cisco/spanning-tree-protocol|Spanning Tree Protocol]] - what a native VLAN mismatch breaks
- [[cs/cisco/etherchannel-and-lacp|EtherChannel and LACP]] - bundling trunks, where the allowed list must match across members
- [[cs/networking/vlans-and-802-1q-trunking|VLANs and 802.1Q Trunking]] - the vendor-neutral tag format note
- [[cs/cisco/ios-cli-modes|IOS CLI Modes]] - `(config-if)`, where every command here lives
- [[cs/networking/mtu-and-fragmentation|MTU and Fragmentation]] - the 4 bytes the tag costs you
- [[cs/networking/qos-and-traffic-shaping|QoS and Traffic Shaping]] - the 3-bit priority field the tag carries

## Sources

- "Inter-Switch Link and IEEE 802.1Q Frame Format," Cisco. https://www.cisco.com/c/en/us/support/docs/lan-switching/8021q/17056-741-4.html . Backs the purpose of trunks and VLAN identifiers, the 4-byte tag insertion with FCS recomputation, the rule that 802.1Q does not tag frames on the native VLAN, the requirement to configure the same native VLAN on both sides, the TPID/Priority/CFI/VID field widths and values, and the 1522-byte maximum tagged frame size.
- "Configuring VLANs," Catalyst 2960 and 2960-S Switch Software Configuration Guide, Cisco IOS Release 12.2(55)SE. https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/12-2_55_se/configuration/guide/scg_2960/swvlan.pdf . Backs DTP managing trunk negotiation, the `dynamic auto` default, the full Layer 2 interface mode table, the DTP misforwarding warning and the `switchport mode trunk` plus `switchport nonegotiate` remedy with its constraints, the native VLAN mismatch causing spanning-tree loops, `switchport trunk native vlan` and its range, the tagged/untagged forwarding rule, the spanning-tree-on-native-VLAN warning, trunk membership of all VLANs by default, `switchport trunk allowed vlan` with its keywords and syntax rules, VTP interaction with the allowed list, the nontrunk conversion behavior, and the `show interfaces switchport` / `show interfaces trunk` verification fields.
- "Troubleshoot STP Problems and Related Design Considerations," Cisco. https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10556-16.html . Backs the design observation that trunks carrying all VTP-domain VLANs produce unnecessary broadcast and multicast traffic, extra blocked ports, and a higher likelihood of a loop.
