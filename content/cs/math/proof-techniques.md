---
title: Proof Techniques
description: "Direct proof, contrapositive, contradiction, proof by cases, and counterexample: the standard toolkit for establishing a claim."
draft: false
comments: true
tags:
  - cs
  - math
  - discrete-math
date: 2026-05-27
updated:
aliases:
  - methods-of-proof
---

## Proving Versus Implementing

A working program is evidence, not proof. It shows the code did the right thing on [[cs/software-engineering/code-coverage-and-its-limits|the inputs you tried]]. A proof shows a claim holds for every case at once. A mathematical proof is "a deductive argument for a mathematical statement, showing that the stated assumptions logically guarantee the conclusion." The moment a course or a correctness argument asks *why* an algorithm works rather than *that* it ran, you need one of a small set of standard strategies.

> [!note]
> The payload: the shape of the statement selects the technique. An implication chooses between direct proof and contrapositive; a universal claim invites contradiction; a "for all cases" claim splits into cases; and a single well-chosen counterexample destroys a universal claim outright. Reading the logical form of what you must prove is most of the work.

## The Toolkit

| Technique | Best for | Move |
|-----------|----------|------|
| Direct proof | $p \to q$ with a clear forward path | Assume $p$, derive $q$ |
| Contrapositive | $p \to q$ where $\neg q$ is easier to work with | Prove $\neg q \to \neg p$ instead |
| Contradiction | Existence/impossibility, irrationality | Assume the negation, derive an absurdity |
| Proof by cases | Claims that split on a finite partition | Prove each case separately |
| Counterexample | Disproving a universal claim | Exhibit one instance that fails |

### Direct proof

The default. The conclusion "is established by logically combining the axioms, definitions, and earlier theorems." You assume the hypothesis and chain known facts forward until the conclusion drops out. Proving "if $n$ is even then $n^2$ is even" by writing $n = 2k$ and computing $n^2 = 2(2k^2)$ is a direct proof.

### Contrapositive

An implication and its contrapositive are logically equivalent, so proving one proves the other. This technique "infers the statement 'if p then q' by establishing the logically equivalent contrapositive statement: 'if not q then not p'." Reach for it when the negated conclusion gives you something concrete to manipulate. To show "if $n^2$ is even then $n$ is even," the direct route stalls, but the contrapositive "if $n$ is odd then $n^2$ is odd" is a one-line direct proof.

### Proof by contradiction

Also called reductio ad absurdum. You show that "if some statement is assumed true, a logical contradiction occurs, hence the statement must be false." Assume the opposite of what you want, follow the consequences, and [[cs/history/turing-and-computability|hit an impossibility]]. The archetype is the irrationality of $\sqrt{2}$: assume $\sqrt{2} = a/b$ in lowest terms, derive that $a$ and $b$ are both even, and that contradicts "lowest terms."

### Proof by cases

When the domain splits into finitely many situations, "the conclusion is established by dividing it into a finite number of cases and proving each one separately." Also called proof by exhaustion. The obligation is completeness: the cases must cover every possibility with no gap. A proof that $n(n+1)$ is always even splits on the parity of $n$, and the two cases together cover all integers.

### Counterexample

To disprove a universal claim you do not need a general argument, only one failure. A single instance can "construct a counterexample to disprove a proposition that all elements have a certain property." "Every [[cs/dsa/prime-numbers-algorithms|prime]] is odd" dies to $n = 2$. This is the constructive twin of quantifier negation: refuting $\forall x\, P(x)$ means producing an $x$ with $\neg P(x)$, so a counterexample is that witness made explicit.

> [!example]
> **One claim, two failed tools, one that works.** Prove: for integers, if $n^2$ is odd then $n$ is odd.
>
> *Direct* stalls: from $n^2 = 2k+1$ there is no clean handle on $n$.
>
> *Contradiction* works but is heavier: assume $n^2$ odd and $n$ even, write $n = 2m$, get $n^2 = 4m^2$ (even), contradiction.
>
> *Contrapositive* is cleanest: prove "if $n$ is even then $n^2$ is even," which is $n = 2m \Rightarrow n^2 = 2(2m^2)$. Done in one line. Picking the technique that matches the statement's shape saved the most work.

> [!tip]
> For statements about all natural numbers with a recursive or cumulative structure, none of these is the right first tool. That is the job of [[cs/math/mathematical-induction|induction]], which deserves its own treatment.

## Related Notes

- [[cs/math/mathematical-induction|Mathematical Induction]] - the technique for "for all n" statements over the naturals
- [[cs/math/propositional-logic|Propositional Logic]] - equivalences like contraposition come straight from truth tables
- [[cs/math/predicate-logic-and-quantifiers|Predicate Logic and Quantifiers]] - the quantifier shape of a claim tells you which proof to try
- [[cs/dsa/recursion|Recursion]] - correctness of recursive code is typically an inductive proof

## Sources

- [Mathematical proof (Wikipedia)](https://en.wikipedia.org/wiki/Mathematical_proof) - definitions of direct proof, contraposition, proof by exhaustion, and counterexample.
- [Proof by contradiction (Wikipedia)](https://en.wikipedia.org/wiki/Proof_by_contradiction) - the reductio structure and the square-root-of-two example.
