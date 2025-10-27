---
title: Type Soundness — Progress & Preservation
description: How type systems ensure that well-typed programs don’t “get stuck,” linking static typing rules to dynamic execution behavior through the key theorems of progress and preservation.
draft: true
tags:
  - cs
  - pl
date: 2025-10-16
updated:
aliases: []
# diagrams:
#  - type_safety_pipeline.svg — show typing ⇒ evaluation ⇒ result flow, highlighting where progress and preservation apply.
#  - preservation_derivation.svg — visualize substitution and typing consistency across one reduction step.
#  - stuck_program_example.svg — illustrate an ill-typed term that halts mid-evaluation.
---

## Overview
The **type soundness theorem** connects a language’s *static* and *dynamic* semantics:  
> **If a program type-checks, it will not get stuck at runtime.**

This guarantee emerges from two complementary properties:
1. **Progress** — a well-typed term can either take a computation step or is already a value.  
2. **Preservation** — each computation step maintains the program’s type.

Together, these theorems formalize the intuition that *types prevent runtime type errors*.

> [!note]
> “Well-typed programs do not go wrong.” — Robin Milner, *1978*

---

## Typing and Evaluation
Let:
- `Γ ⊢ e : T` denote that expression `e` has type `T` under context `Γ`.
- `e → e'` denote one small-step reduction (execution).

### The Central Claim
If `Γ ⊢ e : T` and `e →* e'`,  
then either:
- `e'` is a **value** of type `T`, or  
- `e'` can take another step.

If neither holds (a “stuck” term), the type system is unsound.

---

## The Progress Theorem
### Informal Statement
> If `e` is well-typed (`⊢ e : T`), then `e` is either a value or there exists an `e'` such that `e → e'`.

This ensures that evaluation can always make progress — a well-typed program never halts mid-execution because of a missing rule.

### Proof Sketch
Induction on the structure of typing derivations:
1. **Base Case (Values)**: constants and λ-abstractions are values.
2. **Inductive Step**:  
   For each typing rule (e.g., application, conditional, arithmetic), use the inductive hypothesis on subterms.  
   - If subterms are values, show how a reduction rule applies.  
   - Otherwise, show that one of them can take a step.

Example:
```

⊢ e1 : T1 → T2 ⊢ e2 : T1  
──────────────────────────────  
⊢ e1 e2 : T2

```
By IH:
- Either `e1` or `e2` can take a step, or both are values.
- If `e1` is a λ-abstraction and `e2` a value, then `(λx:T1. e) v → e[x := v]`.

Thus, progress holds.

> [!tip]
> Every typing rule must correspond to at least one evaluation rule — missing a case breaks progress.

---

## The Preservation Theorem
### Informal Statement
> If `⊢ e : T` and `e → e'`, then `⊢ e' : T`.

This ensures that type information remains valid as execution proceeds — evaluation doesn’t “break” typing.

### Proof Sketch
Induction on the typing derivation for `e`.  
Use *inversion lemmas* and *substitution lemmas* to show that when `e` reduces, its type is preserved.

#### Example: β-Reduction
```

(λx:T1. e) v → e[x := v]

```
Given `⊢ (λx:T1. e) : T1 → T2` and `⊢ v : T1`,  
we must show `⊢ e[x := v] : T2`.

From the typing rule for λ:
```

Γ, x:T1 ⊢ e : T2

```
By substitution:
```

Γ ⊢ e[x := v] : T2

```
Hence, preservation holds.

> [!example]
> **Diagram (`preservation_derivation.svg`)**  
> Depict substitution and type consistency before and after a reduction step.

---

## Combining the Two — Type Soundness
Together, progress and preservation guarantee **type safety**:
```

Theorem (Type Soundness):  
If ⊢ e : T and e →* e', then either e' is a value or ∃e''. e' → e''.

```

In plain terms:
- The program cannot reach a stuck configuration.
- Every step either computes further or produces a result consistent with its type.

> [!note]
> Type soundness does **not** guarantee logical correctness — only that the program won’t crash due to type mismatches.

---

## Example: Arithmetic + Booleans
Language fragment:
```

e ::= n | true | false | e1 + e2 | if e1 then e2 else e3

```

### Typing Rules
```

⊢ n : Int  
⊢ true : Bool  
⊢ false : Bool  
⊢ e1 : Int ⊢ e2 : Int  
────────────────────────────  
⊢ e1 + e2 : Int  
⊢ e1 : Bool ⊢ e2 : T ⊢ e3 : T  
──────────────────────────────────────  
⊢ if e1 then e2 else e3 : T

```

### Evaluation Rules
```

(if true then e2 else e3) → e2  
(if false then e2 else e3) → e3  
(e1 + e2) → n3 (when e1,e2 are numeric values)

```

Both progress and preservation can be proved by structural induction:
- For progress, the key case is `if e1 then e2 else e3`.
- For preservation, check that substitution and reduction maintain types for `+` and `if`.

> [!example]
> **Diagram (`stuck_program_example.svg`)**  
> Show `if 3 then true else false` — type-checks fails (`3` is not Bool), therefore avoids a stuck runtime state.

---

## Pitfalls & Design Notes
> [!warning]
> - **Missing typing rules** lead to expressions that cannot progress even though they are syntactically valid.  
> - **Incomplete reduction rules** break preservation, producing expressions with no typing derivation.  
> - **Adding new features** (e.g., references, exceptions) requires revisiting proofs of both theorems.

### Example: Introducing References
Adding mutation changes preservation because store updates must also preserve typing:
```

⟨σ, e⟩ → ⟨σ', e'⟩

```
Now, preservation must hold for both expression *and* store:
```

Γ ⊢ σ : Σ Γ ⊢ e : T  
⟨σ, e⟩ → ⟨σ', e'⟩  
───────────────────────  
Γ ⊢ σ' : Σ' Γ ⊢ e' : T

```

---

## Conceptual Summary

| Theorem | Statement | Intuition |
|----------|------------|------------|
| **Progress** | Well-typed terms can step or are values | No stuck states |
| **Preservation** | Types remain consistent through reduction | Types are stable |
| **Soundness** | Combination of both | “Well-typed programs do not go wrong” |

> [!tip]
> Progress handles **what can happen**, Preservation handles **what must stay true**.

---

## Diagram Concepts
- `type_safety_pipeline.svg`: Static typing → Dynamic evaluation → Final value flow.
- `preservation_derivation.svg`: Substitution and consistent typing across β-reduction.
- `stuck_program_example.svg`: Ill-typed term illustrating a stuck state prevented by type checking.

---

## See also
- [[cs/pl/type-systems-goals-guarantees|Type Systems — Goals & Guarantees]]
- [[cs/pl/operational-semantics-big-step-small-step|Operational Semantics — Big-Step & Small-Step]]
- [[cs/pl/hindleymilner-type-inference|Hindley–Milner Type Inference]]