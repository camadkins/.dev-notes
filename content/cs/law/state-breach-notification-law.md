---
title: State Breach Notification Law
description: "Fifty-odd statutes govern the same event, and the variation that matters is not the deadline. It is which verb the statute uses for what the attacker did."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-13
updated:
aliases:
  - Breach Notification
  - Data Breach Notification Laws
---

Congress never passed a general data breach notification statute. The states did, one legislature at a time, over roughly two decades, and the result is that an American company holding consumer records is subject to a stack of parallel obligations that all describe the same event in slightly different words. The National Conference of State Legislatures counts the coverage as complete: "All 50 states, the District of Columbia, Guam, Puerto Rico and the Virgin Islands have laws requiring private businesses, and in most states, governmental entities as well, to notify individuals of security breaches of information involving personally identifiable information."

> [!note] The idea
> The famous variable in these statutes is the deadline, and it is the least interesting one. The load-bearing variation is the verb. California's duty attaches to unauthorized *acquisition* of data; Florida's attaches to unauthorized *access*. Those are different questions about the same log file, and a forensic record that answers one may be silent on the other.

> [!warning] Scope
> This note describes what two state statutes say and what a legislative survey reports. It is not legal advice, it does not state which statutes apply to any particular organization or incident, and it does not describe how to respond to a breach.

## The common skeleton

NCSL's summary of the shared structure is a fair map of the genre. Breach laws "typically have provisions regarding who must comply with the law (e.g., businesses, data or information brokers, government entities, etc.); definitions of 'personal information' (e.g., name combined with SSN, drivers license or state ID, account numbers, etc.); what constitutes a breach (e.g., unauthorized acquisition of data); requirements for notice (e.g., timing or method of notice, who must be notified); and exemptions (e.g., for encrypted information)."

Five moving parts, then: scope, the definition of the protected data, the trigger, the notice, and the carve-outs. Every state fills all five. Almost no two fill them identically, which is why the federal [[cs/law/sectoral-privacy-hipaa-glba-ferpa|sectoral privacy statutes]] sit on top of this layer rather than replacing it.

## California as a specimen

Section 1798.82 of the California Civil Code opens with the duty. An individual or business conducting business in California that owns or licenses computerized data including personal information "shall disclose a breach of the security of the system following discovery or notification of the breach in the security of the data to a resident of California whose unencrypted personal information was, or is reasonably believed to have been, acquired by an unauthorized person."

Two things in that sentence do real work. The first is the word *acquired*. The second is *unencrypted*, and the statute immediately qualifies it: the duty also attaches where encrypted personal information was acquired "and the encryption key or security credential was, or is reasonably believed to have been, acquired by an unauthorized person." An "encryption key" and a "security credential" are defined together as "the confidential key or process designed to render data usable, readable, and decipherable." California therefore treats [[cs/security/hardware-security-modules-and-key-management|key custody]] as an element of the notification trigger. Ciphertext plus a stolen key is a breach; ciphertext alone is not.

The section's own definition of the triggering event is separate from the duty clause. "Breach of the security of the system" means "unauthorized acquisition of computerized data that compromises the security, confidentiality, or integrity of personal information maintained by the individual or business," with a carve-out for good faith acquisition by an employee or agent, provided the information is not used or further disclosed.

Timing was open-ended in California for years. As amended by Stats. 2025, Ch. 319, effective January 1, 2026, the section now provides that "the disclosure required by this subdivision shall be made within 30 calendar days of discovery or notification of the data breach," subject to delay for the legitimate needs of law enforcement or "as necessary to determine the scope of the breach and restore the reasonable integrity of the data system."

The notice itself is specified down to typography. It must be titled "Notice of Data Breach," present its content under five prescribed headings, and use type "no smaller than 10-point type." A business notifying more than 500 California residents from a single breach must send a sample copy to the Attorney General "within 15 calendar days of notifying affected consumers."

California's definition of personal information has grown by accretion: name plus one of social security number, government identification number, financial account number with the credential needed to reach the account, medical information, health insurance information, unique biometric data, automated license plate recognition data, or genetic data. A second branch stands alone, with no name required: "A username or email address, in combination with a password or security question and answer that would permit access to an online account."

## Florida as the contrast

Florida Statutes section 501.171 defines the same event differently. "'Breach of security' or 'breach' means unauthorized access of data in electronic form containing personal information." Access, not acquisition. The proof problem changes shape: California's version asks whether data left, Florida's asks whether someone reached it.

Florida then adds a harm threshold California lacks. Notice to affected individuals is not required if, after investigation and consultation with law enforcement, the covered entity "reasonably determines that the breach has not and will not likely result in identity theft or any other financial harm to the individuals whose personal information has been accessed." That determination "must be documented in writing and maintained for at least 5 years."

The deadlines run from a different event. Individual notice is due "no later than 30 days after the determination of a breach or reason to believe a breach occurred," with a possible 15 additional days for good cause shown in writing. Regulator notice is owed to the Department of Legal Affairs "of any breach of security affecting 500 or more individuals in this state." A third-party agent that suffers the breach must tell the covered entity "no later than 10 days following the determination of the breach of security or reason to believe the breach occurred."

Enforcement diverges too. Florida sets a civil penalty ladder: "$1,000 for each day up to the first 30 days following any violation" of the notice subsections, then "$50,000 for each subsequent 30-day period or portion thereof for up to 180 days," capped at $500,000, and the penalties "apply per breach and not per individual affected by the breach." And the section closes the private courthouse door outright: "This section does not establish a private cause of action."

## What the variation costs

Line the two up and five independent axes appear: what counts as personal information, what the attacker must have done, whether a risk-of-harm assessment can excuse notice, when the clock starts, and who else must be told. A single incident touching residents of both states is evaluated twice against different predicates, and the answers need not agree.

That is what makes these statutes an engineering subject rather than a purely legal one. The statutory triggers are propositions about system events, and whether they can be evaluated at all depends on what the [[cs/security/siem-and-security-logging|logging layer]] retained before anyone knew it mattered. A record sufficient to establish access may say nothing about exfiltration. A determination date, which is where Florida's clock starts, is itself an artifact of how an organization structures the [[cs/security/incident-response-lifecycle|incident response process]] and when it declares that it knows something.

## Related Notes

- [[cs/law/sectoral-privacy-hipaa-glba-ferpa|Sectoral Privacy: HIPAA, GLBA, FERPA]] for the federal layer these statutes sit beneath, and for the HIPAA notice provision California expressly defers to.
- [[cs/law/gdpr-as-it-reaches-us-engineers|GDPR as It Reaches US Engineers]] for a single regime with one 72-hour supervisory-authority deadline instead of fifty-odd triggers.
- [[cs/law/state-computer-crime-statutes|State Computer Crime Statutes]] for the criminal half of state authority over the same conduct.
- [[cs/security/incident-response-lifecycle|The Incident Response Lifecycle]] because determination and containment are the phases these statutes attach legal consequences to.
- [[cs/security/hardware-security-modules-and-key-management|Hardware Security Modules and Key Management]] because California made the location of the key part of the trigger.
- [[cs/geopolitics/surveillance-and-privacy|Surveillance and Privacy]] for the policy argument underneath the drafting choices.

## Sources

- <https://www.ncsl.org/technology-and-communication/security-breach-notification-laws> for the count of jurisdictions with breach notification laws and for the summary of the provisions such laws typically contain.
- <https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.82.> for the text of California Civil Code 1798.82: the disclosure duty, the encryption and key language, the 30 calendar day deadline as amended effective 2026, the notice format and Attorney General sample copy, and the definitions of breach and personal information.
- <https://www.flsenate.gov/Laws/Statutes/2023/501.171> for the text of Florida Statutes 501.171: the access-based definition of breach, the risk-of-harm exception and its five-year documentation requirement, the 30-day and 10-day deadlines, the civil penalty ladder, and the absence of a private cause of action.
