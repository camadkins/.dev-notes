---
title: Content Security Policy
description: "Why CSP changes the question from can I keep attacker script out to will the browser run script I did not authorize, moving the last line of XSS defense to a place the attacker cannot reach."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-07-25
updated:
---

Every [[cs/security/cross-site-scripting-xss|cross-site scripting]] defense on the server side is a bet that you found and neutralized every injection point. Real applications lose that bet eventually, because the attack surface is large and one missed output context is enough. Content Security Policy accepts that premise and adds a second gate the attacker cannot see or touch: even if malicious script reaches the page, the browser decides whether to run it, according to rules the server declared in advance.

> [!note] The idea
> CSP is a browser-enforced allowlist that shifts the XSS decision from "was the injection prevented" to "is this script authorized to execute." The server sends a policy; the browser refuses any script that does not match it. Because enforcement happens in the browser against a policy the attacker cannot edit, CSP holds even when the injection succeeds, which is exactly why it is defense in depth and not a first line.

## A website telling the browser what it may do

MDN's definition puts the direction of trust up front: "Content Security Policy (CSP) is a feature that helps to prevent or minimize the risk of certain types of security threats. It consists of a series of instructions from a website to a browser, which instruct the browser to place restrictions on the things that the code comprising the site is allowed to do." The policy travels as a header: "A CSP should be delivered to the browser in the Content-Security-Policy [[cs/networking/http-evolution-1-1-to-3|response header]]."

The important structural fact is who enforces it. The server writes the policy, but [[cs/history/world-wide-web-browser-wars|the browser applies it]], and it applies it to everything on the page including script the server never intended to be there. An attacker who injects a `<script>` tag cannot also rewrite the response header, so the injected script faces a rule the attacker had no hand in.

## What the policy actually controls

MDN names the main use directly: "The primary use case for CSP is to control which resources, in particular JavaScript resources, a document is allowed to load. This is mainly used as a defense against cross-site scripting (XSS) attacks, in which an attacker is able to inject malicious code into the victim's site."

The sharpest single lever is inline script. MDN: "If a CSP contains either a default-src or a script-src directive, then inline JavaScript will not be allowed to execute unless extra measures are taken to enable it." This matters because inline injection, a `<script>` in the page body or an inline event handler, is the most common form reflected and stored XSS takes. A policy that forbids inline execution disarms that whole category by default. To keep the legitimate inline scripts a site does need, MDN's recommended tool is a nonce: a per-response random token the server puts on both the header and the trusted `<script>`, so "only script tags which have the correct nonce or hash set" run. The attacker cannot guess the nonce and cannot read the response to steal it, so injected inline script has none and is blocked.

> [!warning] CSP is a second layer, not a replacement
> MDN is explicit: "Setting a CSP is not an alternative to sanitizing input. Websites should sanitize input and set a CSP, providing defense in depth against XSS." A weak or overly permissive policy (broad `unsafe-inline`, wildcard sources) gives most of the protection away. Treat CSP as the backstop that catches what output encoding missed, and keep the encoding.

## Related Notes

- [[cs/security/cross-site-scripting-xss|Cross-Site Scripting (XSS)]], the attack CSP is primarily built to blunt
- [[cs/security/same-origin-policy-and-cors|Same-Origin Policy and CORS]], the surrounding browser model of what an origin may load and reach
- [[cs/security/clickjacking-and-ui-redressing|Clickjacking and UI Redressing]], defended by the same header's `frame-ancestors` directive

## Sources

- "Content Security Policy (CSP)," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP . Supports that CSP "consists of a series of instructions from a website to a browser, which instruct the browser to place restrictions on the things that the code comprising the site is allowed to do," that it "should be delivered to the browser in the Content-Security-Policy response header," that "The primary use case for CSP is to control which resources, in particular JavaScript resources, a document is allowed to load" and is "mainly used as a defense against cross-site scripting (XSS) attacks," that with a `default-src` or `script-src` directive "inline JavaScript will not be allowed to execute unless extra measures are taken," the nonce/hash mechanism, and that "Setting a CSP is not an alternative to sanitizing input. Websites should sanitize input and set a CSP, providing defense in depth against XSS."
