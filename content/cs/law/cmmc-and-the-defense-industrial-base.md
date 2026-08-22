---
title: "CMMC and the Defense Industrial Base"
description: "At Level 2 the required controls are identical to NIST SP 800-171 Revision 2, so what the program adds is not security requirements but a verification method, a named affirming official, and an expiry date."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-16
updated:
aliases:
  - CMMC
  - Cybersecurity Maturity Model Certification
---

A defense contractor reading about the Cybersecurity Maturity Model Certification for the first time usually asks what new controls it imposes. The regulation answers that question in one sentence, and the answer at the level most companies land on is: none.

> [!note] The idea
> "The security requirements in CMMC Level 2 are identical to the requirements in NIST SP 800-171 R2." The program adds no control at that level. What it adds is everything around the control set: who assesses it, whether a third party is involved, who signs an affirmation, how long an assessment stays current, and what happens at every tier of the supply chain. CMMC is not a security standard. It is an assurance regime bolted onto one, which is a distinct kind of thing and solves a distinct problem.

## What the program says it is for

The rule opens by describing itself. This part "describes the Cybersecurity Maturity Model Certification (CMMC) Program of the Department of Defense (DoD) and establishes requirements for defense contractors and subcontractors to implement prescribed cybersecurity standards for safeguarding Federal Contract Information (FCI) and Controlled Unclassified Information (CUI)."

Then the sentence that gives away the actual motivation: "the CMMC Program provides DoD with a viable means of conducting the volume of assessments necessary to verify contractor and subcontractor implementation of required cybersecurity requirements." Volume. The requirements already existed and already applied. The Department could not check them at the scale of its own supplier base, and the program is the answer to that logistics problem. It "provides a consistent methodology to assess a defense contractor's implementation of required cybersecurity requirements."

That framing puts CMMC in a recognizable lineage. It is a scheme that pairs an existing requirements document with an evaluation apparatus, which is the shape of every [[cs/standards/conformance-testing-and-plugfests|conformance regime]] and, in the security domain specifically, the descendant of [[cs/military-computing/tcsec-and-graded-assurance|graded assurance]] under the Orange Book. A published level means something because somebody outside the vendor checked.

## The model, and where its contents come from

"The CMMC Model consists of domains that map to the Security Requirement Families defined in NIST SP 800-171 R2." The domains are inherited, not invented.

The three levels draw on three different sources.

Level 1: "the security requirements in CMMC Level 1 are those set forth in 48 CFR 52.204-21(b)(1)(i) through (xv)," the basic safeguarding clause, which is the floor that applies to anyone handling federal contract information.

Level 2: identical to NIST SP 800-171 Revision 2, the publication that [[cs/law/dfars-252-204-7012-and-cui|the covered defense information clause]] has pointed at for years.

Level 3: "the security requirements in CMMC Level 3 are selected from NIST SP 800-172 Feb2021," the enhanced supplement, with organization-defined parameters filled in by the Department. Level 3 is the only level with genuinely additional technical content, and even there the content is selected from an existing publication rather than written fresh.

Requirement identifiers follow a scheme that makes the inheritance visible: a two-letter domain abbreviation, the level number, and the underlying requirement number from whichever source document supplied it.

## What actually changes: assessment type

The levels differ less in what is required than in who says the requirement is met.

Level 1 is a self-assessment, and it is unforgiving in one specific way: "no POA Ms are permitted for CMMC Level 1." No plan of action for a gap. Every requirement is met or the status is not achieved.

Level 2 comes in two flavors, a self-assessment and a certification assessment performed by a third-party assessment organization. The identical control set can therefore carry two different statuses depending on who looked at it, which is exactly the compliance-versus-conformance distinction made operational.

Level 3 is assessed by the Government's own assessment center, and it stacks: "a CMMC Status of Final Level 2 (C3PAO) for information systems within the Level 3 CMMC Assessment Scope is a prerequisite to undergo a Level 3 certification assessment."

## The affirmation, and the expiry date

Two mechanisms keep an assessment from becoming a piece of paper in a drawer.

The first is a person. "An Affirming Official from each OSA, whether a prime or subcontractor, must affirm the continuing compliance of their respective organizations with the specified security requirement after every assessment, including POA M closeout, and annually thereafter." The affirming official is defined as the senior representative responsible for compliance and holding the authority to affirm it. This is the same structural move as the authorization decision in [[cs/law/the-nist-risk-management-framework|the Risk Management Framework]]: the regime's real output is a named human accepting responsibility on a dated record.

The second is currency. The contract clause that operationalizes all of this, "Contractor Compliance With the Cybersecurity Maturity Model Certification Level Requirements (Nov 2025)," defines a status as "the result of meeting or exceeding the minimum required score for the corresponding assessment" and then defines what makes such a status current. A final Level 2 assessment, self or third-party, counts when "not older than 3 years for Final Level 2 (Self) assessments and Final Level 2 (C3PAO) assessments," provided compliance has not changed and an affirmation not older than one year backs it. Assessments expire. Affirmations expire faster.

## Flow-down, which is where the industry-wide effect comes from

"CMMC requirements apply to prime contractors and subcontractors throughout the supply chain at all tiers that will process, store, or transmit any FCI or CUI on contractor information systems in the performance of the DoD contract or subcontract."

The level required is set by what the subcontractor touches rather than by its size or its distance from the Government. "If a subcontractor will only process, store, or transmit FCI (and not CUI) in performance of the subcontract, then a CMMC Status of Level 1 (Self) is required for the subcontractor," and a subcontractor handling CUI faces a Level 2 floor.

That is the mechanism by which a program office's requirement becomes a machine shop's requirement. It is also the reason the program's cost debate is not really about the controls. The controls were already owed. What is new is the assessment, the assessor, the affirmation, and the clock, at every tier.

> [!warning] Scope
> This note describes the text of the CMMC Program regulation and a Department of Defense contract clause. It is a description of instruments, not legal advice or a compliance guide. It does not say what level applies to any contract or organization, does not interpret assessment scope, and does not describe how to prepare for or pass an assessment. Those are questions for counsel, for the contracting officer, and for the assessment ecosystem the regulation establishes.

## Related Notes

- [[cs/law/dfars-252-204-7012-and-cui|DFARS 252.204-7012 and CUI]] - the clause that made the same control set contractually binding without third-party verification
- [[cs/law/the-nist-risk-management-framework|The NIST Risk Management Framework]] - the federal-side regime whose decisive step is likewise a named official signing
- [[cs/law/fisma-and-the-federal-baseline|FISMA and the Federal Baseline]] - the statutory ancestor of the assess-and-authorize pattern
- [[cs/standards/conformance-testing-and-plugfests|Conformance Testing and Plugfests]] - what it takes for a compliance claim to be checkable by someone else
- [[cs/military-computing/tcsec-and-graded-assurance|The Orange Book and Graded Assurance]] - the earlier attempt to pair a security standard with an evaluation regime

## Sources

- 32 CFR Part 170, Cybersecurity Maturity Model Certification (CMMC) Program, eCFR. https://www.ecfr.gov/current/title-32/subtitle-A/chapter-I/subchapter-M/part-170 . Backs the program's stated purpose and assessment-volume rationale, the model's derivation from NIST SP 800-171 R2 security requirement families, the sources of the Level 1, 2, and 3 requirements, the prohibition on plans of action at Level 1, the Level 2 prerequisite for a Level 3 assessment, the annual affirmation requirement, and the subcontractor flow-down rules.
- DFARS 252.204-7021, Contractor Compliance With the Cybersecurity Maturity Model Certification Level Requirements, Acquisition.gov. https://www.acquisition.gov/dfars/252.204-7021-contractor-compliance-cybersecurity-maturity-model-certification-level-requirements. . Backs the clause title and date, the definition of a CMMC status as meeting or exceeding a minimum required score, and the currency periods for final Level 2 assessments and affirmations.
