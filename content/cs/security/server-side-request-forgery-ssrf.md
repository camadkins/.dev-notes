---
title: Server-Side Request Forgery (SSRF)
description: "Why SSRF is dangerous out of proportion to its simplicity: it borrows the server's network position, turning a public app into a proxy that reaches everything the perimeter was built to hide."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-05-11
updated:
aliases:
  - SSRF
  - server-side request forgery
---

Most web vulnerabilities let an attacker do something to the application. SSRF lets an attacker do something *through* it. You hand the server a URL, expecting it to fetch a preview image or call a webhook, and it obliges by making a request to wherever you pointed it. The catch is where the server sits. It lives inside the network the firewall was built to protect, and every request it makes carries that inside position. So the attacker is no longer knocking on the front door from the internet. They are speaking from inside the building, in the server's voice.

> [!note] The idea
> SSRF is a positional attack, not a data attack. The vulnerability is that a server makes an outbound request to a URL the attacker controls, and that request inherits the server's place inside the trust boundary. The value stolen is not a secret in the input, it is *reachability*: internal services and cloud metadata endpoints that assume anything talking to them is already trusted.

## The server as a confused proxy

OWASP's definition is compact: "In a Server-Side Request Forgery (SSRF) attack, the attacker can abuse functionality on the server to read or update internal resources." The functionality being abused is ordinary and useful: import a URL, fetch a document, register a webhook. The attack is a substitution. As OWASP puts it, "The attacker modifies the calls to this functionality by supplying a completely different URL or by manipulating how URLs are built (path traversal etc.)."

Nothing here is malformed. The URL is well-formed, the request is well-formed, the response comes back cleanly. The only thing wrong is the destination, and the destination is exactly the field the application handed to the user. This is why SSRF resists the usual input-filtering instinct. There is no dangerous character to strip. `http://169.254.169.254/` is a perfectly valid URL. It is only dangerous because of who is allowed to reach it.

## What the inside position unlocks

The reason SSRF ranks as high-severity is the specific set of targets a server can reach that an outside attacker cannot. OWASP lists them, and the first is the one that has caused real breaches: "Cloud server meta-data - Cloud services such as AWS provide a REST interface on `http://169.254.169.254/` where important configuration and sometimes even authentication keys can be extracted." That [[cs/networking/ip-addressing-and-subnetting|link-local address]] is unroutable from the internet by design. Only something running on the instance can talk to it. An SSRF bug promotes the attacker to that privilege, and the endpoint will happily return temporary credentials.

Beyond metadata, OWASP names "Database HTTP interfaces," "Internal REST interfaces," and files, since "The attacker may be able to read files using `file://` URIs." The pattern is consistent. These services expose themselves freely because they assume network isolation is doing the authentication. SSRF dissolves that assumption. The perimeter is still standing; the attacker just found a door that opens from the inside.

## Why the fix is an allowlist, not a blocklist

Because the payload is a legitimate URL, filtering out bad destinations is a losing game: attackers reach internal addresses through [[cs/systems/dns-the-domain-name-system|DNS rebinding]], alternate encodings, redirects, and [[cs/networking/ipv6-essentials|IPv6 forms]] faster than a blocklist can enumerate them. The durable control inverts the question. Instead of asking which destinations to forbid, permit only the few that are intended. OWASP's prevention guidance splits on exactly this: the strong case is when the "Application can send requests only to identified and trusted applications," where an allowlist approach is available. When the server must be able to reach arbitrary external hosts, that safety net is gone and the defense gets much harder, which is itself a reason to design the feature so an allowlist is possible.

> [!warning] The metadata endpoint is not a config quirk
> A lot of SSRF write-ups treat `169.254.169.254` as a curiosity. It is the crown jewel. If your service runs in a cloud instance and has any feature that fetches a user-supplied URL, assume the first thing an attacker tries is the metadata service, and make sure that address is unreachable from that code path regardless of what else the allowlist says.

## Related Notes

- [[zero-trust-architecture|Zero Trust Architecture]], whose whole premise is that the network position SSRF abuses should never have implied trust
- [[firewalls|Firewalls]], the perimeter control SSRF routes around by originating requests from the inside
- [[owasp-top-10|The OWASP Top 10]], where SSRF is its own category A10

## Sources

- "Server Side Request Forgery," OWASP Foundation. https://owasp.org/www-community/attacks/Server_Side_Request_Forgery . Supports that an attacker "can abuse functionality on the server to read or update internal resources," "modifies the calls to this functionality by supplying a completely different URL," reaches "Cloud server meta-data" at "`http://169.254.169.254/` where important configuration and sometimes even authentication keys can be extracted," "Database HTTP interfaces" and "Internal REST interfaces," and may "read files using `file://` URIs."
- "Server-Side Request Forgery Prevention Cheat Sheet," OWASP Cheat Sheet Series. https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html . Supports that the strong defense case is when the application "can send requests only to identified and trusted applications," the allowlist scenario.
