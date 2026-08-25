---
title: Boolean Algebra
description: "The algebra of two values: operations, the identity laws (De Morgan, distributivity), expression simplification, and the bridge to digital logic."
draft: false
comments: true
tags:
  - cs
  - math
  - discrete-math
date: 2026-03-28
updated:
aliases:
  - boolean-identities
  - de-morgans-laws
---

## Algebra With Only Two Numbers

Ordinary algebra manipulates symbols standing for numbers. Boolean algebra does the same thing over a domain of exactly two elements. In it, "the values of the variables are the truth values true and false, usually denoted by 1 and 0." The operations are three: "conjunction (and) denoted as $\land$, disjunction (or) denoted as $\lor$, and negation (not) denoted as $\lnot$." That is the entire alphabet. Everything a digital computer decides is written in it.

> [!note]
> The payload: Boolean algebra "is a formal way of describing logical operations in the same way that elementary algebra describes numerical operations." Because the structure is defined by its laws rather than its objects, the same algebra is being obeyed by logical propositions, by [[cs/math/set-theory-basics|set operations]], and by physical switches at once. Prove an identity in one and it holds in all three. Simplifying a Boolean expression and minimizing a circuit are literally the same act.

## The Operations and Their Laws

The three operations satisfy a fixed set of identities. The ones that do real work:

| Law | Form |
|-----|------|
| Commutativity | $x \land y = y \land x$, $\;x \lor y = y \lor x$ |
| Associativity | $(x \land y) \land z = x \land (y \land z)$ |
| Distributivity | $x \land (y \lor z) = (x \land y) \lor (x \land z)$ |
| Identity | $x \land 1 = x$, $\;x \lor 0 = x$ |
| Complement | $x \land \lnot x = 0$, $\;x \lor \lnot x = 1$ |
| Idempotence | $x \land x = x$, $\;x \lor x = x$ |
| Absorption | $x \land (x \lor y) = x$ |

Distributivity is where Boolean algebra departs from the numbers: in ordinary arithmetic $\land$ (as multiplication) distributes over $\lor$ (as addition), but the reverse fails. In Boolean algebra it holds both ways, so $\lor$ also distributes over $\land$.

## De Morgan's Laws

The single most used pair. Negation turns each operation into the other:

$$(\lnot x) \land (\lnot y) = \lnot(x \lor y) \qquad (\lnot x) \lor (\lnot y) = \lnot(x \land y)$$

Wikipedia states both forms in exactly this shape. They are the algebraic engine behind rewriting conditions in code: "not (a or b)" becomes "not a and not b," which is how a compiler or a careful programmer pushes negations inward and flattens branch logic. They also come straight out of the [[cs/math/propositional-logic|truth tables]], since Boolean algebra and propositional logic are the same laws under different names.

## Simplification

Minimizing an expression means applying these identities until no shorter equivalent remains. $x \lor (x \land y)$ collapses to $x$ by absorption. $x \land (\lnot x \lor y)$ reduces to $x \land y$. Each removed term is a gate not built, so simplification is not cosmetic: it sets the transistor count of the final circuit.

## The Bridge to Digital Logic

Boolean algebra "is used in digital electronics, and is provided for in all modern programming languages." That is not a coincidence of notation. [[cs/history/shannon-boolean-algebra-switching|Claude Shannon showed in 1937]] that the algebra of switches is exactly [[cs/history/boole-and-boolean-algebra|Boole's algebra of logic]]: a series connection is AND, a parallel connection is OR, and a normally-closed relay is NOT. Every logic gate is one Boolean operator in silicon, and a minimized Boolean expression is a minimized gate netlist.

> [!example]
> **Simplify $F = (x \land y) \lor (x \land \lnot y)$.**
> Factor $x$ out by distributivity: $F = x \land (y \lor \lnot y)$.
> By complement, $y \lor \lnot y = 1$, so $F = x \land 1 = x$.
> Two AND gates and an OR gate reduce to a bare wire carrying $x$. The truth table would have shown $F$ equals $x$ in all four rows; the algebra reaches the same conclusion without enumerating them.

## Related Notes

- [[cs/math/propositional-logic|Propositional Logic]] - the same two-valued algebra presented as connectives and truth tables
- [[cs/math/set-theory-basics|Set Theory Basics]] - union, intersection, and complement obey these identities one for one
- [[cs/history/boole-and-boolean-algebra|George Boole and the Algebra of Logic]] - the historical origin of the two-valued system
- [[cs/history/shannon-boolean-algebra-switching|Shannon's Switching Thesis]] - the proof that this algebra is the mathematics of circuits

## Sources

- [Boolean algebra (Wikipedia)](https://en.wikipedia.org/wiki/Boolean_algebra) - the two truth values, the three operations, De Morgan's laws, and the link to digital electronics and programming languages.
