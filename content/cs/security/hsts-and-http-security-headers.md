---
title: HSTS and HTTP Security Headers
description: "HSTS moves HTTPS enforcement out of the user's hands and into the browser, converting a click-through warning into a hard failure, at the price of a first-visit trust gap."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-06-24
updated:
aliases:
  - HSTS
---

TLS can encrypt a connection, but it cannot make a browser *choose* to use it. A user who types `example.com` sends a plaintext HTTP request first, and a bank that serves HTTPS still leaves that opening request naked on the wire. Worse, when a certificate warning appears, browsers historically let the user click through it, which as RFC 6797 notes turns a security control into "click-through insecurity." HTTP Strict Transport Security is the response to both gaps, and it works by handing enforcement authority to the browser instead of the human.

> [!note] The idea
> HSTS is a policy a site declares in a response header (`Strict-Transport-Security`) that tells the browser: for this host, only ever speak HTTPS, and treat any TLS warning as fatal. RFC 6797 defines it as "enabling web sites to declare themselves accessible only via secure connections." Once the policy is noted, the browser rewrites `http` URLs to `https` *locally, before sending any request*, and fails closed on certificate errors "with no user recourse." The security gain is not new cryptography, it is the removal of two soft edges: the accidental plaintext request and the human who clicks "proceed anyway."

## The header, and the two directives that matter

The policy is asserted with one header, for example:

```
Strict-Transport-Security: max-age=31536000 ; includeSubDomains
```

`max-age` is "the number of seconds" the browser should remember the policy, effectively a time-to-live: after a successful HTTPS visit the browser caches "this host is HTTPS-only" for that long. `includeSubDomains` extends the policy to every subdomain, closing the gap where an attacker targets `login.example.com` even though `example.com` is protected. A `max-age=0` signals the browser to forget the policy.

## Enforcement happens before the network, not after

The mechanically important detail is *where* HSTS acts. When the browser prepares to load an `http` URL for a known HSTS host, per the spec "the UA [[cs/standards/normative-versus-informative-and-the-word-shall|MUST replace]] the URI scheme with 'https'" and remap port 80 to 443 before proceeding with the load. There is no plaintext request that an active attacker could intercept and downgrade; the upgrade happens inside the browser. This defeats the class of active-network attacks, [[cs/systems/dns-the-domain-name-system|DNS spoofing]], evil-twin access points, and SSL-stripping proxies, that RFC 6797 lists as "active network attackers."

The second half is the harder cultural change. HSTS mandates that failing secure-connection establishment "should be done with 'no user recourse'," meaning "the user should not be presented with a dialog giving her the option to proceed." The RFC is explicit about why: allowing "clicking through warning/error dialogs" is "a recipe for a man-in-the-middle attack." An HSTS site is deliberately opting itself out of its users' ability to be tricked into overriding a bad certificate. The warning stops being a decision and becomes a wall.

## What it does not fix: the first visit

HSTS has one structural hole, and the spec names it: the Bootstrap MITM Vulnerability. The policy only exists in a browser *after* the browser has seen the header, which requires at least one successful connection. If a user "manually enters, or follows a link, to an unknown HSTS Host using an 'http' URI," that very first interaction "uses an insecure channel" and "is vulnerable to various attacks." An attacker present on that first contact can prevent the HSTS header from ever being delivered.

This is the same trust-on-first-use gap that [[cs/security/certificate-pinning|certificate pinning]] has, and the industry patched it the same way: HSTS preload lists, shipped inside the browser, seed the policy for major sites before the user ever connects, so there is no unprotected first request to exploit.

HSTS is also the clearest member of a broader family: [[cs/networking/http-evolution-1-1-to-3|response headers]] that let a server configure browser-side defenses TLS cannot provide. [[cs/security/content-security-policy|Content-Security-Policy]] constrains which resources a page may load, [[cs/security/same-origin-policy-and-cors|CORS]] headers govern cross-origin access, and cookie attributes like `Secure` and `HttpOnly` harden [[cs/security/session-management-and-secure-cookies|session cookies]]. Each shares HSTS's shape: the server states a policy, the browser enforces it, and the user is taken out of the loop.

> [!warning] HSTS protects the transport, not the user
> RFC 6797 is careful that HSTS "is explicitly not a remedy for two other classes of threats: phishing and malware." It guarantees you are talking to the real server over a secure channel; it says nothing about whether the real server, or the site you were socially engineered into visiting, is trustworthy.

## Related Notes

- [[cs/security/content-security-policy|Content Security Policy]] - the header that restricts resource loading, HSTS's sibling in the same family
- [[cs/security/same-origin-policy-and-cors|Same-Origin Policy and CORS]] - another browser-enforced, header-driven boundary
- [[cs/security/certificate-pinning|Certificate Pinning]] - shares the trust-on-first-use gap and the preload fix
- [[cs/security/man-in-the-middle-attacks|Man-in-the-Middle Attacks]] - the SSL-stripping downgrade HSTS closes
- [[cs/security/session-management-and-secure-cookies|Session Management and Secure Cookies]] - cookie hardening headers in the same defensive family

## Sources

- "HTTP Strict Transport Security (HSTS)," RFC 6797, IETF. https://www.rfc-editor.org/rfc/rfc6797.txt . Supports HSTS enabling sites to declare themselves accessible only via secure connections; the max-age time-to-live and includeSubDomains directives; the browser being required to replace the http scheme with https and remap port 80 to 443 before loading; the three addressed threat classes including active network attackers; the "no user recourse" requirement and that allowing click-through of warning dialogs is a recipe for a man-in-the-middle attack; the Bootstrap MITM Vulnerability on an insecure first interaction with an unknown HSTS host; and HSTS explicitly not being a remedy for phishing and malware.
