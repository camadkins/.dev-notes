---
title: "Encryption Export History and the Crypto Wars"
description: "Cryptography was a munition on the U.S. Munitions List until a 1996 presidential memorandum moved it to the Commerce Control List, and by 2000 posting source code on the internet no longer established knowledge of a prohibited export."
draft: false
comments: true
tags:
  - cs
  - law
  - cryptography
date: 2026-07-21
updated:
aliases: []
---

For most of the second half of the twentieth century, a cipher was legally a weapon. Not by metaphor. Encryption products sat in Category XIII of the United States Munitions List alongside armor plate and guided munitions, licensed by the State Department under the Arms Export Control Act. The change from that arrangement to the current one, where a browser ships strong cryptography to anyone, happened in a period of about four years and is documented in ordinary government paperwork.

> [!note] The idea
> The crypto wars were not resolved by a court ruling that cryptography is speech, and they were not resolved by an argument about mathematics. They were resolved by moving a subject from one control list to another, and then by amending the entries on the receiving list twice. The technical facts never changed. What changed was which agency held the pen and what its entries said, which is a lesson about where power actually sits in an export control regime.

## The starting position

Daniel Bernstein was a doctoral candidate at Berkeley who developed an encryption method he called Snuffle, built around a one-way [[cs/security/cryptographic-hash-functions|hash function]]. He described it two ways, in a paper of analysis and equations and in two programs written in C, and then wrote an English-language set of instructions that translated the source code into prose. Wanting to present the work academically, he asked the State Department whether he needed a license to publish it. The answer was that Snuffle "was a munition under the International Traffic in Arms Regulations," and that he would need a license to export the paper, the source code, or the instructions.

That is the regime at its starting position, and the [[cs/law/itar-and-defense-articles|Munitions List]] still carries the residue of it. Military and intelligence cryptography remains a defense article today. What moved was everything else.

## The 1996 transfer

The mechanism was executive. On 15 November 1996 the President issued a memorandum "directing that all encryption items controlled on the U.S. Munitions List, except those specifically designed, developed, configured, adapted, or modified for military applications, be transferred to the Commerce Control List," alongside Executive Order 13026 of the same date.

The implementing rule from the Bureau of Export Administration took effect 30 December 1996. It was not a liberalization so much as a change of custodian with a bargain attached. The rule permitted "the export and reexport of 56-bit key length DES or equivalent strength encryption items under the authority of a License Exception," conditioned on the exporter making satisfactory commitments to build or market recoverable encryption items and to help build an international key management infrastructure. Key escrow was the price of the export.

Fifty-six bits. The ceiling was written in the vocabulary of [[cs/military-computing/des-standardization-and-symmetric-crypto|the Data Encryption Standard]], whose key length had been the subject of a public argument about adequacy since the 1970s, and the policy adopted that exact number as the boundary of what Americans could sell abroad.

## Bernstein v. United States

Bernstein sued, and on 6 May 1999 a Ninth Circuit panel affirmed the district court. The opening paragraph of the opinion states the holding compactly. The government "defendants appeal the grant of summary judgment to the plaintiff," and the court found the regulations "operate as a prepublication licensing scheme that burdens scientific expression," "vest boundless discretion in government officials," and lack adequate procedural safeguards. Therefore "we hold that the challenged regulations constitute a prior restraint on speech that offends the First Amendment."

The reasoning that made the opinion famous is the part where a federal court had to decide what source code is. The panel explained that the distinguishing "feature of source code is that it is meant to be read and understood by humans and that it can be used to express an idea or a method," and that it must be compiled before a machine can use it at all. It then reached the analogy that gets quoted: "cryptographers use source code to express their scientific ideas in much the same way that mathematicians use equations or economists use graphs."

That is a court reasoning from the practice of a technical community to a constitutional conclusion. It did not say code is always speech. It said that in this field, source code is how the ideas are stated, so a licensing requirement on publishing it is a licensing requirement on publishing the ideas.

> [!warning] Scope
> This note describes what a panel opinion filed on 6 May 1999 said, together with the text of two Federal Register rules. It is a description of documents, not legal advice, and it does not trace the case's later procedural history or state what precedent currently binds any court. Nothing here says what any person may lawfully export today. Export classification and licensing questions belong to counsel and to the licensing agency.

## The 2000 rule

The endpoint arrived in January 2000, and it arrived as a regulation rather than as a ruling. Following a policy announcement the previous autumn ("On September 16, 1999, the U.S. announced a new approach to its encryption export control policy"), the Bureau of Export Administration published a rule that "amends the Export Administration Regulations (EAR) to allow the export and reexport of any encryption commodity or software to individuals, commercial firms, and other non-government end-users in all destinations." It took effect 14 January 2000.

The rule also folded in multilateral changes. Encryption software lost its eligibility for mass market treatment under the General Software Note and gained it under a new Cryptography Note in Category 5 Part 2, a note that "multilaterally decontrols mass market encryption commodities and software up to and including 64-bits."

And then the provision that reads, in retrospect, like the actual peace treaty. To take account of open-source software development, "unrestricted encryption source code not subject to an express agreement for the payment of a licensing fee or royalty for commercial production or sale of any product developed using the source code can, without review, be released from" the encryption item controls and exported under a license exception, subject only to notifying the agency of the internet location or providing a copy. Then: "posting of the source code on the Internet" where anyone may download it would not establish knowledge of a prohibited export.

A regulation that in 1996 treated a floppy disk of C code as a munition now said that publishing that same code on a web server was not, by itself, evidence of anything. The change is legible entirely inside the [[cs/law/the-export-administration-regulations|Export Administration Regulations]], in amendments to license exceptions and control list notes. No statute was rewritten. The list was.

## What the episode teaches

Three durable things sit in this history.

The regulated object was never the mathematics. It was a listing, and the listing was moved by executive action and then amended by rulemaking. Anyone trying to predict where a control regime is heading should watch entries and notes rather than speeches.

The distinction between source and object code, which the 2000 rule leans on and which the Ninth Circuit spent pages on, survives in the current regulations. The Commerce definition of a deemed export still reaches source code and expressly excludes object code, a line drawn in these fights and never redrawn.

And the argument that won on the ground was economic and multilateral rather than constitutional. The decontrol that mattered came from a mass-market note negotiated internationally and a policy decision announced from the White House, not from the panel opinion.

## Related Notes

- [[cs/law/the-export-administration-regulations|The Export Administration Regulations]] - the regime that received the transferred items and where the source code line still lives
- [[cs/law/itar-and-defense-articles|ITAR and Defense Articles]] - the list cryptography left, and the military entry it left behind
- [[cs/law/wassenaar-and-intrusion-software|Wassenaar and Intrusion Software]] - the same argument replayed two decades later over a different technology
- [[cs/military-computing/des-standardization-and-symmetric-crypto|DES and the Politics of a Standard Cipher]] - where the 56-bit number came from
- [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]] - the primitive Snuffle was built on

## Sources

- Bernstein v. United States Department of Justice, No. 97-16686 (9th Cir., filed 6 May 1999), opinion text hosted by the Electronic Frontier Foundation. https://www.eff.org/files/filenode/bernstein/19990506_circuit_decision.html . Backs the State Department's munitions determination, the panel's three findings and prior restraint holding, the description of source code, and the comparison to equations and graphs.
- Encryption Items Transferred From the U.S. Munitions List to the Commerce Control List, 61 FR 68572 (30 December 1996). https://www.govinfo.gov/content/pkg/FR-1996-12-30/html/96-33030.htm . Backs the presidential memorandum directing the transfer, the military-application exception, the 56-bit License Exception and its key recovery commitments, and the effective date.
- Revisions to Encryption Items, 65 FR 2492 (14 January 2000). https://www.govinfo.gov/content/pkg/FR-2000-01-14/html/00-983.htm . Backs the September 1999 policy announcement, the authorization of exports to non-government end-users in all destinations, the Cryptography Note and 64-bit mass market decontrol, the open source source code provision, and the statement about posting source code on the internet.
