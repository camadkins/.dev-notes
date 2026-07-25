---
title: STRIDE Threat Modeling
description: Why STRIDE works as a mnemonic - each of its six threats is the exact negation of one security property, turning an open question into a bounded checklist.
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-06-23
updated:
aliases:
  - STRIDE
  - threat modeling
---

"What could go wrong?" is an unbounded question, and design reviews that ask it get unbounded, unrepeatable answers: whoever is in the room lists whatever they happen to fear that day. STRIDE fixes this by refusing to brainstorm. It hands you six categories and asks you to check each one against each part of the system. The genius is not the acronym, it is that the six categories are not an arbitrary list. They are the complete set of ways a security guarantee can fail.

> [!note] The idea
> STRIDE is the dual of the security properties. Each threat is exactly the violation of one guarantee, so listing threats and listing which guarantee could break at each component are the same activity. That is what converts an open-ended fear into a finite, checkable question you can ask of every element in a design.

## The six categories

STRIDE, developed by Praerit Garg and Loren Kohnfelder at Microsoft in 1999, stands for Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, and Elevation of privilege. Microsoft's own definitions are concrete. Spoofing "involves illegally accessing and then using another user's authentication information." Tampering "involves the malicious modification of data," including "the alteration of data as it flows between two computers over an open network." Repudiation is "associated with users who deny performing an action without other parties having any way to prove otherwise." Information disclosure "involves the exposure of information to individuals who are not supposed to have access to it." Denial of service attacks "deny service to valid users." Elevation of privilege is when "an unprivileged user gains privileged access and thereby has sufficient access to compromise or destroy the entire system."

## The duality that makes it complete

![Each STRIDE threat pairs with the one security property it negates: Spoofing with authentication, Tampering with integrity, Repudiation with non-repudiation, Information disclosure with confidentiality, Denial of service with availability, Elevation of privilege with authorization.](assets/stride-duality.svg)

Read the categories again and a pattern falls out: "each STRIDE category corresponds to a core principle of information security: Authenticity, Integrity, Non-repudiability, Confidentiality, Availability and Authorization." Spoofing is the failure of authentication. Tampering is the failure of integrity. Repudiation is the failure of non-repudiation. Information disclosure is the failure of confidentiality. Denial of service is the failure of availability. Elevation of privilege is the failure of authorization.

This one-to-one pairing is why the list feels complete rather than ad hoc. You are not trying to imagine every attack an adversary might invent. You are asking, for one component, which of exactly six promises could be broken here. The threats are unbounded, but the guarantees they violate are a small fixed set, and STRIDE lets you enumerate the small set instead of the large one.

## How you actually run it

The method is mechanical on purpose, which is why Microsoft could ship it in a tool "designed with non-security experts in mind." You draw a data-flow diagram of the system: processes, data stores, data flows, external entities, and the trust boundaries between them. Then you walk each element and each flow and ask the six questions. Can this be spoofed? Tampered with? Repudiated? Can it disclose? Be denied? Be used to elevate? Every "yes" without a matching defense is a finding. Because the walk is exhaustive over the diagram and the six categories, two different reviewers tend to converge on the same list, which is exactly what an ad hoc brainstorm cannot promise.

> [!example] One element, six questions
> Take a login endpoint. Spoofing: can an attacker submit someone else's credentials? Answer with authentication. Tampering: can the request be altered in transit? Answer with [[tls-and-the-https-handshake|TLS]] integrity. Repudiation: can a user deny a login later? Answer with audit logging. Information disclosure: does a failed login leak whether the username exists? Answer with uniform error messages. Denial of service: can login attempts exhaust the server? Answer with rate limiting. Elevation of privilege: can a normal login yield admin rights? Answer with [[bell-lapadula-and-mandatory-access-control|access control]] the code cannot relax. Six prompts, six concrete defenses, from one box on a diagram.

> [!warning] STRIDE finds categories, not exploits
> The framework tells you a component could suffer, say, elevation of privilege. It does not tell you the specific bug or how likely it is. STRIDE is for coverage at design time, finding the class of risk before code ships; ranking and exploiting are separate steps. Its value is that nothing in a scoped diagram gets silently skipped, not that it writes the attack for you.

## Related Notes

- [[bell-lapadula-and-mandatory-access-control|Bell-LaPadula and Mandatory Access Control]], the formal answer to the elevation and disclosure threats
- [[tls-and-the-https-handshake|TLS and the HTTPS Handshake]], a mitigation for tampering and disclosure on the wire
- [[sandboxing-and-isolation|Sandboxing and Isolation]], a containment answer to elevation of privilege
- [[secure-boot-and-the-chain-of-trust|Secure Boot and the Chain of Trust]], integrity and authenticity pushed down to the firmware

## Sources

- "STRIDE model," Wikipedia. https://en.wikipedia.org/wiki/STRIDE_model . Supports that STRIDE stands for Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, and Elevation of privilege; that it was developed by Praerit Garg and Loren Kohnfelder at Microsoft (1999); and that each category corresponds to a core information-security principle: Authenticity, Integrity, Non-repudiability, Confidentiality, Availability, and Authorization.
- "Threats - Microsoft Threat Modeling Tool," Microsoft Learn. https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats . Supports the per-category definitions quoted (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege), the STRIDE model's role in the Security Development Lifecycle, and that the tool was designed with non-security experts in mind.
