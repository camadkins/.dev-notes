---
title: Operational Semantics — Big-Step & Small-Step
description: How structural operational semantics models computation step-by-step or as complete evaluations, using inference rules to define program behavior precisely.
draft: false
tags:
  - cs
  - pl
date: 2025-10-24
updated:
aliases: []
# diagrams:
#  - semantics_judgement_forms.svg — illustrate big-step (⇓) vs small-step (→) derivation trees.
#  - evaluation_derivation_example.svg — show arithmetic and conditional derivations with inference rule boxes.
---

## Overview
Operational semantics gives a **mathematical account of program execution** — describing *how* a program runs, not just *what result* it produces.  
It forms the bridge between language syntax and implementation.

Two primary variants exist:
- **Small-step (structural operational semantics)** — defines individual computation steps.
- **Big-step (natural semantics)** — defines the overall evaluation to a value.

> [!note]
> Big-step = “evaluate to completion.”  
> Small-step = “reduce one step at a time.”

---

## Judgement Forms
We define evaluation as a *relation* between program terms and results.

### Small-Step (→)
Describes one computational transition:
```

⟨t, σ⟩ → ⟨t', σ'⟩

```
Read as “term `t` in store `σ` reduces to term `t'` in store `σ'` in one step.”

### Big-Step (⇓)
Describes evaluation from start to final value:
```

⟨t, σ⟩ ⇓ ⟨v, σ'⟩

```
Read as “term `t` evaluates in store `σ` to value `v`, producing final store `σ'`.”

> [!tip]
> If the language is pure (no mutable state), we often omit `σ` and simply write `t → t'` or `t ⇓ v`.

---

## The Structure of Rules
Operational semantics uses **inference rules** in the general form:
```

premise₁ premise₂ ...  
------------------------ (RuleName)  
conclusion

```

Each rule expresses how evaluation of a complex expression depends on its sub-expressions.

---

## Example — Arithmetic Expressions (Small-Step)
Consider:
```

t ::= n | t + t

```
We define evaluation as:

```

## E-Plus1 t1 → t1'

t1 + t2 → t1' + t2

## E-Plus2 v1 + t2 → v1 + t2'

v1 + t2 → v1 + t2'

## E-PlusV

n1 + n2 → n3 where n3 = n1 + n2

```

> [!example]
> **Diagram idea (`evaluation_derivation_example.svg`)**  
> Tree showing `1 + (2 + 3)` reducing step-by-step to `6`, with each step labeled by its inference rule name.

---

## Example — Conditionals (Big-Step)
For booleans:
```

t ::= true | false | if t then t else t

```

We define:
```

## B-Val

true ⇓ true

If-True If-False  
c ⇓ true c ⇓ false  
────────── ──────────  
if c then t else e ⇓ t if c then t else e ⇓ e

```

> [!tip]
> Big-step semantics collapses all intermediate steps — ideal for expressing final results or static analyses.

---

## Determinism and Confluence
### Determinism
For a deterministic fragment (like arithmetic):
> For all `t`, there is at most one `t'` such that `t → t'`.

Meaning: the next step of evaluation is uniquely determined.

### Confluence
Even if multiple reduction paths exist (as in parallel or non-deterministic systems), they all converge to the same result if the semantics is **confluent**:
```

t →* t₁ and t →* t₂ ⇒ ∃t₃. t₁ →* t₃ ∧ t₂ →* t₃

```

> [!note]
> Determinism ⇒ confluence, but not vice versa.  
> Confluence ensures that the *order* of reduction steps doesn’t affect final results.

---

## Comparing Big-Step and Small-Step

| Aspect | Small-Step (→) | Big-Step (⇓) |
|--------|----------------|---------------|
| Describes | One computation step | Whole evaluation |
| Granularity | Fine-grained | Coarse-grained |
| Good for | Concurrency, interleaving, effects | Reasoning about termination |
| Models | Execution trace | Input–output mapping |
| Proof style | Induction on steps | Induction on structure |

Example:
```

t →* v (multi-step closure of small-step)  
t ⇓ v (big-step equivalent)

```

These two notations often describe the same semantics at different resolutions.

---

## Adding State
When we include mutable state (σ):
- Each step transforms not just expressions, but the **store**.
- Evaluation now becomes *store-passing*:
```

⟨ref 0, σ⟩ → ⟨ℓ, σ[ℓ ↦ 0]⟩  
⟨!ℓ, σ⟩ → ⟨σ(ℓ), σ⟩  
⟨ℓ := 1, σ⟩ → ⟨unit, σ[ℓ ↦ 1]⟩

```

> [!note]
> Big-step semantics still works with stores, but small-step captures *when* updates occur — making it better suited for reasoning about effects.

---

## Multi-Step Evaluation
We define the **reflexive transitive closure** of →:
```

t →* t'

```
meaning `t` reduces to `t'` in zero or more steps.

Properties:
1. **Reflexive:** `t →* t`
2. **Transitive:** if `t →* t'` and `t' →* t''` then `t →* t''`

This captures the entire execution trace of a program.

---

## Equivalence Between Big-Step and Small-Step
Under deterministic, terminating semantics:
```

t ⇓ v ⇔ t →* v

```
They describe the same mapping from terms to values.

However, **non-terminating programs** are captured by small-step only — big-step evaluation diverges (no derivation tree).

Example:
```

Ω = (λx. x x) (λx. x x)

```
- Big-step: no derivation exists (non-terminating).
- Small-step: infinite reduction sequence.

> [!warning]
> Big-step semantics cannot represent divergence without extra constructs (like coinductive rules).

---

## Derivation Trees
Evaluation is visualized as **derivation trees**, where each node corresponds to an inference rule.

Example:
```

E-Add  
───────────────  
1 + 2 → 3

E-Mul  
───────────────  
3 * 4 → 12

```

> [!example]
> **Diagram idea (`semantics_judgement_forms.svg`)**  
> Two panels:  
> - Small-step tree showing reduction sequence.  
> - Big-step tree showing direct evaluation to final value.

---

## Extensions and Practical Relevance
Operational semantics underlies:
- **Interpreter design** (one inference rule = one case in eval function).
- **Proof of compiler correctness.**
- **Program equivalence reasoning.**
- **Formal verification tools** (Coq, Isabelle, K).

Languages and textbooks often use hybrid styles:
- **Small-step for expression-level reduction**
- **Big-step for top-level evaluation**

> [!tip]
> Think of small-step semantics as the *runtime trace*, and big-step as the *outcome summary*.

---

## Conceptual Summary

| Concept | Notation | Description |
|----------|-----------|-------------|
| Step | `t → t'` | One reduction step |
| Full Evaluation | `t ⇓ v` | Final value |
| Multi-step | `t →* v` | Zero or more steps |
| Deterministic | ∀t, ∃≤1 t' | Only one next step |
| Confluent | All paths merge | Consistent outcomes |
| Divergence | Infinite sequence | Non-termination |

---

## See also
- [[booleans-conditionals-semantics|Booleans & Conditionals — Semantics]]
- [[mutable-state-references-effects|Mutable State, References & Effects]]
- [[language-design-values-variables-environments|Values, Variables & Environments]]
- [[evaluation-order-and-strictness | Evaluation Order & Strictness]]