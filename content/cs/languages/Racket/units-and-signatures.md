---
title: Units and Signatures in Racket
description: "First-class parameterized components, why linking exists alongside require, and the mutual-dependency problem modules cannot express."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-24
updated:
aliases:
  - Racket Units
  - define-signature
  - Racket Components
---

Racket already has a module system that is static, checkable, and separately compilable. It then ships a second modularity form, `unit`, that most Racket programmers never touch. The obvious question is why a language would want two, and the honest answer is that the first one has a specific hole in it that no amount of `require` cleverness fills.

> [!note] The idea
> [[cs/languages/Racket/the-module-system-and-require-provide|A module names the binding you want]]; a unit names a binding that meets a specification and defers the choice to link time. The reason that second thing has to exist as a separate form is structural rather than stylistic. Because namespace management is closely related to separate expansion and compilation, module boundaries end up as separate-compilation boundaries in a way that prohibits mutual dependencies among fragments. A module graph must be acyclic, which is the same constraint that makes [[cs/dsa/topological-sorting|a build order computable at all]]. Units buy back the cycle by moving the connection from a name to a value.

## A signature is an interface with no implementation attached

The interface of a unit is described in terms of signatures, each defined with `define-signature`, normally inside an ordinary module. A signature is a list of names, and by convention signature names end with `^`:

```racket
#lang racket
(define-signature toy-factory^
  (build-toys   ; (integer? -> (listof toy?))
   repaint      ; (toy? symbol? -> toy?)
   toy?         ; (any/c -> boolean?)
   toy-color))  ; (toy? -> symbol?)
(provide toy-factory^)
```

An implementation is a unit written with `define-unit` whose `export` clause names the signature, and by convention unit names end with `@`. A consumer names the same signature in its `import` clause:

```racket
(define-unit toy-store@
  (import toy-factory^)
  (export toy-store^)
  ...)
```

The load-bearing detail in the Guide's example is a negative one. The store's file requires `toy-factory-sig.rkt` but never requires `simple-factory-unit.rkt`, so the `toy-store@` unit relies only on the specification of a toy factory, not on a specific implementation. Under plain `require`, naming a function means naming the module that defines it. Under units, the name and the source are separated by design, which is the same separation [[cs/pl/type-classes-and-traits|a type class draws between a signature and its instances]], reached from the other direction: Racket resolves it by explicit linking rather than by inference over types.

## Units are values, and linking is an operation on them

The Reference frames units as a fourth abstraction alongside procedures, classes, and modules. A unit resembles a procedure in that both are first-class values that are used for abstraction. While procedures abstract over values in expressions, units abstract over names in collections of definitions. A procedure is called to evaluate its expressions given actual arguments; a unit is invoked to evaluate its definitions given actual references for its imported variables.

The step that has no procedure analogue comes before invocation. A unit's imported variables can be partially linked with the exported variables of another unit prior to invocation, and linking merges multiple units together into a single compound unit. `define-compound-unit/infer` links any number of units into a combined unit. It can propagate imports and exports from the linked units, and it can satisfy each unit's imports using the exports of other linked units, inferring the connections from the signatures each side mentions.

Partial linking is the whole trick. A half-linked unit is still a value, still passable, still storable, and still unevaluated.

> [!example] The cycle that breaks `require`
> Make the factory cooperate with the store: instead of repainting, the factory builds toys in the store's color, which it gets by importing `toy-store^`. Now the store imports `toy-factory^` and the factory imports `toy-store^`. To invoke `store-specific-factory@` you need `toy-store^` bindings; to get those by invoking `toy-store@` you need a toy factory. The unit implementations are mutually dependent, and we cannot invoke either before the other. Two modules in this shape are a cyclic require, which Racket rejects. The solution is to link the units together, and then we can invoke the combined units. Linking resolves the cycle because it wires references without running anything, and invocation happens once, afterward, on the merged whole.

## What each form is actually for

The Guide's own comparison is unusually crisp about the division of labor. The `module` form is primarily for managing a universal namespace: it lets a fragment refer specifically to `car` from `racket/base`, the one that extracts the first element of a pair, as opposed to any of the other functions in the world named `car`. In other words, the module construct lets you refer to the binding that you want.

The `unit` form is for parameterizing a code fragment with respect to most any kind of run-time value. It lets a fragment work with some `car` function of one argument where the specific function is determined later by linking. In other words, the unit construct lets you refer to a binding that meets some specification.

`module` is the more fundamental of the two. A program fragment cannot reliably refer to a `lambda`, `class`, or `unit` form without the namespace management that `module` provides, so units live inside modules and signatures are exported by modules. The cost of that foundational role is the acyclicity constraint above, plus a second limitation: for similar reasons, `module` does not separate interface from implementation. A module's exports are whatever its definitions happen to be. There is no artifact you can compile against and swap behind.

The recommendation follows mechanically. Use `unit` when `module` by itself almost works, but when separately compiled pieces must refer to each other, or when you want a stronger separation between interface, meaning the parts that need to be known at expansion and compilation time, and implementation, meaning the run-time parts.

> [!warning] Why you rarely see units in the wild
> Units solve a problem most programs do not have. The mutual-dependency case is real but uncommon, and the interface-implementation split is usually satisfied well enough by [[cs/languages/Racket/contracts-and-blame|attaching contracts at the module boundary]], which the unit system also supports by putting contracts in signatures. The result is a form that is architecturally important and practically niche, which is worth knowing before you reach for it: the ceremony of signature files, unit files, and an explicit link step is real cost, and it buys nothing if your dependency graph was already a DAG.

The deeper lesson generalizes past Racket. Every module system has to choose whether an import names a place or names a shape. Naming a place gives you fast, statically resolved bindings and forces the graph acyclic. Naming a shape gives you late binding, mutual recursion, and multiple implementations, at the cost of an explicit assembly step. ML functors, OSGi bundles, and dependency-injection containers are all the second answer wearing different clothes. Racket is unusual mainly in shipping both answers as separate forms and telling you plainly which problem each one solves.

## Related Notes

- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the general theory, including ML functors as the closest relative of the unit
- [[cs/languages/Racket/the-module-system-and-require-provide|The Module System and require/provide]] - the form units complement, and the acyclicity it enforces
- [[cs/dsa/topological-sorting|Topological Sorting]] - why an acyclic dependency graph is the precondition for a compile order
- [[cs/pl/type-classes-and-traits|Type Classes and Traits]] - the same interface-versus-instance split resolved by inference instead of linking
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the other Racket form that parameterizes code over values chosen later
- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame]] - what a signature carries when you want the interface checked rather than merely named

## Sources

- "14 Units (Components)," The Racket Guide. https://docs.racket-lang.org/guide/units.html . Supports units organizing a program into separately compilable and reusable components, the procedure analogy and the values-versus-names distinction, invocation given actual references for imported variables, partial linking prior to invocation, and linking as merging units into a compound unit.
- "14.1 Signatures and Units," The Racket Guide. https://docs.racket-lang.org/guide/Signatures_and_Units.html . Supports signatures as the description of a unit interface, `define-signature` inside a module, the `^` and `@` naming conventions, the toy factory and toy store example, and the store unit relying only on the specification rather than a specific implementation.
- "14.3 Linking Units," The Racket Guide. https://docs.racket-lang.org/guide/Linking_Units.html . Supports the store-specific factory example, the mutual dependency that blocks invocation of either unit, linking as the solution, and `define-compound-unit/infer` propagating imports and exports and satisfying imports from other linked units.
- "14.7 unit versus module," The Racket Guide. https://docs.racket-lang.org/guide/unit_versus_module.html . Supports the universal-namespace role of modules, the binding-you-want versus binding-meeting-a-specification contrast, parameterization over run-time values, module boundaries as separate-compilation boundaries prohibiting mutual dependencies, modules not separating interface from implementation, and the guidance on when to reach for units.
