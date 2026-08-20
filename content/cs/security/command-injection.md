---
title: OS Command Injection
description: "The distinction that makes command injection its own vulnerability class: the attacker never supplies code, only arguments, and rides the application's existing authority to run system commands."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-07-25
updated:
---

It is tempting to file command injection next to code injection and move on, because both end with the attacker running something they should not. But the mechanisms differ in a way that changes how you defend against them, and the difference is instructive. In code injection the attacker smuggles in new code. In command injection they do not need to. The application already runs system commands. The attacker just steers them.

> [!note] The idea
> OS command injection happens when an application builds a shell command out of untrusted input, so the input can add its own commands to the ones the application already intended to run. The attacker does not inject a program. They extend a program that already exists, and it executes with the application's privileges, not theirs.

## Untrusted data meets a shell

OWASP states the goal plainly: "Command injection is an attack in which the goal is execution of arbitrary commands on the host operating system via a vulnerable application." The precondition is equally plain: "Command injection attacks are possible when an application passes unsafe user supplied data (forms, cookies, HTTP headers etc.) to a system shell."

That phrase, *to a system shell*, is where the danger concentrates. A shell is a language interpreter. Hand it a string and it does far more than run one program: it parses metacharacters, semicolons chain commands, pipes redirect output, backticks and `$()` spawn subshells. So when an application concatenates a filename into `cat <file>` and shells out, a user who supplies `report.txt; rm -rf /` has not broken anything. The shell parsed exactly what it was given. The application handed a sentence to something that reads sentences and expected it to read a single word.

## Extending, not injecting

The cleanest way to understand command injection is by contrast, and OWASP draws it directly: "This attack differs from Code Injection, in that code injection allows the attacker to add their own code that is then executed by the application. In Command Injection, the attacker extends the default functionality of the application, which execute system commands, without the necessity of injecting code."

This distinction is not pedantry. It tells you where the authority comes from. The attacker writes no code and needs no foothold in the application's own logic. They only need the application to already be in the business of calling out to the operating system, and then they append to that call. The privileges are the application's. OWASP notes the commands "are usually executed with the privileges of the vulnerable application," which is why a web service running as a broad account turns a small injection into a system compromise. It is the same reason [[privilege-separation-and-least-privilege|least privilege]] matters so much: it caps what the borrowed authority can do.

## Why the fix is to avoid the shell, not to clean the string

The reflex is to scrub metacharacters. This fails for the same reason it fails in [[sql-injection|SQL injection]]: you are trying to out-parse an interpreter with many escaping contexts, from the outside. The structural fix removes the interpreter from the path. Use the language's API that takes a program name and an argument list as separate values, so the operating system executes the named binary with the arguments passed as inert data, and no shell ever parses a combined string. The `; rm -rf /` is then just a strange filename that does not exist, exactly as parameterized queries turn `' OR '1'='1` into a username nobody has.

> [!warning] "Just quote the input" is not the same as removing the shell
> Adding quotes around a shell argument still leaves a shell parsing the line, and quoting rules are subtle enough that bypasses exist. The reliable move is to not invoke a shell at all: pass an argument vector to the exec-family call so there is no command line to parse in the first place.

## Related Notes

- [[sql-injection|SQL Injection]], the same code-versus-data confusion aimed at a database interpreter instead of a shell
- [[privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]], which bounds the damage when the borrowed authority is used
- [[owasp-top-10|The OWASP Top 10]], where command injection lives inside the A03 Injection class

## Sources

- "Command Injection," OWASP Foundation. https://owasp.org/www-community/attacks/Command_Injection . Supports that the goal is "execution of arbitrary commands on the host operating system via a vulnerable application," that attacks are possible when an application "passes unsafe user supplied data (forms, cookies, HTTP headers etc.) to a system shell," that the commands "are usually executed with the privileges of the vulnerable application," and the distinction that "In Command Injection, the attacker extends the default functionality of the application, which execute system commands, without the necessity of injecting code."
