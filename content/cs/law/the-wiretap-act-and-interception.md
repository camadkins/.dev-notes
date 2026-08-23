---
title: The Wiretap Act and Interception
description: "Title III makes intercepting the contents of a communication a felony and then builds an unusually demanding court order to permit it, and the line between contents and everything else was drawn by a single deletion Congress made in 1986."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-07-24
updated:
aliases:
  - Title III
  - 18 USC 2511
  - Omnibus Crime Control Act Title III
---

Congress passed Title III of the Omnibus Crime Control and Safe Streets Act in 1968 to do two things at once: prohibit wiretapping generally, and create a narrow, heavily conditioned path by which the government could do it anyway. The prohibition is in 18 U.S.C. 2511. The path is in 18 U.S.C. 2518. Between them sits the definitions section, 18 U.S.C. 2510, which is where most of the interesting engineering lives, because a statute that regulates acquisition of communications has to define what a communication is and what part of it counts.

> [!note] The idea
> The statute regulates **contents**, and contents is a defined term that was narrowed by an amendment rather than by a court. Until 1986 the statutory definition of contents expressly included the identity of the parties and the existence of the communication. The 1986 rewrite struck those words. The contents versus metadata line that now organizes surveillance law is the residue of that deletion.

> [!warning] Scope
> This note describes the text of a federal statute and its amendment history. It is not legal advice, it does not tell you whether recording any particular conversation is lawful, and consent rules in particular vary by state in ways this note does not address.

## Three kinds of communication

The statute does not have one subject. It has three, and they carry different rules.

A "wire communication" is "any aural transfer made in whole or in part through the use of facilities for the transmission of communications by the aid of wire, cable, or other like connection." That is a telephone call, defined by the medium and by the fact that a human voice is in it.

An "oral communication" is a spoken communication uttered by a person exhibiting an expectation that it is not subject to interception, under circumstances justifying that expectation. That is a bug in a room, and it imports the Fourth Amendment reasonable expectation test straight into the statutory element.

An "electronic communication" is the catch-all: "any transfer of signs, signals, writing, images, sounds, data, or intelligence of any nature transmitted in whole or in part by a wire, radio, electromagnetic, photoelectronic or photooptical system that affects interstate or foreign commerce," excluding wire and oral communications, tone-only pagers, tracking devices, and certain stored electronic funds transfer information. That category did not exist in 1968. It was added by the Electronic Communications Privacy Act in 1986, and it is the category almost all network traffic falls into.

## What interception means

"Intercept" is defined as "the aural or other acquisition of the contents of any wire, electronic, or oral communication through the use of any electronic, mechanical, or other device." Three elements matter to an engineer reading that. It is acquisition, so mere presence on a path is not enough. It is of contents, not of anything else the traffic carries. And it must be through a device, which the statute then defines separately with its own carve-outs.

The prohibition itself, in 2511(1)(a), reaches anyone who "intentionally intercepts, endeavors to intercept, or procures any other person to intercept or endeavor to intercept, any wire, oral, or electronic communication." Subsections (c) and (d) extend liability to disclosing and to using the contents when the person knows or has reason to know they came from an unlawful interception. The penalty for a violation of subsection (1) is that the offender "shall be fined under this title or imprisoned not more than five years, or both," subject to exceptions elsewhere in the section.

This is the statutory sibling of what security engineering calls [[cs/security/man-in-the-middle-attacks|a man in the middle]]. The technique is the same regardless of who performs it; the statute distinguishes actors and conditions, not mechanisms.

## The deletion that made metadata

Here is the amendment history worth knowing. The statute defines "contents" as, "when used with respect to any wire, oral, or electronic communication, includes any information concerning the substance, purport, or meaning of that communication."

That definition is narrower than it once was. The 1986 amendment note records that Congress "struck out 'identity of the parties to such communication or the existence,' after 'concerning the'." Before 1986, who was talking to whom and whether a communication happened at all were statutorily part of contents. After 1986, they were not.

Everything downstream follows from that edit. The addressing information Congress removed from "contents" is the same information the [[cs/law/pen-registers-and-trap-and-trace|pen register statute]] was written in the same year to cover, under a far weaker standard. The two halves were designed together: contents gets the super-warrant, addressing gets a certification. A great deal of modern argument about metadata is argument about a boundary that Congress placed with a strikeout in 1986, at a time when a telephone number was the paradigm case and a URL was not yet a thing anyone had to classify.

## The consent exceptions

Subsection (2) is a long list of exceptions, and two of them account for most everyday reliance.

For actors under color of law, it "shall not be unlawful under this chapter for a person acting under color of law to intercept a wire, oral, or electronic communication, where such person is a party to the communication" or where one of the parties has given prior consent.

For everyone else, the parallel provision permits interception "where such person is a party to the communication or where one of the parties to the communication has given prior consent to such interception unless such communication is intercepted for the purpose of committing any criminal or tortious act in violation of the Constitution or laws of the United States or of any State."

Two things are structurally important there. First, the federal rule is one-party consent, and being a party to the communication is itself sufficient. Second, the private-actor version carries a purpose limitation that the color-of-law version does not, so consent does not launder an interception performed to commit a crime or a tort. Several states impose stricter consent rules than the federal floor, which this note does not survey.

A third exception matters to anyone operating infrastructure. A provider's employee or agent may "intercept, disclose, or use that communication in the normal course of his employment while engaged in any activity which is a necessary incident to the rendition of his service or to the protection of the rights or property of the provider of that service," with a limit on service observing and random monitoring by public wire carriers. That is the provision under which network operations and abuse handling are described, and it is drawn around necessity to the service rather than around general curiosity.

## The super-warrant

An ordinary search warrant needs probable cause and particularity. A Title III order needs considerably more. The application must be "made in writing upon oath or affirmation" and must state, among other things, whether "normal investigative procedures have been tried and have failed or reasonably appear to be unlikely to succeed if tried or to be too dangerous." That is the necessity requirement, and there is no equivalent in ordinary warrant practice.

The order is also time-boxed and self-limiting. It may not authorize interception "for any period longer than is necessary to achieve the objective of the authorization, nor in any event longer than thirty days," and every order must provide that the interception "shall be conducted in such a way as to minimize the interception of communications not otherwise subject to interception under this chapter." Minimization is an ongoing obligation during execution, not a filter applied afterward, which is a meaningfully different engineering problem.

## Where it stops

The statute governs acquisition in transit. Communications sitting in storage on a provider's systems are the subject of [[cs/law/the-stored-communications-act|a different chapter]], enacted the same year, with a different and generally lower set of requirements. That division is the reason the same message can be protected by a super-warrant at one instant and reachable on a lesser showing a moment later, and it is the single most consequential structural feature of American communications privacy law.

It is also the reason encryption changes the practical picture more than the legal one. When [[cs/systems/tls-and-the-https-handshake|a TLS session]] protects contents on the wire, an interception at a midpoint acquires ciphertext, and the investigative value moves to the endpoints and to the provider. The statute did not change. The location of the data did. That relocation is the whole subject of [[cs/systems/end-to-end-encryption-and-the-lawful-access-debate|the lawful access debate]].

## Related Notes

- [[cs/law/the-stored-communications-act|The Stored Communications Act]] for the chapter that governs the same data once it stops moving.
- [[cs/law/pen-registers-and-trap-and-trace|Pen Registers and Trap and Trace]] for the regime built around the information the 1986 deletion removed from contents.
- [[cs/law/the-third-party-doctrine|The Third-Party Doctrine]] for the constitutional backdrop the statute was legislating against.
- [[cs/security/man-in-the-middle-attacks|Man-in-the-Middle Attacks]] for the technique the statute describes in legal vocabulary.
- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]] because transport encryption changes what an interception at a midpoint actually acquires.
- [[cs/systems/end-to-end-encryption-and-the-lawful-access-debate|End-to-End Encryption and the Lawful-Access Debate]] for the policy argument that follows from where contents can still be read.

## Sources

- <https://www.law.cornell.edu/uscode/text/18/2510> for the definitions of wire, oral, and electronic communication, of intercept, and of contents, together with the 1986 amendment note recording the deletion of party identity and existence from the definition of contents.
- <https://www.law.cornell.edu/uscode/text/18/2511> for the prohibition in subsection (1), the five-year penalty, the one-party consent exceptions for actors under and outside color of law, and the service provider exception.
- <https://www.law.cornell.edu/uscode/text/18/2518> for the application requirements, the necessity showing, the thirty-day limit, and the minimization requirement.
