---
title: "The Borrow Checker: NLL and Polonius"
description: "What the checker actually computes, what non-lexical lifetimes changed about it, and what a datalog reformulation is meant to buy."
draft: false
comments: true
tags:
  - cs
  - languages
  - formal-methods
date: 2026-07-14
updated:
aliases:
  - NLL
---

The borrow checker has a one-sentence job: values may not be mutated or moved while they are borrowed. Every difficulty is in the second half of that sentence, because knowing whether a value is borrowed at a given moment requires knowing where each outstanding reference is still in play. Whenever you create a borrow, the compiler assigns the resulting reference a lifetime, corresponding to the span of the code where the reference may be used, and it infers that lifetime to be the smallest one that still encompasses all the uses of the reference.

"Smallest that covers all uses" sounds like a definition. It is actually a design choice, and until 2018 Rust implemented a coarser approximation of it.

> [!note] The idea
> A lifetime in the borrow checker is not a span of source text. It is a set of points in the control-flow graph. That reframing is the entire content of non-lexical lifetimes, and everything else follows from it: the analysis stops being a question about nesting of blocks and becomes a dataflow problem over a graph, solved by constraint propagation. The names in your source (`'a`, `'static`) are surface syntax for sets the compiler computes; the compiler never reasons about braces.

## What lexical lifetimes got wrong

Rust distinguishes two things that English calls a lifetime. The lifetime of a reference is the span of time in which that reference is used. The lifetime of a value is the span before it is freed, and to keep them apart the RFC calls the second one the value's scope. A reference's lifetime cannot outlive the scope of the value it points into, or you would be pointing into freed memory.

The old checker tied lifetimes to scopes, and scopes are lexical. Assigning a reference into a variable meant its lifetime must be as large as the entire scope of that variable, so `let slice = &mut data[..];` poisoned `data` until the end of the block even if `slice` was never touched again after line two. The workaround was to wrap the borrow in an artificial inner block, which is a change to the program's shape made to satisfy an analysis rather than to express anything. The RFC's stated goal was to eliminate many common cases where small, function-local code modifications would be required to pass the borrow check.

Conditional control flow was worse. A `match` on `map.get_mut(&key)` borrows the map for the whole `match`, including the `None` arm where the map is demonstrably not borrowed, because the innermost expression enclosing all uses is the `match` itself. Lexical scoping cannot see that a branch not taken does not use the reference. A control-flow graph can.

## What the checker computes now

MIR, the compiler's mid-level IR, is organized into a control-flow graph rather than an abstract syntax tree, with basic blocks of discrete statements and a terminator. Reframing the analysis on top of that [[cs/pl/intermediate-representations-and-ssa|intermediate representation]] is what makes the precision available: NLL considers lifetimes as a set of points in the control-flow graph. If a lifetime contains point P, references with that lifetime are valid on entry to P.

Two ingredients generate the sets. The first is liveness, borrowed from classical compiler analysis: a variable is live if the current value that it holds may be used later. The subtlety is that a variable can be dead in the stretch just before it is reassigned, even though the variable will be used again, because the value currently in it will not be. Traditional compilers compute liveness for variables; the borrow checker wants liveness for lifetimes, which it gets by saying a lifetime is live at P when some variable live at P has that lifetime in its type.

The second is outlives constraints, written as one lifetime outliving another at a particular point. Liveness seeds points into lifetime sets, subtyping relationships propagate them, and the solution is the least fixed point. The RFC is explicit that the inference algorithm aims to pick the minimal lifetimes for each borrow which could possibly work, since minimal lifetimes impose the fewest restrictions. That is the formal content of "smallest that covers all uses": not a heuristic, a least solution to a constraint system.

The practical result is the one every Rust programmer has felt without naming. A borrow ends at its last use, not at the closing brace, and the language's [[cs/pl/ownership-and-linear-types|ownership discipline]] stopped requiring cosmetic blocks to express what the programmer already meant.

## What NLL did not fix

The RFC ships an appendix of what it will not fix, and the entries share a shape: these are generally errors that cross procedural boundaries in some form or another. A closure captures the whole local rather than the sub-path it uses. Two methods that touch disjoint fields still both borrow `self`, because the analysis inside `bar` sees only the signatures. And the last one is the one with the longest afterlife: the inability to have self-referential structs, a struct storing an arena and pointers into that arena that you can then move. The RFC notes that for the case of futures especially this matters, which is the thread that ends in [[cs/languages/Rust/async-rust-futures-and-pinning|pinning]].

The pattern is that the checker is intraprocedural. It reasons with total precision about the control-flow graph of one function and reasons about everything else through signatures. Precision inside a function was the achievable win; precision across a signature would be a different language.

## Polonius

Polonius is a reformulation of the same analysis, not a new set of rules. The project describes itself as a core library that models the borrow check, implementing an analysis published as a blog post, and the name comes from the famous quote "Neither borrower nor lender be," spoken by the character Polonius in *Hamlet*.

The technical difference is the framing. NLL asks, for each lifetime, which points it contains. Polonius inverts it and asks, for each point, which loans are live there, and states the whole computation as datalog rules over relations rather than as handwritten dataflow code. Expressing a static analysis as [[cs/math/predicate-logic-and-quantifiers|logical rules]] and letting a solver take the fixed point is a well-worn compiler technique, and it buys two things that matter more than elegance: the rules are the specification, and the rules can be tested against a reference implementation independently of the compiler that eventually runs them.

The status is candid. Polonius has been provisionally integrated into rustc and can be tried with a nightly `-Zpolonius` flag, but it is not really ready for widespread use. The roadmap has two steps before replacement. Polonius represents only a portion of the full borrow checker analysis, and the team would like to move as much as possible from the handwritten Rust code in rustc into the datalog-based approach. Then optimization, because naively implementing the rules can be quite slow. After both, the plan is to replace the existing rustc borrow checker with the polonius crate.

> [!warning] A rejected program is not necessarily an unsound one
> Both analyses are conservative by construction, and both reject correct programs. NLL narrowed the gap between "sound" and "accepted" by changing what a lifetime is; Polonius aims to narrow it further by changing how the question is asked. Neither closes it, and neither could: the checker approves programs it can prove safe, and the set of safe programs is not decidable. That is why [[cs/languages/Rust/unsafe-rust-and-its-contract|unsafe]] exists as a language feature rather than as an admission of defeat.

## Related Notes

- [[cs/languages/Rust/borrowing-and-lifetimes|Borrowing and Lifetimes in Rust]] - the surface-level rules this analysis implements
- [[cs/languages/Rust/async-rust-futures-and-pinning|Async Rust, Futures, and Pinning]] - the self-referential-struct limitation the NLL appendix flagged, and what was built around it
- [[cs/pl/intermediate-representations-and-ssa|Intermediate Representations and SSA]] - why a control-flow graph IR is what made the precision reachable
- [[cs/pl/ownership-and-linear-types|Ownership and Linear Types]] - the type-theoretic account of the discipline being checked
- [[cs/math/predicate-logic-and-quantifiers|Predicate Logic and Quantifiers]] - the rule-and-relation form a datalog analysis is written in
- [[cs/security/use-after-free-and-heap-exploitation|Use-After-Free and Heap Exploitation]] - the bug class the whole apparatus exists to make unreachable

## Sources

- "RFC 2094: Non-lexical lifetimes," The Rust RFC Book. https://rust-lang.github.io/rfcs/2094-nll.html . Supports the borrow checker's basic rule, lifetime versus scope, smallest-lifetime inference, the goal of removing function-local workarounds, the variable-assignment and conditional-control-flow problem cases, MIR as a control-flow graph, lifetimes as sets of CFG points, the liveness definition and its extension to lifetimes, minimal-lifetime inference, and the appendix of unfixed cross-procedural limitations including self-referential structs.
- "What is Polonius?," the Polonius book. https://rust-lang.github.io/polonius/ . Supports Polonius being a library that models the borrow check and the origin of its name.
- "Current status and roadmap," the Polonius book. https://rust-lang.github.io/polonius/current_status.html . Supports the provisional rustc integration and the nightly flag, the not-ready caveat, the partial coverage of the full analysis, the datalog migration and optimization roadmap, and the intent to replace the existing borrow checker.
