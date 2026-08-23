---
title: ASA Failover
description: "Active/standby versus active/active, exactly which state crosses the state link and which does not, and why the failover link failing at startup gives you two active firewalls."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-07-08
updated:
aliases:
  - ASA high availability
  - active/standby failover
  - active/active failover
  - state link
---

A firewall pair is [[cs/systems/distributed-consensus|a distributed system]] with two nodes, a private control channel, and a hard requirement that exactly one of them own each IP address at any moment. Everything unpleasant about ASA failover follows from that framing: partition the control channel and you get a [[cs/systems/cap-theorem|split brain]], replicate the wrong state and connections drop on cutover.

> [!note] The idea
> The ASA splits high availability across two links doing two different jobs. The failover link carries the liveness and configuration channel and is mandatory. The state link carries per-connection state and is optional, which is precisely why "we have failover configured" and "connections survive a failover" are separate claims. Then there is a third question, distinct from both: even with stateful failover on, several specific tables are documented as *not* replicated, and each one is a category of session that will break on cutover no matter how healthy your links are.

## Two modes, one prerequisite

"Configuring failover requires two identical ASAs connected to each other through a dedicated failover link and, optionally, a state link."

**Active/standby.** "One device functions as the Active unit and passes traffic. The second device, designated as the Standby unit, does not actively pass traffic. When a failover occurs, the Active unit fails over to the Standby unit, which then becomes Active." Available "for ASAs in single or multiple context mode."

**Active/active.** "Both ASAs can pass network traffic. Active/Active failover is only available to ASAs in multiple context mode." The unit of failover changes: "you divide the security contexts on the ASA into a maximum of 2 failover groups. A failover group is simply a logical group of one or more security contexts." Failover then "occurs at the failover group level."

Which is genuinely interesting, because the two groups move independently. Cisco spells out the asymmetric case: "it is possible for failover group 1 to fail over to the secondary ASA, and subsequently failover group 2 to fail over to the primary ASA. This event could occur if the interfaces in failover group 1 are down on the primary ASA but up on the secondary ASA, while the interfaces in failover group 2 are down on the secondary ASA but up on the primary ASA."

Two placement rules worth knowing before you design contexts: "The admin context is always a member of failover group 1. Any unassigned security contexts are also members of failover group 1 by default." And Cisco's own shortcut for people who want active/active without caring about multi-context: "the simplest configuration would be to add one additional context and assign it to failover group 2."

> [!warning] Active/active is not double capacity
> "When configuring Active/Active failover, make sure that the combined traffic for both units is within the capacity of each unit." Both groups can land on one box. Size for the failure case, not the steady state.

Both modes support either stateless or stateful failover.

## What each link carries

The **failover link** is the liveness and control channel. The documented payload: "The unit state (active or standby)," "Hello messages (keep-alives)," "Network link status," "MAC address exchange," and "Configuration replication and synchronization."

It cannot be shared with data. "You can use an unused data interface (physical, subinterface, or EtherChannel) as the failover link; however, you cannot specify an interface that is currently configured with a name." Further, "the ASA does not support sharing interfaces between user data and the failover link. You also cannot use separate subinterfaces on the same parent for the failover link and for data."

The **state link** is what makes failover stateful. "To use Stateful Failover, you must configure a Stateful Failover link (also known as the state link) to pass connection state information." For long-distance pairs there is a documented latency budget: "the state link latency should be less than 10 milliseconds but no more than 250 milliseconds. If latency exceeds 10 milliseconds, performance might degrade due to retransmission of failover messages."

> [!warning] Clear text by default
> "All information sent over the failover and state links is sent in clear text unless you secure the communication with an IPsec tunnel or a failover key. If the ASA is used to terminate VPN tunnels, this information includes any usernames, passwords and preshared keys used for establishing the tunnels." Cisco's recommendation is explicit for VPN-terminating boxes: secure it with an IPsec tunnel or a failover key. See [[man-in-the-middle-attacks|man-in-the-middle attacks]] for what an attacker on that segment gets for free.

## Topology, and the split brain

The topology guidance is the most operationally load-bearing paragraph in the chapter, because getting it wrong produces the worst possible outcome:

> "If a single switch or a set of switches are used to connect both failover and data interfaces between two ASAs, then when a switch or inter-switch-link is down, both ASAs become active."

So: "We recommend that failover links NOT use the same switch as the data interfaces. Instead, use a different switch or use a direct cable to connect the failover link." The more general principle: "failover links and data interfaces travel through different paths to decrease the chance that all interfaces fail at the same time."

Direct cabling has its own cost, stated honestly: "If you do not use a switch between the units and the interface fails, the link is brought down on both peers. This condition may hamper troubleshooting efforts because you cannot easily determine which unit has the failed interface and caused the link to come down." Cable choice is a non-issue: "The ASA supports Auto-MDI/MDIX on its copper Ethernet ports, so you can either use a crossover cable or a straight-through cable."

Failure of the failover link itself is handled differently depending on when it happens, and the difference is the split brain:

| Event | Result |
|---|---|
| Failover link fails during operation | "No failover." Both units mark the failover link as failed. "You should restore the failover link as soon as possible because the unit cannot fail over to the standby unit while the failover link is down." |
| Failover link fails at startup | "If the failover link is down at startup, both units become active." |
| State link fails | "No failover," "no action." But "state information becomes out of date, and sessions are terminated if a failover occurs." |

A failed state link is silent. Nothing fails over, nothing alarms about traffic, and the pair quietly degrades to stateless failover until someone tries to use it.

## What state actually crosses

This is the list to keep. For stateful failover, these types "are passed to the standby device":

- NAT translation table
- "TCP and UDP connections and states. Other types of IP protocols, and ICMP, are not parsed by the active unit, because they get established on the new active unit when a new packet arrives."
- The HTTP connection table (unless HTTP replication is enabled), and the HTTP connection states if it is
- SCTP connection states, where "SCTP inspection stateful failover is best effort"
- The ARP table
- The Layer 2 bridge table (for bridge groups)
- The ISAKMP and IPsec SA table
- GTP PDP connection database
- SIP signaling sessions and pin holes
- ICMP connection state, but only conditionally: "ICMP connection replication is enabled only if the respective interface is assigned to an asymmetric routing group"
- Static and dynamic routing tables

Three qualifiers on that list are worth more than the list itself.

**HTTP replication is off by default.** "By default, the ASA does not replicate HTTP session information when Stateful Failover is enabled. We suggest that you enable HTTP replication." A default-configured stateful pair drops HTTP connection state on cutover.

**Only established connections replicate.** "From all the connections, only established ones will be replicated on the Standby device."

**Routing replication has a convergence dance.** "Stateful Failover participates in dynamic routing protocols, like OSPF and EIGRP, so routes that are learned through dynamic routing protocols on the active unit are maintained in a Routing Information Base (RIB) table on the standby unit." After failover, "the re-convergence timer starts on the newly active unit. Then the epoch number for the RIB table increments. During re-convergence, OSPF and EIGRP routes become updated with a new epoch number. Once the timer is expired, stale route entries (determined by the epoch number) are removed from the table." One caveat that reads like a bug and is not: "Routes are synchronized only for link-up or link-down events on an active unit. If the link goes up or down on the standby unit, dynamic routes sent from the active unit may be lost. This is normal, expected behavior."

And the short, high-value list of what does **not** cross: "the user authentication (uauth) table" and "multicast routing." Also "DHCP address leases are not replicated," though Cisco argues the impact is nil because "a DHCP server configured on an interface will send a ping to make sure an address is not being used before granting the address to a DHCP client."

Under stateless failover, the behavior is exactly what the name promises: "When a failover occurs, all active connections are dropped. Clients need to reestablish connections when the new active unit takes over."

## Addresses at cutover

The design goal is that the network never notices. "When a failover occurs, the new active unit takes over the active IP addresses and MAC addresses. Because network devices see no change in the MAC to IP address pairing, no ARP entries change or time out anywhere on the network." For active/standby specifically, "the active unit always uses the primary unit's IP addresses and MAC addresses."

The case that breaks it, and the reason virtual MAC addresses exist:

> "If the secondary unit boots without detecting the primary unit, then the secondary unit becomes the active unit and uses its own MAC addresses, because it does not know the primary unit MAC addresses. When the primary unit becomes available, the secondary (active) unit changes the MAC addresses to those of the primary unit, which can cause an interruption in your network traffic."

Hence: "We recommend that you configure the virtual MAC address on both the primary and secondary units to ensure that the secondary unit uses the correct MAC addresses when it is the active unit, even if it comes online before the primary unit. If you do not configure virtual MAC addresses, you might need to clear the ARP tables on connected routers to restore traffic flow." One sharp edge in that recovery: "The ASA does not send gratuitous ARPs for static NAT addresses when the MAC address changes, so connected routers do not learn of the MAC address change for these addresses." See [[asa-nat|NAT on the ASA]] and [[arp-and-mac-addressing|ARP and MAC addressing]].

The standby IP address is technically optional and practically not: "Without a standby IP address, the active unit cannot perform network tests to check the standby interface health; it can only track the link state. You also cannot connect to the standby unit on that interface for management purposes."

The state link is the exception to all of this: "The IP address and MAC address for the state link do not change at failover."

## How a failure is detected

Unit health rides the failover link. "The ASA determines the health of the other unit by monitoring the failover link with hello messages. If a unit does not receive three consecutive hello messages on the failover link, the sends LANTEST messages on each data interface, including the failover link, to validate whether the peer is responsive." The three outcomes:

- Response on the failover link: no failover.
- No response on the failover link but a response on a data interface: no failover, and "the failover link is marked as failed."
- No response on any interface: "the standby unit switches to active mode and classifies the other unit as failed."

Interface health is separate. "You can monitor up to 1025 interfaces (in multiple context mode, divided between all contexts)." When a unit "does not receive hello messages on a monitored interface for 15 seconds (the default), it runs interface tests," which run in a fixed sequence: Link Up/Down, then Network Activity, then ARP, then Broadcast Ping. The escalation is designed to distinguish "this interface is dead" from "this segment is quiet," and it terminates only on evidence: "If both units continue to receive no traffic from the ARP and Broadcast Ping tests, then these tests will continue running in perpetuity."

The comparative rule is what triggers the switch: "If the threshold you define for the number of failed interfaces is met, and the active unit has more failed interfaces than the standby unit, then a failover occurs." A symmetric failure counts for nothing: "If an interface fails on both units, then both interfaces go into the 'Unknown' state and do not count towards the failover limit."

> [!warning] One interface down fails the pair by default
> "By default, failure of a single interface causes failover." Adjust with `failover interface-policy num [%]`, for example `failover interface-policy 20%`. The bounds: "When specifying a specific number of interfaces, the num argument can be from 1 to 250. When specifying a percentage of interfaces, the num argument can be from 1 to 100." On a box with a dozen monitored interfaces, the default means any single flapping link takes the pair through a cutover.

Detection is not instant. For an active unit that "loses power, hardware goes down, or the software reloads or crashes," the documented ASA detection window is a minimum of 800 milliseconds, a default of 15 seconds, and a maximum of 45 seconds. A main board interface link-down is 500 milliseconds minimum, 5 seconds default, 15 seconds maximum. An interface that is up but has a connection problem triggering interface testing is 5 seconds minimum, 25 seconds default, 75 seconds maximum. Manual action skips all of it: "If you manually fail over using the CLI or ASDM, or you reload the ASA, the failover starts immediately and is not subject to the timers listed."

## Configuration replication

"In Active/Standby failover, configurations are always synchronized from the active unit to the standby unit." The standby's config is discarded on join: "When the standby/second unit completes its initial startup, it clears its running configuration (except for the `failover` commands needed to communicate with the active unit), and the active unit sends its entire configuration to the standby/second unit." You will see "Beginning configuration replication: Sending to mate" and "End Configuration Replication to mate" on the active console, and replication "can take from a few seconds to several minutes."

Two things to internalize. Replicated config "exists only in running memory" on the receiving unit, so it still needs saving to flash. And during replication, hands off: "commands entered on the unit sending the configuration may not replicate properly to the peer unit, and commands entered on the unit receiving the configuration may be overwritten by the configuration being received."

After startup, "commands that you enter on the active unit are immediately replicated on the standby unit. You do not have to save the active configuration to flash memory to replicate the commands." Replicated: "All configuration commands except for `mode`, `firewall`, and `failover lan unit`," plus `copy running-config startup-config`, `delete`, `mkdir`, `rename`, `rmdir`, and `write memory`. Not replicated: all other forms of `copy` and `write`, plus `debug`, `failover lan unit`, `firewall`, `show`, and `terminal pager` / `pager`.

Some things replication never covers, and these are the ones that bite during a VPN cutover: "Configuration syncing does not replicate the following files and configuration components, so you must copy these files manually so they match: AnyConnect Client images, CSD images, AnyConnect Client profiles, Local Certificate Authorities (CAs), ASA images, ASDM images."

> [!example] Bridge groups and the STP blackhole
> A bridge-group pair fails over cleanly and traffic still stops for half a minute. Cisco documents the mechanism: "When the active unit fails over to the standby unit, the connected switch port running Spanning Tree Protocol (STP) can go into a blocking state for 30 to 50 seconds when it senses the topology change." The two documented fixes depend on switch port mode. On an access port, enable PortFast on the switch (`spanning-tree portfast` under the interface), which "immediately transitions the port into STP forwarding mode upon linkup." On a trunk port, block BPDUs on the ASA with an EtherType access rule (`access-list id ethertype deny bpdu`, applied inbound on both member interfaces), with the warning attached: "Blocking BPDUs disables STP on the switch. Be sure not to have any loops involving the ASA in your network layout." See [[portfast-and-bpdu-guard|PortFast and BPDU Guard]] and [[spanning-tree-protocol|Spanning Tree Protocol]].

## Related Notes

- [[asa-security-levels|ASA Security Levels]] - the interface model both units share
- [[asa-nat|NAT on the ASA]] - the translation table that rides the state link, and the static-NAT gratuitous-ARP gap
- [[asa-modular-policy-framework|ASA Modular Policy Framework]] - connection state that service policies create
- [[spanning-tree-protocol|Spanning Tree Protocol]] - the convergence delay a bridge-group failover triggers
- [[portfast-and-bpdu-guard|PortFast and BPDU Guard]] - the documented access-port workaround
- [[arp-and-mac-addressing|ARP and MAC Addressing]] - why MAC continuity is what makes cutover invisible
- [[ospf-and-link-state-routing|OSPF and Link-State Routing]] - the protocol whose RIB is re-converged after failover
- [[man-in-the-middle-attacks|Man-in-the-Middle Attacks]] - the threat against a clear-text failover link

## Sources

- Cisco, "CLI Book 1: Cisco ASA Series General Operations CLI Configuration Guide, 9.17 - Failover for High Availability." https://www.cisco.com/c/en/us/td/docs/security/asa/asa917/configuration/general/asa-917-general-config/ha-failover.html . Backs the two-identical-ASAs plus dedicated failover link and optional state link requirement, the active/standby and active/active definitions and their context-mode constraints, failover groups and group-level failover including the asymmetric example, the admin context and unassigned contexts defaulting to group 1, the one-extra-context shortcut, the combined-capacity warning, the failover link data list, the prohibition on sharing an interface or parent subinterface with data, the state link requirement for stateful failover and its 10 to 250 millisecond latency guidance, the clear-text warning and IPsec/failover-key recommendation, the single-switch split-brain scenario and the different-switch or direct-cable recommendation, the direct-cable troubleshooting caveat and Auto-MDI/MDIX support, the failover-link and state-link failure outcomes including both units becoming active if the link is down at startup, the full list of replicated state types and their qualifiers, HTTP replication being off by default, only established connections replicating, the RIB epoch re-convergence behavior and the standby link-event caveat, the unreplicated uauth table and multicast routing, unreplicated DHCP leases and the ping mitigation, stateless failover dropping all active connections, IP and MAC takeover behavior, the secondary-boots-alone MAC problem and virtual MAC recommendation, the static-NAT gratuitous-ARP gap, the consequences of omitting a standby IP address, the state link addresses not changing at failover, unit health monitoring via three missed hellos and LANTEST with its three outcomes, the 1025 monitored interface limit, the 15 second default before interface tests, the four-test sequence and its perpetual-retry behavior, the more-failed-interfaces comparison and Unknown-state exclusion, the single-interface default and the `failover interface-policy num [%]` command with its 1 to 250 and 1 to 100 ranges, the ASA failover-time minimum/default/maximum rows, the manual-failover timer exemption, running configuration replication from active to standby with the console messages and running-memory caveat, the do-not-type-during-replication warning, immediate command replication after startup, the replicated and non-replicated command lists, the unreplicated file list, and the bridge-group STP blocking behavior with the PortFast and EtherType-deny-BPDU workarounds.
