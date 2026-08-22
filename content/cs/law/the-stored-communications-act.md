---
title: The Stored Communications Act
description: "Chapter 121 sorts providers into two 1986 categories and then hands the government a ladder of legal process, where the required showing depends less on how sensitive the data is than on which rung of a decades-old taxonomy the provider happens to occupy."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-04
updated:
aliases:
  - SCA
  - 18 USC 2701
  - ECPA Title II
---

Title II of the Electronic Communications Privacy Act of 1986 sits in chapter 121 of title 18 and does three separate jobs. It creates a criminal offense for unauthorized access to a communications facility. It forbids providers from voluntarily handing over customer data, with a list of exceptions. And it tells the government what legal process it needs to compel each category of data. Those three jobs look unrelated until you notice that all of them depend on the same 1986 classification of what kind of service a company is providing.

> [!note] The idea
> The Stored Communications Act does not grade its protections by how revealing the data is. It grades them by **the category of the provider and the storage state of the item**: an electronic communication service or a remote computing service, contents or non-content records, in storage for 180 days or fewer or longer. Those distinctions were drawn around 1986 systems, and a modern service can sit in more than one box at once for different features of the same product.

> [!warning] Scope
> This note describes what a federal statute says and what process it names for each category of data. It is not legal advice, it does not state what any provider or investigator must do in a given case, and it does not address the constitutional overlay that courts have placed on the statute.

## The offense

Section 2701 makes it an offense to "intentionally access without authorization a facility through which an electronic communication service is provided" or to intentionally exceed an authorization to access that facility, "and thereby obtain, alter, or prevent authorized access to a wire or electronic communication while it is in electronic storage in such system."

That reads like [[cs/law/the-computer-fraud-and-abuse-act|the CFAA]] narrowed to one target. The protected object is a communications facility rather than any computer, and the harm is to a communication in electronic storage rather than to data generally. The exceptions are short: subsection (a) "does not apply with respect to conduct authorized" by the provider, by a user of the service with respect to that user's own communications, or by the compelled-disclosure sections of the same chapter.

The provision is worth noticing because it is specific. Access to a stored communication on a provider's system is addressed by its own criminal section rather than only by the general computer statute, and the two have different elements and different penalty structures.

## Two kinds of provider

The compelled-disclosure rules turn on a distinction between an electronic communication service, which transmits communications, and a remote computing service, which the statute describes functionally as one holding communications "solely for the purpose of providing storage or computer processing services to such subscriber or customer, if the provider is not authorized to access the contents of any such communications for purposes of providing any services other than storage or computer processing."

In 1986 that distinction was sharp. An email host moved messages. A time-sharing bureau held your files and ran jobs on them. Today a single product is often both at once, and the second half of the remote computing service definition, the condition that the provider is not authorized to access contents for other purposes, is a condition that most contemporary services fail by design, because scanning and indexing content is how the service works. The taxonomy predates [[cs/history/cloud-computing-and-virtualization|the arrival of cloud computing]] as a general model, and the statute has never been rewritten around it.

## What providers may not disclose

Section 2702 sets a default of nondisclosure with different scopes for different targets.

A public electronic communication service "shall not knowingly divulge to any person or entity the contents of a communication while in electronic storage by that service." A public remote computing service is under a parallel prohibition for content it holds. Note who the prohibition runs against: any person or entity. Content is protected from everybody by default.

Non-content records are protected less. A provider "shall not knowingly divulge a record or other information pertaining to a subscriber to or customer of such service" to any governmental entity. The prohibition is limited to government recipients, which is why the statute is not a general privacy law and does not by itself stop a provider from sharing subscriber records commercially.

The exceptions include disclosure "to an addressee or intended recipient of such communication or an agent of such addressee or intended recipient" and disclosure "with the lawful consent of the originator or an addressee or intended recipient of such communication, or the subscriber in the case of remote computing service," alongside further exceptions for emergencies, child exploitation reporting, and protection of the provider's rights and property.

## The ladder of process

Section 2703 is where the categories cash out. Four rungs, in increasing order of what the government must show.

A subpoena reaches basic subscriber information. Section 2703(c)(2) lists it precisely: name, address, "local and long distance telephone connection records, or records of session times and durations," length of service and types of service used, "telephone or instrument number or other subscriber number or identity, including any temporarily assigned network address," and means and source of payment. That last item and the network address entry are why the list matters to engineers: session times, durations, and assigned addresses are exactly the fields a logging pipeline retains, and a subpoena reaches them.

A court order under section 2703(d) reaches other non-content records and certain content. The standard is stated in the subsection and is not probable cause. The order "shall issue only if the governmental entity offers specific and articulable facts showing that there are reasonable grounds to believe" that the contents or records sought "are relevant and material to an ongoing criminal investigation."

A warrant reaches content held by an electronic communication service in storage for a short time. The text conditions the requirement on duration: a warrant is required for content "that is in electronic storage in an electronic communications system for one hundred and eighty days or less," and the statute then provides that content "that has been in electronic storage in an electronic communications system for more than one hundred and eighty days" may be obtained "by the means available under subsection (b)," which includes a subpoena or a 2703(d) order with prior notice to the subscriber.

That 180-day line is the statute's most criticized feature. It was drafted when a message left on a server past six months was plausibly abandoned rather than archived, and the practical meaning of the same text changed completely once mailboxes became permanent.

Notice is its own axis. For the records categories, "a governmental entity receiving records or information under this subsection is not required to provide notice to a subscriber or customer," and delayed notice is available elsewhere in the chapter for content obtained with prior notice.

## Preservation

One provision deserves separate attention because it operates before any process issues. Under section 2703(f), a provider "shall take all necessary steps to preserve records and other evidence in its possession pending the issuance of a court order or other process," on request from a governmental entity, and those "records referred to in paragraph (1) shall be retained for a period of 90 days," extendable another 90 days on renewed request.

A preservation request is not compelled disclosure. It freezes what already exists so that ordinary retention policy does not destroy it while process is obtained. That makes retention configuration a legally load-bearing setting: what [[cs/security/siem-and-security-logging|a logging and retention pipeline]] happens to keep determines what a later preservation letter can freeze, and a system that rotates aggressively simply has less to preserve.

## The seam with the Wiretap Act

The chapter's boundary with [[cs/law/the-wiretap-act-and-interception|Title III]] is temporal and is the most consequential structural feature of the whole scheme. Acquisition of contents in transit runs through the super-warrant. Access to the same contents in electronic storage runs through this chapter's ladder. The message does not change. Its legal status does, based on where in its lifecycle the government reaches for it.

The Supreme Court eventually held that one particular category of records obtainable under the 2703(d) standard was, as a constitutional matter, reachable only with a warrant. That is the subject of [[cs/law/riley-carpenter-and-the-fourth-amendment-online|Carpenter]], and it left the statute intact while overriding it for that category.

## Related Notes

- [[cs/law/the-wiretap-act-and-interception|The Wiretap Act and Interception]] for the chapter governing the same data in motion.
- [[cs/law/riley-carpenter-and-the-fourth-amendment-online|Riley, Carpenter, and the Fourth Amendment Online]] for the constitutional limit placed on one category of 2703(d) records.
- [[cs/law/the-cloud-act-and-cross-border-data|The CLOUD Act and Cross-Border Data]] for the 2018 amendment to this chapter about where data is stored.
- [[cs/law/pen-registers-and-trap-and-trace|Pen Registers and Trap and Trace]] for prospective collection of the same non-content fields.
- [[cs/history/cloud-computing-and-virtualization|Cloud Computing and Virtualization]] because the remote computing service category describes a 1986 model that the industry left behind.
- [[cs/security/siem-and-security-logging|SIEM and Security Logging]] for the retention decisions that determine what a preservation request can reach.

## Sources

- <https://www.law.cornell.edu/uscode/text/18/2701> for the unauthorized access offense, its electronic storage element, and its exceptions.
- <https://www.law.cornell.edu/uscode/text/18/2702> for the default prohibitions on divulging contents and subscriber records, and the recipient-consent exceptions.
- <https://www.law.cornell.edu/uscode/text/18/2703> for the ladder of legal process: the 180-day content rule, the subscriber-record list reachable by subpoena, the specific and articulable facts standard for a 2703(d) order, the no-notice provision for records, and the 90-day preservation obligation.
