---
title: Phishing and Social Engineering
description: "Why the cheapest path past strong cryptography runs through the human operator, and what 'phishing-resistant' authentication actually means: binding the authenticator output to the specific channel so a relayed credential is worthless."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-07-03
updated:
aliases:
  - phishing
  - social engineering
  - verifier impersonation
  - phishing-resistant MFA
---

You can build an unbreakable lock and still lose the house if someone talks the owner into handing over the key. Social engineering attacks the operator rather than the algorithm, and phishing is its dominant form: convince a person to authenticate to a site that looks like the real one, and every guarantee of the real one's cryptography becomes irrelevant, because the victim performed the login for you. The important technical question is not "how do we stop people being fooled," which is mostly unsolvable, but "how do we make a credential that is useless even when it is fooled out of someone."

> [!note] The idea
> Phishing is what NIST calls verifier impersonation: fooling a user into authenticating to an impostor. Most authentication methods fail against it because the secret they transmit (a password, a typed one-time code) is not tied to *who is receiving it*, so an impostor can relay it to the real service and log in. Phishing-resistant authentication removes that by binding the authenticator's output to the specific, authenticated channel. A credential minted for a session with the attacker cannot be replayed to the real verifier, so the human being fooled no longer hands over anything reusable.

## Phishing is verifier impersonation

NIST SP 800-63B names the attack in protocol terms. "Verifier impersonation attacks, sometimes referred to as 'phishing attacks,' are attempts by fraudulent verifiers and RPs to fool an unwary claimant into authenticating to an impostor website." That framing is more useful than the folk definition, because it locates the flaw not in the user's gullibility but in the authenticator: the credential does not care who asked for it.

This is why simply adding a second factor does not automatically help. Anything the user reads off a screen and types in can be relayed. NIST is explicit that "authenticators that involve the manual entry of an authenticator output, such as out-of-band and OTP authenticators, SHALL NOT be considered verifier impersonation-resistant because the manual entry does not bind the authenticator output to the specific session." The failure mode is a live relay: "in a MitM attack, an impostor verifier could replay the OTP authenticator output to the verifier and successfully authenticate." The victim's one-time code, valid for sixty seconds, is more than enough time for the [[man-in-the-middle-attacks|man in the middle]] to forward it.

## What "phishing-resistant" actually binds

The fix is structural, not educational. NIST describes verifier-impersonation resistance as establishing "an authenticated protected channel with the verifier" and then "strongly and irreversibly bind[ing] a channel identifier that was negotiated in establishing the authenticated protected channel to the authenticator output." In plain terms: the proof you send is computed over the identity of the specific connection you are on. Its worked example is client-authenticated TLS, "because the client signs the authenticator output along with earlier messages from the protocol that are unique to the particular TLS connection."

That binding is what makes a phished credential inert. If the authenticator signs over the channel it is actually talking to, and that channel terminates at the attacker's phishing site rather than the real bank, the signature is valid only for the attacker's connection and means nothing to the real verifier. The attacker holds a token issued to the wrong recipient. This is the principle behind hardware security keys and passkeys, and it is why they are the second factor that survives a convincing lookalike page when a typed code does not. It complements the sender-side defenses of [[email-authentication-spf-dkim-dmarc|SPF, DKIM, and DMARC]], which try to keep the lure out of the inbox in the first place.

> [!warning] Awareness training is a mitigation, not a control
> Teaching people to spot phishing lowers the click rate; it never reaches zero, and a defense that fails whenever one tired person on one bad day clicks one link is not a control you can rely on. The durable answer moves the guarantee out of human vigilance and into the protocol, so that clicking the link and even entering credentials yields the attacker nothing replayable. Design so the human's mistake is survivable, because eventually the mistake will be made. This is the same philosophy as [[multi-factor-authentication|layered authentication]] and [[privilege-separation-and-least-privilege|least privilege]]: assume the front line will be breached and limit what that costs.

## Related Notes

- [[multi-factor-authentication|Multi-Factor Authentication]] - why a second factor helps only if it resists relay, not merely adds a step
- [[man-in-the-middle-attacks|Man-in-the-Middle Attacks]] - the relay that turns a phished one-time code into a real login
- [[email-authentication-spf-dkim-dmarc|Email Authentication: SPF, DKIM, DMARC]] - the sender-side layer that tries to keep the lure from arriving
- [[malware-classes|Malware Classes]] - the payload phishing so often exists to deliver
- [[privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] - limiting the blast radius when a human is fooled anyway

## Sources

- "NIST Special Publication 800-63B: Digital Identity Guidelines, Authentication and Lifecycle Management," pages.nist.gov. https://pages.nist.gov/800-63-3/sp800-63b.html . Supports that verifier impersonation attacks are also called phishing attacks that fool a claimant into authenticating to an impostor website, that manual-entry authenticators such as out-of-band and OTP are not verifier-impersonation-resistant because entry does not bind the output to the session, that an impostor verifier can replay an OTP in a MitM attack, and that resistance is achieved by binding a negotiated channel identifier to the authenticator output as in client-authenticated TLS.
