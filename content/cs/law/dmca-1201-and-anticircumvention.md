---
title: "DMCA Section 1201 and Anticircumvention"
description: "Section 1201 bans the act of circumventing an access control and separately bans trafficking in the tools that do it, and only the first of those two prohibitions can be reached by the triennial rulemaking."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-07-02
updated:
aliases:
  - Anticircumvention
  - 17 USC 1201
---

Copyright law, for most of its history, regulated what a person did with a work. Copy it, distribute it, perform it in public, and the statute had something to say. Section 1201, added to title 17 by the Digital Millennium Copyright Act in 1998, regulates something that happens before any of that. It regulates the act of getting to the work. The text is short enough to read in ten minutes and it is worth reading, because its internal structure is the part everyone gets wrong.

> [!note] The idea
> Section 1201 is not one prohibition. It is a prohibition on an *act* and a separate prohibition on *tools*, and they are governed by different machinery. The famous triennial rulemaking, the proceeding that produces the exemptions for repair and preservation and research, reaches only the act. It cannot touch the trafficking ban. So the rulemaking can make your conduct lawful while leaving no lawful supplier of the thing that would let you perform it. The statutory exemptions written by Congress are the ones that reach both halves, and there are very few of them.

## Three prohibitions in two subsections

Subsection (a)(1)(A) states the act prohibition in one sentence: "No person shall circumvent a technological measure that effectively controls access to a work protected under this title."

Subsection (a)(2) states the tool prohibition. No person shall "manufacture, import, offer to the public, provide, or otherwise traffic in any technology, product, service, device, component, or part thereof" that meets any of three tests. The first is design purpose: the thing "is primarily designed or produced for the purpose of circumventing a technological measure that effectively controls access to a work protected under this title." The second is the absence of substantial alternative use. The third is marketing, which turns on what the seller said rather than what the thing does.

Subsection (b)(1) repeats the tool prohibition for a different class of measure, the kind that protects a right of the copyright owner rather than access to the work. Copy controls, in the shorthand. Notice what is missing: there is no act prohibition in subsection (b). Congress did not need one, because the act a copy control prevents is copying, and copying without permission was already infringement. The asymmetry is the clearest signal of what 1201 was for. It created a new wrong, unauthorized access, that had no analogue in the older statute.

The definitions are broader than the word circumvention suggests. To circumvent "means to descramble a scrambled work, to decrypt an encrypted work, or otherwise to avoid, bypass, remove, deactivate, or impair a technological measure, without the authority of the copyright owner." Avoid and bypass do a great deal of work in that list. A measure counts as effectively controlling access "if the measure, in the ordinary course of its operation, requires the application of information, or a process or a treatment, with the authority of the copyright owner, to gain access to the work." There is no strength requirement anywhere in that sentence. A measure that a competent engineer defeats in an afternoon is still a measure, which is why the same reasoning that makes a weak lock legally identical to a strong one makes 1201 bite on firmware protected by nothing more than an obscure header check as readily as on a properly signed image in a [[cs/security/secure-boot-and-the-chain-of-trust|chain of trust]].

## What the triennial rulemaking is, and what it can reach

The exemption machinery sits inside subsection (a)(1) itself, at subparagraphs (B) through (E). Every three years the Librarian of Congress, on the recommendation of the Register of Copyrights, "shall make the determination in a rulemaking proceeding for purposes of subparagraph (B) of whether persons who are users of a copyrighted work are, or are likely to be in the succeeding 3-year period, adversely affected." The statute lists the factors, and they are the ones you would expect from a copyright statute rather than a computing one: the availability of works for use, "the availability for use of works for nonprofit archival, preservation, and educational purposes," the impact on criticism and scholarship, the effect on the market, and whatever else the Librarian considers appropriate.

When a class is granted, "the prohibition contained in subparagraph (A) shall not apply to such users with respect to such class of works for the ensuing 3-year period." Subparagraph (A) and nothing else. Subparagraph (E) forecloses any wider reading, stating that neither the exception nor any determination made in the rulemaking "may be used as a defense in any action to enforce any provision of this title other than this paragraph."

The results are codified at 37 CFR 201.40, which repeats the boundary in its own words: the prohibition "set forth in 17 U.S.C. 1201(a)(1)(A) shall not apply to such users of the prescribed classes of copyrighted works." The classes read like a catalogue of what the last twenty years of computing ran into. Motion pictures for criticism and comment. Computer programs in consumer devices "when circumvention is a necessary step to allow the diagnosis, maintenance, or repair of such a device." The same for commercial food preparation equipment, and for medical devices, and for video games whose authentication servers have been switched off.

The most recent completed cycle produced a final rule in which the Librarian "has determined in this ninth triennial rulemaking proceeding" that the prohibition would not apply to specified classes, effective 28 October 2024. Three years is the natural clock of the whole regime, which means every exemption a community relies on has to be re-argued, on the record, on a schedule set in 1998.

## The savings clauses, and their limits

Subsection (c) tries to fence 1201 off from the rest of copyright. "Nothing in this section shall affect rights, remedies, limitations, or defenses to copyright infringement, including fair use, under this title." And, separately, "Nothing in this section shall enlarge or diminish any rights of free speech or the press for activities using consumer electronics, telecommunications, or computing products."

Both sentences are narrower than they look. Fair use is preserved as a defense to *infringement*. A 1201 claim is not an infringement claim, so preserving the defense to one does not supply a defense to the other. That gap is the source of most of the academic argument about the section, and it is a legal argument rather than a technical one.

The one subsection that reads like privacy law is (i), which permits circumvention where the measure or the work it protects collects or disseminates personally identifying information about the person seeking access, without conspicuous notice and without a way to prevent it, and where disabling that capability is the sole effect. It is a narrow provision and it is almost never litigated, but it is the place where anticircumvention law and the broader problem of [[cs/geopolitics/surveillance-and-privacy|surveillance and privacy]] touch each other directly in the United States Code.

> [!warning] Scope
> This note describes the text of 17 U.S.C. 1201, the regulation codified at 37 CFR 201.40, and the rulemaking that produces it. It is a description of an instrument, not legal advice, and it does not say whether any particular act of circumvention is lawful. Whether a given exemption applies to a given person, device, or project is a question for a lawyer with the facts in front of them.

Two further exemptions, for encryption research and for security testing, are written into the statute itself rather than produced by the rulemaking, and they behave differently from everything above. They are the subject of [[cs/law/the-security-research-exemption|their own note]], as is the separate criminal statute that 1201 repeatedly cross-references, [[cs/law/the-computer-fraud-and-abuse-act|the Computer Fraud and Abuse Act]].

## Related Notes

- [[cs/law/the-security-research-exemption|The Security Research Exemption]] - the 1201(j) carve-out and the Librarian's research class, and how narrow both are
- [[cs/law/the-computer-fraud-and-abuse-act|The Computer Fraud and Abuse Act]] - the statute 1201(g) and 1201(j) both name as a limit on their own exemptions
- [[cs/law/coordinated-vulnerability-disclosure-and-safe-harbor|Coordinated Vulnerability Disclosure and Safe Harbor]] - where the definition of good-faith security research came from and where else it now appears
- [[cs/security/secure-boot-and-the-chain-of-trust|Secure Boot and the Chain of Trust]] - the technical measure that repair and research exemptions run into most often
- [[cs/geopolitics/surveillance-and-privacy|Surveillance and Privacy]] - the interest that subsection (i) protects, in its wider form

## Sources

- 17 U.S.C. 1201, Circumvention of copyright protection systems, Legal Information Institute. https://www.law.cornell.edu/uscode/text/17/1201 . Backs the act and trafficking prohibitions, the definitions of circumvention and of effective access control, the triennial rulemaking mechanism and its factors, the three-year term and the subparagraph (E) limit, and the savings clauses at subsection (c).
- 37 CFR 201.40, Exemptions to prohibition against circumvention, eCFR. https://www.ecfr.gov/current/title-37/chapter-II/subchapter-A/part-201/section-201.40 . Backs the codified scope of the exemptions and the text of the device diagnosis, maintenance, and repair class.
- Exemption to Prohibition on Circumvention of Copyright Protection Systems for Access Control Technologies, 89 FR 85437 (28 October 2024). https://www.govinfo.gov/content/pkg/FR-2024-10-28/html/2024-24563.htm . Backs the ninth triennial proceeding and the rule's effective date.
