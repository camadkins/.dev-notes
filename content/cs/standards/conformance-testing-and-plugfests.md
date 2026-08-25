---
title: "Conformance Testing and Plugfests"
description: "How a conformance claim is manufactured rather than discovered. What a test suite can ask, what a certification mark actually licenses, and why vendors still hold plugfests after both."
draft: false
comments: true
tags:
  - cs
  - standards
  - testing
date: 2026-08-05
updated:
aliases: []
---

A datasheet says the product conforms. Somebody had to make that sentence true, and the machinery that makes it true is not one thing. There is a test suite, which asks whether a single product satisfies the checkable clauses of a document. There is a certification program, which licenses a trademark on the strength of a test run. And there is a plugfest, where engineers from competing vendors put their boxes in one room and find out whether any of it works together. The three answer different questions, they are run by different organizations, and a vendor can pass the first two while failing the third.

> [!note] The idea
> A test suite measures a product against a **document**. Interoperability is a property of a **population**, and no single-product test can observe it. That gap is structural, not a matter of suite quality: every clause the standard left optional or implementation-defined is a place where two conforming products can legally disagree, and the suite is the wrong instrument to catch it. Plugfests exist to test the pairs.

## What a suite can ask

The Open Group runs the certification program behind the UNIX trademark, and its own description of the arrangement is precise about the role testing plays. "Testing is a key component of The Open Group's Open Brand certification program. Successful results of testing provide credible indicator of conformance and create a basis for certification." A credible indicator and a basis. Not a proof, and not the certification itself.

Two operational details from the same program show where the limits are. First, "Only current test suites can be used for certification," which means a conformance result is pinned to a suite version as well as to a standard edition. A product certified against a retired suite is holding a claim about a document that has since moved. Second, and more revealing, the program asks each submitter to "Select a conformance statement template to describe optional and implementation-defined behavior for your certification submission." The conformance statement questionnaire exists because the specification does not fully determine the product. Wherever the document says an implementation may choose, the vendor declares the choice it made, and the suite then tests against that declaration rather than against a single expected answer.

That is the hole, stated by the program itself. It is the practical consequence of the distinction between [[cs/standards/normative-versus-informative-and-the-word-shall|a clause that binds and a clause that permits]]. The permissive clauses are the ones that survive certification untested in any comparative sense, and they are exactly the clauses where two certified products can behave differently and both be right.

There is a third wrinkle. The Open Group maintains processes for "Waivers, interpretations and test suite deficiencies," and notes that "Certain test result codes must resolve to pass by having an associated record in the interpretations database." A test that failed can become a pass when the failure is judged to be a defect in the suite or an ambiguity in the specification rather than a defect in the product. This is reasonable, because suites do contain bugs and specifications do contain ambiguities. It also means the raw pass rate is not the artifact. The adjudicated result is. A suite is a fixed population of cases, and [[cs/software-engineering/testing-strategies|everything true about test suites in general]] applies here: the cases it does not contain are invisible, and in a standards suite those absences are concentrated exactly where the document declined to decide.

## What the mark licenses

Certification marks belong to organizations, and those organizations are frequently not the body that wrote the standard. The Wi-Fi Alliance is the clearest case in this garden, because the technology it certifies is specified by [[cs/standards/ieee-802-11-wireless-lan|an IEEE working group]] that has nothing to do with the mark.

The Alliance describes the program in terms of population behavior rather than clause satisfaction: "Wi-Fi CERTIFIED devices undergo rigorous testing to validate interoperability with other Wi-Fi CERTIFIED equipment regardless of vendor." The customer-facing version is blunter still. The logo "is an assurance that an independent third party has tested the product in numerous configurations and with a diverse sampling of other devices to ensure compatibility with other Wi-Fi CERTIFIED equipment." Numerous configurations, diverse sampling. That is a description of pairwise testing, not clause testing, and it is a different product from what a conformance suite sells. The mark is also the only one of these artifacts an ordinary buyer of [[cs/networking/wifi-and-802-11|Wi-Fi equipment]] will ever see.

The commercial frame is explicit and worth reading literally. "A company must be a Wi-Fi Alliance member to participate in Wi-Fi CERTIFIED testing, achieve certification, and use the Wi-Fi CERTIFIED logo and Wi-Fi CERTIFIED certification marks." Membership is a precondition. The Alliance also offers members a choice: "Members can also choose from three flexible certification paths based on individual company needs." A certification mark is a trademark licensed on conditions, and the conditions include being inside the association. That is not a criticism, since a mark with no gate is a mark with no meaning, but it does change what the logo asserts. It asserts a member product passed a program, which is a narrower and more commercial statement than "this implements the standard."

> [!warning] Two words that are not synonyms
> Conformance is a result against a document. Certification is a licensed claim about that result, issued by a body with a trademark to protect. [[cs/standards/posix-and-ieee-1003|The POSIX case]] shows how far the two can drift: the platform nearly all POSIX code runs on has never held the certificate, while the certified list is dominated by proprietary systems whose vendors could justify the per product, per edition expense.

## The question the suite cannot ask

So vendors invented a different event. "A plugtest or plugfest is an event based on a certain technical standard where the designers of electronic equipment or software test the interoperability of their products or designs with those of other manufacturers." The unit under test is the pair, and every pair is a fresh chance for two legal readings of the same sentence to collide.

The format is deliberately variable. "Plugtests can be formal and have public test scores or informal and private." The private, unscored variant matters more than it sounds: an engineer will demonstrate a broken interaction in a room where the result is not going on a scoreboard, and will not do so in a certification lab. That is a candid-failure venue, and candid failure is the input the specification editors need.

The reported benefits are not only technical. "Besides helping vendors improve their interoperability, plugtests help create awareness about the standard and can improve transparency on compliance." Awareness and transparency are ecosystem effects, and they explain why trade associations organize these events at their own expense. The examples span industries. "The SCSI Trade Association organizes regular Serial Attached SCSI plugfests to test for early device interoperability," where early is the operative word, because the useful time to discover a divergent reading is before either product has shipped. At the other end of the scale, "O-RAN ALLIANCE e.V. Global PlugFests provide a global platform for Radio Access Network (RAN) equipment manufacturers, service providers, universities, and research institutions to test, integrate, and validate technology and solutions for open and intelligent RAN, based on O-RAN ALLIANCE specifications."

## Reading a claim

The practical result is a short interrogation to run on any conformance sentence you meet, in a datasheet or in a solicitation. Which document, and which edition. Which suite, at which version, and was the result adjudicated. Who issued the mark, and is that body the same one that wrote the specification. And finally, has this thing ever been in a room with somebody else's implementation. The last question is the one a certificate never answers, and it is usually the one the deployment depends on.

## Related Notes

- [[cs/standards/posix-and-ieee-1003|POSIX, or IEEE 1003]] for a certification program examined end to end, including who declines to enter it.
- [[cs/standards/ieee-12207-software-life-cycle|ISO/IEC/IEEE 12207]] for conformance declared against selected processes rather than measured by a suite.
- [[cs/standards/standards-in-procurement-and-defense-acquisition|How a Standard Becomes a Contract]] for what happens when a buyer writes one of these claims into a purchase order.
- [[cs/military-computing/tcsec-and-graded-assurance|The Orange Book and Graded Assurance]] for an evaluation program that graded assurance instead of passing or failing a suite.
- [[cs/networking/vlans-and-802-1q-trunking|VLANs and 802.1Q Trunking]] for a feature whose interoperability problems are pure optionality.

## Sources

- [The Open Brand: Testing](https://www.opengroup.org/openbrand/testing/) backs the role of testing in the Open Brand program, the rule that only current test suites can be used, the conformance statement questionnaire for optional and implementation-defined behavior, and the waiver and interpretations processes including test result codes that resolve to pass via the interpretations database.
- [Why Wi-Fi CERTIFIED](https://www.wi-fi.org/certification) backs the interoperability framing of the program, the third-party testing in numerous configurations against a diverse sampling of devices, the membership precondition for testing and logo use, and the three certification paths.
- [Plugtest (Wikipedia)](https://en.wikipedia.org/wiki/Plugtest) backs the definition of a plugtest, the formal-public and informal-private split, the awareness and transparency benefits, the SCSI Trade Association program, and the O-RAN ALLIANCE Global PlugFests.
