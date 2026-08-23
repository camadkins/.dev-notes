---
title: "ISO/IEC/IEEE 29148 and What Makes a Requirement Good"
description: "The requirements standard that replaced IEEE 830 by changing the question: from what sections belong in a specification document to what properties a single requirement statement has to hold."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-07-21
updated:
aliases:
  - ISO 29148
  - IEEE 29148
  - Requirements Engineering Standard
---

For twenty-seven years the answer to "how do I write requirements" was a document template. IEEE 830 gave you an outline: purpose, overall description, external interfaces, performance, design constraints, and so on down the tree. Fill the sections, ship the specification. The standard that replaced it kept a template but moved the center of gravity somewhere else entirely, and the move is the interesting part.

> [!note] The idea
> 29148 shifted the unit of quality from the *document* to the *sentence*. It defines the construct of a good requirement and enumerates characteristics that apply to one requirement statement at a time, plus a separate set that applies to a collection. Most of those characteristics are negative constraints: do not describe two things, do not encode an implementation, do not use a word nobody can test. The standard is, in effect, a formalization of the review comments a good systems engineer was already writing in the margin, which is why it reads less like a specification and more like a checklist with authority.

## What it replaced

The IEEE Standards Association is direct about the succession: 29148 "replaces IEEE 830-1998, IEEE 1233-1998, IEEE 1362-1998." Three documents became one. The lineage of the first is the longest. The purpose and content of software requirement specifications was formalized in 1983 by the IEEE, published in 1984 as IEEE 830-1984 and approved by ANSI, and revised in 1993 and 1998 before being superseded by an international standard. That standard aimed at providing criteria for a good specification document and recommendations about its content.

ISO/IEC/IEEE 29148 superseded IEEE 830 in 2011, and the current revision is from 2018. It is broader than what it replaced: it covers requirement quality criteria, requirements management processes, and both a business requirements specification and a stakeholder requirements specification, not only the software requirements specification. So the three-document merger was not consolidation for its own sake. It reflected a view that a software requirements specification is one artifact in a chain that starts with a business need, and that specifying the chain matters more than perfecting one link.

## What the standard says it does

The scope statement is worth reading slowly, because each clause names a different kind of content. The standard "contains provisions for the processes and products related to the engineering of requirements for systems and software products and services throughout the life cycle." Processes and products: activities to perform, and artifacts to produce. Then the sentence that carries the payload: it "defines the construct of a good requirement, provides attributes and characteristics of requirements, and discusses the iterative and recursive application of requirements processes throughout the life cycle."

*The construct of a good requirement.* Not the structure of a good document. That phrase is the hinge between 830 and 29148.

The standard is also designed to be bolted onto something else. It provides additional guidance for requirements-related activities in ISO/IEC 12207 and ISO/IEC 15288, and its content can be added to the existing set of requirements-related life cycle processes those standards define, or used independently. That composability is the same design as the rest of the family: [[cs/standards/ieee-12207-software-life-cycle|12207]] declares process groups and leaves the detailed treatment of any one process to a companion standard.

## The nine characteristics

29148:2018 defines nine characteristics for individual software requirements, describing the capabilities, characteristics, constraints, and quality factors of a software system. Read them in a group and the pattern is unmistakable.

- **Necessary.** The requirement defines an essential aspect of the system and cannot be removed without causing a deficiency.
- **Appropriate.** The level of abstraction is adequate, excludes unnecessary constraints, and avoids implementation details.
- **Unambiguous.** The requirement is clearly stated, understandable, and allows only one interpretation.
- **Complete.** All information needed to understand the requirement is included in the description.
- **Singular.** The requirement defines only one aspect of the system.
- **Feasible.** The requirement is realizable within the given system constraints considering an acceptable risk.
- **Verifiable.** The requirement is formulated in a way that its fulfillment can be proven or, at best, measured.
- **Correct.** The need is accurately represented in the requirement.
- **Conforming.** The representation of the requirement follows an approved standard template.

Three of these do most of the work in practice. *Appropriate* is the anti-design clause: the moment a requirement says how, it has constrained the solution space before anyone evaluated alternatives, which is the same discipline that separates a good interface contract from an implementation leak in [[cs/software-engineering/api-design|API design]]. *Singular* is the anti-conjunction clause: a requirement containing "and" usually cannot be verified as a unit, because half of it can pass. *Verifiable* is the one that kills adjectives. "The system shall be user-friendly" fails, not because it is a bad goal, but because no test distinguishes a system that meets it from one that does not.

The standard also specifies characteristics for *sets* of requirements, which are different properties entirely: a set can be complete, consistent, and feasible in ways no individual statement can be. A requirement that is singular, unambiguous, and verifiable can still contradict the requirement three pages later, and only the set-level criteria catch that.

> [!example] Applying the list to one sentence
> Take: "The system shall encrypt sensitive data quickly using AES-256." *Singular* fails, because it requires both encryption and a performance property. *Verifiable* fails on "quickly," which names no threshold and no measurement. *Appropriate* fails on "AES-256," which is an implementation decision smuggled into a requirement. *Unambiguous* fails on "sensitive data," which is undefined here. One sentence, four violations, and every one of them would have been caught by a reviewer reading down the checklist. That is the whole value proposition: the standard turns tacit review judgment into something a new engineer can execute, which is why it pairs naturally with a disciplined [[cs/software-engineering/code-review|review practice]] rather than replacing it.

The word "shall" in that example is not an accident either. Requirements standards and the standards that publish them share a vocabulary, where a small set of modal verbs carries the entire binding force of a document. That convention is the subject of [[cs/standards/normative-versus-informative-and-the-word-shall|normative versus informative text]], and it is why a requirements review that ignores which verb was used is not a review at all.

> [!warning] What is sourced here and what is not
> The scope statements and succession history come from the IEEE Standards Association record and a public summary. The nine characteristics and their one-line definitions are taken from a peer-reviewed conference paper that tabulates them from the 2018 edition, not from the standard text, which is paywalled. The names and the substance are reliable; exact clause wording in the standard may differ from the summaries quoted here, and this note does not cover the standard's information-item templates or its requirements-management process detail.

## Related Notes

- [[cs/standards/ieee-12207-software-life-cycle|ISO/IEC/IEEE 12207]] - the process framework 29148 plugs into
- [[cs/standards/ieee-1012-verification-and-validation|IEEE 1012]] - what "verifiable" turns into once a project has to prove it
- [[cs/software-engineering/testing-strategies|Testing Strategies]] - the practical meaning of a requirement being provable or measurable
- [[cs/software-engineering/api-design|API Design]] - the same fight against implementation detail leaking into a contract
- [[cs/standards/normative-versus-informative-and-the-word-shall|Normative Versus Informative]] - why the modal verb in a requirement is load-bearing

## Sources

- IEEE SA, "IEEE/ISO/IEC 29148-2011, Systems and software engineering, Life cycle processes, Requirements engineering." https://standards.ieee.org/ieee/29148/5289/ . Backs the replacement of IEEE 830-1998, 1233-1998, and 1362-1998, the scope statement about processes and products, the phrase defining the construct of a good requirement, the guidance relationship to 12207 and 15288, and the supersession by 29148-2018.
- "Software requirements specification," Wikipedia. https://en.wikipedia.org/wiki/Software_requirements_specification . Backs the 1983 formalization and 1984 publication of IEEE 830, its 1993 and 1998 revisions, its aim of providing criteria for a good specification, the 2011 supersession and 2018 revision, and the broadened scope covering quality criteria, management processes, BRS, and StRS.
- S. Lubos, A. Felfernig, T. N. T. Tran et al., "Leveraging LLMs for the Quality Assurance of Software Requirements," arXiv:2408.10886. https://arxiv.org/pdf/2408.10886v1.pdf . Backs the count of nine characteristics for individual requirements, the one-line definition of each, and the existence of a separate set of characteristics for collections of requirements.
