---
title: Template Instantiation and the Two-Phase Rule
description: "A template is not code until it is instantiated: where the point of instantiation falls, what the compiler checks at the definition versus at the use, and why the two can disagree with no diagnostic required."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-06-24
updated:
aliases: []
---

Compile a translation unit containing nothing but template definitions and the object file comes out empty. Not small. Empty. cppreference states the position plainly: a class template by itself is not a type, or an object, or any other entity, and no code is generated from a source file that contains only template definitions. In order for any code to appear, a template must be instantiated, meaning the template arguments must be provided so the compiler can generate an actual class or function. Until that happens the file holds a program for generating code, which is the sense in which templates belong to the [[cs/pl/macros-and-metaprogramming|metaprogramming]] family rather than to the type system.

[[cs/languages/Cpp/templates-and-generic-programming|The introduction to templates]] covers what triggers that generation and why members are stamped out one at a time. This note is about the two questions that follow and that cause most of the confusion: *where* in the program the generation is considered to happen, and *when* each part of the template body gets checked.

> [!note] The idea
> A template body is checked twice, at two different moments, against two different sets of visible declarations. Names that do not depend on a template parameter are resolved where the template was written. Names that do depend on one are resolved where it was used. The standard does not merely permit those two contexts to see different declarations, it defines a point of instantiation to pin the second one down, and then says that if two points of instantiation give a specialization different meanings under the one-definition rule, the program is ill-formed with no diagnostic required. Two-phase lookup is not a parsing curiosity. It is the mechanism that keeps a header-distributed template from meaning one thing in your translation unit and something else in mine.

## Phase one, at the definition

The rule for ordinary names is strict and surprises people the first time. cppreference states that non-dependent names are looked up and bound at the point of template definition, and that this binding holds even if at the point of template instantiation there is a better match. Its example defines `void g(double)`, then a class template whose member calls `g(1)`, and only afterwards declares `void g(int)`. In `main`, the direct call `g(1)` picks `g(int)`, the obvious better match. The call through the template picks `g(double)`, because that is what was visible when the template was written.

Nothing about the argument `1` depends on `T`, so the compiler had no reason to wait. It bound the name and moved on.

The compiler is not idle about dependent names in phase one either. cppreference notes that limited lookup, but not binding, of dependent names also takes place at template definition time, as needed to distinguish them from non-dependent names and to determine whether they are members of the current instantiation or of an unknown specialization. That classification is what the `typename` and `template` disambiguators exist to help with, and it is why a template with an obvious typo in a dependent expression can still fail before anyone instantiates it.

## Phase two, at the use

For the rest, cppreference states that the lookup of a dependent name used in a template is postponed until the template arguments are known, at which time non-ADL lookup examines function declarations with external linkage that are visible from the template definition context, while [[cs/languages/Cpp/argument-dependent-lookup|argument-dependent lookup]] examines declarations visible from either the definition context or the instantiation context. Its own summary of the asymmetry: adding a new function declaration after the template definition does not make it visible, except via ADL.

That is not an arbitrary restriction. cppreference gives the reason as guarding against violations of the one-definition rule, with a worked case. A library namespace defines `writeObject`, which streams its argument. Two separate translation units each define their own `operator<<` for `std::vector<int>` in their own namespace and call `writeObject`. If ordinary lookup ran from the instantiation context, the instantiation of `E::writeObject<vector<int>>` would have two different definitions, one using each operator, and cppreference observes that such a violation may not be detected by the linker, leading to one or the other being used in both instances. The narrowed lookup turns a silent miscompile into a compile error in both units.

## Where the point of instantiation falls

The working draft defines the position precisely. For a function template specialization, the point of instantiation immediately follows the namespace scope declaration or definition that refers to the specialization, unless the reference came from inside another template specialization in a context that depends on a template parameter, in which case the point of instantiation is that of the enclosing specialization. For a class template specialization the point immediately precedes the enclosing namespace-scope declaration instead of following it, which is what makes the class complete in time for the function that needed it.

Two consequences are worth carrying around. The draft states that a specialization for a class template has at most one point of instantiation within a translation unit, while a function template specialization may have several, with the end of the declaration sequence of the translation unit counting as an additional one. And it closes with the sentence that gives the whole design its teeth: if two different points of instantiation give a template specialization different meanings according to the one-definition rule, the program is ill-formed, no diagnostic required. That phrase belongs to the same family as the rest of the language's [[cs/languages/common/undefined-behavior-as-a-contract|no-diagnostic-required contracts]]. The compiler is allowed to assume you did not do it, and the linker will happily pick one meaning and keep going.

cppreference lists the specific ways a non-dependent name can change meaning between the two contexts and land you there: a type that was incomplete at the definition and complete at the instantiation, an instantiation that uses a default argument not yet defined at the point of definition, a constant expression at the point of instantiation that reads a `constexpr` object or function that was not defined at the point of definition, and a non-dependent class template specialization that turns out to be instantiated from a partial specialization that did not exist when the template was written. Every entry on that list is a header ordering problem.

## Explicit instantiation, and turning the demand off

Implicit instantiation is demand-driven. cppreference describes the trigger as code referring to a template in a context that requires a completely defined type, or where the completeness of the type affects the code, giving the contrast that constructing an object of the type instantiates it while constructing a pointer to it does not.

C++11 added the other direction. An explicit instantiation definition, written `template class Vec<int>;`, forces instantiation, may appear anywhere after the template definition, and for a given argument list is only allowed to appear once in the entire program, again with no diagnostic required. An explicit instantiation declaration, `extern template class Vec<int>;`, skips the implicit instantiation step so the code that would have triggered one uses the definition provided elsewhere, producing link errors if none exists. cppreference names the intended use directly: this can be used to reduce compilation times by explicitly declaring a template instantiation in all but one of the source files using it, and explicitly defining it in the remaining file. That is the standard's own answer to the instantiate-everywhere-and-merge-later build model, and it is the closest C++ came to [[cs/pl/modules-signatures-and-separate-compilation|separate compilation]] for generic code before modules.

One more detail that reads like a bug and is not: explicit instantiation definitions ignore member access specifiers, so parameter types and return types may be private.

> [!warning] Explicit instantiation is not specialization
> The two use adjacent syntax and do unrelated things. `template class N::Y<char*>;` generates code. `template<> class Y<char*> {...};` supplies different code. cppreference notes that explicit instantiation has no effect if an explicit specialization appeared before for the same set of template arguments, which is the language telling you which one wins when both are present.

## Related Notes

- [[cs/languages/Cpp/dependent-names-and-the-typename-keyword|Dependent Names and the typename Keyword]] - what phase one cannot decide, and the annotations that unblock the parser
- [[cs/languages/Cpp/argument-dependent-lookup|Argument-Dependent Lookup]] - the one lookup that gets to see the instantiation context
- [[cs/languages/Cpp/templates-code-bloat-and-link-time|Templates, Code Bloat, and Link Time]] - what the demand-driven model costs once every translation unit does it
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the compilation boundary templates never had
- [[cs/pl/macros-and-metaprogramming|Macros and Metaprogramming]] - the family of compile-time code generators instantiation belongs to
- [[cs/languages/Rust/generic-code-and-compile-times|Generic Code and Compile Times]] - the same demand-driven generation with a definition-site type check in front of it

## Sources

- "Class template," cppreference.com. https://en.cppreference.com/w/cpp/language/class_template.html . Supports a class template not being a type or entity and no code being generated from a file of template definitions, the implicit instantiation trigger and the object-versus-pointer contrast, explicit instantiation definitions and declarations including the once-per-program rule and the compile-time reduction technique, explicit instantiation having no effect after an explicit specialization, and access specifiers being ignored.
- "Dependent names," cppreference.com. https://en.cppreference.com/w/cpp/language/dependent_name.html . Supports binding of non-dependent names at the point of definition with the `g(double)` example, the postponed lookup of dependent names and the split between non-ADL and ADL visibility, the ODR-protection rationale with the `writeObject` example, the limited definition-time lookup that classifies dependent names, and the list of ways a non-dependent name can change meaning.
- "Point of instantiation," working draft, eel.is/c++draft. https://eel.is/c%2B%2Bdraft/temp.point . Supports the placement of the point of instantiation for function and class template specializations, the enclosing-specialization rule, the at-most-one point per translation unit for class templates, explicit instantiation definitions counting as instantiation points, and the ill-formed-no-diagnostic-required rule for conflicting meanings.
