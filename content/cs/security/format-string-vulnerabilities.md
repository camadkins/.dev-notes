---
title: Format String Vulnerabilities
description: "How an output function becomes an arbitrary-memory read and write primitive, because C lets the untrusted input decide how many arguments printf thinks it received."
draft: false
comments: true
tags:
  - cs
  - security
  - memory
date: 2026-01-19
updated:
aliases:
  - format string attack
  - uncontrolled format string
  - printf vulnerability
---

The whole vulnerability fits in one careless line: a programmer writes `printf(buffer)` when they meant `printf("%s", buffer)`. Both print the string in most cases, so the mistake survives testing. The difference only surfaces when `buffer` contains a percent sign. In the safe version `buffer` is data, printed literally. In the buggy version `buffer` is the format string, and every `%` in it is now a command that `printf` will obey. The attacker who controls that buffer is no longer supplying text. They are supplying a small program that the C library will execute against its own stack.

> [!note] The idea
> A format string bug is a type-safety failure disguised as a typo. C's variadic functions trust the format string to tell them how many arguments follow and of what type, then walk the stack to fetch them. When the format string is itself attacker input, the attacker controls that metadata: `%x` reads a word off the stack, `%s` dereferences it as a pointer and reads memory, and `%n` writes back the number of bytes printed so far to an address on the stack. An output function has been turned into an arbitrary read and, through `%n`, an arbitrary write.

## The safe line and the fatal line

Wikipedia states the pattern exactly: "The programmer may mistakenly write `printf(buffer)` instead of `printf("%s", buffer)`. The first version interprets buffer as a format string, and parses any formatting instructions it may contain. The second version simply prints a string." Crucially, "both versions behave identically in the absence of format specifiers in the string, which makes it easy for the mistake to go unnoticed." The bug is invisible until the input contains the trigger, which is exactly the condition an attacker supplies and a test suite rarely does.

## Why the type system is the real defect

The deeper cause is not carelessness but a hole in C's calling convention. As Wikipedia puts it, "Format bugs arise because [[cs/languages/common/c-abi-and-ffi|C's argument passing conventions]] are not type-safe. In particular, the [[cs/languages/Cpp/variadic-templates-and-parameter-packs|varargs mechanism]] allows functions to accept any number of arguments (e.g. `printf`) by 'popping' as many arguments off the [[cs/dsa/stack|call stack]] as they wish, trusting the early arguments to indicate how many additional arguments are to be popped, and of what types." Read that carefully: the function decides how far to reach into the stack based on the format string. If the format string is trusted input, that is fine. If it is attacker input, the attacker is choosing how many stack slots `printf` reads and how it interprets each one. There is no bounds check because, structurally, there is nothing that knows the real argument count.

## From reading the stack to writing memory

The specifiers escalate cleanly. OWASP's summary lists them: `%x` will "read data from the stack," `%s` will "read character strings from the process' memory," and `%n` will "write an integer to locations in the process' memory." The first two are already a serious information leak: an attacker can dump stack contents and dereference pointers to read arbitrary memory, defeating secrets and leaking the addresses that other exploits need. `%n` is the one that changes the category of the bug. Wikipedia describes it: an attacker can "write arbitrary data to arbitrary locations using the `%n` format token, which commands `printf()` and similar functions to write the number of bytes formatted to an address stored on the stack." Combine the two capabilities, and the classic exploit "take[s] control of the instruction pointer" by using padding to control the byte count and `%n` to overwrite a return address or a function pointer with the address of shellcode. A function whose entire job is producing output has become a primitive for writing chosen values to chosen addresses.

> [!example] Reading the stack with a wall of `%x`
> Feed a vulnerable `printf(buffer)` a buffer of `%x %x %x %x ...`. Each `%x` tells `printf` "another unsigned int argument was passed," so it prints the next word up the stack, even though no such argument exists. OWASP notes the mismatch is the whole game: the format function "is expecting more arguments as input, and if these arguments are not supplied, the function could read or write the stack." Walk far enough and the output includes the attacker's own buffer, at which point a crafted address in that buffer becomes a target the following `%n` can write to.

## Related Notes

- [[cs/security/buffer-overflows|Buffer Overflows]], the other classic memory-corruption bug, reached here by writing rather than by miscounting arguments
- [[cs/security/return-oriented-programming|Return-Oriented Programming]], which consumes the arbitrary write a `%n` provides to seed a gadget chain
- [[cs/security/memory-protections-aslr-dep-canaries|Memory Protections: ASLR, DEP, and Stack Canaries]], several of which the `%x`/`%s` read primitive is used to defeat by leaking addresses
- [[cs/security/sql-injection|SQL Injection]], the same root failure in a different language: data crossing into a control channel that interprets it

## Sources

- "Uncontrolled format string," Wikipedia. https://en.wikipedia.org/wiki/Uncontrolled_format_string . Supports the `printf(buffer)` versus `printf("%s", buffer)` distinction and that they "behave identically in the absence of format specifiers," that "C's argument passing conventions are not type-safe" and varargs functions pop arguments "trusting the early arguments to indicate how many additional arguments are to be popped," that `%s` and `%x` read the stack and other memory, and that `%n` writes "the number of bytes formatted to an address stored on the stack."
- "Format string attack," OWASP Foundation. https://owasp.org/www-community/attacks/Format_string_attack . Supports that `%x` reads "data from the stack," `%s` reads "character strings from the process' memory," `%n` writes "an integer to locations in the process' memory," and that when arguments are not supplied "the function could read or write the stack."
