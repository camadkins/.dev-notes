---
title: "Structural Typing and Assignability"
description: "Compatibility by shape, not by name, and the two relations underneath it: subtype for the theory, assignment for what the compiler actually does."
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

A class in TypeScript can satisfy an interface it has never heard of. "Type compatibility in TypeScript is based on structural subtyping. Structural typing is a way of relating types based solely on their members. This is in contrast with nominal typing." Declare an interface with a `name: string`, write an unrelated class with a `name: string`, and an instance of the class is assignable to the interface variable. "In nominally-typed languages like C# or Java, the equivalent code would be an error because the Dog class does not explicitly describe itself as being an implementer of the Pet interface."

That much is the famous part, and it is usually where explanations stop. The more useful fact is what sits under it.

> [!note] The idea
> "Compatible" is not one relation. "In TypeScript, there are two kinds of compatibility: subtype and assignment." Subtyping is the clean relation a type theorist would recognize; assignment is subtyping plus escape hatches, and assignment is the one the language runs on. Structural typing is what makes the shape check possible, but assignability is what decides whether your program compiles, and it was tuned against JavaScript that already existed rather than derived from a proof.

## The shape check itself

The rule is directional and it only inspects what the destination demands. To check whether a value fits a target type, the compiler walks each member the target requires and looks for a corresponding compatible member on the source. Extra members on the source are invisible to the check, which is why an object with a `name` and an `owner` passes where only `name` was asked for. "This comparison process proceeds recursively, exploring the type of each member and sub-member."

One carve-out spoils the "extra properties are always fine" story. "Object literals get special treatment and undergo excess property checking when assigning them to other variables, or passing them as arguments." Write `{ colour: "red", width: 100 }` directly into a call expecting a `SquareConfig` and the misspelled key is an error, because "TypeScript takes the stance that there's probably a bug in this code." The check is attached to the literal, not to the type: bind that same object to a variable first and pass the variable, and it goes through, as long as the variable and the target share at least one property.

Structural matching is not unique to TypeScript. [[cs/languages/Go/interfaces-and-implicit-satisfaction|Go satisfies interfaces implicitly]] on the same principle, and the theoretical machinery for both is the ordinary [[cs/pl/subtyping-variance-type-constraints|subtyping relation]]. What is unusual here is how far the structural idea is pushed: it reaches into generics, where "type parameters only affect the resulting type when consumed as part of the type of a member." An `Empty<T>` that never mentions `T` in a member makes `Empty<number>` and `Empty<string>` mutually assignable, because there is nothing in the shape to distinguish them. That is the direct consequence of [[cs/languages/TypeScript/generics-over-a-structural-type-system|generics living on top of a structural system]] rather than a nominal one.

## Why the check is deliberately leaky

TypeScript accepts programs it cannot prove safe, and says so up front. The design goals list "Apply a sound or "provably correct" type system" as an explicit non-goal, with the stated tradeoff being a balance between correctness and productivity. This is not an accident to be fixed later, so reading the type checker as a [[cs/pl/type-soundness-progress-preservation|soundness proof]] will mislead you about what a passing build means.

The clearest leak is in function parameters. "When comparing the types of function parameters, assignment succeeds if either the source parameter is assignable to the target parameter, or vice versa." That bidirectional rule is bivariance, and the handbook names the hazard plainly: "This is unsound because a caller might end up being given a function that takes a more specialized type, but invokes the function with a less specialized type." The motivating case is DOM-style event handling, where a handler typed for a mouse event is registered against a signature typed for a generic event. Rejecting that would have made a pattern that works fine in practice require a cast at every call site. The handbook points at the opt-out: "You can have TypeScript raise errors when this happens via the compiler flag" `strictFunctionTypes`.

Parameter arity leaks in the same direction. A function of one parameter is assignable where two are expected, because callbacks in JavaScript routinely ignore trailing arguments; `forEach` hands its callback the element, the index, and the array, and almost nobody wants all three.

## What nominal typing buys, and what this gives up

Names carry intent that shapes cannot. A `Meters` and a `Feet` that are both numeric, a `UserId` and an `OrderId` that are both strings, a validated string and an unvalidated one: nominally these are distinct types, and mixing them is a compile error. Structurally they are the same type, and nothing stops the swap. That is a real class of bug the type system declines to catch, and it lands hardest exactly where it hurts most, on identifiers and units and sanitized values crossing a trust boundary.

TypeScript does have two nominal-flavored features, and both come from the same place. Private and protected class members are compared by origin, not by shape: "When an instance of a class is checked for compatibility, if the target type contains a private member, then the source type must also contain a private member that originated from the same class." Enum members from different enum declarations are likewise incompatible with each other. Everything else is shape.

You can manufacture a nominal type out of structural parts, and the technique falls straight out of the rules above: intersect the base type with an object carrying a marker property whose type no other module can name, so that no independently written value can accidentally have the same shape. The fact that distinguishing a user ID from an order ID takes a trick is the price of the original choice.

> [!warning] The escape hatch is inside the relation
> The difference between the two compatibility relations is precisely `any`. Assignment "extends subtype compatibility with rules to allow assignment to and from any," so a single `any` in a chain makes both directions succeed without inspecting anything. That is not a hole in structural typing; it is a documented member of the assignability rules that the whole language uses.

The choice was made for a reason that still holds. "Because JavaScript widely uses anonymous objects like function expressions and object literals, it's much more natural to represent the kinds of relationships found in JavaScript libraries with a structural type system instead of a nominal one." TypeScript had to type code it did not write and could not change. A nominal system would have required every existing library to declare its allegiances, and no existing library was going to do that.

## Related Notes

- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - the general relation this note is one instance of, and where bivariance sits among the alternatives
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - what a type system is supposed to promise, against which the non-goal of soundness reads as a deliberate trade
- [[cs/languages/Go/interfaces-and-implicit-satisfaction|Interfaces and Implicit Satisfaction]] - the other mainstream structural system, arriving at a similar rule from a very different starting point
- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - a nominal system with runtime identity, the opposite end of every tradeoff here
- [[cs/languages/TypeScript/the-any-unknown-never-triangle|The any, unknown, never Triangle]] - the type that turns assignability off in both directions
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - why the unit and sanitization bugs that nominal typing catches are worth caring about

## Sources

- TypeScript Handbook, "Type Compatibility." https://www.typescriptlang.org/docs/handbook/type-compatibility.html . Supports structural subtyping as the basis of compatibility, the contrast with nominally typed languages, the recursive member-by-member comparison, the subtype versus assignment distinction and the role of `any` in it, parameter bivariance and its stated unsoundness, and the private and protected member origin rule.
- TypeScript Wiki, "TypeScript Design Goals." https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals . Supports the explicit non-goal of a sound or provably correct type system and the stated balance between correctness and productivity.
- TypeScript Handbook, "Object Types." https://www.typescriptlang.org/docs/handbook/2/objects.html . Supports excess property checking on object literals, the stated rationale, and the escape via assignment to an intermediate variable.
