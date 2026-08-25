---
title: "Type Parameters and Constraints"
description: "A type parameter list is an ordinary parameter list moved one level up, and most of its visible syntax was forced by a parser requirement rather than chosen for looks."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-24
updated:
aliases: []
---

The smallest generic function in Go is three characters longer than the non-generic one it replaces:

```go
func Print[T any](s []T) {
	for _, v := range s {
		fmt.Println(v)
	}
}
```

Everything about that signature follows from one analogy the design document states outright. A type parameter list is a parameter list. It sits in the same place, it declares names the same way, and every entry in it has a type. The only difference is that the entries are types and their types are constraints.

> [!note] The idea
> Go's generic syntax reads like a series of aesthetic choices and is almost entirely a series of forced moves. The list goes before the value parameters because it is read first. The names are mandatory because optional names would be ambiguous. Constraints are interface types because Go already had a construct for "the set of things you may pass here." And the square brackets, the one choice everyone notices, exist because angle brackets would make Go unparseable without type information, which the team treats as non-negotiable. The syntax is a fossil record of the parser.

## The list is a parameter list

The spec's grammar is one line: `TypeParameters = "[" TypeParamList [ "," ] "]"`. Around it, the prose sets up the analogy: "The type parameter list looks like an ordinary function parameter list except that the type parameter names must all be present and the list is enclosed in square brackets rather than parentheses."

Two departures from ordinary parameters, then, and both are deliberate. The design document explains the placement, "This type parameter list appears before the regular parameters," and the mandatory names: "Unlike regular parameter lists, in type parameter lists names are required for the type parameters. This avoids a syntactic ambiguity, and, as it happens, there is no reason to ever omit the type parameter names." You never write `func F(int)` at the type level because there is nothing you could do with an unnamed type.

The analogy runs deeper than syntax. "Just as each ordinary function parameter has a parameter type, each type parameter has a corresponding (meta-)type which is called its type constraint." That is the entire conceptual content of constraints, and the design document lands the same point from the other direction: "Therefore, in this design, constraints are simply interface types." The rule they enforce is symmetric, binding the caller and the callee at once, so that "generic code can only use operations that its type arguments are known to implement." A constraint is not documentation and it is not a hint. It is the type of a type, and like [[cs/languages/Java/bounded-type-parameters|a bound in Java]] it limits both what may be passed in and what the body may do.

What a type parameter denotes inside the declaration is worth stating precisely, because it explains several confusing error messages. "Each name declares a type parameter, which is a new and different named type that acts as a placeholder for an (as of yet) unknown type in the declaration." It is a real named type in that scope, not a macro variable, which is why [[cs/pl/scoping-binding-and-closures|ordinary binding rules]] apply to it and why naming a type parameter `string` shadows the predeclared `string` for the whole declaration.

## Why square brackets

Java and C++ use angle brackets. Go cannot, and the FAQ's explanation is a small masterpiece of language design reasoning. Consider `a, b = w < x, y > (z)`. Without type information, the right hand side is either a pair of comparisons or a generic instantiation followed by a call, and there is no way to tell. Since Go resolves this at parse time, the answer must be structural. The FAQ states the principle: "It is a key design decision of Go that parsing be possible without type information, which seems impossible when using angle brackets for generics."

This is the same class of problem as any other [[cs/pl/grammar-ambiguity-parse-trees|grammatical ambiguity]], and the same class of fix: change the tokens so the two readings cannot collide. The FAQ adds the reassurance that the choice is not eccentric: "Go is not unique or original in using square brackets; there are other languages such as Scala that also use square brackets for generic code."

Brackets do not eliminate ambiguity everywhere. The spec documents a residual case where a single type parameter and its constraint parse as an array length: `type T[P *C] …` is read as an array type declaration, because `P *C` is a valid expression. "In these rare cases, the type parameter list is indistinguishable from an expression and the type declaration is parsed as an array type declaration." The fix is to write `type T[P interface{*C}]` or to add a trailing comma. That is one wart, disclosed in the spec, against an entire class of ambiguity avoided.

## Where they may appear

Functions and types. That is the whole list in the Go 1.18 design. `func F[T any](...)` and `type Vector[T any] []T` are the two forms, and generic types may have methods that use the type's parameters.

Methods are the interesting boundary. A method on a generic type declares the receiver's parameters again, without constraints, so that the body can name them: "Type parameters may also be declared by the receiver specification of a method declaration associated with a generic type." The receiver "must declare the same number of type parameters as are declared in the receiver type" definition. What the original design forbade was adding new ones: "methods may not themselves have additional type parameters." The reason is not syntactic, and it is the most interesting refusal in the whole proposal, treated at length in [[cs/languages/Go/what-generics-deliberately-left-out|what generics deliberately left out]].

> [!warning] This boundary moved
> The rule held for nine releases and then changed. The current spec records that if a method declaration specifies its own type parameters, "the method name denotes a generic method", and tags that sentence as a Go 1.27 addition. The spec now opens the same paragraph by saying a type parameter list declares the parameters of "a generic function, method, or type declaration." Code written against the older rule is unaffected, but "only functions and types can have type parameters" is now a statement about Go 1.18 through 1.26 rather than about Go, and the restriction that made the change possible is worth reading in the note on the omissions.

## Instantiation

Using a generic declaration means supplying type arguments, and the spec breaks that into two steps that are worth keeping separate in your head. First, "Each type argument is substituted for its corresponding type parameter in the generic declaration," across the entire declaration including the type parameter list itself. Second, each substituted argument must satisfy its constraint, and instantiation fails otherwise.

The order matters for reading error messages: substitution happens first, so a constraint written in terms of another type parameter has already been specialized by the time it is checked. And the result of a successful instantiation is unremarkable, which is the point. "Instantiating a generic type, function, or method results in a non-generic type, function, or method, respectively." After instantiation there is nothing generic left, and the rest of the compiler treats it like any other declaration. What the constraint may say about the set of permitted arguments is the subject of [[cs/languages/Go/constraint-interfaces-and-type-sets|constraint interfaces and type sets]].

## Related Notes

- [[cs/languages/Go/constraint-interfaces-and-type-sets|Constraint Interfaces and Type Sets]] - what can go on the right of a type parameter name
- [[cs/pl/grammar-ambiguity-parse-trees|Grammar Ambiguity & Parse Trees]] - the parsing problem that dictated square brackets
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - why a type parameter shadows a predeclared name like any other binding
- [[cs/languages/Java/bounded-type-parameters|Bounded Type Parameters]] - the same two-sided contract, spelled with extends
- [[cs/languages/CSharp/constraints-on-type-parameters|Constraints on Type Parameters]] - a clause-based constraint language, for contrast with an interface-based one
- [[cs/languages/Go/what-generics-deliberately-left-out|What Generics Deliberately Left Out]] - why methods could not add parameters of their own

## Sources

- The Go Programming Language Specification. https://go.dev/ref/spec . Supports the type parameter list grammar and its comparison to an ordinary parameter list, that a type parameter is a new and different named type acting as a placeholder, the meta-type framing of constraints, the receiver specification rule, the array type parsing ambiguity, the two steps of instantiation, and the Go 1.27 generic method rule.
- Ian Lance Taylor and Robert Griesemer, "Type Parameters Proposal," golang/proposal. https://raw.githubusercontent.com/golang/proposal/master/design/43651-type-parameters.md . Supports the placement of the list before the regular parameters, the required names and the ambiguity they avoid, that constraints are simply interface types, the rule that generic code may only use operations its type arguments implement, and the prohibition on additional method type parameters.
- The Go Programming Language FAQ. https://go.dev/doc/faq . Supports the parse-without-type-information design decision behind square brackets and the note that Scala uses square brackets too.
