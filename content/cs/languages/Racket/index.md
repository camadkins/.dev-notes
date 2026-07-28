---
title: Racket
description: "MoC for Racket - language design experiments, macros, and course-related artifacts."
draft: false
comments: false
tags:
  - cs
  - languages
date: 2025-10-16
updated:
aliases: []
---
**About.** Racket notes live here. Use this page to group Racket-specific materials (design sketches, macro experiments, interpreter bits). Quartz will auto-list any pages placed under this folder.

- [[cs/languages/Racket/s-expressions-and-evaluation|S-Expressions and Evaluation]] - the reader and expander as two layers, and what a datum is
- [[cs/languages/Racket/language-design-from-core-to-surface-racket|From Core to Surface]] - macro expansion and desugaring from a rich surface syntax into a small core
- [[cs/languages/Racket/hygienic-macros-and-syntax-rules|Hygienic Macros and syntax-rules]] - pattern macros, ellipses, and the scope-set mechanism behind hygiene
- [[cs/languages/Racket/continuations-and-call-cc|Continuations and call/cc]] - delimited continuations, prompts, and escape versus re-entrant use
- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame]] - boundaries, the arrow combinator, and the flat/chaperone/impersonator hierarchy
- [[cs/languages/Racket/structs-and-pattern-matching|Structs and Pattern Matching]] - transparency, generativity, and the `match` form