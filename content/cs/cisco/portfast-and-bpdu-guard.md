---
title: PortFast and BPDU Guard
description: "PortFast skips the listening and learning states on host ports and stops them generating topology changes. BPDU guard is what makes that safe, and the two belong together."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-03-21
updated:
aliases:
  - spanning-tree portfast
  - spanning-tree bpduguard enable
  - errdisable recovery cause bpduguard
  - edge port
---

Somebody reboots a workstation and it comes up with no address. The switch port is up. The cable is fine. [[cs/networking/dhcp-and-address-assignment|DHCP]] works everywhere else. What happened is that the port spent half a minute in [[spanning-tree-protocol|spanning tree]] states that discard frames while the client's DHCP attempts expired into nothing.

Cisco's framing of the tradeoff: every port that comes up normally walks through the STP states, listening, learning, and finally forwarding, before it passes user traffic, and that convergence delay, roughly 30 seconds with [[cs/standards/ieee-802-1d-and-spanning-tree|traditional 802.1D]], is appropriate for switch-to-switch links but unnecessary for ports connected to end hosts such as PCs, servers, or printers, which cannot create a switching loop on their own.

> [!note] The idea
> PortFast is usually explained as a speed feature, and the second half of what it does is the more interesting half. Beyond skipping the wait, neither edge ports nor PortFast-enabled ports generate topology changes when the link toggles. Without it, every laptop that sleeps, every phone that reboots, every printer that power-cycles emits a topology change into the spanning tree, and topology changes flush MAC address tables across the domain. So PortFast is as much about keeping user churn out of the control plane as it is about DHCP timing. That is also why it must be paired with BPDU guard: you have told the switch to stop treating this port as part of the topology, so you had better be certain nothing topology-shaped is plugged into it.

## What PortFast actually skips

PortFast immediately transitions an access or trunk port from the blocking state directly to the forwarding state, skipping the listening and learning phases. Cisco's configuration guide says the same in the other direction: an interface with the Port Fast feature enabled is moved directly to the spanning-tree forwarding state without waiting for the standard forward-time delay.

The scope condition is explicit and narrow. Because the purpose of Port Fast is to minimize the time interfaces must wait for spanning tree to converge, it is effective only when used on interfaces connected to end stations, and if you enable Port Fast on an interface connecting to another switch, you risk creating a spanning-tree loop. It is important for hosts that expect immediate network access, for example workstations using DHCP at boot.

Under [[spanning-tree-protocol|RSTP]] this is not a Cisco extension bolted onto the standard, it is the standard. The edge port concept basically corresponds to the PortFast feature: all ports directly connected to end stations cannot create bridge loops in the network, so the edge port directly transitions to the forwarding state and skips the listening and learning stages. Cisco kept the keyword deliberately, maintaining that the PortFast keyword be used for edge port configuration to make the transition to RSTP simpler.

RSTP adds a self-defense that classic PortFast lacks: an edge port that receives a BPDU immediately loses edge port status and becomes a normal spanning tree port. That is degradation, not enforcement. It protects the topology; it does nothing to tell you a rogue switch appeared, and it leaves the offending device on the network.

One boot-time nuance worth knowing before you rely on PortFast for a critical host: an interface with Port Fast enabled goes through the normal cycle of spanning-tree status changes when the switch is restarted. The fast path is for the port coming up, not for the box coming up.

## Why it is dangerous alone

The loop PortFast can create is small, brief, and capable of taking a network down. Cisco's troubleshooting document walks the exact sequence. A bridge has port p1 already forwarding, port p2 has a PortFast configuration, and a hub is on the far side. As soon as you plug the second cable in, port p2 goes to forwarding mode and creates a loop between p1 and p2.

Then comes the part people underestimate. The loop stops as soon as p1 or p2 receives a BPDU that puts one of these two ports in blocking mode, but if the looped traffic is very intensive, the bridge can have trouble with the successful transmission of the BPDU that stops the loop. Cisco's conclusion: this problem can delay the convergence considerably or bring down the network in extreme cases. The mechanism that is supposed to end the loop is carried on the medium the loop has saturated.

The configuration guide's caution matches: enabling this feature on an interface connected to a switch or hub could prevent spanning tree from detecting and disabling loops in your network, which could cause broadcast storms and address-learning problems.

> [!warning] Voice VLAN turns PortFast on and does not turn it back off
> From the Cisco configuration guide: if you enable the voice VLAN feature, the Port Fast feature is automatically enabled, and when you disable voice VLAN, the Port Fast feature is not automatically disabled. Repurpose an old phone port as a switch uplink, remove the voice VLAN config, and you have left PortFast enabled on an interswitch link without ever typing the command. Check `show spanning-tree interface interface-id portfast` on any port whose role is changing, rather than only the ports you configured by hand.

## BPDU guard: the assumption made enforceable

BPDU guard exists to hold PortFast's premise to account. Interfaces connected to a single workstation or server should not receive bridge protocol data units. Cisco names the two readings when they do arrive anyway: someone has connected an unauthorized switch, or a device is running software that emulates a bridge. Either case can destabilize the topology, particularly if the rogue device advertises a superior bridge ID and forces a root bridge election it must never participate in.

The documented real-world case is worth carrying around, because it explains why this is a security control and not a hygiene control. A user PC running a Linux-based bridging application was connected to an access port. Because the application sent BPDUs claiming a low bridge priority, the network elected the PC as the root bridge. This shifted the entire spanning-tree topology toward an underpowered host, congesting links and causing a network outage. In Cisco's worked version of the scenario, the application advertises a bridge priority of 0 and the high-speed Gigabit link between the two core switches transitions to blocking, forcing all VLAN traffic onto a slower 100-Mbps path until the switch begins dropping frames.

Note what the attacker needed: an access port and a laptop. No credentials, no exploit. Root bridge election has no authentication of any kind, which is the structural reason [[cs/standards/ieee-802-1x-port-based-access-control|a port-level guard]] is the only available answer.

When BPDU guard is enabled and the port receives a BPDU, the switch immediately shuts the port down by placing it in the errdisable state. Cisco's own summary of why shutdown rather than block: because the port is administratively disabled rather than simply blocked, a network operator's attention is drawn to the event, and the offending device is cleanly isolated until the issue is resolved. It provides a secure response to invalid configurations because you must manually put the interface back in service.

The log line looks like this:

```
2000 May 12 15:13:32 %SPANTREE-2-RX_PORTFAST:Received BPDU on PortFast enable port. Disabling 2/1
```

## Configuring the pair

Cisco's recommended approach is to enable PortFast and BPDU guard together on the host-facing access ports. Per interface:

```
CatSwitch-IOS(config-if)# spanning-tree portfast
CatSwitch-IOS(config-if)# spanning-tree bpduguard enable
```

Or globally, which is the version worth defaulting to:

```
CatSwitch-IOS(config)# spanning-tree portfast bpduguard default
```

With the global command, every port configured with PortFast automatically inherits BPDU Guard, so you do not need to set it on each interface individually. By default, the STP BPDU guard is disabled.

The global and per-interface forms are not the same feature with two entry points, and the difference matters. At the global level, spanning tree shuts down ports that are in a Port Fast-operational state if any BPDU is received on them. At the interface level, `spanning-tree bpduguard enable` enables BPDU guard on any port without also enabling the Port Fast feature, and when the port receives a BPDU it is put in the error-disabled state. So the interface command is the one to reach for when you want BPDU guard on a port that is not, and should not be, a PortFast port.

A few related commands round it out. `spanning-tree portfast default` globally enables the PortFast feature on all nontrunking ports. `spanning-tree portfast disable` turns it off on an interface. And on a trunk port, PortFast requires the keyword: to enable Port Fast on trunk ports you must use `spanning-tree portfast trunk`, because the plain `spanning-tree portfast` command will not work on trunk ports. Cisco attaches a caution to that one, to make sure there are no loops in the network between the trunk port and the workstation or server before you enable Port Fast on a trunk port.

## Recovery, and the decision it forces

A port placed in errdisable does not recover on its own unless errdisable recovery is configured. You either re-enable the interface manually with `shutdown` followed by `no shutdown`, or configure automatic recovery for the BPDU guard cause:

```
CatSwitch-IOS(config)# errdisable recovery cause bpduguard
CatSwitch-IOS(config)# errdisable recovery interval 400
```

The default timeout interval is 300 seconds, and by default the timeout feature is disabled.

That default is a deliberate choice by Cisco and deserves a deliberate choice by you. Manual recovery means an unauthorized switch stays isolated until a human looks at it, and it also means a legitimate device knocked offline by a transient stays offline until a human looks at it. Automatic recovery means the port comes back, which also means it comes back for the rogue switch, in a loop, every interval. Whichever you pick, pick it on purpose and write the interval down somewhere your on-call reads.

There is a middle option for the blast radius, if not the recovery. `errdisable detect cause bpduguard shutdown vlan` shuts down just the offending VLAN on the port where the violation occurred rather than the entire port, which is the difference between one VLAN and every VLAN on a port going dark.

> [!example] Confirming the guard is actually on
> ```
> CatSwitch-IOS# show spanning-tree summary totals
> Root bridge for: none.
> PortFast BPDU Guard is enabled
> UplinkFast is disabled
> BackboneFast is disabled
> ```
> That first line is a bonus check. `Root bridge for: none` on an access switch is correct and reassuring. If an access switch reports that it is root bridge for some VLAN, either your [[spanning-tree-protocol|root election]] was never configured or something has already won an election it should not have.

## Related Notes

- [[spanning-tree-protocol|Spanning Tree Protocol]] - the port states PortFast skips and the root election BPDU guard defends
- [[vlans-and-vlan-design|VLANs and VLAN Design]] - the access ports these commands belong on
- [[trunking-and-802-1q|Trunking and 802.1Q]] - and the trunk ports where the plain command silently does nothing
- [[arp-spoofing-and-lan-attacks|ARP Spoofing and LAN Attacks]] - the wider class of "attacker has an access port" problems
- [[show-and-debug-methodology|Show and Debug Methodology]] - reading `show spanning-tree` output with intent
- [[denial-of-service-and-ddos|Denial of Service and DDoS]] - a rogue root bridge is a denial of service with no packets sent at the victim

## Sources

- "Understand Spanning Tree PortFast and BPDU Guard Features," Cisco. https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10586-65.html . Backs the roughly 30-second 802.1D convergence delay and why it is unnecessary for end hosts, PortFast transitioning from blocking directly to forwarding while skipping listening and learning, the DHCP-at-boot motivation, the two readings of an unexpected BPDU, the Linux-bridge root-hijack incident and its worked topology with bridge priority 0 and the Gigabit-to-100Mbps failure, immediate errdisable on BPDU receipt and the rationale for shutdown over blocking, the `%SPANTREE-2-RX_PORTFAST` log line, the per-interface `spanning-tree portfast` plus `spanning-tree bpduguard enable` pairing, the global `spanning-tree portfast bpduguard default` and its inheritance behavior, BPDU guard being disabled by default, manual `shutdown`/`no shutdown` recovery, `errdisable recovery cause bpduguard` and `errdisable recovery interval`, the 300-second default interval with the timeout feature disabled by default, and the `show spanning-tree summary totals` verification output.
- "Configuring Optional Spanning-Tree Features," Catalyst 2960 and 2960-S Switch Software Configuration Guide, Cisco IOS Release 12.2(55)SE. https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/12-2_55_se/configuration/guide/scg_2960/swstpopt.pdf . Backs PortFast bypassing listening and learning without waiting for the forward-time delay, interfaces connected to a single workstation or server not receiving BPDUs, the loop risk of enabling PortFast toward another switch, the broadcast-storm and address-learning caution, the normal status cycle on switch restart, the global versus interface-level BPDU guard difference, `errdisable detect cause bpduguard shutdown vlan`, `spanning-tree portfast trunk` being required on trunk ports, `spanning-tree portfast default`, `spanning-tree portfast disable`, and the voice VLAN auto-enable that is not auto-disabled.
- "Troubleshoot STP Problems and Related Design Considerations," Cisco. https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10556-16.html . Backs the p1/p2 hub scenario producing a transient loop and the observation that intensive looped traffic can prevent transmission of the BPDU that would stop it, delaying convergence or bringing down the network.
- "Understand Rapid Spanning Tree Protocol (802.1w)," Cisco. https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/24062-146.html . Backs the edge port concept corresponding to PortFast, edge ports transitioning directly to forwarding while skipping listening and learning, edge and PortFast ports not generating topology changes when the link toggles, an edge port losing edge status on receiving a BPDU, and Cisco retaining the PortFast keyword for edge port configuration.
