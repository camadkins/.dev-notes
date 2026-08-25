---
title: "ISO/IEC/IEEE 42010, the Vocabulary Everyone Borrows"
description: "Stakeholders, concerns, viewpoints, and views. The architecture description standard mandates no viewpoints at all, and the two requirements almost nobody who uses its words actually meets."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-06-30
updated:
aliases: []
---

Open any serious architecture document and you will find the same four words carrying the structure: stakeholders, concerns, viewpoints, views. They come from one standard, and almost none of the documents that use them cite it. That is not plagiarism so much as absorption. The vocabulary turned out to be more useful than the requirements attached to it, so the vocabulary escaped and the requirements stayed behind. Reading what stayed behind is the interesting exercise, because two of those requirements are exactly the ones a borrowed vocabulary cannot enforce.

> [!note] The idea
> 42010 standardizes the *container*, not the content. It requires you to name the stakeholders and their concerns, choose viewpoints that frame those concerns, produce a view satisfying each viewpoint, link the views with correspondences while recording any known inconsistencies between them, and give rationale for key decisions. It requires no particular viewpoint, no notation, and no modeling language. The load-bearing requirements are the last two: correspondences between views, and a written record of where the views disagree. Everyone borrows the first three words. Almost nobody writes down the inconsistencies.

## The four concepts, precisely

The distinction between a view and a viewpoint is the one people get backwards, and the working group states it in one sentence each. An architecture viewpoint is a way of looking at a system. An architecture view is what you see when looking at a system from a chosen viewpoint.

Unpacked: an architecture view is a collection of models representing the architecture of the whole system relative to a set of architectural concerns, and its key idea is that it addresses a specific set of concerns using well-defined notations and models. A viewpoint, by contrast, documents the conventions for constructing, interpreting, and analyzing a particular kind of view, where those conventions include languages, notations, model types, modeling methods, analysis techniques, design rules, and any associated methods.

So the viewpoint is reusable and the view is not. A viewpoint can be written once, put on a shelf, and applied to fifty systems; a view exists only inside one architecture description of one system. When an organization standardizes its architecture practice, what it is actually standardizing is a set of viewpoints, and an integrated set of viewpoints intended for a certain stakeholder community or domain of application is what the standard calls an architecture framework.

Around those sits the object being described. An architecture description expresses the architecture of a system of interest, and it could be a document, a repository, or a collection of artifacts. The architecture itself is defined as what is considered fundamental about that system in the context of its environment, and the whole apparatus exists because the architecture concerns of diverse stakeholders can be addressed by a description built from multiple views, where each view covers an identified set of those concerns.

## No required viewpoints, on purpose

The most common criticism of 42010 is that it mandates nothing concrete, and the working group answers that directly. It was a key decision in the original IEEE 1471 to leave viewpoint selection to users rather than require everyone to adopt the same set, because concerns vary widely from system to system.

This is the right call and it has a real cost. The right call: a safety viewpoint for an avionics box and a data-residency viewpoint for a multi-tenant service are not variants of a common template, and a standard that shipped a fixed list would have been obsolete on arrival or so generic as to be useless. The cost: "we follow 42010" carries no information about what is in your document. It tells you the shape of the argument, not its content.

The gap turns out to be filled by domain standards that are viewpoints in everything but name. [[cs/security/stride-threat-modeling|STRIDE]] is a way of looking at a system, with a notation (a data flow diagram), a model kind, and an analysis technique, framing exactly one concern: what an adversary can do. Under this standard's vocabulary it is an architecture viewpoint, and the reason it composes so cleanly with an architecture description is that the standard left the slot open for it.

## What conformance actually demands

An architecture description conforms if it satisfies the requirements, the "shalls," in clause 5. Those requirements are: identifying the stakeholders of the system and their concerns; choosing and defining viewpoints that frame those concerns; documenting the views such that each satisfies one of those viewpoints; linking the views with correspondences and recording any known inconsistencies between views; and providing rationale for key decisions made in the description.

Read that list against a real architecture document and the failure mode becomes obvious. Most documents do the first three informally and stop. Correspondences, the explicit statement of how an element in the deployment view relates to an element in the logical view, are usually left implicit in shared names. Known inconsistencies are almost never recorded, because writing down that two views of your system disagree feels like admitting a defect rather than documenting a state. Yet that is precisely the clause with engineering value: multiple views of one system will diverge, and an architecture description that names where is more trustworthy than one that pretends it does not happen. The distinction between a clause that says *shall* and a clause that says *should* is the whole basis of that reading, which is the subject of [[cs/standards/normative-versus-informative-and-the-word-shall|normative versus informative text]].

The 2011 revision added two further conformance cases beyond the architecture description, on the theory that the reusable artifacts deserve requirements of their own. It adds definitions and requirements on architecture frameworks and architecture description languages as conformance cases. To conform, an architecture framework must specify the identification of concerns, the identification of stakeholders having those concerns, architecture viewpoints that frame those concerns, and correspondence rules integrating those viewpoints. An architecture description language, defined as any form of expression for use in architecture descriptions, carries a parallel set. A viewpoint can also be specified on its own, as a fourth case, to promote reuse.

> [!example] The lineage in five dates
> The standard began as IEEE 1471, a recommended practice for architectural description of software-intensive systems, which the IEEE Standards Board approved in September 2000. In March 2006 it was adopted as an ISO standard and published in July 2007 as ISO/IEC 42010:2007, with text identical to IEEE 1471:2000. The joint ISO and IEEE revision published in 2011 as ISO/IEC/IEEE 42010 replaced both predecessors, and the second edition was jointly published by ISO and IEEE in November 2022. A document written against 1471 is therefore not automatically conformant to the current edition, since the framework and language conformance cases did not exist when it was drafted.

## Scope, and the family it belongs to

The focus is on three classes of system: software-intensive systems, in which software development or integration is a dominant consideration; general systems as defined in ISO/IEC 15288; and software products and services as defined in ISO/IEC 12207. That triple is the tell. 42010 is a member of the same family as [[cs/standards/ieee-12207-software-life-cycle|the life cycle process standards]], and it exists to give the architecture definition process named there an output format with requirements attached.

The expected scope of the revision put the aim plainly: the standard specifies the manner in which architecture descriptions of systems are organized and expressed, and it specifies architecture viewpoints, architecture frameworks, and architecture description languages for use in those descriptions. Organized and expressed. Not designed, not evaluated, not decided. Everything about how you arrive at a good [[cs/software-engineering/software-architecture|architecture]] is somewhere else; this document governs how you write it down so that someone else can check it.

## Related Notes

- [[cs/software-engineering/software-architecture|Software Architecture]] - the practice this standard only documents rather than prescribes
- [[cs/security/stride-threat-modeling|STRIDE Threat Modeling]] - an architecture viewpoint in everything but name
- [[cs/standards/ieee-12207-software-life-cycle|ISO/IEC/IEEE 12207]] - the process framework whose architecture definition process this feeds
- [[cs/standards/normative-versus-informative-and-the-word-shall|Normative Versus Informative]] - why "the shalls in clause 5" is a complete answer to what conformance means
- [[cs/standards/what-a-standard-actually-is|What a Standard Actually Is]] - a document whose vocabulary escaped its requirements

## Sources

- ISO/IEC/IEEE 42010 website, Frequently Asked Questions. http://www.iso-architecture.org/42010/faq.html . Backs the view and viewpoint definitions, viewpoint conventions, the architecture description and architecture definitions, the key tenets, the deliberate absence of required viewpoints, the five clause-5 requirements, the four conformance cases and the framework and ADL requirements, the three classes of covered system, and the 1471 to 42010 lineage dates.
- ISO/IEC/IEEE 42010 website, home. http://www.iso-architecture.org/42010/ . Backs the second edition being jointly published by ISO and IEEE in November 2022 and the expected scope statement about how architecture descriptions are organized and expressed.
