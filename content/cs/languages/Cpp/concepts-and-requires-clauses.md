---
title: Concepts and requires Clauses
description: "The payoff of C++20 concepts is not that constraints are checked, it is that they are ordered: normalization, subsumption, and why two logically identical constraints written differently produce an ambiguous call."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-16
updated:
aliases:
  - Subsumption
  - requires Expression
  - Constraint Normalization
---

The usual pitch for concepts is the error message. That pitch is true and it undersells the feature badly. [[cs/languages/Cpp/templates-and-generic-programming|Named requirement sets and the four ways to spell a constraint]] cover the declaration side. This note is about what the compiler does with two constrained declarations when both of them match, because that is the part that replaced [[cs/languages/Cpp/sfinae-and-enable-if|`enable_if`]], the part that made tag dispatch unnecessary, and the part that will bite you.

> [!note] The idea
> Constraints are ordered, and the order is computed syntactically. cppreference states that before any further analysis, constraints are normalized by substituting the body of every named concept and every `requires` expression until what is left is a sequence of conjunctions and disjunctions on atomic constraints, and that a constraint P subsumes Q if P implies Q **up to the identity of atomic constraints**, with the parenthetical that types and expressions are not analyzed for equivalence, so `N > 0` does not subsume `N >= 0`. The compiler is not reasoning about what your requirements mean. It is comparing source-level atoms and running propositional logic over them. That is why writing your requirements inline instead of naming a concept silently destroys the ordering, and turns a call that should have picked the more specific overload into an ambiguity.

## What a requires expression is

cppreference describes a `requires` expression as yielding a prvalue expression of type `bool` that describes the constraints, and defines four kinds of requirement that may appear in it.

A **simple requirement** is an expression followed by a semicolon, asserting that the expression is valid, with the expression treated as an unevaluated operand. A **type requirement** is `typename` followed by a type name, asserting that the type is valid, which cppreference notes can verify that a named nested type exists or that a template specialization names a type, and does not require the type to be complete. A **compound requirement** wraps an expression in braces and may add `noexcept` and a return-type constraint, with a checking order cppreference spells out: substitute into the expression, then check that it is not potentially throwing if `noexcept` is present, then check that `decltype((expression))` satisfies the type constraint. A **nested requirement** is the keyword `requires` again, followed by a constraint expression, and cppreference states that substitution into a nested requirement causes substitution into the constraint expression only to the extent needed to determine whether it is satisfied.

Local parameters exist purely as notation. cppreference is blunt about it: the parameters introduced by a `requires` expression's parameter list have no linkage, storage, or lifetime, and are only used as notation for defining requirements. They may not have default arguments and the list may not end with an ellipsis.

The failure behavior is the whole reason the construct exists. Substitution into a `requires` expression may form invalid types or expressions, and cppreference states that in such cases the expression evaluates to `false` and does not cause the program to be ill-formed, with substitution and checking proceeding in lexical order and stopping when the result is determined. This is substitution failure promoted from an accident of overload resolution to a declared boolean.

Two guardrails come with it. If a substitution failure would occur for every possible template argument, cppreference states the program is ill-formed with no diagnostic required, giving `requires { new int[-(int)sizeof(T)]; }` as an example of a requirement invalid for every `T`. And if a `requires` expression containing invalid types or expressions does not appear within the declaration of a templated entity, the program is simply ill-formed. A constraint that can never be satisfied is a bug, not a very strict predicate.

The doubled keyword follows from all this. `requires Addable<T>` is a requires clause; `requires requires (T x) { x + x; }` is a requires clause whose constraint expression is an ad-hoc requires expression. cppreference labels the second one exactly that way, noting the keyword is used twice.

## Normalization and subsumption

The ordering machinery starts by flattening everything. cppreference states that atomic constraints are formed during constraint normalization, which transforms a constraint expression into a sequence of conjunctions and disjunctions of atomic constraints, and that user-defined overloads of `&&` or `||` have no effect on constraint normalization. Whatever `&&` means for your types, it means logical conjunction here.

Then the comparison, which is where [[cs/math/propositional-logic|propositional logic]] shows up in a compiler in the most literal possible way. cppreference gives the procedure: P is converted to disjunctive normal form and Q to conjunctive normal form, and P subsumes Q if and only if every disjunctive clause in P subsumes every conjunctive clause in Q, where a disjunctive clause subsumes a conjunctive clause when some atom in the first subsumes some atom in the second, and one atomic constraint subsumes another only if they are identical.

The resulting relation is a partial order on constraints, and cppreference lists five things it decides: the best viable candidate for a non-template function in overload resolution, the address of a non-template function in an overload set, the best match for a template template argument, partial ordering of class template specializations, and partial ordering of function templates. The vocabulary on top of it is that if D1's constraints subsume D2's, or D2 is unconstrained, then D1 is at least as constrained as D2, and if that holds in only one direction then D1 is more constrained. This is the same job that [[cs/pl/subtyping-variance-type-constraints|subtyping does for values]], applied one level up to the predicates on type parameters.

## The three examples that teach the whole feature

cppreference's worked set is short enough to reproduce and important enough to memorize.

```cpp
template<typename T> concept Decrementable = requires(T t) { --t; };
template<typename T> concept RevIterator   = Decrementable<T> && requires(T t) { *t; };

template<Decrementable T> void f(T);   // #1
template<RevIterator   T> void f(T);   // #2, more constrained than #1

f(0);          // int only satisfies Decrementable, selects #1
f((int*)0);    // int* satisfies both, selects #2 as more constrained
```

`RevIterator` subsumes `Decrementable` because its normal form literally contains `Decrementable`'s atom. Nothing was inferred; the atom is there because the concept body was pasted in during normalization.

The second example establishes that unconstrained is the bottom of the order. Given an unconstrained `g` and a `Decrementable`-constrained `g`, `g(true)` picks the unconstrained one because `bool` fails the constraint, and `g(0)` picks the constrained one because `int` satisfies it and it is more constrained.

The third is the one to keep on a card:

```cpp
template<typename T> concept RevIterator2 = requires(T t) { --t; *t; };

template<Decrementable T> void h(T);   // #5
template<RevIterator2   T> void h(T);  // #6

h((int*)0);    // ambiguous
```

`RevIterator2` requires exactly what `RevIterator` requires. Any human reading it would say it is strictly stronger than `Decrementable`. The compiler disagrees, because normalizing `RevIterator2` produces a single atomic constraint formed from *its own* `requires` expression, and normalizing `Decrementable` produces a different atom formed from a different source expression. Neither is identical to the other, so neither subsumes the other, and the call is ambiguous. The fix is not to add anything. It is to write the second concept in terms of the first, so the atom appears in both normal forms.

That is the operational rule the whole subsumption design implies: **name your concepts and build them out of each other**. A concept written as a self-contained bundle of requirements cannot be ordered against anything, which means it can be used to accept or reject a type but never to say "prefer me over the weaker overload." Inline `requires` clauses have the same problem for the same reason.

> [!warning] Subsumption does not understand arithmetic
> The parenthetical in cppreference's definition deserves its own alarm. Types and expressions are not analyzed for equivalence, and `N > 0` does not subsume `N >= 0`. Two constraints that a first-year algebra student would order correctly are, to the compiler, unrelated atoms. Every ordering you want must be expressed by sharing a named concept, never by writing a stronger predicate and hoping.

## Related Notes

- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - defining concepts, the four constraint spellings, and how an atomic constraint is satisfied
- [[cs/languages/Cpp/sfinae-and-enable-if|SFINAE and enable_if]] - the mechanism concepts replaced, and the exponential overload count they removed
- [[cs/languages/Cpp/type-traits-and-tag-dispatch|Type Traits and Tag Dispatch]] - the older way of ordering implementations, using an inheritance chain instead of subsumption
- [[cs/math/propositional-logic|Propositional Logic]] - the normal forms the compiler actually computes on your constraints
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - the same ordering question one level down, on values instead of predicates
- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds]] - bounds that are checked at the definition rather than ordered at the call

## Sources

- "Requires expression," cppreference.com. https://en.cppreference.com/w/cpp/language/requires.html . Supports the description of a `requires` expression as yielding a `bool` prvalue, the four requirement kinds with their meanings, the compound requirement checking order, the nested requirement substitution rule, local parameters having no linkage, storage, or lifetime and the restrictions on them, evaluation to `false` on substitution failure with lexical-order checking, the ill-formed-no-diagnostic-required rule for requirements invalid for every argument with the negative-array-size example, the rule for requires expressions outside templated entities, and the doubled-keyword ad-hoc constraint form.
- "Constraints and concepts," cppreference.com. https://en.cppreference.com/w/cpp/language/constraints.html . Supports constraint normalization by substituting concept and requires-expression bodies, atomic constraints being formed during normalization, user-defined `&&` and `||` overloads having no effect, the definition of subsumption up to the identity of atomic constraints with the `N > 0` remark, the disjunctive and conjunctive normal form procedure, the five uses of the resulting partial order, the at-least-as-constrained and more-constrained definitions, and the `Decrementable`, `RevIterator`, unconstrained `g`, and ambiguous `RevIterator2` examples.
