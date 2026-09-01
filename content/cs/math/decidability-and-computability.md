---
title: Decidability and Computability
description: "Decidable, semidecidable, neither. The three-way classification of yes-or-no questions, the reduction technique that places a problem in it, and Rice's theorem, which puts almost everything interesting in the third box."
draft: false
comments: true
tags:
  - cs
  - math
  - formal-methods
date: 2026-08-31
updated:
aliases: []
---

A decision problem is a computational problem that can be posed as a yes-or-no question on a set of input values. "Is $n$ prime?" is one. "Does program $P$ halt on input $I$?" is another. The two look like questions of the same kind, and computability theory is the discipline of noticing that they are not.

> [!note] The idea
> Yes-or-no questions sort into three classes, not two. A problem is **decidable** if some algorithm answers correctly on every input and always terminates. It is **semidecidable** if an algorithm halts with "yes" whenever the answer is yes and may run forever when the answer is no. And it may be neither. The middle class is the useful one, because it is where most of the questions people actually ask about programs live, and because it explains the shape of every real tool that has to answer them: a static analyzer, a termination checker, or a type checker cannot be both correct and complete, so it is built to fail in a chosen direction.

## The classification, stated as sets

Encode the inputs as natural numbers, via [[cs/math/set-theory-basics|a Gödel numbering]] or any other injection, and a decision problem becomes a subset $S \subseteq \mathbb{N}$: the set of inputs whose answer is yes. The three classes are then properties of that set.

$S$ is **computable** (equivalently *decidable* or *recursive*) if there is an algorithm that computes the membership of every natural number in a finite number of steps. Formally, there is a total computable $f$ with $f(x) = 1$ for $x \in S$ and $f(x) = 0$ for $x \notin S$; the set is computable if and only if its [[cs/math/functions-injective-surjective-bijective|indicator function]] is computable. The load-bearing word is *total*. The procedure must return on every input, including the ones where the answer is no.

$S$ is **computably enumerable** (c.e., also written recursively enumerable, and also called semidecidable, partially decidable, listable, or Turing-recognizable) if there is an algorithm whose set of halting inputs is exactly $S$. An equivalent formulation is the one the name is drawn from: there is an algorithm that enumerates the members of $S$, printing $s_1, s_2, s_3, \dots$, running forever if $S$ is infinite but producing every element after some finite time, in no particular order. The definition in contemporary texts is that $S$ is the *domain* of a partial computable function, meaning the function is defined exactly on the members of $S$.

Semidecidability is a genuinely one-sided guarantee. If a number is in the set, running the algorithm decides that; if it is not, the algorithm can run forever and no information is returned. You never get to distinguish "still running" from "will never stop".

The theorem that ties the classes together is short and does the most work:

> [!tip]
> A set $A$ is computable if and only if both $A$ and its complement are computably enumerable.

So decidability is exactly two-sided semidecidability. Run the two enumerators in parallel, and whichever halts first gives the answer. This immediately says something about halting: the set of halting program-input pairs is c.e., because you can just run the program, but its complement is not, because no finite amount of running establishes that a program never stops. One side is enumerable, the other is not, so the problem sits strictly in the middle class. That asymmetry, not the diagonal argument, is the shape worth carrying around. [[cs/history/turing-and-computability|The diagonal argument]] proves the negative half; the complement theorem explains what the negative half means.

## Most functions are not computable, and the reason is counting

Every computable function has a finite procedure giving explicit, unambiguous instructions on how to compute it, and that procedure has to be encoded in the finite alphabet used by the computational model. Finite strings over a finite alphabet form a countable set, so there are only countably many computable functions. The set of finitary functions on the natural numbers is uncountable, so most are not computable.

The result is stronger than any particular undecidability proof and is obtained without examining a single algorithm. It is [[cs/math/pigeonhole-principle|a counting argument]] of the same family as the pigeonhole principle: two sets, one strictly larger, therefore no surjection. Computability is the rare property, not the default, and the interesting work is showing that some *specific* natural question falls on the wrong side. Concrete inhabitants of the uncomputable side include the busy beaver function, Kolmogorov complexity, and any function that outputs the digits of a noncomputable number such as Chaitin's constant.

## Reduction is the working technique

Nobody proves a new problem undecidable from scratch. Decision problems can be ordered by many-one reducibility, and the argument runs: if I could decide problem $B$, I could use that decider to build one for a problem $A$ already known to be undecidable, therefore $B$ is undecidable too. The direction is the part people invert. You reduce the *known-hard* problem to the *new* one, not the reverse, because you are borrowing the new problem's hypothetical decider to solve the old one.

The same ordering is the backbone of complexity theory one floor up. A problem $P$ is complete for a class $S$ if $P$ is in $S$ and every problem in $S$ reduces to $P$; Boolean satisfiability is complete for NP under polynomial-time reducibility. Undecidability uses many-one reductions, [[cs/dsa/decision-search-and-optimization-problems|NP-completeness]] uses polynomial-time ones, and the argument is otherwise the same move: transport hardness along a mapping. Where computability theory classifies undecidable problems, it does so by Turing degree, a measure of the noncomputability inherent in any solution, so even the unanswerable questions are ranked.

## Rice's theorem, and why every analyzer is broken on purpose

The generalization is due to Henry Gordon Rice, in his 1951 doctoral dissertation at Syracuse University, and it is the result that turns undecidability from a curiosity into a design constraint.

> [!note] Rice's theorem
> All non-trivial semantic properties of programs are undecidable. A *semantic* property is one about the program's behavior, such as "does the program terminate for all inputs?", as opposed to a syntactic property such as "does the program contain an if-then-else statement?". A *non-trivial* property is one that is neither true for every program nor false for every program.

The scope is what makes it alarming. It is not that some clever behavioral questions are undecidable; it is that all of them are, save the two trivial ones. It is therefore impossible to write a program that automatically verifies the absence of bugs in other programs, taking a program and a specification as input and checking whether the program satisfies it. It is impossible to implement a tool that checks whether a given program is correct, or even executes without error.

Rice's theorem also names the four ways out, and every real system takes one of them.

**Overapproximate or underapproximate.** It is possible to implement a tool that always overestimates or always underestimates, so in practice one has to decide which is less of a problem. A checker that reports every real bug plus some non-bugs is sound and noisy; one that reports only real bugs and misses some is precise and incomplete. There is no third option, and arguing about false positives is arguing about which side of Rice's theorem to land on. The systematic version of catching many bugs without being complete is abstract interpretation.

**Move the question to syntax.** Rice's theorem constrains properties that depend only on semantics and not on syntax. A statically typed language prevents type errors, and this should be understood as a feature of the *syntax*, taken broadly, of those languages: type checking inspects source code and does not depend on the hypothetical semantics of the program. Rice's theorem implies that in dynamically typed Turing-complete languages it is impossible to verify the absence of type errors, and a [[cs/pl/type-systems-goals-guarantees|type system]] escapes not by being cleverer but by asking a decidable syntactic question that implies the semantic one.

**Require a proof.** One can require programs to be annotated with extra information proving them correct, and accept only programs verified that way. For type safety this is type annotations; taken further it is correctness proofs through proof annotations as in Hoare logic. Checking a proof is decidable even when finding one is not.

**Restrict the language.** Accept only programs written in a restricted form that makes verification possible. Total functional languages, primitive-recursive fragments, and terminating configuration languages all buy decidability by giving up Turing completeness.

> [!example] The same theorem, seen from a compiler
> [[cs/languages/TypeScript/type-level-computation-and-its-limits|TypeScript's type level is Turing complete]], which means deciding whether an arbitrary type finishes resolving is the halting problem wearing different clothes. The compiler's three options are exactly the ones above: refuse the expressive power, run forever on some inputs, or approximate.
>
> It approximates, with recursion depth caps and instantiation counters, and the "excessively deep and possibly infinite" error is the approximation firing. Read through Rice's theorem, that error message is not a limitation of the implementation. It is the only kind of answer available, and every release note about raising the depth limit is a negotiation over where to draw a line that provably cannot be drawn correctly.

## Related Notes

- [[cs/history/hilbert-godel-church-computability|Hilbert, Gödel, Church, and the Limits of Computation]] - the historical narrative these definitions were extracted from
- [[cs/history/turing-and-computability|Turing & Computability]] - the machine model, the diagonal proof of the halting problem, and the Church-Turing thesis
- [[cs/math/set-theory-basics|Set Theory Basics]] - countability, complements, and the encoding that turns a problem into a set
- [[cs/math/functions-injective-surjective-bijective|Functions: Injective, Surjective, Bijective]] - total versus partial, and the indicator function the definition rests on
- [[cs/math/pigeonhole-principle|Pigeonhole Principle]] - the same counting move that shows most functions are uncomputable
- [[cs/math/predicate-logic-and-quantifiers|Predicate Logic and Quantifiers]] - the language the Entscheidungsproblem was posed in
- [[cs/dsa/decision-search-and-optimization-problems|Decision, Search, and Optimization Problems]] - the same yes-or-no framing, one floor up in complexity theory
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - the syntactic question a type checker asks in place of the undecidable semantic one
- [[cs/languages/TypeScript/type-level-computation-and-its-limits|Type-Level Computation and Its Limits]] - one compiler paying Rice's bill in the form of a recursion budget

## Sources

- "Decision problem," Wikipedia. https://en.wikipedia.org/wiki/Decision_problem . Backs the definition of a decision problem as a computational problem posable as a yes-no question on a set of inputs, primality as an example, a decision procedure being an algorithmic method answering on all inputs with decidability defined as the existence of one, the formal-language and Gödel-numbering encodings making a decision problem a subset of the natural numbers whose decision procedure computes a characteristic function, the definitions of decidable as a recursive set and partially decidable/semidecidable as a recursively enumerable set, the halting problem as an important undecidable problem, recursion theory classifying undecidable problems by Turing degree as a measure of the noncomputability inherent in any solution, and many-one reducibility with complete problems and SAT's NP-completeness under polynomial-time reducibility.
- "Computably enumerable set," Wikipedia. https://en.wikipedia.org/wiki/Computably_enumerable_set . Backs the synonyms computably enumerable, recursively enumerable, semidecidable, partially decidable, listable, provable, and Turing-recognizable; the halting-set and enumeration definitions and their equivalence including the infinite case producing each element after finite time in no particular order; the explanation of why "semidecidable" is used, that membership can be decided by running the algorithm while non-membership may run forever returning no information; the contemporary definition as the domain of a partial computable function; and the theorem that a set is computable if and only if both it and its complement are computably enumerable.
- "Computable set," Wikipedia. https://en.wikipedia.org/wiki/Computable_set . Backs a set of naturals being computable (decidable, recursive) when an algorithm computes membership of every natural in finitely many steps, the total-computable-function definition returning 1 on members and 0 on non-members, and the equivalence with computability of the indicator function.
- "Computable function," Wikipedia. https://en.wikipedia.org/wiki/Computable_function . Backs every computable function having a finite procedure encoded in the model's finite alphabet and there being only countably many computable functions, the set of finitary functions on the naturals being uncountable so most are not computable, and busy beaver, Kolmogorov complexity, and functions outputting the digits of Chaitin's constant as concrete uncomputable examples.
- "Rice's theorem," Wikipedia. https://en.wikipedia.org/wiki/Rice%27s_theorem . Backs the statement that all non-trivial semantic properties of programs are undecidable with the definitions of semantic (behavior, such as termination on all inputs) versus syntactic (such as containing an if-then-else) and of non-trivial; the attribution to Henry Gordon Rice's 1951 doctoral dissertation at Syracuse University; the theorem generalizing the undecidability of the halting problem and bounding automatic static analysis; the impossibility of a tool checking correctness or error-free execution, or of automatically verifying absence of bugs against a specification; the availability of tools that always overestimate or always underestimate with the practical choice of which is less of a problem; abstract interpretation as the theory of catching many bugs without completeness; the impossibility of verifying absence of type errors in dynamically typed Turing-complete languages and static typing being understood as a feature of syntax broadly construed since type checking inspects source rather than hypothetical semantics; and the workarounds of proof annotations as in Hoare logic and of restricting programs to a form that makes verification possible.
