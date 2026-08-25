---
title: "Value Categories: lvalue, xvalue, prvalue"
description: "Why C++ has three value categories instead of two, how they fall out of two independent yes-or-no questions, and how the category of an argument expression decides which overload the compiler picks."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-18
updated:
aliases: []
---

Every C++ expression carries two labels. One is its type, which is what people mean when they say what an expression is. The other is its value category, which is what the compiler actually consults when deciding whether the expression can be assigned to, whether its address can be taken, and, most consequentially, which of two overloads gets called. cppreference puts the two on equal footing: each expression "is characterized by two independent properties: a type and a value category."

> [!note] The idea
> The three categories are not three points on a scale from "real object" to "temporary." They are the three occupied corners of a two-by-two grid formed by two unrelated yes-or-no questions: does this expression have identity, and can it be moved from? Three corners are occupied, one is empty, and the reason C++ has a taxonomy that feels arbitrary is that a fourth name was never needed. Learning the grid makes the rules stop being a list to memorize.

## The taxonomy as written

The working draft states the partition first and the definitions second. "Every expression belongs to exactly one of the fundamental categories in this taxonomy: lvalue, xvalue, or" prvalue, and the two mixed names sit above them: a glvalue is an lvalue or an xvalue, an rvalue is a prvalue or an xvalue.

The definitions are short. A glvalue is an expression whose evaluation determines the identity of an object, function, non-static data member, or a direct base class relationship. A prvalue is an expression whose evaluation initializes an object or computes the value of an operand of an operator. "An xvalue is a glvalue that denotes an object whose resources can be reused," usually because it is near the end of its lifetime. An lvalue is a glvalue that is not an xvalue.

Note what the definitions are about. They classify expressions, not objects and not values. `std::move(x)` and `x` denote the same object; they are different expressions in different categories.

## Two questions, three answers

The three-way split is a C++11 artifact, and cppreference records the reasoning directly. "With the introduction of move semantics in C++11, value categories were redefined to characterize two independent properties of expressions": whether the expression has identity, meaning you can tell whether it refers to the same entity as another expression, and whether it can be moved from, meaning a move constructor or move assignment operator can bind to it.

Cross the two and the naming falls out mechanically. Expressions that "have identity and cannot be moved from are called lvalue expressions." Expressions that "have identity and can be moved from are called xvalue expressions." Expressions that do not have identity but can be moved from are prvalues. And the fourth corner, expressions that "do not have identity and cannot be moved from are not used," which is to say the language never needed to name something you can neither locate nor consume.

The umbrella names are then just projections of the grid onto one axis each. Glvalue is the has-identity row. Rvalue is the can-be-moved-from column. They overlap in the xvalue corner, which is exactly why the two older names could not have been kept as a two-way split: `std::move(x)` has identity and is movable, so it belongs to both.

The vocabulary itself is older than C++. cppreference credits the origin plainly: "The programming language CPL was first to introduce value categories for expressions," with left-hand and right-hand referring to the sides of an assignment. C inherited the split and reinterpreted lvalue as locator value. C++11 kept the words and replaced their meaning, which is why the historical gloss about the left side of an assignment now misleads more than it helps. See [[cs/pl/history-genealogy-of-languages|the genealogy of languages]] for how often that pattern repeats.

## What the category actually decides

The payoff is overload resolution. cppreference gives the rule in one sentence: when an expression is used as a function argument and two overloads are available, one taking an rvalue reference parameter and the other a const lvalue reference, "an rvalue binds to the rvalue reference overload." That is the entire mechanism behind [[cs/languages/Cpp/move-semantics-and-rvalue-references|move semantics]]. There is no runtime test of whether a temporary is expiring. The compiler classifies the argument expression, and the classification picks the constructor.

Several smaller rules are corollaries. The address of an rvalue "cannot be taken by built-in address-of operator," so `&std::move(x)` and `&42` are both invalid. An rvalue cannot be the left operand of built-in assignment. Binding an rvalue to a const lvalue reference extends the temporary's lifetime "until the scope of the reference ends," which is the rule that makes `const auto& r = f();` safe.

Identity has a runtime consequence too. A glvalue may be polymorphic, meaning "the dynamic type of the object it identifies is not necessarily the static type of the expression," while a prvalue cannot be, since "the dynamic type of the object it denotes is always the type of the expression." Virtual dispatch needs an object to ask, and only the has-identity row has one to point at.

> [!warning] A named rvalue reference is an lvalue
> This is the rule that costs people a day. cppreference states it without hedging: "Even if the variable's type is rvalue reference, the expression consisting of its name is an lvalue expression." A parameter declared `T&& x` is an rvalue reference, and every use of `x` inside the function is an lvalue, so passing it onward copies unless you write `std::move(x)` again. The type and the category are the two independent labels, and here they disagree on purpose: an object with a name can be used more than once, so the language refuses to treat naming it as consuming it. The narrow exception is a `return` statement, where a move-eligible expression naming a local "is treated either as an rvalue or as an lvalue" for overload resolution, which is how `return local;` selects the move constructor without an explicit cast.

## C++17 changed what a prvalue is

The original C++11 grid treated a prvalue as an unnamed temporary object, which meant returning one involved a copy or a move that compilers were permitted, but not required, to elide. C++17 broke that identification. In cppreference's summary of the revision, "copy elision was made mandatory in some situations, and that required separation of prvalue expressions from the temporary objects initialized by them."

The result is that a prvalue is now closer to a recipe than a thing. "Since C++17, a prvalue is not materialized until needed, and then it is constructed directly into the storage of its final destination." The standard does not describe this as an optimization, because nothing is being elided: "there is no longer a temporary to copy/move from." A function can return a type with no accessible copy or move constructor at all, and the prvalue in the `return` statement constructs the caller's object in place.

The C++11 grid still explains the names, with one amendment: prvalues are no longer moved from, because there is nothing there yet to move. That reframing puts value categories in the same territory as [[cs/pl/ownership-and-linear-types|linear types]], where the question is not what an expression evaluates to but how many times its result may be used, and it is a cleaner answer to the question [[cs/pl/language-design-values-variables-environments|values, variables, and environments]] poses about what a variable reference denotes.

## Related Notes

- [[cs/languages/Cpp/move-semantics-and-rvalue-references|Move Semantics and Rvalue References]] - the feature the third category was invented to support
- [[cs/pl/ownership-and-linear-types|Ownership and Linear Types]] - use-once reasoning stated as a type discipline instead of an expression taxonomy
- [[cs/pl/language-design-values-variables-environments|Language Design: Values, Variables, and Environments]] - the general question of what a name denotes
- [[cs/pl/history-genealogy-of-languages|History and Genealogy of Languages]] - where lvalue and rvalue came from, and why the original gloss no longer fits
- [[cs/languages/Rust/ownership-and-moves|Ownership and Moves in Rust]] - a language that made the move the default rather than an overload you opt into

## Sources

- "Value categories," cppreference.com. https://en.cppreference.com/w/cpp/language/value_category.html . Supports type and value category as two independent properties, the three primary categories, the C++11 redefinition around identity and movability including the unused fourth corner, the CPL origin of the terms, rvalues binding to the rvalue reference overload, the address-of and assignment restrictions, lifetime extension through a const lvalue reference, glvalue polymorphism versus prvalue non-polymorphism, a named rvalue reference being an lvalue, move-eligible expressions in return statements, and the C++17 separation of prvalues from temporaries.
- "Value category," C++ working draft, eel.is/c++draft. https://eel.is/c++draft/basic.lval . Supports the normative partition into exactly one of lvalue, xvalue, or prvalue, and the definitions of glvalue, prvalue, xvalue, lvalue, and rvalue.
- "Copy elision," cppreference.com. https://en.cppreference.com/w/cpp/language/copy_elision.html . Supports C++17 prvalue semantics: a prvalue is not materialized until needed and is constructed directly into its final destination, and there is no longer a temporary to copy or move from.
