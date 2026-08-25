---
title: VLANs and VLAN Design
description: "What a VLAN buys you on a Cisco switch, how access ports get assigned, where the VLAN database actually lives, and why VLAN 1 deserves suspicion."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-04-02
updated:
aliases:
  - Cisco VLANs
  - switchport access vlan
  - VLAN 1
  - vlan.dat
---

You reach for a VLAN when two groups of devices share a switch but should not share a broadcast domain. Cameras and workstations in the same closet. A vendor's test bench and the production LAN. The trigger is almost never "we ran out of ports," it is "these things should not be able to see each other's frames without passing something that can enforce policy."

Cisco's own definition is worth reading slowly, because it is a design statement, not a technology statement: a VLAN is a switched network that is logically segmented by function, project team, or application, without regard to the physical locations of the users. The segmentation axis is organizational. The cabling is irrelevant.

> [!note] The idea
> A VLAN turns one physical switch into several independent forwarding domains. On a Cisco switch, unicast, broadcast, and multicast packets are forwarded and flooded only to end stations in the VLAN, and packets destined for stations that do not belong to the VLAN must be forwarded through a router or a switch supporting fallback bridging. That second half is the part that matters for design: the VLAN boundary is a *mandatory routing point*, so it is the natural place to hang a policy enforcement device. Segmentation and inspection are the same decision.

## The flooding boundary is the whole product

A switch with no VLANs [[cs/networking/multicast-broadcast-anycast|floods unknown unicast, broadcast, and multicast out every port]]. Add VLANs and that flood is scoped. Each VLAN is considered a logical network, and it contains its own bridge MIB information and can support its own implementation of spanning tree. So a VLAN is not a filter bolted onto a flat network, it is a separate bridged network that happens to run on shared hardware, with its own [[cs/cisco/spanning-tree-protocol|spanning tree instance]] and its own address learning.

VLANs are often associated with IP subnetworks. All the end stations in a particular IP subnet belong to the same VLAN, which is why VLAN design and [[cs/networking/ip-addressing-and-subnetting|subnet design]] are one exercise rather than two. If you find yourself with two subnets in one VLAN or one subnet split across two VLANs, something upstream in the design went sideways.

[[cs/standards/ieee-802-1q-vlan-tagging|VLANs are identified by a number from 1 to 4094]], and VLAN IDs 1002 through 1005 are reserved for Token Ring and FDDI VLANs. Those four reserved IDs are automatically created and cannot be removed, which is why `show vlan` on a factory-fresh switch is never empty.

## Access ports: two commands, one of which lies to you

Interface VLAN membership on the switch is assigned manually on an interface-by-interface basis, which Cisco calls interface-based, or static, VLAN membership. A static-access port can belong to one VLAN and is manually assigned to that VLAN. Two interface commands do it:

```
Switch# configure terminal
Switch(config)# interface gigabitethernet0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 2
Switch(config-if)# end
```

`switchport mode access` puts the interface into permanent nontrunking mode and negotiates to convert the link into a nontrunk link, and the interface becomes a nontrunk interface regardless of whether or not the neighboring interface is a trunk interface. That "regardless" is the point of typing it: it takes [[cs/cisco/trunking-and-802-1q|DTP negotiation]] off the table for that port.

> [!warning] `switchport access vlan` will invent a VLAN for you
> Cisco states it plainly: if you assign an interface to a VLAN that does not exist, the new VLAN is created. Typing `switchport access vlan 210` when you meant `21` does not throw an error and does not leave the port in VLAN 21. It silently creates VLAN 210, moves the port into it, and hands you a port that is up, up, and completely alone in a broadcast domain of one. The symptom reads like a cabling or DHCP fault. The fix is `show vlan`, where the phantom VLAN will be sitting there with exactly one member port.

Creating a VLAN deliberately looks like this, and the naming is worth the extra line because the default name is unhelpful:

```
Switch# configure terminal
Switch(config)# vlan 20
Switch(config-vlan)# name test20
Switch(config-vlan)# end
```

If no name is entered for the VLAN, the default is to append the vlan-id with leading zeros to the word VLAN, so VLAN 4 becomes `VLAN0004`. A wall of `VLAN00xx` entries in `show vlan` tells you every VLAN on that box was created as a side effect of something else.

## Where VLAN configuration actually lives

This one surprises people who have internalized [[cs/cisco/running-vs-startup-config|running config versus startup config]] and assume it covers everything. Configurations for VLAN IDs 1 to 1005 are written to the file `vlan.dat`, the VLAN database, and you display them by entering the `show vlan` privileged EXEC command. The `vlan.dat` file is stored in flash memory, separate from the startup configuration.

So a config backup that captures only `show running-config` does not capture your normal-range VLAN definitions. The port-to-VLAN assignments are in the running config, because you use interface configuration mode to define the port membership mode and to add and remove ports from VLANs, and the results of those commands are written to the running-configuration file. The VLAN *definitions* are somewhere else. Restoring a switch from a text config alone can therefore leave you with `switchport access vlan 30` on forty ports and no VLAN 30.

Cisco also warns that you can cause inconsistency in the VLAN database if you attempt to manually delete the `vlan.dat` file. Deleting it to "start clean" is a documented way to make things worse.

Extended-range VLANs behave differently again. With VTP version 1 or 2, extended-range VLAN configurations are not stored in the VLAN database, but because VTP mode is transparent, they are stored in the switch running configuration file. Same switch, two storage models, split at VLAN 1005.

## VLAN 1 and the management VLAN

VLAN 1 is where everything lands if you never make a decision. It is the default VLAN for access ports and the default native VLAN for 802.1Q trunks. Cisco's note is direct: VLAN 1 is the default VLAN on all trunk ports in all Cisco switches, and it has previously been a requirement that VLAN 1 always be enabled on every trunk link.

That default has a cost, and Cisco's STP troubleshooting guidance names it. A Cisco switch typically has a single IP address that binds to a VLAN, known as the administrative VLAN, and in this VLAN the switch behaves like a generic IP host, where every broadcast or multicast packet is forwarded to the CPU. A high rate of broadcast or multicast traffic on the administrative VLAN can adversely impact the CPU and the CPU ability to process vital BPDUs. So user broadcast traffic sharing the management VLAN is not merely untidy, it competes with the control plane that keeps the topology loop-free.

The same document adds the structural version of the warning: VLAN 1 generally serves as an administrative VLAN, where all switches are accessible in the same IP subnet, and though useful, this setup can be dangerous because a bridging loop on VLAN 1 affects all trunks, which can bring down the whole network. Cisco's own conclusion is that the problem exists no matter which VLAN you use, and the real fix is to segment the bridging domains with high-speed Layer 3 switches.

Two concrete moves follow from that. First, put the management address on a VLAN you chose, not the one you inherited. That is an SVI:

```
Switch(config)# interface vlan 99
Switch(config-if)# ip address 10.0.99.5 255.255.255.0
Switch(config-if)# exit
Switch(config)# ip default-gateway 10.0.99.1
```

The `ip default-gateway` line matters on a switch that is not routing. Cisco notes that when your switch is configured to route with IP, it does not need to have a default gateway set, which is the flip side: if it is not routing, and you skip that line, your management SVI is reachable only from its own subnet. That is a classic "I can ping it from the closet but not from the NOC" fault.

Second, take VLAN 1 off the trunks that do not need it. Cisco calls this VLAN 1 minimization: you can disable VLAN 1 on any individual VLAN trunk link so that no user traffic, including spanning-tree advertisements, is sent or received on VLAN 1, and doing so reduces the risk of spanning-tree loops or storms. There is a caveat worth knowing before you do it: when you remove VLAN 1 from a trunk port, the interface continues to send and receive management traffic, for example CDP, PAgP, LACP, DTP, and VTP in VLAN 1. The control protocols keep working. Only user traffic goes away.

> [!example] Reading a switch you did not build
> ```
> Switch# show vlan
> ```
> Three things to look for before anything else. VLANs named `VLAN00xx` were created by accident, probably by a mistyped `switchport access vlan`. A VLAN with exactly one member port is either a phantom or a stranded host. And whichever VLAN carries the SVI holding the management IP is your administrative VLAN, so check what else is in it. If the answer is "every user port on the switch," you have found a real problem, not a style complaint.

## Related Notes

- [[cs/cisco/trunking-and-802-1q|Trunking and 802.1Q]] - how these VLANs get from one switch to the next
- [[cs/cisco/spanning-tree-protocol|Spanning Tree Protocol]] - the per-VLAN loop-prevention instance each VLAN carries
- [[cs/networking/vlans-and-802-1q-trunking|VLANs and 802.1Q Trunking]] - the vendor-neutral protocol note, tag format and all
- [[cs/cisco/running-vs-startup-config|Running vs Startup Config]] - and why the VLAN database is not covered by either
- [[cs/cisco/ios-cli-modes|IOS CLI Modes]] - the `(config-vlan)` and `(config-if)` modes these commands live in
- [[cs/networking/ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the layer-3 half of the same design decision
- [[cs/security/arp-spoofing-and-lan-attacks|ARP Spoofing and LAN Attacks]] - what an attacker does inside a broadcast domain you left too large

## Sources

- "Configuring VLANs," Catalyst 2960 and 2960-S Switch Software Configuration Guide, Cisco IOS Release 12.2(55)SE. https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/12-2_55_se/configuration/guide/scg_2960/swvlan.pdf . Backs the VLAN definition, per-VLAN flooding scope, the routing requirement between VLANs, the 1 to 4094 range and 1002 to 1005 reservation, static-access port semantics, `switchport mode access` / `switchport access vlan`, VLAN auto-creation on assignment, `vlan` / `name` and the default `VLANxxxx` name, the `vlan.dat` VLAN database and `show vlan`, the warning about deleting `vlan.dat`, extended-range VLAN storage, default access and native VLAN of 1, and VLAN 1 minimization including which protocols keep using VLAN 1.
- "Assigning the Switch IP Address and Default Gateway," Catalyst 2960 and 2960-S Switch Software Configuration Guide, Cisco IOS Release 12.2(55)SE. https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/12-2_55_se/configuration/guide/scg_2960/swipaddr.pdf . Backs the `interface vlan` / `ip address` / `ip default-gateway` management SVI sequence and the note that a switch configured to route with IP does not need a default gateway set.
- "Troubleshoot STP Problems and Related Design Considerations," Cisco. https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10556-16.html . Backs the administrative VLAN behaving as a generic IP host, broadcast and multicast on it reaching the CPU and impairing BPDU processing, the advice to keep user traffic off it, and the VLAN 1 bridging-loop hazard across all trunks.
