---
title: "DFARS 252.204-7012 and CUI"
description: "A contract clause that defines covered defense information to include what the contractor generated itself, points at NIST SP 800-171 for the controls, and attaches a 72-hour reporting duty with evidence preservation."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-02
updated:
aliases:
  - DFARS 7012
  - Covered Defense Information
---

Most of the security obligations a defense contractor carries do not arrive as law. They arrive as a paragraph inserted into a contract, and the paragraph most likely to change how an engineering organization operates is numbered 252.204-7012. It is four pages of ordinary contract language, and everything consequential about it is in the definitions.

> [!note] The idea
> The clause does not define its scope by markings. Covered defense information includes information "collected, developed, received, transmitted, used, or stored by or on behalf of the contractor in support of the performance of the contract." Developed. A contractor generating an analysis nobody handed them, on a program nobody marked, has generated covered defense information by doing the work. Scope follows the contract, not the stamp, which is why organizations discover the clause's reach after the fact rather than at award.

## Two definitions that do the work

The clause is titled "Safeguarding Covered Defense Information and Cyber Incident Reporting (May 2024)," and it opens with a glossary rather than an obligation.

The security standard it sets is stated as a definition. "Adequate security means protective measures that are commensurate with the consequences and probability of loss, misuse, or unauthorized access to, or modification of information." That is a risk-proportional standard rather than a fixed one, and it does the same work as the commensurate-with-risk language in federal information security law.

The scope is set by "covered defense information," which means unclassified controlled technical information or other information described in the Controlled Unclassified Information Registry that requires safeguarding or dissemination controls, and that is either marked and provided to the contractor by DoD, or is "collected, developed, received, transmitted, used, or stored by or on behalf of the contractor in support of the performance of the contract."

The first branch is intuitive. Government hands you a marked document. The second branch is where the surprise lives, and it has no marking requirement in it at all.

Controlled technical information gets its own definition and it is squarely in the [[cs/law/itar-and-defense-articles|defense article]] neighborhood: "controlled technical information means technical information with military or space application that is subject to controls on the access, use, reproduction, modification, performance, display, release, disclosure, or dissemination."

## What CUI is, upstream of the clause

The clause borrows its category from a government-wide regulation. There, "Controlled Unclassified Information (CUI) is information the Government creates or possesses, or that an entity creates or possesses for or on behalf of the Government, that a law, regulation, or Government-wide policy requires or permits an agency to handle using safeguarding or dissemination controls."

Three things follow from that sentence. CUI is unclassified, so none of the classified-information machinery applies. It is defined by an external authority requiring controls, so the label is derivative of some other law. And the regulation splits it into CUI Basic, "the subset of CUI for which the authorizing law, regulation, or Government-wide policy does not set out specific handling or dissemination controls," and CUI Specified, where the authority names the controls. The distinction matters because a single program can carry both, under different authorities, at once.

## Where the controls come from

The clause does not list controls. For covered contractor information systems that are not operated on behalf of the Government, "the covered contractor information system shall be subject to the security requirements in National Institute of Standards and Technology (NIST) Special Publication (SP) 800-171," in effect when the solicitation was issued or as the contracting officer authorizes.

That publication describes itself as providing "federal agencies with recommended security requirements for protecting the confidentiality of CUI when the information is resident in nonfederal systems and organizations," and is explicit about how it is meant to be used: "the security requirements are intended for use by federal agencies in contractual vehicles or other agreements established between those agencies and nonfederal organizations."

A recommendation, written to be cited into a contract, becoming an enforceable term the moment the clause names it. This is the same delegation pattern as the [[cs/law/the-nist-risk-management-framework|Risk Management Framework]] on the federal side, run through a procurement instrument instead of a statute.

The clause's own obligation is short: "the Contractor shall provide adequate security on all covered contractor information systems."

## The reporting duty, and what it drags along

"Rapidly report means within 72 hours of discovery of any cyber incident." Seventy-two hours from discovery, not from containment and not from confirmation.

The clause requires more than a notification. On discovering a cyber incident, the contractor must "conduct a review for evidence of compromise of covered defense information, including, but not limited to, identifying compromised computers, servers, specific data, and user accounts," extending to other systems on the network that may have been accessed. A scoping investigation, on a clock, which is the reason a defense contractor's [[cs/security/incident-response-lifecycle|incident response process]] has a contractual deadline embedded in it that a commercial one does not.

Three further obligations attach.

Evidence preservation: the contractor "shall preserve and protect images of all known affected information systems identified in paragraph (c)(1)(i) of this clause and all relevant monitoring/packet capture data for at least 90 days" from submission of the report, so the Government can request the media or decline.

Government access: "upon request by DoD, the Contractor shall provide DoD with access to additional information or equipment that is necessary to conduct a forensic analysis."

Sample submission: on discovering and isolating [[cs/security/malware-classes|malicious software]] in connection with a reported incident, the contractor must "submit the malicious software to DoD Cyber Crime Center (DC3) in accordance with instructions provided by DC3 or the Contracting Officer," and expressly not to the contracting officer.

Taken together those turn an incident into an evidence-production exercise with a customer as a participant, which is a materially different posture from a purely internal investigation.

## Flow-down

The clause requires the contractor to "include this clause, including this paragraph (m), in subcontracts, or similar contractual instruments" for operationally critical support or where performance will involve covered defense information, without alteration except to identify the parties. Subcontractors must notify up the chain when requesting a variance and must pass the DoD-assigned incident report number back up.

The self-including flow-down is what makes the clause propagate. A prime that never touches a government system still carries it, and so does every tier below, and the small supplier three levels down inherits an obligation written for a defense enterprise.

> [!warning] Scope
> This note describes the text of a contract clause, a government-wide regulation defining CUI, and a NIST publication. It is a description of instruments, not legal advice or a compliance procedure. It does not say whether any particular information is covered defense information, whether a clause applies to a given contract, or what any organization should do about an incident. Those determinations belong to counsel, to the contracting officer, and to the parties to the contract.

## Related Notes

- [[cs/law/cmmc-and-the-defense-industrial-base|CMMC and the Defense Industrial Base]] - what got added when self-attestation against this control set stopped being enough
- [[cs/law/the-nist-risk-management-framework|The NIST Risk Management Framework]] - the federal-side counterpart of the same delegation to NIST publications
- [[cs/law/fisma-and-the-federal-baseline|FISMA and the Federal Baseline]] - the statutory version of a commensurate-with-risk security standard
- [[cs/law/itar-and-defense-articles|ITAR and Defense Articles]] - the export regime that overlaps with controlled technical information
- [[cs/security/incident-response-lifecycle|The Incident Response Lifecycle]] - the process the 72-hour clock and preservation duty constrain
- [[cs/security/malware-classes|Classes of Malware]] - the artifacts the clause requires be submitted to DC3

## Sources

- DFARS 252.204-7012, Safeguarding Covered Defense Information and Cyber Incident Reporting, Acquisition.gov. https://www.acquisition.gov/dfars/252.204-7012-safeguarding-covered-defense-information-and-cyber-incident-reporting%2E . Backs the clause title and date, the definitions of adequate security, controlled technical information, and covered defense information, the reference to NIST SP 800-171, the 72-hour reporting definition and the review requirement, the 90-day media preservation and forensic access obligations, the malicious software submission, and the subcontract flow-down.
- 32 CFR Part 2002, Controlled Unclassified Information, eCFR. https://www.ecfr.gov/current/title-32/subtitle-B/chapter-XX/part-2002 . Backs the definition of CUI and the distinction between CUI Basic and CUI Specified.
- NIST SP 800-171 Revision 3, Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations, publication page. https://csrc.nist.gov/pubs/sp/800/171/r3/final . Backs the publication's stated purpose and its intended use in contractual vehicles between agencies and nonfederal organizations.
