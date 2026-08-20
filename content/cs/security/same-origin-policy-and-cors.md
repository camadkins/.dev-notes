---
title: Same-Origin Policy and CORS
description: "The same-origin policy is the web's default deny and CORS is the server's explicit opt-out; the common breach is a relaxation written so loosely it grants the access the policy existed to withhold."
draft: false
comments: true
tags:
  - cs
  - security
  - web
---

The browser holds two things at once: your logged-in session at your bank, and a tab open to some random site. Nothing stops that random site's JavaScript from making a request to your bank, and the browser will attach your bank cookie when it does. The only reason the random site cannot then read your balance is a single rule baked into the browser. That rule is the same-origin policy, and understanding it as a *default deny* is the key to understanding CORS, which is nothing more than the controlled way to say "except here."

> [!note] The idea
> The same-origin policy denies cross-origin script from reading another origin's responses by default, which is what keeps a hostile tab from harvesting your authenticated data elsewhere. CORS does not add security; it subtracts some, on purpose, by letting a server opt in to specific cross-origin readers. The frequent breach is a CORS relaxation written so broadly that it opts in to everyone, reopening the exact door the policy was holding shut.

## The default deny

MDN defines the policy by what it forbids: "The same-origin policy is a critical security mechanism that restricts how a document or script loaded by one origin can interact with a resource from another origin." An origin is a precise tuple, not a fuzzy notion of "the same site": "Two URLs have the same origin if the protocol, port (if specified), and host are the same for both. You may see this referenced as the 'scheme/host/port tuple', or just 'tuple'." Change the scheme, the host, or the port and it is a different origin.

The reason the rule exists is concrete. MDN: "it prevents a malicious website on the Internet from running JS in a browser to read data from a third-party webmail service (which the user is signed into) or a company intranet ... and relaying that data to the attacker." Note what is and is not blocked. The cross-origin request can still be *sent*, cookies and all. What is blocked is the sending page *reading the response*. This send-but-not-read asymmetry is the same one that shapes [[cross-site-request-forgery-csrf|CSRF]], and it is the whole security value of the policy.

## CORS is the opt-out, held by the server

Legitimate applications routinely need cross-origin reads: a front end on one origin calling an API on another. MDN describes the mechanism for allowing it: "Use CORS to allow cross-origin access. CORS is a part of HTTP that lets servers specify any other hosts from which a browser should permit loading of content." The control lives with the *server that owns the data*, expressed in response headers, and MDN is clear that the browser still enforces the default until the server speaks: "the server still must opt-in using Access-Control-Allow-Origin to share the response with the script."

So CORS is a relaxation, and a relaxation is only as safe as its bounds. The tightest bound is required precisely where the stakes are highest. When a response carries credentials, MDN states, "the server must specify an origin in the value of the Access-Control-Allow-Origin header, instead of specifying the * wildcard." A server cannot both share responses with *any* origin and carry the user's credentials; the spec forbids that combination. The dangerous pattern developers fall into is to sidestep it by reflecting whatever `Origin` header arrives back into `Access-Control-Allow-Origin`. That satisfies the "name a specific origin" rule mechanically while trusting every origin that asks, which is functionally no policy at all.

> [!warning] A permissive CORS config is worse than no CORS
> Without CORS, the same-origin policy protects the endpoint by default. A misconfigured CORS response that echoes the request's origin and allows credentials actively invites hostile origins to read authenticated data. The failure is not forgetting to add CORS; it is adding it too generously.

## Related Notes

- [[cross-site-request-forgery-csrf|Cross-Site Request Forgery (CSRF)]], which turns on the same send-but-not-read asymmetry this policy creates
- [[content-security-policy|Content Security Policy]], a separate browser-enforced control over what a page may load and run
- [[cross-site-scripting-xss|Cross-Site Scripting (XSS)]], which runs inside an origin and so sidesteps this boundary entirely

## Sources

- "Same-origin policy," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy . Supports that the policy "restricts how a document or script loaded by one origin can interact with a resource from another origin," the scheme/host/port tuple definition of an origin, the intranet/webmail data-theft rationale, and that CORS "lets servers specify any other hosts from which a browser should permit loading of content."
- "Cross-Origin Resource Sharing (CORS)," MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS . Supports that "the server still must opt-in using Access-Control-Allow-Origin to share the response with the script," and that for a credentialed request "the server must specify an origin in the value of the Access-Control-Allow-Origin header, instead of specifying the * wildcard."
