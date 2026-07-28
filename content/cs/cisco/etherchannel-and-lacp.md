---
title: EtherChannel and LACP
description: "Bundling links so spanning tree stops blocking them, why LACP beats mode on, the parameters that must match or the bundle silently will not form, and what load balancing does and does not buy."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-06-24
updated:
aliases:
  - EtherChannel
  - LACP
  - PAgP
  - channel-group
  - port-channel
---

Two switches, two cables between them, and only one is carrying traffic. That is [[spanning-tree-protocol|spanning tree]] doing its job: a second path between the same two bridges is a loop, so one port gets blocked. You bought twice the fiber and got one link's worth of throughput plus a standby.

EtherChannel is the answer to that specific frustration. Multiple physical links combine into a single logical channel, which allows load sharing of traffic among the links in the channel as well as redundancy in the event that one or more links in the channel fail.

> [!note] The idea
> The load sharing is the advertised feature; the spanning-tree behavior is the mechanism that makes it possible. After grouping the links into an EtherChannel, LACP adds the group to the spanning tree as a single switch port. Spanning tree never sees the members, so it has nothing to block. The second consequence is the one that disappoints people who sized a link by adding up member bandwidths: distribution across members is a deterministic hash, and if you use the same addresses and session information, you always hash to the same port in the channel, which prevents out-of-order packet delivery. Four gigabit links is not a four-gigabit link. It is four one-gigabit links with a hash function deciding which conversation rides which one, and Cisco is explicit that you cannot control the port that a particular flow uses.

## Building one

A Layer 2 EtherChannel is created by assigning ports to a channel group with the `channel-group` interface configuration command, which automatically creates the port-channel logical interface. You can also create `interface port-channel port-channel-number` manually first and then bind physical ports to it.

```
Switch# configure terminal
Switch(config)# interface range gigabitethernet0/1 -2
Switch(config-if-range)# switchport mode access
Switch(config-if-range)# switchport access vlan 10
Switch(config-if-range)# channel-group 5 mode active
Switch(config-if-range)# end
```

After the channel exists, the split between the logical and physical interfaces governs everything you do next. Configuration changes applied to the port-channel interface apply to all the physical ports assigned to it, while configuration changes applied to a physical port affect only that port. Cisco's instruction is to apply configuration commands to the port-channel interface to change the parameters of all ports, for example spanning-tree commands or commands to configure a Layer 2 EtherChannel as a trunk.

There is an ordering trap in how the group takes shape. When a group is first created, all ports follow the parameters set for the first port to be added to the group, and if you change one of those parameters you must also make the changes to all ports in the group. The parameters Cisco names are the allowed-VLAN list, the spanning-tree path cost for each VLAN, the spanning-tree port priority for each VLAN, and the spanning-tree PortFast setting.

## PAgP, LACP, and mode on

Three ways exist to make a bundle, and they are not equivalent.

**PAgP** is a Cisco-proprietary protocol that can be run only on Cisco switches and on those switches licensed by vendors to support PAgP. Its modes are `auto` (passive negotiating state, responds to PAgP packets but does not start negotiation) and `desirable` (active negotiating state, starts negotiations by sending PAgP packets). A port in desirable mode can form an EtherChannel with another port in desirable or auto mode, and a port in auto mode can form one with a port in desirable mode. A port in auto mode cannot form an EtherChannel with another port that is also in auto mode, because neither port starts PAgP negotiation.

**LACP** is defined in IEEE 802.3ad and enables Cisco switches to manage Ethernet channels between switches that conform to the IEEE 802.3ad protocol. Its modes mirror PAgP's: `active` starts negotiations by sending LACP packets, `passive` responds but does not start negotiation. Same rule at the ends: active pairs with active or passive, and a port in the passive mode cannot form an EtherChannel with another port that is also in passive mode.

**Mode on** forces a port to join an EtherChannel without negotiations. It can be useful if the remote device does not support PAgP or LACP, and in the on mode a usable EtherChannel exists only when the switches at both ends of the link are configured in the on mode.

> [!warning] Mode on removes the only check on your configuration
> Cisco's caution is direct: you should use care when using the on mode, because this is a manual configuration and ports on both ends of the EtherChannel must have the same configuration, and if the group is misconfigured, packet loss or spanning-tree loops can occur. That is the whole argument for LACP over `on`. A negotiating protocol refuses to form a bundle it cannot verify; `on` bundles whatever you told it to bundle and lets the topology find out. Use `active` unless the far end genuinely cannot speak LACP.

Two more constraints. You cannot configure an EtherChannel in both the PAgP and LACP modes, since individual EtherChannel groups can run either PAgP or LACP but cannot interoperate, though groups running each can coexist on the same switch. And you must not configure a port to be a member of more than one EtherChannel group.

Member counts differ by protocol. A PAgP EtherChannel takes up to eight Ethernet ports of the same type. A LACP EtherChannel takes up to 16 Ethernet ports of the same type, where up to eight ports can be active and up to eight ports can be in standby mode. That standby capacity is a real operational difference and a reason to prefer LACP beyond the standards argument.

## The parameters that must match

This is where bundles fail silently. Cisco's guidance opens with the failure mode itself: if improperly configured, some EtherChannel ports are automatically disabled to avoid network loops and other problems. A port that will not join is not always logged as a problem; it is often just absent from the bundle.

Configure all ports in an EtherChannel to operate at the same speeds and duplex modes. For Layer 2 EtherChannels specifically, assign all ports in the EtherChannel to the same VLAN or configure them as trunks, and note that ports with different native VLANs cannot form an EtherChannel. If you build the channel from trunk ports, verify that the trunking mode is the same on all the trunks, since inconsistent trunk modes on EtherChannel ports can have unexpected results.

The allowed VLAN list is the one that catches people mid-change. An EtherChannel supports the same allowed range of VLANs on all the ports in a trunking Layer 2 EtherChannel, and if the allowed range of VLANs is not the same, the ports do not form an EtherChannel even when PAgP is set to the auto or desirable mode. Prune the [[trunking-and-802-1q|allowed VLAN list]] on one member and forget the other and you have not restricted the channel, you have dissolved it.

One parameter that does *not* have to match, which is worth knowing because people assume the opposite: ports with different spanning-tree path costs can form an EtherChannel if they are otherwise compatibly configured, and setting different spanning-tree path costs does not, by itself, make ports incompatible for the formation of an EtherChannel.

Two more items from Cisco's list that shape how you use a bundle. Enable all ports in an EtherChannel, because a port in an EtherChannel that is disabled by using the `shutdown` interface configuration command is treated as a link failure and its traffic is transferred to one of the remaining ports. And do not configure a SPAN destination port as part of an EtherChannel, nor a secure port as part of an EtherChannel or the reverse.

## Load balancing

Configure the distribution method globally with `port-channel load-balance`. On a Catalyst 2960 the load balancing and forwarding method is a global configuration setting; the selected mode applies to all EtherChannels configured on the switch. On Catalyst 6500/6000 running Cisco IOS the option list is `{src-mac | dst-mac | src-dst-mac | src-ip | dst-ip | src-dst-ip | src-port | dst-port | src-dst-port | mpls}`, and load balancing can use MAC addresses, IP addresses, or Layer 4 port numbers.

The selection rule Cisco gives is a single sentence and it is the whole art: use the option that provides the greatest variety in your configuration. The worked example makes it concrete. If the traffic on a channel only goes to a single MAC address, use of the destination MAC address results in the choice of the same link in the channel each time, and use of source addresses or IP addresses can result in a better load balance. The 2960 guide's aggregation example runs the two ends differently on purpose: a switch aggregating data from four workstations toward a router uses source-based forwarding, because the router is a single-MAC-address device, so source-based forwarding ensures the switch uses all available bandwidth to the router, while the router is configured for destination-based forwarding because the large number of workstations ensures the traffic is evenly distributed from the router EtherChannel.

> [!warning] Eight, four, or two, and nothing else divides evenly
> On the Catalyst 6500/6000, the Cisco-proprietary hash algorithm computes a value in the range 0 to 7, and each port in the channel is given a mask of which values it accepts. With eight ports each port accepts one value; with four ports each accepts two. The published ratios show what happens otherwise: 8 ports give 1:1:1:1:1:1:1:1, 4 give 2:2:2:2, 2 give 4:4, but 3 ports give 3:3:2, 5 give 2:2:2:1:1, 6 give 2:2:1:1:1:1, and 7 give 2:1:1:1:1:1:1. Cisco's conclusion: you can only achieve perfect load balancing, even with random addresses, if you have two, four, or eight ports in the port channel. A three-link channel is not 3 gigabits evenly, it is a lopsided 3:3:2 split of an 8-value hash space. Size bundles in powers of two.
>
> The hash itself is not yours to tune. Cisco states the algorithm cannot be configured or changed to load balance the traffic among the ports in an EtherChannel. Your only lever is which fields it hashes over.

Changing that lever is not always free. Cisco flags that `port-channel load-balance src-dst-mixed-ip-port` can change the hardware forwarding on the PFC/DFC/CFC of a Supervisor and can cause interruption to traffic for several seconds to minutes until the new hash algorithm has been calculated, recommending any change in the hash algorithm during non-production hours. Treat a load-balance change as a maintenance-window action, not a tweak.

> [!example] Asking the switch which link a flow will take
> ```
> 6509# remote login switch
> 6509-sp# test etherchannel load-balance interface port-channel 1 ip 10.10.10.2 10.10.10.1
> Would select Gi6/1 of Po1
> ```
> On a Catalyst 6500, `show etherchannel load-balance` checks the frame distribution policy, and after logging in to the Switch Processor console with `remote login switch` you can ask the box directly which interface a given source/destination pair would use. That turns "the load balancing looks uneven" from an argument into a measurement. Separately, `show etherchannel summary` shows which ports are in the hot-standby mode, denoted with an `H` port-state flag. That is where a member lands when LACP is not able to aggregate all the ports that are compatible, for example because the remote system has more restrictive hardware limitations, and those ports are used only if one of the channeled ports fails.

## Related Notes

- [[spanning-tree-protocol|Spanning Tree Protocol]] - the blocking behavior EtherChannel exists to sidestep
- [[trunking-and-802-1q|Trunking and 802.1Q]] - the allowed VLAN list and native VLAN that must match across members
- [[vlans-and-vlan-design|VLANs and VLAN Design]] - access-mode members must share one VLAN
- [[load-balancing-l4-and-l7|Load Balancing L4 and L7]] - the same per-flow hashing idea, several layers up
- [[ios-cli-modes|IOS CLI Modes]] - `interface range` and `(config-if-range)`
- [[show-and-debug-methodology|Show and Debug Methodology]] - reading `show etherchannel summary` against what you meant to build

## Sources

- "Configuring EtherChannels and Link-State Tracking," Catalyst 2960 and 2960-S Switch Software Configuration Guide, Cisco IOS Release 12.2(55)SE. https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/12-2_55_se/configuration/guide/scg_2960/swethchl.pdf . Backs `channel-group` automatically creating the port-channel logical interface, the port-channel versus physical-port configuration split, the first-port parameter inheritance and the four parameters it covers, PAgP being Cisco-proprietary with its auto and desirable modes and compatibility rules, LACP being defined in IEEE 802.3ad with active and passive modes and their compatibility rules, LACP adding the group to spanning tree as a single switch port, mode on and its caution about packet loss and spanning-tree loops, the ban on mixing PAgP and LACP in one group and on multi-group membership, the eight-port PAgP and sixteen-port LACP limits with eight active and eight standby, the same-speed-and-duplex requirement, same-VLAN-or-trunk and different-native-VLAN rules, the allowed-VLAN-range requirement, the trunking-mode consistency warning, the note that differing spanning-tree path costs do not prevent formation, `shutdown` on a member being treated as a link failure, the SPAN and secure port exclusions, the global `port-channel load-balance` setting, the source-MAC and destination-MAC forwarding behaviors, the greatest-variety selection guidance with the single-destination-MAC example, the four-workstation-to-router example with source-based and destination-based ends, and `show etherchannel summary` showing hot-standby ports with the `H` flag when LACP cannot aggregate all compatible ports.
- "Understand EtherChannel Load Balance and Redundancy on Catalyst Switches," Cisco. https://www.cisco.com/c/en/us/support/docs/lan-switching/etherchannel/12023-4.html . Backs combining multiple links into one logical channel for load sharing and redundancy, the deterministic hash preventing out-of-order delivery, the inability to control which port a flow uses, the 6500/6000 hash computing a value in the range 0 to 7 with per-port masks, the full port-count-to-ratio table, the conclusion that perfect load balancing requires two, four, or eight ports, the statement that the hash algorithm cannot be configured or changed, the 6500/6000 `port-channel load-balance` option list including Layer 4 port numbers, the `src-dst-mixed-ip-port` traffic interruption warning, `show etherchannel load-balance`, and the `remote login switch` plus `test etherchannel load-balance` sequence with its output.
