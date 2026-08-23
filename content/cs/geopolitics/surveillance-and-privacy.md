---
title: Surveillance & Privacy
description: The tension between state surveillance capabilities and individual privacy - from signals intelligence alliances to commercial spyware to regulatory frameworks like GDPR.
draft: false
comments: true
tags:
  - cs
  - geopolitics
date: 2026-03-12
updated:
aliases: []
---

## Intuition

Every digital communication is, in principle, interceptable. The question is who has the authority, capability, and willingness to intercept it - and what legal or technical constraints stand in the way.

Surveillance and privacy exist in permanent tension: states argue that security requires access to communications; civil liberties advocates argue that unchecked surveillance corrodes democracy. The technical reality is that the infrastructure for one is often the infrastructure for the other.

A lawful intercept capability is also a backdoor. A metadata retention mandate is also a population-scale tracking system. A content moderation pipeline is also a censorship mechanism. The dual-use nature of surveillance infrastructure means that debates about security and privacy are, at their core, debates about trust in institutions.

## Core Idea

**Signals intelligence alliances.** The Five Eyes alliance (US, UK, Canada, Australia, New Zealand) is the most extensive signals intelligence partnership in history. Originating in World War II [[cs/military-computing/cryptography-codebreaking-and-the-nsa|cryptanalysis]] cooperation (the BRUSA Agreement, 1943), it evolved into a system for sharing intercepted communications, technical standards, and collection infrastructure.

The NSA (US), GCHQ (UK), CSE (Canada), ASD (Australia), and GCSB (New Zealand) operate under bilateral and multilateral agreements that allow each member to collect intelligence on the others' behalf - enabling legal circumvention of domestic surveillance restrictions. A country that cannot legally surveil its own citizens can ask a partner to do so and share the results.

Extended partnerships (Nine Eyes, Fourteen Eyes) include additional European allies - Denmark, France, Netherlands, Norway, and others - with more limited sharing arrangements.

**The Snowden disclosures (2013).** Edward Snowden's leak of classified NSA documents revealed the scale of mass surveillance programs:

- **PRISM** - direct collection from the servers of major US tech companies (Google, Apple, Microsoft, Facebook, Yahoo) under Section 702 of FISA.
- **Upstream collection** - tapping undersea fiber-optic cables and internet backbone infrastructure at key junction points.
- **MUSCULAR** - joint NSA-GCHQ program intercepting unencrypted traffic between Google and Yahoo data centers over private fiber links.
- **XKeyscore** - a search and analysis system allowing analysts to query vast databases of intercepted communications, metadata, and browsing history with minimal oversight.

The disclosures triggered a global backlash. Tech companies accelerated adoption of [[cs/military-computing/rsa-and-computational-hardness|end-to-end encryption]] and encryption of internal data-center links. Transatlantic data-transfer agreements were reshaped: Safe Harbor was invalidated (2015), replaced by Privacy Shield, which was itself invalidated in *Schrems II* (2020), and replaced by the current EU-US Data Privacy Framework (2023).

**Section 702 and FISA.** Section 702 of the Foreign Intelligence Surveillance Act authorizes warrantless surveillance of non-US persons located outside the United States. Collection occurs through PRISM (compelled provider cooperation) and upstream (infrastructure tapping).

While targeting non-US persons, the program inevitably collects communications of US persons who communicate with foreign targets - so-called "incidental collection." The FBI's ability to query this data using US-person identifiers ("backdoor searches") has been a persistent controversy, with the FISA Court repeatedly finding compliance violations.

Section 702 was reauthorized in April 2024 with expanded definitions of covered providers, broadening the set of companies that can be compelled to assist with surveillance. Civil liberties organizations challenged the expansion; the debate continues.

**Commercial spyware.** The Pegasus spyware developed by Israel's NSO Group represents the commercialization of state-level surveillance capabilities:

- Pegasus exploits zero-click vulnerabilities in iOS and Android to gain full device access - messages, calls, camera, microphone, location - without any user interaction or indication of compromise.
- The Pegasus Project investigation (2021, led by Forbidden Stories and Amnesty International) identified over 50,000 phone numbers selected as potential targets, including journalists, human rights activists, lawyers, and heads of state.
- NSO Group claims it sells only to vetted government clients for counterterrorism and law enforcement. Evidence shows deployment against dissidents, opposition politicians, and journalists in Mexico, Saudi Arabia, India, Hungary, Poland, and elsewhere.
- The US Commerce Department placed NSO Group on its Entity List in November 2021. The EU Parliament investigated Pegasus use by EU member states.

Pegasus demonstrated that nation-state-grade surveillance is now commercially available to any government willing to pay. The market for offensive cyber capabilities is growing, with competitors like Intellexa (Predator spyware), Candiru, and others operating in similar spaces with varying degrees of oversight.

**GDPR and the privacy-regulation model.** The EU General Data Protection Regulation (2018) established the most comprehensive privacy framework in force:

- Consent must be freely given, specific, informed, and unambiguous. Pre-checked boxes and bundled consent are invalid.
- Data subjects have rights to access, rectification, erasure ("right to be forgotten"), data portability, and objection to automated decision-making.
- Data protection by design and by default is a legal requirement, not a best practice.
- Cross-border data transfers require "adequacy decisions" or approved safeguards (standard contractual clauses, binding corporate rules).
- Maximum fines of 4% of global annual turnover or 20 million euros, whichever is higher.

GDPR has had extraterritorial impact: companies worldwide have adopted GDPR-like practices as a compliance baseline. It has inspired similar legislation - Brazil's LGPD, California's CCPA/CPRA, India's DPDPA, South Africa's POPIA, and dozens of others. The "Brussels effect" in privacy regulation is arguably stronger than in any other technology policy domain.

**The encryption debate.** Governments periodically push for "lawful access" to encrypted communications - backdoors, client-side scanning, or key escrow. Cryptographers and security researchers consistently argue that any intentional weakness is exploitable by adversaries, not only by authorized law enforcement. There is no known way to build a backdoor that only good actors can use.

The debate has resurfaced repeatedly: the EU's proposed Chat Control regulation (client-side scanning of messages for CSAM), Australia's Assistance and Access Act (2018, compelling providers to build interception capabilities), and recurring US proposals for encryption mandates. No major democracy has successfully mandated backdoors in end-to-end encrypted systems, but the pressure is persistent and has intensified with the rise of default encryption on consumer platforms.

**Surveillance capitalism.** Distinct from state surveillance, the term (coined by Shoshana Zuboff) describes the commercial model of extracting behavioral data for prediction and advertising. The data infrastructure built for advertising - persistent identifiers, location tracking, cross-device graphs, behavioral profiling - is routinely accessed by governments through legal process, data broker purchases, or compulsion.

The boundary between commercial data collection and state surveillance is porous. Location data purchased from data brokers has been used by US law enforcement to track individuals without warrants, effectively circumventing Fourth Amendment protections. The commercial surveillance apparatus functions as a shadow intelligence infrastructure that governments can tap without building their own collection systems.

## Example

In 2020, the Court of Justice of the European Union struck down the EU-US Privacy Shield framework in the *Schrems II* decision (Case C-311/18). Austrian privacy activist Max Schrems argued that US surveillance law - particularly Section 702 and Executive Order 12333 - provided inadequate protection for EU citizens' data transferred to the US.

The court agreed, finding that US law did not offer protections "essentially equivalent" to EU fundamental rights. The decision left thousands of companies in legal limbo regarding transatlantic data transfers.

The replacement - the EU-US Data Privacy Framework (adopted 2023) - relies on Executive Order 14086, which established a Data Protection Review Court for EU citizens to challenge US surveillance. Critics argue this framework remains vulnerable to the same legal challenges, since executive orders can be rescinded by future administrations without legislative action.

The cycle of agreement, invalidation, and renegotiation illustrates the structural incompatibility between US surveillance law (which privileges national security access) and EU privacy law (which privileges individual rights). Each new framework is a political compromise built on a legal fault line.

## Related Notes

- [[cyber-sovereignty|Cyber Sovereignty]] - censorship infrastructure and surveillance infrastructure are often the same systems deployed for different purposes
- [[ai-governance|AI Governance]] - AI-powered surveillance tools (facial recognition, predictive policing) are a primary driver of AI regulation
- [[semiconductor-supply-chains|Semiconductor Supply Chains]] - hardware supply-chain integrity is a surveillance and countersurveillance concern
- [[cs/military-computing/cryptography-codebreaking-and-the-nsa|Cryptography, Codebreaking, and the NSA]] - the signals-intelligence lineage the Five Eyes grew out of
- [[cs/military-computing/rsa-and-computational-hardness|RSA and Computational Hardness]] - why a backdoor that only good actors can use cannot exist
- [[cs/history/history-of-the-internet|History of the Internet]] - the backbone and undersea cables upstream collection taps

## Sources

- "Five Eyes," Wikipedia. https://en.wikipedia.org/wiki/Five_Eyes . Supports the membership (US, UK, Canada, Australia, New Zealand), the WWII BRUSA Agreement (1943) origin, the signals-intelligence sharing arrangement, and the extended Nine Eyes / Fourteen Eyes partnerships.
- "Pegasus (spyware)," Wikipedia. https://en.wikipedia.org/wiki/Pegasus_%28spyware%29 . Supports NSO Group's authorship, zero-click iOS/Android exploitation, the Pegasus Project investigation by Forbidden Stories and Amnesty International, the ~50,000 targeted phone numbers, and the US Commerce Department blacklisting of NSO Group.
- "General Data Protection Regulation," Wikipedia. https://en.wikipedia.org/wiki/General_Data_Protection_Regulation . Supports the 2018 effective date, consent and data-subject rights (access, erasure / right to be forgotten, data portability), and the maximum fines of 4% of global turnover or 20 million euros.
- "Foreign Intelligence Surveillance Act of 1978 Amendments Act of 2008," Wikipedia. https://en.wikipedia.org/wiki/Foreign_Intelligence_Surveillance_Act_of_1978_Amendments_Act_of_2008 . Supports Section 702 authorizing warrantless surveillance of non-US persons abroad and the PRISM and upstream collection mechanisms.
