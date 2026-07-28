---
title: HSRP, VRRP, and First-Hop Redundancy
description: "The default gateway is the one hop a host cannot reroute around. How a virtual IP and virtual MAC hide the failover, why preemption is off until you ask for it on HSRP, and what interface tracking is really doing."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-07-02
updated:
aliases:
  - HSRP
  - VRRP
  - first hop redundancy
  - standby preempt
  - virtual MAC
---

Build a network with two of everything and a host still has exactly one way off its own subnet. RFC 5798 states the problem without hedging: the use of a statically configured default route is quite popular, it minimizes configuration and processing overhead on the end-host, and is supported by virtually every IPv4 implementation. Then the cost. However, this creates a single point of failure. Loss of the default router results in a catastrophic event, isolating all end-hosts that are unable to detect any alternate path that may be available.

Note the shape of that failure. The alternate path exists. The host cannot use it, because the host is not running a routing protocol and has no way to learn that its one configured next hop is gone.

> [!note] The idea
> A first-hop redundancy protocol does not make hosts smarter, it makes the gateway a fiction. The routers elect one of themselves to own a virtual IP address and a virtual MAC address, and forward for it. RFC 5798: VRRP specifies an election protocol that dynamically assigns responsibility for a virtual router to one of the VRRP routers on a LAN, and the election process provides dynamic failover in the forwarding responsibility should the Master become unavailable. The non-obvious half is the MAC. A host that has already ARPed for its gateway has cached a MAC address, and unless that MAC moves with the role, the host keeps sending frames to a dead box until its ARP cache expires. So the virtual MAC is the thing that actually makes the failover invisible, and the virtual IP is only what the host was configured with.

## The virtual MAC, and why it is a spec-level constant

VRRP does not invent an address. RFC 5798 defines the format directly.

| Family | Virtual router MAC |
|---|---|
| IPv4 | `00-00-5E-00-01-{VRID}` |
| IPv6 | `00-00-5E-00-02-{VRID}` |

The first three octets are derived from IANA's Organizational Unique Identifier, the next two octets indicate the address block assigned to VRRP for that protocol, and `{VRID}` is the VRRP Virtual Router Identifier. That layout is why the RFC notes this mapping provides for up to 255 VRRP routers on a network per family. The VRID is more than a group label. It is a byte of the MAC address.

There is a subtlety in how the master uses it. VRRP packets are transmitted with the virtual router MAC address as the source MAC address to ensure that learning bridges correctly determine the LAN segment the virtual router is attached to. The switch's CAM table has to learn the virtual MAC on the right port, and the only way it can is if the advertisements themselves are sourced from it.

HSRP does the same thing with its own vendor range. In Cisco's `show standby` output the line reads `Virtual mac address is 0000.0c07.ac01` for standby group 1, and the group number lands in the last byte the same way the VRID does.

## HSRP: active, standby, and the command everyone forgets

Cisco's minimum viable configuration is two lines on the LAN interface:

```
R1(config-if)# standby 1 ip 172.16.6.100
R1(config-if)# standby 1 priority 105
R1(config-if)# standby 1 preempt
```

The first assigns a standby group and standby IP address, which is what the hosts get as their default gateway. The second assigns a priority, and Cisco notes the default is 100. The third is the one that decides whether your design works.

> [!warning] Without `standby preempt`, priority does nothing after the first election
> Cisco's annotation on the command is unusually direct: if you do not use the `standby preempt` command in the configuration for a router, that router does not become the active router, even if the priority is higher than all other routers.
>
> Read that in the context of a maintenance window. You reload the router you intended to be active. Its peer takes over correctly. The primary comes back with priority 105 against a standby at 100, and stays standby, because nothing authorizes it to take the role back. Your traffic now runs through the box you sized for backup, and no alarm fires because both routers are healthy.
>
> Cisco says the same thing from the other direction in its worked failover: if `standby preempt` is not configured on R2, R2 would not have sent a Coup message to R1, which causes R2 to become active, and instead R1 would have remained the active router.

The election itself is priority first, address second: priority is determined first by the configured priority value, then by the IP address, and in each case a higher value is of greater priority. The transitions are message-driven, not timer-driven. When a higher priority router preempts a lower priority router, the router sends a Coup message, and when a lower priority active router receives a Coup message or a hello message from an active, higher priority router, the router changes to the Speak state and sends a resign message.

Both routers do not need the virtual address configured. In Cisco's example R2 carries a bare `standby 1 ip` with no address, which is a valid configuration: when R1 and R2 exchange HSRP hellos, R2 learns the standby IP address from R1. Configuring the same address explicitly on both is also valid, and is what most people should do, because it makes the intent readable in the config.

## Tracking: failing over on a problem the LAN cannot see

The gap in a plain HSRP or VRRP setup is that the election only watches the LAN interface. A router whose *uplink* has failed is still perfectly healthy on the segment, still sending hellos, still active, and now a black hole.

`standby track` closes it. The command allows you to specify another interface on the router for the HSRP process to monitor in order to alter the HSRP priority for a given group, and if the line protocol of the specified interface goes down, the HSRP priority is reduced, which means that another HSRP router with higher priority can become the active router if that router has `standby preempt` enabled. The default decrement is 10.

```
R1(config-if)# standby 1 track Serial0
```

The arithmetic is what you have to design around, and it is easy to get wrong by one.

> [!example] Cisco's worked failover, with the numbers
> R1 is configured with priority 105 and tracks Serial0. R2 takes the default priority 100. Both have preempt. Steady state, `show standby` on R1 reads:
> ```
> Ethernet0 - Group 1
>   Local state is Active, priority 105, may preempt
>   Hellotime 3 sec, holdtime 10 sec
>   Virtual IP address is 172.16.6.100 configured
>   Standby router is 172.16.6.6 expires in 8.428
>   Virtual mac address is 0000.0c07.ac01
>   Priority tracking 1 interface, 1 up:
>   Interface   Decrement    State
>   Serial0     10           Up
> ```
> Serial0 goes down. R1's priority is reduced by 10 to 95, and the output now reads `Local state is Standby, priority 95 (confgd 105)` with `Serial0 10 Down`. R2 at 100 is higher, and because R2 was configured for `standby preempt` at the time its priority became higher, R2 becomes the active router and R1 becomes standby. When Serial0 comes back up, R1's priority returns to 105 and R1 preempts and once again becomes the HSRP active router.
>
> The `(confgd 105)` field is the diagnostic worth memorizing. A configured priority that does not match the running priority means tracking has fired, and the `Priority tracking` block at the bottom names which interface did it. That single line separates "someone changed the config" from "an uplink is down" in about two seconds.
>
> Now the design trap. Cisco's second example configures priority 120 with two tracked interfaces at the default decrement of 10. One interface down leaves 110; both down leaves 100. Against a peer at the default 100, losing *both* uplinks does not trigger failover, because 100 is not greater than 100. Decrements must be sized against the peer's priority, not chosen for tidiness.

## VRRP: the same shape, different defaults

VRRP names the roles Master and Backup and standardizes the numbers.

Priority is an 8-bit field where higher values equal higher priority, and it carries three reserved meanings. The priority value for the VRRP router that owns the IPvX address associated with the virtual router MUST be 255. Routers backing up a virtual router MUST use priority values between 1 and 254, with a default of 100. And priority zero has special meaning, indicating that the current Master has stopped participating in VRRP, used to trigger Backup routers to quickly transition to Master without having to wait for the current Master to time out. A graceful shutdown is therefore explicit rather than inferred.

Preemption is the reverse of HSRP's default. Preempt_Mode controls whether a starting or restarting higher-priority Backup router preempts a lower-priority Master, and the default is True. There is a carve-out worth knowing: the router that owns the IPvX address associated with the virtual router always preempts, and RFC 5798's advice is blunt about the consequence. Routers with priority 255 will, as soon as they start up, preempt all lower-priority routers. No more than one router on the link is to be configured with priority 255, especially if preemption is set. And if no router has this priority, and preemption is disabled, then no preemption will occur.

The timers are derived rather than configured separately. The Maximum Advertisement Interval is a 12-bit field in centiseconds with a default of 100 centiseconds, that is 1 second. From it the backup computes:

```
Skew_Time            = ((256 - priority) * Master_Adver_Interval) / 256
Master_Down_Interval = (3 * Master_Adver_Interval) + Skew_Time
```

The skew term is a small piece of design elegance. A higher-priority backup gets a shorter skew and therefore declares the master down sooner, so when several backups are watching the same failure the most preferred one wins the race without needing a separate contention round.

One tuning note from the RFC that people usually learn the hard way: when there are multiple Backup routers, their priority values should be uniformly distributed, and if one Backup has the default 100 and another is added, a priority of 50 is a better choice than 99 or 100 in order to facilitate faster convergence. Adjacent priorities produce near-identical skew times, which is exactly the contention the skew was meant to avoid.

## What this actually buys, and what it does not

RFC 5798 is precise about the benefit, and it is worth quoting when someone proposes running a routing protocol on servers instead. For IPv4, the advantage gained from using VRRP is a higher-availability default path without requiring configuration of dynamic routing or router discovery protocols on every end-host. For IPv6 the pitch is different, a quicker switchover to Backup routers than can be obtained with standard IPv6 Neighbor Discovery mechanisms, because IPv6 Router Advertisements are multicast periodically at a rate that hosts learn about default routers in a few minutes, and they are not sent frequently enough to rely on the absence of the Router Advertisement to detect router failures.

What it does not buy is protection against anything past the first hop. Everything beyond the gateway is still the routing protocol's problem, which is why tracking exists at all: it is the seam where a first-hop redundancy protocol borrows a failure signal from the layer above it.

## Related Notes

- [[arp-and-mac-addressing|ARP and MAC Addressing]] - the cached gateway MAC that makes the virtual MAC necessary
- [[static-routing-and-administrative-distance|Static Routing and Administrative Distance]] - the host-side static default route this protocol protects
- [[ospf-fundamentals|OSPF Fundamentals]] - the routing protocol that handles everything past the first hop
- [[spanning-tree-protocol|Spanning Tree Protocol]] - the other place where an election with a bad default puts the wrong box in charge
- [[vlans-and-vlan-design|VLANs and VLAN Design]] - one HSRP or VRRP group per SVI, which is where group numbering discipline starts
- [[dhcp-and-address-assignment|DHCP and Address Assignment]] - how the virtual IP reaches the hosts as their default gateway

## Sources

- RFC 5798, "Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6," S. Nadas (ed.), March 2010. https://www.rfc-editor.org/rfc/rfc5798.txt . Backs the single-point-of-failure framing of the static default route, the definition of VRRP as an election protocol with Master forwarding for the virtual addresses, the IPv4 and IPv6 virtual MAC formats with their OUI and VRID derivation and the 255-router limit, the requirement that advertisements be sourced from the virtual MAC for learning bridges, the priority field semantics including 255 for the address owner, 1 to 254 for backups with a default of 100, and zero as a release signal, the Preempt_Mode default of True and the address-owner always-preempts exception, the priority-255 startup preemption warning and the no-preemption-if-none case, the Max Adver Int default of 100 centiseconds, the Skew_Time and Master_Down_Interval formulas, the uniform-priority-distribution recommendation with the 50-versus-99 example, and the stated IPv4 and IPv6 advantages including the Router Advertisement timing argument.
- "Use Standby Preempt and Standby Track Commands," Cisco (Doc ID 13780). https://www.cisco.com/c/en/us/support/docs/ip/hot-standby-router-protocol-hsrp/13780-6.html . Backs the behavior of `standby preempt` and the statement that a router without it never becomes active regardless of priority, the priority-then-IP-address election order, the Coup, hello, and resign messages and the Speak state transition, `standby <group> ip`, `standby <group> priority`, and `standby <group> track` syntax with the default priority of 100 and default track decrement of 10, the valid configuration where the standby router learns the virtual IP from hellos, the full `show standby` output including `Virtual mac address is 0000.0c07.ac01`, `Hellotime 3 sec, holdtime 10 sec`, the `priority 95 (confgd 105)` display and the `Priority tracking` block, the worked failover from 105 to 95 with R2 preempting at 100 and R1 reclaiming at 105, and the two-tracked-interface example where priority 120 decrements to 110 and then 100.
