---
title: VisiCalc and the Killer App
description: How the first spreadsheet was so useful that people bought a whole computer to run it, and introduced the dataflow model every spreadsheet still uses.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-05-05
updated:
aliases: []
---

A computer needs a reason to buy it. For the early [[cs/history/altair-8800-and-personal-computing|personal computer]], that reason turned out to be the spreadsheet. VisiCalc, released in 1979, was so useful that people bought a whole computer just to run it, the first time software sold the hardware.

> [!note] The idea
> A grid of cells, where each cell holds a value or a formula that refers to other cells, and the program automatically recalculates everything that depends on a value the moment it changes. It is a small declarative dataflow language that anyone can use without knowing they are programming.

## The first spreadsheet

VisiCalc was the first spreadsheet program for personal computers, released for the Apple II on 17 October 1979. It presented [[cs/dsa/multidimensional-arrays|a sheet of cells]] that, as one description put it, could [[cs/languages/common/declarative-models-and-idempotence|perform calculations and recalculations]] so the user could just solve a problem with familiar tools.

![A spreadsheet: cell B1 holds a formula over A1 and A2, so changing A1 recalculates B1 automatically.](cs/history/assets/spreadsheet-recalc.svg)

## The killer app

It is often called the first killer application, the software that turned the microcomputer from a hobbyist's toy into a serious business tool. Businessmen who saw it in a store wanted it at once, and more than a quarter of Apple IIs sold in 1979 were reportedly bought in order to run it.

## Why it matters

VisiCalc proved that software could drive hardware sales, which reshaped the whole industry's logic. And the dependency-recalculation model it introduced, [[cs/dsa/topological-sorting|change one cell and everything downstream updates]], is still exactly how every spreadsheet works, a quietly profound idea hiding in an everyday tool.

## Related Notes

- [[cs/history/altair-8800-and-personal-computing|The Altair 8800 and the Personal Computer]], the hardware VisiCalc sold
- [[cs/pl/programming-paradigms-models-of-computation|Programming Paradigms]], where the dataflow model fits
- [[cs/history/index|History of Computing]], the section index

## Sources

- "VisiCalc," Wikipedia. https://en.wikipedia.org/wiki/VisiCalc . Supports VisiCalc as the first spreadsheet program for personal computers, released for the Apple II on 17 October 1979, considered the killer application that turned the microcomputer into a business tool, its automatic recalculation, and its role driving Apple II sales.
