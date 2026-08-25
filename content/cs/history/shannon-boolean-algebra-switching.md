---
title: "Shannon's Master's Thesis: Logic Becomes Circuits"
description: How a 21-year-old showed that Boole's algebra of logic is exactly the mathematics of electrical switches, turning circuit design into a science.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-03-15
updated:
aliases:
  - Shannon switching thesis
  - relay logic
---

In 1937 a graduate student at MIT wrote what has often been called the most important master's thesis of the twentieth century. Claude Shannon, then twenty-one, showed that [[cs/history/boole-and-boolean-algebra|Boole's]] algebra of logic was exactly the mathematics of electrical switches.

> [!note] The idea
> A switch is a Boolean variable. Switches wired in series compute AND, switches wired in parallel compute OR, and an open or closed path is true or false. So any logical function can be built as a circuit, and any circuit can be analyzed and simplified as algebra.

## The thesis

Shannon's 1937 MIT master's thesis proved that [[cs/math/boolean-algebra|Boolean algebra]] could be used to design and simplify the arrangements of relays that made up the [[cs/military-computing/paul-baran-and-packet-switching|automatic telephone switching exchanges]] of the day. Logic, which Boole had treated as pure mathematics, turned out to describe physical switching networks precisely.

![Two switches in series form an AND; two in parallel form an OR. A path conducts only when the logic is true.](cs/history/assets/switches-and-gates.svg)

## From art to science

Before Shannon, designing a switching circuit was trial and error. After him, it was algebra: write the desired behavior as a Boolean expression, [[cs/math/propositional-logic|simplify the expression using Boole's laws]], and build the simplified circuit, now provably correct and often much smaller. His thesis laid the foundations for all digital circuit design, which is to say for the logic inside every computer.

## Two Shannons

This is the earlier of Shannon's two world-changing ideas. The later one, [[cs/military-computing/shannon-and-information-theory|information theory]] in 1948, is a separate matter, treated in the military-computing cluster. Together they make Shannon one of the rare people with two foundational contributions to a field.

## Related Notes

- [[cs/history/boole-and-boolean-algebra|George Boole and the Algebra of Logic]], the algebra Shannon put to work
- [[cs/history/leibniz-and-binary|Leibniz and Binary]], the two-symbol system that matches two-state switches
- [[cs/military-computing/shannon-and-information-theory|Shannon and Information Theory]], his later, separate breakthrough
- [[cs/history/von-neumann-architecture|Von Neumann Architecture]], the machines built from these circuits
- [[cs/history/index|History of Computing]], the section index

## Sources

- "A Symbolic Analysis of Relay and Switching Circuits," Wikipedia. https://en.wikipedia.org/wiki/A_Symbolic_Analysis_of_Relay_and_Switching_Circuits . Supports the work as Claude Shannon's 1937 MIT master's thesis, its proof that Boolean algebra could simplify the relays that were the building blocks of automatic telephone exchanges, and its laying the foundations for all digital computing and digital circuits.
