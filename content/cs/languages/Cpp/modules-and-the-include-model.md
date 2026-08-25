---
title: Modules and the Include Model
description: "What textual inclusion actually costs, what a module unit replaces it with, and how attaching a declaration to a named module turns a class of silent ODR violation into a diagnosable one."
draft: false
comments: true
tags:
  - cs
  - languages
  - build-systems
date: 2026-08-16
updated:
aliases: []
---

`#include` is not a language feature. It is a directive to a text processor that runs before the compiler exists, and its entire semantics is: find that file and paste it here. Everything difficult about large C++ builds comes from taking that literally.

> [!note] The idea
> Modules do not primarily make compilation faster. They make a declaration have one identity. Under inclusion, the same header text is re-parsed into every translation unit and the resulting entities are declared equivalent by fiat, unverified. Under modules, a declaration is attached to a named module, that attachment travels with it, and two declarations attached to different modules are wrong in a way a compiler can see. The build-time win is a consequence of giving names an owner, not the reason for it.

## What inclusion costs

The cost is stated in one sentence of the translation phases: "Each file introduced with the #include directive goes through phases 1 through 4, recursively." Mapping, splicing, lexing, and preprocessing, once per including file, transitively. A header is not compiled once for the project. It is compiled once per translation unit that reaches it, and the count multiplies through the include graph.

Two further properties come along for free, and neither is desirable. First, inclusion is unordered and macro-sensitive: what a header means depends on what was defined before it was pasted, so the same text can produce different declarations in different files. Second, "At the end of this phase, all preprocessor directives are removed from the source," so by the time the compiler runs there is no record of which file anything came from. The compiler cannot tell you that two definitions disagree, because it only ever sees one of them. That is the gap [[cs/languages/Cpp/the-one-definition-rule|the One Definition Rule]] papers over, and the reason a violation is "ill-formed, no diagnostic required."

## What a module unit is

"A translation unit may have a module declaration, in which case it is considered a module" unit, and the declaration has to come first. "A named module is the collection of module units with the same module name." Within a module, "Module units whose declaration has the keyword export are termed module interface units," and for every named module "there must be exactly one module interface unit that specifies no module partition," the primary interface unit.

Visibility is opt-in rather than positional. "Module interface units can export declarations (including definitions), which can be imported by other translation units," and anything not marked `export` stays invisible to importers even though it sits in the same file. There is no separation of header from source required to get that; the interface is a keyword, not a file convention. That is the arrangement [[cs/pl/modules-signatures-and-separate-compilation|modules, signatures, and separate compilation]] describes languages having started with.

Importing is symmetric and transitive by choice: "All declarations and definitions exported in the module interface units of the given named module will be available in the translation unit using the import declaration," and a module may re-export another with `export import`. Ordering is constrained rather than free: "In module units, all import declarations (including export-imports) must be grouped after the module declaration and before all other declarations." An import is not a paste, so it cannot be sensitive to what precedes it, so the language simply forbids putting anything before it.

## The macro question, and the two escape hatches

The awkward part of the transition is that C++ code is full of headers whose meaning depends on macros. Modules handle this with two mechanisms, and the difference between them is instructive.

A header unit is the halfway house. "A header unit is a separate translation unit synthesized from a header." Importing one makes its declarations available, and unlike a module, "Preprocessor macros are also accessible (because import declarations are recognized by the preprocessor)." So macros come out of a header unit. What does not happen is the reverse: "preprocessing macros already defined at the point of the import declaration will not affect the processing of the header." The header is compiled once, on its own terms, and every importer gets the same result. That is exactly the property inclusion lacks, and exactly why a header configured by defining a macro before including it cannot be a header unit.

For those, there is the global module fragment, "which can be used to include headers when importing the headers is not possible." It begins with a bare `module;` and "only preprocessing directives can appear in the global module fragment," after which the real module declaration ends it. Inside a module unit proper, `#include` "should not be used in a module unit (outside the global module" fragment, because everything included would become part of the module. The global module fragment is a quarantined region where the old model still runs, which is the honest shape of a migration path rather than a clean break. The preprocessor is not going away; see [[cs/pl/macros-and-metaprogramming|macros and metaprogramming]] for what it is and why it is hard to displace.

## Attachment is the real change

The ODR consequence is where modules earn their place. "In general, if a declaration appears after the module declaration in a module unit, it is attached to that module." Attachment is a property of the declaration, and it is enforced: "If a declaration of an entity is attached to a named module, that entity can only be defined in that module," and all declarations of that entity must be attached to the same one.

Non-exported names get their own linkage tier. "If a declaration is attached to a named module, and it is not exported, the declared name has module" linkage, which sits between internal and external: visible across the module's own units, invisible outside. The old model had no way to express that, which is why every project invented a `detail` namespace and hoped.

> [!warning] Some ODR violations become diagnosable, and only some
> "If two declarations of an entity are attached to different modules, the program is ill-formed; no diagnostic is required if neither is reachable from the other." Read the second clause carefully. The improvement is conditional on reachability: when the compiler can see both declarations, the mismatch is an error you get told about, which is a genuine change from the inclusion model where the two definitions never met. When it cannot, the old excuse still applies. The general ODR rule now carries a matching precondition, exempting definitions that are "not attached to a named" module from the multiple-definition allowance in the first place. Modules narrow the silent-failure window rather than closing it.

## What actually changes in the build

Three things, in descending order of certainty.

Parsing work drops, because a module interface is a translation unit compiled on its own terms rather than text re-lexed inside every consumer. That is the direct inversion of the phase-4 rule above.

Insulation improves, because a change to a module's non-exported internals cannot affect importers by textual means, and macros no longer leak in either direction across an import.

And build ordering gets stricter, which is the cost nobody advertises. Under inclusion, translation units can be compiled in any order and in parallel, since each one carries its own copy of everything it needs, which is the property described in [[cs/languages/Cpp/translation-units-linkage-and-the-build-model|the build model]]. Under modules, importing a module requires its interface to have been compiled first, so the build acquires real edges between compilation steps. The dependency graph was always there; modules make the build system obey it. That is a better world and a slower adoption, which is roughly where the ecosystem has been for several years, and it is the same tradeoff [[cs/languages/common/module-systems-and-namespacing|module systems and namespacing]] surveys across languages that made the choice earlier.

## Related Notes

- [[cs/languages/Cpp/translation-units-linkage-and-the-build-model|Translation Units, Linkage, and the Build Model]] - the model modules are replacing, and the ordering freedom they give up
- [[cs/languages/Cpp/the-one-definition-rule|The One Definition Rule]] - the requirement attachment finally makes partly checkable
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the design many languages started with and C++ reached last
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - the preprocessor the global module fragment exists to accommodate
- [[cs/languages/common/module-systems-and-namespacing|Module Systems and Namespacing]] - how other languages draw the same boundary
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - the header-only convention that the instantiation model forced and modules complicate

## Sources

- "Modules," cppreference.com. https://en.cppreference.com/w/cpp/language/modules.html . Supports module declarations making a translation unit a module unit, named modules as collections of module units, interface units and the single primary interface unit, export controlling visibility, imports being grouped after the module declaration, header units being synthesized translation units that carry macros out but are not affected by macros defined at the import, the global module fragment permitting only preprocessing directives and existing for headers that cannot be imported, the prohibition on #include inside a module unit proper, declaration attachment and its definition and linkage consequences, and two declarations attached to different modules being ill-formed with a diagnostic required only when one is reachable from the other.
- "Phases of translation," cppreference.com. https://en.cppreference.com/w/cpp/language/translation_phases.html . Supports each included file re-running phases 1 through 4 recursively, and all preprocessor directives being removed by the end of phase 4.
- "Definitions and ODR," cppreference.com. https://en.cppreference.com/w/cpp/language/definition.html . Supports the ill-formed-no-diagnostic-required outcome for a failed ODR condition, and the requirement that the permitted duplicate definitions not be attached to a named module.
