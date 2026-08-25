---
title: "FISMA and the Federal Baseline"
description: "FISMA specifies no control. It assigns roles, requires a program, and delegates the technical substance to standards and directives issued outside the statute."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-06-12
updated:
aliases:
  - FISMA
---

Search the Federal Information Security Modernization Act for a required password length, an encryption algorithm, or a logging retention period and you will find none of them. The statute contains no technical control at all. What it contains is an org chart, a program requirement, and a set of pointers to documents written elsewhere, and understanding that shape explains why federal security compliance feels the way it does.

> [!note] The idea
> FISMA's technical content is entirely by reference. The statute obliges each agency head to run a program and to comply with "information security standards promulgated under section 11331 of title 40," with directives issued by the Secretary, and with policies issued by the Director. Every one of those pointers resolves to a document that can be revised without Congress touching the statute. The law is stable and the requirements are not, on purpose, and the delegation is what makes a decades-old statute able to require modern controls.

## What the statute says it is for

The purposes section is unusually candid about the tradeoff the drafters made. First on the list is to "provide a comprehensive framework for ensuring the effectiveness of information security controls over information resources that support Federal operations and assets," and third is to "provide for development and maintenance of minimum controls required to protect Federal information and information systems."

Then two purposes that most security statutes would leave unsaid. Congress wrote in that it wished to "acknowledge that commercially developed information security products offer advanced, dynamic, robust, and effective information security solutions," and to "recognize that the selection of specific technical hardware and software information security solutions should be left to individual agencies from among commercially developed products."

That is a statute declining to specify. It is a deliberate rejection of the older approach in which the government wrote its own security specification and required conformance to it, the pattern visible in the history of [[cs/standards/standards-in-procurement-and-defense-acquisition|standards in defense acquisition]]. FISMA sets who decides rather than what is decided.

## The three roles

The authorities section distributes the work across two central officials and every agency head.

The Director of the Office of Management and Budget holds policy. "The Director shall oversee agency information security policies and practices," including "developing and overseeing the implementation of policies, principles, standards, and guidelines on information security" and ensuring timely agency adoption of standards promulgated under section 11331 of title 40. That cross-reference is the doorway through which National Institute of Standards and Technology publications become mandatory rather than advisory.

The Secretary of Homeland Security holds operations. The Secretary, in consultation with the Director, "shall administer the implementation of agency information security policies and practices for information systems, except for national security systems," and specifically is charged with "developing and overseeing the implementation of binding operational directives to agencies to implement the policies, principles, standards, and guidelines developed by the Director under subsection (a)(1)."

That single clause is the statutory root of the binding operational directive, which is the instrument that later required every civilian agency to publish a [[cs/law/coordinated-vulnerability-disclosure-and-safe-harbor|vulnerability disclosure policy]]. A researcher reporting a bug to a federal agency and finding an authorization clause waiting for them is, several hops up, standing on this sentence.

The agency head holds responsibility. The head of each agency shall be responsible for "providing information security protections commensurate with the risk and magnitude of the harm resulting from unauthorized access, use, disclosure, disruption, modification, or destruction of" agency information and systems. Read the list of harms slowly. Unauthorized access and disclosure are confidentiality. Modification is integrity. Disruption and destruction are availability. The statute is written in [[cs/security/cia-triad|the CIA triad]] without ever using the word, which is what it looks like when an engineering vocabulary has been absorbed into law.

Agency heads also must ensure "that information security management processes are integrated with agency strategic, operational, and budgetary planning processes." Budgetary is the operative word. A security requirement that does not touch the budget process does not survive it.

## The program, and the officer

Section 3554(b) requires that "each agency shall develop, document, and implement an agency-wide information security program to provide information security for the information and information systems that support the operations and assets of the agency," extending to systems provided or managed by another agency, a contractor, or another source. The contractor clause is why federal security requirements propagate into private companies that never signed up for them.

The program's required elements are recognizable as a risk management loop. Periodic assessments of risk and the magnitude of harm. Policies based on those assessments that "cost-effectively reduce information security risks to an acceptable level," a phrase that concedes risk will remain. Subordinate plans. Security awareness training. And "periodic testing and evaluation of the effectiveness of information security policies, procedures, and practices, to be performed with a frequency depending on risk, but no less than annually."

Frequency depending on risk, floor of annual. The floor is what most organizations hear, and the risk-proportional part is what the statute actually asks for.

The staffing requirement is specific in a way that repays reading. The agency head delegates compliance authority to the Chief Information Officer, who must designate "a senior agency information security officer who shall" carry out those responsibilities, possess professional qualifications, "have information security duties as that official's primary duty," and head an office with the mission and resources to do the job. Primary duty. Congress wrote a job description into the United States Code because it had evidently seen the alternative.

> [!warning] Scope
> This note describes the text of 44 U.S.C. 3551, 3553, and 3554. It is a description of a statute, not legal advice and not a compliance guide. It does not state what any agency or contractor is obliged to do, does not interpret any requirement, and does not cover the many implementing policies, memoranda, and directives that carry the operative detail. Those questions belong to counsel and to an agency's own authorizing officials.

## Why the delegation matters

The practical consequence of this design is that "what does FISMA require" is not answerable from FISMA. It resolves to the standards promulgated under title 40, which resolve to NIST publications, which are the subject of [[cs/law/the-nist-risk-management-framework|the note on the Risk Management Framework]]. The statute supplies the obligation to comply and the accountability for failing to. The content arrives from a standards body on its own schedule.

There is a cost to that arrangement and it is visible in practice. Because the obligation is to run a program and to test it annually, the measurable artifact is the documentation of the program rather than the security of the systems, and organizations optimize for the artifact they are measured on. The statute anticipated part of this, listing among its purposes improved oversight "including through automated security tools to continuously diagnose and improve security," which is a legislative bet that continuous measurement would displace periodic paperwork.

## Related Notes

- [[cs/law/the-nist-risk-management-framework|The NIST Risk Management Framework]] - the documents the statute's cross-references resolve to
- [[cs/law/dfars-252-204-7012-and-cui|DFARS 252.204-7012 and CUI]] - the same delegation pattern applied to contractors through a contract clause
- [[cs/law/coordinated-vulnerability-disclosure-and-safe-harbor|Coordinated Vulnerability Disclosure and Safe Harbor]] - a binding operational directive traced back to its statutory authority
- [[cs/security/cia-triad|The CIA Triad]] - the vocabulary the statute's harm list is written in
- [[cs/standards/standards-in-procurement-and-defense-acquisition|How a Standard Becomes a Contract]] - the mechanism by which a referenced document becomes an obligation

## Sources

- 44 U.S.C. 3551, Purposes, Legal Information Institute. https://www.law.cornell.edu/uscode/text/44/3551 . Backs the comprehensive framework and minimum controls purposes, the acknowledgement of commercially developed products, and the statement that solution selection is left to individual agencies.
- 44 U.S.C. 3553, Authority and functions of the Director and the Secretary, Legal Information Institute. https://www.law.cornell.edu/uscode/text/44/3553 . Backs the Director's oversight and policy role, the Secretary's administration of implementation excluding national security systems, and the binding operational directive authority.
- 44 U.S.C. 3554, Federal agency responsibilities, Legal Information Institute. https://www.law.cornell.edu/uscode/text/44/3554 . Backs the agency head's responsibility for protections commensurate with risk, the integration with budgetary planning, the agency-wide program requirement and its elements, the annual testing floor, and the senior agency information security officer requirements.
