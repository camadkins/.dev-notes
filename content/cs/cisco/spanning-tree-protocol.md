---
title: Spanning Tree Protocol
description: "Why a layer-2 loop takes a network down in seconds, how the root bridge is elected and why the default election picks the wrong switch, the port states, and what RSTP changed."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-02-19
updated:
aliases:
  - STP
  - RSTP
  - root bridge
  - spanning-tree vlan root primary
---

An IP packet caught in a routing loop dies when its TTL hits zero. [[cs/standards/ieee-802-3-ethernet|An Ethernet frame]] has no TTL. That single missing field is why a layer-2 loop is a different category of problem from a layer-3 one, and why an entire protocol exists to prevent physical redundancy from turning into an outage.

Cisco's statement of the requirement is short: for a Layer 2 Ethernet network to function properly, only one active path can exist between any two stations, and multiple active paths among end stations cause loops in the network. The consequences it names are the two failure modes you will actually observe. End stations might receive duplicate messages, and switches might also learn end-station MAC addresses on multiple Layer 2 interfaces. Cisco's summary: these conditions result in an unstable network.

> [!note] The idea
> STP does not detect loops and break them. It computes, in advance, a single loop-free tree over a graph that may contain loops, and holds every link outside that tree in a blocking state as standing reserve. Cisco puts it as: spanning tree forces redundant data paths into a standby (blocked) state, and if a network segment in the spanning tree fails and a redundant path exists, the spanning-tree algorithm recalculates the topology and activates the standby path. The consequence people miss is where the danger actually lives. Cisco's troubleshooting guidance: a bridging loop in an STP environment still comes from a port that can block, but instead forwards traffic. Nearly every real STP incident is a blocking port that stopped hearing BPDUs, not a bug in the algorithm.

## Why the failure is so violent

The MAC address table is what makes the loop compound. A switch learns source addresses from frames it receives, so a looping frame teaches every switch on the path that the same host lives out multiple ports, and each switch keeps relearning. Meanwhile [[cs/networking/multicast-broadcast-anycast|broadcast and unknown-unicast frames are flooded]], which is why a loop saturates links rather than merely degrading them. Cisco's troubleshooting document does not hedge: bridging loops have extremely severe consequences on a bridge network, and administrators generally do not have time to look for the cause of the loop and prefer to restore connectivity as soon as possible.

The recommended emergency action is blunt and worth having pre-decided, because you will not be able to reason during it. Cisco's advice is to manually disable every port that provides redundancy in the network, beginning in the area affected most, or if possible to initially disable ports that can be blocking, checking connectivity after each one. Two operational realities are folded into that. First, during a bridging loop you probably cannot make a remote connection, so console access is the assumption. Second, you seldom maintain connectivity to a syslog server when a loop occurs, so the logs you want are the ones already off the box.

There is a corollary that decides an argument you will eventually have with someone: even if you have succeeded with the removal of all the blocked ports from your network and you do not have any physical redundancy, do not disable STP. Cisco's reasoning is cost versus risk. STP is generally not very processor-intensive, packet switching does not involve the CPU in most Cisco switches, and the few BPDUs sent on each link do not significantly reduce the available bandwidth. But a bridge network without STP can melt down in a fraction of a second if an operator makes an error on a patch panel.

## Root bridge election, and why the default is wrong

Every switch starts by assuming it is the root. When the switches in a network are powered up, each functions as the root switch, and each sends a configuration BPDU through all of its ports. Those BPDUs carry the sending switch's view of the root, the path cost to the root, the sender's own bridge ID, message age, the sending interface identifier, and the hello, forward delay, and max-age timer values.

The comparison rule is simple, and its default is the problem. For each VLAN, the switch with the highest switch priority (the lowest numerical priority value) is elected as the root switch. If all switches are configured with the default priority (32768), the switch with the lowest MAC address in the VLAN becomes the root switch.

Read that again with an inventory in mind. [[cs/networking/arp-and-mac-addressing|MAC addresses are assigned roughly in manufacturing order]], so "lowest MAC address" tends to mean "oldest switch." Left alone, a network elects its most ancient, slowest, most peripheral box as the logical center of the topology. Cisco says the correct answer directly: the root switch for each spanning-tree instance should be a backbone or distribution switch, and you should not configure an access switch as the spanning-tree primary root.

Fix it explicitly rather than by tuning priority values by hand:

```
Switch(config)# spanning-tree vlan 10 root primary
Switch(config)# spanning-tree vlan 10 root secondary
```

The secondary command is the useful half of the pair to understand. When you configure a switch as the secondary root, the switch priority is modified from the default value (32768) to 28672, and the switch is then likely to become the root switch for the specified VLAN if the primary root switch fails, assuming the other network switches use the default priority of 32768 and are therefore unlikely to become the root. Run `root primary` on the distribution switch you want and `root secondary` on its peer, and the election outcome stops depending on manufacturing dates.

The bridge ID itself is 8 bytes per VLAN, where the 2 most-significant bytes are used for the switch priority and the remaining 6 bytes are derived from the switch MAC address. With the IEEE 802.1t extensions the switch supports, the 2 bytes previously used for the switch priority are reallocated into a 4-bit priority value and a 12-bit extended system ID value equal to the VLAN ID. That is why configured priorities move in increments of 4096: only 4 bits are yours.

Once a root exists, each remaining switch picks a root port, the port providing the best (lowest cost) path to the root switch, and each segment gets a designated port on the switch that incurs the lowest path cost when forwarding packets from that LAN to the root. Ties break down a fixed ladder: lowest root bridge ID, then lowest path cost to the root switch, then lowest designated bridge ID, then lowest designated path cost, then lowest port ID. Everything left over is blocked. All paths that are not needed to reach the root switch from anywhere in the switched network are placed in the spanning-tree blocking mode.

## Port states, and the 30 seconds they cost

[[cs/standards/ieee-802-1d-and-spanning-tree|Classic 802.1D]] defines five interface states:

| State | What the interface is doing |
|---|---|
| Blocking | Does not participate in frame forwarding |
| Listening | First transitional state after blocking, when spanning tree decides the interface should participate in frame forwarding |
| Learning | Prepares to participate in frame forwarding |
| Forwarding | Forwards frames |
| Disabled | Not participating because of a shutdown port, no link, or no spanning-tree instance running on the port |

The transitions are gated by a timer, not by a handshake. While spanning tree waits for the forward-delay timer to expire, it moves the interface to the learning state and resets the forward-delay timer, and in the learning state the interface continues to block frame forwarding as the switch learns end-station location information for the forwarding database. When the forward-delay timer expires, spanning tree moves the interface to the forwarding state.

The defaults are hello time 2 seconds, forward-delay time 15 seconds, and maximum-aging time 20 seconds. Two forward delays at 15 seconds each is where the familiar 30-second port startup comes from. RSTP's own documentation names the cost of that design: twice the forward delay must elapse before a new link ends up in the forwarding state, which means 30 seconds of disruption of traffic, because the 802.1D algorithm lacks a feedback mechanism to clearly advertise that the network converges in a matter of seconds.

That delay is exactly what [[cs/cisco/portfast-and-bpdu-guard|PortFast]] exists to skip on host-facing ports.

## RSTP: roles decoupled from states

RSTP (IEEE 802.1w) is described by Cisco as an evolution of the 802.1D standard more than a revolution. The 802.1D terminology remains primarily the same and most parameters have been left unchanged. Three changes carry the weight.

**Three states instead of five.** The 802.1D disabled, blocking, and listening states are merged into a unique 802.1w discarding state, leaving discarding, learning, and forwarding. The motivation is a real modeling flaw in the old scheme: from an operational point of view there is no difference between a port in the blocking state and a port in the listening state, since both discard frames and do not learn MAC addresses, and the real difference is in the role the spanning tree assigns to the port. RSTP decouples the role and the state of a port to address this issue.

**Roles get names.** The root port and designated port roles remain, while the blocking port role is split into the backup and alternate port roles. An alternate port receives more useful BPDUs from another bridge and is blocked; a backup port receives more useful BPDUs from the same bridge it is on and is blocked. The distinction is not cosmetic. An alternate port provides an alternate path to the root bridge and therefore can replace the root port if it fails, while a backup port provides redundant connectivity to the same segment and cannot guarantee an alternate connectivity to the root bridge. That is why RSTP can promote an alternate port immediately: when a bridge loses its root port, it can put its best alternate port directly into the forwarding mode.

**BPDUs become keepalives.** With 802.1D a non-root bridge only generates BPDUs when it receives one on the root port, so a bridge relays BPDUs more than it actually generates them. Under RSTP a bridge sends a BPDU with its current information every hello-time seconds (2 by default), even if it does not receive any from the root bridge. And on a given port, if hellos are not received three consecutive times, protocol information can be immediately aged out. A bridge considers that it loses connectivity to its direct neighbor root or designated bridge if it misses three BPDUs in a row.

Convergence then runs on a handshake rather than a clock. When a designated port is in a discarding or learning state, it sets the proposal bit on the BPDUs it sends out; the receiving switch performs a *sync*, blocking its non-edge designated ports, and replies with an agreement, a copy of the proposal BPDU with the agreement bit set instead. Once the proposing port receives that agreement it can immediately transition to the forwarding state. The wave propagates outward. Cisco's assessment: the proposal agreement mechanism is very fast, as it does not rely on any timers, and RSTP can achieve much faster convergence in a properly configured network, sometimes in the order of a few hundred milliseconds.

> [!warning] Rapid convergence has two prerequisites, and one is a duplex setting
> RSTP can only achieve rapid transition to the forwarding state on edge ports and on point-to-point links, and the link type is automatically derived from the duplex mode of a port. A port that operates in full-duplex is assumed to be point-to-point, while a half-duplex port is considered as a shared port by default. So a link that lands at half duplex through a negotiation failure does not merely run slower, it silently opts out of rapid convergence and falls back to the traditional listening-learning sequence. If a designated discarding port does not receive an agreement after it sends a proposal, it slowly transitions to the forwarding state and falls back to the traditional 802.1D listening-learning sequence.

Enable it with the mode command. The switch supports three spanning-tree modes, PVST+, rapid PVST+, or MSTP, and by default the switch runs the PVST+ protocol:

```
Switch(config)# spanning-tree mode rapid-pvst
Switch(config-if)# spanning-tree link-type point-to-point
Switch# clear spanning-tree detected-protocols
```

The last two are Cisco's recommendations for rapid-PVST+ mode specifically. `spanning-tree link-type point-to-point` specifies the link type for the port, and `clear spanning-tree detected-protocols` restarts the protocol migration process on the entire switch if any port is connected to a port on a legacy IEEE 802.1D switch.

Interoperation costs you the benefit. RSTP is able to interoperate with legacy STP protocols, but the inherent fast convergence benefits of 802.1w are lost when it interacts with legacy bridges. There is a stickiness problem too: once a port has fallen back to 802.1D mode for a legacy neighbor, removing that neighbor does not restore RSTP mode automatically, because the bridge does not know the legacy bridge was removed, and user intervention is required in order to restart the protocol detection of the port manually. That is what `clear spanning-tree detected-protocols` is for.

## What actually breaks it

Cisco's troubleshooting document is explicit that most STP failures relate to a massive loss of BPDUs, and that the loss causes blocked ports to transition to forwarding mode. Three specific causes are named.

**Duplex mismatch.** If you manually set the duplex mode to Full on one side of the link and leave the other side in auto-negotiation mode, the link ends up in half-duplex, because a port with duplex mode set to Full no longer negotiates. Cisco walks the resulting failure: with enough traffic from the full-duplex side, every packet the half-duplex side sends, which includes the BPDUs, undergoes deferment or collision and eventually gets dropped, so the peer loses the root bridge and unblocks a port, which creates the loop. Check both ends with `show interfaces status`.

**Unidirectional links.** Cisco calls these a common cause of a bridging loop, typically from an undetected fiber failure or a transceiver problem. The failure is nastier than a duplex mismatch because a reboot does not help: a port can only block if it receives BPDUs from a bridge that has a higher priority, so if all the BPDUs from the far end are lost, the blocked port eventually transitions to forwarding and forwards traffic. Cisco's recommendation is direct: run UDLD wherever possible in a bridged environment, since UniDirectional Link Detection can detect improper cabling or unidirectional links on Layer 2 and automatically break resulting loops by disabling some ports.

**Aggressively tuned timers.** The conservative defaults are load-bearing. A blocking port needs to miss BPDUs for 50 seconds before the transition to forwarding, and the successful transmission of a single BPDU breaks the loop, which is why packet corruption rarely causes this in practice. Cisco notes this case commonly occurs with the careless adjustment of STP parameters, giving max-age reduction as the example. The conservative default values for the STP timers also impose a maximum network diameter of seven, so two distinct bridges cannot be more than seven hops away from each other.

> [!example] The three commands for "is spanning tree healthy here"
> ```
> Switch# show spanning-tree vlan 10 detail
> Switch# show interfaces status
> Switch# show processes cpu
> ```
> The first has a BPDU field showing the number of BPDUs received for each interface, and Cisco's method is to issue the command an additional one or two times to determine if the device receives BPDUs. Do this on blocked ports and root ports specifically, because those are the critical ports to investigate first. The second checks the speed and duplex status of the specific port, on *both* sides of the link. The third exists because a high CPU utilization can be dangerous for a system that runs the spanning-tree algorithm, and a switch too busy to originate BPDUs looks, from every neighbor's perspective, exactly like a switch that is gone.

## Related Notes

- [[cs/cisco/portfast-and-bpdu-guard|PortFast and BPDU Guard]] - skipping the 30-second wait on host ports, and the guard that makes it safe
- [[cs/cisco/trunking-and-802-1q|Trunking and 802.1Q]] - the native VLAN mismatch that produces spanning-tree loops
- [[cs/cisco/vlans-and-vlan-design|VLANs and VLAN Design]] - each VLAN carries its own spanning-tree instance
- [[cs/cisco/etherchannel-and-lacp|EtherChannel and LACP]] - bundling links so spanning tree sees one logical port instead of blocking one
- [[cs/cisco/show-and-debug-methodology|Show and Debug Methodology]] - the discipline behind the verification commands above
- [[cs/networking/arp-and-mac-addressing|ARP and MAC Addressing]] - the address table a loop destabilizes

## Sources

- "Configuring STP," Catalyst 2960 and 2960-S Switch Software Configuration Guide, Cisco IOS Release 12.2(55)SE. https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/12-2_55_se/configuration/guide/scg_2960/swstp.pdf . Backs the single-active-path requirement and the duplicate-message and multi-interface-MAC-learning consequences, redundant paths forced to standby, the initial all-switches-are-root BPDU exchange and BPDU contents, the priority and lowest-MAC election rule with the 32768 default, the 8-byte bridge ID split and the 802.1t 4-bit priority plus 12-bit extended system ID, root port and designated port selection and the tiebreak ladder, the five 802.1D port states with descriptions, the forward-delay-driven transition sequence, the hello 2 / forward-delay 15 / max-age 20 defaults, `spanning-tree vlan vlan-id root primary` and `root secondary` with the 28672 priority, the guidance against making an access switch the primary root, and `spanning-tree mode {pvst | mst | rapid-pvst}` with PVST+ as the default plus the `spanning-tree link-type point-to-point` and `clear spanning-tree detected-protocols` recommendations.
- "Understand Rapid Spanning Tree Protocol (802.1w)," Cisco. https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/24062-146.html . Backs RSTP as an evolution of 802.1D, the merge of disabled/blocking/listening into discarding, the operational-equivalence argument and role/state decoupling, alternate versus backup port roles and immediate alternate-port promotion, per-hello BPDU origination and three-missed-BPDU aging, the proposal/agreement sync handshake and its timer independence, the few-hundred-milliseconds convergence claim, the 30-second 802.1D disruption figure, edge-port and point-to-point prerequisites with link type derived from duplex, the fallback to listening-learning when no agreement arrives, and the loss of fast convergence plus manual protocol-detection restart when interoperating with legacy bridges.
- "Troubleshoot STP Problems and Related Design Considerations," Cisco. https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/10556-16.html . Backs loops coming from a port that can block but instead forwards, the severity of bridging loops and the disable-redundant-ports emergency procedure, the loss of remote and syslog connectivity during a loop, the argument against disabling STP even without redundancy, the duplex mismatch failure chain, unidirectional links and the UDLD recommendation, the 50-second BPDU-loss threshold and the max-age tuning hazard, the seven-hop diameter limit, and the `show spanning-tree vlan detail` BPDU field, `show interfaces status`, and `show processes cpu` checks.
