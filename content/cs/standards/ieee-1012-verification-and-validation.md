---
title: "IEEE 1012 and the Integrity Level"
description: "The V and V standard draws a line between two questions that sound identical, then scales the whole effort by how bad the consequences of failure are rather than by how big the project is."
draft: false
comments: true
tags:
  - cs
  - standards
  - testing
date: 2026-08-11
updated:
aliases:
  - IEEE 1012
  - Verification and Validation
---

Verification and validation get taught as a pair of near-synonyms with a mnemonic attached: building the thing right versus building the right thing. The mnemonic is fine as far as it goes, but it hides the part that matters to anyone who has to plan the work, which is that the two questions are asked of different things, by different people, against different evidence. IEEE 1012 is the standard that writes the distinction down and then does something more useful with it.

> [!note] The idea
> The standard defines verification as determining whether the development products of a *given activity* conform to the requirements of *that activity*, and validation as determining whether the product satisfies its *intended use and user needs*. Verification is local and recursive: every activity in the life cycle produces something that gets checked against the inputs to that activity. Validation is global and singular: it asks about the delivered system against a need that exists outside the project. The standard's real contribution is what it does next. V and V life cycle process requirements are specified for different *integrity levels*, so the amount of work is a function of consequence, not of budget or schedule.

## Two questions, one artifact

The formulation is stable across every edition since 1998, and it is worth quoting exactly because the phrasing carries the structure. V and V processes are used to determine whether the development products of a given activity conform to the requirements of that activity, and whether the product satisfies its intended use and user needs.

Read the first clause as a loop. An activity has inputs (requirements, a design, an interface definition) and outputs (a design, code, a build). Verification compares output against input, and it happens at every activity, not once at the end. Read the second clause as a single question that the project cannot answer by itself, because "intended use" lives with the user. This is why a system can be perfectly verified and completely invalid: every artifact matched its predecessor, and the whole chain descended from a misunderstood need. It is also why the [[cs/standards/ieee-29148-requirements-engineering|requirements standard]] makes *verifiable* one of the nine characteristics of a good requirement. If a requirement cannot be proven or measured, verification against it is not a check, it is an opinion.

The methods are broader than testing. V and V processes include the analysis, evaluation, review, inspection, assessment, and testing of products. Testing is one item on a six-item list, and the five that precede it are all static. That ordering is a quiet argument, and it lands in the same place as [[cs/software-engineering/code-coverage-and-its-limits|the limits of coverage]]: execution-based evidence is expensive, arrives late, and answers a narrower question than a careful inspection of a design.

## Integrity levels, the clause that changes the shape of the work

The phrase to hold onto is that requirements are specified for different integrity levels. An integrity level is an assessment of what happens if the thing fails, and 1012 uses it as the dial that sets how much V and V a project owes. High-integrity items get more tasks, more independence, and more rigorous evidence. Low-integrity items get less.

This is a different allocation rule than most engineering practice uses. Teams usually scale test effort by code size, by team size, or by whatever fraction of the schedule survived. Scaling by consequence means that ten thousand lines of telemetry formatting and two hundred lines of interlock logic can sit in the same codebase and carry entirely different obligations, and that the small one costs more to verify. That is exactly the reasoning behind [[cs/military-computing/margaret-hamilton-and-reliable-software|ultra-reliable flight software]], generalized into a document a contract can cite.

It also makes 1012 a risk-allocation standard wearing testing clothes. Deciding the integrity level is the consequential act, and it happens before any V and V task is planned. Get that assignment wrong and every downstream decision inherits the error.

## Scope creep, recorded in the title

Few standards make their own history so legible. The title of each edition tells you what the committee thought the object of study was.

The 1986 edition was *Software Verification and Validation Plans*. Its content matches: uniform and minimum requirements for the format and content of V and V tasks and their required inputs and outputs to be included in a plan, for both critical and noncritical software. A document standard, in other words, and one whose critical-versus-noncritical split is the seed of the integrity-level idea.

The 1998 edition dropped "Plans" and became *Software Verification and Validation*, shifting from what the plan contains to what the processes do. It also widened the frame: V and V processes assess the software in the context of the system, including the operational environment, hardware, interfacing software, operators, and users. The 2004 edition introduced integrity levels explicitly, specifying software V and V life cycle process requirements for different software integrity levels.

The 2012 edition became *System and Software Verification and Validation*, and the 2016 and 2024 editions became *System, Software, and Hardware Verification and Validation*. The scope of V and V processes now encompasses systems, software, and hardware and includes their interfaces, and the definitions sweep in more than the artifact you would name: the term software also includes firmware and microcode, and each of the terms system, software, and hardware includes related information or documentation. The standard applies to items being developed, maintained, or reused, which explicitly covers legacy code, commercial off-the-shelf products, and non-developmental items.

That last inclusion is the one with teeth in acquisition. If a supplier integrates a commercial component into a high-integrity system, 1012 does not let the component's origin exempt it from the V and V obligations attached to its integrity level.

## Where it sits in the family

1012 describes itself as a process standard that addresses all system, software, and hardware life cycle processes, and it names the process groups it covers: Agreement between an acquirer and a supplier, Organizational Project-Enabling, Project, Technical, Software Implementation, Software Support, and Software Reuse. Those are the process groups of [[cs/standards/ieee-12207-software-life-cycle|12207]] and its systems sibling, which is what makes the two documents composable rather than competing. It is also compatible with all life cycle models, though not every model uses every process the standard lists.

> [!example] A corrigendum that never shipped
> IEEE Std 1012-2016 was approved in May 2016 and published in September 2017, with a corrigendum, 1012-2016/Cor 1-2017, that was never published as a separate standard because it was incorporated into 1012-2016 at publication. So a citation to "IEEE 1012-2016" refers to text that already includes a correction with its own designation and abstract, and searching for the corrigendum as a document finds a record rather than a deliverable. 1012-2016 has since been superseded by 1012-2024. Chasing the exact edition a contract binds is not pedantry in this family; it is the only way to know which text you owe.

## Related Notes

- [[cs/standards/ieee-12207-software-life-cycle|ISO/IEC/IEEE 12207]] - the process groups 1012 layers V and V onto
- [[cs/standards/ieee-29148-requirements-engineering|ISO/IEC/IEEE 29148]] - where "verifiable" becomes a property of the requirement itself
- [[cs/software-engineering/testing-strategies|Testing Strategies]] - the one item on the six-method list that most teams treat as the whole list
- [[cs/software-engineering/code-coverage-and-its-limits|Code Coverage and Its Limits]] - why execution evidence answers a narrower question than inspection
- [[cs/military-computing/margaret-hamilton-and-reliable-software|Margaret Hamilton and Ultra-Reliable Software]] - integrity-scaled rigor before it had a standard number

## Sources

- IEEE SA, "IEEE 1012-2016, IEEE Standard for System, Software, and Hardware Verification and Validation." https://standards.ieee.org/ieee/1012/5609/ . Backs the verification and validation definitions, integrity-level scaling, the six V and V methods, the systems-software-hardware scope and its inclusion of firmware, microcode, documentation, legacy, COTS, and non-developmental items, the process-standard self-description and its process groups, compatibility with all life cycle models, the edition history from 1986 through 2024, and the corrigendum absorbed at publication.
- "ISO/IEC 12207," Wikipedia. https://en.wikipedia.org/wiki/ISO/IEC_12207 . Backs verification and validation appearing as separate named technical processes in the life cycle process framework 1012 attaches to.
