---
title: SQL Injection
description: "Why sanitizing input is the wrong mental model and parameterized queries are the right one: the fix is structural, separating the query's shape from its values."
draft: false
comments: true
tags:
  - cs
  - security
  - databases
  - web
date: 2026-01-19
updated:
aliases:
  - SQL injection
  - SQLi
---

The bug looks like a string problem, so people reach for a string solution: strip the quotes, escape the semicolons, blacklist the word `DROP`. Every one of those defenses is a patch over the actual mistake, and every one of them has been bypassed. SQL injection is not fundamentally about dangerous characters. It is about a category confusion, where data the user typed gets promoted into [[cs/history/relational-model-and-sql|the language the database executes]].

> [!note] The idea
> Injection happens because the application builds a query by gluing untrusted values into the query text, so the database cannot tell which parts are structure and which are data. The durable fix is not cleaner input, it is a channel that keeps the two apart: send the query's fixed skeleton and its variable values over separate paths so the values can never be parsed as SQL.

## The category confusion

OWASP lists the exact conditions under which an application is vulnerable, and the load-bearing one is blunt: "Hostile data is directly used or concatenated. The SQL or command contains the structure and malicious data in dynamic queries, commands, or stored procedures." When you write `"SELECT * FROM users WHERE name = '" + input + "'"`, the database receives one flat string and parses all of it as SQL. If `input` is `' OR '1'='1`, the quote you meant as data closes the literal and the rest becomes logic. [[cs/pl/grammar-ambiguity-parse-trees|The parser]] is doing exactly its job. The application handed it a program and called it a value.

This is why input filtering is a losing game. It tries to guess, character by character, which bytes might later be interpreted as syntax, in a language with many escaping contexts and encodings. You are approximating the database's parser from the outside and hoping your approximation matches. It never fully does.

## Parameterized queries move the boundary

The fix stops guessing and changes the interface. OWASP states the preference directly: "The preferred option is to use a safe API, which avoids using the interpreter entirely, provides a parameterized interface, or migrates to Object Relational Mapping Tools (ORMs)." A parameterized query sends the SQL skeleton with placeholders first, so the database parses and plans the statement while the placeholders are still holes. The values arrive afterward, bound to those holes as [[cs/pl/type-systems-goals-guarantees|typed data]]. By the time the value `' OR '1'='1` shows up, parsing is already finished. There is no parser left for it to escape into. It can only ever be the string a user named.

That is the whole trick, and it is structural rather than lexical. The dangerous characters are still dangerous in the abstract; they simply never reach a stage where they could be read as syntax. You have not sanitized the input, you have denied it the chance to be code.

> [!example] Same input, two fates
> Concatenated: the program string is `SELECT * FROM users WHERE name = '' OR '1'='1'`, the parser sees an always-true condition, and every row returns. Parameterized: the program string is `SELECT * FROM users WHERE name = ?`, fully parsed with one placeholder, and `' OR '1'='1` is bound as a single value, so the query looks for a user literally named `' OR '1'='1`, finds none, and returns nothing. Identical bytes, opposite outcome, because the boundary between code and data moved earlier in the pipeline.

> [!warning] Parameterization is not automatic everywhere
> Prepared statements protect the values you bind, not query structure you still build by hand. OWASP warns that "Even when parameterized, stored procedures can still introduce SQL injection if PL/SQL or T-SQL concatenates queries and data." Identifiers like table and column names usually cannot be parameterized either, so dynamic ones need allow-listing, not binding. The rule is not "call a prepared-statement API," it is "never let untrusted data reach the query as structure."

## Related Notes

- [[cs/security/cross-site-scripting-xss|Cross-Site Scripting (XSS)]], the same code-versus-data confusion aimed at the browser instead of the database
- [[cs/security/owasp-top-10|The OWASP Top 10]], where SQL injection sits inside the broader A03 Injection class
- [[cs/security/stride-threat-modeling|STRIDE Threat Modeling]], for naming the tampering and disclosure threats injection realizes

## Sources

- "A03:2021 Injection," OWASP Top 10:2021. https://owasp.org/Top10/2021/A03_2021-Injection/ . Supports that an application is vulnerable when "Hostile data is directly used or concatenated" so the SQL "contains the structure and malicious data"; that "The preferred option is to use a safe API, which avoids using the interpreter entirely, provides a parameterized interface, or migrates to Object Relational Mapping Tools (ORMs)"; and that "Even when parameterized, stored procedures can still introduce SQL injection if PL/SQL or T-SQL concatenates queries and data."
