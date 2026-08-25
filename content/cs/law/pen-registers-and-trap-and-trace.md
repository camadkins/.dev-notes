---
title: Pen Registers and Trap and Trace
description: "Chapter 206 asks a judge to confirm that a prosecutor made a certification, not to evaluate whether the certification is true, which is why the order for prospective addressing data is one of the lightest instruments in federal surveillance law."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-11
updated:
aliases: []
---

Chapter 206 of title 18 is four pages long and governs the prospective collection of everything about a communication except what it says. It was enacted in 1986 alongside the two chapters that handle contents in transit and contents at rest, and it completes the design: contents get the demanding process, addressing gets this. What makes the chapter distinctive is not the low standard by itself. It is that the judge's role is defined as verification that a certification was made rather than evaluation of whether the certification is warranted.

> [!note] The idea
> Under section 3123 the court **shall** enter the order once it finds the government has certified relevance. The statute assigns the judge a ministerial function on the merits, and puts the substantive judgment inside the executive branch. That is the structural reason the pen register order is so much weaker than a warrant, and it is a difference in kind rather than in degree.

> [!warning] Scope
> This note describes the text of a federal statute and how its definitions changed in 2001. It is not legal advice, it states no view about the propriety of any collection, and it does not address the separate provisions of the Foreign Intelligence Surveillance Act that the chapter cross-references.

## Two devices, one idea

A pen register is defined as "a device or process which records or decodes dialing, routing, addressing, or signaling information transmitted by an instrument or facility from which a wire or electronic communication is transmitted," with a proviso that "such information shall not include the contents of any communication," and with carve-outs for provider and customer billing and cost accounting uses.

A trap and trace device is the mirror image: "a device or process which captures the incoming electronic or other impulses which identify the originating number or other dialing, routing, addressing, and signaling information reasonably likely to identify the source of a wire or electronic communication," again excluding contents.

Outgoing and incoming. Where you called and who called you, generalized to any transfer. Practitioners abbreviate the four covered categories as DRAS, for dialing, routing, addressing, and signaling.

## The words that made it about the internet

The original 1986 definition was about telephones and said so. The 2001 amendment record makes the change explicit: Congress "substituted 'dialing, routing, addressing, or signaling information transmitted by an instrument or facility from which a wire or electronic communication is transmitted, provided, however, that such information shall not include the contents of any communication'" for the prior text, which covered "electronic or other impulses which identify the numbers dialed or otherwise transmitted on the telephone line to which such device is attached," and inserted "or process" after "device" wherever it appeared.

Two edits, both consequential. Adding "or process" means the statute no longer contemplates a physical box on a line; software counts. Replacing numbers-dialed with dialing, routing, addressing, and signaling moves the statute off the telephone network entirely and onto anything with a header.

That last move creates the classification problem the chapter has never resolved. On a packet network, source and destination addresses and [[cs/networking/ports-and-sockets|port numbers]] are plainly addressing and signaling. A DNS query name, an HTTP request path, and the parameters after a question mark are all transmitted in the same direction and are all, in some sense, addressing. They also frequently reveal substance. The statute draws a line between DRAS and contents that a protocol designer never had a reason to draw, and it fell to the government and the courts to say where in a packet the line sits.

Section 3121(c) gestures at the problem with a technology mandate. An agency using a pen register "shall use technology reasonably available to it that restricts the recording or decoding of electronic or other impulses to the dialing, routing, addressing, and signaling information utilized in the processing and transmitting of wire or electronic communications so as not to include the contents of any wire or electronic communications." The obligation is to filter with what is reasonably available, which is a compliance standard rather than a guarantee.

## The standard

Section 3123(a)(1) is one sentence and the whole regime turns on it. On an application by an attorney for the government, "the court shall enter an ex parte order authorizing the installation and use of a pen register or trap and trace device anywhere within the United States, if the court finds that the attorney for the Government has certified to the court that the information likely to be obtained by such installation and use is relevant to an ongoing criminal investigation."

Compare the pieces against a warrant. A warrant requires probable cause; this requires relevance. A warrant requires the judge to be persuaded of the underlying facts; this requires the judge to find that a certification was made. A warrant is particular to a place; this order applies "anywhere within the United States." And the order, "upon service of that order, shall apply to any person or entity providing wire or electronic communication service in the United States whose assistance may facilitate the execution of the order," which means the same order can be handed to a provider the application never named.

Compare it also to the standard for stored records under [[cs/law/the-stored-communications-act|the Stored Communications Act]], where a court order requires specific and articulable facts showing reasonable grounds. The pen register standard is lower still, because the government need not offer facts at all, only a certification of relevance.

## The prohibition and its exceptions

Section 3121(a) states the baseline: "no person may install or use a pen register or a trap and trace device without first obtaining a court order under section 3123 of this title," or an equivalent order under the Foreign Intelligence Surveillance Act or under a qualifying foreign executive agreement. Violation is punishable: "whoever knowingly violates subsection (a) shall be fined under this title or imprisoned not more than one year, or both."

The prohibition "does not apply with respect to the use of a pen register or a trap and trace device by a provider of electronic or wire communication service" for operation, maintenance, testing, protection of the provider's rights or property, or protection of users from abuse or unlawful use of the service, or "where the consent of the user of that service has been obtained."

That provider exception is why ordinary network operations are described the way they are. Connection logging for operations and abuse handling sits inside a named exception, drawn around service necessity, rather than outside the statute entirely.

## Why the design holds together

The chapter is unintelligible on its own and obvious next to its siblings. In 1986 Congress removed the identity of the parties and the existence of a communication from the definition of contents in [[cs/law/the-wiretap-act-and-interception|the Wiretap Act]], and in the same legislation created this chapter to govern exactly that residue. The constitutional premise underneath both moves is [[cs/law/the-third-party-doctrine|Smith v. Maryland]], decided seven years earlier, which held that installing a pen register was not a search at all. Congress built a statutory permission regime on top of conduct the Constitution had already declined to regulate, which is why the statutory standard could be set so low without any constitutional floor pushing back.

The engineering wrinkle is that the premise ages badly. Encrypted transport moved a great deal of formerly visible signaling out of reach: [[cs/networking/quic-and-udp-transport|QUIC]] encrypts most of its transport header, so much of what a 1986 drafter would have called signaling is now ciphertext to an observer in the middle. In the other direction, onion routing exists specifically to defeat the inference that DRAS supports, which is an acknowledgment that addressing data was never the harmless residue the statute treats it as.

## Related Notes

- [[cs/law/the-third-party-doctrine|The Third-Party Doctrine]] for Smith v. Maryland, the constitutional premise the chapter rests on.
- [[cs/law/the-wiretap-act-and-interception|The Wiretap Act and Interception]] for the contents regime this chapter is the complement of.
- [[cs/law/the-stored-communications-act|The Stored Communications Act]] for the retrospective version of the same fields.
- [[cs/networking/ports-and-sockets|Ports and Sockets]] because port numbers are the clearest case of addressing and signaling on a packet network.
- [[cs/networking/quic-and-udp-transport|QUIC over UDP]] for a transport that encrypts much of the signaling the statute assumes is observable.
- [[cs/systems/onion-routing-and-anonymity-networks|Onion Routing and Anonymity Networks]] for the system built to defeat exactly the inferences DRAS enables.

## Sources

- <https://www.law.cornell.edu/uscode/text/18/3121> for the general prohibition, the provider and consent exceptions, the technology-restriction requirement in subsection (c), and the one-year penalty.
- <https://www.law.cornell.edu/uscode/text/18/3123> for the certification standard, the mandatory language directing the court to enter the order, the nationwide scope, and the provision extending an order to unnamed providers.
- <https://www.law.cornell.edu/uscode/text/18/3127> for the definitions of pen register and trap and trace device and the 2001 amendment record replacing the numbers-dialed language with dialing, routing, addressing, and signaling information.
