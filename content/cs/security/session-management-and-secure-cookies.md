---
title: Session Management and Secure Cookies
description: "A session token is a bearer credential as powerful as the password, and the Secure, HttpOnly, and SameSite flags are not a checklist but three doors: each closes one distinct route by which the token gets stolen."
draft: false
comments: true
tags:
  - cs
  - security
  - web
---

Log in once and you stay logged in for the rest of your visit, across dozens of independent requests. That continuity is an illusion the server has to manufacture, because the protocol underneath has no memory. The way it manufactures it is a small secret handed to your browser and presented on every subsequent request. Everything about session security follows from one uncomfortable fact about that secret: while it is valid, holding it is as good as knowing your password.

> [!note] The idea
> HTTP is stateless, so a session token stands in for your identity across requests, which makes it a bearer credential: whoever holds it is you, for as long as it lives. The Secure, HttpOnly, and SameSite cookie flags are not interchangeable hardening. Each shuts one specific theft channel, network interception, script access, and cross-site ride-along, and leaving any one open leaves that channel open.

## Why the token carries so much weight

OWASP starts from the protocol's amnesia: "HTTP is a stateless protocol (RFC2616 section 5), where each request and response pair is independent of other web interactions." To make a session out of independent requests, the server issues an identifier and the browser returns it each time. The consequence is the part people underrate. OWASP: once issued, "the session ID (or token) is temporarily equivalent to the strongest authentication method used by the application, such as username and password, passphrases, one-time passwords (OTP)."

Read that literally. If you protected login with a password and a one-time code, the session token that login produces is, for its lifetime, worth exactly as much as both of those together. Stealing it skips the password, skips the second factor, skips everything. So the entire job of the cookie flags is to keep this one string from leaving the browser through any of the channels an attacker can open.

## Three flags, three channels

The flags line up one-to-one with distinct attacks, which is the useful way to remember them.

`Secure` closes the network. OWASP: "The Secure cookie attribute instructs web browsers to only send the cookie through an encrypted HTTPS (SSL/TLS) connection. This session protection mechanism is mandatory to prevent the disclosure of the session ID through MitM (Man-in-the-Middle) attacks." Without it, the cookie can ride an unencrypted request and be read off the wire.

`HttpOnly` closes the script. OWASP: "The HttpOnly cookie attribute instructs web browsers not to allow scripts (e.g. JavaScript or VBscript) an ability to access the cookies via the DOM document.cookie object. This session ID protection is mandatory to prevent session ID stealing through XSS attacks." This is the direct link to [[cross-site-scripting-xss|XSS]]: if an attacker runs script in your page, `HttpOnly` is what stops that script from simply reading the cookie and exfiltrating it.

`SameSite` closes the cross-site ride-along. OWASP: "The SameSite attribute prevents the browser from sending the cookie on cross-site requests, mitigating cross-origin leakage and providing CSRF defense." This is the [[cross-site-request-forgery-csrf|CSRF]] connection: the cookie is not stolen so much as *misused* when the browser attaches it to a request another site triggered, and `SameSite` tells the browser to withhold it there.

> [!tip] The flags do not overlap, so you need all three
> Because each attribute answers a different attacker, none substitutes for another. `Secure` does nothing against XSS; `HttpOnly` does nothing against a plaintext connection; `SameSite` does nothing if the token is read out of the DOM. A session cookie that is worth as much as the password should carry all three, and be short-lived and rotated on privilege change on top of that.

## Related Notes

- [[cross-site-scripting-xss|Cross-Site Scripting (XSS)]], the attack `HttpOnly` is meant to blunt by hiding the cookie from script
- [[cross-site-request-forgery-csrf|Cross-Site Request Forgery (CSRF)]], the misuse `SameSite` defends against by withholding the cookie cross-site
- [[oauth2-and-openid-connect|OAuth 2.0 and OpenID Connect]], for how identity is delegated once a session is established

## Sources

- "Session Management Cheat Sheet," OWASP Cheat Sheet Series. https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html . Supports that "HTTP is a stateless protocol (RFC2616 section 5), where each request and response pair is independent," that the session ID "is temporarily equivalent to the strongest authentication method used by the application," that `Secure` instructs browsers "to only send the cookie through an encrypted HTTPS (SSL/TLS) connection" and is "mandatory to prevent the disclosure of the session ID through MitM," that `HttpOnly` instructs browsers "not to allow scripts ... an ability to access the cookies via the DOM document.cookie object" and is "mandatory to prevent session ID stealing through XSS attacks," and that `SameSite` "prevents the browser from sending the cookie on cross-site requests, mitigating cross-origin leakage and providing CSRF defense."
