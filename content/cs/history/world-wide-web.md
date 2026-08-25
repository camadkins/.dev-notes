---
title: The World Wide Web
description: How Tim Berners-Lee built a global space of linked documents on top of the internet, and why the Web and the internet are not the same thing.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-03-26
updated:
aliases:
  - World Wide Web
  - the Web
---

The internet moves packets between machines. The World Wide Web is something built on top of it: a global space of documents linked by hyperlinks, which Tim Berners-Lee invented at CERN around 1990. Keeping the two straight matters, because confusing the Web with the internet is one of the most common misunderstandings about how computing works.

> [!note] The idea
> The Web is an application layer over the [[cs/history/history-of-the-internet|internet]]. It adds three things: a way to name any resource (the URL), a way to request it (HTTP), and a way to write linked documents (HTML).

## Invented at CERN

Berners-Lee, an English computer scientist working at CERN, submitted his proposal in May 1989 and had a working system by the end of 1990. He defined [[cs/networking/http-evolution-1-1-to-3|the first version of the HTTP protocol]], [[cs/systems/dns-the-domain-name-system|the basic URL syntax]], and made HTML the primary document format. Those three pieces are still the foundation of every web page.

## The Web is not the internet

The internet is a global system of interconnected computer networks. The Web is a global collection of documents and resources, linked by hyperlinks and URLs, and it functions as an application layer running on top of the internet. The internet is the road; the Web is one very popular thing that travels on it. Email and video calls travel on the same road without being the Web.

## Why it mattered

The networking, [[cs/military-computing/dod-model-and-tcp-ip-standardization|TCP/IP]] and all, was already in place. What the Web added was a reason for ordinary people to use it: a navigable space of linked documents anyone could read and publish to. That turned a network for researchers into the medium of modern life.

## Related Notes

- [[cs/history/history-of-the-internet|History of the Internet]], the network the Web runs on
- [[cs/history/world-wide-web-browser-wars|The Browser Wars]], how the Web became a platform
- [[cs/military-computing/dod-model-and-tcp-ip-standardization|The DoD Model and the TCP/IP Flag Day]], the protocols underneath
- [[cs/systems/network-protocols|Network Protocols]], the layers in general
- [[cs/history/index|History of Computing]], the section index

## Sources

- "World Wide Web," Wikipedia. https://en.wikipedia.org/wiki/World_Wide_Web . Supports Tim Berners-Lee inventing the Web at CERN (proposal May 1989, working system by end of 1990), his definition of HTTP, URL syntax, and HTML, and the Web as a global collection of linked documents functioning as an application layer on top of the internet, distinct from the internet itself.
