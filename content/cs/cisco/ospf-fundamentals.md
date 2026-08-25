---
title: OSPF Fundamentals
description: "Neighbor states and what being stuck in each one tells you, the DR/BDR election and its first-mover rule, areas and the backbone constraint, and which LSA type carries what."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-04-23
updated:
aliases:
  - OSPF on IOS
  - DR BDR election
  - LSA types
  - show ip ospf neighbor
---

Almost nothing that goes wrong with OSPF in production is a shortest-path problem. [[cs/dsa/dijkstras-algorithm|Dijkstra]] works. What breaks is the step before it: two routers that should be exchanging databases are not, and the routing table is missing entries because the database is missing entries. That is why the first command on an OSPF problem is `show ip ospf neighbor` and not `show ip route`.

Cisco separates the two ideas that people run together. Being neighbors is not enough: the fact that routers are neighbors is not sufficient to guarantee an exchange of link-state updates, they must form adjacencies to exchange link-state updates. Adjacency is an advanced form of neighborship formed by routers that exchange routing information after parameters for such an exchange are negotiated, and routers reach a FULL state of adjacency when they have synchronized views on a link-state database.

> [!note] The idea
> OSPF routers do not exchange routes. They negotiate their way into a shared database and then each computes its own table from it, so every OSPF fault is either a negotiation that failed at a specific state or a database that is correct but scoped away by an area boundary. The non-obvious part is that the protocol tells you *where* it failed for free. The neighbor state a stuck adjacency sits in is a diagnosis, not a symptom, because each state is defined by exactly one thing that must have happened to leave it. Exstart means the databases have not started transferring, and Cisco names the usual cause on that state specifically: an MTU mismatch. That is a layer-2 configuration problem you can read off a layer-3 protocol's state machine.

## The neighbor states, read as a diagnostic ladder

The states are defined in RFC 2328 section 10.1, and Cisco enumerates them as Down, Attempt, Init, 2-Way, Exstart, Exchange, Loading, and Full.

**Down** means no information (hellos) has been received from this neighbor, though hello packets can still be sent to the neighbor in this state. There is a second path into Down that matters operationally: in the fully adjacent neighbor state, if a router does not receive hello packet from a neighbor within the RouterDeadInterval time, the neighbor state changes from Full to Down. Cisco states the relationship between the timers as RouterDeadInterval = 4 * HelloInterval by default.

**Attempt** is only valid for manually configured neighbors in an NBMA environment, where the router sends unicast hello packets every poll interval to the neighbor.

**Init** specifies that the router has received a hello packet from its neighbor, but the receiving router ID was not included in the hello packet. The acknowledgment rule underneath it is the useful part: when a router receives a hello packet from a neighbor, it must list the sender router ID in its hello packet as an acknowledgment that it received a valid hello packet. So Init is directional. You are hearing them; they are not hearing you. Suspect a one-way path, an inbound ACL, or [[cs/networking/multicast-broadcast-anycast|a filtered multicast]].

**2-Way** designates that bi-directional communication has been established between two routers, attained when the router receiving the hello packet sees its own Router ID within the received hello packet neighbor field. At this state, a router decides whether to become adjacent with this neighbor, and the DR and BDR for broadcast and non-broadcast multi-access networks are elected. 2-Way is the state most often misread as a fault. It is not: on broadcast media and NBMA networks a router becomes full only with the DR and the BDR and it stays in the 2-way state with all other neighbors. On point-to-point and point-to-multipoint networks, a router becomes full with all connected routers.

**Exstart** is where the routers and their DR and BDR establish a primary-secondary relationship and choose the initial sequence number for adjacency formation, with the router with the higher router ID becoming the primary. Stuck here is the classic [[cs/networking/mtu-and-fragmentation|MTU mismatch]].

**Exchange** is the DBD exchange proper. Database descriptors contain link-state advertisement (LSA) headers only and describe the contents of the entire link-state database, so this stage is a table of contents, not the content. Each DBD packet has a sequence number which can be incremented only by primary and is explicitly acknowledged by secondary.

**Loading** is where the actual exchange of link state information occurs: based on the information provided by the DBDs, routers send link-state request packets, and the neighbor provides the requested link-state information in link-state update packets. Cisco notes that neighbors that do not transition beyond this state likely exchange corrupted LSAs, usually accompanied by a `%OSPF-4-BADLSA` console message.

**Full** means routers are fully adjacent with each other, all the router and network LSAs are exchanged, and the routers' databases are fully synchronized. Cisco's rule of thumb: Full is the normal state for an OSPF router, and if a router is stuck in another state, it is an indication that there are problems when the adjacencies are formed, with the only exception being the 2-way state, which is normal in a broadcast network.

One display quirk worth knowing before it confuses you at 2 a.m.: on a DR or BDR, `show ip ospf neighbor` can display `FULL/DROTHER`, which simply means the neighbor is not a DR or BDR, but since the router on which the command was entered is either a DR or BDR, this shows the neighbor as FULL/DROTHER.

## DR and BDR on multiaccess segments

Every broadcast and NBMA network has a Designated Router, and RFC 2328 gives it two jobs. It originates a network-LSA on behalf of the network, listing the set of routers currently attached to the network including itself. And it becomes adjacent to all other routers on the network, so that since the link state databases are synchronized across adjacencies, the Designated Router plays a central part in the synchronization process. That is the whole point: instead of every router on a segment syncing with every other, they all sync with one, and [[cs/math/combinatorics|the adjacency count collapses]].

The BDR exists purely to avoid a slow failover. RFC 2328 spells the cost out: if there were no Backup Designated Router, when a new Designated Router became necessary, new adjacencies would have to be formed between the new Designated Router and all other routers attached to the network, and part of the adjacency forming process is the synchronizing of link-state databases, which can potentially take quite a long time, during which the network would not be available for transit data traffic. With a BDR already adjacent to everyone, the period of disruption in transit traffic lasts only as long as it takes to flood the new LSAs. Note the deliberate asymmetry: the Backup Designated Router does not generate a network-LSA for the network, which the RFC calls a tradeoff between database size and speed of convergence.

The election rule has a plain half and a half that surprises people.

The plain half: when two routers attached to a network both attempt to become Designated Router, the one with the highest Router Priority takes precedence, and if there is still a tie, the router with the highest Router ID takes precedence. A router whose Router Priority is set to 0 is ineligible to become Designated Router on the attached network, and Router Priority is only configured for interfaces to broadcast and NBMA networks.

> [!warning] The election is not a contest, it is a first-mover rule
> RFC 2328: when a router's interface to a network first becomes functional, it checks to see whether there is currently a Designated Router for the network, and if there is, it accepts that Designated Router, regardless of its Router Priority. The RFC states the design intent openly: this makes it harder to predict the identity of the Designated Router, but ensures that the Designated Router changes less often.
>
> So the DR on a live segment is whichever eligible router came up first, not the one you gave the highest priority to. Priority only decides the outcome among routers electing at the same time. This is why a segment's DR after a maintenance window rarely matches the design document, and why "fixing" it means bouncing OSPF on the segment rather than just setting a priority.
>
> There is a real cost to churning it. When the Designated Router changes, it appears as if the network node on the graph is replaced by an entirely new node, which causes the network and all its attached routers to originate new LSAs, and until the link-state databases again converge, some temporary loss of connectivity may result. The RFC's guidance is that Router Priorities should be configured so that the most dependable router on a network eventually becomes Designated Router. Set priority 0 on every router that must never be DR (access-layer and firewall-adjacent boxes), and non-zero only on the two you actually want.

## Areas, and the rules the backbone imposes

An area is a logical collection of OSPF networks, routers, and links that have the same area identification. A router within an area must maintain a topological database for the area to which it belongs, and does not have detailed information about network topology outside of its area, which thereby reduces the size of its database.

The scoping rule is sharper than most summaries make it. Areas limit the scope of route information distribution, and it is not possible to do route update filtering within an area. The link-state databases of routers within the same area must be synchronized and be exactly the same; however, route summarization and filtering is possible between different areas. Filtering is a boundary-only capability. If someone asks you to filter a prefix inside an area, the answer is that the topology does not permit it.

Three constraints define a valid design. A backbone area, which combines a set of independent areas into a single domain, must exist. Each non-backbone area must be directly connected to the backbone area, though this connection can be a simple logical connection through a virtual link. And the backbone area must not be partitioned under any failure conditions such as link or router down events. Cisco's warning about violating them is not abstract: some of the routers in your network can have partial routing information, which negatively compromises your network.

Two router roles come out of this. A router with interfaces in two or more different areas is an area border router, and both sides of any link always belong to the same OSPF area. An autonomous system boundary router advertises external destinations throughout the OSPF autonomous system, where external routes are the routes redistributed into OSPF from any other protocol.

Area IDs accept two notations: Cisco IOS supports area IDs expressed in IP address format or decimal format, so `area 0.0.0.0` is equal to `area 0`.

## Stub area types, as a filter table

Stub variants exist because external link states make up a large percentage of the link states in the databases of every router in many cases. A stub area is an area in which you do not allow advertisements of external routes, and instead a default summary route (0.0.0.0) is inserted into the stub area in order to reach these external routes.

| Area type | Restriction | Configured with |
|---|---|---|
| Normal | None | (default) |
| Stub | No Type 4 or 5 AS-external LSAs allowed | `area xx stub` on every router in the area |
| Totally stub | No Type 3, 4 or 5 LSAs allowed except the default summary route | `area xx stub no-summary` on the ABR |
| NSSA | No Type 5 AS-external LSAs allowed, but Type 7 LSAs that convert to Type 5 at the NSSA ABR can traverse | `area xx nssa` |
| NSSA totally stub | No Type 3, 4 or 5 LSAs except the default summary route, but Type 7 LSAs that convert to Type 5 at the NSSA ABR are allowed | `area xx nssa no-summary` on the NSSA ABR |

The placement of the command differs by type and it is a real source of broken deployments. Cisco's instruction for a stub area is to use `area xx stub` in every router in the area, while `area xx stub no-summary` is configured on the ABR. Get that wrong and it does not fail quietly at the routing layer, it fails at the adjacency layer: one row of Cisco's typical-problems table is "OSPF area-type is stub on one neighbor, but the adjacent neighbor in the same area is not configured for stub."

NSSA is the answer when a stub area has its own external routes to inject. NSSAs are more flexible than stub areas in that an NSSA can import external routes into the OSPF routing domain and thereby provide transit service to small routing domains that are not part of the OSPF routing domain. External routing information is imported into an NSSA in Type-7 LSAs, which are similar to Type-5 AS-external LSAs except that they can only be flooded into the NSSA, and to propagate further the Type-7 LSA must be translated to a Type-5 AS-external-LSA by the NSSA ABR.

Where a non-backbone area genuinely cannot touch area 0, a virtual link connects it to the backbone through a non-backbone area. The transit area must have full routing information and cannot be a stub area, which rules out the tidy design people usually want. Syntax is `area area-id virtual-link router-id`, where area-id is the transit area and router-id is the router ID associated with the virtual link neighbor.

## LSA types, by who originates them

| Type | Name | Originated by | Describes |
|---|---|---|---|
| 1 | Router-LSA | Each router in an area | The state and cost of the router's links (interfaces) to the area, all in a single router-LSA |
| 2 | Network-LSA | The network's Designated Router | All routers attached to the network, including the DR itself; originated for each broadcast and NBMA network in the area which supports two or more routers |
| 3 | Summary-LSA | Area border routers | An inter-area destination that is an IP network |
| 4 | Summary-LSA | Area border routers | An inter-area destination that is an AS boundary router, with the Link State ID field carrying the ASBR's OSPF Router ID |
| 5 | AS-external-LSA | AS boundary routers | Destinations external to the AS |
| 7 | NSSA external | Originated within an NSSA | External routing information imported into an NSSA; flooded only inside it, and translated to Type 5 by the NSSA ABR to go further |

Two details in that table pay off in troubleshooting. The Type 2 exists only where there are two or more routers on a segment, which is why a point-to-point link never produces one. And the Type 4 exists because reaching an external prefix requires first knowing where the ASBR is, so a missing Type 4 produces the specific symptom of external routes present in the database but unreachable.

## What actually stops an adjacency

Cisco's table of typical reasons is the fastest checklist in the OSPF documentation set, and every row names the command that proves it.

| Reason | Command to diagnose |
|---|---|
| OSPF is not configured on one of the routers | `show ip ospf` |
| OSPF is not enabled on an interface where it is needed | `show ip ospf interface` |
| Hello or dead timer interval values are mismatched | `show ip ospf interface` |
| `ip ospf network-type` mismatch on the adjacent interfaces | `show ip ospf interface` |
| MTU mismatch between neighbor interfaces | `show interface <int-type><int-num>` |
| Area type is stub on one neighbor but not the other | `show running-config`, `show ip ospf interface` |
| Duplicate Router IDs | `show ip ospf`, `show ip ospf interface` |
| OSPF on the secondary network but not the primary (an illegal configuration) | `show ip ospf interface`, `show running-config` |
| Hellos not processed for lack of resources | `show memory summary`, `show memory processor` |
| A lower-layer problem prevents receipt of hellos | `show interface` |

The duplicate Router ID case deserves emphasis because it produces total silence rather than an error: routers with the same Router ID ignore hellos sent by each other, and do not become adjacent. Cisco also notes that OSPF adjacencies only form over primary networks, not secondary networks.

For the MTU case there is a bypass and a warning attached to it. You can configure `ip ospf mtu-ignore` in interface configuration mode to avoid the MTU check at adjacency establishment, but Cisco recommends fixing any MTU mismatch by reviewing the interface configuration instead of just bypassing the MTU check. An adjacency that comes up on `mtu-ignore` still has a real MTU problem underneath it.

> [!example] Reading `show ip ospf interface` for the four things that must match
> On a broadcast interface the output includes these lines:
> ```
> Internet Address 10.1.1.1/30, Area 0, Attached via Network Statement
> Process ID 1, Router ID 10.1.1.1, Network Type BROADCAST, Cost: 1
> Transmit Delay is 1 sec, State BDR, Priority 1
> Designated Router (ID) 10.1.1.2, Interface address 10.1.1.2
> Backup Designated router (ID) 10.1.1.1, Interface address 10.1.1.1
> Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
> Neighbor Count is 1, Adjacent neighbor count is 1
> ```
> Four fields on that page decide whether an adjacency can form at all: the area, the network type, the timers, and the subnet mask on the interface address. Run it on both ends and compare those four before touching anything else. `Neighbor Count` versus `Adjacent neighbor count` is the second useful read: on a multiaccess segment the gap between them is the DROTHER population, and on a point-to-point link the two should match.
>
> When nothing appears in `show ip ospf neighbor` at all, Cisco's first checks are connectivity oriented rather than protocol oriented. Ping the neighbor's interface address, confirm the traceroute takes no more than one hop, and then ping `224.0.0.5`, which is the IP address to which OSPF hellos are sent. If unicast works and the multicast ping does not, the problem is between the interfaces, not inside OSPF.

## Related Notes

- [[cs/networking/ospf-and-link-state-routing|OSPF and Link-State Routing]] - the link-state model and Dijkstra computation behind the state machine here
- [[cs/cisco/eigrp-fundamentals|EIGRP Fundamentals]] - the other IGP, and the one that beats OSPF on administrative distance
- [[cs/cisco/static-routing-and-administrative-distance|Static Routing and Administrative Distance]] - AD 110 and how a static route overrides it
- [[cs/cisco/bgp-fundamentals|BGP Fundamentals]] - the exterior protocol OSPF hands off to at the AS boundary
- [[cs/networking/mtu-and-fragmentation|MTU and Fragmentation]] - the mismatch that strands adjacencies in Exstart
- [[cs/cisco/show-and-debug-methodology|Show and Debug Methodology]] - `debug ip ospf adj` and when to reach for it

## Sources

- "Understand OSPF Neighbor States," Cisco (Doc ID 13685). https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13685-13.html . Backs the eight-state list and its RFC 2328 section 10.1 grounding, the definition of each state (Down, Attempt, Init, 2-Way, Exstart, Exchange, Loading, Full), the RouterDeadInterval = 4 * HelloInterval relationship, the router-ID acknowledgment rule behind Init, the DR/BDR-only adjacency rule on broadcast and NBMA versus full adjacency on point-to-point and point-to-multipoint, the primary/secondary and sequence-number behavior in Exstart and Exchange, DBDs carrying LSA headers only, Full as the normal state with 2-Way as the exception, and the FULL/DROTHER display.
- "Troubleshoot OSPF Neighbor Problems," Cisco (Doc ID 13699). https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13699-29.html . Backs the neighbor-versus-adjacency distinction and the definition of adjacency, the MTU-mismatch cause for Exstart/Exchange, the `%OSPF-4-BADLSA` symptom in Loading, the full table of typical adjacency-failure reasons with their diagnostic commands, the duplicate-Router-ID silence, the primary-versus-secondary-network rule, the `ip ospf mtu-ignore` bypass and the recommendation against it, the sample `show ip ospf interface` output including `Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5`, and the ping / traceroute / `ping 224.0.0.5` checks with 224.0.0.5 named as the OSPF hello destination.
- "Understand OSPF Areas and Virtual Links," Cisco (Doc ID 13703). https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13703-8.html . Backs the definition of an area and per-area topological database, the scoping and filtering rules, the three backbone design rules and the partial-routing-information warning, ABR and ASBR definitions, area IDs in IP or decimal format, the stub-area rationale and default summary route, the `area xx stub`, `area xx stub no-summary`, `area xx nssa`, and `area xx nssa no-summary` commands with their placement, the normal/stub/totally-stub/NSSA/NSSA-totally-stub restriction table, the NSSA Type-7 to Type-5 translation, and virtual links with the transit-area rules and `area area-id virtual-link router-id` syntax.
- RFC 2328, "OSPF Version 2," J. Moy, April 1998. https://www.rfc-editor.org/rfc/rfc2328.txt . Backs the two DR functions and the network-LSA it originates, the BDR rationale including the cost of re-forming adjacencies and the fact that the BDR does not originate a network-LSA, the first-mover acceptance rule and its stated design intent, the priority-then-Router-ID election order and priority 0 ineligibility, the DR-change convergence cost and the "most dependable router" guidance, and the Type 1, 2, 3, 4, and 5 LSA definitions with their originators.
