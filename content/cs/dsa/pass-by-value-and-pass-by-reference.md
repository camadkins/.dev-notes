---

title: Pass-by-Value vs Reference
description: Parameter passing models and aliasing; when a callee's mutations affect the caller and when they do not.
draft: false
tags:
- cs
- dsa
date: 2025-10-16
updated: 2025-12-13
aliases: []

---

## Overview

**Parameter passing** determines whether a function receives **copies of values** or **aliases** to the caller's objects. This choice drives correctness (does the caller see mutations?), performance (copy cost, escape analysis), and safety (aliasing, data races, ownership).

The two canonical models:

- **Pass-by-value**: the callee receives an _independent copy_ of each argument. Mutations affect only the copy.

- **Pass-by-reference**: the callee receives a _reference/alias_ to the caller's storage. Mutations are visible to the caller.


Real languages combine these with **pointer** semantics, **borrowing**, **move** semantics, and **value vs reference types**. This note clarifies the models, shows language-specific behavior, and provides patterns to control mutability and performance.

> [!note]
> Many languages market a single story ("everything is pass-by-value"), but **what is being passed** can itself be a **reference**. The practical question is: _does mutating inside the function change the caller's observable state?_

## Motivation

- **Correctness**: unexpected aliasing causes spooky action at a distance. Conversely, unnecessary copying hides intended side effects.

- **Performance**: copying large structures (`O(n)`) vs passing references (`O(1)`). In hot loops this matters.

- **API design**: clear contracts ("this function will not mutate your input") reduce bugs and enable optimizations (e.g., sharing).

- **Safety**: references that outlive owners lead to **dangling pointers**, **use-after-free**, or **data races**.


## Definition and Formalism

Let a function `f(x)` be called with actual argument `A`. At call:

- **Pass-by-value**: allocate `x` in callee's frame; assign `x := copy(A)`. Postconditions:

    - `x` and `A` are independent values after the call (unless shallow copy shares internal pointers).

- **Pass-by-reference**: bind `x` to denote the _same storage_ as `A`. Postconditions:

    - Writes through `x` change `A`.


Related terms:

- **Call-by-sharing** (a.k.a. **object reference** semantics): the callee receives a **reference value** _by value_. Rebinding `x` doesn't affect the caller, but **mutating the referenced object** does.

- **Move** semantics: transfer ownership of a value to the callee without copying; the caller may be left unusable/empty.

- **Borrow**: temporary, checked reference with aliasing rules (e.g., Rust's `&T` / `&mut T`).


## Example or Trace

### Swap — value vs reference

**Pass-by-value (fails to swap the caller's variables):**

```pseudo
function swap_value(a, b):
    tmp = a
    a = b
    b = tmp

x = 1; y = 2
swap_value(x, y)
// x == 1, y == 2  (caller unchanged)
```

**Pass-by-reference (or pointer) — succeeds:**

```pseudo
function swap_ref(ref a, ref b):
    tmp = a
    a = b
    b = tmp

x = 1; y = 2
swap_ref(x, y)
// x == 2, y == 1
```

### Mutating an object passed by "reference value"

Consider a language where variables hold **references** to heap objects, and those references are **copied** into parameters.

```pseudo
function set_first(L):
    L[0] = 99    // mutates shared object
    L = [0,0,0]  // rebinding local name only

A = [1,2,3]
set_first(A)
// A == [99,2,3]  (mutation visible)
// Rebinding L did not rebind A
```

This is **call-by-sharing**: aliasing on the object, isolation on the variable binding.

## Properties and Relationships

- **Aliasing**: two names refer to the **same location**. Reference passing introduces aliasing; value passing does not (unless deep structure shares sub-objects).

- **Deep vs shallow copies**: pass-by-value typically makes a **shallow** copy (copy top-level fields, but pointers still alias). "Deep copy" duplicates the entire reachable structure—expensive and uncommon by default.

- **Escape analysis**: compilers may elide copies or heap allocations if references don't escape the function.

- **Immutability**: passing an immutable value/reference eliminates side-effect concerns regardless of passing mode.


## Implementation or Practical Context

### Language cheatsheet (operational view)

|Language|What the parameter **receives**|Can callee mutate caller's data?|Notes|
|---|---|---|---|
|**C**|**Value** (copy). Use `T*` to simulate by-reference.|Only if a **pointer** is passed and dereferenced.|Arrays **decay** to pointers in params (`int a[]` == `int* a`).|
|**C++**|**Value** by default; `T&`/`T&&` references available.|Yes with `T&` (lvalue ref) or pointer; `const&` forbids mutation (logical).|**Move** via `T&&` to avoid copies; `std::span` for view semantics.|
|**Java**|Always **pass value** of the variable. For objects, that value is a **reference**.|Mutating the **object** is visible; rebinding parameter is not.|Primitives copy; arrays/objects share.|
|**Python**|**Call-by-sharing** (object reference).|Mutating a **mutable** object (list, dict) is visible; rebinding name is local.|Use `copy`/`deepcopy` to defend; prefer returning new objects.|
|**JavaScript**|Values are passed by value; object values are **references**.|Mutations of object/array visible; rebinding local not.|Use spread/clones to defend.|
|**Go**|**Value** by default; use `*T` for by-reference behavior.|Yes with pointers or slices/maps (which are small descriptors pointing to backing storage).|Slices, maps, channels are **reference-like**.|
|**Rust**|**Move** by default (cheap for `Copy` types). Borrow with `&T`/`&mut T`.|Only with `&mut` (exclusive borrow) or by owning/mutating then returning.|Borrow checker prevents unsound aliasing.|
|**C#**|**Value** by default; `ref`/`out` for by-reference.|Yes with `ref` or with reference-type objects' fields.|`struct` (value type) vs `class` (reference type).|
|**Swift**|**Value** by default; `inout` for by-reference behavior.|Yes with `inout`; `struct` is value type, `class` is reference.|Copy-on-write in stdlib collections.|

> [!tip]
> If you're unsure: **print the identity** of the object (address/id/hash) before and after the call, and modify a field. If the caller sees the change, you have aliasing.

### Defensive Copying & Contracts

- **Calibrate by size**: pass small, cheap-to-copy types (ints, small structs) **by value** for clarity and safety.

- **For large structures**:

    - Pass **immutable views** or `const` references.

    - If mutation is required, **document it** in the function name/contract (`mutateInPlace`, `fill_buffer`).

    - If mutation is not desired but the language aliases by default, **clone** on entry (`defensive copy`) or **freeze** (immutable types).

- **Return new values** rather than mutating inputs for functional-style APIs.


### Patterns

#### In-place vs out-of-place APIs

- **In-place** (mutating): `void sort_in_place(vec&)` — fast, alloc-free, but surprises callers if undocumented.

- **Out-of-place** (pure): `vec sorted(vec)` — simpler reasoning, may allocate.


#### Borrow/Mutate/Return (Rust-style thinking in any language)

- Accept a **borrow** (reference/view) when you only need reads.

- Accept a **mutable borrow** only when you truly need to write.

- For ownership transfers, **return** the new owner or result.


#### Callers controlling mutation

- C/C++: pass `const T&` or `const T*`.

- Java/Python/JS: pass **immutable** types (tuples, frozensets) or **frozen** dataclasses/objects when possible.

- Go: pass **value** where feasible; use pointers only for large or shared state.


### Performance Considerations

- **Copy cost**: copying `O(n)` arrays or maps per call can dominate runtime; prefer references with immutability or **copy-on-write** (COW) designs.

- **Escape analysis**: JITs (Java/Go) may stack-allocate and elide copies if references don't escape.

- **Small object optimization**: some languages/ABIs pass small structs in registers; copying is effectively free.


### Concurrency & Lifetime Hazards

- **Data races**: passing references into concurrent contexts without synchronization creates races. Prefer immutable data or copy before sharing.

- **Dangling**: returning references to caller-owned **locals** is UB/buggy in manual memory languages (C/C++).

- **Aliasing & invariants**: mutation through multiple aliases can break invariants (e.g., iterator invalidation). Document aliasing expectations.


> [!warning]
> Do **not** return pointers/references to **stack locals** (C/C++). Return by **value** (NRVO/copy elision makes it cheap) or allocate on the heap and transfer ownership clearly.

## Common Pitfalls or Edge Cases

- **Shallow copy surprises**: passing a "value" that contains pointers still **shares** its sub-objects. Deep copy if isolation is required.

- **Rebinding vs mutation confusion**: in call-by-sharing languages, `param = newObj` doesn't affect the caller; `param.field = ...` does.

- **"Everything is by value" mantras**: true at the level of **bits passed**, but many bits are **references**; treat them as aliases.

- **Slice/map descriptors (Go)**: passing a slice **by value** still shares its backing array; appends may or may not reallocate—document expectations.

- **Copy-on-write semantics** (Swift/C++ libs): apparent aliasing until a write triggers a copy; can hide `O(n)` costs behind a single mutation.


## Implementation Notes or Trade-offs

- Choose **by value** for primitives and small POD/structs; it's clearer and often as fast or faster.

- Choose **by reference/view** for large data when reads dominate; add **const/immutability** guarantees.

- For mutation APIs, return **status** or updated ownership explicitly; avoid hidden global effects.

- For libraries: expose both (`foo_in_place(dst, src)`, `foo(src)->dst`) so callers choose.


## Summary

"Pass-by-value vs reference" is about **who owns what** and **who can mutate what**. Value passing isolates the caller from callee mutations; reference passing shares storage and enables in-place updates. Many mainstream languages pass **reference values** by value, yielding **call-by-sharing** behavior: **rebinding is local, mutation is shared**. Design your APIs to make mutability explicit, use defensive copying or immutability to prevent surprises, and pick the passing mode that balances **clarity, performance, and safety** for your data size and lifetime.

## See also

- [[functions|Functions]]

- [[arrays|Arrays]]

- [[pointer-with-functions|Pointer with Functions]]

- [[dynamic-arrays|Dynamic Arrays]]
