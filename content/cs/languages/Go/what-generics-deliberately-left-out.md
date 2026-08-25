---
title: "What Generics Deliberately Left Out"
description: "The omissions list in the type parameters proposal is the design, and the one item that has since moved shows exactly what it would have taken to move the rest."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-18
updated:
aliases: []
---

Most language proposals list what a feature does. The type parameters proposal has a section listing what it does not, introduced with an admission rather than a defence: "However, there are a number of programming constructs that are not supported." Ten items follow. Read together they describe a second design, the one Go could have had, and the reason each was declined is the same reason the whole feature took twelve years.

> [!note] The idea
> The omissions are load bearing, not leftovers. Every item on the list is a capability that would have shifted work from the person writing a generic package to the person reading a call site, or from compile time predictability to compile time cleverness. The design is not a subset of C++ templates that ran out of time; it is a different shape, chosen by repeatedly answering "what does this cost the reader?" The proof is the one omission that has since been reversed, parameterized methods, which took nine releases and a carefully drawn exception around interfaces to become affordable. The others are still on the list because nobody has found their exception.

## The list

**No specialization.** "There is no way to write multiple versions of a generic function that are designed to work with specific type arguments." One body, one behaviour. A reader of a call to `Max[T]` does not have to ask whether some other `Max` was selected for their type.

**No metaprogramming.** "There is no way to write code that is executed at compile time to generate code to be executed at run time." The comparison with C++ is where the reasoning surfaces. C++ template metaprogramming is "ordinary programming done at compile time using a syntax that is completely different than that of non-template C++," and Go's verdict on omitting it is a straight accounting: "This saves considerable complexity while losing some power and run time efficiency." Losing run time efficiency is admitted rather than denied, which is what makes the trade credible. The general shape of what was given up is in [[cs/pl/macros-and-metaprogramming|macros and metaprogramming]], and [[cs/languages/Cpp/templates-and-generic-programming|C++ templates]] show what the other answer buys.

**No higher level abstraction.** "There is no way to use a function with type arguments other than to call it or instantiate it."

**No general type description.** "In order to use operators in a generic function, constraints list specific types, rather than describing the characteristics that a type must have." This is the honest self-assessment of type sets: enumeration is easy to understand and cannot express "any type with an addition operation."

**No covariance or contravariance of function parameters.** Go declined the entire [[cs/pl/subtyping-variance-type-constraints|variance]] apparatus, which is why there is nothing here resembling a Java wildcard. Whether that is a loss depends on how much time you have spent explaining wildcards to someone.

**No operator methods.** "You can write a generic container that is compile-time type-safe, but you can only access it with ordinary methods, not with syntax like `c[k]`." A generic map type gets `Get` and `Put`, never brackets. C# took the opposite road with [[cs/languages/CSharp/generic-math-and-static-abstract-members|static abstract members]], making arithmetic itself an interface requirement, which reaches user-defined numeric types at the cost of a considerably larger type system.

**No currying.** "There is no way to partially instantiate a generic function or type, other than by using a helper function or a wrapper type."

**No variadic type parameters.** No way of "writing a single generic function that takes different numbers of both type parameters and regular parameters," which is why Go has no variadic tuple types.

**No adaptors.** "There is no way for a constraint to define adaptors that could be used to support type arguments that do not already implement the constraint," so a type with an `Equal` method cannot be adapted into something satisfying a constraint that wants `==`.

**No parameterization on non-type values.** No `type Matrix[n int] [n][n]float64`. Array sizes stay out of the type parameter list.

One rule underlies several of these. "In this design all names are looked up at the point where they are written." C++ resolves some names at the template definition and some at the instantiation, which is where its famously deep error messages come from. Go pays for its shallower errors by refusing anything that would need late name resolution.

## The interesting one

Parameterized methods got their own discussion, because the reason was not taste. "This design does not permit methods to declare type parameters that are specific to the method," and the obstacle is stated as an open question rather than a preference: "It is not clear whether it is reasonably possible to permit parameterized methods to implement interfaces."

The FAQ works through why. Methods exist so that types can implement interfaces, and interface satisfaction in Go is checked dynamically as well as statically. A value holding a type with a generic `Nop[T any](T) T` method would have to satisfy `interface{ Nop(string) string }`, `interface{ Nop(int) int }`, and every other instantiation anyone might type-assert. "But for generic methods, there can be an infinite number of method implementations, so a different strategy is needed." Four strategies were considered: relink after discovering the needed instantiations, which "would make builds significantly slower"; a JIT, rejected because "Go benefits greatly from the simplicity and predictable performance of being purely ahead-of-time compiled"; a slow fallback using a table of operations, which would make performance unpredictable; and forbidding generic methods from satisfying interfaces at all, which was ruled out because "Disallowing generic methods from satisfying interfaces is unacceptable from a design point of view." The conclusion: "None of these choices are good ones, so we chose" none of the above. The advice was to restructure instead, since "Instead of methods with type parameters, use top-level functions with type parameters, or add the type parameters to the receiver type." The FAQ still carries the forecast: "We do not anticipate that Go will ever add generic methods."

## The forecast expired

Go 1.27 added them. The release notes are direct: "Go 1.27 now supports generic methods," and the motivation is the ergonomic one the FAQ had waved off, since the change "allows adding generic functions within the namespace of a particular data type where before one had to declare such functions with a scope of the entire package."

What makes it interesting is the fine print, because it is the fourth option in a narrower form: "Note that methods of interfaces may not declare type parameters nor can interface methods be implemented by generic methods." A generic method exists, and it simply plays no part in [[cs/pl/objects-classes-and-dispatch|interface dispatch]]. The 2021 objection was that disallowing generic methods from satisfying interfaces was unacceptable; the resolution was to accept exactly that, once it was clear the alternative was to keep the feature out forever.

> [!tip] How to read an omissions list
> Treat each entry as a question about where complexity lands rather than a claim about difficulty. Specialization and metaprogramming push work onto readers of call sites. Currying and variadic type parameters push work onto the type checker and its error messages. Parameterized methods pushed work onto the linker or a JIT, and moved only when a way was found to push it nowhere. An omission with a stated obstacle can expire; an omission whose stated cost is reader confusion usually will not.

## Related Notes

- [[cs/pl/macros-and-metaprogramming|Macros & Metaprogramming]] - the compile-time programming Go declined outright
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - specialization, metaprogramming, and late name lookup, all present
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - the variance machinery Go has no equivalent of
- [[cs/languages/CSharp/generic-math-and-static-abstract-members|Generic Math and Static Abstract Members]] - operators as constraint requirements, the road not taken
- [[cs/languages/Go/type-parameters-and-constraints|Type Parameters and Constraints]] - where the no-method-parameters rule used to bite
- [[cs/languages/Go/why-go-waited-and-what-changed|Why Go Waited, and What Changed]] - the same cost argument, applied to the feature as a whole

## Sources

- Ian Lance Taylor and Robert Griesemer, "Type Parameters Proposal," golang/proposal. https://raw.githubusercontent.com/golang/proposal/master/design/43651-type-parameters.md . Supports the framing and content of the omissions list including specialization, metaprogramming, higher level abstraction, general type description, variance, operator methods, currying, variadic type parameters, adaptors and non-type parameterization, the prohibition on method-specific type parameters and the interface obstacle behind it, the comparison with C++ template metaprogramming and its cost accounting, and the rule that all names are looked up where written.
- The Go Programming Language FAQ. https://go.dev/doc/faq . Supports the infinite number of method implementations problem, the four rejected strategies including slower builds and the rejection of a JIT, the judgement that disallowing interface satisfaction was unacceptable, the none of the above conclusion, the advice to use top-level functions or receiver type parameters, and the forecast that Go would never add generic methods.
- "Go 1.27 Release Notes," go.dev. https://go.dev/doc/go1.27 . Supports that Go 1.27 supports generic methods, the namespace motivation for the change, and the restriction that interface methods may not declare type parameters or be implemented by generic methods.
