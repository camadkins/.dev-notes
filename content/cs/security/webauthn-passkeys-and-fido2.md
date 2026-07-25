---
title: WebAuthn, Passkeys, and FIDO2
description: "Why a WebAuthn credential is an asymmetric key pair welded to one origin, and how that origin binding makes phishing structurally impossible rather than something users must avoid."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-05-29
updated:
aliases:
  - WebAuthn
  - Web Authentication
  - Passkeys
  - FIDO2
---

Every password-based login shares one fatal property: the secret the user types is the same string no matter who is asking for it. A convincing fake site at `paypa1.com` collects exactly the string the real `paypal.com` would accept. Anti-phishing training fights this with human vigilance, which loses at scale. WebAuthn wins it by construction, by making the credential refuse to work anywhere but the site it was registered with.

> [!note] The idea
> WebAuthn "defines an API enabling the creation and use of strong, attested, scoped, public key-based credentials by web applications, for the purpose of strongly authenticating users." The word doing the work is *scoped*. Each credential is "scoped to a given WebAuthn Relying Party," and the authenticator "ensures that all operations are scoped to a particular origin, and cannot be replayed against a different origin, by incorporating the origin in its responses." There is no shared secret to steal and nothing that a wrong-origin attacker can obtain and reuse.

## The registration handshake

At sign-up the browser asks an authenticator (a security key, or the phone or laptop itself) to make a credential for this site. "At registration time, the authenticator creates an asymmetric key pair, and stores its private key portion and information from the Relying Party into a public key credential source. The public key portion is returned to the Relying Party, who then stores it in conjunction with the present user's account." The server keeps only the public half. "Subsequently, only that Relying Party, as identified by its RP ID, is able to employ" that credential.

Compare this to [[password-hashing-and-salting|password storage]]. A breached password database, even a well-hashed one, leaks material an attacker can grind against. A breached WebAuthn database leaks public keys, which are useless to an attacker by design. The private key that could actually authenticate never left the authenticator: "it is expected that a credential private key never leaves the authenticator that created it."

## Why phishing dies

The origin binding is the whole game. When the user authenticates, the authenticator produces a signed assertion, and "the full origin of the requester is included, and signed over, in the attestation object produced when a new credential is created as well as in all assertions produced by WebAuthn credentials." The browser, not the page, supplies that origin. A phishing page served from a look-alike domain is a different origin, so the credential scoped to the real origin will not sign for it, and even if it somehow produced a signature, the origin baked into that signature would not match. This is why the property is structural: it does not depend on the user noticing the wrong URL. The relevant ceremonies "are resistant to man-in-the-middle attacks" for the same reason.

## FIDO2, passkeys, and the naming

The moving parts have three names that get conflated. WebAuthn is the browser-facing API. Beneath it, "the WebAuthn/FIDO2 protocol" runs between the Relying Party server and the authenticator, and the authenticator side speaks the FIDO Client to Authenticator Protocol (CTAP). Authenticators come in two shapes: "platform authenticators" built into the device and "roaming authenticators" reached over USB, Bluetooth Low Energy, or NFC.

*Passkey* is the consumer-facing name for a WebAuthn credential you actually use to log in. The FIDO Alliance defines it plainly: "Passkeys are a password replacement technology," a secret "stored on one's devices, unlocked by the user the same way they unlock their device (biometrics, PIN, pattern, etc.)," and "Unlike passwords, passkeys are resistant to phishing." Underneath the friendly word, a passkey is still the origin-scoped key pair above.

> [!tip] The one property to remember
> A password is a bearer secret: whoever holds the string is you. A passkey is an origin-bound private key that never leaves your authenticator and signs over the site asking. That single change is what turns phishing from a training problem into a non-event.

## Related Notes

- [[password-hashing-and-salting|Password Hashing and Salting]] - the model WebAuthn replaces, and why a leaked public-key store is harmless by comparison
- [[phishing-and-social-engineering|Phishing and Social Engineering]] - the attack class origin binding defeats structurally
- [[multi-factor-authentication|Multi-Factor Authentication]] - the possession-plus-biometric factors an authenticator combines in one step
- [[digital-signatures|Digital Signatures]] - the asymmetric primitive every WebAuthn assertion is built on
- [[symmetric-vs-asymmetric-cryptography|Symmetric vs Asymmetric Cryptography]] - why only the public half needs to reach the server

## Sources

- "Web Authentication: An API for accessing Public Key Credentials Level 2," W3C Recommendation. https://www.w3.org/TR/webauthn-2/ . Supports the API definition for strong, attested, scoped, public-key credentials; credentials scoped to a Relying Party; the registration key-pair generation with only the public key returned and only that Relying Party able to use the credential; the authenticator scoping all operations to one origin and signing the full origin into attestation and assertions; the credential private key never leaving the authenticator; resistance to man-in-the-middle attacks; the WebAuthn/FIDO2 protocol and CTAP; and platform versus roaming authenticators.
- "Passkeys," FIDO Alliance. https://fidoalliance.org/passkeys/ . Supports passkeys as a password-replacement technology, a device-stored secret unlocked the way the user unlocks the device, resistant to phishing, and defined as FIDO cryptographic credentials tied to a user's account.
