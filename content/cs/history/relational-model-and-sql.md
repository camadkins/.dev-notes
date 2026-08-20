---
title: The Relational Model and SQL
description: How Edgar Codd's idea of storing data as tables and querying it declaratively founded the database industry.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-03-15
updated:
aliases:
  - relational model
  - SQL
  - Codd
---

Before 1970, programs reached their data by following pointers through a specific storage layout, so changing the layout broke the programs that used it. Edgar Codd's relational model swept that away with a simple, mathematical idea: store data as tables, and ask for what you want rather than spelling out how to fetch it.

> [!note] The idea
> Represent all data as relations, tables of rows and columns, and let users query declaratively, stating what information they want instead of the steps to retrieve it. The system figures out the how.

## Codd's model

Edgar F. Codd, working at IBM, set out the relational model in his landmark 1970 paper, having first described it in 1969. Data is represented as tuples grouped into relations, with attributes as columns, tuples as rows, and relations as tables. The whole thing rests on the mathematics of relations, which gives it a firm and simple foundation.

## Declarative querying

The model provides a declarative method: users directly state what information the database contains and what they want from it, and the database management system works out how to retrieve it. SQL became the language that realized this approach, and decades later it still runs a very large share of the world's data.

## Why it matters

Separating what from how is one of the most productive ideas in all of computing. It let the physical storage change without rewriting the applications on top, and it founded the entire database industry. Underneath the tidy tables sits the messy reality of the [[file-systems|file system]] and the [[magnetic-disk-storage|disk]], which the model deliberately hides.

## Related Notes

- [[file-systems|File Systems]], the storage layer relational databases sit above
- [[magnetic-disk-storage|Magnetic Disk Storage]], the random access that made databases practical
- [[hash-tables|Hash Tables]], a core structure inside database engines
- [[cloud-computing-and-virtualization|Cloud Computing]], where databases now run
- [[cs/history/index|History of Computing]], the section index

## Sources

- "Relational model," Wikipedia. https://en.wikipedia.org/wiki/Relational_model . Supports the model's description by Edgar F. Codd (first described 1969, with his landmark 1970 paper), data represented as tuples grouped into relations with attributes as columns and tuples as rows, and the declarative method by which users state what information they want.
