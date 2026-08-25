---
title: "Type Inference in Go"
description: "Two inference mechanisms, both built on unification, both deliberately weak, and a short list of places where you still have to write the type argument out."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-18
updated:
aliases: []
---

Generic code that requires you to spell out type arguments at every call site is generic code nobody uses. `Map[int, string](s, strconv.Itoa)` is worse than the duplicated helper it replaced. So every language with type parameters ships inference, and the design question is not whether to have it but how far to let it reach.

Go's answer is unusually explicit about wanting to stop early. The FAQ states the policy as a design goal rather than an implementation limit: "Type inference is intentionally limited to ensure that there is never any confusion as to which type is inferred."

> [!note] The idea
> Go infers by [[cs/pl/hindleymilner-type-inference|unification]], the same machinery a Hindley-Milner type system uses, and then refuses to use most of its power. Inference runs on a set of type equations solved by unification, but the equations are gathered only from the call site, never from what the caller does with the result. Two separate mechanisms exist because unification against arguments alone is not enough to recover a defined type like `MySlice` from a constraint like `~[]E`. The most useful thing to know is the failure mode the design chose: the compiler prefers to fail rather than guess, so an inference error is a request for one type argument, not a bug hunt.

## The machinery

The spec frames inference as equation solving. "Type inference solves type equations through type unification," and "Type unification recursively compares the LHS and RHS types of an equation," maintaining a map from bound type parameters to inferred arguments until every parameter has an entry. "Type inference succeeds if no unification step fails and the map has an entry for each type parameter."

The equations come from two places. Each pair of a function argument and its corresponding parameter yields one. And each type parameter contributes one from its own constraint: "Additionally, each type parameter and corresponding type constraint yields the type equation." That second family is where constraint inference lives, and having it in the same solver is why the two mechanisms compose without an ordering rule you have to memorize.

Untyped constants are held back. "Type inference gives precedence to type information obtained from typed operands before considering untyped constants. Therefore, inference proceeds in two phases." The first phase solves everything it can from typed arguments; only then are the constants assigned their default types. A call like `Scale(s, 2)` works because the `2` waits its turn.

## Function argument type inference

The everyday case. "This kind of inference, which infers the type arguments from the types of the arguments to the function, is called function argument type inference." Given `Map[F, T any](s []F, f func(F) T)` and a call passing a `[]int` and a `func(int) string`, unification matches `F` with `int` twice and `T` with `string`, and the call compiles as though you had written both arguments.

The limitation is worth memorizing, because it is a design rule you can build APIs around: "Function argument type inference only works for type parameters that are used in the function parameters, not for type parameters used only in function results or only in the function body." A function like `MakeT[T any]() T` can never have its type argument inferred, because nothing on the calling side mentions `T`. This is a constraint on [[cs/software-engineering/api-design|API shape]]. If you want a type parameter inferred, arrange for it to appear in an argument, even a zero-valued one, or accept that callers will write it out.

It also means Go does not reach into the assignment target of a call. Writing `var n int64 = Max(a, b)` gives inference nothing extra to work with, because the equations were gathered from the arguments and closed. Languages that do consult the target reach further and pay for it elsewhere, which is the contrast [[cs/languages/Java/generic-methods-and-type-inference|Java generic method inference]] draws out.

## Constraint type inference

The second mechanism exists to solve a specific problem: recovering a defined type. Write `Scale[E constraints.Integer](s []E, c E) []E`, call it with a `Point` whose underlying type is `[]int32`, and you get back a `[]int32`, not a `Point`, so the result has lost its methods. Rewriting the signature as `Scale[S ~[]E, E constraints.Integer](s S, c E) S` fixes the return type, at the price of a type parameter that appears nowhere useful for argument inference. The multiplication factor is a constant, and "because 2 is an untyped constant, function argument type inference cannot infer the correct type for E."

Constraint inference closes the gap. "The language supports another kind of type inference, constraint type inference." It "deduces type arguments from type parameter constraints," and "It is used when one type parameter has a constraint defined in terms of another type parameter. When the type argument of one of those type parameters is known, the constraint is used to infer the type argument of the other." Knowing `S` is `Point`, and knowing the constraint says `S` is `~[]E`, the solver reads `E` off the element type.

The approximation and union elements from [[cs/languages/Go/constraint-interfaces-and-type-sets|the type set notation]] are doing double duty here. They restrict the permitted arguments, and they also give the inference engine a structural equation to unify against. A constraint written as a bare `any` tells the solver nothing.

## What still needs writing out

Four contexts allow full omission, and the spec lists them: a generic function called with ordinary arguments, assigned to a variable of known type, passed as an argument to another function, or returned as a result. "In all other cases, a (possibly partial) type argument list must be present."

Partial lists work, with a shape rule. "A partial type argument list cannot be empty; at least the first argument must be present," and "The list is a prefix of the full list of type arguments, leaving the remaining arguments to be inferred." So you can supply the arguments that inference cannot reach only if they come first, which is a reason to order type parameters with the inferable ones last.

The blunt case is generic types. "For a generic type, all type arguments must always be provided explicitly." `var v Vector[int]` is required; there is no `var v Vector`. Inference applies to calls and to assignments of functions, not to type instantiation, which explains why generic container types feel more verbose in Go than generic functions do.

> [!warning] Failing to infer is the intended behaviour
> The FAQ acknowledges the frustration directly: "There are many cases where a programmer can easily see what the type argument for a generic type or function must be, but the language does not permit the compiler to infer it." The justification is empirical rather than theoretical: "Experience with other languages suggests that unexpected type inference can lead to considerable confusion when reading and debugging a program." The escape hatch is always available, since "It is always possible to specify the explicit type argument to be used in the call," and the door is left open, since "In the future new forms of inference may be supported, as long as the rules remain simple and clear." Weigh that against [[cs/languages/CSharp/generic-methods-and-inference-limits|the limits C# ran into]] by making a different call on the same tradeoff.

The practical posture the blog recommends is the right one: "type inference either succeeds or fails," and when it fails "the compiler will give an error message, and in those cases we can just provide the necessary type arguments." The team aimed to "err on the side of failing to infer a type rather than on the side of inferring the wrong type," which is the correct direction for a feature whose errors would otherwise appear far from their cause.

## Related Notes

- [[cs/pl/hindleymilner-type-inference|Hindley-Milner & Type Inference]] - the full-strength version of the unification Go restricts
- [[cs/languages/Java/generic-methods-and-type-inference|Generic Methods and Type Inference]] - target typing, the reach Go declined
- [[cs/languages/CSharp/generic-methods-and-inference-limits|Generic Methods and the Limits of Inference]] - a third language hitting the same wall from a different side
- [[cs/software-engineering/api-design|API Design]] - why a type parameter used only in results is a signature problem
- [[cs/languages/Go/constraint-interfaces-and-type-sets|Constraint Interfaces and Type Sets]] - the tilde form that gives constraint inference something to unify with
- [[cs/languages/Go/type-parameters-and-constraints|Type Parameters and Constraints]] - what instantiation does once the arguments are known

## Sources

- The Go Programming Language Specification. https://go.dev/ref/spec . Supports the framing of inference as solving type equations by unification, the map of bound type parameters, the success condition, the constraint-derived equation, the two-phase precedence of typed operands over untyped constants, the four omission contexts, the partial type argument list rules, and the requirement that generic types always take explicit type arguments.
- Robert Griesemer and Ian Lance Taylor, "An Introduction To Generics," The Go Blog, 22 March 2022. https://go.dev/blog/intro-generics . Supports the naming and scope of function argument type inference, the exclusion of type parameters used only in results or the body, the Scale example and the untyped constant problem, the definition and trigger for constraint type inference, and the succeed-or-fail posture including the preference for failing over inferring wrongly.
- The Go Programming Language FAQ. https://go.dev/doc/faq . Supports the intentional limitation of inference, the acknowledgement that obvious cases are sometimes rejected, the appeal to experience with other languages, the availability of explicit type arguments, and the openness to future forms of inference.
