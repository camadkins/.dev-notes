---
title: The Third-Party Doctrine
description: "Two cases decided three years apart hold that handing information to a bank or a phone company forfeits any Fourth Amendment interest in it, and the reasoning turns on an assumption about what users know that the Court itself acknowledged was hard to measure."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-06-19
updated:
aliases:
  - Smith v. Maryland
  - United States v. Miller
  - Assumption of Risk Doctrine
---

The doctrine that governs most of what a network knows about you comes from two cases about paper and copper. In 1976 the Supreme Court held that a depositor had no Fourth Amendment interest in his bank's records of his checks. In 1979 it held that a telephone subscriber had no Fourth Amendment interest in the numbers he dialed. Neither case involved a computer, and together they supply the constitutional premise for nearly every statute in the surveillance chapters of title 18.

> [!note] The idea
> The doctrine is an **assumption of risk rule, not a secrecy rule**. It does not say the information is unimportant or public. It says that by conveying it to an intermediary for a limited purpose, the user accepted the possibility that the intermediary would pass it along, and that this acceptance forfeits the constitutional interest even if the user expected confidence to be kept.

> [!warning] Scope
> This note describes what two Supreme Court opinions held and quotes their reasoning. It is not legal advice, it makes no claim about the current constitutional status of any category of data, and later decisions have limited the doctrine's application in ways covered in a separate note.

## Miller: the bank records

United States v. Miller, 425 U.S. 435, was decided April 21, 1976. Miller was charged with tax offenses. Prosecutors obtained microfilms of his checks and deposit slips from two banks by subpoena, and he argued the subpoenas were defective and the records therefore seized in violation of the Fourth Amendment. The Court held that "respondent possessed no Fourth Amendment interest in the bank records that could be vindicated by a challenge to the subpoenas."

The first move was characterization. "The subpoenaed materials were business records of the banks, not respondent's private papers." Once the records belong to the bank, the depositor is a stranger to them and has nothing to suppress.

The second move was the one that mattered. Even looking at the original checks rather than the bank's copies, the Court found no legitimate expectation of privacy in their contents, because "the checks are not confidential communications but negotiable instruments to be used in commercial transactions," and because all the documents "contain only information voluntarily conveyed to the banks and exposed to their employees in the ordinary course of business."

Then the rule, stated flatly:

> The depositor takes the risk, in revealing his affairs to another, that the information will be conveyed by that person to the Government.

And the sentence that closes the escape hatch: the Fourth Amendment does not prohibit obtaining information revealed to a third party and conveyed to the government "even if the information is revealed on the assumption that it will be used only for a limited purpose and the confidence placed in the third party will not be betrayed."

That clause is the whole doctrine compressed. A user's expectation of confidentiality is not merely unenforceable against the government. It is constitutionally irrelevant.

## Smith: the numbers dialed

Smith v. Maryland, 442 U.S. 735, was decided June 20, 1979. Police, investigating a robbery and threatening phone calls, asked the telephone company to install a pen register at its central office to record the numbers dialed from Smith's home. No warrant, no court order. The register showed a call to the victim's phone, which supported a warrant to search Smith's residence.

The Court applied the two-part inquiry it draws from Katz: "whether the individual has exhibited an actual (subjective) expectation of privacy; and second, whether his expectation is one that society is prepared to recognize as 'reasonable.'"

On the first part, the Court doubted the subjective expectation existed. "First, we doubt that people in general entertain any actual expectation of privacy in the numbers they dial." Its reasoning was empirical and, read now, quaint: subscribers see long distance calls itemized on monthly bills, phone books tell them the company can help trace unwelcome calls, and pen registers are used routinely for billing checks and fraud detection.

On the second part, it did not matter, because the doctrine from Miller supplied the answer. When Smith used his phone, he "voluntarily conveyed numerical information to the telephone company," and in doing so "he assumed the risk that the company would reveal the information to the police."

The Court then rejected the argument that automation changed anything, in a passage that is unexpectedly relevant to anyone who thinks about system architecture. "The switching equipment that processed those numbers is merely the modern counterpart of the operator who, in an earlier day, personally completed calls for the subscriber," and "we are not inclined to hold that a different constitutional result is required because the telephone company has decided to automate."

The holding: "the installation and use of a pen register, consequently, was not a 'search,' and no warrant was required."

## The logic, and what it assumes

Stated as a rule, the doctrine has three steps. The user conveys information to an intermediary. The conveyance is voluntary in the sense that the user chose to use the service. Therefore the user has assumed the risk of onward disclosure and holds no constitutional interest in the information.

Every step carries an assumption that an engineer should recognize as load-bearing.

The first assumes a clean separation between the content of a communication and the information needed to route it. On a circuit-switched telephone network that separation was real and physically visible; a pen register and a wiretap were different pieces of equipment attached to different things. On a packet network the separation is a matter of where you cut the frame, and the same infrastructure carries both. The whole design of [[cs/law/pen-registers-and-trap-and-trace|the pen register statute]] is an attempt to keep that separation alive by statutory definition after the physical basis for it dissolved.

The second assumes the conveyance is a choice. That was more plausible when the alternative to a telephone was writing a letter. It is strained when the intermediary is one a device contacts automatically. Every name resolution a machine performs conveys the destination to a resolver without any human act at all, which is why [[cs/systems/dns-the-domain-name-system|DNS]] is such an uncomfortable fit for a doctrine framed around a subscriber deciding to dial.

The third assumes that the disclosed information is thin. Both opinions lean on the limited revealing capacity of what was disclosed: a pen register does not capture what was said, and a check is a commercial instrument rather than a confidence. Neither case asked what happens when the record set is continuous, comprehensive, and retained for years, which is the question [[cs/geopolitics/surveillance-and-privacy|the aggregation argument]] puts at the center of modern surveillance debate.

## The dissent that aged well

Justice Marshall dissented in Smith and attacked the assumption of risk framing directly. "Privacy is not a discrete commodity, possessed absolutely or not at all. Those who disclose certain facts to a bank or phone company for a limited business purpose need not assume that this information will be released to other persons for other purposes."

He also named the chilling effect argument, observing that the prospect of unregulated governmental monitoring would prove disturbing even to those with nothing illicit to hide, and that members of unpopular political organizations and journalists with confidential sources may legitimately wish to avoid disclosure of their personal contacts. That framing, which lost in 1979, is close to the framing that later prevailed for one category of records in [[cs/law/riley-carpenter-and-the-fourth-amendment-online|Carpenter]].

## Why it structures the statutes

Once the Constitution says a category of data is not protected, the only protection it can have is statutory. That is exactly what Congress built. The distinction between contents and addressing in [[cs/law/the-wiretap-act-and-interception|the Wiretap Act]], the ladder of process in the Stored Communications Act, and the certification standard for pen registers are all statutory constructs erected on ground the Fourth Amendment had vacated. That is why those statutes can be amended by ordinary legislation, and why an engineer reading them finds standards calibrated to categories of business record rather than to sensitivity of information.

## Related Notes

- [[cs/law/riley-carpenter-and-the-fourth-amendment-online|Riley, Carpenter, and the Fourth Amendment Online]] for the decision that declined to extend the doctrine to cell-site records.
- [[cs/law/pen-registers-and-trap-and-trace|Pen Registers and Trap and Trace]] for the statute Congress built directly on top of Smith.
- [[cs/law/the-stored-communications-act|The Stored Communications Act]] for the statutory protection that exists because the constitutional protection does not.
- [[cs/geopolitics/surveillance-and-privacy|Surveillance and Privacy]] for the wider argument about aggregation and inference.
- [[cs/systems/dns-the-domain-name-system|DNS, the Domain Name System]] because name resolution conveys a destination to an intermediary with no human act at all.
- [[cs/systems/onion-routing-and-anonymity-networks|Onion Routing and Anonymity Networks]] for the engineering response to a doctrine that leaves routing data unprotected.

## Sources

- <https://www.law.cornell.edu/supremecourt/text/425/435> for United States v. Miller: the decision date, the holding that the depositor had no Fourth Amendment interest, the characterization of the records as the bank's business records, and the assumption of risk passage including the limited-purpose clause.
- <https://www.law.cornell.edu/supremecourt/text/442/735> for Smith v. Maryland: the decision date, the two-part Katz inquiry, the doubts about subjective expectation, the assumption of risk holding, the automation passage, the no-search holding, and Justice Marshall's dissent.
