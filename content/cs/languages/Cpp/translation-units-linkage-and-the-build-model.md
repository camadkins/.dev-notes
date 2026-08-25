---
title: Translation Units, Linkage, and the Build Model
description: "The nine translation phases, why the preprocessor makes every header cost once per source file, what internal and external linkage actually control, and why this model produces the build times it does."
draft: false
comments: true
tags:
  - cs
  - languages
  - build-systems
date: 2026-08-04
updated:
aliases: []
---

The unit C++ compiles is not a file and not a program. cppreference names the input and the output separately: "The text of a C++ program is kept in units called source" files, and those source files undergo translation to become a translation unit. The distinction sounds pedantic until you count the work. A source file is a few hundred lines you wrote. A translation unit is that file with every header it names pasted in, transitively, and it can run to hundreds of thousands of lines before the compiler proper has looked at a single declaration.

> [!note] The idea
> C++ separate compilation is a two-level system with a hole in the middle. Below the line, the preprocessor is a text splicer that knows nothing about types; above the line, the linker matches names and knows nothing about text. Neither one understands the language, and no stage sees more than one translation unit at a time. Every characteristic property of a C++ build follows from that gap, including the compile times, the header discipline, the reason `static` at namespace scope means something unrelated to `static` on a member, and the reason a mismatched declaration is a runtime bug rather than a compile error.

## Nine phases, and where the cost is

The standard lays out translation as nine phases. "Translation is performed as if in the order from phase 1 to phase 9. Implementations behave as if these separate phases occur, although in practice different phases can be folded together." The as-if is important: nothing requires a real preprocessor pass, only that the result match one.

Phases 1 through 3 map bytes to characters, splice backslash-continued lines, and lex the result into preprocessing tokens. Phase 4 runs the preprocessor, and it contains the sentence that explains C++ build times better than any benchmark: "Each file introduced with the `#include` directive goes through phases 1 through 4, recursively." A header is not compiled once and cached. It is re-read, re-lexed, and re-preprocessed in every translation unit that includes it, and again for every file that includes a file that includes it. Fifty source files that each pull in the same 40,000-line header do that work fifty times. By the end of phase 4 "all preprocessor directives are removed from the source," and the compiler receives text with no memory of where any of it came from.

Phase 7 is the compiler as most people picture it: "The tokens are syntactically and semantically analyzed and translated as a translation" unit. Phase 8 handles templates, examining each translation unit "to produce a list of required template instantiations, including the ones requested by explicit" instantiations. Phase 9 links: translation units, instantiation units, and "library components needed to satisfy external references are collected into a program image which contains information needed for execution in its execution environment."

Templates make the duplication worse before the linker makes it better. cppreference notes that some compilers skip instantiation units entirely and "simply compile each template instantiation at phase 7, storing the code in the object file where it is implicitly or explicitly requested," after which "the linker collapses these compiled instantiations into one at phase 9." Every object file that used `std::vector<int>` emitted its own copy, and phase 9 threw away all but one. The work is done many times and kept once.

One caveat the standard adds, which matters more than it looks: "Source files, translation units and translated translation units need not necessarily be stored as files." The phases are a description of meaning, not a mandated pipeline of temp files.

## Linkage decides who can see a name

Compiling each translation unit alone leaves an obvious question at phase 9. Two files both define `helper`. Are those one entity or two? Linkage is the answer, and it is a property of a name rather than of a symbol table.

The four kinds partition by reach. "An entity whose name has external linkage can be redeclared in another translation unit," so the definitions refer to one entity and the linker is expected to resolve them together. "An entity whose name has internal linkage can be redeclared in another scope in the same translation unit," and nowhere else, so every file gets its own private copy. A name with no linkage can only be redeclared in the same scope. Module linkage, added in C++20, sits between the first two: names at namespace scope have module linkage "if their declarations are attached to a named module and are not exported, and do not have internal linkage."

The rules that assign linkage are where the language's oldest keyword overloading shows. At namespace scope, `static` on a variable or function gives it internal linkage, which has nothing to do with what `static` means on a class member. Namespace-scope `const` variables get internal linkage by default, which is why a `const int` in a header does not collide across files while a non-const one does. And "all names declared in unnamed namespaces or a namespace within an unnamed namespace, even ones explicitly declared" extern, have internal linkage, which is why the unnamed namespace has replaced file-scope `static` as the idiom for making something local.

External linkage carries one more property that reaches outside the language: "which makes it possible to link translation units written in different programming languages." That is the hook `extern "C"` uses, and the mechanism it selects is the subject of [[cs/languages/common/c-abi-and-ffi|the C ABI and foreign function interfaces]].

> [!warning] The linker matches names, not meanings
> Declare `void f(int)` in one translation unit and define `void f(long)` in another and you get a link error, because the mangled names differ. Declare a global as `extern int counter` in one and define it as `long counter` in another and you may get a program that links and then reads four bytes of an eight-byte object. Nothing in the model compares the two declarations, because nothing ever holds both. That gap is exactly what [[cs/languages/Cpp/the-one-definition-rule|the One Definition Rule]] papers over by decree, and it is why the rule is stated as a requirement on the programmer with no diagnostic attached.

The C++20 notion of a TU-local entity makes the hazard explicit. An entity is TU-local if its name has internal linkage, and cppreference's summary of what happens when one leaks into a non-local interface is direct: bad things, "usually violation of ODR," happen "if the type of a non-TU-local entity depends on a TU-local entity." An inline function in a header that mentions something from an unnamed namespace is not a style problem. It is a different function in every file that includes the header.

## What the model costs, and what it buys

The bill is a rough product: cost per translation unit, times number of translation units, with headers counted once per unit rather than once per project. That is why C++ projects grow forward-declaration discipline, precompiled headers, and the pimpl idiom, all of which are ways to shrink the transitive include set rather than to make compilation faster. It is also why the build is fundamentally a dependency graph over files, ordered by something equivalent to [[cs/dsa/topological-sorting|topological sorting]], and why touching one widely included header invalidates half of it.

What it buys is the property [[cs/pl/compilation-vs-interpretation|separate compilation]] exists for: "Translation units can be separately translated and then later linked to produce an executable program." Any translation unit can be rebuilt without the others, in parallel, on any machine, and libraries can ship as object code with headers rather than as source. That was the right trade when a compile was measured in minutes on one machine and the alternative was recompiling the world. Modules revisit the trade without abandoning it, and that is where [[cs/languages/Cpp/modules-and-the-include-model|modules and the include model]] picks up.

## Related Notes

- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - the general model separate compilation is one point in
- [[cs/languages/Cpp/the-one-definition-rule|The One Definition Rule]] - the consistency requirement the two-level model cannot check
- [[cs/languages/Cpp/modules-and-the-include-model|Modules and the Include Model]] - the C++20 attempt to charge for a header once
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - what external language linkage actually selects
- [[cs/dsa/topological-sorting|Topological Sorting]] - the ordering every build tool computes over the include graph
- [[cs/languages/Cpp/templates-code-bloat-and-link-time|Templates, Code Bloat, and Link Time]] - why phase 9 spends its time discarding duplicates

## Sources

- "Phases of translation," cppreference.com. https://en.cppreference.com/w/cpp/language/translation_phases.html . Supports source files becoming translation units, separate translation followed by linking, the nine phases and their as-if ordering, included files re-running phases 1 through 4 recursively, preprocessor directives being removed at the end of phase 4, phase 7 analysis, phase 8 producing the list of required template instantiations, phase 9 collecting units and library components into a program image, the note that some compilers emit each instantiation into every object file and let the linker collapse them, and the note that these entities need not be stored as files.
- "Storage class specifiers," cppreference.com. https://en.cppreference.com/w/cpp/language/storage_duration.html . Supports the four kinds of linkage and their redeclaration reach, module linkage attaching to a named module without export, unnamed-namespace names having internal linkage even when declared extern, external linkage carrying language linkage that permits linking units written in different languages, and TU-local entities causing ODR violations when a non-TU-local entity's type depends on one.
