---
title: YAML as a Programming Surface
description: "A data format doing the job of a syntax: what Ansible gives up by writing its language in YAML with Jinja2 inside the strings, and the two things it bought that were worth the price."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-17
updated:
aliases: []
---

The reason given for the choice is one sentence: "we use YAML because it is easier for humans to read and write than other common data formats like XML or JSON. Further, there are libraries available in most programming languages for working with YAML." Note the frame. The comparison set is XML and JSON, not Python or Ruby or a purpose-built DSL. The question being answered was which data format to write configuration in, and the answer to that question was correct.

The consequence is that Ansible's grammar is inherited rather than designed. The lexical rules, the type inference on unquoted scalars, and the reserved characters all belong to YAML and were fixed before Ansible existed. Everything in the documentation's "Gotchas" section is a place where that borrowed grammar and the language's intent collide.

> [!note] The idea
> In YAML, a value's type is decided by its spelling, at parse time, by a library that has never heard of Ansible. `yes` is a boolean, `1.0` is a float, and `c:` is a syntax error, none of which the playbook author asked for. Layering Jinja2 inside the strings then makes it worse in a specific way: "if a value after a colon starts with a `{`, YAML will think it is a dictionary, so you must quote it." The expression sublanguage collides with the host format's own syntax at the very first character, which is why the most common line in Ansible has quotes around it for reasons that have nothing to do with the expression inside them. The relationship between [[cs/pl/language-overview-syntax-semantics|syntax and semantics]] is unusually literal here: the syntax belongs to YAML, the semantics belong to Ansible, and neither party can fix a problem in the other's half.

## The gotchas are a type system nobody chose

Read the documented traps in a row and a pattern appears. Each one is an implicit conversion.

Booleans convert from several spellings. `true`, `True`, `TRUE`, and `yes` all work, and the docs recommend lowercase `true` and `false` for compatibility with default yamllint options. The trap follows immediately: "boolean conversion is helpful, but this can be a problem when you want a literal `yes` or other boolean values as a string," so a country code, a shell answer, or a package named `no` needs quoting to survive.

Numbers convert too. "YAML converts certain strings into floating-point values, such as the string `1.0`," so a version number in a `requirements.yml` needs quotes if it looks like a float. Anyone who has watched `1.10` and `1.1` compare equal knows where that ends.

Punctuation decides structure. A colon followed by a space or newline indicates a mapping, and a space followed by `#` starts a comment, so an unquoted sentence containing a colon is a syntax error and `windows_drive: c:` fails while `windows_path: c:\windows` is fine. There are "a number of characters that are special (or reserved) and cannot be used as the first character of an unquoted scalar," and the docs add that `?`, `:`, and `-` are allowed at the start of a string when a non-space character follows, but "YAML processor implementations differ, so it is better to use quotes." That is an admission worth pausing on: the surface syntax of Ansible is only as portable as the agreement between YAML parsers.

Quoting is all-or-nothing: a value that begins with a quote must be quoted in its entirety, which is why a template expression concatenated with a literal path has to wrap the whole thing.

None of these are Ansible's fault, and all of them are Ansible's problem. A designed surface syntax would have made `yes` a string, `1.0` whatever you declared it to be, and `{{` unambiguous. What Ansible has instead is a set of conventions enforced by linting and by the reader's memory.

## Variables reach into Python, too

The leakage does not stop at the parser. Jinja2's dot notation for variables is convenient until a key collides with the host language: "some keys can cause problems because they collide with attributes and methods of python dictionaries," and the docs' example is `item.update`, which "causes a syntax error because `update()` is a Python method for dictionaries." The recommended fix is array notation, `item['update']`, which is also required for keys containing dots, colons, or dashes, and for keys beginning and ending with two underscores.

So the naming rules of a playbook variable are a function of YAML's scalar rules, Jinja2's attribute lookup, and Python's dictionary API, in that order. Three languages, none of which is Ansible, jointly decide whether a name you invented is usable.

> [!warning] Dynamic arguments cross a trust boundary
> Because a task is a dictionary, you can build one at runtime and hand it over whole, setting all of a task's arguments from a dictionary-typed variable. Ansible issues a warning when you do, and the reason is not stylistic. The parameters "could be overwritten by malicious values in the host facts on a compromised target machine," which is the shape of the problem in [[cs/security/insecure-deserialization|insecure deserialization]] arriving through a configuration tool: attacker-influenced data from a managed node becomes the argument structure of a privileged operation on that same node. The docs recommend against the technique outright. Data being code-shaped is what makes it possible, and data being code-shaped is the whole premise of the format.

## What the choice bought

The honest accounting has a credit side, and it is larger than the complaints suggest.

Because a playbook is data, everything can read it without running it. Playbooks can be generated, diffed, templated, linted, stored in version control as text with meaningful line-level history, and parsed by tooling in any language, which is the practical benefit of a portable representation covered in [[cs/languages/common/serialization-and-wire-formats|serialization and wire formats]]. The project never had to write, document, version, or maintain a parser, and never had to teach anyone a new grammar. `ansible-playbook --syntax-check` and `--list-tasks` work because the whole program is available as a data structure before execution.

The alternative, taken by other tools, is to define a real language. Puppet wrote a DSL with its own grammar. Chef embedded configuration in Ruby and inherited a general-purpose language whole. Racket goes further still and hands you the machinery to define a language per file, as described in [[cs/languages/Racket/languages-as-modules-and-hash-lang|languages as modules and #lang]]. Each of those buys expressiveness and pays for it with a parser to maintain, a grammar to teach, and, in the embedded case, the ability to write an unreviewable amount of logic in a configuration file.

Ansible chose the low rung of the ladder in [[cs/pl/levels-of-artificial-languages|levels of artificial languages]] and stayed there deliberately. A configuration notation is not a programming language, and the constraint is doing real work: when the notation cannot express arbitrary computation, the computation has to move into a module, where it is Python with an argument spec, a test suite, and a version number. The awkwardness of writing loops and conditionals in YAML is not purely a defect. It is a tax on putting logic in the wrong layer, and the folder's other notes are largely the story of people paying it anyway.

## Related Notes

- [[cs/languages/Ansible/why-ansible-has-no-generics|Why Ansible Has No Generics]] - the same argument from the type side, and what the language offers instead
- [[cs/languages/Ansible/jinja2-templating-and-facts|Jinja2 Templating and Facts]] - the expression sublanguage living inside these quoted strings
- [[cs/pl/levels-of-artificial-languages|Levels of Artificial Languages]] - where a data-format-as-syntax sits, and why staying there is a choice
- [[cs/languages/Racket/languages-as-modules-and-hash-lang|Languages as Modules and #lang]] - the far end of the same spectrum, where defining a grammar is routine
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - the risk when runtime data becomes program structure
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - what a program stored as data makes possible for tooling

## Sources

- "YAML Syntax," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/reference_appendices/YAMLSyntax.html . Supports the stated rationale for choosing YAML over XML and JSON and the availability of libraries, the boolean spellings and the yamllint recommendation, the literal-`yes` problem, floating-point conversion of version-like strings, the colon and comment indicators with the `windows_drive` example, the quoting requirement for values beginning with `{{`, the all-or-nothing quoting rule, the existence of reserved first characters for unquoted scalars, and the note that processor implementations differ for `?`, `:`, and `-`.
- "Frequently Asked Questions," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/reference_appendices/faq.html . Supports dot notation colliding with Python dictionary attributes and methods with the `item.update` example, the array notation recommendation for keys containing special characters, and the security warning against bulk-setting task arguments from a dictionary variable including the compromised-host-facts risk.
- "Ansible concepts," Ansible Community Documentation. https://docs.ansible.com/ansible/latest/getting_started/basic_concepts.html . Supports playbooks being written in YAML and described as easy to read, write, share, and understand.
