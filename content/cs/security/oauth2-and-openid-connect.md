---
title: OAuth 2.0 and OpenID Connect
description: "Why OAuth 2.0 answers what an app may do while OpenID Connect answers who the user is, and why confusing the two is the classic web-auth mistake."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-03-11
updated:
aliases:
  - OAuth
  - OAuth 2.0
  - OpenID Connect
  - OIDC
---

Before OAuth, letting a printing service reach your photos meant handing it your password. [[cs/standards/what-a-standard-actually-is|RFC 6749]] lays out exactly what breaks when you do that: the third party has to store your password "typically a password in clear-text," it gains "overly broad access" with no way to limit scope or duration, and you cannot revoke one app "without revoking access to all third parties." Worse, "compromise of any third-party application results in compromise of the end-user's password." Every one of those failures traces to a single root cause: the app was using *your* credential instead of one issued *to it*.

> [!note] The idea
> OAuth 2.0 fixes credential sharing by inserting an authorization layer that issues the client its own scoped, expiring credential, the access token, so the app never sees your password. OpenID Connect then adds a second token, the ID token, that carries proof of *who you are*. That split is the whole distinction: OAuth is about authorization (what an app may do), OpenID Connect is about authentication (who the user is).

## What OAuth actually delegates

OAuth's move, in the spec's own words, is "introducing an authorization layer and separating the role of the client from that of the resource owner." The client is "issued a different set of credentials than those of the resource owner." That credential is the access token, "a string denoting a specific scope, lifetime, and other access attributes," issued by an authorization server "with the approval of the resource owner."

The four roles are worth naming because their separation is the design:

- **Resource owner**: you, who can grant access to your data.
- **Client**: the app requesting access.
- **Authorization server**: the trusted party that authenticates you and mints tokens.
- **Resource server**: [[cs/software-engineering/api-design|the API that holds your data]] and honors valid tokens.

The printing example in the RFC is precise: an end-user "can grant a printing service (client) access to her protected photos stored at a photo-sharing service (resource server), without sharing her username and password." She authenticates with the authorization server, "which issues the printing service delegation-specific credentials (access token)." The token is scoped and time-boxed, so a compromised printing service leaks a narrow, revocable grant, not the master key.

## The trap: OAuth is not login

Because OAuth gets you a token that unlocks an API, it is tempting to treat "the app got a token" as "the user is logged in." That is the authentication-versus-authorization confusion, and it is unsafe. An access token proves the client was *authorized* to reach some resource. It says nothing verifiable to the client about *which human* approved it. Apps that inferred identity from an access token (for example, by calling a profile API with it) have been spoofable, because the token was never designed to be an identity assertion.

## What OpenID Connect adds

OpenID Connect closes that gap. Its abstract calls it "a simple identity layer on top of the OAuth 2.0 protocol" that "enables Clients to verify the identity of the End-User based on the authentication performed by an Authorization Server." The concrete mechanism is one new artifact: "The primary extension that OpenID Connect makes to OAuth 2.0 to enable End-Users to be Authenticated is the ID Token data structure."

The ID token is defined as "a security token that contains Claims about the Authentication of an End-User by an Authorization Server," and it "is represented as a JSON Web Token (JWT)." Because it is a signed JWT, the client can verify it locally, the same offline-verification trick that makes a [[digital-signatures|digital signature]] or a [[kerberos-authentication|Kerberos]] ticket checkable without calling back to the issuer. The signature is what makes the identity claim trustworthy, which is why OIDC leans on the same [[pki-and-x509-certificates|public-key infrastructure]] as the rest of the web.

> [!tip] The one-line test
> If you need to know *what an app may access on your behalf*, that is OAuth and an access token. If you need to know *who the user is*, that is OpenID Connect and an ID token. Using an access token as a login proof is the mistake OIDC exists to prevent.

## Related Notes

- [[kerberos-authentication|Kerberos Authentication]] - the enterprise ticket model that OAuth's web tokens echo
- [[multi-factor-authentication|Multi-Factor Authentication]] - what the authorization server uses to actually establish identity before minting an ID token
- [[digital-signatures|Digital Signatures]] - why a signed JWT can be verified offline
- [[pki-and-x509-certificates|PKI and X.509 Certificates]] - the trust roots behind the keys that sign tokens
- [[tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - the channel every OAuth exchange rides on

## Sources

- "The OAuth 2.0 Authorization Framework," RFC 6749, IETF. https://www.rfc-editor.org/rfc/rfc6749.txt . Supports the credential-sharing problems (clear-text password storage, overly broad access, all-or-nothing revocation, password compromise on client compromise); OAuth introducing an authorization layer and issuing the client a different credential; the access token as a scoped, time-limited string; the four roles; and the photo-printing delegation example.
- "OpenID Connect Core 1.0," OpenID Foundation. https://openid.net/specs/openid-connect-core-1_0.html . Supports OIDC as a simple identity layer on top of OAuth 2.0 that lets clients verify End-User identity; the ID Token as the primary extension; and the ID Token being a security token of authentication claims represented as a JWT.
