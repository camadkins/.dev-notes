---
title: Best, Worst & Average Cases
description: Different input families and their effect on algorithm behavior; how to reason about guarantees, expectations, and adversarial instances.
draft: false
tags:
  - cs
  - dsa
date: 2025-10-16
updated: 2025-10-29
aliases: []
---

## Definition
"Best", "worst", and "average" cases classify an algorithm's running time or space usage over **families of inputs** of the same size \(n\).

- **Worst case**: An upper bound over **all** inputs of size \(n\). Guarantees performance even under adversarial conditions.
- **Best case**: A lower bound achieved by the **most favorable** inputs of size \(n\). Rarely used for guarantees; helpful for understanding adaptability.
- **Average case**: The expected cost with respect to a **probability distribution** over inputs of size \(n\). Requires explicitly stating the distributional assumptions.

Mathematically, for a cost function \(T(x)\) on inputs \(x\) with \(|x|=n\):
- Worst case: \(\max_{\lvert x\rvert=n} T(x)\)
- Best case:  \(\min_{\lvert x\rvert=n} T(x)\)
- Average case (expectation): \(\mathbb{E}[T(X_n)]\) given a distribution on \(X_n\).

> [!note] What these bounds mean
> - **Worst-case** bounds are **guarantees**.
> - **Average-case** bounds are **expectations** under stated assumptions.
> - **Best-case** bounds are **possibilities**, not promises.

---

## Why it matters
Engineers need to know **how performance degrades** when inputs are unfavorable, and **what to expect** on typical data.
- Systems with tight SLOs prioritize **worst-case** guarantees (e.g., real-time schedulers, safety-critical code).
- Data-processing apps often rely on **average-case** behavior when inputs are well-modeled (e.g., randomized quicksort on shuffled data).
- **Best-case** behavior highlights adaptability (e.g., insertion sort is fast on nearly-sorted data).

> [!note] Practical takeaway
> Choose **worst case** when you must not exceed a latency/space budget; choose **average case** when input distributions are stable and can be defended.

---

## Model & Assumptions
A statement like "average \(O(f(n))\)" is **meaningless** without:
- A **distribution** over inputs (e.g., uniform over all permutations, random hash function, i.i.d. keys).
- A **cost model** (e.g., RAM with unit-cost arithmetic, how comparisons and cache misses are counted).
- Clear **preconditions** (e.g., "array is randomly shuffled", or "hash function is universal/independent").

> [!tip] Be explicit about assumptions
> - If you randomize the algorithm (e.g., randomized pivot), you can analyze **expected runtime over the algorithm's coins** for **any fixed input**—this sidesteps unknown input distributions.
> - If you rely on input randomness, document the **source of randomness** (real-world shuffles? adversary likely?).

---

## Examples
### Quicksort
- **Worst**: \(O(n^2)\) when pivots are consistently extreme (e.g., already-sorted data with deterministic first-element pivot).
- **Average** (random pivot or random permutation): \(O(n \log n)\).
- **Best**: \(O(n \log n)\) in many instances; not asymptotically better than average.

> [!example] Recursion shapes
> - Worst case: highly unbalanced recursion (depth \(n\)).
> - Average case: roughly balanced recursion (depth \(\Theta(\log n)\)).

### Hash table lookups (chaining)
- **Worst**: \(O(n)\) if all keys collide in one bucket (adversarial or poor hash).
- **Average**: \(O(1)\) expected under simple uniform hashing with bounded load factor.
- **Best**: \(O(1)\) when the key is in a short bucket or not present with immediate negative test.

### Binary search
- **Worst**: \(O(\log n)\) over any input because the search path length is bounded.
- **Average**: \(O(\log n)\); distribution of target locations does not change the asymptotic bound.
- **Best**: \(O(1)\) if the first probe hits the target (degenerate but possible).

### Insertion sort
- **Worst**: \(O(n^2)\) comparisons/shifts on reverse-sorted arrays.
- **Average**: \(O(n^2)\) over random permutations, but with a smaller constant than selection sort.
- **Best**: \(O(n)\) on already sorted arrays (adaptive behavior).

> [!example] Mini trace: insertion sort on nearly-sorted data
> Each insertion shifts only a few elements, so total shifts scale with **number of inversions**, not \(n^2\).

### Graph algorithms (BFS/DFS)
- **Worst/Average/Best**: \(O(n+m)\) for traversal itself—insensitive to input ordering, but **graph density** \(m\) vs \(n\) heavily influences actual running time.

---

## Model & Assumptions (worked patterns)
- **Uniform over inputs**: average over all permutations/graphs/etc. Often unrealistic without justification.
- **Stochastic process for inputs**: e.g., keys are i.i.d. from a distribution \(D\) (state \(D\) explicitly).
- **Randomized algorithms**: expected runtime is over the algorithm's **own randomness** for **any input** (Yao's principle relates this to distributional inputs).

Concrete examples:
- **Randomized quicksort**: expectation over random pivot choices; average \(O(n\log n)\) for every fixed input.
- **Cuckoo hashing**: expected \(O(1)\) lookup under specific independence assumptions on hash functions.

---

## Properties & Relationships
- **Worst-case dominates**: For asymptotic guarantees, worst-case bounds are **sufficient** (but sometimes pessimistic).
- **Average-case depends on modeling**: Changing the input or hash distribution can change the bound.
- **Best-case rarely drives design**: It's a sanity check or highlights adaptability (e.g., partially sorted inputs).

Connections:
- [[cs/dsa/asymptotic-notation|Asymptotic Notation]] formalizes \(O,\Omega,\Theta\).
- [[cs/dsa/amortized-analysis-methods|Amortized Analysis]] differs: averages **across operations on a structure**, not across input instances.
- [[cs/dsa/time-complexity-analysis|Time Complexity — Analysis]] and [[cs/dsa/time-complexity-calculation|Time Complexity — Calculation]] provide techniques (summations, recurrences) to derive these bounds.

---

## Heuristics & Design Guidance
- If the **worst case matters**, prefer algorithms with strong worst-case guarantees (e.g., heapsort \(O(n\log n)\) vs quicksort's \(O(n^2)\)).
- If inputs are **well-mixed** and latency spikes are tolerable, exploit **average-case** winners (randomized quicksort, hash tables).
- Use **randomization** to defend against adversarial inputs (e.g., randomized pivoting, randomized hashing).
- Detect structure at runtime: switch to **insertion sort** on tiny subarrays or nearly sorted data; use **introsort** (quicksort → heapsort fallback) to combine average-case speed with worst-case safety.

---

## Common Pitfalls
> [!warning] Conflating "average" with "expected"
> "Average case" is an **expectation with respect to a specified distribution**. If the real inputs don't match that distribution, the claim may not hold.

> [!warning] Ignoring adversaries
> Deterministic choices (first/last-element pivot) are exploitable; an attacker can force worst-case \(O(n^2)\) in quicksort or \(O(n)\) in hash tables.

> [!warning] Misusing best-case
> Best-case bounds do not imply typical fast performance; they only show what's **possible**, not what's **likely**.

> [!tip] Prefer transparent assumptions
> State the input model (uniform permutations, i.i.d. draws, or algorithmic randomization). If in doubt, **prove** a worst-case bound and **measure** empirical averages.

---

## Practical Context
- **Libraries**: Many standard libraries use **introsort** (quicksort with median-of-three + heapsort fallback) to mitigate worst-case while keeping average speed.
- **Systems**: Hash tables rely on load-factor control and good hash functions (sometimes randomized) to ensure expected \(O(1)\).
- **Data skew**: Real-world keys are rarely uniform; evaluate with **profiles** and **benchmarks** that mirror production distributions.

---

## Summary
- **Worst case**: guarantees performance under **any** input; may be pessimistic.
- **Average case**: expectations under **stated distributions**; powerful but model-sensitive.
- **Best case**: demonstrates adaptability; not a guarantee.
- Use **randomization** and **fallbacks** to combine strong typical performance with safety against adversaries.

---

## See also
- [[cs/dsa/asymptotic-notation|Asymptotic Notation]]
- [[cs/dsa/amortized-analysis-methods|Amortized Analysis]]
- [[cs/dsa/time-complexity-analysis|Time Complexity — Analysis]]
- [[cs/dsa/time-complexity-calculation|Time Complexity — Calculation]]
