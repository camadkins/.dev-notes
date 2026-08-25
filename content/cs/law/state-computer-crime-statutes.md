---
title: State Computer Crime Statutes
description: "Every state has its own computer crime law, most were written before or alongside the federal one, and because they use different verbs and different thresholds the same keystroke can sit in a different legal category depending on which side of a state line the packet lands."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-06-27
updated:
aliases: []
---

The federal computer crime statute gets the attention because it produces the famous prosecutions and the Supreme Court opinions. It is not the statute most computer crime is charged under. According to the National Conference of State Legislatures, "all 50 states, Puerto Rico and the Virgin Islands have computer crime laws; most address unauthorized access or computer trespass." Fifty-two separate legislatures wrote fifty-two separate definitions of what a computer is and what doing something bad to one means, and they did not coordinate.

> [!note] The idea
> The federal statute needs a jurisdictional hook, which is why its reach runs through the phrase "used in or affecting interstate or foreign commerce." **A state legislature needs no such hook**, so state statutes can and do criminalize bare access with no commerce nexus, no damage threshold, and no dollar floor. The narrowing the Supreme Court read into the federal text does not travel to a state statute that uses different words.

> [!warning] Scope
> This note describes what a survey of state law reports and what one state statute says. It is not legal advice, it does not tell you what is lawful in any state, and it makes no attempt at a survey of the other fifty-one statutes it references.

## The scale of the thing

NCSL's survey lists a citation for every jurisdiction: Alabama Code section 13A-8-112, Alaska Statutes section 11.46.740, Arizona Revised Statutes sections 13-2316 and following, California Penal Code section 502, Georgia Code sections 16-9-90 to 16-9-94, and so on through all fifty states plus two territories. Beyond the core unauthorized access provisions, the survey notes that "some state laws also directly address other specific types of computer crime, such as spyware, phishing, denial of service attacks, and ransomware," which is a second axis of variation on top of the first.

The federal statute was layered on top of an existing patchwork rather than replacing it, and the patchwork never went away. That layering is why the federal recidivist provisions had to be written to look sideways at state convictions rather than assuming a single national scheme.

## One statute, read closely

California Penal Code section 502 is a useful specimen because it is long, frequently amended, and structurally unlike the federal statute. Its stated purpose is expansion: "It is the intent of the Legislature in enacting this section to expand the degree of protection afforded to individuals, businesses, and governmental agencies from tampering, interference, damage, and unauthorized access to lawfully created computer data and computer systems."

Subdivision (c) opens with "except as provided in subdivision (h), any person who commits any of the following acts is guilty of a public offense," and then lists fourteen acts. Two stand out for how far they reach.

Paragraph (7) covers a person who "knowingly and without permission accesses or causes to be accessed any computer, computer system, or computer network." That is the entire element. No data need be taken, nothing need be damaged, no threshold need be crossed, and no interstate nexus need exist. Paragraph (2) covers a person who "knowingly accesses and without permission takes, copies, or makes use of any data from a computer, computer system, or computer network."

Note the verb. The federal statute says "without authorization" and "exceeds authorized access," phrases the Supreme Court spent a term parsing. California says "without permission," which is a different word with its own state case law behind it. A federal holding about what "exceeds authorized access" means does not automatically tell you anything about what "without permission" means, because they are different statutes enacted by different legislatures.

Other paragraphs map onto technical categories the garden covers elsewhere. Paragraph (8) reaches whoever "knowingly introduces any computer contaminant into any computer, computer system, or computer network," which is the state law counterpart to [[cs/security/malware-classes|the malware taxonomy]]. Paragraph (5) reaches whoever "knowingly and without permission disrupts or causes the disruption of computer services or denies or causes the denial of computer services to an authorized user," which is denial of service written as a criminal element. Paragraph (9) reaches whoever "knowingly and without permission uses the internet domain name or profile of another individual, corporation, or entity in connection with the sending of one or more electronic mail messages" and thereby causes damage, which is sender spoofing described in statutory prose and is the reason [[cs/security/email-authentication-spf-dkim-dmarc|SPF, DKIM, and DMARC]] exist as a technical answer to the same problem.

## Graded penalties and an exemption

Section 502 grades its offenses differently from the federal statute. A violation of the fraud, data-taking, or alteration paragraphs "is guilty of a felony, punishable by imprisonment pursuant to subdivision (h) of Section 1170 for 16 months, or two or three years and a fine not exceeding ten thousand dollars ($10,000)," or in the alternative "a misdemeanor, punishable by imprisonment in a county jail not exceeding one year, by a fine not exceeding five thousand dollars ($5,000), or by both." Other paragraphs start much lower. For paragraphs (6), (7), and (13), the statute provides "for a first violation that does not result in injury, an infraction punishable by a fine not exceeding one thousand dollars ($1,000)," and names no term of imprisonment. So bare unauthorized access in California, on a first offense with no injury, sits at the bottom of the state's penalty structure, while the same access in federal court runs through a definition of "protected computer" that could put it in a different category entirely.

The statute also carries an employment exemption the federal statute lacks. "Subdivision (c) does not apply to punish any acts which are committed by a person within the scope of lawful employment," with the statute defining scope of employment as performing acts reasonably necessary to a work assignment. That is a legislative answer to the insider-misuse problem the federal courts had to resolve through interpretation in [[cs/law/exceeds-authorized-access-and-van-buren|Van Buren]].

## The clause that makes geography strange

The provision most worth noticing sits near the end. Subdivision (j) says that "a person who causes, by any means, the access of a computer, computer system, or computer network in one jurisdiction from another jurisdiction is deemed to have personally accessed the computer, computer system, or computer network in each jurisdiction."

That is a deeming rule for territoriality, and it is the state law analogue of the federal commerce hook. A packet that originates in one state and terminates in another puts its sender, by operation of the statute, inside both jurisdictions at once. Multiply that by fifty-two statutes with fifty-two sets of elements and thresholds and you get the practical situation: a single connection can implicate a federal statute, the statute of the state where the operator sat, and the statute of the state where the machine sat, each with its own definitions.

Nothing about the underlying network makes this obvious. From the perspective of the routing layer, a destination address is a destination address, and [[cs/networking/routing-and-longest-prefix-match|the forwarding decision]] knows nothing about state lines. The legal geography is superimposed on a topology that was designed to be indifferent to it.

## Why the variation matters beyond the states

Three reasons the state layer is not a footnote to the federal one.

The volume of prosecutions is state, not federal. Federal prosecutors bring the cases with national significance, and everything else is a state matter, which means the working law of computer intrusion for most people is their state's statute.

The federal statute reaches back for state convictions. [[cs/law/the-computer-fraud-and-abuse-act|The CFAA]] counts as a prior conviction "a conviction under the law of any State for a crime punishable by imprisonment for more than 1 year, an element of which is unauthorized access, or exceeding authorized access, to a computer." A state offense is therefore an input to the federal recidivist ladder, which links the two systems directly.

And the words differ. Federal narrowing does not propagate. When a court construes "exceeds authorized access" in the federal statute, that construction binds federal courts reading that phrase. It does not construe "without permission" in California, "without authorization" in a state that used that phrase with a different definitions section, or "computer trespass" in a state that chose a third formulation. Fifty-two texts means fifty-two interpretive projects.

## Related Notes

- [[cs/law/the-computer-fraud-and-abuse-act|The Computer Fraud and Abuse Act]] for the federal statute the state ones sit beside.
- [[cs/law/exceeds-authorized-access-and-van-buren|Exceeds Authorized Access and Van Buren]] for a narrowing that stops at the federal statute's own text.
- [[cs/law/cfaa-penalties-and-the-charging-problem|CFAA Penalties and the Charging Problem]] for the ladder a state conviction feeds into.
- [[cs/security/malware-classes|Classes of Malware]] for the technical categories behind the phrase computer contaminant.
- [[cs/security/email-authentication-spf-dkim-dmarc|Email Authentication: SPF, DKIM, DMARC]] because the domain-spoofing paragraph and those protocols address the same conduct from opposite directions.
- [[cs/security/denial-of-service-and-ddos|Denial of Service and DDoS]] for the technique that paragraph (5) describes as an element.

## Sources

- <https://www.ncsl.org/technology-and-communication/computer-crime-statutes> for the survey establishing that all fifty states plus Puerto Rico and the Virgin Islands have computer crime laws, the per-state citation table, and the note on statutes addressing spyware, phishing, denial of service, and ransomware.
- <https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=502> for California Penal Code section 502: the legislative intent clause, the subdivision (c) offense list, the infraction penalty tier, the lawful employment exemption, and the subdivision (j) dual-jurisdiction deeming rule.
- <https://www.law.cornell.edu/uscode/text/18/1030> for the federal provision counting a qualifying state conviction as a prior conviction.
