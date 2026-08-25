---
title: "The NIST Risk Management Framework"
description: "SP 800-37 defines seven steps and SP 800-53 supplies the catalog they operate on, and the step that carries the legal weight is the one where a named official accepts risk in writing."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-07-14
updated:
aliases:
  - RMF
---

The Risk Management Framework is usually met as a compliance obligation, which obscures what it actually is: a pair of documents published by a standards body, one describing a process and the other supplying a catalog. Neither is a law. Both become binding only when something else cites them, which is the arrangement described in [[cs/standards/what-a-standard-actually-is|what a standard actually is]] and in the [[cs/law/fisma-and-the-federal-baseline|federal information security statute]] that points at them.

> [!note] The idea
> Six of the seven RMF steps produce artifacts. One produces a decision. Categorize, Select, Implement, Assess, and Monitor generate categorizations, control sets, configurations, assessment results, and telemetry, all of which are evidence. Authorize is different in kind: its stated purpose is "to provide organizational accountability by requiring a senior management official to determine" whether the risk is acceptable. The framework's real output is a named human on the record accepting a risk. The control catalog is replaceable. The signature is the point.

## Two documents, two jobs

SP 800-37 Revision 2, "Risk Management Framework for Information Systems and Organizations," was published in December 2018 by a Joint Task Force. Its abstract describes what it offers: "the RMF provides a disciplined, structured, and flexible process for managing security and privacy risk" that spans categorization, control selection, implementation and assessment, authorization, and continuous monitoring. Revision 2's headline change was the addition of a step at the front, discussed below.

SP 800-53 Revision 5, "Security and Privacy Controls for Information Systems and Organizations," published September 2020 with updates through December of that year, does the other half. It "provides a catalog of security and privacy controls for information systems and organizations" addressing threats and risks including hostile attacks, human errors, natural disasters, structural failures, foreign intelligence entities, and privacy risks.

The catalog is organized into twenty control families, and the family names are a fair map of the discipline: "Access Control ; Awareness and Training ; Audit and Accountability" and onward through Configuration Management, Contingency Planning, Identification and Authentication, Incident Response, Maintenance, Media Protection, Physical and Environmental Protection, Planning, Program Management, Personnel Security, PII Processing and Transparency, Risk Assessment, System and Services Acquisition, System and Communications Protection, System and Information Integrity, Supply Chain Risk Management, and Assessment, Authorization and Monitoring. The Audit and Accountability family is where the requirements that produce a [[cs/security/siem-and-security-logging|security logging pipeline]] come from, and Incident Response is where a response process acquires a control identifier.

A third document holds the baselines. SP 800-53B "provides security and privacy control baselines for the Federal Government." There are "three security control baselines (one for each system impact level" of low, moderate, and high, "as well as a privacy baseline that is applied to systems irrespective of impact level." It also "provides tailoring guidance and a set of working assumptions that help guide and inform the control selection process." Catalog and baseline are separate on purpose. The catalog says what exists; the baseline says what a system at a given impact level starts from.

## The seven steps, in the document's own words

**Prepare.** Its purpose is "to carry out essential activities at the organization, mission and business process, and information system levels of the organization to help prepare the organization to manage its security and privacy risks using the Risk Management Framework." This step was added in Revision 2, and its existence is an admission that organizations were arriving at step two without the organizational context that makes step two meaningful.

**Categorize.** Its purpose is "to inform organizational risk management processes and tasks by determining the adverse impact to organizational operations and assets, individuals, other organizations, and the Nation with respect to the loss of confidentiality, integrity, and availability of organizational systems" and their information. Categorization is an impact judgment expressed in [[cs/security/cia-triad|the CIA triad]], and it is the input that selects a baseline.

**Select.** Its purpose is "to select, tailor, and document the controls necessary to protect the information system and organization commensurate with risk." Tailor is the operative verb. A baseline is a starting point that gets added to and subtracted from with reasons recorded.

**Implement.** Its purpose is "to implement the controls in the security and privacy plans for the system and for the organization and to document in a baseline configuration, the specific details of the control implementation." Note the second half. Implementing without documenting the specifics does not satisfy the step, because the next step has to have something to test against.

**Assess.** Its purpose is "to determine if the controls selected for implementation are implemented correctly, operating as intended, and producing the desired outcome" with respect to the requirements. Three distinct questions. A control can be present, functioning, and still not achieving what it was selected for.

**Authorize.** Its purpose is "to provide organizational accountability by requiring a senior management official to determine if the security and privacy risk" to operations, assets, individuals, other organizations, or the Nation "based on the operation of a system or the use of common controls, is acceptable."

**Monitor.** Its purpose is "to maintain an ongoing situational awareness about the security and privacy posture of the information system and the organization in support of risk management decisions."

## Why the authorize step is the load-bearing one

Read the seven purposes in sequence and the asymmetry is unmistakable. Six describe work. One describes a person deciding.

Everything before Authorize exists to put a decision-maker in a position to decide with evidence: a categorization that says what is at stake, a tailored control set that says what was chosen, an implementation record that says what was built, and assessment results that say whether it worked. Everything after exists so the decision does not go stale, which is why the framework "promotes near real-time risk management and ongoing information system and common control authorization through the implementation of continuous monitoring processes."

This is the same structural move as the difference between a self-asserted claim and an evaluated one. An organization that says its systems are secure has said nothing checkable. An organization whose named official has signed an acceptance of specified residual risk, against assessed controls, on a dated record, has produced something an auditor, an inspector general, or a court can examine.

> [!warning] Scope
> This note describes two NIST Special Publications and a companion baseline document, and quotes their stated purposes. NIST publications are guidance; whatever binding force they carry comes from a statute, regulation, directive, or contract clause that cites them, and identifying which of those applies to a given system is not something this note does. Nothing here is legal advice or a compliance procedure, and nothing here says what any organization is required to implement.

## Where it shows up outside the government

The framework's vocabulary travels further than its legal reach, because the documents are free and the control identifiers are a shared language. A private organization can adopt the catalog without any obligation to, and many do, using the family and control numbering as an index rather than as a requirement.

The reach becomes obligatory in one direction that matters to engineers: when a control set derived from this catalog is written into a contract clause. That transformation, from a guidance document into a term a company can be sued over, is the subject of [[cs/law/dfars-252-204-7012-and-cui|the note on the defense contract clause]].

## Related Notes

- [[cs/law/fisma-and-the-federal-baseline|FISMA and the Federal Baseline]] - the statute whose cross-references make these publications mandatory for agencies
- [[cs/law/dfars-252-204-7012-and-cui|DFARS 252.204-7012 and CUI]] - a derived control set turned into a contract obligation
- [[cs/law/cmmc-and-the-defense-industrial-base|CMMC and the Defense Industrial Base]] - what happens when self-assessment against a control set stops being enough
- [[cs/standards/what-a-standard-actually-is|What a Standard Actually Is]] - why a published document binds nobody until something cites it
- [[cs/security/siem-and-security-logging|SIEM and Security Logging]] - the engineering behind the Audit and Accountability family
- [[cs/security/cia-triad|The CIA Triad]] - the axes the Categorize step measures impact along

## Sources

- NIST SP 800-37 Revision 2, Risk Management Framework for Information Systems and Organizations. https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf . Backs the framework's self-description and the stated purpose of each of the seven steps.
- NIST SP 800-53 Revision 5, Security and Privacy Controls for Information Systems and Organizations, publication page. https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final . Backs the catalog description, the publication date, and the list of control families.
- NIST SP 800-53B, Control Baselines for Information Systems and Organizations, publication page. https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final . Backs the three impact-level security baselines, the impact-independent privacy baseline, and the tailoring guidance.
