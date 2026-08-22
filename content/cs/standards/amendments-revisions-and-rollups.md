---
title: Amendments, Revisions, and Rollups
description: "Why 802.11 has letters after it, what a revision rolls up, and the practical skill of working out which document is actually current when the amendment you need was folded into a base standard years ago."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-07-11
updated:
aliases:
  - Standards Amendments
  - Rollup Revision
  - REVma
---

People say 802.11n and 802.11ac as though those documents sit on a shelf. They do not. Both were amendments, both were folded into a base standard, and citing them today is like citing a patch instead of the release that contains it. The letters are real, they were once separate documents, and the reason they behave this way is a maintenance policy with a clock attached.

> [!note] The idea
> An IEEE standard is a **living document with an expiry date**, maintained by amendments that patch it and revisions that consolidate it. The lettered names everyone uses are the patches. The thing you should actually be reading is the most recent rollup revision, because after a rollup the amendment no longer exists as an independent specification and its clause numbers have usually moved.

## The ten-year clock

The policy that drives everything else is simple and mechanical. "A standard has a validity period of ten years from the date of IEEE SA Standards Board approval." At the end of that window, "one of two things must happen: revision or withdrawal," and "If no action is taken, the standard will be moved to inactive-reserved status."

That clock is the reason standards work never finishes. A working group that stops meeting does not leave a stable standard behind; it leaves one drifting toward inactive-reserved. Maintenance is not optional stewardship, it is what keeps the document citable.

Between revisions the group patches. "Amendments that offer minor revisions or extensions to the standard, and corrigenda that makes corrections to the standard can be developed and balloted, but the creation of amendments and corrigenda does not affect the ten-year validity rule." An amendment adds or changes normative content. A corrigendum fixes an error that was never meant to be there. Neither restarts the clock, which is the pressure that eventually forces a consolidating revision.

## Three project types, visible in the PAR

The distinction is declared before any text is written. IEEE 802 publishes its pending projects with their type on the face of the line: "P802.1AEef - Amendment - Ascon Cipher Suite" against "802.3du - Revision - Standard for Ethernet (Revision)". Amendment, revision, standard, recommended practice. The type determines what the deliverable is and how it will be published, so a reader who understands the type already knows whether the output will stand alone or arrive as a set of edits to something else.

The lettering follows from the type. Lowercase suffixes mark amendments; uppercase ones mark documents that stand on their own. In 802.11 that convention is explicit: "802.11F and 802.11T are recommended practices rather than standards and are capitalized as such." So 802.11n is an amendment, and 802.11F was a standalone recommended practice, which is a distinction invisible to anyone reading the names as a flat list of features.

Both of those uppercase documents are also cautionary. 802.11F, the "Inter-Access Point Protocol (2003) Withdrawn February 2006," is a published IEEE document that no longer has force. A standard can be unpublished. Citing one that has been withdrawn is a real hazard in procurement language and in security baselines, where a requirement can outlive the document it references by a decade.

## What a rollup actually does

A rollup revision merges accumulated amendments into a new base standard. The 802.11 lineage is the clearest worked example in the whole 802 family, because it has done it four times.

In 2003 a task group was authorized to consolidate the amendments to the 1999 base. Working as REVma, it "created a single document that merged 8 amendments" with the base standard, and "Upon approval on 8 March 2007, 802.11REVma was renamed to the then-current base standard IEEE 802.11-2007." Then it happened again: "In May 2007, task group TGmb was authorized to" repeat the exercise, merging ten more amendments into what became 802.11-2012. Then "IEEE 802.11-2016 which was known as IEEE 802.11 REVmc, is a revision based on IEEE 802.11-2012, incorporating 5 amendments," and 802.11-2020 as REVmd did the same again.

The consequential part is what a rollup does beyond merging. In the 2012 revision, "In addition much clean-up was done, including a reordering of many of the clauses." In the later ones, "existing MAC and PHY functions have been enhanced, and obsolete features were removed or marked for removal." A rollup is not a concatenation. Clause numbers move, features get deleted, and text is rewritten for consistency across amendments that were drafted years apart by different people.

> [!warning] Clause citations do not survive a rollup
> A reference of the form "clause 8.4.2 of 802.11-2012" is pinned to that edition and may point at something else entirely in 802.11-2020. Requirements documents, test plans, and security baselines that cite clause numbers must cite the edition too, or they silently rot.

## Working out what is current

Three questions answer it in practice.

Which base edition am I on? Find the most recent rollup revision for the family. For wireless LAN today that lineage runs 802.11-2007, 802.11-2012, 802.11-2016, 802.11-2020, each superseding the last.

Was my amendment rolled in? If the amendment predates the latest revision, it is almost certainly inside it, and the correct citation is the base standard rather than the letter. If it postdates the revision, it is still a live standalone amendment and you need both documents to have the full picture. Amendments are edits, so reading one without its base is genuinely incomplete: it will say things like "change the third paragraph of 9.3.2 to read" and assume you have the paragraph.

Is the document still active? Withdrawn and inactive-reserved are both real states, and neither is visible from the document itself. This is the same lesson as [[cs/software-engineering/semantic-versioning|version numbers that only mean something if the ecosystem honors them]]: the identifier tells you nothing about currency without the registry behind it.

The pattern generalizes past standards bodies. A rollup is a squash, an amendment is a patch against a specific base, and a clause citation is a line number. Anyone who has tried to apply a five-year-old patch to a moved file already knows why [[cs/software-engineering/version-control-fundamentals|patches are brittle against a changed base]], and standards maintenance is the same problem conducted at the pace of ten-year clocks.

## Related Notes

- [[cs/standards/how-ieee-makes-a-standard|How IEEE Makes a Standard]] for the PAR that declares the project type before drafting.
- [[cs/standards/ieee-802-11-wireless-lan|IEEE 802.11, Wireless LAN as a Document]] for the amendment lineage and how it maps to marketing generations.
- [[cs/standards/ieee-802-3-ethernet|IEEE 802.3, Ethernet as a Document]] for a family that absorbs speeds by amendment on the same cycle.
- [[cs/software-engineering/semantic-versioning|Semantic Versioning]] for the same problem in package ecosystems.
- [[cs/software-engineering/version-control-fundamentals|Version Control Fundamentals]] for why a patch against a moved base fails.
- [[cs/security/vulnerability-scoring-cve-and-cvss|Vulnerabilities: CVE and CVSS]] for another identifier whose meaning depends entirely on a registry.

## Sources

- [IEEE Standards Association (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_Standards_Association) backs the ten-year validity period, the revision-or-withdrawal requirement, inactive-reserved status, and the roles of amendments and corrigenda.
- [IEEE 802 PARs under consideration](https://www.ieee802.org/PARs.shtml) backs the amendment and revision project types as declared on live IEEE 802 projects.
- [IEEE 802.11 (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.11) backs the REVma, TGmb, REVmc and REVmd rollups, the clause reordering and feature removal they performed, the capitalization convention for recommended practices, and the withdrawal of 802.11F.
