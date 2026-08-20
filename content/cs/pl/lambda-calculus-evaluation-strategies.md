---
title: "Lambda Calculus: Evaluation Strategies"
description: Call-by-value, call-by-name, normal-order, and call-by-need; how strategy shapes reduction, termination, and language semantics.
draft: false
tags:
  - cs
  - pl
date: 2025-10-24
updated:
aliases: []
---

## Overview
Lambda calculus defines *what* it means to compute, but **evaluation strategy** defines *how* that computation proceeds.  
Even in a purely functional setting, the choice of which subexpression to reduce first (the **redex selection strategy**) can drastically affect termination, efficiency, and observable outcomes.

Languages like **Scheme**, **Haskell**, and **OCaml** differ primarily in their evaluation order and reduction model.  
Understanding these strategies bridges theoretical lambda calculus and practical implementation.

> [!note]
> All strategies obey the same substitution rules; they differ only in *where* those rules are applied first.

---

## Redex and Reduction Order
A **redex** (reducible expression) is a term of the form:
```

(λx. M) N

```
which can β-reduce to `M[x := N]`.

Evaluation strategy determines *which* redex to contract first when multiple are present.

Example:
```

(λx. x) ((λy. y) z)

```
Possible orders:
- Reduce inner `((λy. y) z)` first → **call-by-value**
- Reduce outer `(λx. x)` first → **call-by-name / normal-order**

---

## Core Strategies

### 1. Call-by-Value (CBV)
Evaluate **arguments first**, then apply the function.

```

(λx. M) N  
→ N → N'  
→ (λx. M) N'  
→ M[x := N']

```

CBV matches the behavior of **eager** languages such as OCaml, Python, Java, and C.

#### Example
Let Ω ≡ (λx. x x) (λx. x x).  
Then:
```

(λx. 1) Ω  
→ tries to evaluate Ω first  
→ diverges

```

> [!tip]
> CBV avoids duplication of computation but risks evaluating arguments that might never be used.

---

### 2. Call-by-Name (CBN)
Evaluate **the function first**, substituting arguments unevaluated.

```

(λx. M) N → M[x := N]

```

Each time `x` is used, `N` is re-evaluated.  
This strategy corresponds to **lazy substitution without memoization**.

#### Example
```

(λx. 1) Ω  
→ 1

```
The argument `Ω` is never evaluated, only substituted (but unused).

> [!note]
> CBN is **non-strict**: it only evaluates what’s necessary to produce a result.

---

### 3. Normal-Order
A formal generalization of CBN: **reduce the leftmost, outermost redex first**, regardless of whether it’s under a lambda abstraction.

This is the canonical reduction order in theoretical λ-calculus because it guarantees:
> If a normal form exists, **normal-order** will find it.

Example:
```

(λx. (λy. y) x) ((λz. z z) (λz. z z))  
→ (λy. y) ((λz. z z) (λz. z z))  
→ (λz. z z) (λz. z z)  
→ diverges

```
but for `(λx. 1) Ω`, normal order stops immediately:
```

(λx. 1) Ω → 1

```

> [!tip]
> Normal-order = "evaluate the outermost redex first." It is the most *complete* evaluation strategy.

---

### 4. Call-by-Need
An optimization of CBN that **shares** evaluated results.

When an argument is first used, it is evaluated and then *memoized* for subsequent uses, avoiding redundant work.

#### Example
```

(λx. x + x) (3 + 4)

```
- **CBN:** recomputes `3 + 4` twice.
- **CBNeed:** evaluates once and reuses the result.

Languages like **Haskell** implement call-by-need through **graph reduction**, where expressions are stored as *thunks*: suspended computations updated with their results upon first evaluation.

> [!note]
> Call-by-need = laziness with caching.  
> It preserves the same semantics as CBN but improves efficiency.

---

## Comparative Example

Let:
```

Ω = (λx. x x) (λx. x x)  
E = (λx. 1) Ω

```

| Strategy | Behavior | Terminates? | Notes |
|-----------|-----------|-------------|-------|
| CBV | Tries to evaluate Ω first | ❌ Diverges | Eager, unsafe for nontermination |
| CBN | Skips evaluating Ω | ✅ 1 | Lazy but may recompute |
| Normal | Same as CBN for this case | ✅ 1 | Finds normal form if one exists |
| Call-by-Need | Skips and memoizes | ✅ 1 | Like CBN but efficient |

---

## Example: Duplicated Argument
Consider:
```

(λx. x + x) (2 * 3)

```

| Strategy | Reduction | Result | Notes |
|-----------|------------|--------|-------|
| CBV | Evaluate `2 * 3` first | 12 | Efficient if used multiple times |
| CBN | Substitute `(2 * 3)` twice | 12 | Recomputes expression |
| Need | Evaluate `(2 * 3)` once, reuse | 12 | Balanced approach |

---

## Relation to Language Design

| Strategy | Typical Languages | Evaluation Model |
|-----------|-------------------|------------------|
| CBV | OCaml, Scheme, Python, Java | Strict / Eager |
| CBN | Theoretical λ-calculus | Non-strict, substitution-based |
| Call-by-Need | Haskell | Lazy + memoized |
| Normal Order | Formal λ-theory | Canonical reduction order |

> [!tip]
> “Strictness” means arguments are always evaluated before function application.  
> “Non-strictness” means arguments are evaluated only when needed.

---

## Termination & Normal Forms
### The Termination Property
If a λ-term has a normal form, **normal-order** will find it; **call-by-value** may not.

For example:
```

(λx. 1) ((λy. y y) (λy. y y))

````
- CBV diverges (evaluates inner loop).
- CBN and Normal terminate immediately.

> [!warning]
> There is no universal evaluation order that both guarantees termination *and* preserves eager efficiency.

---

## Effects and Observability
In pure λ-calculus, all terminating strategies yield the same result.  
But once you add **side effects**, the choice of strategy can change observable behavior.

Example:
```haskell
print (f 1) + print (f 2)
````

- **CBV:** both prints always occur before addition.
    
- **CBN:** might print lazily or reorder.
    
- **Call-by-Need:** prints each once, only when demanded.
    

Thus, evaluation order becomes part of the **language semantics**.

> [!note]  
> This distinction is critical for reasoning about purity and referential transparency.

---

![One λ-term with four reduction branches: CBV, CBN, Normal Order, Call-by-Need](assets/lambda-eval-strategies.svg)

---

## Theoretical Results

### Church–Rosser Theorem

> If a λ-term reduces to two results under different strategies, both results are equivalent (converge to a common normal form).

This ensures **confluence**: evaluation strategy affects performance and termination, not meaning, for pure λ-calculus.

### Standardization Theorem

> Normal-order reduction is standard: any other sequence that terminates will produce the same normal form.

> [!tip]  
> These theorems justify using any convenient strategy for reasoning, while implementations choose the one best suited for performance.

---

## Conceptual Summary

|Property|Call-by-Value|Call-by-Name|Normal-Order|Call-by-Need|
|---|---|---|---|---|
|Strict|✅|❌|❌|❌|
|Terminates when Normal does|❌|✅|✅|✅|
|Reduces arguments early|✅|❌|❌|❌|
|Avoids recomputation|✅|❌|❌|✅|
|Used in|OCaml, Python, C|Theoretical, Haskell-like|Theoretical|Haskell|

> [!note]  
> Most real languages use **call-by-value**; **call-by-need** is a specialized optimization enabling lazy semantics.

---

## See also

- [[cs/pl/evaluation-order-and-strictness|Evaluation Order & Strictness]]
    
- [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus: Syntax & Substitution]]
    
- [[cs/pl/lambda-calculus-encodings-booleans-pairs-church-numerals|Lambda Calculus: Encodings]]
    
- [[cs/pl/hindleymilner-type-inference|Hindley–Milner Type Inference]]

---

## Sources

- "Evaluation strategy," Wikipedia. https://en.wikipedia.org/wiki/Evaluation_strategy . Supports the definition of an evaluation strategy as rules for evaluating expressions, the distinction between parameter-passing/binding strategies and reduction order, and the framing of call-by-value versus call-by-name.
- "Lazy evaluation," Wikipedia. https://en.wikipedia.org/wiki/Lazy_evaluation . Supports call-by-need as an evaluation strategy that delays evaluation until a value is needed and avoids repeated evaluation through sharing (memoization), as implemented in Haskell.
- "Church–Rosser theorem," Wikipedia. https://en.wikipedia.org/wiki/Church%E2%80%93Rosser_theorem . Supports the claim that in lambda calculus the order in which reductions are chosen does not change the eventual result (confluence).