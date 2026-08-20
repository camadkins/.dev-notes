---
title: The OWASP Top 10
description: "Why the list reads better as a map of recurring failure classes than as a checklist, and what it means that broken access control climbed to number one."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-03-11
updated:
aliases:
  - OWASP Top 10
  - OWASP Top Ten
---

Read as a checklist, the OWASP Top 10 is a disappointment: ten items is nowhere near enough to secure a web application, and any team that treats "we handled all ten" as done has misunderstood the document. It works far better read the other way, as a map. Each entry marks a place where the same failure keeps reappearing across thousands of unrelated codebases, which tells you where to spend attention before you have found a single bug of your own.

> [!note] The idea
> The Top 10 is a consensus ranking, not a coverage spec. Its value is not the ten strings but the empirical claim behind them: across a huge pool of tested applications, a small number of root failure classes account for most of the exposure, and their order shifts as the field changes. It points you at recurring structure, not at a finish line.

## What the document actually is

OWASP describes it plainly: "The OWASP Top 10 is a standard awareness document for developers and web application security. It represents a broad consensus about the most critical security risks to web applications." Awareness is the operative word. It is built to move an industry's attention, so it is deliberately short, ranked, and revised on a multi-year cadence as new data arrives.

The 2021 list, in order, is:

1. A01 Broken Access Control
2. A02 Cryptographic Failures
3. A03 Injection
4. A04 Insecure Design
5. A05 Security Misconfiguration
6. A06 Vulnerable and Outdated Components
7. A07 Identification and Authentication Failures
8. A08 Software and Data Integrity Failures
9. A09 Security Logging and Monitoring Failures
10. A10 Server Side Request Forgery (SSRF)

## The ranking carries the information

The order is not editorial. It reflects how often each class showed up in a contributed dataset of real applications, which is why watching an item move is more instructive than reading its name. Broken access control is the headline case: OWASP notes it moved "up from the fifth position, 94% of applications were tested for some form of broken access control," and that it "has the most occurrences in the contributed dataset with over 318k." A failure class does not climb from fifth to first because it got scarier in the abstract. It climbs because testers kept finding it.

[[stride-threat-modeling|Injection]] tells the same story from the other direction. In 2021 it sits at third with an average incidence rate of 3.37% across 274,228 total occurrences, still enormous, but no longer the reflexive number-one it was in older lists. The category absorbing [[sql-injection|SQL injection]] and [[cross-site-scripting-xss|cross-site scripting]] slipping down the ranking is itself a signal: parameterized APIs and framework-default escaping have measurably changed where the industry bleeds.

## Why "map, not checklist" is the correct reading

A checklist implies completeness: tick every box and you are safe. The Top 10 makes no such promise and cannot, because ten categories cannot enumerate every web risk. What it can do is tell you where the base rates are highest, so a team with finite review time knows that an access-control audit and a misconfiguration sweep will, on the average codebase, retire more real risk than chasing an exotic bug. The document is a prior over where to look, refreshed from evidence, not a specification of what secure means.

> [!warning] The list lags, by construction
> Because ranks come from accumulated real-world data, the Top 10 describes where the field has been, not where the next class of attack is heading. A brand-new risk category is invisible until enough evidence piles up to rank it. Use the list to allocate attention across known-recurring failures; use threat modeling to reason about the ones no dataset has caught yet.

## Related Notes

- [[sql-injection|SQL Injection]], the archetypal member of the A03 Injection class
- [[cross-site-scripting-xss|Cross-Site Scripting (XSS)]], another injection-family risk the rankings track
- [[stride-threat-modeling|STRIDE Threat Modeling]], for reasoning about risks a lagging list cannot yet rank
- [[cross-site-request-forgery-csrf|Cross-Site Request Forgery (CSRF)]], a web risk whose decline the list also records

## Sources

- "OWASP Top 10," OWASP Foundation. https://owasp.org/www-project-top-ten/ . Supports that the Top 10 is "a standard awareness document for developers and web application security" representing "a broad consensus about the most critical security risks to web applications."
- "A01:2021 Broken Access Control," OWASP Top 10:2021. https://owasp.org/Top10/2021/A01_2021-Broken_Access_Control/ . Supports that Broken Access Control moved "up from the fifth position," that "94% of applications were tested for some form of broken access control," and that it "has the most occurrences in the contributed dataset with over 318k."
- "A03:2021 Injection," OWASP Top 10:2021. https://owasp.org/Top10/2021/A03_2021-Injection/ . Supports the third-place 2021 rank and the injection incidence figures (average incidence rate 3.37%, 274,228 total occurrences).
