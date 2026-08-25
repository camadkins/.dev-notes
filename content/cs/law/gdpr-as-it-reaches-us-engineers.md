---
title: GDPR as It Reaches US Engineers
description: "The regulation does not ask where a company is incorporated or where the server sits. Article 3 asks where the person is, and what the company is doing toward them."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-17
updated:
aliases:
  - GDPR
---

An American engineer's first encounter with the General Data Protection Regulation usually arrives as a compliance ticket with no explanation attached, and the natural reaction is to assume it is a European problem that legal will handle. The regulation's own text says otherwise, and it says so early. Article 3 is titled "Territorial scope," and it never mentions where the controller is incorporated or where the processing hardware lives.

> [!note] The idea
> GDPR's jurisdictional hook is not establishment and not geography of infrastructure. Article 3(2) reaches a controller with no presence in the Union at all, on the basis of two facts about the data subject: that the person is in the Union, and that the processing relates either to offering them goods or services or to monitoring their behaviour. The second limb is the one that catches engineers, because behavioural analytics is monitoring by construction.

> [!warning] Scope
> This note describes what the articles of Regulation (EU) 2016/679 say, and what one Commission adequacy decision provides. It is not legal advice, it does not determine whether the regulation applies to any particular company or system, and it is not a compliance checklist.

## The two limbs of Article 3

Paragraph 1 is the establishment rule. The regulation "applies to the processing of personal data in the context of the activities of an establishment of a controller or a processor in the Union, regardless of whether the processing takes place in the Union or not." Where the processing happens is expressly irrelevant. A European subsidiary with a data pipeline running entirely on American hardware is inside paragraph 1.

Paragraph 2 is the one with no territorial anchor on the company's side at all. The regulation "applies to the processing of personal data of data subjects who are in the Union by a controller or processor not established in the Union, where the processing activities are related to" either "the offering of goods or services, irrespective of whether a payment of the data subject is required, to such data subjects in the Union" or "the monitoring of their behaviour as far as their behaviour takes place within the Union."

Read those two triggers as an engineer rather than a lawyer. The first says a free product counts, because payment is expressly not required. The second says the activity does not have to be commercial toward the individual at all. Behavioural tracking is the paradigm case of monitoring, and behavioural tracking is what most instrumentation is.

Article 27 attaches a concrete consequence to falling inside paragraph 2. "Where Article 3(2) applies, the controller or the processor shall designate in writing a representative in the Union," unless the processing is occasional, excludes large-scale special-category data, and is "unlikely to result in a risk to the rights and freedoms of natural persons."

## What counts as personal data

The definitional breadth in Article 4 does as much work as Article 3. "Personal data" means "any information relating to an identified or identifiable natural person," and an identifiable person is one identifiable "directly or indirectly, in particular by reference to an identifier such as a name, an identification number, location data, an online identifier." That last phrase is what pulls [[cs/security/session-management-and-secure-cookies|session identifiers and cookies]] inside the regulation without anyone having typed a name.

"Processing" is equally wide: "any operation or set of operations which is performed on personal data or on sets of personal data, whether or not by automated means," and the enumerated examples run from collection and storage through "disclosure by transmission, dissemination or otherwise making available" to erasure and destruction. Deleting a record is processing. So is reading one.

The security principle sits in Article 5(1)(f), where personal data must be "processed in a manner that ensures appropriate security of the personal data, including protection against unauthorised or unlawful processing and against accidental loss, destruction or damage, using appropriate technical or organisational measures," and the regulation names that principle "integrity and confidentiality." Two thirds of [[cs/security/cia-triad|the CIA triad]], again, written into a legal instrument.

## The six lawful bases

Article 6(1) is written as a closed list, and its opening clause is the operative part: "Processing shall be lawful only if and to the extent that at least one of the following applies." The six are consent for one or more specific purposes; necessity for the performance of a contract to which the data subject is party; necessity for compliance with a legal obligation; necessity to protect vital interests; necessity for a task carried out in the public interest or in the exercise of official authority; and legitimate interests.

The sixth carries a built-in balancing test and an exclusion. Legitimate interests apply "except where such interests are overridden by the interests or fundamental rights and freedoms of the data subject which require protection of personal data, in particular where the data subject is a child," and the regulation adds that this basis "shall not apply to processing carried out by public authorities in the performance of their tasks."

Consent, the basis most product teams reach for first, is conditioned by Article 7. The controller "shall be able to demonstrate that the data subject has consented," the request must be "clearly distinguishable from the other matters, in an intelligible and easily accessible form, using clear and plain language," and withdrawal must be possible at any time: "It shall be as easy to withdraw as to give consent." Article 9 sits above all of this for special categories, where processing of data revealing racial or ethnic origin, political opinions, religious beliefs, trade union membership, genetic data, biometric data used for unique identification, health data, or sex life "shall be prohibited" unless one of the listed conditions applies.

## Getting data out of the Union

Chapter V governs transfers, and Article 44 states the general principle that a transfer to a third country may take place "only if, subject to the other provisions of this Regulation, the conditions laid down in this Chapter are complied with by the controller and processor, including for onward transfers." The onward-transfer clause is the reason a subprocessor chain matters legally and not only operationally.

Three mechanisms follow. Article 45 permits transfer where "the Commission has decided that the third country, a territory or one or more specified sectors within that third country, or the international organisation in question ensures an adequate level of protection," and such a transfer "shall not require any specific authorisation." Article 46 covers the case where no adequacy decision exists: the controller may transfer "only if the controller or processor has provided appropriate safeguards, and on condition that enforceable data subject rights and effective legal remedies for data subjects are available," and the listed safeguards include binding corporate rules and "standard data protection clauses adopted by the Commission." Article 49 supplies narrow derogations for specific situations.

For the United States the adequacy route is live but conditional. The Commission's 2023 implementing decision concluded that "the United States ensures an adequate level of protection for personal data transferred from the Union to organisations in the United States that are included in the 'Data Privacy Framework List', maintained and made publicly available by the U.S. Department of Commerce." Adequacy attaches to a list membership, not to the country as a whole, which is why the same transfer can be adequate for one American vendor and not for the one next to it. The politics behind that construction belong to [[cs/geopolitics/cyber-sovereignty|cyber sovereignty]], and the countervailing US access authorities belong to [[cs/law/the-cloud-act-and-cross-border-data|the CLOUD Act]].

## Deadlines and exposure

Article 33 sets one clock for the whole Union. On a personal data breach the controller shall notify the competent supervisory authority "without undue delay and, where feasible, not later than 72 hours after having become aware of it," unless the breach "is unlikely to result in a risk to the rights and freedoms of natural persons," and a late notification "shall be accompanied by reasons for the delay." One deadline, one addressee, in contrast to the fifty-odd separate triggers of [[cs/law/state-breach-notification-law|American state breach notification law]].

Article 83 supplies the number that gets the ticket filed in the first place. Infringements of the listed provisions are subject to administrative fines "up to 20 000 000 EUR, or in the case of an undertaking, up to 4 % of the total worldwide annual turnover of the preceding financial year, whichever is higher," with a lower tier of 10 000 000 EUR or 2 percent for a different set of provisions.

## Related Notes

- [[cs/law/state-breach-notification-law|State Breach Notification Law]] for the American approach to the same event, distributed across fifty-odd statutes instead of one article.
- [[cs/law/the-cloud-act-and-cross-border-data|The CLOUD Act and Cross-Border Data]] for the US statute that reaches data held abroad, which is the mirror image of Chapter V.
- [[cs/law/sectoral-privacy-hipaa-glba-ferpa|Sectoral Privacy: HIPAA, GLBA, FERPA]] for the sector-by-sector American alternative to a general regulation.
- [[cs/security/session-management-and-secure-cookies|Session Management and Secure Cookies]] because an online identifier is personal data by definition, which makes session design a regulated question.
- [[cs/security/cia-triad|The CIA Triad]] because Article 5(1)(f) names integrity and confidentiality as a legal principle.
- [[cs/geopolitics/cyber-sovereignty|Cyber Sovereignty]] for why adequacy attaches to a certification list rather than to a country.

## Sources

- <https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679> for the text of Regulation (EU) 2016/679: Article 3 territorial scope, Article 4 definitions, Article 5(1)(f), Article 6 lawful bases, Article 7 consent, Article 9 special categories, Article 27 representatives, Article 33 breach notification, Articles 44 to 46 on transfers, and Article 83 administrative fines.
- <https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023D1795> for the Commission implementing decision finding an adequate level of protection for organisations on the Data Privacy Framework List maintained by the U.S. Department of Commerce.
