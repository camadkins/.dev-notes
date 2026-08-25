---
title: Kerberos Authentication
description: "How a trusted third party and time-limited tickets let a client prove who it is to a service without the password ever crossing the wire."
draft: false
comments: true
tags:
  - cs
  - security
  - cryptography
date: 2026-02-14
updated:
aliases:
  - Kerberos
  - KDC
  - ticket-granting ticket
---

Type your password once in the morning and, for the rest of the day, file shares, mail, and internal apps just let you in. That is single sign-on, and inside most enterprise networks the machinery underneath it is Kerberos. The interesting part is what does *not* happen: after that first login, your password is never sent anywhere, not to the file server, not to the mail server, not even back to the login service. The whole protocol is built to authenticate you to machines you have never contacted while keeping the secret that proves your identity on your own device.

> [!note] The idea
> Kerberos routes trust through one party everyone already trusts, the Key Distribution Center. It hands out short-lived, encrypted tickets that a service can verify on its own. Because every key is derived from a shared secret and the reply is encrypted in your key, you prove you know the password by decrypting something, never by transmitting it.

## The trusted third party

RFC 4120 states it plainly: Kerberos "performs authentication under these conditions as a trusted third-party authentication service by using conventional (shared secret key) cryptography." Conventional here means symmetric: the same key encrypts and decrypts, in contrast to the asymmetric math behind [[cs/military-computing/rsa-and-computational-hardness|public-key systems]]. The trusted third party is the Key Distribution Center (KDC), "a network service that supplies tickets and temporary session keys," and it "services both initial ticket and ticket-granting ticket requests."

That two-phase split is the whole reason Kerberos scales to single sign-on. The KDC is really two logical services:

1. **Authentication Server (AS).** You talk to it exactly once, at login. It verifies you and issues a ticket-granting ticket (TGT).
2. **Ticket-Granting Server (TGS).** For every service you later reach, you present the TGT and get back a service-specific ticket. You never re-enter your password.

## Why the password stays home

When you log in, your client turns your password into a symmetric key. Per the spec, "when the user's key is generated from a password or pass phrase, the string-to-key function for the particular encryption key type is used." The AS never receives that key or the password. Instead it looks up your key from its own database, and "the reply is sent encrypted in the client's secret key." Your client then "decrypts the encrypted part of the response using its secret key and verifies that the nonce in the encrypted part matches the nonce it supplied in its request."

So the proof of identity is an act of successful decryption, done locally. An eavesdropper on the wire sees only ciphertext it cannot open. This is the same logic that makes a [[cs/military-computing/perfect-secrecy-and-the-one-time-pad|shared secret]] powerful, applied to authentication rather than confidentiality.

## Tickets and the ticket you carry

A ticket bundles your identity with a session key, sealed so only the target service can read it. RFC 4120: "The client transmits the ticket (which contains the client's identity and a copy of the session key, all encrypted in the server's key) to the server." The service decrypts the ticket with its own key, learns who you are and what session key to use, and never has to call back to the KDC. Verification is offline and stateless on the service's side, which is exactly what lets one KDC serve thousands of services.

## Time is the leash

Tickets are deliberately short-lived. "The expiration time of the ticket will be set to the earlier of the requested endtime and a time determined by local policy." Alongside the ticket the client sends an authenticator: "this information (called the authenticator) is encrypted in the session key and includes a timestamp." That timestamp is the anti-replay guard, because "the timestamp proves that the message was recently generated and is not a replay."

The cost is that Kerberos assumes reasonably synchronized clocks. A machine whose clock has drifted too far from the KDC will have its authenticators rejected, which is why time synchronization (see [[cs/military-computing/ntp-distributed-clock-synchronization|NTP]]) is a quiet prerequisite for a working Kerberos realm.

> [!example] One login, three services
> 1. Login: client derives your key from the password, gets a TGT from the AS, and immediately forgets the password.
> 2. Mail: client shows the TGT to the TGS, gets a ticket for the mail server, and presents it. No password.
> 3. File share: same TGT, a new ticket from the TGS for the file server. Still no password.
> 4. Each ticket expires on its own clock; the TGT itself expires by end of day, forcing a fresh login tomorrow.

## Related Notes

- [[cs/security/multi-factor-authentication|Multi-Factor Authentication]] - what backs the single password that bootstraps the whole Kerberos day
- [[cs/security/oauth2-and-openid-connect|OAuth 2.0 and OpenID Connect]] - the web's token-based analogue to Kerberos tickets
- [[cs/military-computing/rsa-and-computational-hardness|RSA and Computational Hardness]] - the public-key alternative to Kerberos's shared-secret model
- [[cs/military-computing/ntp-distributed-clock-synchronization|NTP and Distributed Clocks]] - the clock synchronization Kerberos timestamps depend on
- [[cs/military-computing/perfect-secrecy-and-the-one-time-pad|Perfect Secrecy and the One-Time Pad]] - proving identity by decryption rests on symmetric secrets

## Sources

- "The Kerberos Network Authentication Service (V5)," RFC 4120, IETF. https://datatracker.ietf.org/doc/html/rfc4120 . Supports Kerberos as a trusted third-party authentication service using shared secret key cryptography; the KDC supplying tickets and temporary session keys and servicing initial and ticket-granting requests; tickets containing the client identity and session key encrypted in the server's key; the authenticator's timestamp preventing replay; ticket expiration set to the earlier of requested endtime and local policy; keys derived from passwords via the string-to-key function; and the reply being encrypted in the client's secret key which the client decrypts locally.
