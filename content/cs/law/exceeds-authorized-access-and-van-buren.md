---
title: Exceeds Authorized Access and Van Buren
description: "For two decades the federal circuits split over whether violating a computer-use policy was a federal crime, and in 2021 the Supreme Court answered with a metaphor an engineer already understands: the gate is either up or down."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-07-02
updated:
aliases: []
---

A police sergeant in Georgia ran a license plate through a law enforcement database in exchange for cash. He was allowed to use the database. He was not allowed to use it for that. Every fact was undisputed, which made the case a clean instrument for a question the federal courts had been fighting over since 2001: when a person with legitimate access to a system uses it for an illegitimate purpose, has that person committed a federal crime?

> [!note] The idea
> The phrase "exceeds authorized access" turns on **where you went, not why you went there**. The Supreme Court read the statute as a question about system boundaries rather than about motive, which puts the criminal line in roughly the same place a working access control system already puts it: you either can reach the resource or you cannot.

> [!warning] Scope
> This note describes what a Supreme Court opinion held and quotes its text. It is not legal advice, it does not tell you whether any specific access is lawful, and courts continue to work out what the decision means in cases the opinion expressly did not reach.

## The phrase and the split

[[cs/law/the-computer-fraud-and-abuse-act|The CFAA]] defines "exceeds authorized access" as accessing a computer with authorization "and to use such access to obtain or alter information in the computer that the accesser is not entitled so to obtain or alter." Two readings of that sentence coexisted for twenty years.

The narrow reading treats the phrase as spatial. You have authorization to the system, you go into a part of the system you were never allowed into, and that is the offense. The broad reading treats it as conditional. Your authorization came with conditions, whether in an employment policy or a terms of service agreement, and using the data outside those conditions means you were never entitled to obtain it.

The Court's own footnote lists the divide. On one side sat decisions from the Sixth, Second, Fourth, and Ninth Circuits. On the other sat decisions from the Eleventh, Fifth, Seventh, and First. Same statutory text, opposite answers, depending on where the defendant happened to be. The Court "granted certiorari to resolve the split in authority regarding the scope of liability under the CFAA's exceeds authorized access clause."

## What the Court held

Justice Barrett delivered the opinion of the Court on June 3, 2021. The holding, stated at the end of the opinion:

> an individual "exceeds authorized access" when he accesses a computer with authorization but then obtains information located in particular areas of the computer, such as files, folders, or databases, that are off limits to him

And the negative half, from the opening: "It does not cover those who, like Van Buren, have improper motives for obtaining information that is otherwise available to them."

The reasoning that gets there is textual and structural, and it hinges on one small word. The definition says the accesser is not entitled "so to obtain." The Court read "so" as a term of reference pointing back to the manner already stated, which is obtaining information by using a computer one is authorized to access. On the government's reading, "so" would have to absorb every circumstance that might qualify a person's right to the information, which is a lot of freight for two letters.

## Gates up or down

The structural argument produced the line the case is remembered for. Subsection (a)(2) describes two ways of getting information unlawfully: accessing a computer "without authorization," and accessing it with authorization but then obtaining information you are "not entitled so to obtain." The narrow reading treats both clauses the same way, and the Court said so directly:

> liability under both clauses stems from a gates-up-or-down inquiry

Either you can reach the system or you cannot. Either you can reach that area within the system or you cannot. The government's position required reading the first clause as a gate and the second as a set of circumstances, which the Court found inconsistent with the design of the provision. A statute that asked "were you permitted through this door" for outside intruders and "did you have a good reason" for insiders would be answering two different questions with one sentence.

For anyone who has configured [[cs/security/access-control-models-rbac-abac|a role or attribute based access control system]], this is familiar terrain. A permission check returns a boolean. It does not ask what the subject intends to do with the object afterward, and a system that tried to would be a system that could not be evaluated. The Court's reading pushes the criminal statute toward the same shape as the enforcement mechanism it sits on top of.

A footnote reinforces the point in a way engineers should notice. The Court observed that the password trafficking prohibition, enacted alongside the definition in 1986, bars selling credentials through which a computer may be accessed without authorization, and that this contemplates a specific type of authorization, namely authentication, turning on whether a user's credentials let him past the access gate rather than on scope-based restrictions. That is the statute reaching for the distinction between [[cs/security/authentication-vs-authorization|proving identity and being permitted an action]], and landing closer to the authentication side than most people assumed.

## What the Court did not decide

Footnote 8 is the most consequential sentence in the opinion for practitioners, and it is a reservation rather than a holding:

> For present purposes, we need not address whether this inquiry turns only on technological (or "code-based") limitations on access, or instead also looks to limits contained in contracts or policies.

So the gate exists. Whether a contract can be a gate is open. A robots.txt file, a rate limit, a clickthrough agreement, and a firewall rule sit on a spectrum, and the opinion declines to say where along it a limit stops being a policy and starts being a gate. Someone reasoning about [[cs/security/privilege-separation-and-least-privilege|where to place a privilege boundary]] in a system design is, without meaning to, reasoning about the same spectrum.

## The consequences argument

The last section of the opinion is not textual at all. It is about scale. The government's interpretation, the Court wrote, "would attach criminal penalties to a breathtaking amount of commonplace computer activity." The illustration is deliberately mundane: employers commonly say that work computers are for business purposes only, so on the government's reading, "an employee who sends a personal e-mail or reads the news using her work computer has violated the CFAA."

Extend that to websites, where access is conditioned on agreeing to terms of service, and the majority noted that amici had explained the reading would criminalize everything from embellishing an online dating profile to using a pseudonym on Facebook. If a computer use policy violation is a federal crime, then "otherwise law-abiding citizens are criminals. Take the workplace."

The Court was careful about the doctrinal status of this argument. It declined to rest on the rule of lenity or on constitutional avoidance, saying the text, context, and structure already supported the narrow reading, and calling the consequences "extra icing on a cake already frosted." The consequences did not decide the case. They confirmed that the answer the text gave was the plausible one.

## What changed and what did not

Van Buren removed one category of federal exposure: pure misuse of data you were permitted to obtain. It did not narrow the definition of protected computer, did not touch the damage paragraph, and did not resolve the code-versus-contract question. It also did not disturb the civil cause of action, which means the same conduct can still be litigated as a contract or trade secret matter even where the criminal theory fails.

The decision is also a rare case where a court's chosen metaphor is a piece of systems vocabulary rather than a legal term of art. Gates up or down is not in the statute. It came from the way a computer person describes access, and it is now the framing a federal criminal statute is read through.

## Related Notes

- [[cs/law/the-computer-fraud-and-abuse-act|The Computer Fraud and Abuse Act]] for the statute the case construes.
- [[cs/law/cfaa-penalties-and-the-charging-problem|CFAA Penalties and the Charging Problem]] for what turns on the answer at sentencing.
- [[cs/security/authentication-vs-authorization|Authentication vs Authorization]] for the technical distinction the footnote reaches for.
- [[cs/security/access-control-models-rbac-abac|Access Control Models: RBAC and ABAC]] because a permission check is the gates-up-or-down inquiry implemented.
- [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] for the design question of where a boundary belongs.
- [[cs/security/penetration-testing-methodology|Penetration Testing Methodology]] for the practice most exposed to the reserved code-versus-contract question.

## Sources

- <https://www.supremecourt.gov/opinions/20pdf/19-783_k53l.pdf> for the slip opinion in Van Buren v. United States: the holding, the gates-up-or-down framing, footnote 8 reserving the code-versus-contract question, the password trafficking footnote, and the breathtaking-amount passage.
- <https://www.law.cornell.edu/uscode/text/18/1030> for the statutory definition of exceeds authorized access at 18 U.S.C. 1030(e)(6) and the offense text of subsection (a)(2).
