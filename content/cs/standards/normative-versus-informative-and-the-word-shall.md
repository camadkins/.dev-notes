---
title: Normative vs Informative, and the Word Shall
description: "Shall binds, should recommends, may permits, and an informative annex binds nothing at all: how to read a standard as the contract it is rather than the manual it is not."
draft: false
comments: true
tags:
  - cs
  - standards
date: 2026-06-14
updated:
aliases: []
---

An engineer files a bug against a vendor: your box does not do what the standard says. The vendor reads the clause, notes that it says *should*, and closes the ticket. Both parties are correct, and the argument was never technical. It was about which sentences in a standards document create obligations and which ones do not.

> [!note] The idea
> A standard has a **binding surface** far smaller than its page count. Requirement level is carried by a controlled vocabulary (shall, should, may) inside clauses marked normative, and everything else in the document (informative annexes, notes, examples, rationale) is context with no conformance weight. Learning to see that surface is what separates reading a standard from reading it as though it were documentation.

## The three words that carry the contract

Requirement specifications assign the ordinary English auxiliaries fixed technical meanings. "In many requirement specifications, particularly involving software, the words shall and will have special meanings," and the dominant convention is that "Most requirement specifications use the word shall to denote something that is required, while reserving the will for simple statement about the future."

Across the major bodies the convention is consistent. On ISO, IEC, ASTM and IEEE standards, requirements stated with shall are the mandatory requirements, meaning must, or have to. The IETF says the same thing with different spelling: it "defines shall and must as synonymous terms denoting absolute requirements, and should as denoting a somewhat flexible requirement, in RFC documents."

RFC 2119 is the place to read the semantics precisely, because it is short, free, and states each level as a rule rather than a gloss. MUST, REQUIRED and SHALL "mean that the definition is an absolute requirement of the specification." SHOULD is the interesting one, and the definition is careful: there "may exist valid reasons in particular circumstances to ignore a particular item, but the full implications must be understood and carefully weighed before choosing a different course." A should is not a weak shall. It is a documented licence to deviate, conditional on having thought about it. An implementation that ignores a should is conformant. That is the whole point of the word, and it is why a bug report whose entire argument is that a should was not honored is a category error: it asks the standard to enforce something the standard explicitly declined to enforce.

MAY is weaker still. It and OPTIONAL "mean that an item is truly optional." RFC 2119 spells out the market logic without embarrassment: "One vendor may choose to include the item because a particular marketplace requires it or because the vendor feels that it enhances the product while another vendor may omit the same item."

## The clause that makes optional survivable

An option in a standard is a fork in the population of conforming implementations, and left unqualified it destroys interoperability. RFC 2119 closes that hole with the most load-bearing sentence in the document: "An implementation which does not include a particular option MUST be prepared to interoperate with another implementation which does include the option, though perhaps with reduced functionality."

Read that as an engineering requirement rather than a legal one. It says the presence of an option must be negotiable at run time, which forces feature discovery, capability exchange, or graceful degradation into the protocol design. Every capability bitmap, every extension negotiation, every "ignore fields you do not understand" rule exists because a standard chose to make something optional and then had to make the choice survivable. When you find an option in a standard, the next thing to look for is the mechanism by which two peers discover each other's choice. If there is not one, the option is a future interoperability incident.

RFC 2119 also warns against overuse. "Imperatives of the type defined in this memo must be used with care and sparingly," and specifically "they MUST only be used where it is actually required for interoperation or to limit behavior which has potential for causing harm." A specification that mandates everything mandates the implementation, and an over-specified standard is one nobody can implement efficiently on hardware the authors did not anticipate.

## Normative and informative

The second axis is structural rather than lexical. A normative clause is part of the specification; an informative one is not, no matter how useful it is or how officially it was published. Annexes carry an explicit label for exactly this reason, and the label is not decoration. An informative annex can contain a complete worked design, a full state machine, or a cabling recommendation, and none of it constrains conformance.

IEEE 802.3 supplies an unusually clean example, because the working group once spent an entire amendment producing one. Project 802.3t, approved in 1995-06, is described in the standard's own amendment list as a "informative annex for 10BASE-T" covering 120 ohm cabling, and 802.3v did the same for 150 ohm. A full standards project, with a PAR, a working group, and a ballot, whose deliverable created zero new obligations. That is not a waste. It is the correct way to publish engineering guidance that the group agreed on but did not want to make a condition of conformance, and it is a tool worth recognizing when you see it used.

The same distinction runs through programming-language specifications, where it is easier to feel. The C standard's separation of behavior into defined, implementation-defined, unspecified and undefined is the identical drafting move: it is [[cs/languages/common/undefined-behavior-as-a-contract|a contract that names the regions where the document declines to constrain you]], and the consequences of misreading which region you are in are severe in exactly the same way.

> [!warning] Notes and examples do not bind
> A NOTE inside a normative clause is informative. So is an example, a figure caption in most house styles, and the rationale text a working group adds to explain itself. If your conformance argument depends on a NOTE, you do not have a conformance argument.

## Reading practice

Three habits pay for themselves immediately.

Search the document for its own definitions clause first. Standards define their requirement vocabulary near the front, much as [[cs/pl/language-overview-syntax-semantics|a language specification separates its syntax from the meaning it assigns]], and a minority of them deviate from the convention. "Some documents deviate from this convention and use the words shall, will, and should to denote the strength of the requirement," so the meaning is whatever this document says it is.

Count the shalls in the clause you care about. A clause with one shall and four shoulds is describing a design the group liked but could not compel, which usually means someone in the ballot group would have voted against compelling it. The distribution of requirement levels is a map of where the [[cs/standards/how-ieee-makes-a-standard|working group's consensus actually ran out]].

Treat every may as a question about negotiation. Ask what wire mechanism lets a peer discover the choice, and treat its absence as a defect in the standard rather than in the implementation you are debugging.

## Related Notes

- [[cs/standards/how-ieee-makes-a-standard|How IEEE Makes a Standard]] for the balloting rule that turns contested shalls into mays.
- [[cs/standards/what-a-standard-actually-is|What a Standard Actually Is]] for why the document is a conformance contract in the first place.
- [[cs/standards/ieee-802-3-ethernet|IEEE 802.3, Ethernet as a Document]] for the amendment list that includes the informative-annex projects.
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] for the same drafting device inside a language standard.
- [[cs/software-engineering/api-design|API Design]] for the everyday version of deciding what you are willing to promise.
- [[cs/military-computing/ada-and-language-standardization|Ada and Language Standardization by Mandate]] for a specification whose customer removed the option to deviate.

## Sources

- [RFC 2119, Key words for use in RFCs to Indicate Requirement Levels](https://www.rfc-editor.org/rfc/rfc2119.txt) backs the definitions of MUST, SHOULD and MAY, the interoperability requirement placed on optional features, and the warning to use imperatives sparingly.
- [Shall and will (Wikipedia)](https://en.wikipedia.org/wiki/Shall_and_will) backs the requirement-specification convention, the mandatory reading of shall in ISO, IEC, ASTM and IEEE standards, the IETF equivalence of shall and must, and the fact that some documents deviate from the convention.
- [IEEE 802.3 (Wikipedia)](https://en.wikipedia.org/wiki/IEEE_802.3) backs 802.3t as an amendment whose deliverable was an informative annex for 10BASE-T.
