---
title: "IEEE 802.1D and Spanning Tree"
description: "The bridging standard that started as a published paper, deleted its own headline protocol in 2004, and no longer exists as a separate document; plus the timer fields whose units are 1/256 of a second."
draft: false
comments: true
tags:
  - cs
  - standards
  - networking
date: 2026-07-17
updated:
aliases:
  - 802.1D
  - 802.1w
  - MAC Bridges
---

There is a standard everyone cites, whose headline protocol was deleted from it in 2004, and which as a separate document no longer exists at all. Vendor documentation still says 802.1D on every page. The gap between what people cite and what is currently normative is unusually wide here, and the reasons are instructive about how standards bodies handle a protocol that has been superseded but cannot be turned off.

> [!note] The idea
> 802.1D is the clearest case in the 802 family of a standard **outliving its own content**. It started as an IEEE encoding of a published algorithm, was extended by an amendment that made the original protocol obsolete, had that original protocol removed from its own next revision, and was finally absorbed into 802.1Q. Every step is a normal maintenance action, and the cumulative result is that the document name everyone uses points at nothing current.

## The algorithm arrived before the standard

The unusual thing about 802.1D is that the technical work was done outside the committee and published first. "The first Spanning Tree Protocol was invented in 1985 at the Digital Equipment Corporation by Radia Perlman," and "In 1990, the IEEE published the first standard for the protocol as 802.1D," based on her algorithm. Five years between the algorithm and the standard.

The standardization was not a transcription. "The original Perlman-inspired Spanning Tree Protocol, called DEC STP, is not a standard and differs from the IEEE version in message format as well as timer settings." The committee changed the wire format and the timers. That single sentence is the best available answer to the question of where the standard's numbers came from: they were a committee's choice, not a derivation from the algorithm, and the vendor implementation that preceded the standard used different ones. Bridges that implemented both coexisted awkwardly for years.

The underlying computation is the graph problem it sounds like, a distributed construction of [[cs/dsa/minimum-spanning-trees-kruskal-prim|a spanning tree over a graph of bridges]] with the twist that no node has the graph, every node learns only from its neighbors, and the tree must be recomputed continuously as links fail.

## What 802.1w changed, and the clause that deleted a protocol

"In 2001, the IEEE introduced Rapid Spanning Tree Protocol (RSTP) as IEEE 802.1w." The stated improvement is convergence: "RSTP provides significantly faster recovery in response to network changes or failures, introducing new convergence behaviors and bridge port roles to do this," and critically "RSTP was designed to be backwards-compatible with standard STP." Backward compatibility is what let it be deployed at all, since a switched network is upgraded one box at a time.

Then the amendment consumed its parent. "RSTP was then incorporated into IEEE 802.1D-2004, making the original STP standard obsolete."

The conformance clause that resulted deserves reading slowly, because it is a standards body doing something it rarely does. From 802.1D-2004: "Since the original Spanning Tree Protocol (STP) has been removed from the 2004 revision of IEEE Std 802.1D, an implementation of RSTP is required for any claim of conformance" for an implementation referring to that revision.

Removed. Not deprecated, not marked obsolete, removed, and conformance redefined so that implementing the old protocol no longer counts. Compare that with 802.3, which still carries CSMA/CD decades after full duplex made it irrelevant. The difference is that RSTP was designed to interoperate with STP on the wire, so the committee could delete the old specification without stranding the installed base: a conforming RSTP bridge already knows how to talk to a legacy one. Deletion is only available when the replacement subsumes the original's behavior at the interface. That is a general rule worth carrying, and it is the same reason [[cs/software-engineering/semantic-versioning|a breaking change is cheap only when a compatibility path exists]].

## Where the document went

The final move erased the document. "The functionality of spanning tree (802.1D), rapid spanning tree (802.1w), and Multiple Spanning Tree Protocol (802.1s) has since been incorporated into IEEE 802.1Q-2014."

So today the normative text for bridging and spanning tree is inside 802.1Q, the VLAN standard. There is no current 802.1D to buy. Anyone specifying "compliant with IEEE 802.1D" in a procurement document in the last decade has written a requirement against a document that has been folded into another one, which is exactly the failure mode described in [[cs/standards/amendments-revisions-and-rollups|the note on rollups]].

> [!warning] What this note does not cover
> The derivation of the default timer values (forward delay, max age, hello time) lives in the standard's own text, which is not public. What is quotable is that the defaults are distributed by the root bridge rather than configured per switch, and that DEC STP used different ones.

## Two field-level details

**The timers are a wire format, not a config setting.** Max Age, Hello Time and Forward Delay each occupy two bytes in the BPDU, and each is expressed "In 1/256 secs." A 16-bit fixed-point number with a 1/256 second quantum, chosen in 1990 and still on the wire. The values are propagated from the root: "The time spent in the listening and learning states is determined by a value known as the forward delay (default 15 seconds and set by the root bridge)." Timers are a property of the tree, not of the switch, which is why changing them on one box does nothing and changing them on the root changes convergence everywhere.

**The bridge priority field was quietly repartitioned.** "Prior to IEEE 802.1D-2004, the first two bytes gave a 16-bit bridge priority," but "Since IEEE 802.1D-2004, the first four bits are a configurable priority, and the last twelve bits carry the bridge system ID extension." Twelve bits of what used to be priority were reassigned to carry an instance or VLAN identifier, which is what makes per-VLAN spanning trees expressible in a field that was never designed for them. It also means bridge priority is now settable only in steps of 4096, a constraint every network engineer meets without knowing why.

The Protocol ID field is a small monument to the same history: it "is set to 0x0000 for all BPDUs and represents 802.1D." Every BPDU on every modern switched network still opens by naming a standard that no longer exists as a separate document.

## Where the standard loses to implementations

802.1D also supplies a clean example of a normative rule that vendors simply did not follow. The original standard envisioned a root bridge with more than one port on the same segment, specifying that the lowest port ID becomes designated and the others block. In practice, "Not all bridge manufacturers follow that rule; some make all ports designated ports and put them all into forwarding mode." A conformance divergence that lived for years because the scenario is rare and the consequences were tolerable. Standards are only as strong as the tests people run against them, which is the argument of [[cs/software-engineering/testing-strategies|any serious testing strategy]] applied to a document instead of a codebase.

## Related Notes

- [[cs/cisco/spanning-tree-protocol|Spanning Tree Protocol]] for how the protocol behaves and what breaks it in a real network.
- [[cs/standards/ieee-802-1q-vlan-tagging|IEEE 802.1Q, VLAN Tagging as Specified]] for the standard that absorbed 802.1D in 2014.
- [[cs/standards/amendments-revisions-and-rollups|Amendments, Revisions, and Rollups]] for why citing a folded-in document is a trap.
- [[cs/dsa/minimum-spanning-trees-kruskal-prim|Minimum Spanning Trees, Kruskal and Prim]] for the graph problem the protocol solves without a global view.
- [[cs/cisco/portfast-and-bpdu-guard|PortFast and BPDU Guard]] for the vendor features built around the forward-delay cost.
- [[cs/software-engineering/testing-strategies|Testing Strategies]] for why an unenforced clause becomes an optional one.

## Sources

- [Spanning Tree Protocol (Wikipedia)](https://en.wikipedia.org/wiki/Spanning_Tree_Protocol) backs Perlman's 1985 invention, the 1990 publication of 802.1D, the divergence of DEC STP in message format and timers, 802.1w in 2001 and its incorporation into 802.1D-2004, the removal of STP and the RSTP conformance requirement, the 802.1Q-2014 absorption, the BPDU timer fields and their 1/256 second units, the forward delay default set by the root bridge, the bridge ID repartitioning, and the designated-port rule vendors ignore.
- [IEEE 802.1Q (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.1Q) backs the 2014 revision incorporating 802.1D-2004.
