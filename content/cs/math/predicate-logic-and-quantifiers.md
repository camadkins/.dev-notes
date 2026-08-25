---
title: Predicate Logic and Quantifiers
description: "Predicates, universal and existential quantifiers, negation rules, and why nested quantifier order changes the claim."
draft: false
comments: true
tags:
  - cs
  - math
  - discrete-math
  - formal-methods
date: 2026-04-03
updated:
aliases:
  - first-order-logic
  - quantifiers
---

## Where Propositions Run Out

[[cs/math/propositional-logic|Propositional logic]] cannot say "every integer has a successor" or "some key hashes to slot 3." It only knows whole propositions, true or false, with no way to reach inside them and talk about the objects. Predicate logic adds that reach. It introduces predicates over a domain and quantifiers that range across it, which is exactly the expressiveness a [[cs/standards/ieee-29148-requirements-engineering|formal specification]] needs.

A predicate is a symbol that "represents a property or a relation." Applied to arguments it becomes a proposition: `Prime(7)` is true, `Prime(8)` is false. Written with a free variable, `Prime(x)` is an open formula with no truth value until you either substitute a specific value or bind the variable with a quantifier.

> [!note]
> The payload is that quantifiers turn open formulas into claims about a whole domain, and with nested quantifiers the order is the meaning. Swapping $\forall x \exists y$ for $\exists y \forall x$ is not a stylistic choice; it changes the specification. This is the single most common place a "correct-sounding" requirement is actually wrong.

## The Two Quantifiers

A quantifier, per Wikipedia, is "an operator that specifies how many individuals in the domain of discourse satisfy an open formula." Two of them dominate:

- **Universal**, $\forall x\, P(x)$: the universal quantifier "expresses that everything in the domain satisfies the property denoted by P." Read it "for all $x$, $P(x)$."
- **Existential**, $\exists x\, P(x)$: the existential quantifier "expresses that there exists something in the domain which satisfies that property." Read it "there exists an $x$ such that $P(x)$."

Every quantified statement is relative to a **domain of discourse**. "$\forall x\, (x > 0)$" is false over the integers and true over the positive reals. The domain is not decoration; leave it unstated and the claim is ill-defined.

## Negating a Quantifier

Pushing a negation through a quantifier flips it. Formally, $\neg(\forall x\, P(x)) \equiv \exists x\, \neg P(x)$: the negation of "everything satisfies $P$" is "something fails $P$." Symmetrically, $\neg(\exists x\, P(x)) \equiv \forall x\, \neg P(x)$.

This is the daily-use rule. To refute "all swans are white" you exhibit one non-white swan, which is the existential negation made concrete, and the same move as [[cs/math/proof-techniques|disproof by counterexample]]. In testing, the negation of a "for all inputs" postcondition is [[cs/security/fuzzing|a single failing input]], which is what a bug report is.

## Nested Quantifiers and Order

Stacking quantifiers is where predicate logic earns its keep and where mistakes hide. Compare two statements over a domain of people:

- $\forall x\, \exists y\, \text{Loves}(x, y)$: everyone loves someone (the someone may differ per person).
- $\exists y\, \forall x\, \text{Loves}(x, y)$: there is one specific person whom everyone loves.

Same predicate, quantifiers reordered, and the second is a far stronger claim that implies the first but not conversely. The rule of thumb: a later quantifier's variable may depend on an earlier one, so $\exists y$ coming after $\forall x$ allows $y$ to be chosen per $x$, while $\exists y$ first fixes one $y$ up front.

> [!example]
> **The definition of a limit is a nested-quantifier spec.** "$\lim_{x\to a} f(x) = L$" unfolds to
> $$\forall \varepsilon > 0\; \exists \delta > 0\; \forall x\; (0 < |x - a| < \delta \to |f(x) - L| < \varepsilon).$$
> Read the dependency order: given any tolerance $\varepsilon$, you must produce a $\delta$ (which may depend on $\varepsilon$), and then it must work for all $x$ within $\delta$. Swap the first two quantifiers and you would be demanding a single $\delta$ good for every $\varepsilon$ at once, which is a different and usually false statement.

> [!warning]
> When a requirement mixes "every" and "some," write it with explicit quantifiers before writing code. "Every order can be assigned to a courier" ($\forall\, \exists$) and "some courier can take every order" ($\exists\, \forall$) sound alike in English and describe different systems. The quantifier order is the requirement.

## Related Notes

- [[cs/math/propositional-logic|Propositional Logic]] - the connective layer that predicate logic sits on top of
- [[cs/math/proof-techniques|Proof Techniques]] - proofs of quantified statements pick strategy by quantifier shape
- [[cs/math/mathematical-induction|Mathematical Induction]] - the standard method for proving $\forall n$ statements over the naturals
- [[cs/dsa/constraint-satisfaction-problems|Constraint Satisfaction Problems]] - solving for variable assignments that satisfy quantified constraints

## Sources

- [Quantifier (logic) (Wikipedia)](https://en.wikipedia.org/wiki/Quantifier_%28logic%29) - definitions of the universal and existential quantifiers and the quantifier negation rule.
- [Predicate (mathematical logic) (Wikipedia)](https://en.wikipedia.org/wiki/Predicate_%28mathematical_logic%29) - a predicate as a symbol representing a property or relation that yields a truth value.
