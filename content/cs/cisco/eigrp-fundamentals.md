---
title: EIGRP Fundamentals
description: "The feasibility condition, why a feasible successor converges instantly while a query storm does not, what passive and active actually mean, and the timer behavior that differs from OSPF in a way that bites."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-05-14
updated:
aliases:
  - EIGRP
  - DUAL
---

Watch what [[cs/networking/ospf-and-link-state-routing|a classic distance-vector protocol]] does when a path dies. Cisco's own worked example with RIP: Router Two loses all connectivity with the destination until it times out the route of its routing table (three update periods, or 90 seconds), and Router Three re-advertises the route, which occurs every 30 seconds in RIP. Excluding hold-down, it takes between 90 and 120 seconds to switch to the surviving path that was there the whole time.

EIGRP's answer is to keep the losing paths instead of discarding them, and to precompute which of them are safe to use without asking anyone. That precomputation is the entire protocol.

> [!note] The idea
> EIGRP's speed does not come from finding a new path faster. It comes from having already proven, before the failure, that a specific alternate is loop-free, so the switchover requires zero coordination. The proof is the feasibility condition: a neighbor qualifies if the neighbor's reported distance is less than this router's feasible distance, which RFC 7868 restates as the neighbor being closer to the destination than the router itself has ever been since the destination last entered the passive state. That is a *sufficient but not necessary* condition. Every path meeting the feasibility condition is guaranteed to be loop free; however, not all loop-free paths meet the feasibility condition. EIGRP deliberately rejects some perfectly good backup paths in exchange for never having to check one at failover time.

## Successor, feasible successor, and the two distances

Four terms, and getting them straight settles most EIGRP confusion.

**Feasible distance (FD)** is the least-known total metric to a destination from the current router since the last transition from active to passive state. RFC 7868 flags the trap in that definition: being effectively a record of the smallest known metric since the last time the network entered the passive state, the FD is not necessarily a metric of the current best path. It is a historical low-water mark, not a live value. Cisco's shorter version is the best metric along a path to a destination network, which includes the metric to the neighbor that advertises that path.

**Reported distance (RD)** is the total metric along a path to a destination network as advertised by an upstream neighbor. Cisco stresses the frame of reference: in each case, EIGRP calculates the reported distance from the router that advertises the route to the network, so the RD from Router Four is the metric to get to the network from Router Four, not from you.

**Successor**: a neighboring router that meets the feasibility condition and, at the same time, provides the least-cost path. That is the next hop that goes in the routing table.

**Feasible successor**: a neighboring router that meets the feasibility condition for a particular destination, hence providing a guaranteed loop-free path. It may not be the least-cost path, and it becomes the successor when the current successor becomes unreachable.

Cisco's compact statement of the test is worth memorizing: a feasible successor is a path whose reported distance is less than the feasible distance (current best path). Note the asymmetry that makes it work. The comparison is neighbor's RD against *your* FD, not RD against RD. A neighbor whose advertised distance is already lower than your best-ever distance cannot be routing through you, [[cs/math/proof-techniques|because if it were, its distance would include yours]].

The payoff is exactly what the failure case looks like. Cisco walks it: when the link between Routers One and Three goes down, Router One examines each path it knows to Network A and finds that it has a feasible successor through Router Four, uses this route, and the network converges instantly, with updates to downstream neighbors as the only traffic from the routing protocol.

> [!warning] `show ip eigrp topology` hides the routes you are asking about
> Cisco is explicit about a display behavior that has cost people hours: in a topology where only one of two paths qualifies, at Router One there are two entries in the topology table, but only one is a feasible successor, so the other is not displayed in `show ip eigrp topology`. To see routes that are not feasible successors, you need `show ip eigrp topology all-links`.
>
> So the command that looks like "show me everything EIGRP knows" is filtered by the very property you are usually trying to investigate. If you are asking "why did this go active when there was clearly another path," the default output cannot answer you, because the other path is missing precisely because it failed the feasibility condition. Reach for `all-links` first.

## Passive and active, and why "active" is bad news

Both words mean the opposite of what the English suggests.

A route is in the **passive** state when at least one neighbor that provides the current least-total-cost path passes the feasibility condition check that guarantees loop freedom. A route in the passive state is usable, and the router does not perform any route recalculation in coordination with its neighbors because no such recalculation is needed. Passive is healthy. Passive is the steady state.

A route is in the **active** state if neighbors that do not pass the feasibility condition check provide the lowest-cost path, and therefore the path cannot be guaranteed loop free. A route in the active state is considered unusable, and this router must coordinate with its neighbors in the search for the new loop-free least-total-cost path. Active means EIGRP is running [[cs/systems/distributed-consensus|a distributed computation]], and the traffic for that prefix is down while it runs.

One subtlety in the state definitions: for the purposes of passive versus active, it does not matter if there are feasible successors providing a worse-than-least-total-cost path. Those neighbors are guaranteed to provide a loop-free path, but that path is potentially not the shortest available. The state is defined by the *least-cost* path's feasibility, not by whether any loop-free option exists.

While a route is active, the router freezes its own advertised view of it: it must not change its successor nor modify its own feasible distance or RD until the route enters the passive state again, and any updated information received during active state is reflected only in computed distances. That freeze is what makes the diffusing computation terminate cleanly instead of chasing itself.

## The diffusing computation, and where it goes wrong

When there is no feasible successor, EIGRP escalates from "look it up locally" to "ask the network," using three message types: UPDATE, sent to indicate a change in metric or an addition of a destination; QUERY, sent when the feasibility condition fails, which can happen for reasons like a destination becoming unreachable or the metric increasing to a value greater than its current FD; and REPLY, sent in response to a QUERY or SIA-QUERY.

RFC 7868 describes the shape of the computation: a diffusing computation grows by querying additional routers for their current RD to the affected destination, and it shrinks by receiving replies from them, with unaffected routers sending replies immediately, terminating the growth of the diffusing computation over them. Nodes that are not affected by the topology change are not required to perform a DUAL computation and may not be aware a topology change occurred.

That last property is the design lever. The scope of a query is bounded by how much reachability information the network hides, and controlling the scope of the diffusing process is accomplished by hiding reachability information through aggregation (summarization), filtering, or other means, which provides the ability to create effective failure domains within a single AS. If EIGRP queries are reaching too far in your network, the fix is a summarization boundary, not a timer.

The failure mode is **stuck in active**. RFC 7868 defines an SIA route as a destination that has remained in the active state in excess of a predefined time period at the local router, with Cisco implementing this as 3 minutes. Cisco describes what the router does about it: if it takes a long time for a query to be answered, the router that issued the query gives up and clears its connection to the router that does not answer, and this restarts the neighbor session. The damage is therefore not confined to one prefix. An unanswered query tears down an adjacency.

Between the query and the giveup there is a probe. An SIA-QUERY is sent when a REPLY has not been received within one-half of the SIA interval, 90 seconds as implemented by Cisco, and an SIA-REPLY is sent in response indicating the route is still in active state.

> [!example] Finding the router that does not answer
> ```
> Router# show ip eigrp topology active
> ```
> Cisco's method: any neighbors that show an `R` have yet to reply, and the active timer shows how long the route has been active. Pay particular attention to routes that have outstanding replies and have been active for some time, generally two to three minutes. Run this command several times and you begin to see which neighbors do not respond to queries, or which interfaces seem to have a lot of unanswered queries. Then examine that neighbor to see if it consistently waits for replies from any of *its* neighbors, and repeat until you find the router that consistently does not answer queries. At that point look for problems on the link to this neighbor, memory or CPU utilization, or other problems with this neighbor.
>
> That walk is the whole diagnostic. SIA is almost never a problem at the router reporting it. In Cisco's worked example the reported SIA routes at Router One traced back to delay over a satellite link two hops away, and one of the two viable fixes was to increase the amount of time the router waits after it sends a query before it declares the route SIA, changed with the `timers active-time` command. Raising that timer treats the symptom; the query-scope fix treats the cause.

## Neighbors and timers, where EIGRP differs from OSPF

EIGRP sends hello packets every 5 seconds on high bandwidth links and every 60 seconds on low bandwidth multipoint links. The split is by media type: 5-second hellos on broadcast media such as Ethernet, on point-to-point serial links, and on high bandwidth (greater than T1) multipoint circuits; 60-second hellos on multipoint circuits at T1 bandwidth or slower. Hold time is typically three times the hello interval, by default 15 seconds and 180 seconds respectively. Per-interface tuning is `ip hello-interval eigrp` and `ip hold-time eigrp`.

Two behaviors here catch people who learned OSPF first.

**Changing hello does not change hold.** Cisco's note is unambiguous: if you change the hello interval, the hold time is not automatically adjusted to account for this change, and you must manually adjust the hold time to reflect the configured hello interval. Set hello to 1 second for fast detection and leave hold at 15, and you have gained nothing.

**Mismatched timers do not break the adjacency.** It is possible for two routers to become EIGRP neighbors even though the hello and hold timers do not match, because the hold time is included in the hello packets so each neighbor can stay alive despite the mismatch. Where an OSPF timer mismatch is a hard adjacency failure you will find in an hour, an EIGRP timer mismatch is silent asymmetric failure detection you will find during an outage.

What *does* break the adjacency is K-values. RFC 7868: the HELLO packet will include the configured EIGRP metric K-values, and two routers become neighbors only if the K-values are the same, which enforces that the metric usage is consistent. Cisco says the same thing from the operational side, that mismatched K values prevent a neighbor relationship to build, which can cause your network to fail to converge.

Also worth knowing before you build a design around it: EIGRP does not build peer relationships over secondary addresses, and all EIGRP traffic is sourced from the primary address of the interface.

## The metric, and why to leave it alone

The classic composite metric on Cisco IOS is:

```
metric = ([K1 * bandwidth + (K2 * bandwidth) / (256 - load) + K3 * delay] * [K5 / (reliability + K4)]) * 256
```

with the scaled inputs `bandwidth = (10000000 / bandwidth(i)) * 256`, where bandwidth(i) is the least bandwidth of all outgoing interfaces on the route in kilobits, and `delay = delay(i) * 256`, where delay(i) is the sum of the configured interface delays in tens of microseconds.

The defaults are K1 = 1, K2 = 0, K3 = 1, K4 = 0, K5 = 0. With K5 = 0 the reliability term drops out, and for default behavior the formula simplifies to `metric = bandwidth + delay`. So by default EIGRP is a minimum-bandwidth-plus-total-delay protocol, and the load and reliability terms are dead weight in the equation.

Leave them dead. Cisco's guidance is that EIGRP uses the minimum bandwidth on the path and the total delay to compute routing metrics, and it is not recommended that you configure other metrics because it can cause routing loops in your network. Load and reliability are time-varying, and a metric that changes on its own turns the feasibility condition's historical FD into a moving target.

One arithmetic detail that will make your hand calculation disagree with the box: the delay shown in `show ip eigrp topology` or `show interface` is in microseconds, so you must divide by 10 before using it in the formula. And Cisco routers [[cs/standards/ieee-754-floating-point|do not perform floating point math]], so at each stage in the calculation you round down to the nearest integer.

## Related Notes

- [[cs/cisco/ospf-fundamentals|OSPF Fundamentals]] - the link-state alternative, and the contrast in how each treats a timer mismatch
- [[cs/cisco/static-routing-and-administrative-distance|Static Routing and Administrative Distance]] - internal EIGRP at 90 and external at 170, the values a floating static must clear
- [[cs/cisco/bgp-fundamentals|BGP Fundamentals]] - path vector, the third answer to the loop-freedom problem
- [[cs/networking/routing-and-longest-prefix-match|Routing and Longest-Prefix Match]] - what the successor actually installs into
- [[cs/cisco/show-and-debug-methodology|Show and Debug Methodology]] - running a command repeatedly to watch a counter, as the SIA hunt requires

## Sources

- RFC 7868, "Cisco's Enhanced Interior Gateway Routing Protocol (EIGRP)," Savage et al., May 2016. https://www.rfc-editor.org/rfc/rfc7868.txt . Backs the definitions of feasible distance, reported distance, successor, and feasible successor, the Source Node Condition form of the feasibility condition and its sufficient-but-not-necessary character, the passive and active state definitions and the freeze on successor/FD/RD during active state, the note that feasible successors on non-least-cost paths do not affect the state, the UPDATE/QUERY/REPLY message semantics and the SIA-QUERY and SIA-REPLY subtypes with the 90-second half-interval, the SIA definition with Cisco's 3-minute implementation, the diffusing-computation growth and shrink behavior and unaffected-router early termination, the scope control through aggregation and filtering, the K-value equality requirement for neighbor formation, and the default K-values K1 = K3 = 1 with K2, K4, K5, K6 = 0.
- "Understand and Use the Enhanced Interior Gateway Routing Protocol," Cisco (Doc ID 16406). https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/16406-eigrp-toc.html . Backs the RIP 90-to-120-second reconvergence comparison, the topology-table-instead-of-discard model and instant convergence on a feasible successor, Cisco's phrasings of feasible distance, reported distance, and the RD-less-than-FD feasible-successor test with the frame-of-reference note, the `show ip eigrp topology` filtering of non-feasible-successor routes and the `all-links` form, the `show ip eigrp topology active` procedure with the `R` marker and the two-to-three-minute guidance, the SIA session-reset behavior and the `timers active-time` command, the 5-second and 60-second hello intervals with their media lists and the 15-second and 180-second hold times, `ip hello-interval eigrp` and `ip hold-time eigrp`, the warning that hold time is not auto-adjusted, the fact that neighbors form despite mismatched timers, the K-value mismatch consequence, the no-peering-over-secondary-addresses rule, the bandwidth and delay scaling formulas and the composite metric equation, the default K values and the `bandwidth + delay` simplification, the recommendation against configuring other metrics, and the microseconds-divide-by-10 and integer-rounding details.
