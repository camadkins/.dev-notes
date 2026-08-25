---
title: The Computer Fraud and Abuse Act
description: "18 U.S.C. 1030 was written when a computer was a rare and expensive thing, and its reach grew not by adding new offenses but by widening one definition until it swallowed every machine on the internet."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-06-14
updated:
aliases:
  - CFAA
---

Read the federal computer crime statute cold and the surprise is how little of it is about computers. Seven paragraphs describe conduct: obtaining national defense information, obtaining financial records, touching a government machine, defrauding, damaging, trafficking in passwords, extorting. Strip the word "computer" out and most of them read like ordinary theft, trespass, and extortion statutes from a century earlier. That is close to what they are. The federal government did not invent a new theory of wrongdoing in the 1980s. It re-enacted old ones with a jurisdictional hook attached, and then spent thirty-five years widening the hook.

> [!note] The idea
> The CFAA's breadth does not live in its list of offenses. It lives in one definition, "protected computer," which began as a term for federal and financial machines and now reaches any device "used in or affecting interstate or foreign commerce or communication." The offense text barely moved. The definition moved until it covered everything.

> [!warning] Scope
> This note describes what a statute says and how its text changed over time. It is not legal advice, it does not tell you whether any particular conduct violates the CFAA, and it is not a substitute for a lawyer.

## Where it came from

The Supreme Court's own account, in the 2021 opinion that finally construed the statute's most contested phrase, is short. "Congress, following the lead of several States, responded by enacting the first federal computer-crime statute as part of the Comprehensive Crime Control Act of 1984." The 1984 provision was narrow and awkward. Two years later Congress rewrote it, and the 1986 rewrite is the version people mean when they say CFAA. The section's source credit still records the whole lineage: added by Public Law 98-473 in October 1984, amended by Public Law 99-474 in October 1986, and amended again in 1988, 1989, 1990, 1994, 1996, 2001, 2002, 2008, and 2020.

That amendment list is the story. A statute amended eleven times over thirty-six years is a statute Congress kept reaching for, and each reach left the text a little wider than it found it.

## The seven offenses

Subsection (a) is a list, and it helps to read it as one. Paragraph (1) covers obtaining classified or restricted national defense information by unauthorized access and then willfully passing it along. Paragraph (2) covers obtaining information: financial records, information from a federal department or agency, or information from a protected computer. Paragraph (3) covers accessing a nonpublic federal computer at all. Paragraph (4) covers access in furtherance of fraud, with a carve-out when the only thing obtained is computer use worth $5,000 or less in a year.

Paragraph (5) is the damage paragraph, and it is the one that maps most directly onto the technical subject matter the garden covers under `cs/security`. Subparagraph (A) reaches whoever "knowingly causes the transmission of a program, information, code, or command, and as a result of such conduct, intentionally causes damage without authorization" to a protected computer. Subparagraphs (B) and (C) reach unauthorized access that recklessly causes damage, or that causes damage and loss. Paragraph (6) covers trafficking in passwords. Paragraph (7) covers extortion built on a threat to damage a protected computer, to obtain information from one, or to impair the confidentiality of information already taken.

Two definitions carry most of the weight here. "Damage" means "any impairment to the integrity or availability of data, a program, a system, or information." That is [[cs/security/cia-triad|two thirds of the CIA triad]] written into a criminal statute, and the omission is deliberate: pure loss of confidentiality is handled by the information-obtaining paragraphs, not the damage paragraph. So a wiper and a [[cs/security/denial-of-service-and-ddos|flood that takes a service off the air]] both fit the word "damage," while a quiet copy of a database does not, even though the copy is the one that ends up in the news.

The other definition is "exceeds authorized access," which means "to access a computer with authorization and to use such access to obtain or alter information in the computer that the accesser is not entitled so to obtain or alter." That phrase is the fault line under the whole statute, and it took the Supreme Court until 2021 to say what it meant. That fight has [[cs/law/exceeds-authorized-access-and-van-buren|its own note]].

Subsection (b) sweeps in inchoate conduct: "Whoever conspires to commit or attempts to commit an offense under subsection (a) of this section shall be punished as provided in subsection (c)."

## The definition that grew

Here is the mechanism. A "computer" under the statute is "an electronic, magnetic, optical, electrochemical, or other high speed data processing device performing logical, arithmetic, or storage functions," excluding automated typewriters, typesetters, and hand-held calculators. That definition was already close to universal in 1986 and is comically so now, since a modern thermostat and a modern car both perform logical, arithmetic, and storage functions at high speed.

But the offenses do not attach to "computer." Most of them attach to "protected computer," and that term originally meant machines used exclusively by or for a financial institution or the United States government. The second branch is what expanded. A protected computer now includes any computer "which is used in or affecting interstate or foreign commerce or communication, including a computer located outside the United States that is used in a manner that affects interstate or foreign commerce or communication of the United States." A 2020 amendment added a third branch for voting systems.

Two edits did the real work, both in the 2008 amendments. The first struck the phrase "if the conduct involved an interstate or foreign communication" after "computer" in the information-obtaining paragraph, removing the requirement that the access itself cross a state line. The second inserted "or affecting" after "which is used in" in the definition of protected computer. Before that edit the machine had to be used in interstate commerce. After it, being affected by interstate commerce is enough.

The Court described the result plainly. Subsection (a)(2)'s prohibition originally "barred accessing only certain financial information. It has since expanded to cover any information from any computer" used in or affecting interstate commerce. The practical consequence, in the Court's words, is that the prohibition now applies at a minimum to all information from all computers that connect to the internet.

Nothing in the 2008 edits announced an expansion of criminal liability. They read like cleanup. They were the largest single change to the statute's reach.

## The civil half

Congress bolted a private cause of action onto the criminal statute in 1994. "Any person who suffers damage or loss by reason of a violation of this section may maintain a civil action against the violator" for compensatory damages and equitable relief, subject to threshold conditions and a two-year limitations period. That is unusual. Most federal criminal statutes are enforced only by prosecutors, and the private right turns the CFAA into a tool that companies use against former employees, competitors, and scrapers. Much of the case law that shaped the meaning of "authorization" arrived through civil suits rather than prosecutions, which is why the doctrine developed around employment disputes and terms of service rather than around intrusions.

The statute also builds a bridge to state law. A prior "conviction under the law of any State for a crime punishable by imprisonment for more than 1 year, an element of which is unauthorized access, or exceeding authorized access, to a computer" counts as a prior conviction for federal recidivist sentencing. Federal and state computer crime law are not parallel systems that never touch. They are wired together, which is one reason the [[cs/law/state-computer-crime-statutes|variation among state statutes]] matters beyond the states themselves.

Underneath all of it sits a distinction that engineers already know: the difference between proving who you are and being allowed to do a thing. The statute talks about authorization throughout, but almost never about authentication, and the gap between the two is where the hard cases live. See [[cs/security/authentication-vs-authorization|authentication versus authorization]] for the technical version of the same line.

## Related Notes

- [[cs/law/exceeds-authorized-access-and-van-buren|Exceeds Authorized Access and Van Buren]] for what the statute's most litigated phrase actually means.
- [[cs/law/cfaa-penalties-and-the-charging-problem|CFAA Penalties and the Charging Problem]] for how subsection (c) turns the same conduct into a misdemeanor or a felony.
- [[cs/law/state-computer-crime-statutes|State Computer Crime Statutes]] for the fifty other statutes covering the same ground.
- [[cs/security/cia-triad|The CIA Triad]] because the statutory definition of damage is integrity and availability, with confidentiality handled elsewhere.
- [[cs/security/malware-classes|Classes of Malware]] for the technical taxonomy that paragraph (a)(5) describes in legal terms.
- [[cs/military-computing/morris-worm-and-buffer-overflows|The Morris Worm and the Buffer Overflow]] for the 1988 incident that made the damage paragraph concrete.

## Sources

- <https://www.law.cornell.edu/uscode/text/18/1030> for the full text of 18 U.S.C. 1030: the offense paragraphs, the definitions of computer, protected computer, damage, exceeds authorized access, and conviction, the civil cause of action, and the amendment history including the 2008 edits.
- <https://www.supremecourt.gov/opinions/20pdf/19-783_k53l.pdf> for the Supreme Court's account in Van Buren v. United States of the 1984 enactment and of how subsection (a)(2) expanded from financial information to any information from any computer.
