---
title: BGP Fundamentals
description: "Path vector and AS-path loop detection, why eBGP and iBGP behave like two different protocols, the next-hop rule that strands iBGP routes, and why BGP picks a policy winner before it ever looks at path length."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-06-09
updated:
aliases:
  - BGP on IOS
  - AS path
  - eBGP vs iBGP
  - next-hop-self
---

Every interior protocol in this section answers "which of these paths is shortest." [[cs/systems/bgp-and-internet-routing-as-control|BGP answers a different question]], and reading it as a shortest-path protocol is why it feels arbitrary. RFC 4271 states the job plainly: the primary function of a BGP speaking system is to exchange network reachability information with other BGP systems, and this network reachability information includes information on the list of autonomous systems that reachability information traverses. What that list is for comes next in the same paragraph: it is sufficient for constructing [[cs/dsa/graphs|a graph of AS connectivity]], from which routing loops may be pruned, and, at the AS level, some policy decisions may be enforced.

Loop prevention and policy. Nothing about distance.

> [!note] The idea
> BGP carries the whole AS path with each route, which buys two things a distance-vector protocol cannot have. Loop detection becomes a local string search: AS loop detection is done by scanning the full AS path and checking that the autonomous system number of the local system does not appear in the AS path. And because loop freedom is guaranteed structurally rather than by metric arithmetic, BGP is free to select on anything at all. That freedom is what makes it a policy protocol. In the decision process, a route from an external peer gets its degree of preference computed based on preconfigured policy information, and only routes tied on that preference reach the tie-breaker where AS path length is finally consulted. Path length is a tiebreaker, not the criterion.

## eBGP and iBGP, one protocol with two personalities

BGP uses [[cs/networking/tcp-vs-udp|TCP as the transport protocol]], on port 179, and two BGP routers form a TCP connection between one another. Peers exchange OPEN messages carrying the AS number, the BGP version, the BGP router ID, and the keepalive hold time. Cisco's operational rule for reading state: any state other than Established is an indication that the two routers did not become neighbors and that the routers cannot exchange BGP updates.

Whether a session is eBGP or iBGP is decided by one number. When BGP runs between routers that belong to two different ASs, this is called exterior BGP, and when BGP runs between routers in the same AS, this is called iBGP. In configuration, the remote AS number points to either an external or an internal AS, which indicates either eBGP or iBGP.

```
RTA(config)# router bgp 100
RTA(config-router)# neighbor 192.168.129.213 remote-as 200
```

That is eBGP if the local `router bgp` number differs from the `remote-as`, and iBGP if they match. Nothing else declares it.

Two properties follow immediately. eBGP peers have direct connection, but the iBGP peers do not have direct connection. iBGP routers do not need to have direct connection, but there must be some IGP that runs and allows the two neighbors to reach one another. And because the session is just TCP, you can point it at a loopback so it survives the loss of any one physical link:

```
RTA(config-router)# neighbor 10.195.225.11 remote-as 100
RTA(config-router)# neighbor 10.195.225.11 update-source loopback 1
```

`update-source` forces BGP to use the IP address of the loopback interface when BGP talks to that neighbor. For an external neighbor that is not directly connected, you additionally need `neighbor <ip> ebgp-multihop`, and you must also configure an IGP or static routing to allow the neighbors without connection to reach each other.

Two configuration habits that come out of Cisco's guidance. The two IP addresses that you use in the `neighbor` command of the peer routers must be able to reach one another, and the verification is an extended ping that forces the pinging router to use as source the IP address that the `neighbor` command specifies rather than the outgoing interface address. And if there are any BGP configuration changes, you must reset the neighbor connection to allow the new parameters to take effect, with `clear ip bgp <address>` for one peer or `clear ip bgp *` for all of them. The gentler form is a soft reset, `clear ip bgp [soft][in/out]`, where soft does not tear the session and `in`/`out` picks direction.

## AS path, and the two rules that define iBGP

The AS_PATH attribute identifies the autonomous systems through which routing information carried in this UPDATE message has passed. Cisco's operational statement: whenever a route update passes through an AS, the AS number is prepended to that update.

The prepending rule is conditional on peer type, and this is the detail that explains everything else about iBGP. When a given BGP speaker advertises the route to an internal peer, the advertising speaker SHALL NOT modify the AS_PATH attribute associated with the route. Only when advertising to an external peer does the local system prepend its own AS number as the last element of the sequence.

So an iBGP-learned route arrives with an AS path that does not include your own AS. The AS-path loop check therefore cannot catch a loop *inside* an AS, and BGP compensates with a hard rule instead.

> [!warning] iBGP does not re-advertise, so a partial mesh silently drops prefixes
> Cisco: when a BGP speaker receives an update from other BGP speakers in its own AS (iBGP), the BGP speaker that receives the update does not redistribute that information to other BGP speakers in its own AS. It redistributes the information to other BGP speakers outside of its AS. The conclusion Cisco draws: sustain a full mesh between the iBGP speakers within an AS.
>
> RFC 4271 assumes the same thing at the design level: for the purpose of this document, it is assumed that a consistent view of the routes exterior to the AS is provided by having all BGP speakers within the AS maintain IBGP with each other.
>
> The symptom of getting this wrong is specific and nasty. In Cisco's worked example, updates from RTB reach RTA and are passed on to RTE outside the AS, but never reach RTD inside the AS. Nothing is down. No session is flapping. One router in the middle of your own AS simply does not have the prefix, and Cisco's fix is exactly that: make an iBGP peering between RTB and RTD in order to not break the flow of the updates.

## The next hop, and where iBGP routes go to die

For eBGP, the next hop is always the IP address of the neighbor that the `neighbor` command specifies. For iBGP, the protocol states that the next hop that eBGP advertises must be carried into iBGP. The eBGP next hop is carried, unchanged, into your interior mesh.

That is the correct behavior and it is also a trap, because RFC 4271's rule for internal peers is to leave it alone: when sending a message to an internal peer, if the route is not locally originated, the BGP speaker SHOULD NOT modify the NEXT_HOP attribute unless it has been explicitly configured to announce its own IP address as the NEXT_HOP.

Cisco spells out the consequence: make sure the receiving router can reach that next hop via IGP, otherwise it drops packets with that destination because the next hop address is inaccessible. RFC 4271 makes the same point at the decision-process level, that a route whose next hop is not resolvable MUST be excluded from the Phase 2 decision function. The prefix is in the BGP table and absent from the routing table, which is exactly the confusing state people escalate.

The case that produces it most often is a shared medium where the advertising router hands you a third party's address. On a multiaccess network such as Ethernet, RTC advertises a prefix to RTA with a next hop of RTD's address rather than RTC's own, because RTA using RTD as the next hop is more sensible than the extra hop via RTC. On an NBMA cloud the behavior is identical, and there it breaks: RTA does not have a direct permanent virtual circuit to RTD and cannot reach the next hop, so routing fails.

```
RTB(config-router)# neighbor 10.150.1.1 next-hop-self
```

`next-hop-self` allows you to force BGP to use a specific IP address as the next hop. Applied to iBGP neighbors on the border router, it replaces the unreachable external address with the border router's own, which the IGP already knows how to reach.

## Why it is a policy protocol

The BGP decision process runs in phases. Phase 1 calculates a degree of preference for each newly received route, and the source of that number depends on where the route came from. If the route is learned from an internal peer, either the value of the LOCAL_PREF attribute is taken as the degree of preference, or the local system computes the degree of preference based on preconfigured policy information. If the route is learned from an external peer, then the local BGP speaker computes the degree of preference based on preconfigured policy information, and that return value MUST be used as the LOCAL_PREF value in any iBGP readvertisement.

Read that ordering carefully. Preference is assigned by policy *before* any comparison happens. Only routes that tie on degree of preference reach the tie-breaker, and the tie-breaker's first rule is to remove from consideration all routes that are not tied for having the smallest number of AS numbers present in their AS_PATH attributes, with an AS_SET counting as 1 no matter how many ASes are in the set. AS path length never overrides a policy decision; it only settles arguments policy left open.

LOCAL_PREF is the attribute that carries a policy decision across an AS. It SHALL be included in all UPDATE messages that a given BGP speaker sends to other internal peers, the higher degree of preference MUST be preferred, and it MUST NOT be included in UPDATE messages sent to external peers. Cisco's operational framing: local preference is an indication to the AS about which path has preference to exit the AS in order to reach a certain network, and unlike weight, which is only relevant to the local router, local preference is an attribute that routers exchange in the same AS. The default value for local preference is 100, set globally with `bgp default local-preference <value>` or per-route with route maps.

Below AS path length, the tie-break continues: routes not tied for the lowest Origin number are removed, then routes with less-preferred MULTI_EXIT_DISC values, with the important scoping restriction that MULTI_EXIT_DISC is only comparable between routes learned from the same neighboring AS. A MED comparison across two different providers is not a comparison the standard defines.

> [!warning] There are policies BGP structurally cannot express
> RFC 4271 is candid about the limit. Routing information exchanged via BGP supports only the destination-based forwarding paradigm, which assumes that a router forwards a packet based solely on the destination address carried in the IP header, and this in turn reflects the set of policy decisions that can and cannot be enforced using BGP. The named example: BGP does not enable one AS to send traffic to a neighboring AS for forwarding to some destination beyond that neighboring AS, intending that the traffic take a different route to that taken by the traffic originating in the neighboring AS. Such policies require source routing and cannot be enforced using BGP.
>
> The corollary is the one to keep: on the other hand, BGP can support any policy conforming to the destination-based forwarding paradigm. If a routing requirement can be phrased purely as "for this destination prefix, prefer this exit," BGP can express it. If it depends on who sent the traffic, no attribute will save you.

> [!example] Reading `show ip bgp neighbors` for the two things that matter
> ```
> Router# show ip bgp neighbors
> ```
> Cisco directs attention to three fields. The **BGP state**, where any state other than Established indicates that the peers are not up. The **remote router ID**, which is the highest IP address on the router or the highest loopback interface if one exists. And the **table version**, which provides the state of the table and increases any time new information comes in.
>
> That third field is the free flap detector: a version that continues to increment indicates that there is some route flap that causes the continuous update of routes. A session that is Established with a table version climbing on its own is not healthy, it is churning, and you have found the problem before opening a single debug.

## Related Notes

- [[cs/cisco/static-routing-and-administrative-distance|Static Routing and Administrative Distance]] - why eBGP sits at AD 20 and iBGP at 200
- [[cs/cisco/ospf-fundamentals|OSPF Fundamentals]] - the IGP that has to resolve the BGP next hop for any of this to work
- [[cs/cisco/eigrp-fundamentals|EIGRP Fundamentals]] - the other interior option, and a different answer to loop freedom
- [[cs/networking/routing-and-longest-prefix-match|Routing and Longest-Prefix Match]] - what a selected BGP path actually installs into
- [[cs/networking/ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the CIDR prefixes BGP was rebuilt around

## Sources

- RFC 4271, "A Border Gateway Protocol 4 (BGP-4)," Rekhter, Li, Hares (eds.), January 2006. https://www.rfc-editor.org/rfc/rfc4271.txt . Backs the primary-function statement and the AS-list purpose of loop pruning plus AS-level policy, TCP port 179, the external-versus-internal peer definitions, the assumption of a full iBGP mesh for a consistent exterior view, the AS_PATH definition and the do-not-modify-for-internal-peers versus prepend-for-external-peers rules, AS loop detection by scanning for the local AS number, the NEXT_HOP rule for internal peers, the exclusion of routes with unresolvable next hops from the Phase 2 decision function, the Phase 1 degree-of-preference calculation from LOCAL_PREF or policy, the LOCAL_PREF attribute rules including the higher-is-preferred and never-to-external-peers requirements, the Phase 2 tie-breaking order beginning with smallest AS_PATH length and the AS_SET counting rule, the Origin and MULTI_EXIT_DISC steps with the same-neighboring-AS restriction on MED, and the destination-based forwarding limitation with its worked counterexample.
- "Examine Border Gateway Protocol Case Studies," Cisco (Doc ID 26634). https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/26634-bgp-toc.html . Backs TCP port 179 and the OPEN-message value exchange, the Established-state rule, the eBGP and iBGP definitions and the `remote-as` number determining which, the `router bgp` and `neighbor remote-as` syntax with the AS 100 / AS 200 example, iBGP peers not needing direct connection but needing an IGP, `update-source loopback` and `ebgp-multihop` with their configurations, the extended-ping reachability check, `clear ip bgp <address>` / `clear ip bgp *` and the `clear ip bgp [soft][in/out]` soft reset, AS-number prepending as a route traverses an AS, the iBGP no-re-advertisement rule and the resulting full-mesh requirement with its worked failure, the eBGP next hop being the neighbor address and being carried unchanged into iBGP, the dropped-packets consequence when the next hop is unreachable by IGP, the multiaccess and NBMA third-party next-hop behavior and the NBMA routing failure, `neighbor next-hop-self`, the local-preference definition with its default of 100 and `bgp default local-preference`, the contrast with weight as router-local, and the `show ip bgp neighbors` state / router ID / table-version reading including the continuously incrementing version as a flap indicator.
