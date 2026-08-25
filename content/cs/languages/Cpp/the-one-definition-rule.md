---
title: The One Definition Rule
description: "What the ODR actually requires, how inline functions and templates get a legal exemption from it, and why the standard explicitly excuses the compiler from telling you when you break it."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-24
updated:
aliases:
  - ODR
---

Two source files each define `struct S`. One says it has an `int x`. The other says it has an `int y`. Both compile. They link. The program runs, and one of the two files is now reading and writing a member that, by its own reckoning, is not there. cppreference states the outcome without softening it: "the behavior of the program that links them together is undefined."

Nothing in that story is a corner case. It is the ordinary consequence of a language where headers are copied into files and each file is compiled alone.

> [!note] The idea
> The One Definition Rule is not a prohibition on writing something twice. It is the rule that makes writing something many times mean writing it once, and the test it applies is textual: definitions in different translation units must consist of the same sequence of tokens and must resolve their names to the same entities. C++ needs a rule of this shape because its compilation model gives it no other way to know that two files agree. The rule then exempts the compiler from checking, because in general no component of the build sees both definitions at once.

## Three requirements wearing one name

The rule has layers, and conflating them is where most confusion starts.

Within one translation unit, the rule is a plain uniqueness constraint. Only one definition of any variable, function, class type, enumeration type, concept, or template is allowed in any one translation unit, though a name may be declared as many times as you like.

Across the program, the rule is an existence-and-uniqueness constraint on odr-used entities. One and only one definition of every non-inline function or variable that is odr-used is required to appear in the entire program, including any standard and user-defined libraries. The working draft splits the halves; the existence half reads "Every program shall contain at least one definition of every function or variable that is odr-used in that program." Miss it and cppreference says what you have already seen at a terminal: "If an entity is odr-used, its definition must exist somewhere in the program; a violation of that is usually a link-time error." That case is the friendly one. The duplicate case is not.

The third layer is the exemption, and it is the one that makes C++ compilable at all.

## The legal duplicates

Class types, enumeration types, inline functions, inline variables, and templated entities may be defined more than once in a program. That has to be true, because you cannot use a class without a definition of it, and the definition arrives by inclusion into every file that uses it. For an inline function or inline variable the requirement is inverted outright: a definition is required in every translation unit where it is odr-used, which is why `inline` on a function means "may be defined in many places," not primarily "please expand this at the call site."

The exemption is conditional, and the conditions are the actual content of the ODR. Each definition must appear in a different translation unit. "Each definition consists of the same sequence of tokens (typically, appears in the same header)." "Name lookup from within each definition finds the same entities (after overload" resolution, with narrow carve-outs for internal-linkage constants and lambdas. Corresponding entities must have the same language linkage in each definition, which is why an accidental `#include` inside an `extern "C"` block is a real bug rather than a style problem. And for templates, the requirements apply both to names at the point of definition and to dependent names at the point of instantiation, which folds the whole of two-phase lookup into the ODR.

Satisfy all of it and the reward is stated as a fiction: "If all these requirements are satisfied, the program behaves as if there is only one definition in the entire program." Fail any of it and the verdict is "Otherwise, the program is ill-formed, no diagnostic required."

## Why the violation is silent

Ill-formed, no diagnostic required is the standard's way of saying the program is wrong and nobody owes you a message. It is not carelessness. The condition being tested spans translation units, and by construction each of the legal duplicate definitions lives in a different one. A compiler invocation sees one. Whatever compares them afterward is matching symbol names, not token streams, so two `struct S` definitions with the same name and different members present identically at that boundary.

The result is the failure mode that makes the ODR feared rather than merely known: the program builds cleanly, the tests pass on the developer's machine, and the misbehavior appears only when a particular pair of object files ends up in the same binary in a particular order. The C comparison sharpens what C++ gave up here. In C there is no program-wide ODR for types at all, and extern declarations of the same variable in different translation units may have different types as long as they are compatible; C++ demands token identity instead, and then declines to enforce it. cppreference's own advice for the duplicate-name case is blunt: "This is usually resolved with unnamed" namespaces, which is the tool for giving a definition internal linkage so it stops being a candidate for cross-file matching.

This is the same bargain [[cs/languages/common/undefined-behavior-as-a-contract|undefined behavior as a contract]] strikes everywhere in the language, applied to the build rather than to an expression. The programmer promises consistency; the toolchain assumes it; nobody verifies it. It is also the reason mixing two versions of a library's headers into one binary is a linkage hazard rather than an inconvenience, which is part of what the compatibility promises in [[cs/software-engineering/semantic-versioning|semantic versioning]] are actually protecting.

> [!warning] Odr-use is narrower than use, and one of the exceptions builds vtables
> An object is odr-used if its value is read, unless it is a compile-time constant, or written, or its address is taken, or a reference is bound to it. Reading a `static const int` member in a constant expression does not odr-use it, which is why the classic missing out-of-class definition only bites once someone binds a reference to it. Running the other direction, "A virtual member function is odr-used if it is not a pure virtual member function," and cppreference gives the reason in the parenthesis: "addresses of virtual member functions are required to construct the vtable." Declaring a virtual function and never calling it still requires a definition, because the table described in [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|object layout]] needs a slot filled.

## What modules change

The C++20 module system reaches directly into this rule. The exemption for multiple definitions carries a new precondition: "The definitions are not attached to a named" module. Entities that belong to a named module are not duplicated across translation units in the first place, so the exemption does not apply and is not needed.

The more interesting half is the diagnostic. Where the draft describes definitions of the same item in multiple translation units, the excuse is now scoped: "a diagnostic is required only if the definable item is attached to a named module and a prior definition is reachable" at the point where the later definition occurs. Attaching a definition to a named module is therefore the one way to move an ODR violation from silent to reported. [[cs/languages/Cpp/modules-and-the-include-model|Modules and the include model]] covers the rest of that shift, and [[cs/pl/modules-signatures-and-separate-compilation|modules, signatures, and separate compilation]] covers what languages that started with a real module boundary never had to write this rule for.

## Related Notes

- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the design the ODR substitutes for
- [[cs/languages/Cpp/modules-and-the-include-model|Modules and the Include Model]] - where the duplicate definitions stop being duplicates
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - the general shape of an unchecked promise
- [[cs/software-engineering/semantic-versioning|Semantic Versioning]] - the social protocol that keeps two header versions out of one binary
- [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|Virtual Dispatch, Vtables, and Object Layout]] - the table whose construction odr-uses every non-pure virtual function
- [[cs/languages/Cpp/templates-and-generic-programming|Templates and Generic Programming]] - the entities the exemption exists to permit

## Sources

- "Definitions and ODR," cppreference.com. https://en.cppreference.com/w/cpp/language/definition.html . Supports the one-definition-per-translation-unit rule, the program-wide rule for non-inline odr-used entities and its undefined behavior with no required diagnosis, the inline requirement of a definition in every translation unit where it is odr-used, the list of entities that may be defined more than once and the full set of conditions including same token sequence, same name lookup, language linkage and the named-module precondition, the as-if-one-definition guarantee and the ill-formed-no-diagnostic-required outcome, the C contrast and the struct S example being undefined, unnamed namespaces as the usual resolution, the informal definition of odr-use, the link-time-error framing, and virtual member functions being odr-used to construct the vtable.
- "One-definition rule," C++ working draft, eel.is/c++draft. https://eel.is/c++draft/basic.def.odr . Supports the requirement that every program contain at least one definition of every odr-used function or variable, and the rule that a diagnostic is required only when the definable item is attached to a named module and a prior definition is reachable.
