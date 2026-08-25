---
title: "The Security Research Exemption"
description: "The 1201(j) statutory exemption reaches the tool ban but requires the owner's prior authorization, and the Librarian's research class reaches neither the tool ban nor any other statute."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-07-09
updated:
aliases: []
---

Ask a security researcher what the DMCA security research exemption protects and you will usually get one answer covering two different instruments that behave nothing alike. One was written by Congress in 1998 and sits in the statute permanently. The other is written by the Librarian of Congress every three years and expires on schedule. They have different scopes, different conditions, and different silences, and the differences are exactly where the risk lives.

> [!note] The idea
> The two exemptions are narrow in opposite directions. The statutory exemption at 1201(j) is the only one that reaches the trafficking prohibition, so it is the only one that covers building and handing over a tool, but it defines its subject as testing done *with the authorization of the owner or operator*. The Librarian's class is far broader in what counts as research, and it covers no trafficking at all, and its own text says out loud that qualifying for it is not a defense to anything else. Between them there is no exemption for the unauthorized case, which is the case that produces most of the useful findings.

## What 1201(j) says

Subsection (j) opens with a definition, and the definition is the whole story. "Security testing" means "accessing a computer, computer system, or computer network, solely for the purpose of good faith testing, investigating, or correcting, a security flaw or vulnerability, with the authorization of the owner or operator of such computer, computer system, or computer network."

Two words in that sentence do the limiting. *Solely* forecloses mixed motives. *Authorization* forecloses the unsolicited case entirely. What remains is close to the shape of a scoped engagement, which is why 1201(j) reads like a description of [[cs/security/penetration-testing-methodology|penetration testing]] written by someone who had watched one happen: a named system, a named owner, and permission obtained in advance.

Paragraph (2) grants the exemption to the act, subject to a condition worth quoting because it recurs across this entire area of law. The exemption applies "if such act does not constitute infringement under this title or a violation of applicable law other than this section, including section 1030 of title 18." Section 1030 is the Computer Fraud and Abuse Act. A DMCA exemption that dissolves the moment you violate a different statute is not much of a shield, and Congress put that cross-reference in deliberately.

Paragraph (3) lists factors a court weighs. The first asks "whether the information derived from the security testing was used solely to promote the security of the owner or operator of such computer, computer system or computer network, or shared directly with the developer." Disclosure to the world is not on the list. Sharing with the vendor is.

Paragraph (4) is the part that matters most and gets discussed least. It reaches the trafficking prohibition: "it is not a violation of that subsection for a person to develop, produce, distribute or employ technological means for the sole purpose of performing the acts of security testing described in subsection (2)." Building a tool, and distributing it, is inside the exemption when the testing it serves is inside the exemption. That is the only route in section 1201 by which a general-purpose testing tool escapes the trafficking ban, and it is why the legal position of a [[cs/security/fuzzing|fuzzer]] or a protocol-analysis harness is stronger than a first reading of 1201(a)(2) suggests.

Subsection (g), for encryption research, has the same architecture and a narrower subject. Encryption research "means activities necessary to identify and analyze flaws and vulnerabilities of encryption technologies applied to copyrighted works." Applied to copyrighted works. The exemption requires that "the person lawfully obtained the encrypted copy, phonorecord, performance, or display of the published work" and that "the person made a good faith effort to obtain authorization before the circumvention." Among the factors is "whether the person is engaged in a legitimate course of study, is employed, or is appropriately trained or experienced, in the field of encryption technology," a credentialing test that has no analogue anywhere else in title 17.

## What the Librarian's exemption says

The regulatory exemption lives at 37 CFR 201.40(b)(18) and is renewed each cycle. It covers computer programs where circumvention is undertaken on a lawfully acquired device, or on a system with the owner or operator's authorization, "solely for the purpose of good-faith security research."

Its definition of that term is materially wider than the statute's. Good-faith security research means accessing a computer program solely for good-faith testing, investigation, or correction of a security flaw or vulnerability, "where such activity is carried out in an environment designed to avoid any harm to individuals or the public," and where what is learned is used primarily to promote security or safety and not to facilitate infringement. No credentialing. No prior-authorization requirement in the lawfully-acquired-device branch. The test is about harm and about use of the findings.

Then the third clause, which is unusual for a regulation in that it argues against its own weight: research qualifying for the exemption "may nevertheless incur liability under other applicable laws," and "eligibility for that exemption is not a safe harbor from, or defense to, liability under other applicable laws." The Librarian wrote the disclaimer into the binding text rather than leaving it in the preamble.

And because the whole triennial mechanism reaches only 1201(a)(1)(A), this exemption does nothing at all about tools. A researcher may be squarely inside (b)(18) and still be outside 1201(a)(2) when they publish the thing that did the work.

## How narrow, concretely

The 2024 cycle is the cleanest illustration available. The existing research class was renewed without opposition: "Multiple organizations and security researchers petitioned to renew the exemption permitting circumvention for purposes of good-faith security research." A separate petition asked for a new class covering research into the trustworthiness of generative AI systems. "The Register recommends denying the proposed exemption." Her stated reasoning was jurisdictional rather than dismissive: "She acknowledges the importance of AI trustworthiness research as a policy matter and notes that Congress and other agencies may be best positioned to act on this emerging issue."

That is the regime working as designed. The rulemaking asks a narrow question about noninfringing uses of copyrighted works, on an evidentiary record, and it declines to answer a policy question that is not that question. Researchers arriving with a real problem and a good argument can lose on the grounds that they came to the wrong forum, and then wait three years.

> [!warning] Scope
> This note describes the text of 17 U.S.C. 1201(g) and (j), the regulation at 37 CFR 201.40(b)(18), and one rulemaking outcome. It states what those instruments say. It is not legal advice, it does not assess whether any research project falls inside either exemption, and it makes no claim about how a court would apply them. The regulation itself says eligibility is not a defense to liability under other laws.

The exemptions are the copyright half of the picture. The other half, the criminal statute, moved separately and by a different mechanism, which is the subject of [[cs/law/coordinated-vulnerability-disclosure-and-safe-harbor|the note on disclosure policy and safe harbor]]. The structure of section 1201 that makes the two exemptions behave so differently is set out in [[cs/law/dmca-1201-and-anticircumvention|the note on anticircumvention]].

## Related Notes

- [[cs/law/dmca-1201-and-anticircumvention|DMCA Section 1201 and Anticircumvention]] - the act and tool split that explains why one exemption reaches further than the other
- [[cs/law/coordinated-vulnerability-disclosure-and-safe-harbor|Coordinated Vulnerability Disclosure and Safe Harbor]] - where the Librarian's definition of good-faith research was later borrowed
- [[cs/law/the-computer-fraud-and-abuse-act|The Computer Fraud and Abuse Act]] - the statute both exemptions name as a condition on themselves
- [[cs/security/penetration-testing-methodology|Penetration Testing Methodology]] - the authorized engagement that 1201(j) is shaped around
- [[cs/security/fuzzing|Fuzzing]] - a tool whose distribution 1201(j)(4) addresses and the triennial exemption does not

## Sources

- 17 U.S.C. 1201, Circumvention of copyright protection systems, Legal Information Institute. https://www.law.cornell.edu/uscode/text/17/1201 . Backs the 1201(j) definition of security testing, the condition that the act not violate other law including section 1030, the factors in 1201(j)(3), the trafficking permission in 1201(j)(4), and the encryption research definition, conditions, and factors in 1201(g).
- 37 CFR 201.40, Exemptions to prohibition against circumvention, eCFR. https://www.ecfr.gov/current/title-37/chapter-II/subchapter-A/part-201/section-201.40 . Backs the good-faith security research class, its harm-avoidance condition, and the clause stating that eligibility is not a safe harbor from other law.
- Exemption to Prohibition on Circumvention of Copyright Protection Systems for Access Control Technologies, 89 FR 85437 (28 October 2024). https://www.govinfo.gov/content/pkg/FR-2024-10-28/html/2024-24563.htm . Backs the unopposed renewal of the research class and the denial of the proposed AI trustworthiness research class.
