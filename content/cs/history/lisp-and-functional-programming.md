---
title: Lisp and Functional Programming
description: How John McCarthy's language built on lists and recursion introduced ideas, from garbage collection to higher-order functions, that the field took decades to absorb.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-01-03
updated:
aliases: []
---

A year after [[cs/history/fortran-and-high-level-languages|Fortran]], John McCarthy designed a language built on entirely different instincts. Lisp treated computation as [[cs/languages/Racket/s-expressions-and-evaluation|the evaluation of expressions over lists]], and from that one idea came a remarkable number of concepts the rest of the field would take decades to adopt.

> [!note] The idea
> Programs and data are the same kind of thing, lists, evaluated recursively. From that single choice flow recursion, symbolic manipulation, and the need for automatic memory management.

## McCarthy's language

John McCarthy began developing Lisp in 1958 at MIT. It is the second-oldest high-level programming language still in common use, after Fortran, which is its own kind of testament given how strange it looked at the time.

## What it pioneered

Lisp introduced or popularized a startling list of ideas: [[cs/dsa/recursion|recursion]], [[cs/dsa/linked-list|the list as a universal data structure]], conditionals, higher-order functions, the read-eval-print loop, and automatic memory management. [[cs/pl/garbage-collection-concepts|Garbage collection]], the automatic freeing of memory no longer in use, was built for Lisp before 1962, solving a problem that Fortran's simpler model never had.

## Functional and AI

Lisp quickly became the favored language of artificial intelligence research, and it is the root of the functional tradition described in [[cs/pl/programming-paradigms-models-of-computation|programming paradigms]]. Its evaluation model is close kin to Church's [[cs/pl/lambda-calculus-syntax-substitution|lambda calculus]], the same theory that sits under the [[cs/history/hilbert-godel-church-computability|limits of computation]].

## Related Notes

- [[cs/history/fortran-and-high-level-languages|Fortran and the High-Level Language]], its contemporary opposite
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus]], the theory Lisp echoes
- [[cs/pl/programming-paradigms-models-of-computation|Programming Paradigms]], where functional programming fits
- [[cs/pl/history-genealogy-of-languages|History and Genealogy of Languages]], the family tree
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Lisp (programming language)," Wikipedia. https://en.wikipedia.org/wiki/Lisp_%28programming_language%29 . Supports Lisp's creation by John McCarthy in 1958 at MIT, its standing as the second-oldest high-level language still in common use after Fortran, its pioneering of recursion, conditionals, higher-order functions, the read-eval-print loop, and automatic memory management (garbage collection before 1962), and its association with artificial intelligence.
