---
title: "Why Go Waited, and What Changed"
description: "Twelve years of refusal was a cost argument, not hostility, and the design that finally shipped won by reinterpreting a construct Go already had."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-02
updated:
aliases: []
---

Go became a public open source project on November 10, 2009. The request for generics arrived the same day. Ian Lance Taylor, writing a decade later, dates it precisely: "Less than 24 hours later we saw the first comment about generics." The feature that answered that comment, type parameters, landed in Go 1.18, which the design document expected "in the Go 1.18 release in early 2022." A little over twelve years passed between the question and the answer, and for most of that time the Go team's position was not that generics were bad but that nobody had yet produced a version worth what it cost.

> [!note] The idea
> The twelve-year delay is usually told as a story about taste, as though Go's authors disliked [[cs/pl/parametric-polymorphism-adts|parametric polymorphism]] on principle. The record says something narrower and more interesting: the objection was always a price, stated in units of language complexity, and the design that finally cleared it did so by adding almost no new machinery. Constraints are interface types. Instantiation is substitution. The only genuinely new syntax is a bracketed parameter list and a way to write a type set. Go did not wait for generics to become desirable. It waited for a version of generics that could be paid for out of features the language already had.

## The refusal, in the team's own words

The FAQ has carried the answer for years and it has not changed much. Go was designed for server programs that would be easy to maintain, and the design "concentrated on things like scalability, readability, and concurrency." Against those goals, "Polymorphic programming did not seem essential to the language" at the time, so it was left out for simplicity.

Then comes the sentence that actually explains the twelve years: "Generics are convenient but they come at a cost in complexity in the type system and run-time." Not a cost in effort. A cost in complexity, the currency [[cs/pl/type-systems-goals-guarantees|a type system is budgeted in]], which in Go's value system is the scarce resource. The FAQ closes the thought with a confession of slowness that is also a statement of the bar: "It took a while to develop a design that we believe gives value proportionate to the complexity."

That framing matters because it is falsifiable in a way that "we do not like generics" is not. If the price is complexity, then a cheaper design wins, and the team is obliged to keep looking.

## What the cost actually was

The pressure never let up. Taylor reports that "In three years of Go surveys, lack of generics has always been listed as one of the top three problems to fix in the language." So the benefit side of the ledger was never in doubt. The difficulty was on the other side, and it had three distinct components.

The first is the one Russ Cox named. The design document quotes it directly: "Russ Cox [famously observed](https://research.swtch.com/generic) that generics require choosing among slow programmers, slow compilers, or slow execution times." Slow programmers is the status quo, writing `ReverseInts` and then `ReverseStrings` by hand. Slow compilers is stamping out a copy of every function for every type. Slow execution is boxing everything behind an indirection. Go cared about all three, and its fast build times were a marketing point, so no corner of that triangle was free to give away.

The second component is that Go already had a partial answer and did not want two. Interfaces are a form of generic programming: they capture what different types have in common and let one function serve all of them. The trouble is that the programmer has to write the methods, and for a slice reverse those methods are identical for every element type, so the duplication moves rather than disappears. Any generics design had to justify itself against a feature already in the language, which is a higher bar than justifying itself against nothing. That comparison is still the practical decision rule today.

The third is where the complexity would land. Taylor's guidelines from 2019 are explicit: "As much as possible the complexity should fall on the programmer writing the generic package." A reader of ordinary Go, calling a generic function, should not have to know anything new. This constraint eliminated whole families of designs that are perfectly reasonable elsewhere, because they push work onto the call site or onto the error message. The summary line is the one worth keeping: "generics can bring a significant benefit to the language, but they are only worth doing if Go still feels like Go."

## What changed

Two things, one technical and one conceptual.

The technical change is visible in the design document's own history. "This version of the design has many similarities to a design draft presented on July 31, 2019, but contracts have been removed and replaced by interface types, and the syntax has changed." Contracts were a separate construct with their own syntax and their own rules, and the team found that "many people had a hard time understanding the difference between contracts and interface types." Deleting them removed an entire concept from the language while losing nothing: "there was no loss in expressive power without contracts." That is the shape of a design finally becoming affordable. The feature stayed and the new concept count went down.

The conceptual change is that an interface stopped meaning a set of methods and started meaning a set of types, which is what made the deletion possible. That reframing is the subject of [[cs/languages/Go/constraint-interfaces-and-type-sets|constraint interfaces and type sets]], and it is the single load-bearing idea in the whole proposal. Once an interface denotes a set of types, an operator constraint is just a listed set, and the syntax for constraints is the syntax you already know.

## What it refused to become

The design is equally defined by what stayed out. The proposal states flatly that "This design does not support template metaprogramming or any other form of compile time programming," and the omissions list runs to ten items. Reading it is the fastest way to understand the aesthetic, which is why it gets [[cs/languages/Go/what-generics-deliberately-left-out|its own treatment]]. The short version is that every rejected feature was rejected on the same grounds as the twelve-year delay: it cost more clarity than it bought.

> [!tip] The general lesson
> "Wait until the design is cheap enough" is a strategy available to any project with the discipline to hold a line for a decade and the humility to keep redesigning. It works only if the objection is stated as a price rather than as a preference, because a price can be met. Go's answer to generics was reached by a team that kept publishing failed drafts, and the last draft won by subtracting a construct rather than adding one.

Where this lands Go among its neighbours is a separate question. Java retrofitted generics onto an existing runtime and paid in erasure; C# changed the runtime and got reification; Go, arriving last, could pick an implementation strategy on the merits and chose neither pole. That comparison is drawn out across the section, and Go's specific answer is [[cs/languages/Go/generics-implementation-gc-shape-stenciling|GC shape stenciling]]. Arriving twelve years late turned out to have a compensation: every other language's mistakes were already documented.

## Related Notes

- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & Algebraic Data Types]] - the general feature Go spent twelve years declining to add
- [[cs/pl/history-genealogy-of-languages|History & Genealogy of Languages]] - where a design that subtracts concepts sits in the wider family tree
- [[cs/languages/common/generics-monomorphization-vs-erasure|Generics, Monomorphization vs Erasure]] - the implementation axis Go got to choose on freely by arriving last
- [[cs/languages/Java/generics-and-type-erasure|Generics and Type Erasure in Java]] - the retrofit Go was explicitly comparing itself against
- [[cs/languages/Go/constraint-interfaces-and-type-sets|Constraint Interfaces and Type Sets]] - the reframing that made the final design affordable
- [[cs/languages/Go/what-generics-deliberately-left-out|What Generics Deliberately Left Out]] - the omissions list, which encodes the same cost argument

## Sources

- The Go Programming Language FAQ. https://go.dev/doc/faq . Supports the November 10 2009 open source date, the stated goals of scalability, readability and concurrency, the claim that polymorphic programming did not seem essential at the time, the complexity cost framing, and that Go 1.18 added type parameters.
- Ian Lance Taylor, "Why Generics?", The Go Blog, 31 July 2019. https://go.dev/blog/why-generics . Supports the first generics comment within 24 hours, the three years of surveys ranking generics in the top three problems, the guideline that complexity should fall on the writer of the generic package, and the "still feels like Go" bar.
- Ian Lance Taylor and Robert Griesemer, "Type Parameters Proposal," golang/proposal, 20 August 2021. https://raw.githubusercontent.com/golang/proposal/master/design/43651-type-parameters.md . Supports the expected Go 1.18 timing, the Russ Cox observation about slow programmers, compilers, or execution, the removal of contracts in favour of interface types, and the exclusion of template metaprogramming.
