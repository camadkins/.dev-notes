---
title: "Sectoral Privacy: HIPAA, GLBA, FERPA"
description: "Three US privacy statutes covering health, financial, and education records, each attached to a different enforcement hook, which is what makes American privacy law sectoral in structure and not only in coverage."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-06-19
updated:
aliases: []
---

The United States has no general privacy statute. It has a health one, a financial one, an education one, a children's online one, a video rental one, and several dozen state laws, and an engineer building a system that handles more than one kind of record has to satisfy more than one regime with incompatible vocabulary. That is usually described as a coverage problem, gaps between the sectors. The more interesting fact is structural.

> [!note] The idea
> The three main sectoral statutes are not three versions of the same law aimed at different data. They attach to three different enforcement hooks. The health rule regulates named entities directly and tells them what to do. The financial statute regulates nobody directly and instead orders existing supervisory agencies to write standards for the institutions they already supervise. The education statute regulates nobody at all and instead conditions federal funding. Each one was bolted to whatever lever already reached that sector, and that is why the obligations look so different for what is nominally the same concern.

## Health: direct regulation with a flexibility clause

The security rule states its general requirements as four obligations on covered entities and business associates. The first is a sentence any engineer will recognize: "ensure the confidentiality, integrity, and availability of all electronic protected health information the covered entity or business associate creates, receives, maintains, or transmits." That is [[cs/security/cia-triad|the CIA triad]] written into the Code of Federal Regulations as a legal duty. The second is to "protect against any reasonably anticipated threats or hazards to the security or integrity of such information," and the others cover impermissible uses and workforce compliance.

Then comes the part that makes the rule usable across a hospital system and a two-person practice. Under flexibility of approach, covered entities and business associates "may use any security measures that allow the covered entity or business associate to reasonably and appropriately implement the standards and implementation specifications as specified in this subpart," taking into account "the size, complexity, and capabilities of the covered entity or business associate," its technical infrastructure, the costs of security measures, and the probability and criticality of potential risks.

The mechanism that carries the flexibility is a two-tier specification model, and it is a genuinely unusual piece of regulatory design. "Implementation specifications are required or addressable." A required specification must be implemented. An addressable one triggers a decision procedure instead: the entity must "assess whether each implementation specification is a reasonable and appropriate safeguard in its environment," then either implement it, or document why implementing it would not be reasonable and appropriate and "implement an equivalent alternative measure if reasonable and appropriate."

Addressable does not mean optional. It means the obligation is to reason and to record the reasoning. A regulation that accepts a documented alternative is a regulation designed by people who understood that a control catalog cannot anticipate every environment.

## Financial: a statute that regulates the regulators

The financial statute takes a different route entirely. Its first substantive provision is a policy declaration rather than a duty: "it is the policy of the Congress that each financial institution has an affirmative and continuing obligation to respect the privacy of its customers and to protect the security and confidentiality of those customers'" nonpublic personal information.

The operative command is aimed at agencies, not at banks. Each agency or authority described elsewhere in the chapter "shall establish appropriate standards for the financial institutions subject to their jurisdiction relating to administrative, technical, and physical safeguards," with three named objectives: "to insure the security and confidentiality of customer records and information," to protect against anticipated threats or hazards to their security or integrity, and "to protect against unauthorized access to or use of such records or information which could result in substantial harm or inconvenience to any customer."

Congress did not write a security rule. It told the banking and financial supervisors, who already examined these institutions on other grounds, to write one each. The practical result is that the applicable safeguards depend on which regulator supervises the institution, and the statute's own text is nearly silent on technical substance. What it did supply is that third objective, which ties the standard to a harm threshold rather than to a control list.

## Education: a funding condition

The education statute regulates through the appropriations lever and phrases nearly every provision as a negative. "No funds shall be made available under any applicable program to any educational agency or institution which has a policy or practice of permitting the release of education records" or the personally identifiable information in them, other than directory information, without written parental consent, except to a listed set of recipients.

An institution that violates it has not committed an offence. It has become ineligible for federal program funds, which is a far blunter and, in practice, far less frequently used instrument.

The definitions carry the weight. Education records means "those records, files, documents, and other materials which" contain information directly related to a student and are maintained by the institution or someone acting for it. The exclusions are where system designers should look: records in the sole possession of the maker and not revealed to anyone else, and "records maintained by a law enforcement unit of the educational agency or institution that were created by that law enforcement unit for the purpose of law enforcement," among others. Two databases inside the same university can sit on opposite sides of the statute depending on which unit created the record and why.

The most common exception is a purpose test rather than a role test. Release is permitted to "other school officials, including teachers within the educational institution or local educational agency, who have been determined by such agency or institution to have legitimate educational interests." That is an [[cs/security/access-control-models-rbac-abac|attribute and purpose based access decision]] stated as a statutory exception, and implementing it faithfully means an access control system has to model why an access is happening, not only who is asking.

There is also an access right with a deadline. Institutions must establish procedures for granting parental requests to inspect records within a reasonable period, and "in no case more than forty-five days after the request has been made."

> [!warning] Scope
> This note describes the text of one regulation and two statutes and points out how their enforcement mechanisms differ. It is a description of instruments, not legal advice. It does not say which statute applies to any system or organization, does not address the many exceptions, state laws, and implementing rules that surround each regime, and does not tell anyone how to comply. Determining what governs a particular dataset is work for counsel.

## What the comparison is good for

Reading the three side by side gives an engineer a question to ask about any privacy requirement they are handed: what is the hook. Direct regulation of the entity produces detailed rules with flexibility clauses. Delegated standard-setting produces rules that vary by supervisor. Funding conditions produce prohibitions on policies and practices rather than requirements on systems.

The sectoral structure also explains the gaps. Data that no sector claims is unregulated at the federal level, which is why so much of American information privacy runs through general consumer protection enforcement, through state law, and through the constitutional questions raised by [[cs/law/the-third-party-doctrine|the third-party doctrine]] rather than through a privacy statute at all. Where a statute does reach stored records held by a service provider, it tends to be a specific one such as [[cs/law/the-stored-communications-act|the Stored Communications Act]] rather than a general privacy law.

## Related Notes

- [[cs/law/the-third-party-doctrine|The Third-Party Doctrine]] - the constitutional backdrop that makes statutory privacy protection necessary in the first place
- [[cs/law/the-stored-communications-act|The Stored Communications Act]] - the sectoral statute that governs records held by communications providers
- [[cs/law/dfars-252-204-7012-and-cui|DFARS 252.204-7012 and CUI]] - another regime where a category label, not a system boundary, sets the obligation
- [[cs/security/cia-triad|The CIA Triad]] - the three properties the health security rule turns into a legal duty
- [[cs/security/access-control-models-rbac-abac|Access Control Models: RBAC and ABAC]] - what implementing a purpose-based statutory exception actually requires

## Sources

- 45 CFR Part 164, Security and Privacy, eCFR. https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164 . Backs the security rule's general requirements, the flexibility of approach provision and its factors, and the required versus addressable implementation specification model including the documentation and equivalent alternative options.
- 15 U.S.C. 6801, Protection of nonpublic personal information, Legal Information Institute. https://www.law.cornell.edu/uscode/text/15/6801 . Backs the congressional policy statement, the direction to agencies to establish safeguards standards for institutions under their jurisdiction, and the three stated objectives of those standards.
- 20 U.S.C. 1232g, Family educational and privacy rights, Legal Information Institute. https://www.law.cornell.edu/uscode/text/20/1232g . Backs the funding-condition structure, the definition and exclusions for education records, the school official exception resting on legitimate educational interests, and the forty-five day inspection deadline.
