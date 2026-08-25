---
title: "Wassenaar and Intrusion Software"
description: "The 2013 intrusion software entry defined a control by reference to defeating defenses, the 2015 US implementation attempt drew almost 300 comments and was abandoned, and the 2017 revision fixed it with a purpose-based exclusion."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-11
updated:
aliases: []
---

Export control lists are usually written about things: a machine tool with a certain positioning accuracy, a chip above a throughput threshold. In December 2013 a multilateral body tried to write one about a technique, and the attempt produced the clearest documented case of a control text that could not tell an attack tool from a defensive one. The whole episode is on the record in two Federal Register documents, six years apart.

> [!note] The idea
> The 2013 entry defined its subject as software that avoids detection by monitoring tools or defeats protective countermeasures. Every category it named as the thing being defeated is a category that legitimate security work also defeats or tests, so the definition could not separate an exploitation framework from a research tool. The eventual repair was not a better description of the software. It was an exclusion written around *purpose*: technology exchanged for vulnerability disclosure or incident response is out. A control that could not be drawn on the artifact was drawn on the activity instead.

## The arrangement and the 2013 addition

The Wassenaar Arrangement "on Export Controls for Conventional Arms and Dual-Use Goods and Technologies is a group of 41 like-minded states" that maintains control lists first established in 1996 and revised annually. Changes achieving consensus are approved at December plenary meetings, and participating states implement them domestically. Nothing about the arrangement is self-executing. It produces list text, and each state turns that text into its own regulation.

"In 2013, the Wassenaar Arrangement (WA) added cybersecurity items to the WA List, including a definition for" intrusion software. The controls reached the command and delivery platforms, the technology to develop or produce those platforms, and the technology for the development of intrusion software itself.

## Read the definition

The proposed United States definition, as it would have been added to the EAR, is worth reading in full because the problem is visible in the text. Intrusion software meant software specially designed or modified to avoid detection by monitoring tools, or to defeat protective countermeasures, "of a computer or network-capable device, and performing any of the following": "the extraction of data or information, from a computer or network-capable device, or the modification of system or user data," or "the modification of the standard execution path of a program or process in order to allow the execution of externally provided instructions."

That second limb is a description of [[cs/security/return-oriented-programming|control-flow hijacking]] written as regulation. And the technical notes name the defenses. Monitoring tools are software or hardware that monitor system behaviors or processes, and the note is explicit: "this includes antivirus (AV) products, end point security products, Personal Security Products (PSP), Intrusion Detection Systems (IDS), Intrusion Prevention Systems (IPS) or firewalls." Protective countermeasures are "techniques designed to ensure the safe execution of code, such as Data Execution Prevention (DEP), Address Space Layout Randomization (ASLR) or sandboxing."

So the control's subject is defined relative to [[cs/security/ids-and-ips|intrusion detection systems]] and [[cs/security/memory-protections-aslr-dep-canaries|DEP and ASLR]]. Anything that evades those is in scope, and evading those is what an exploit does, what a red team does, what a mitigation bypass writeup demonstrates, and what a defensive product's test harness has to do in order to prove the product works.

The drafters saw part of the problem and wrote carve-outs. Intrusion software does not include "hypervisors, debuggers or Software Reverse Engineering (SRE) tools," nor digital rights management software, nor asset tracking software. Those exclusions are tool-shaped, and the difficulty is that the same tool serves both sides.

## The 2015 attempt

The Bureau of Industry and Security published its implementing proposal on 20 May 2015. It "proposes a license requirement for the export, reexport, or transfer (in-country) of these cybersecurity items to all destinations, except Canada." A license to every country but one, for a class of items defined by defeating security controls, in an industry whose incident responders and researchers work across borders continuously.

The response is documented in the later rule. "BIS received almost 300 comments that raised substantial concerns about the proposed rule's scope and the impact the proposed rule would have on legitimate cybersecurity research and incident response activities." The concerns sorted into three. The entries were overly broad and, as a technical matter, failed to accurately describe the items intended for control. The licensing burden fell on transactions that contribute to cybersecurity. And "many commenters suggested that the proposed rule's control on technology for the" development of intrusion software "could cripple legitimate cybersecurity research."

What happened next is the unusual part. The agency did not revise and finalize. "The United States decided against amending the proposed rule and instead returned to the WA in 2016 and 2017 to negotiate changes to the text." A domestic rulemaking was abandoned in order to reopen the multilateral text it was implementing, which is a recognition that the defect was upstream of the American regulation.

## The 2017 revision

"In December 2017, the WA published the changes that resulted from those negotiations." There were three, and each one is a different repair strategy.

First, narrowing by function. Using "command and control" in the control language for hardware and software "addressed concerns from cybersecurity companies to more specifically control tools that can be used maliciously." The control moved from the capability to the infrastructure that operates it at a distance.

Second, and most consequentially, narrowing by purpose. A note was added to the entry for technology for the development of intrusion software excluding technology "that is exchanged for `vulnerability disclosure' or `cyber incident response'." The same technical information stays in or out of control depending on what it was exchanged for. That is a legal category imported from practice rather than from engineering, and it is the same move that shows up in [[cs/law/coordinated-vulnerability-disclosure-and-safe-harbor|disclosure policy and safe harbor]], where activity is characterized by its purpose because it cannot be characterized by its technique.

Third, a mundane exclusion for products "designed and limited to providing basic software updates and upgrades," which had otherwise been swept in by the delivery language.

The United States implemented the revised text in an interim final rule effective 19 January 2022. That rule "creates a new License Exception Authorized Cybersecurity Exports (ACE) that authorizes exports, reexports and transfers (in-country) of cybersecurity items" to most destinations, subject to conditions. The stated justification for controlling them at all is that the tools "could be used for surveillance, espionage, or other actions that disrupt, deny or degrade the network or devices on it."

> [!warning] Scope
> This note describes two Federal Register documents and the control text they discuss. It is a description of regulatory history, not legal advice, and it does not classify any software or say whether any export requires a license. Current control text, the conditions on License Exception ACE, and the many destination-specific rules live in the regulations themselves, and applying them to a real case is work for counsel.

## What the episode is evidence of

The specific lesson is narrow and useful: a control written against a defensive baseline will catch defenders, because the definition of the offensive artifact is the negation of the defensive one. The general lesson is about where the leverage sits. The list text was multilateral, so the American agency could not fix it alone, and did not try to paper over it. The repair took two plenary cycles and arrived as three notes.

This is the same shape as the earlier fight over cryptography, where the resolution also came from control list amendments rather than from a change of principle, described in [[cs/law/encryption-export-history-and-the-crypto-wars|the crypto wars note]].

## Related Notes

- [[cs/law/the-export-administration-regulations|The Export Administration Regulations]] - the CCL and license exception machinery this played out inside
- [[cs/law/encryption-export-history-and-the-crypto-wars|Encryption Export History and the Crypto Wars]] - the previous time a control list met a research community
- [[cs/law/coordinated-vulnerability-disclosure-and-safe-harbor|Coordinated Vulnerability Disclosure and Safe Harbor]] - the practice the 2017 exclusion note names
- [[cs/security/ids-and-ips|Intrusion Detection and Prevention]] - one of the monitoring tools the definition is written against
- [[cs/security/memory-protections-aslr-dep-canaries|Memory Protections: ASLR, DEP, and Stack Canaries]] - the protective countermeasures named in the technical note
- [[cs/security/return-oriented-programming|Return-Oriented Programming]] - the technique the second limb of the definition describes

## Sources

- Wassenaar Arrangement 2013 Plenary Agreements Implementation: Intrusion and Surveillance Items, 80 FR 28853 (20 May 2015). https://www.govinfo.gov/content/pkg/FR-2015-05-20/html/2015-11642.htm . Backs the description of the Wassenaar Arrangement and its membership, the proposed license requirement to all destinations except Canada, the proposed definition of intrusion software and its two performance limbs, the monitoring tools and protective countermeasures technical notes, and the tool exclusions.
- Information Security Controls: Cybersecurity Items, 86 FR 58205 (21 October 2021). https://www.govinfo.gov/content/pkg/FR-2021-10-21/html/2021-22774.htm . Backs the 2013 addition and its scope, the comment count and the three categories of concern, the decision to renegotiate rather than amend, the three December 2017 changes including the vulnerability disclosure and incident response exclusion, the creation of License Exception ACE, the stated justification for control, and the 19 January 2022 effective date.
