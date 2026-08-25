---
title: How IEEE Makes a Standard
description: "The PAR, the working group, the self-selected ballot group, and the 75 percent rule: why a process built on a supermajority of volunteers produces documents full of optional features."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-07-02
updated:
aliases:
  - PAR
---

Read enough IEEE standards and a pattern shows up that no technical rationale explains. The contested feature is always optional. Two mechanisms that do the same job both ship, each in its own clause, each conformant. A parameter that could have been fixed at one value is instead a configurable range with a recommended default. None of that is engineering judgment. It falls out of how the document is approved.

> [!note] The idea
> IEEE standards are ratified by a **self-selected ballot group under a double 75 percent rule**: at least 75 percent of ballots must be returned, and at least 75 percent of those returned must approve. A supermajority threshold among voters who chose to be there makes the cheapest path through a technical disagreement not resolution but accommodation, because an optional feature costs a no vote nothing and a mandatory one costs it everything.

## The authority IEEE does and does not have

Start with the awkward fact. "IEEE SA is not a body formally authorized by any government, but rather a community." It is not a treaty organization, it has no regulatory power, and it cannot compel a vendor to do anything. What it has is a process with enough legitimacy that regulators, procurement offices, and customers are willing to reference its output. That legitimacy is the entire product, which is why the procedural rules are enforced with a seriousness that surprises engineers arriving from industry. The volume is real: "Each year, the IEEE SA conducts over 200 standards ballots, a process by which proposed standards are voted upon for technical reliability and soundness."

## The PAR: scope before content

Nothing gets written until a project exists, and a project exists when a Project Authorization Request is approved. "To gain authorization for the standard a Project Authorization Request (PAR) is submitted to the IEEE SA Standards Board," and "The New Standards Committee (NesCom) of the IEEE SA Standards Board reviews the PAR and makes a recommendation to the Standards Board about whether to approve the PAR."

The PAR is the most underrated document in standards work, because it fixes the scope before anyone has written a clause. IEEE 802 publishes its pending PARs openly, and reading the list tells you what the family is about to become: recent entries include "P802.1AEef - Amendment - Ascon Cipher Suite" and "802.3du - Revision - Standard for Ethernet (Revision)". Each line already declares the project's type (standard, amendment, revision, recommended practice) and its subject, and the scope statement inside the PAR bounds what the working group is allowed to specify. A proposal that falls outside the approved scope is out of order regardless of its merit. Engineers who lose a technical argument in a working group have often actually lost a scope argument that was settled months earlier by people who were not in the room.

## The working group, open by rule

Once the PAR clears, the work moves to a working group, and here IEEE's procedural commitment has a sharp edge: "IEEE SA rules ensure that all Working Group meetings are open and that anyone has the right to attend and contribute to the meetings." Openness is not generosity. It is what makes the consensus claim defensible, and a consensus claim that cannot be defended is worthless to the regulator downstream.

The consequence is that a working group is not a design team. It is a standing negotiation among competitors, each carrying a shipping product, a patent portfolio, and a roadmap. A proposal that would obsolete a member's silicon will be opposed on technical grounds, articulately, at length, by people who genuinely believe their reasons. The drafting itself is heavily constrained: "Generally, the draft follows the IEEE Standards Style Manual that sets guidelines for the clauses and format of the standards document," which is where the rigid clause numbering and the controlled vocabulary of `cs/standards/normative-versus-informative-and-the-word-shall` come from.

## The ballot group and the 75 percent rule

This is the step that shapes the text. The ballot group is not the working group and is not appointed. "Anyone who responds positively to the invitation-to-ballot becomes a member of the balloting group, as long as the individual is an IEEE Standards Association member or has paid a balloting fee." Self-selection is the defining property: the electorate is whoever cared enough to opt in, which skews toward the parties with commercial exposure to the outcome.

Then the threshold. "The IEEE requires that a proposed draft of a standard receive a response rate of 75%" of potential ballots, and of the ballots returned at least 75 percent must approve. That is a quorum plus a supermajority, structurally the same shape as the [[cs/systems/replication-and-quorums|quorum rules that govern a replicated data store]], and it has the same consequence: a sufficiently large minority is a veto. A quarter of the returned ballots, coordinated, blocks the document.

Work through the incentive from a voter's seat. You object to a mandatory feature that favors a competitor. Voting no costs you nothing except the effort of a comment, and if enough others agree the draft fails and returns to drafting. The working group, facing a schedule and a chair who wants to ship, has three moves: win the argument, drop the feature, or make it optional. Optional converts your no into an abstain or a yes, because a feature you are not required to implement cannot hurt you. This is why standards accumulate options, and why interoperability so often depends on a profile that reimposes the choices the standard declined to make.

The comment mechanism is the redeeming part. A no vote carries technical comments that the working group must formally address, which functions much like [[cs/software-engineering/code-review|code review at scale]]: an objection is not a veto button but an obligation to answer on the record. Comment resolution is where most of the real engineering in a standards project happens, and it is invisible to anyone reading only the published document.

## Approval and after

Clearing the ballot is not publication. The draft plus its comments go to the Review Committee, which checks the process rather than the technology, and then to the board itself, where "It takes a majority vote of the Standards Board to gain final approval of a standard." A board vote is a procedural gate; by that point the technical content is settled.

Maintenance then runs on a clock. "A standard has a validity period of ten years from the date of IEEE SA Standards Board approval," and "If no action is taken, the standard will be moved to inactive-reserved status." A standard is not permanent by default. Something has to keep pulling it forward, which is the subject of `cs/standards/amendments-revisions-and-rollups`.

> [!tip] Reading a standard against its process
> When a clause looks like an unforced compromise, it usually is one. Two mechanisms where one would do, a parameter left configurable, a feature marked optional with a strong recommendation: each is the visible residue of a bloc that could have withheld a quarter of the returned ballots.

## Related Notes

- [[cs/standards/normative-versus-informative-and-the-word-shall|Normative vs Informative, and the Word Shall]] for the drafting vocabulary the style manual imposes.
- [[cs/standards/amendments-revisions-and-rollups|Amendments, Revisions, and Rollups]] for what the ten-year clock forces.
- [[cs/standards/standards-patents-and-frand|Standards, Patents, and FRAND]] for why ballot-group members have money riding on a clause.
- [[cs/systems/replication-and-quorums|Replication and Quorums]] for the same quorum-plus-supermajority shape in distributed storage.
- [[cs/military-computing/dod-model-and-tcp-ip-standardization|The DoD Model and the TCP/IP Flag Day]] for the opposite approach, where a customer set a date and cut over.
- [[cs/software-engineering/code-review|Code Review]] for the closest everyday analogue to comment resolution.

## Sources

- [IEEE Standards Association (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_Standards_Association) backs the PAR and NesCom step, the open-meeting rule, the style manual, the ballot-group composition, the 75 percent thresholds, the board majority, the annual ballot volume, and the ten-year validity period.
- [IEEE 802 PARs under consideration](https://www.ieee802.org/PARs.shtml) backs the live PAR examples and the project-type labels used by IEEE 802.
