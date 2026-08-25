---
title: Cross-Site Scripting (XSS)
description: "Why the stored/reflected/DOM taxonomy is really a map of where untrusted data enters, and why the defense has to be output encoding chosen by context."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-05-02
updated:
aliases:
  - XSS
---

XSS is the browser's version of the same mistake [[cs/security/sql-injection|SQL injection]] makes against a database: untrusted data crosses the line from content into code. Here [[cs/pl/compilation-vs-interpretation|the interpreter]] is the victim's browser, and the code runs inside the victim's session, with their cookies, their logged-in identity, their same-origin permissions. The three-way taxonomy everyone memorizes, stored, reflected, DOM-based, is not trivia. It is a classification by where the attacker's data enters the page, and that entry point dictates the defense.

> [!note] The idea
> XSS is an injection where the malicious payload becomes script executing under the victim's origin. The stored/reflected/DOM split classifies the data's path into the page, and because the flaw is that untrusted data was written into a page without being neutralized for its surroundings, the fix is output encoding chosen by the exact context the data lands in, not a single global escape.

## What it is and why the origin matters

OWASP defines the family cleanly: "Cross-Site Scripting (XSS) attacks are a type of injection, in which malicious scripts are injected into otherwise benign and trusted websites." The attack "occur[s] when an attacker uses a web application to send malicious code, generally in the form of a browser side script, to a different end user." Once that script runs, the browser has no way to tell it apart from legitimate first-party code. It executes with the page's origin, which is the whole prize: it can read the DOM, exfiltrate session cookies, forge requests as the user, and rewrite what the victim sees.

The root condition is a familiar one. XSS-enabling flaws "occur anywhere a web application uses input from a user within the output it generates without validating or encoding it." Data went in, came back out into HTML, and nobody neutralized it on the way out.

## The taxonomy is about entry point

- **Reflected**: the payload rides in on the request and bounces straight back. OWASP: "Reflected attacks are those where the injected script is reflected off the web server, such as in an error message, search result, or any other response." The malicious input is in the URL or form, the server echoes it into the response, and it executes for whoever followed the crafted link.
- **Stored**: the payload is persisted server-side and served to everyone. OWASP: "Stored attacks are those where the injected script is permanently stored on the target servers, such as in a database, in a message forum, visitor log, comment field, etc." One injection, many victims, no crafted link required. This is the more dangerous variant precisely because delivery is automatic.
- **DOM-based**: the tainted data never needs to reach the server at all; client-side JavaScript reads it (from the URL fragment, say) and writes it into the page. The vulnerable step happens entirely in the browser.

Reading the taxonomy this way turns it into a search strategy: to find XSS you trace every path untrusted data can take into a rendered page, and each of the three names tells you where to start looking.

## Why the defense is context-aware output encoding

If the bug is unneutralized data reaching an interpreter, the fix is to neutralize it at the moment it is written into output. The subtlety is that a browser parses different parts of a page with [[cs/pl/grammars-notation-bnfebnf|different grammars]], so "correct escaping" is not one operation. OWASP's prevention guidance is explicit: "There are many different output encoding methods because browsers parse HTML, JS, URLs, and CSS differently. Using the wrong encoding method may introduce weaknesses or harm the functionality of your application." HTML-entity encoding protects data placed in an HTML body; a value dropped into a JavaScript context or a URL parameter needs a different encoding entirely, and "JavaScript and HTML encoding are not interchangeable." Choose the encoding by asking where the data lands.

> [!warning] Encoding is not a complete guarantee
> OWASP notes plainly that "Output encoding is not perfect. It will not always prevent XSS," and calls some placements "dangerous contexts" where correct encoding still is not enough. Encoding the output is the primary control, but robust defense layers it with input validation, a Content Security Policy, and framework auto-escaping, so a single missed sink does not become a full compromise.

## Related Notes

- [[cs/security/sql-injection|SQL Injection]], the same data-becomes-code confusion aimed at a database
- [[cs/security/cross-site-request-forgery-csrf|Cross-Site Request Forgery (CSRF)]], a distinct web attack often confused with XSS
- [[cs/security/owasp-top-10|The OWASP Top 10]], where XSS lives inside the A03 Injection class
- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]], the origin boundary XSS runs inside of

## Sources

- "Cross Site Scripting (XSS)," OWASP Foundation. https://owasp.org/www-community/attacks/xss/ . Supports the definition of XSS as a type of injection, that it occurs "when an attacker uses a web application to send malicious code ... to a different end user," that flaws occur "anywhere a web application uses input from a user within the output it generates without validating or encoding it," and the verbatim definitions of reflected and stored XSS.
- "Cross Site Scripting Prevention Cheat Sheet," OWASP Cheat Sheet Series. https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html . Supports that "browsers parse HTML, JS, URLs, and CSS differently," that "Using the wrong encoding method may introduce weaknesses," that "JavaScript and HTML encoding are not interchangeable," and that "Output encoding is not perfect. It will not always prevent XSS."
