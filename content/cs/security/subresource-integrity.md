---
title: Subresource Integrity
description: "TLS authenticates the server that hands you a file, not the file itself. SRI closes that gap by pinning a hash of the content, so a compromised CDN cannot silently swap the bytes."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-05-07
updated:
aliases:
  - Subresource Integrity
  - SRI
  - integrity attribute
---

A modern web page is assembled from other people's servers: a framework from one [[cs/networking/cdn-and-edge-caching|CDN]], a font from another, an analytics script from a third. Every one of those is code running with your page's full privileges. The transport-security stack, TLS plus [[cs/security/hsts-and-http-security-headers|HSTS]] plus [[cs/security/certificate-pinning|key pinning]], does an excellent job of one thing and a poor job of another. As the SRI specification puts it, these mechanisms "authenticate only the server, not the content." You can be certain you are really talking to the CDN. You have no assurance the CDN is sending what you expect.

> [!note] The idea
> Subresource Integrity lets a page declare the exact cryptographic hash of a resource it intends to load, in an `integrity` attribute on the `<script>` or `<link>` tag, and the browser refuses to use the resource if the bytes do not hash to that value. The spec's framing is precise: authors want to "not only be able to pin the keys of a server, but also pin the content." SRI moves the trust anchor from *who served the file* to *what the file actually is*.

## Server authentication is the wrong question

The gap SRI fills is easy to miss because TLS feels like it should cover it. It does not. An attacker who replaces the file on a CDN server, or an administrator with legitimate access, or a compromise of the third-party service itself, "has the ability to inject arbitrary content," and TLS will deliver that malicious content over a perfectly valid, perfectly encrypted connection. The lock icon is honest: you really are talking securely to the server. The server is simply lying about the payload.

SRI's stated goal makes the threat model explicit: [[cs/languages/common/software-supply-chain-and-provenance|a compromise of a third-party service]] "should not automatically mean compromise of every site which includes its scripts." Without SRI, one breached popular CDN is a breach of every site that hot-links it. With SRI, the breached CDN can serve altered bytes all day and every SRI-protected page silently rejects them.

## A hash in the tag

The mechanism is a base64-encoded digest prefixed by its algorithm:

```html
<script src="https://example.com/framework.js"
        integrity="sha384-Li9vy3DqF8tnTXuiaAJuML3ky+er10rcgNR/VqsVpcw+ThHmYcwiB1pbOxEbzJr7"
        crossorigin="anonymous"></script>
```

Before executing the script, the browser hashes the fetched bytes and compares. The enforcement is blunt and correct: the browser will "refuse to render or execute responses that fail an integrity check." There is no warning to dismiss and no partial trust, a mismatch means the resource does not run. SRI supports SHA-256, SHA-384, and SHA-512 from the SHA-2 family, and requires the resource be fetched with CORS so a cross-origin server explicitly opts into being read this way.

## Hash agility, and a fail-open corner

An author may list several hashes for one resource, computed with different algorithms, so the format can survive a future break in any one of them: "sets of integrity metadata may be associated with a single resource in order to provide agility in the face of future cryptographic discoveries." When more than one is present the browser does the safe thing and "will choose the strongest hash function in the list," since the algorithm token set is deliberately ordered weakest to strongest.

There is one subtlety worth internalizing. If a page specifies integrity using only an algorithm the browser does not support, the check does not fail closed. Per the spec, "validation using unsupported hash functions acts like no integrity value was provided," which lets authors adopt a stronger future hash without breaking older browsers. The design choice is deliberate and reasonable, but it means SRI's guarantee is conditional on the client actually understanding at least one of the offered algorithms. An attacker cannot forge a matching hash, but a downgrade to "no protection" is quietly on the table if you offer only exotic algorithms.

> [!tip] SRI is content pinning, and it composes
> The right mental model is that TLS pins the channel and SRI pins the payload; you want both. [[cs/security/content-security-policy|Content-Security-Policy]] can even mandate SRI on all scripts and styles via `require-sri-for`, turning "the developer remembered to add a hash" into an enforced site-wide policy. Layered, they cover the two questions TLS alone conflates: am I talking to the right server, and did it send me the right bytes.

## Related Notes

- [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]] - the digest whose collision-resistance makes SRI meaningful
- [[cs/security/content-security-policy|Content Security Policy]] - can require SRI and shares the browser-enforced-policy model
- [[cs/security/hsts-and-http-security-headers|HSTS and HTTP Security Headers]] - authenticates the channel that SRI complements
- [[cs/security/certificate-pinning|Certificate Pinning]] - pins the server's key, where SRI pins the file's bytes
- [[cs/security/cross-site-scripting-xss|Cross-Site Scripting]] - the code-injection class a compromised third-party script becomes

## Sources

- "Subresource Integrity," W3C. https://www.w3.org/TR/SRI/ . Supports that TLS, HSTS, and pinning authenticate only the server and not the content, and that an attacker or administrator with server access can inject arbitrary content; the goal of pinning the content in addition to the server, and that compromise of a third-party service should not compromise every site including its scripts; the integrity attribute carrying a base64-encoded cryptographic hash checked before execution; the user agent refusing to render or execute responses that fail an integrity check; support for SHA-256/384/512 and the CORS requirement; multiple integrity metadata sets for agility with the browser choosing the strongest, ordered weakest to strongest; and unsupported hash functions acting like no integrity value was provided.
