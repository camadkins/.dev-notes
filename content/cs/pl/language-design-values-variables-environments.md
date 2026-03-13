---
title: Language Design — Values, Variables, and Environments
description: How programming languages define, represent, and resolve variables; the role of environments, stores, and closures in execution models.
draft: false
tags:
  - cs
  - pl
date: 2025-10-24
updated:
aliases: []
# diagrams:
#  - env_binding_chain.svg — visualize nested environments (global → function → block) with variable bindings.
#  - closure_environment.svg — illustrate closure capturing a lexical environment.
#  - env_store_split.svg — show environment ρ mapping identifiers to addresses, and store σ mapping addresses to values.
---

## Overview
Every programming language must define **what variables mean** — how they acquire values, where those values live, and how their bindings evolve during execution.  
The trio of **values**, **variables**, and **environments** forms the backbone of this model.

In the λ-calculus, variables were abstract placeholders. In real programming languages, they correspond to **names**, **memory locations**, and **runtime values** — linked together through an environment.

> [!note]
> Understanding environments is central to interpreting programs and implementing interpreters or compilers.  
> They provide the mapping from **identifiers → values (or locations)**, grounding abstract syntax in runtime behavior.

---

## Expressions, Values, and Variables
### Expressions
Expressions represent *computations*. They are evaluated in some context (an environment) to produce **values**.

```

3 + 4 -- expression  
(x * 2) + 5 -- expression involving a variable

```

### Values
Values are the **results** of evaluation — things that can no longer be simplified (in pure languages).  
Examples include:
- Integers (`5`)
- Booleans (`true`)
- Functions (`λx. x + 1`)
- Compound data (`(1, 2)`)

Values are often treated as **self-evaluating**:
```

⟦5⟧ρ = 5

```

### Variables
Variables are **names bound to values or memory locations**.  
They have *no inherent meaning* until evaluated in an **environment**:
```

⟦x⟧ρ = ρ(x)

```
If `x` is not in the domain of `ρ`, the variable is unbound → runtime error.

> [!tip]
> The key distinction: expressions describe *computation*, values describe *results*, variables describe *places* to look for those results.

---

## Environments (ρ)
An **environment** is a mapping from variable names to values or locations.

Formally:
```

ρ : Identifier → Value

```
or, in the case of mutable languages:
```

ρ : Identifier → Location  
σ : Location → Value

```

Here:
- `ρ` (rho) — the **environment**, records *bindings* (name → location).
- `σ` (sigma) — the **store**, records *contents* (location → value).

Together, they describe the **state** of a program.

> [!note]
> Many interpreters use environments for *scoping* and stores for *mutation*.  
> This separation cleanly models both immutable and mutable variables.

---

## Example — Immutable Language (Functional)
In a pure functional language:
```

let x = 3 in x + 2

```
Evaluation proceeds as:
1. Extend environment:  
```

ρ' = ρ[x ↦ 3]

```
2. Evaluate body `x + 2` under ρ′:  
```

⟦x + 2⟧ρ' = 5

```

No store is needed — bindings are directly immutable associations.

---

## Example — Mutable Language (Imperative)
In an imperative setting:
```

var x = 3;  
x = x + 2;

```
we use both `ρ` and `σ`:
1. Allocate a new location `l1`.  
```

ρ' = ρ[x ↦ l1]  
σ' = σ[l1 ↦ 3]

```
2. Update:
```

σ'' = σ'[l1 ↦ 5]

```

Now:
```

⟦x⟧ρ'σ'' = σ''(ρ'(x)) = σ''(l1) = 5

```

> [!example]
> **Diagram idea** (`env_store_split.svg`):  
> - Top layer: environment `ρ` boxes mapping identifiers (`x`, `y`) to addresses (`l1`, `l2`).  
> - Bottom layer: store `σ` boxes mapping addresses to actual values (3, 5, etc.).  
> - Update arrows showing mutation in σ, leaving ρ unchanged.

---

## Nested and Lexical Environments
### Block Scope
When a new block introduces local bindings:
```

let x = 10 in  
let y = x + 2 in  
y * 3

```
each block creates a **new environment frame** extending the previous:
```

ρ0 = {}  
ρ1 = ρ0[x ↦ 10]  
ρ2 = ρ1[y ↦ 12]

```
Evaluating under `ρ2`, the variable `x` still resolves through `ρ1` — lexical scoping.

### Lexical vs Dynamic Scope
- **Lexical (static)**: variable binding determined by the *program’s structure*.  
  Most modern languages (Python, C, Haskell) use lexical scope.
- **Dynamic**: variable binding determined by the *call stack at runtime* (old Lisp, shell scripts).

> [!warning]
> Dynamic scope makes reasoning difficult — a variable’s value may depend on the call history rather than the code’s textual layout.

---

## Closures — Functions with Environments
A **closure** pairs a function with the environment that existed when it was defined.

### Example
```

let add = λx. λy. x + y  
let inc = add 1  
inc 5

```

During `add 1`, the inner `λy. x + y` forms a closure:
```

⟦add 1⟧ρ = ⟨λy. x + y, ρ[x ↦ 1]⟩

````

When `inc 5` executes:
- Environment `ρ[x ↦ 1]` is used.
- Argument `y = 5` extends it temporarily.
- The body computes `x + y = 6`.

> [!example]
> **Diagram idea** (`closure_environment.svg`):  
> A closure node containing `(λy. x + y)` points to an environment box capturing `x = 1`.  
> When applied, a new frame extends that captured one with `y = 5`.

> [!tip]
> Closures are how functional languages implement lexical scope — functions *carry their own environment*.

---

## Formal Notation Recap

| Concept | Symbol | Meaning |
|----------|---------|----------|
| Environment | ρ | name → location (or value) |
| Store | σ | location → value |
| Expression evaluation | ⟦E⟧ρ,σ | evaluate `E` in `ρ`, `σ` |
| Binding extension | ρ[x ↦ v] | new mapping |
| Lookup | ρ(x) | value or location bound to `x` |

> [!note]
> Many semantics textbooks use `Env`, `Store`, and `Val` domains with similar notations:  
> ```
> Env = Id → Loc  
> Store = Loc → Val  
> Val = Int + Bool + (Loc → Loc) + ...
> ```

---

## Environments in Interpreter Design
A basic interpreter can model environment behavior explicitly:
```python
def eval_expr(expr, env):
    if isinstance(expr, int):
        return expr
    elif isinstance(expr, str):
        return env[expr]
    elif isinstance(expr, list) and expr[0] == "let":
        _, x, e1, e2 = expr
        v1 = eval_expr(e1, env)
        new_env = env.copy()
        new_env[x] = v1
        return eval_expr(e2, new_env)
````

Mutable variants add a `store` object and store references instead of direct values.

> [!tip]  
> This dual model (`env`, `store`) is the practical analog of ρ and σ — used in compilers, interpreters, and operational semantics.

---

## Shadowing and Lifetime

When a new variable shadows an old one:

```
let x = 1 in
  let x = 2 in
    x + 3
```

we extend the environment with a _new binding_:

```
ρ0[x ↦ 1]
ρ1 = ρ0[x ↦ 2]
```

The previous binding is not destroyed; it just becomes _inaccessible_.  
Once the inner block exits, `ρ1` is discarded and `ρ0` resumes.

> [!note]  
> This stack-like environment chain models lifetime and scope without mutating outer bindings.

---

## Mutation and Shared State

Languages with mutable variables maintain **persistent environment bindings** and mutate **store entries** instead.

Example:

```
var x = 0;
function f() { x = x + 1; }
f(); f();
```

After `var x = 0`:

```
ρ[x ↦ l1]
σ[l1 ↦ 0]
```

Each call to `f` performs:

```
σ[l1 ↦ σ(l1) + 1]
```

After two calls: `σ[l1] = 2`.

> [!warning]  
> Mutation blurs the line between lexical scope and dynamic behavior — functions may share state via the same store entries.

---

## Environments and Recursive Bindings

Recursion requires self-reference — a function must see its own binding during definition.

```
let rec fact = λn. if n == 0 then 1 else n * fact (n-1)
```

To support this:

1. Allocate a location `l`.
    
2. Extend ρ before evaluating the definition:
    
    ```
    ρ' = ρ[fact ↦ l]
    ```
    
3. Evaluate body under `ρ'` to form a closure capturing `ρ'`.
    
4. Store closure in σ:
    
    ```
    σ[l ↦ ⟨λn. ..., ρ'⟩]
    ```
    

> [!note]  
> Recursive environments require circular structures — the closure points back to the environment that contains it.

---

## Dynamic Extensions — Activation Records

During execution, each function call creates a new **environment frame**, often represented as an **activation record** on the stack.  
When a call returns, the frame is popped, restoring the previous ρ.

Languages with first-class functions store environments on the heap (to allow returning closures), while stack-based languages reclaim them after return.

> [!example]  
> **Diagram idea** (`env_binding_chain.svg`):  
> Show global, function, and local frames as linked boxes.  
> Arrows represent lexical parents; one frame highlighted for current evaluation.

---

## Static vs Dynamic Environments

|Concept|Static (Compile-Time)|Dynamic (Run-Time)|
|---|---|---|
|Binding|Symbol table|Environment ρ|
|Value resolution|Determined by lexical structure|Determined by runtime chain|
|Lifetime|Scope rules|Activation record duration|

> [!tip]  
> The _symbol table_ at compile time predicts what ρ will look like at runtime.

---

## Conceptual Summary

|Layer|Concept|Description|
|---|---|---|
|**Syntactic**|Expression, Variable|Abstract code form|
|**Semantic**|Value|Result of evaluation|
|**Operational**|Environment (ρ), Store (σ)|Concrete model of name–value linkage|
|**Implementation**|Stack, Heap|Real machine-level mapping|

Together, they form the conceptual bridge from _syntax_ to _execution_.

> [!note]  
> The model is general: functional, imperative, and object-oriented languages all differ mainly in how they structure environments and manage stores.

---

## See also

- [[scoping-binding-and-closures|Scoping & Bindings]]
    
- [[lambda-calculus-syntax-substitution|Lambda Calculus — Syntax & Substitution]]
    
- [[abstract-machines-cek-secd|Abstract Machines — CEK & SECD]]
    
- [[continuations-cps|Continuations & CPS]]
    
- [[evaluation-order-and-strictness|Evaluation Order & Strictness]]