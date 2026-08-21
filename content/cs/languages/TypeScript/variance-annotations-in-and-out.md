---
title: "Variance Annotations, in and out"
description: "TypeScript went a decade without declaration-site variance because a structural checker can derive it. The annotations added in 4.7 buy accuracy at circular types and speed at scale, not expressive power."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-05
updated:
aliases:
  - TypeScript Variance Annotations
  - in and out Modifiers
---

Every language with generics eventually has to answer whether `Box<Dog>` may stand in for `Box<Animal>`. C# and Java answered by making you say so at the declaration. TypeScript had generics for years and no way to say it at all, until version 4.7, whose implementing pull request landed in March 2022. When the answer arrived it was optional and, by its own designers' account, unnecessary.

That gap is the interesting part.

> [!note] The idea
> Declaration-site variance annotations exist to compensate for a checker that cannot see through a type to how a parameter is used. A structural checker can always see through, because relating two instantiations is just relating their expanded members. So TypeScript never needed `in` and `out`, and it had already been computing variance internally for years as a *speedup*, not as a correctness requirement. The 4.7 annotations are an assertion the compiler checks against the structure it can already read, plus a way to short-circuit a fixed-point computation that is exponentially expensive on circularly dependent types. They add no type you could not previously express.

## The derivation the compiler was already doing

The release notes set up the two shapes that define the question:

```ts
type Getter<T> = () => T;
type Setter<T> = (value: T) => void;
```

Deciding whether one `Getter` may replace another reduces to deciding the same question about `T`, and the release notes draw the conclusion: "Because each type for T just gets related in the same 'direction', we say that the Getter type is covariant on T ." For `Setter` the reduction runs backwards, and the notes reach for arithmetic to explain it: "That 'flip' in direction is kind of like how in math, checking whether" a negated value is smaller "is the same as checking whether" the original is larger. "When we have to flip directions like this to compare T , we say that Setter is contravariant on T ."

Then the admission. "Now technically speaking, in a purely structural type system, type parameters and their variance don't really matter - you can just plug in types in place of each type parameter and check whether each matching member is structurally compatible." Anders Hejlsberg says the same thing in the implementing pull request: "when generic type instantiations are related structurally , variance annotations serve no purpose. This is why TypeScript strictly doesn't need variance annotations."

That is the whole reason for the decade of silence. In a nominal system, `List<Dog>` and `List<Animal>` are two opaque names and the checker has no member-by-member comparison available, so the declaration has to carry the variance. Here [[cs/languages/TypeScript/generics-over-a-structural-type-system|the substitution has already happened]] by the time the comparison runs, and the answer falls out of comparing shapes. [[cs/pl/subtyping-variance-type-constraints|Variance as a concept]] still governs which assignments are safe. It just stopped needing to be declared.

## What the annotations actually do

Three things, in increasing order of interest.

The first is documentation. "One reason is that it can be useful for a reader to explicitly see how a type parameter is used at a glance. For much more complex types, it can be difficult to tell whether a type is meant to be read, written, or both."

The second is a checked assertion. Hejlsberg's PR gives the mapping directly: "An out annotation indicates that a type parameter is covariant. An in annotation indicates that a type parameter is contravariant. An in out annotation indicates that a type parameter is invariant." And the check is structural, so lying is caught:

```ts
type Foo<out T> = {
  x: T;
  f: (x: T) => void;
};
// Type 'Foo<sub-T>' is not assignable to type 'Foo<super-T>' as implied by variance annotation.
```

The mnemonic is the same one [[cs/languages/CSharp/variance-in-and-out|C# uses]], and for the same reason: "covariance restricts a type parameter to output (read) positions and contravariance restricts a type parameter to input (write) positions--hence the in and out modifiers."

The third is performance, and this is where the feature stops being cosmetic. "TypeScript already tries to infer the variance of type parameters as an optimization. By doing this, it can type-check larger structural types in a reasonable amount of time. Calculating variance ahead of time allows the type-checker to skip deeper comparisons and just compare type arguments which can be much faster than comparing the full structure of a type over and over again."

Read that carefully. Internal variance inference is not a semantic feature. It is a cache that lets the checker compare two type arguments instead of walking two entire structures. When an annotation is present, "the type checker doesn't need to measure variance," and measuring is the expensive half.

## Where the derivation gives a wrong answer

A cache with a bounded budget can be wrong, and the PR documents the case:

```ts
type Foo<T> = { x: T; f: Bar<T> };
type Bar<U> = (x: Baz<U[]>) => void;
type Baz<V> = { value: Foo<V[]> };

declare let foo1: Foo<unknown>;
declare let foo2: Foo<string>;
foo1 = foo2; // Should be an error but is not
```

"when measuring variance, TypeScript limits the structural search space in order to avoid runaway recursion." With that limit in place, "the compiler measures T to be covariant even though it is actually invariant due to variance reversal in Bar and the circular reference in Baz ." The honest reason the compiler does not simply try harder is stated too: "The compiler could establish that by continuing to structurally relating nested circular references until some fixed point, but this gets exponentially expensive and isn't feasible in complex scenarios."

So the annotation is not only a hint. On a circular type it is the difference between an accepted unsound assignment and a reported error. "Adding an in out annotation to T establishes the correct variance and produces the expected errors."

> [!warning] Invariance is asserted, never verified
> "Invariance annotations ( in out T ) are never checked but simply assumed to hold. Thus, it is possible to assert invariance even when the actual usage of a type parameter is co- or contravariant." That is a deliberate hole. Marking a parameter invariant tells the checker to stop measuring and believe you, which is exactly why it is the cheapest annotation and exactly why it can encode a claim the structure does not support. The release notes make the same point about strictness generally: TypeScript "won't stop you from marking something as invariant if it's really just covariant, contravariant, or even independent." An unchecked assumption inside a checker is a small breach in [[cs/pl/type-soundness-progress-preservation|the soundness argument]], and it is a familiar shape in this language, alongside the bivariance of function parameters that no annotation reaches.

The guidance that closes the release note is unusually restrained for a feature announcement. "We don't necessarily recommend annotating every type parameter with its variance." The intended audience is narrow: "if you're working with deeply recursive types, especially if you're a library author, you may be interested in using these annotations to the benefit of your users." And the way to find out whether it is worth doing is measurement rather than taste, since "Determining when variance calculation is a bottleneck on type-checking time can be done experimentally."

TypeScript got to defer the whole question because structure is visible, and when it finally answered, the answer was a tuning knob. A nominal checker has no such option: with the members hidden behind a name, the variance has to be declared or assumed at language-design time, which is the pressure behind [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Java's split verdict on arrays and generics]].

## Related Notes

- [[cs/languages/TypeScript/generics-over-a-structural-type-system|Generics Over a Structural Type System]] - why substitution-then-compare makes the annotation redundant
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - what covariance and contravariance mean independent of any language
- [[cs/languages/CSharp/variance-in-and-out|Variance in and out]] - the same two keywords in a nominal system, where they are load-bearing
- [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Covariant Arrays vs Invariant Generics]] - what happens when a language guesses wrong and cannot take it back
- [[cs/pl/type-soundness-progress-preservation|Type Soundness: Progress & Preservation]] - the property an unchecked invariance assertion is spending
- [[cs/languages/TypeScript/type-level-computation-and-its-limits|Type-Level Computation and Its Limits]] - the same budget problem, one layer up

## Sources

- TypeScript 4.7 release notes, "Optional Variance Annotations for Type Parameters." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html . Supports the Getter and Setter derivation, the negation analogy, the statement that variance does not matter in a purely structural system, the readability motivation, the internal variance inference as an optimization, the circularity caveat, the advice against annotating everything, the permission to over-constrain, and the experimental guidance.
- Anders Hejlsberg, "variance annotations," microsoft/TypeScript pull request 48240. https://github.com/microsoft/TypeScript/pull/48240 . Supports the meaning of out, in, and in out, the claim that annotations serve no purpose under structural relation, the checked-assertion error on a mismarked parameter, the input and output position mnemonic, the unchecked nature of invariance annotations, the bounded structural search space, the Foo, Bar, and Baz circular example, and the fixed-point cost argument.
- TypeScript Handbook, "Type Compatibility." https://www.typescriptlang.org/docs/handbook/type-compatibility.html . Supports the bivariance of function parameters that sits alongside these annotations.
