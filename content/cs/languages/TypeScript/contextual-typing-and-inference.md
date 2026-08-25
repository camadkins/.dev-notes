---
title: "Contextual Typing and Inference"
description: "TypeScript infers in two directions at once: upward from the expressions you wrote, and downward from the place you wrote them. The downward pass is what makes untyped callbacks survive strict mode."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-08
updated:
aliases: []
---

Nothing in this snippet is annotated, and it still produces a precise error:

```ts
window.onmousedown = function (mouseEvent) {
  console.log(mouseEvent.button);
  console.log(mouseEvent.kangaroo);
  // Property 'kangaroo' does not exist on type 'MouseEvent'.
};
```

The parameter got a type from its surroundings. "Here, the TypeScript type checker used the type of the Window.onmousedown function to infer the type of the function expression on the right hand side of the assignment. When it did so, it was able to infer the type of the mouseEvent parameter, which does contain a button property, but not a kangaroo property."

> [!note] The idea
> TypeScript runs two inference passes with opposite polarity and lets them meet. The bottom-up pass reads the expressions you actually wrote and computes a best common type from those candidates. The top-down pass, contextual typing, reads the position an expression sits in and pushes the expected type inward. Neither is a fallback for the other, and the seam between them is documented: the contextual type is injected into the bottom-up pass as one more candidate. That design is what lets a codebase full of anonymous callbacks type-check under `noImplicitAny` without a single annotation on a callback parameter.

## Upward: best common type

The ordinary direction is the one every typed language has. "The type of the x variable is inferred to be number . This kind of inference takes place when initializing variables and members, setting parameter default values, and determining function return types."

The interesting part is what happens with several expressions at once. "When a type inference is made from several expressions, the types of those expressions are used to calculate a 'best common type'." For `let x = [0, 1, null]` the result is `(number | null)[]`, and the procedure is a search rather than a synthesis: "The best common type algorithm considers each candidate type, and picks the type that is compatible with all the other candidates."

The restriction in that sentence is the whole story. "Because the best common type has to be chosen from the provided candidate types, there are some cases where types share a common structure, but no one type is the super type of all candidate types." The canonical example is an array of three animal subclasses, which infers as `(Rhino | Elephant | Snake)[]` rather than `Animal[]`, because no `Animal` was ever written down. "When no best common type is found, the resulting inference is the union array type."

This is not how [[cs/pl/hindleymilner-type-inference|Hindley-Milner]] behaves. HM solves a global constraint set by unification and produces a principal type, inventing intermediate type variables as it goes. TypeScript searches a finite candidate list for a maximum under assignability, and if [[cs/math/relations-and-equivalence|the ordering]] has no maximum inside that list, it falls back to a union rather than climbing to a supertype nobody mentioned. Two different answers to the same problem, and the difference explains why TypeScript inference is fast and local while HM inference is global and occasionally surprising about where an error surfaces.

## Downward: contextual typing

"Type inference also works in 'the other direction' in some cases in TypeScript. This is known as 'contextual typing'. Contextual typing occurs when the type of an expression is implied by its location."

Location does a lot of work. "Contextual typing applies in many cases. Common cases include arguments to function calls, right hand sides of assignments, type assertions, members of object and array literals, and return statements." Assigning to `window.onscroll` instead of `window.onmousedown` changes the parameter type from `MouseEvent` to `Event` with no other edit, and the error moves accordingly.

The counterfactual is the reason the feature matters: "If this function were not in a contextually typed position, the function's argument would implicitly have type any , and no error would be issued (unless you are using the noImplicitAny option)." Contextual typing is the mechanism that makes `noImplicitAny` tolerable. Without it, every callback parameter in a JavaScript codebase would need an annotation, and the migration path that made TypeScript adoptable would not exist.

An explicit annotation wins over the context, which is both the escape hatch and the trap. "We can also explicitly give type information to the function's argument to override any contextual type." That is the documented escape hatch. Annotating the parameter `any` removes the error and does not remove the bug: the docs point out the code still logs `undefined`, because the property was never there.

## Where they meet

The two passes are not separate systems bolted together. "The contextual type also acts as a candidate type in best common type." Returning the same three animals from a function annotated `Animal[]` changes the result:

```ts
function createZoo(): Animal[] {
  return [new Rhino(), new Elephant(), new Snake()];
}
```

"In this example, best common type has a set of four candidates: Animal , Rhino , Elephant , and Snake . Of these, Animal can be chosen by the best common type algorithm." The annotation did not override inference. It contributed a fourth candidate that happened to dominate the other three.

That is the cleanest statement of the design. Contextual typing is not a special case for callbacks. It is a way of getting a type into the candidate pool from a place other than an expression.

> [!warning] Target typing is not the same feature
> [[cs/languages/Java/the-diamond-and-target-typing|Java's target typing]] answers a narrower question: given a poly expression such as a diamond instantiation or a lambda, what does the target type of the assignment context force it to be? It is specified case by case in the language spec, and it exists to make specific syntactic forms legal. Contextual typing here is broader and vaguer by comparison, a general propagation of an expected type into any expression that has a position, and it applies to ordinary object literals and array members that Java would never treat as poly expressions. The two solve overlapping problems and are not the same mechanism.

## The cost of relying on it

Inference is a compile-time expense, and the TypeScript performance wiki is direct about it. "Adding type annotations, especially return types, can save the compiler a lot of work. In part, this is because named types tend to be more compact than anonymous types (which the compiler might infer), which reduces the amount of time spent reading and writing declaration files."

The recommendation stops well short of annotating everything: "Type inference is very convenient, so there's no need to do this universally - however, it can be a useful thing to try if you've identified a slow section of your code." A giant inferred return type gets recomputed and re-serialized on every declaration emit, and a named annotation replaces that with a reference. The hint the wiki gives for spotting it is concrete: look for `import("./some/path").SomeType` or types in your emitted declarations that nobody wrote by hand.

Inference in this language is a convenience with a bill attached, and the bill mostly arrives at project boundaries. That is also where [[cs/languages/TypeScript/generic-constraints-and-defaults|a default type argument]] earns its place, since a default is what the algorithm reaches for when neither direction produced a candidate at all.

## Related Notes

- [[cs/languages/TypeScript/generic-constraints-and-defaults|Generic Constraints and Defaults]] - the last resort when inference finds no candidate
- [[cs/languages/TypeScript/generics-over-a-structural-type-system|Generics Over a Structural Type System]] - why the candidate comparison is a shape check
- [[cs/pl/hindleymilner-type-inference|Hindley-Milner & Type Inference]] - global unification producing a principal type, against a local candidate search
- [[cs/math/relations-and-equivalence|Relations and Equivalence]] - the ordering that "best common" is best with respect to
- [[cs/languages/Java/the-diamond-and-target-typing|The Diamond and Target Typing]] - a narrower, spec-enumerated version of the same downward pressure
- [[cs/languages/Go/type-inference-in-go|Type Inference in Go]] - a third design, with type inference confined to type arguments

## Sources

- TypeScript Handbook, "Type Inference." https://www.typescriptlang.org/docs/handbook/type-inference.html . Supports the onmousedown example and its explanation, where ordinary inference applies, the best common type algorithm and its candidate restriction, the union fallback, the definition and scope of contextual typing, the implicit any counterfactual, the annotation override, and the contextual type acting as a candidate in the createZoo example.
- TypeScript Wiki, "Performance." https://raw.githubusercontent.com/wiki/microsoft/TypeScript/Performance.md . Supports the claim that annotations save the compiler work, the compactness argument about named versus anonymous types, and the advice against annotating universally.
- TypeScript Handbook, "Type Compatibility." https://www.typescriptlang.org/docs/handbook/type-compatibility.html . Supports the structural assignability rule that the candidate comparison rests on.
