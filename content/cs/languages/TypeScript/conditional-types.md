---
title: "Conditional Types"
description: "A conditional type is not an if-statement. It is an assignability test that suspends itself whenever the answer depends on a type variable, and that suspension is what makes generic signatures composable."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-21
updated:
aliases:
  - TypeScript Conditional Types
  - extends Ternary
---

Before conditional types, a library that wanted its return type to depend on its argument type wrote overloads, and the handbook is direct about where that ends: "If a library has to make the same sort of choice over and over throughout its API, this becomes cumbersome," because "For every new type createLabel can handle, the number of overloads grows exponentially."

The replacement is one line.

```ts
type NameOrId<T extends number | string> = T extends number ? IdLabel : NameLabel;

function createLabel<T extends number | string>(idOrName: T): NameOrId<T> {
  throw "unimplemented";
}
```

Three overloads become zero. The syntax borrows from JavaScript deliberately: "Conditional types take a form that looks a little like conditional expressions ( condition ? trueExpression : falseExpression ) in JavaScript."

> [!note] The idea
> The resemblance to a ternary is misleading in the one way that matters. A conditional type frequently does not evaluate. When the condition mentions a type variable that has not been given an argument yet, the compiler suspends the whole expression and carries it around unevaluated, resuming only at instantiation. That is call-by-need at the type level, and it is not a convenience. Without deferral you could not write a generic function whose return type is computed from its own type parameter, because at the moment the signature is checked there is nothing to compute with. Every use of conditional types in a public API is standing on that laziness.

## The test is assignability

"A conditional type selects one of two possible types based on a condition expressed as a type relationship test," written `T extends U ? X : Y`. And the relationship is the ordinary one: "The type above means when T is assignable to U the type is X , otherwise the type is Y ." The handbook says the same thing in the branch vocabulary: "When the type on the left of the extends is assignable to the one on the right, then you'll get the type in the first branch (the 'true' branch); otherwise you'll get the type in the latter branch (the 'false' branch)."

The `extends` keyword is doing something different here from the `extends` in a class declaration and different again from the `extends` in a constraint. It is neither inheritance nor a bound. It is the structural compatibility check that decides ordinary assignments, run as a predicate and used to select a type.

## When it evaluates, and when it does not

The TypeScript 2.8 release notes give the resolution algorithm precisely, and it is worth reading rather than paraphrasing, because the whole semantics live here. "A conditional type T extends U ? X : Y is either resolved to X or Y , or deferred because the condition depends on one or more type variables."

The first step is a cheap negative check. Instantiate both sides with `any` in every type parameter position, and "if T' is not assignable to U' , the conditional type is resolved to Y . Intuitively, if the most permissive instantiation of T is not assignable to the most permissive instantiation of U , we know that no instantiation will be and we can just resolve to Y ."

The positive check is the mirror image, using a stricter relation. "if T'' is definitely assignable to U , the conditional type is resolved to X . The definitely assignable relation is the same as the regular assignable relation, except that type variable constraints are not considered. Intuitively, when a type is definitely assignable to another type, we know that it will be assignable for all instantiations of those types."

And when neither is decidable: "Otherwise, the condition depends on one or more type variables and the conditional type is deferred."

Notice what those two intuitions have in common. Both are asking whether the answer is the same for *every* instantiation. If yes, evaluate now. If no, wait. A conditional type is a function from types to types that refuses to commit on incomplete input.

## Why laziness is load-bearing

This is the same distinction that separates [[cs/pl/evaluation-order-and-strictness|strict from non-strict evaluation]] in ordinary languages, and it has the same consequence: a suspended computation can be passed around, stored in a signature, and forced later by someone who has the missing argument. Under strict evaluation the expression `NameOrId<T>` in a return position would have to produce a type immediately, and with `T` unbound the only honest answers are an error or a union of both branches. The union is what the pre-2.8 overload stack was approximating by hand, badly.

Deferral is why the checked declaration of `createLabel` and the resolved type at the call site can disagree without either being wrong. Inside the function body the return type is a suspended conditional. At `createLabel("typescript")` it resolves to `NameLabel`, and at `createLabel(2.8)` to `IdLabel`. The [[cs/pl/lambda-calculus-evaluation-strategies|order in which a redex gets reduced]] determines what is expressible, and the type level made the same choice a lazy language makes, for the same reason.

The closest thing in another mainstream language is C++, where [[cs/languages/Cpp/templates-and-generic-programming|template instantiation]] also delays the meaning of a dependent expression until arguments arrive, and where the same substitution-failure machinery is used to pick between alternatives. TypeScript reached the same place from the opposite direction: C++ got there because templates are code generation, TypeScript because types are erased and can be anything they like.

## The true branch knows more

A conditional does more than select. "Just like narrowing with type guards can give us a more specific type, the true branch of a conditional type will further constrain generics by the type we check against."

```ts
type MessageOf<T> = T extends { message: unknown } ? T["message"] : never;
```

Without the conditional, indexing `T["message"]` is an error. With it, "Within the true branch, TypeScript knows that T will have a message property." The 2.8 notes state the rule formally: "references to T within X have an additional type parameter constraint U ." So a conditional type is a constraint that applies locally, in one branch, rather than globally on the declaration. That is exactly the move the handbook describes as "moving the constraint out": the parameter itself stays unconstrained and accepts any type, and the narrow knowledge is confined to the branch that earned it.

Nested conditionals extend this into a dispatch table. "Conditional types can be nested to form a sequence of pattern matches that are evaluated in order," which is how `TypeName<T>` maps `string` to `"string"` and everything unmatched to `"object"`, and how [[cs/languages/TypeScript/infer-and-type-level-pattern-matching|the infer-based extractions]] peel one layer at a time.

> [!warning] Every call re-runs it
> An inline conditional return type is recomputed rather than cached. The performance wiki demonstrates it with a method whose return type is a three-way conditional and notes the fix: "If the return type in this example was extracted out to a type alias, more information can be cached by the compiler." The same wiki observes that "Type relationships between interfaces are also cached," which is the other half of the same advice. Naming a computed type is not a style preference in a large codebase. It is the difference between a cache hit and a re-derivation, per call site.

The remaining behavior worth knowing is what happens when the checked type is a bare type parameter and the argument is a union, which turns one evaluation into several. That is [[cs/languages/TypeScript/distributive-conditional-types|distribution]], and it is surprising often enough to deserve its own note.

## Related Notes

- [[cs/languages/TypeScript/distributive-conditional-types|Distributive Conditional Types]] - what happens when the input is a union and the check is a naked parameter
- [[cs/languages/TypeScript/infer-and-type-level-pattern-matching|infer and Type-Level Pattern Matching]] - binding a variable inside the condition itself
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order & Strictness]] - the general form of the deferral rule
- [[cs/pl/lambda-calculus-evaluation-strategies|Lambda Calculus: Evaluation Strategies]] - why the reduction order decides what can be expressed
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - dependent expressions deferred to instantiation in a compiled language
- [[cs/languages/TypeScript/type-level-computation-and-its-limits|Type-Level Computation and Its Limits]] - what the recursion budget costs once conditionals call themselves

## Sources

- TypeScript Handbook, "Conditional Types." https://www.typescriptlang.org/docs/handbook/2/conditional-types.html . Supports the overload growth argument, the resemblance to the JavaScript ternary, the true and false branch semantics, the MessageOf constraint example, and the statement that the true branch knows the checked property exists.
- TypeScript 2.8 release notes, "Conditional Types." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html . Supports the definition as a type relationship test, the assignability reading, the resolve-or-defer rule, the permissive any instantiation step, the definitely assignable step, the deferral condition, the added constraint inside the true branch, and nesting as an ordered sequence of pattern matches.
- TypeScript Wiki, "Performance." https://raw.githubusercontent.com/wiki/microsoft/TypeScript/Performance.md . Supports the caching benefit of extracting a conditional return type into a named alias and the caching of interface type relationships.
