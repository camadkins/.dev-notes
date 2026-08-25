---
title: "comparable, Ordered, and the Constraint Library"
description: "One of these two constraints is a promise the compiler enforces, the other is a hand-maintained list, and the difference explains why only one of them is a keyword."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-04
updated:
aliases: []
---

`comparable` and `cmp.Ordered` look like siblings. Both are constraints, both name a family of types by a capability, and both appear in the same position in a type parameter list. They are not siblings. One is predeclared, defined by the specification, and denotes a set no user could write down. The other is a few lines of ordinary Go in the standard library, maintained by hand, with a comment admitting it will need editing when the language changes.

> [!note] The idea
> `comparable` does not mean "supports `==`". It means strictly comparable, which is the stronger claim that the compiler can prove the comparison will not panic. Interfaces support `==` and are not strictly comparable, because comparing two interfaces holding slices panics at run time. That gap forced Go 1.20 to split two ideas that had been identical since 1.18: implementing an interface and satisfying a constraint. `Ordered` needs none of this apparatus, because ordering is defined only on predeclared types, so its type set is finite and writable. The constraint you cannot write by hand is the one that had to become a keyword.

## What comparable denotes

The spec is exact: the "interface type comparable denotes the set of all non-interface types that are strictly comparable." The definition of that term lives with the comparison operators: "A type is strictly comparable if it is comparable and not an interface type nor composed of interface types."

Two clauses, and the second one is the whole story. Slice, map, and function types are not comparable at all. Interface types are comparable, in the sense that `==` compiles on them, but the comparison is decided at run time from the dynamic type, and "A comparison of two interface values with identical dynamic types causes a run-time panic if that type is not comparable." Griesemer states the design intent behind the distinction: "comparable contains only types that the compiler guarantees will not panic with ==. We call these types strictly comparable."

The failure this excludes is not hypothetical, and it is the same failure a map exhibits. Using a slice as a key in a `map[any]string` produces a "runtime error: hash of unhashable type" panic, which is exactly the [[cs/dsa/hash-tables|hash table]] refusing to hash a value whose type has no equality it can compute. `comparable` was designed so that a generic function could never trip that.

## Why the promise had to be weakened

The strong version broke ordinary code. `map[any]string` is legal Go, but before 1.20 the generic equivalent was not, because `any` did not implement `comparable`, and by the type set rules it never could: the spec notes that "Even though interfaces that are not type parameters are comparable, they are not strictly comparable and therefore they do not implement comparable."

The way out was structural rather than semantic. Rather than change what `comparable` means, Go 1.20 split a concept in two. As Griesemer describes it, "we differentiated between interface implementation, which is relevant for passing values to variables, and constraint satisfaction, which is relevant for passing type arguments to type parameters." The spec now carries the exception: "As an exception, a strictly comparable type constraint may also be satisfied by a comparable (not necessarily strictly comparable) type argument." So `any` satisfies `comparable` without implementing it, and the spec's own summary of the consequence is blunt: "Because of the exception in the constraint satisfaction rule, comparing operands of type parameter type may panic at run-time."

That sentence is a [[cs/pl/type-soundness-progress-preservation|soundness]] admission, and the blog does not soften it: "in Go 1.20, generic functions that rely on comparable are not statically type-safe anymore," and "A single non-comparable value may sneak its way through multiple generic functions or types by way of a single non-strictly comparable type argument and cause a panic." The verdict is one sentence long: "We have given up static type safety for a run-time check."

> [!tip] There is still a way to demand the strong version
> The exception has a hole in it, and the hole is useful. "type parameters do not benefit from the exception that we added to the constraint satisfaction rule." So a type parameter constrained by `any` still fails to satisfy `comparable`, and you can build a compile-time assertion out of that: pass the type you want to check as a constraint rather than as a type argument, and instantiate a `func isComparable[_ comparable]()` inside. Strict comparability then becomes a compile error rather than a run-time panic, which is what you want when the values are attacker-supplied or arrive from deserialization.

One more restriction keeps the whole scheme coherent: "The comparable interface and interfaces that (directly or indirectly) embed comparable may only be used as type constraints." It never becomes a variable type, so the run-time hazard stays confined to comparisons inside generic code.

## Ordered has no such powers

Compare all of that with what the standard library's `cmp` package actually contains. The package doc is one line: "Package cmp provides types and functions related to comparing ordered values." The constraint itself is a plain declaration:

```go
type Ordered interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr |
		~float32 | ~float64 |
		~string
}
```

Fourteen terms, every one of them a tilde over a predeclared type, assembled with the union and approximation elements from [[cs/languages/Go/constraint-interfaces-and-type-sets|the ordinary type set notation]]. There is no compiler assistance and no spec involvement. Its own doc comment is honest about the maintenance burden: "If future releases of Go add new ordered types, this constraint will be modified to include them." A keyword would not need that sentence.

The interesting content of `cmp` is not the constraint but the two functions wrapping it, and the reason they exist is floating point. The doc warns that floating-point types may contain NaN values, and the package's internal helper is a one-liner that reads as a joke until you think about it: `isNaN` reports "whether x is a NaN without requiring the math package," implemented as `x != x`, and the comment notes "This will always return false if T is not floating-point."

That single expression is why `cmp.Compare` exists. A NaN is a value for which equality is not reflexive, so IEEE 754 arithmetic breaks the [[cs/math/relations-and-equivalence|equivalence relation]] that sorting and searching assume. `cmp.Compare` restores a total order by defining NaN as less than everything and equal to itself, which is a policy choice made in library code, not a property of the `<` operator. `cmp.Or`, meanwhile, is declared over `comparable` rather than `Ordered`, since returning the first non-zero argument needs equality and nothing more.

## The dividing line

Put the two side by side and the rule for what becomes a keyword falls out. Ordering is defined on a closed list of predeclared types, so its constraint is expressible in the language and belongs in a package. Equality is defined on structs, arrays, and interfaces too, an open-ended family, so no union of type terms can describe it and the language must provide the name. The same reasoning explains why [[cs/languages/Java/the-equals-and-hashcode-contract|Java pushes equality onto a method]] instead: a method call is the other way to reach an operation whose type set you cannot enumerate.

## Related Notes

- [[cs/languages/Go/constraint-interfaces-and-type-sets|Constraint Interfaces and Type Sets]] - the union and tilde notation Ordered is built from
- [[cs/dsa/hash-tables|Hash Tables]] - why an unhashable key type is a run-time error and not a compile-time one
- [[cs/pl/type-soundness-progress-preservation|Type Soundness: Progress & Preservation]] - the guarantee the Go 1.20 exception deliberately relaxes
- [[cs/math/relations-and-equivalence|Relations and Equivalence]] - reflexivity, and the value that breaks it
- [[cs/languages/Java/the-equals-and-hashcode-contract|The equals and hashCode Contract]] - equality as a method contract rather than a language predicate
- [[cs/languages/CSharp/default-of-t-and-the-null-question|default(T) and the Null Question]] - another case where a generic body needs a guarantee about an unknown type

## Sources

- The Go Programming Language Specification. https://go.dev/ref/spec . Supports the definition of comparable as the set of all non-interface types that are strictly comparable, the definition of strictly comparable, the run-time panic on comparing interface values with a non-comparable dynamic type, that slices, maps and functions are not comparable, that interfaces satisfy but do not implement comparable, the Go 1.20 constraint satisfaction exception, the resulting possibility of a run-time panic, and the constraint-only restriction on comparable.
- Robert Griesemer, "All your comparable types," The Go Blog, 17 February 2023. https://go.dev/blog/comparable . Supports the strictly comparable framing, the hash of unhashable type panic, the separation of interface implementation from constraint satisfaction, the loss of static type safety, the way a single value can propagate a panic through generic code, and the fact that type parameters do not benefit from the exception.
- The cmp package source, Go standard library. https://raw.githubusercontent.com/golang/go/master/src/cmp/cmp.go . Supports the package description, that Ordered is an ordinary declared constraint permitting any ordered type, the commitment to modify it when Go adds ordered types, the NaN caveat, and the isNaN helper and its behaviour on non-floating-point types.
