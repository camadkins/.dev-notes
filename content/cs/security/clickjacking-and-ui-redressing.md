---
title: Clickjacking and UI Redressing
description: "Why a CSRF token does not stop clickjacking: the click is real and carries every credential the page needs, so the only defense is refusing to be framed rather than validating the request."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-07-25
updated:
---

Most web attacks forge something: a request the user never made, input the parser misreads, a token the attacker guessed. Clickjacking forges nothing. The click is genuine, made by the real user, on the real target page, with the real session attached. What the attacker forged is the user's *understanding* of what they clicked. That distinction sounds academic until you try to defend against it, and discover that every request-level check passes, because at the request level nothing is wrong.

> [!note] The idea
> Clickjacking attacks the user's intent, not the application's logic. By framing the target site invisibly over decoy content, the attacker gets the victim to click a real, fully authenticated control while believing they clicked something else. Because the resulting request is legitimate in every checkable way, the defense cannot be request validation; it has to be a framing policy that stops the page being embedded at all.

## Hijacking the click, not the request

OWASP's definition names the deception directly: "Clickjacking, also known as a '[[cs/history/xerox-parc-and-the-gui|UI redress attack]]', is when an attacker uses multiple transparent or opaque layers to trick a user into clicking on a button or link on another page when they were intending to click on the top level page. Thus, the attacker is 'hijacking' clicks meant for their page and routing them to another page, most likely owned by another application, domain, or both."

MDN describes the same mechanism structurally: "the attacker creates a decoy site which embeds the user's target site inside an `<iframe>` element. The attacker's site hides the `<iframe>`, and aligns some decoy elements so they appear in the same place as elements in the target site that trigger sensitive actions." The victim aims at a harmless-looking button on the attacker's page; the pixel underneath their cursor is a "Transfer funds" or "Delete account" control on the real, logged-in site. It is not only clicks. OWASP notes keystrokes fall to the same trick: "a user can be led to believe they are typing in the password to their email or bank account, but are instead typing into an invisible frame controlled by the attacker."

## Why a token cannot save you here

This is the part worth internalizing, because it separates clickjacking from [[cs/security/cross-site-request-forgery-csrf|CSRF]]. CSRF is defeated by a secret token because the attacker can send a request but cannot read the page to learn the token. Clickjacking breaks that assumption: the attacker is not sending the request at all. The *victim's own browser* is, from inside the framed page, which means it already has the session cookie and any anti-CSRF token that page legitimately contains. The forged request and the framed request are indistinguishable to the server because the framed request is real. A token proves the click came from the genuine page, and here it did.

So the defense has to move earlier, to the decision of whether the page may be placed in a frame owned by another origin. OWASP: prevent "the browser from loading the page in frame using the X-Frame-Options or Content Security Policy (frame-ancestors) [[cs/networking/http-evolution-1-1-to-3|HTTP headers]]." Both headers, as OWASP puts it, "indicate whether or not a browser should be allowed to render a page in a `<frame>` or `<iframe>`." Deny the framing and the whole overlay technique collapses, because there is nothing invisible to click through. `frame-ancestors` is the modern form, part of the same [[cs/security/content-security-policy|Content Security Policy]] header that governs script, and it supersedes the older `X-Frame-Options`.

> [!warning] JavaScript frame-busting is not a substitute for the header
> Historically sites tried to break out of frames with JavaScript. Those scripts have well-known bypasses (sandboxed iframes, double framing, event cancellation), and they run only after the page has loaded, leaving a window to exploit. The header-based controls decide before the frame renders, which is why OWASP treats them as the primary defense and script frame-busting as legacy.

## Related Notes

- [[cs/security/content-security-policy|Content Security Policy]], whose `frame-ancestors` directive is the modern anti-framing control
- [[cs/security/cross-site-request-forgery-csrf|Cross-Site Request Forgery (CSRF)]], the neighbor whose token defense clickjacking specifically evades
- [[cs/security/same-origin-policy-and-cors|Same-Origin Policy and CORS]], the surrounding model of what one origin may do with another

## Sources

- "Clickjacking," OWASP Foundation. https://owasp.org/www-community/attacks/Clickjacking . Supports that clickjacking "is when an attacker uses multiple transparent or opaque layers to trick a user into clicking on a button or link on another page when they were intending to click on the top level page," that the attacker is "hijacking clicks meant for their page and routing them to another page," and that "a user can be led to believe they are typing in the password to their email or bank account, but are instead typing into an invisible frame controlled by the attacker."
- "Clickjacking," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Clickjacking . Supports that "the attacker creates a decoy site which embeds the user's target site inside an `<iframe>` element. The attacker's site hides the `<iframe>`, and aligns some decoy elements so they appear in the same place as elements in the target site that trigger sensitive actions."
- "Clickjacking Defense Cheat Sheet," OWASP Cheat Sheet Series. https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html . Supports "Preventing the browser from loading the page in frame using the X-Frame-Options or Content Security Policy (frame-ancestors) HTTP headers," and that these headers "indicate whether or not a browser should be allowed to render a page in a `<frame>` or `<iframe>`."
