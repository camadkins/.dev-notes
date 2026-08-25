---
title: Web Application Firewalls
description: "A WAF sees the HTTP a network firewall cannot, but that visibility drops it into an undecidable job: guessing malicious intent from legitimate-looking bytes, which is why its central knob trades detection against false positives."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-05-29
updated:
aliases:
  - WAF
  - web application firewall
  - OWASP CRS
  - paranoia level
---

A network [[cs/security/firewalls|firewall]] makes clean decisions because it asks clean questions: which port, which address, which direction. Those have crisp answers, so the rule is a crisp allow or deny. A web application firewall lives one layer up, where the questions stop being crisp. It reads the HTTP request itself, and there the only question that matters, "is this input an attack?", has no clean answer, because a malicious payload and a legitimate one are both just strings a user typed. That shift, from routing metadata to application content, is what makes a WAF powerful and what makes it perpetually imperfect.

> [!note] The idea
> A WAF inspects layer-7 HTTP traffic, so it can see injection and scripting attacks that a layer-3/4 firewall filtering ports and addresses is structurally blind to. But operating on application content means judging intent from bytes that look like ordinary input, which is an undecidable problem in general. So a WAF's core control is not allow/deny but a tunable tradeoff: turn detection up and you catch more attacks *and* more legitimate traffic, turn it down and you flag less of both. There is no setting that escapes the tradeoff.

## Seeing what the network firewall cannot

OWASP defines the tool by its layer: "a web application firewall (WAF) is an application firewall for HTTP applications," one that "applies a set of rules to [[cs/networking/http-evolution-1-1-to-3|an HTTP conversation]]." Because it parses the HTTP request, it can reach the content a packet filter never interprets. The rules "generally cover common attacks such as Cross-site Scripting (XSS) and SQL Injection", precisely the [[cs/security/sql-injection|injection]] and [[cs/security/cross-site-scripting-xss|scripting]] classes that ride inside a well-formed request to an allowed port. A firewall watching [[cs/networking/ports-and-sockets|ports 80 and 443]] sees a valid connection to a valid service; the attack is in the body it never opens.

The orientation is also flipped from a proxy's. OWASP notes the difference in a line: "while [[cs/networking/proxies-forward-and-reverse|proxies generally protect clients]], WAFs protect servers." A WAF sits in front of the application, reading inbound requests on the server's behalf, which is exactly the vantage point from which application-layer attacks are visible.

## The tradeoff is the whole design

Because a WAF must infer hostility from content, it cannot be simultaneously perfect at catching attacks and at leaving legitimate traffic alone. The OWASP Core Rule Set exposes this tension as its central setting, the paranoia level, which "makes it possible to define how aggressive CRS is." Raising it adds rules and adds risk together: at PL 2, the extra rules "detect more attacks," but "there's a chance that the additional rules will also trigger new false alarms over perfectly legitimate HTTP requests." The CRS documentation states the law directly: "a higher paranoia level makes it harder for an attacker to go undetected. Yet this comes at the cost of more false positives: more false alarms." Pushed to the extreme, "at PL 4, the rules are so aggressive that they detect almost every possible attack, yet they also flag a lot of legitimate traffic as malicious."

The mechanism that keeps this tradeoff usable is anomaly scoring, which decouples "how suspicious" from "block yet." Rather than blocking on any single rule match, CRS accumulates a score: "the paranoia level controls the number of rules that are enabled while the anomaly threshold defines how many rules can be triggered before a request is blocked." A request that trips one weak heuristic is scored, not dropped; only when enough evidence accumulates past the threshold is it blocked. That gives an operator two independent dials, breadth of detection and blocking sensitivity, so a request needs to look wrong in several ways before a false alarm becomes a real block.

> [!warning] A WAF is a filter over a bug, not a fix for it
> Everything above describes detection, and detection can be evaded. Attackers encode, split, and mutate payloads specifically to slip under whatever rules are active, and every raised paranoia level that closes an evasion opens a false positive somewhere else. A WAF is genuinely useful as defense in depth and as a fast shield while a real fix ships, but it sits in front of the vulnerability rather than removing it. The durable fix for [[cs/security/sql-injection|SQL injection]] is parameterized queries in the application; the WAF is the outer layer that buys time and blunts the routine attacks, not a substitute for correct code.

## Related Notes

- [[cs/security/firewalls|Firewalls]] - the layer-3/4 filter whose blind spot at the application layer a WAF fills
- [[cs/security/sql-injection|SQL Injection]] - a primary attack class a WAF screens for, and one best fixed in code
- [[cs/security/cross-site-scripting-xss|Cross-Site Scripting (XSS)]] - the other classic payload WAF rules target
- [[cs/security/owasp-top-10|OWASP Top 10]] - the risk catalog whose injection and scripting entries WAF rules map to
- [[cs/security/ids-and-ips|IDS and IPS]] - the network-layer analog of the same detect-versus-false-positive tradeoff

## Sources

- "Web Application Firewall," OWASP Community. https://owasp.org/www-community/Web_Application_Firewall . Supports that a WAF is an application firewall for HTTP applications that applies a set of rules to an HTTP conversation, that these rules cover common attacks such as XSS and SQL injection, and that WAFs protect servers where proxies protect clients.
- "Paranoia Levels," OWASP Core Rule Set documentation, coreruleset.org. https://coreruleset.org/docs/2-how-crs-works/2-2-paranoia_levels/ . Supports that the paranoia level defines how aggressive CRS is, that higher levels detect more attacks but cause more false positives, that PL 4 flags much legitimate traffic as malicious, and that the paranoia level controls which rules are enabled while the anomaly threshold defines how many must trigger before a request is blocked.
