---
title: The CLOUD Act and Cross-Border Data
description: "A warrant fight over a mailbox replicated to Dublin reached the Supreme Court and died there, because Congress had already answered the question by declaring that possession, custody, or control travels with the provider rather than with the disk."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-08
updated:
aliases:
  - CLOUD Act
  - 18 USC 2713
  - Microsoft Ireland
---

In December 2013 agents applied for a warrant requiring Microsoft to disclose the email of an account associated with a drug trafficking investigation. A magistrate found probable cause and issued it. Microsoft then discovered where the messages actually lived and refused, and the resulting fight took four and a half years, produced a Second Circuit opinion, reached the Supreme Court, and ended without a decision because Congress had changed the statute a few weeks before argument was to matter.

> [!note] The idea
> The CLOUD Act resolved a jurisdictional question by **relocating the test from the data to the entity**. Whether a provider must produce a record no longer depends on which datacenter holds the bytes; it depends on whether the record is within the provider's possession, custody, or control. That is the same standard American discovery law applies to documents generally, imported into the communications statutes.

> [!warning] Scope
> This note describes what a 2018 statute changed and what a Supreme Court order said. It is not legal advice, it does not describe any provider's obligations in a given case, and it takes no position on the policy merits of the executive agreement mechanism.

## The case that became moot

The warrant directed Microsoft to disclose the contents of a specified account and associated records "to the extent that the information is within Microsoft's possession, custody, or control." After service, "Microsoft determined that the account's e-mail contents were stored in a sole location," which was "Microsoft's datacenter in Dublin, Ireland." Microsoft moved to quash as to the material in Ireland. The magistrate denied the motion, the district court affirmed and held Microsoft in civil contempt on a stipulation, and the Second Circuit reversed, "holding that requiring Microsoft to disclose the electronic communications in question would be an unauthorized extraterritorial application" of the disclosure section of [[cs/law/the-stored-communications-act|the Stored Communications Act]].

The Supreme Court granted certiorari to decide "whether, when the Government has obtained a warrant under 18 U.S.C. 2703, a U.S. provider of e-mail services must disclose to the Government electronic communications within its control even if the provider stores the communications abroad."

Then the ground moved. As the per curiam opinion records, "the parties now advise us that on March 23, 2018, Congress enacted and the President signed into law the Clarifying Lawful Overseas Use of Data Act (CLOUD Act), as part of the Consolidated Appropriations Act, 2018." The government obtained a new warrant under the new law covering the same information. "No live dispute remains between the parties over the issue with respect to which certiorari was granted," and "this case, therefore, has become moot." The judgment below was vacated and the case remanded with instructions to dismiss.

A four-year fight about the extraterritorial reach of a warrant was resolved by a legislature, not a court, and the resolution was one sentence long.

## The sentence

Section 103(a)(1) of the CLOUD Act added a new section 2713 to chapter 121. It reads in full:

> A provider of electronic communication service or remote computing service shall comply with the obligations of this chapter to preserve, backup, or disclose the contents of a wire or electronic communication and any record or other information pertaining to a customer or subscriber within such provider's possession, custody, or control, regardless of whether such communication, record, or other information is located within or outside of the United States.

Two things are happening in that sentence.

The first is the phrase "possession, custody, or control," which is the familiar standard from American civil discovery. It asks about a legal relationship rather than a physical location. A company that can retrieve a record has control over it whether the record sits in Virginia or Ireland.

The second is what the sentence declines to say. It does not address the location of the customer, the nationality of the account holder, or the law of the country where the datacenter sits. It simply removes storage location as a defense, which is the specific argument Microsoft had won on below.

## Why the location argument existed at all

The interesting part for an engineer is that Microsoft's position was technically coherent and legally awkward at the same time. Data location in a modern service is an operational parameter. A provider picks a home region for an account, and the record then exists in whatever set of places the durability design puts it. Where a mailbox lives is a consequence of [[cs/systems/replication-and-quorums|replication policy]] and regional placement, not a fact about the user.

That is what made the pre-2018 rule strange in application. If a warrant's reach turned on storage location, then its reach turned on a provider's engineering decisions, and a provider could alter the legal consequences of an account by changing a placement default. It also cut the other way: a suspect's records could be beyond reach because of an infrastructure choice nobody involved in the case had made or knew about. The CLOUD Act answers by declaring that parameter legally irrelevant.

## The other half: executive agreements

The statute has a second component, and it is the one that gets less attention. New section 2523 authorizes the Attorney General, "with the concurrence of the Secretary of State," to certify to Congress that "an executive agreement governing access by a foreign government to data subject to this chapter, chapter 121, or chapter 206 shall be considered to satisfy the requirements of this section."

The purpose is symmetrical. Section 2713 makes United States process reach data abroad. Section 2523 creates a path for a qualifying foreign government to serve its own process directly on a United States provider, which the nondisclosure rules would otherwise forbid, without going through a mutual legal assistance treaty request that can take a year or more.

The certification conditions are extensive. The Attorney General must determine that "the domestic law of the foreign government, including the implementation of that law, affords robust substantive and procedural protections for privacy and civil liberties," with factors including whether the government "has adequate substantive and procedural laws on cybercrime and electronic evidence, as demonstrated by being a party to the Convention on Cybercrime," and whether it respects the rule of law, human rights obligations, and the free flow of information.

The agreement itself must impose order-level constraints. A foreign order "shall identify a specific person, account, address, or personal device, or any other specific identifier as the object of the order," and "shall be based on requirements for a reasonable justification based on articulable and credible facts, particularity, legality, and severity regarding the conduct under investigation," and must be subject to review by a court or other independent authority. A foreign order "may not be used to infringe freedom of speech." The foreign government "may not intentionally target a United States person or a person located in the United States," and must adopt targeting procedures designed to meet that requirement. And the arrangement must be reciprocal: the foreign government "shall afford reciprocal rights of data access," including removing restrictions that would otherwise prevent providers from responding to United States process.

One condition is of direct interest to anyone who follows the cryptography debate. The statute provides that "the terms of the agreement shall not create any obligation that providers be capable of decrypting data or limitation that prevents providers from decrypting data." Congress declined to use the agreement mechanism as a lever in either direction, which leaves [[cs/systems/end-to-end-encryption-and-the-lawful-access-debate|the lawful access argument]] exactly where it was.

## What it settles and what it does not

The CLOUD Act settles a jurisdictional question and creates a bilateral channel. It does not harmonize substantive standards. A provider can still face a genuine conflict, where United States process compels production and the law of another country forbids it, and the statute's answer to that is a comity analysis rather than a rule.

The larger point is the one the [[cs/geopolitics/cyber-sovereignty|cyber sovereignty]] argument turns on. Data localization requirements, which many governments have adopted, rest on the intuition that keeping bytes inside a border keeps them inside a legal system. Section 2713 is a direct rejection of that intuition as applied to United States providers: the border that matters is corporate, not geographic. Every localization mandate written since has had to reckon with the fact that a provider subject to United States jurisdiction remains subject to it regardless of where the disks spin.

## Related Notes

- [[cs/law/the-stored-communications-act|The Stored Communications Act]] for the chapter the CLOUD Act amended.
- [[cs/law/the-wiretap-act-and-interception|The Wiretap Act and Interception]] for chapter 119, one of the chapters an executive agreement can cover.
- [[cs/law/riley-carpenter-and-the-fourth-amendment-online|Riley, Carpenter, and the Fourth Amendment Online]] for the constitutional layer sitting above the same statute.
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]] for the data localization argument that section 2713 cuts against.
- [[cs/systems/replication-and-quorums|Replication and Quorums]] because where a record lives is a durability decision, which is what the case turned on.
- [[cs/systems/end-to-end-encryption-and-the-lawful-access-debate|End-to-End Encryption and the Lawful-Access Debate]] for the question section 2523 deliberately leaves alone.

## Sources

- <https://www.supremecourt.gov/opinions/17pdf/17-2_1824.pdf> for United States v. Microsoft Corp.: the question presented, the Dublin datacenter finding, the Second Circuit holding on extraterritorial application, the enactment of the CLOUD Act on March 23, 2018, and the disposition as moot.
- <https://www.law.cornell.edu/uscode/text/18/2713> for the full text of the provision requiring compliance regardless of whether the data is located within or outside the United States.
- <https://www.law.cornell.edu/uscode/text/18/2523> for the executive agreement mechanism: the Attorney General certification with State Department concurrence, the robust protections determination, the Convention on Cybercrime factor, the order-level particularity and justification requirements, the free speech and United States person targeting limits, the reciprocity requirement, and the clause forbidding any decryption obligation or limitation.
