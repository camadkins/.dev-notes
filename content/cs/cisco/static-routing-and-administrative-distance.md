---
title: Static Routing and Administrative Distance
description: "Why a static route wins over OSPF, what next-hop versus exit-interface actually changes on the box, and the recursion bug that keeps a floating static route out of the table when you need it most."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-03-11
updated:
aliases:
  - administrative distance
  - floating static route
  - ip route
  - AD values
---

You reach for a static route in two situations. Cisco names both: static routes are often used when there is no dynamic route to the destination IP address, or to override the dynamically learned route. The first is plumbing, a stub site or a default route out to a provider. The second is a deliberate act of policy, and it works because of a number that has nothing to do with how good the path is.

> [!note] The idea
> Administrative distance ranks the *trustworthiness of the source*, not the quality of the path. Cisco's definition: AD is a value used to rank the trustworthiness of routing information sources, and when the routing table receives candidate routes to the same destination prefix from different route sources, the route with the lowest administrative distance is preferred and installed in the routing table. Two consequences people trip over. AD is used only when multiple routing sources advertise the same destination prefix, so it never arbitrates between two routes of different prefix length. And AD is a local value and is not advertised in routing updates, so a distance change you make on one router is invisible to every other router, which is exactly how you build asymmetric routing by accident.

## Where AD sits in the pipeline

The order of operations matters more than the table of numbers, because most confusion about AD comes from putting it in the wrong stage. Cisco lays the RIB installation process out in sequence.

First, each routing protocol runs its own metric and path selection algorithm and produces its own best candidate. Then the routing table compares candidates: only the protocol's best candidate for a given prefix is considered, and if multiple routing sources advertise the same network and prefix length, AD determines which route is installed. Then the route is installed, but only after the router validates that it is usable, including a reachable next hop or valid exit interface. If the route uses a next-hop IP address, the router performs [[cs/dsa/recursion|recursive lookup]], also called route recursion, to resolve the outgoing interface, and if the next hop cannot be resolved, the route is not installed in the routing table.

Forwarding is a separate stage with separate rules. When forwarding a packet, the router searches the forwarding table for all matching routes and selects the most specific prefix, the [[routing-and-longest-prefix-match|longest prefix match]]. Cisco is blunt about the relationship: AD and routing metrics are not evaluated during forwarding, those values have already been used to determine which routes were installed in the RIB, hence AD does not override longest prefix match.

That single sentence settles a recurring argument. A /24 learned from OSPF beats a /16 static for a packet inside the /24, every time, no matter that the static has AD 1. The static did not lose; it was never in that competition.

## The default values

| Route source | Default AD |
|---|---|
| Connected | 0 |
| Static | 1 |
| EIGRP summary route | 5 |
| External BGP | 20 |
| Internal EIGRP | 90 |
| IGRP | 100 |
| OSPF | 110 |
| IS-IS | 115 |
| RIP | 120 |
| EGP | 140 |
| ODR | 160 |
| External EIGRP | 170 |
| Internal BGP | 200 |
| Unknown | 255 |

Two entries are doing work beyond their row. 255 is not "very bad," it is a veto: if the administrative distance is 255, the router does not consider the route reliable and does not install it in the routing table. And the eBGP/iBGP split at 20 and 200 is why a route learned from a peer AS outranks OSPF while the same prefix learned from your own iBGP mesh loses to it, a design decision covered in [[bgp-fundamentals|BGP fundamentals]].

Reading the table back off the box, the bracket notation is `[administrative distance/metric]`. Cisco's example: `[90/1]` means the route has an administrative distance of 90 and a protocol metric of 1. So `[110/2]` is OSPF at cost 2, and `[1/0]` is a static route, which always shows metric 0.

You can move a protocol's distance with the `distance` command under the routing process:

```
R1(config)# router ospf 100
R1(config-router)# distance 85
```

After that, OSPF at 85 beats internal EIGRP at 90 on that router. Cisco attaches a caution rather than a recommendation, and the reason is the locality point above: an inconsistent AD design can cause asymmetric routing, suboptimal routing, routing loops, or traffic black holes. There are no general guidelines to assign administrative distances, because each network has varied requirements, so you must determine a reasonable matrix of administrative distances for the network as a whole.

## Next hop, exit interface, or both

`ip route` accepts a next-hop address, an outgoing interface, or both, and the three forms behave differently enough that the choice is a design decision.

Pointing a static route at an interface with no next-hop address is fine on a point-to-point link and dangerous on Ethernet. Cisco's reasoning is mechanical: when the static route points to an interface and has no next hop information, the router considers each host within the range of the route to be directly connected through that interface. So a router with `ip route 0.0.0.0 0.0.0.0 Ethernet0` [[cs/networking/arp-and-mac-addressing|performs ARP on the Ethernet for every destination]] the router finds through the default route. Cisco names the damage: this static route type, especially if it is used by many packets to many different destination subnets, can cause high processor use and a very large ARP cache, along with memory allocation failures.

Adding the next-hop address kills that behavior. When the next hop address is specified on a directly-connected interface, the router does not perform ARP for each destination address. There is also a second reason to name both, which is determinism: if there is the possibility the interface with the next hop goes down and the next hop would become reachable through a recursive route, specify both the next hop IP address and the alternate interface through which the next hop can be found, because the addition of the alternate interface enables the static route installation to become more deterministic.

Cisco's summary recommendation is worth memorizing as a rule of thumb: configure both the outbound interface and the next hop IP address for a static route. For a serial interface, the specification of the outbound interface is sufficient because a serial interface is a point-to-point interface. If the outbound interface is an Ethernet interface, then configure both.

## Floating statics, and the failure that makes them useless

A floating static route is the standard backup-path idiom. Cisco's definition: a floating static route is configured with an administrative distance higher than the primary route, so it is used only when the primary route is removed from the routing table. The syntax is just a trailing distance value.

```
R1(config)# ip route 10.0.0.0 255.255.255.0 172.16.1.200 250
```

With OSPF supplying the primary route at AD 110, the 250 keeps this route out of the table until the OSPF route disappears. Pick the number against the protocol you are backing up: to configure a static route that is overridden by an EIGRP route, specify an administrative distance that is greater than 170 for the static route, because external EIGRP sits at 170. And 255 is off the table entirely, since static routes with an administrative distance of 255 are never entered into the routing table.

Now the failure. This is the one that costs a maintenance window.

> [!warning] A floating static backed by a recursive primary never activates
> Cisco walks a lab where R1 has a primary static to the LAN through the primary serial link and a floating static with distance 250 through the backup link. The operator shuts the primary interface to test failover. The floating static is not installed on R1 and the primary static is still in the routing table for R1, even though the serial port 1/0 link is shut down. Ping and traceroute from the host stop working. The cause, in Cisco's words: this occurs because static routes are recursive in nature, always keep the static route in the routing table as long as you have a route to the next hop. The primary static's next hop was still resolvable through a different static route (a `10.0.0.0/8` entry pointing elsewhere), so the primary never left the table, so the backup never got its turn.
>
> The fix is to remove the recursion: configure a static route on R1 where the next hop cannot be recursive to another static route. In the lab that meant re-pointing the primary at the interface itself.
>
> ```
> R1(config)# no ip route 172.31.10.0 255.255.255.0 10.10.10.2
> R1(config)# ip route 172.31.10.0 255.255.255.0 Serial1/0
> ```

The general lesson is that a floating static is only as good as the failure detection under it. Interface state is a signal the router can act on. A next-hop address that still resolves through some other route is not, and the interface being administratively down is not enough to break that resolution.

> [!example] Verifying which source won, and why
> ```
> R1# show ip route
> R1# show ip route 172.31.10.0
> R1# show ip route ospf
> ```
> The first shows the installed table with `[AD/metric]` on each entry and the one-letter code for the source (`S` static, `D` EIGRP, `O` OSPF, `C` connected). The second is the one that answers "why is this route here": Cisco's output shows `Routing entry for 172.31.10.0/24`, `Known via "static", distance 1, metric 0`, and the Routing Descriptor Blocks listing the next hop. Run it a second time against the *next hop address* to see whether that next hop is itself resolving through another static, which is the recursion check that would have caught the failover bug above. The third filters to one protocol, which is how you confirm a route left the table rather than assuming it did.

## Related Notes

- [[routing-and-longest-prefix-match|Routing and Longest-Prefix Match]] - the forwarding-stage rule that AD does not override
- [[ospf-fundamentals|OSPF Fundamentals]] - the AD 110 source most often overridden by a static
- [[eigrp-fundamentals|EIGRP Fundamentals]] - internal 90 and external 170, the two values a floating static has to clear
- [[bgp-fundamentals|BGP Fundamentals]] - why eBGP sits at 20 and iBGP at 200
- [[hsrp-vrrp-and-first-hop-redundancy|HSRP, VRRP, and First-Hop Redundancy]] - redundancy for the default gateway a host statically points at
- [[show-and-debug-methodology|Show and Debug Methodology]] - the discipline behind the verification commands
- [[arp-and-mac-addressing|ARP and MAC Addressing]] - the cache that an interface-only static route on Ethernet blows up

## Sources

- "Understand Administrative Distance," Cisco (Doc ID 15986). https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html . Backs the definition of AD as a ranking of source trustworthiness, the lowest-AD-wins rule, the RIB installation sequence (protocol best path, AD comparison on equal prefix and prefix length, installation with next-hop validation and recursive lookup), the statement that AD does not override longest prefix match, AD as a local non-advertised value, the full default-AD table including 255 as uninstallable, the `[administrative distance/metric]` bracket format with the `[90/1]` example, the `distance` command under `router ospf` with the 85 example and the caution about asymmetric routing and black holes, the absence of general assignment guidelines, and the floating-static definition with `ip route 10.0.0.0 255.255.255.0 172.16.1.200 250`.
- "Configure a Next Hop IP Address for Static Routes," Cisco (Doc ID 118263). https://www.cisco.com/c/en/us/support/docs/dial-access/floating-static-route/118263-technote-nexthop-00.html . Backs static routes being used when no dynamic route exists or to override one, the default static AD of 1, the greater-than-170 guidance for backing up EIGRP, the never-installed behavior at AD 255, the per-destination ARP and large-ARP-cache consequence of an interface-only static on Ethernet, the no-ARP behavior when a directly connected next hop is specified, the determinism argument for naming both next hop and alternate interface, the serial-versus-Ethernet recommendation, and the recursion failure case with its `show ip route` output and the interface-pointing fix.
