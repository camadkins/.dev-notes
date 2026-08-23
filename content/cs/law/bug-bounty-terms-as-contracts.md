---
title: "Bug Bounty Terms as Contracts"
description: "Program terms are a private document with three separable operative parts, and scope is the one that turns on whether the publisher had the power to authorize testing at all."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-05
updated:
aliases:
  - Program Terms and Scope
  - Bug Bounty Scope
---

A bug bounty program's terms page looks like documentation. It has headings, a list of targets, a payout table, and a section on what not to do. Read it as an instrument instead and it turns out to be doing three separable jobs at once, only one of which has any reach into a statute, and one of which the publisher may not have had the authority to promise.

> [!note] The idea
> Scope is usually read as a difficulty setting: these targets count, those do not, stay inside the lines and get paid. Legally it is something else. Scope is the boundary of what the publisher had the power to authorize in the first place. An organization can grant authorization over systems it controls and cannot grant it over anyone else's, so a target listed in scope that the publisher does not control is a promise the publisher cannot keep. The federal template for these documents says so directly, in a sentence aimed at the program owner rather than the researcher.

## Three documents wearing one hat

The federal template for a disclosure policy, written to implement the binding directive that requires agencies to publish one, is the clearest specimen available because its instructional comments are still visible in the published version. It states its own purpose in the introduction: "This policy describes what systems and types of research are covered under this policy, how to send us vulnerability reports, and how long we ask security researchers to wait before publicly disclosing vulnerabilities."

Three jobs, and they behave differently.

The first is a **grant of authorization**. The template's recommended language, which it says agencies are strongly encouraged to keep as written, reads: "If you make a good faith effort to comply with this policy during your security research, we will consider your research to be authorized, we will work with you to understand and resolve the issue quickly," and the agency "will not recommend or pursue legal action related to your research." The template is explicit that agencies should keep this section intact: "It is strongly recommended that you use the template's language for the Authorization section." That is the part that touches [[cs/law/the-computer-fraud-and-abuse-act|the federal computer-access statute]], because authorization is an element of the offence rather than a defense to it.

The second is a **set of conduct rules**, which read exactly like a scoped engagement. The template lists prompt notification, avoidance of privacy violations and disruption, a limit phrased as "only use exploits to the extent necessary to confirm a vulnerability's presence," a stop-on-sensitive-data rule, and a disclosure timing expectation reading "provide us a reasonable amount of time to resolve the issue before you disclose it publicly." A researcher who departs from these has not committed a crime by departing from them. They have fallen outside the condition on which the authorization was granted, which is a different and more consequential thing.

The third is a **list of excluded methods**, and it is worth noticing how technical the exclusions are. "The following test methods are not authorized," and the list names "network denial of service (DoS or DDoS) tests or other tests that impair access to or damage a system or data," and "physical testing (e.g. office access, open doors, tailgating), social engineering (e.g. phishing, vishing), or any other non-technical vulnerability testing." A legal document is here drawing its boundaries in the vocabulary of [[cs/security/denial-of-service-and-ddos|denial of service]] and [[cs/security/phishing-and-social-engineering|social engineering]], which is a good reminder that the categories a security practitioner uses to organize technique are the same categories that end up defining the edge of a permission.

## What scope means when a lawyer reads it

The template's instruction to the program owner is the sentence that reframes the whole document: "Before adding a system or service to the scope, ensure you are permitted to authorize security testing on the system or service." It goes on to say that if a managed service provider or software as a service vendor is involved, the agency should confirm whether the vendor has explicitly authorized such testing, in the contract or in a published policy, and should work with the vendor to obtain it. And then the hard stop: "If it is not possible to obtain the vendor's authorization, you may not include those systems or services in scope of your policy."

That is a rule about capacity, not about appetite. Authorization is the publisher's to give only over what the publisher controls. When a target sits on someone else's infrastructure, the publisher listing it is asserting an authority it may not have, and a researcher relying on that listing is relying on an assertion rather than a grant.

The limit has a visible tell in the authorization clause itself. The commitment is that the publisher will not pursue legal action, plus this: "Should legal action be initiated by a third party against you for activities that were conducted in accordance with this policy, we will make this authorization known." Make it known. Not prevent it, not indemnify against it, not settle it. The publisher can testify to what it authorized, and that is the outer limit of what a private document can do about a party that never signed it.

## The gap between a policy and a statute

Three gaps are visible from the text of these documents alone.

A policy binds its publisher. It does not bind a prosecutor. Federal charging policy on the computer-access statute is a separate instrument that directs "the attorney for the government," and it moves independently of anything a private program publishes.

A policy binds its publisher. It does not bind a third party. That is the whole content of the make-this-authorization-known sentence.

And a policy is a private document that can be edited. Scope changes, payout tables change, exclusions get added. The version that governs a piece of research is the version that was published when the research happened, which is a records problem before it is a legal one.

Payment sits slightly outside all of this, and the directive treats it as a distinct concern. It suggests each agency "should consider stating in its policy that reporters will not receive payment for submitting vulnerabilities and that by submitting, reporters waive any claims to compensation," and adds that "if applicable, agencies may link to a separate bug bounty program policy that involves payment." Disclosure and bounty are deliberately different documents in that scheme. The first is about authorization to look. The second is about consideration for what you found, which is the part that starts to look like an ordinary bargain.

> [!warning] Scope
> This note describes the structure of a published policy template and a binding directive, and quotes what they say. It is a description of instruments, not legal advice, and it is not an analysis of any particular program's terms. Whether a specific term is enforceable, whether particular testing fell inside a scope, and what any of it means for a given researcher are questions for a lawyer with the documents and the facts.

The authorization mechanism these documents rely on, and the separate federal charging policy that sits beside it, are covered in [[cs/law/coordinated-vulnerability-disclosure-and-safe-harbor|the note on safe harbor]].

## Related Notes

- [[cs/law/coordinated-vulnerability-disclosure-and-safe-harbor|Coordinated Vulnerability Disclosure and Safe Harbor]] - the authorization clause and the charging policy it sits next to
- [[cs/law/the-computer-fraud-and-abuse-act|The Computer Fraud and Abuse Act]] - the statute whose authorization element a program's terms reach
- [[cs/law/exceeds-authorized-access-and-van-buren|Exceeds Authorized Access and Van Buren]] - what happens when a contract term is offered as the source of an access limit
- [[cs/security/penetration-testing-methodology|Penetration Testing Methodology]] - the engagement whose rules of engagement the conduct section mirrors
- [[cs/security/denial-of-service-and-ddos|Denial of Service and DDoS]] - the technique category the template names as unauthorized
- [[cs/security/phishing-and-social-engineering|Phishing and Social Engineering]] - the other excluded category, and why non-technical testing is treated separately

## Sources

- CISA Vulnerability Disclosure Policy Template. https://www.cisa.gov/vulnerability-disclosure-policy-template . Backs the policy's stated purpose, the recommended authorization language and the instruction to keep it, the research conduct rules, the unauthorized test methods, the instruction to confirm authority before adding a system to scope, the bar on including systems whose vendor authorization cannot be obtained, and the third-party legal action sentence.
- CISA Binding Operational Directive 20-01, Develop and Publish a Vulnerability Disclosure Policy. https://www.cisa.gov/news-events/directives/bod-20-01-develop-and-publish-vulnerability-disclosure-policy . Backs the suggested payment and waiver statement and the separation of a bug bounty program policy from the disclosure policy.
- Justice Manual 9-48.000, Computer Fraud and Abuse Act, U.S. Department of Justice. https://www.justice.gov/jm/jm-9-48000-computer-fraud . Backs that federal charging policy on the statute is addressed to the attorney for the government.
