---
title: JSON Web Tokens
description: "How a JWT packs signed claims into a URL-safe string for stateless authentication, and why alg:none and the spec's own trust caveat make careless verification dangerous."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-06-09
updated:
aliases:
  - JWT
---

Classic web sessions keep state on the server: the browser holds an opaque session ID, and the server looks it up in a store on every request. That store is a scaling and coordination cost, especially across many services. A JWT inverts the arrangement. It hands the *claims themselves* to the client, wrapped in a signature, so the server can trust a request by checking the signature instead of a database. The power and the danger both come from that single move.

> [!note] The idea
> A JWT is "a compact, URL-safe means of representing claims to be transferred between two parties." The claims are "encoded as a JSON object" and either signed (a JWS) or encrypted (a JWE). Because a signed JWT is self-verifying, a server can authenticate a request with no server-side session lookup, statelessly. The catch is that this security holds only if the server actually verifies the signature correctly, and the standard defines a mode, and permits mistakes, where it does not.

## Compact by design

JWTs target tight spaces: "space constrained environments such as [[cs/networking/http-evolution-1-1-to-3|HTTP Authorization headers]] and URI query parameters." The [[cs/languages/common/serialization-and-wire-formats|serialization]] reflects that, three base64url segments joined by dots, header, payload, signature. The header names the algorithm, the payload carries the claims (issuer, expiry, subject, and whatever else), and the signature covers the first two.

The self-contained structure is the whole appeal. A resource server that receives a JWT does not phone home. It recomputes the signature over the header and payload with the issuer's key and, if it matches, treats the claims as authentic. This is the same offline-verification property that lets an [[cs/security/oauth2-and-openid-connect|OpenID Connect]] ID token or a [[cs/security/kerberos-authentication|Kerberos]] ticket be checked without a callback, and it is exactly why JWTs became the default carrier for [[cs/security/oauth2-and-openid-connect|OAuth]] access tokens and OIDC identity claims.

## alg:none, the mode that removes the lock

Here is the sharp edge. RFC 7519 defines the Unsecured JWT: "JWTs [[cs/standards/normative-versus-informative-and-the-word-shall|MAY also be created]] without a signature or encryption." Such a token "is a JWS using the 'alg' Header Parameter value 'none' and with the empty string for its JWS Signature value." A perfectly spec-compliant JWT can therefore carry `{"alg":"none"}` and no signature at all.

The token's own header declares which algorithm to verify with. A naive library that trusts the header's `alg` field will, when handed `alg:none`, dutifully "verify" a token that anyone could have forged, because there is nothing to verify. The classic attack is to take a legitimate token, flip its algorithm to `none`, strip the signature, and edit the claims freely. The defect is not in the format; it is in a verifier that lets the attacker choose the verification algorithm.

> [!warning] A JWT is not trustworthy just because it parsed
> The spec is blunt about this: "The contents of a JWT cannot be relied upon in a trust decision unless its contents have been cryptographically secured and bound to the context necessary for the trust decision." A decoded, well-formed JWT proves nothing. Only a JWT whose signature you verified against a key you *expected*, using an algorithm *you* fixed rather than one the token named, carries any authority. Servers must pin the accepted algorithm and reject `none` outright.

## Related Notes

- [[cs/security/oauth2-and-openid-connect|OAuth 2.0 and OpenID Connect]] - the protocols where JWTs most often carry access and identity claims
- [[cs/security/digital-signatures|Digital Signatures]] - the signing scheme (JWS) that makes a JWT verifiable offline
- [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]] - the HMAC and hash primitives behind common JWT signatures
- [[cs/security/kerberos-authentication|Kerberos Authentication]] - the older self-contained-ticket model JWTs echo on the web
- [[cs/security/multi-factor-authentication|Multi-Factor Authentication]] - what an issuer verifies before minting a claims token

## Sources

- "JSON Web Token (JWT)," RFC 7519, IETF. https://www.rfc-editor.org/rfc/rfc7519.txt . Supports the JWT as a compact, URL-safe representation of claims encoded as a JSON object and used as the payload of a JWS (signed) or JWE (encrypted) structure; its intent for space-constrained environments such as HTTP Authorization headers and URI query parameters; the Unsecured JWT with the alg header value "none" and an empty signature; and the security-considerations statement that a JWT's contents cannot be relied upon in a trust decision unless cryptographically secured and bound to the necessary context.
