---
title: The Browser Wars and the Web as a Platform
description: How the fight between Netscape and Internet Explorer turned the browser from a document viewer into the programmable runtime most software now targets.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-03-29
updated:
aliases:
  - browser wars
  - rendering engine
---

Once the [[world-wide-web|Web]] existed, the program you viewed it with became strategically valuable, and two companies fought over it. The browser wars of the 1990s turned the browser from a simple document viewer into a programmable platform, the runtime that an enormous share of software now targets.

> [!note] The idea
> A browser is a client runtime. It parses HTML and CSS into a visual layout and runs JavaScript, so a web page is not a static document but a small program executing on your machine.

## The first browser war

Between 1995 and 2001, Netscape Navigator and Microsoft's Internet Explorer competed hard for the same users. New features were added constantly, including [[cs/pl/compilation-vs-interpretation|Netscape's JavaScript]], which Microsoft reimplemented as JScript, and [[cs/standards/when-the-standard-loses-to-the-implementation|the first commercial support for Cascading Style Sheets]]. Each release tried to outdo the other.

## From viewer to platform

That competition pushed browsers to render richer pages and run more code, and [[cs/security/sandboxing-and-isolation|a document viewer became an execution environment]]. Today a vast amount of software, from email to spreadsheets to design tools, runs inside the browser rather than as a native application. That is why the browser is now one of the most important pieces of software in the world.

## Why it matters

The rivalry, later renewed by Chrome and Firefox, drove the rapid feature development that made the Web a universal client platform rather than merely a way to read pages. The thing Netscape and Microsoft were really fighting over was who would own the runtime of the future.

## Related Notes

- [[world-wide-web|The World Wide Web]], the thing browsers display
- [[network-protocols|Network Protocols]], how the browser fetches pages
- [[history-of-the-internet|History of the Internet]], the wider arc
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Browser wars," Wikipedia. https://en.wikipedia.org/wiki/Browser_wars . Supports the first browser war (1995-2001) between Internet Explorer and Netscape Navigator, the addition of JavaScript (reimplemented by Microsoft as JScript) and commercial CSS support, and competition driving rapid release and feature development.
