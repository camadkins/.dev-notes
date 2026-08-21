---
title: "Generics versus Interfaces: When to Use Which"
description: "The deciding question is not how many types you want to handle, but whether the code is identical for all of them, and speed is not a tiebreaker."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-09
updated:
aliases:
  - When To Use Generics in Go
  - Go Generics or Interfaces
---

Go had a mechanism for writing one function that serves many types long before it had type parameters. Interfaces do that, and they still do it well, so every generic function you write is competing with an interface that would also have worked. Ian Lance Taylor wrote a whole article on choosing between them a month after Go 1.18 shipped, and its most useful content is the advice about when *not* to reach for the new feature.

> [!note] The idea
> The wrong question is "how many types does this need to handle?" Both tools handle many types. The right question is whether the code is the same for every type. If the body is identical and only the types differ, that is a type parameter. If the body differs per type and the differences are expressible as methods, that is an interface. If the body differs per type and the types have no methods to call, that is reflection. Speed does not enter into it, because the Go 1.18 implementation compiles many type parameter values much the way it compiles interface values anyway.

## The one guideline

Taylor reduces the whole article to a sentence, and it is worth memorizing before any of the cases: "If you find yourself writing the exact same code multiple times, where the only difference between the copies is that the code uses different types, consider whether you can use a type parameter." He states the inverse just as firmly: "you should avoid type parameters until you notice that you are about to write the exact same code multiple times."

That framing makes generics a response to observed duplication rather than a design step. The general programming advice comes first: "write Go programs by writing code, not by defining types," and specifically, "if you start writing your program by defining type parameter constraints, you are probably on the wrong path. Start by writing functions."

## Where type parameters earn their place

**Functions over the built-in containers.** "One case is when writing functions that operate on the special container types that are defined by the language: slices, maps, and channels." A function returning the keys of any map does nothing that depends on the key or value types, and the pre-generics alternative was unattractive: reflection "is a more awkward programming model, is not statically typechecked at build time, and is often slower at run time."

**General purpose data structures.** A linked list or a [[cs/dsa/binary-tree|binary tree]] is the same algorithm regardless of what it holds. The gain over an interface-typed container is concrete: "Replacing an interface type with a type parameter can permit data to be stored more efficiently, saving memory resources; it can also permit the code to avoid type assertions, and to be fully type checked at build time." For a generic tree, "When the tree is instantiated with a particular type argument, values of that type will be stored directly in the nodes. They will not be stored as interface types."

That last point is guaranteed by the language design rather than by the current compiler. The proposal is explicit: "In this design, values of generic types are not boxed," and for a generic struct, "When this is instantiated, the fields will not be boxed, and no unexpected memory allocations will occur." This is the same win a `List<int>` gets in the CLR and for the same reason, as [[cs/languages/CSharp/generic-collections-and-the-boxing-tax|the boxing tax]] describes.

**Methods that are identical across types.** When several types must implement the same interface and the implementations are word for word the same, one generic type can supply them all: "Using type parameters for this kind of code is appropriate because the methods look exactly the same for all slice types."

There is a design rule attached to the data structure case that saves real pain: "when you need something like a comparison function, prefer a function to a method." A tree that requires its element type to have a `Compare` method forces anyone holding plain `int` values to define a wrapper type. A tree that takes a comparison function does not, and the asymmetry is permanent: "it is much simpler to turn a method into a function than it is to add a method to a type."

## Where an interface is still the answer

The blunt version: "If all you need to do with a value of some type is call a method on that value, use an interface type, not a type parameter." Turning `func ReadSome(r io.Reader)` into `func ReadSome[T io.Reader](r T)` gains nothing. "Omitting the type parameter makes the function easier to write, easier to read, and the execution time will likely be the same."

The deeper test is the implementations. "if the implementation is different for each type, then use an interface type and write different method implementations." Reading from a file and reading from a random number generator share a signature and nothing else, which is precisely the situation [[cs/pl/objects-classes-and-dispatch|dynamic dispatch]] exists for. A type parameter would give you one body that has to branch on which type it received, which is an interface implemented badly.

And when neither fits, the third tool remains. Encoding arbitrary values to JSON cannot demand a method, since most types do not have one, and cannot use a type parameter, since encoding a struct is nothing like encoding an interface value. "Instead, the package uses reflection." That is the honest position of [[cs/languages/common/serialization-and-wire-formats|serialization]] in a statically typed language.

> [!warning] Performance is not the tiebreaker
> The temptation is to assume the concrete type parameter version is faster than the interface version. Taylor closes that door: "the implementation used in Go 1.18 will in many cases treat values whose type is a type parameter much like values whose type is an interface type," so "using a type parameter will generally not be faster than using an interface type." The FAQ says the same from the compiler's side, that the shared compilation strategy "is similar to a function with an interface parameter." [[cs/languages/Go/generics-implementation-gc-shape-stenciling|GC shape stenciling]] explains why: a shape body cannot resolve method calls at compile time either, so it loses the same inlining an interface call loses. The storage win for containers is real; a speed win on method calls generally is not.

## The decision, compressed

Three questions in order. Is the code identical for every type? If yes, type parameter. If no, are the differences expressible as methods? If yes, interface. If no, reflection, and accept the cost. Everything in Taylor's article is an application of that sequence, and the sequence is easier to apply than the feature list of either mechanism, because it asks about the code you already wrote rather than the types you might one day want.

## Related Notes

- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - what an interface value does at the call site
- [[cs/dsa/binary-tree|Binary Tree]] - the canonical case where the algorithm is genuinely independent of the element type
- [[cs/languages/CSharp/generic-collections-and-the-boxing-tax|Generic Collections and the Boxing Tax]] - the storage win, measured in another runtime
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - where reflection remains the only workable answer
- [[cs/languages/Go/generics-implementation-gc-shape-stenciling|Generics Implementation: GC Shape Stenciling]] - why the speed argument does not hold
- [[cs/languages/Go/interfaces-and-implicit-satisfaction|Interfaces and Implicit Satisfaction]] - why reaching for the interface option costs so little in Go

## Sources

- Ian Lance Taylor, "When To Use Generics," The Go Blog, 12 April 2022. https://go.dev/blog/when-generics . Supports the guideline about writing code rather than defining types, the container types and general purpose data structure cases, the reflection comparison, the efficiency and type-checking gains over interface-typed containers, unboxed storage in a generic tree, the preference for functions over methods for comparison, the identical-methods case, the advice against replacing interface types, the equal execution time claim, the differing-implementations rule, the reflection fallback in encoding/json, and the closing guideline.
- Ian Lance Taylor and Robert Griesemer, "Type Parameters Proposal," golang/proposal. https://raw.githubusercontent.com/golang/proposal/master/design/43651-type-parameters.md . Supports the design guarantee that values of generic types are not boxed and that instantiated generic struct fields are not boxed.
- The Go Programming Language FAQ. https://go.dev/doc/faq . Supports the description of the single implementation approach as similar to a function with an interface parameter.
