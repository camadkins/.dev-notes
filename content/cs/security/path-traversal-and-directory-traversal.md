---
title: Path Traversal
description: "Why path traversal is a naming problem, not a permissions problem: the file system honors ../ faithfully, so the fix is to resolve and constrain the name before it ever becomes a path."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-07-25
updated:
---

An application that serves files usually thinks in terms of a folder. Downloads live in `/var/www/files`, and the user picks one by name. The mistake is assuming the name the user supplies stays inside that folder. It does not have to. A path is [[cs/pl/language-overview-syntax-semantics|a small language]], and `..` is a word in it that means "go up one level." String three or four of them together and the name walks straight out of the intended directory and into the rest of the [[cs/systems/file-systems|file system]].

> [!note] The idea
> Path traversal is a naming failure, not an access-control failure. The application concatenates untrusted input into a file path, and the operating system resolves `../` sequences faithfully, so the constructed name can point anywhere the process can read. The permissions were never bypassed. The process simply asked for a file it should never have been allowed to name.

## The dot-dot-slash escape

OWASP is precise about the target and the tool. The target: "A path traversal attack (also known as directory traversal) aims to access files and directories that are stored outside the web root folder." The tool: "By manipulating variables that reference files with 'dot-dot-slash (../)' sequences and its variations or by using absolute file paths, it may be possible to access arbitrary files and directories stored on file system."

The canonical proof is a request like `http://some_site.com.br/../../../../etc/shadow`. Each `../` climbs one directory; enough of them reach the root, and from there any absolute path is fair game. The classic prize on a Unix system is the password file, and OWASP shows exactly that, `/etc/passwd` and `/etc/shadow`, because those files reliably exist at a known location and reading them is unambiguous evidence the boundary is gone.

What makes this subtle is that every layer behaved correctly. The web server resolved a valid relative path. The file system returned a file the process had permission to read. No single component was tricked. The application was, by trusting that a filename would stay a filename.

## Why input sanitizing is the wrong verb

The instinct is to find `../` and strip it. OWASP gives a sharper instruction, and the wording is deliberate: "Validate the user's input by only accepting known good, do not sanitize the data." Sanitizing tries to remove the bad and keep what remains, which is a blocklist in disguise, and blocklists lose to encoding tricks: `..%2f`, `....//`, [[cs/languages/common/text-encoding-and-unicode|overlong UTF-8]], and other variations that decode to `../` after your filter has already run. Accepting only known-good input inverts that. If the only valid values are a fixed set of filenames or an index into a list, there is nothing to traverse with, because the raw path never comes from the user at all.

Structurally, the robust defense resolves the requested path to its canonical absolute form and then checks that the result still lives under the intended base directory, rejecting it otherwise. Resolve first, constrain second. OWASP adds perimeter measures in the same spirit: "Use chrooted jails and code access policies to restrict where the files can be obtained or saved to," and keep sensitive configuration out of the web root entirely so a traversal has less to reach.

> [!example] Same handler, two names
> A download handler joins the base directory `/var/www/files` with the user's `name`. Given `name=report.pdf`, it resolves to `/var/www/files/report.pdf`, safely inside the base. Given `name=../../../../etc/passwd`, it resolves to `/etc/passwd`, outside the base. A resolve-then-check defense computes the canonical path first, sees it does not start with `/var/www/files`, and refuses. The bytes differ only in a few `../`; the resolved location is what decides safety.

## Related Notes

- [[cs/security/command-injection|OS Command Injection]], the sibling failure where untrusted input is trusted as structure, one layer over at the shell
- [[cs/security/sandboxing-and-isolation|Sandboxing and Isolation]], the chrooted-jail idea OWASP recommends as a containment layer
- [[cs/security/owasp-top-10|The OWASP Top 10]], where path traversal falls under the A01 Broken Access Control category

## Sources

- "Path Traversal," OWASP Foundation. https://owasp.org/www-community/attacks/Path_Traversal . Supports that the attack "aims to access files and directories that are stored outside the web root folder," that it works "By manipulating variables that reference files with 'dot-dot-slash (../)' sequences and its variations or by using absolute file paths," the `/etc/shadow` and `/etc/passwd` exploitation examples, the guidance to "Validate the user's input by only accepting known good, do not sanitize the data," and to "Use chrooted jails and code access policies to restrict where the files can be obtained or saved to."
