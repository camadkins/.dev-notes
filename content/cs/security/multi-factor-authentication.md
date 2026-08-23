---
title: Multi-Factor Authentication
description: "Why combining factors from different categories survives the theft of any one of them, and why NIST restricts SMS as a second factor."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-01-22
updated:
aliases:
  - MFA
  - 2FA
  - two-factor authentication
---

A password is a single point of failure. Guess it, phish it, or breach the database that stores it, and the account is gone. Multi-factor authentication does not make any one factor stronger; it makes the *combination* strong by requiring the attacker to defeat two independent things at once. [[cs/standards/what-a-standard-actually-is|NIST SP 800-63B]] states the mechanism directly: "Multiple factors make successful attacks more difficult to accomplish. If an attacker needs to both steal a cryptographic authenticator and guess a memorized secret, then the work to discover both factors may be too high."

> [!note] The idea
> Security comes from drawing factors out of *different categories*, not from stacking more of the same. The three categories are something you know, something you have, and something you are. Two passwords is still one category and one kind of attack. A password plus a hardware key forces an attacker to run two unrelated attacks, and the whole point is that they rarely can do both.

## The three categories

NIST 800-63B labels the categories in passing while defining authenticators. A memorized secret "is something you know." Possession-based authenticators are "something you have," a list that includes out-of-band devices and one-time-password devices. A biometric "serves as 'something you are.'"

The categories matter because attacks map to them, not to individual authenticators. The spec groups threats "based on attacks on the types of authentication factors": "Something you know may be disclosed to an attacker. The attacker might guess a memorized secret." A knowledge factor falls to guessing, phishing, or database theft. A possession factor falls to physical theft or interception. A biometric falls to spoofing. Because these attacks are unrelated, combining across categories means a single compromise leaves the account standing.

That is why "two passwords" is not MFA. Both are knowledge factors, both fall to the same phishing page, and the second adds a hurdle but not a *category* of hurdle.

## Why the assurance level requires two categories

NIST formalizes this. [[cs/military-computing/tcsec-and-graded-assurance|Authenticator Assurance Level 2]] (AAL2) "provides high confidence that the claimant controls an authenticator(s) bound to the subscriber's account," and it requires "proof of possession and control of two different authentication factors." The word doing the work is *different*. The standard does not ask for two authenticators; it asks for two factors from distinct categories, so that no single attack class defeats both.

## The SMS problem

The popular second factor, a code texted to your phone, is exactly the case where the "something you have" claim is weakest. The factor is supposed to prove you possess a specific device, but a texted code proves only that someone controls the phone *number*, and numbers can be moved. NIST 800-63B accordingly marks it RESTRICTED: "Use of the PSTN for out-of-band verification is RESTRICTED." When it is used, "the verifier SHALL verify that the pre-registered telephone number being used is associated with a specific physical device," and verifiers "SHOULD consider risk indicators such as device swap, SIM change, number porting, or other abnormal behavior."

The deeper rule generalizes the concern: "Methods that do not prove possession of a specific device, such as voice-over-IP (VOIP) or email, [[cs/standards/normative-versus-informative-and-the-word-shall|SHALL NOT be used]] for out-of-band authentication." An email inbox or a portable phone number is not a device you hold; it is another account, often protected by the very password you are trying to back up. That circularity, plus the interceptability of the phone network, is why a device-bound authenticator (a hardware key or a TOTP app tied to the handset) sits above an SMS code, which sits above nothing at all.

> [!warning] MFA is not unbreakable
> The spec is blunt that no factor is perfect: even a memorized secret can be disclosed, a device can be stolen, a biometric can be spoofed. MFA raises the cost of a *simultaneous* compromise; it does not eliminate any single one. Phishing proxies that relay both a password and a one-time code in real time are the current reminder that the channel matters as much as the factor count.

## Related Notes

- [[kerberos-authentication|Kerberos Authentication]] - the single password MFA hardens is what bootstraps a whole single-sign-on day
- [[oauth2-and-openid-connect|OAuth 2.0 and OpenID Connect]] - MFA runs at the authorization server before any token is minted
- [[cryptographic-hash-functions|Cryptographic Hash Functions]] - how the knowledge factor is stored so a database breach does not hand over the password
- [[side-channel-attacks|Side-Channel Attacks]] - a reminder that even a possessed secret can leak through an unintended path

## Sources

- "NIST Special Publication 800-63B: Digital Identity Guidelines, Authentication and Lifecycle Management." https://pages.nist.gov/800-63-3/sp800-63b.html . Supports the three factor categories (something you know, have, are); attacks grouped by factor type; AAL2 requiring proof of two different authentication factors; multiple factors raising attacker cost; and the PSTN/SMS out-of-band channel being RESTRICTED, requiring binding to a specific physical device, with VOIP and email disallowed.
