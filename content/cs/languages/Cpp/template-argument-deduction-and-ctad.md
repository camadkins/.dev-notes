---
title: Template Argument Deduction and CTAD
description: "Why you never write the angle brackets on a call to std::sort, what the compiler is actually matching, the positions it refuses to look at, and how C++17 extended the same machinery to class templates."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-11
updated:
aliases:
  - CTAD
---

Nobody writes `std::sort<std::vector<int>::iterator>(v.begin(), v.end())`. The arguments say what the type is and the compiler reads it off them. cppreference states the deal plainly: in order to instantiate a function template, every template argument must be known, but not every template argument has to be specified, and when possible the compiler will deduce the missing template arguments from the function arguments. The convenience is total enough that the rules only become visible when they fail.

> [!note] The idea
> Deduction is a syntactic match between the written parameter type `P` and the argument type `A`, run once per `P`/`A` pair and then combined. It is not a search for the type you meant. cppreference fixes its position in the pipeline: deduction takes place after the function template name lookup (which may involve [[cs/languages/Cpp/argument-dependent-lookup|argument-dependent lookup]]) and before template argument substitution (which may involve [[cs/languages/Cpp/sfinae-and-enable-if|SFINAE]]) and overload resolution. Everything downstream, including every user-defined conversion, is unavailable to it. The compiler cannot want a type, it can only match one, so every confusing deduction error is either a position the rules refuse to read or two positions that read differently. That puts deduction closer to [[cs/pl/records-variants-and-pattern-matching|pattern matching]] on the shape of a declaration than to [[cs/pl/hindleymilner-type-inference|Hindley-Milner]] inference over a whole expression.

## Pair by pair, then combined

Deduction determines template arguments that can be substituted into each function parameter type `P` to produce a type the same as the argument type `A`, after a short list of adjustments. If there are multiple parameters, each `P`/`A` pair is deduced separately and the deduced template arguments are then combined. If deduction fails or is ambiguous for any pair, or if different pairs yield different deduced template arguments, or if any template argument remains neither deduced nor explicitly specified, compilation fails.

Two pairs disagreeing is a hard error, not a negotiation. cppreference's illustration calls `template<typename T> void bad(std::vector<T> x, T value = 1);` with a `std::vector<std::complex<double>>` and `1.2`. The first pair deduces `T = std::complex<double>`, the second `T = double`, and the annotation reads "error: deduction fails, T is ambiguous". A `double` converts to `std::complex<double>` perfectly well, but conversion is not deduction's job: type deduction does not consider implicit conversions, other than the type adjustments listed on the page, because that is the job for overload resolution, which happens later.

Those adjustments are mechanical. If `P` is not a reference type, an array `A` becomes a pointer, a function `A` becomes a function pointer, and otherwise the top-level cv-qualifiers of `A` are ignored. If `P` is a reference type, the referenced type is used instead.

## The positions the rules refuse to read

A **non-deduced context** is a position in `P` from which nothing may be deduced. There the types, templates, and non-type values used to compose `P` do not participate in template argument deduction, but instead use the template arguments that were either deduced elsewhere or explicitly specified. The consequence: if a template parameter is used only in non-deduced contexts and is not explicitly specified, template argument deduction fails.

The first entry is the one library authors weaponized: the nested-name-specifier, meaning everything to the left of the scope resolution operator `::`, of a type specified using a qualified-id. Nothing can be deduced from the left of a `::`, because the compiler would have to invert an arbitrary type computation to do it. Wrapping a parameter in an identity template therefore removes it from deduction on purpose, which is how the `bad` example above becomes a `good` one whose second parameter type is `typename identity<T>::type` and simply reuses the `T` the first pair deduced.

The rest of the list has the same character. The expression of a `decltype`-specifier is non-deduced, as is an array bound in which a subexpression references a template parameter, which is why `std::array<int, 2 * N>` cannot recover `N` while `std::array<int, N>` can. So is a parameter whose argument is an overload set that more than one function matches, none matches, or that includes a function template.

## Forwarding references get one special rule

Forwarding references are a special kind of references that preserve the [[cs/languages/Cpp/move-semantics-and-rvalue-references|value category]] of a function argument, making it possible to forward it by means of `std::forward`. The definition is syntactic: a function parameter of a function template declared as an rvalue reference to a cv-unqualified type template parameter of that same function template. `T&&` in `template<class T> int f(T&& x)` qualifies; `const T&&` does not, and cppreference marks that case with the comment "x is not a forwarding reference: const T is not cv-unqualified".

The machinery is one clause in the deduction rules. If `P` is an rvalue reference to a cv-unqualified template parameter and the corresponding function call argument is an lvalue, the type "lvalue reference to `A`" is used in place of `A` for deduction. Pass an lvalue `int` and `T` deduces to `int&`; pass an rvalue and `T` deduces to `int`. Reference collapsing finishes the job, since rvalue reference to rvalue reference collapses to rvalue reference and all other combinations form an lvalue reference, so `T&&` becomes `int&` in the first case and stays `int&&` in the second. cppreference notes that this pair of rules is what makes `std::forward` possible. One boundary is called out in the same clause: in class template argument deduction, a template parameter of a class template is never a forwarding reference.

## CTAD, and the guides behind it

C++17 extended the idea to class templates: every template argument must be known, not every one has to be specified, and in the listed contexts the compiler deduces them from the type of the initializer. Those contexts are any declaration that specifies initialization of a variable or variable template whose declared type is the class template, new-expressions, function-style cast expressions, and the type of a non-type template parameter. So `std::pair p(2, 4.5);` deduces to `std::pair<int, double>`.

The implementation reuses function template deduction rather than inventing a second algorithm. When the type specifier consists solely of the name of a primary class template `C` with no accompanying template argument list, a fictional function template is constructed from each constructor of `C`, taking that constructor's parameter list and returning `C` followed by the class template's parameters. A hypothetical `C()` is added when `C` declares no constructors, and in any case one more derived from a hypothetical `C(C)`, the copy deduction candidate. Overload resolution over that fictional set picks a winner, whose return type is the deduced specialization.

When the constructors do not carry the information, you write the guide yourself. Its syntax is that of a function declaration with a trailing return type, except that it uses the name of a class template as the function name. Guides are declarative only: they are not found by name lookup and do not participate in overload resolution except against other deduction guides when deducing class template arguments, and they cannot be redeclared in the same translation unit for the same class template.

> [!example] Why an iterator-pair constructor needs a guide
> cppreference declares `template<class T> struct container` with a `container(T t)` constructor and a constructor template `container(Iter beg, Iter end)`, then adds the guide `template<class Iter> container(Iter b, Iter e) -> container<typename std::iterator_traits<Iter>::value_type>;`. With it, `container c(7);` deduces `T = int` from an implicitly-generated guide, and `auto d = container(v.begin(), v.end());` on a `std::vector<double>` deduces `T = double`. The iterator constructor alone could never do this, because `T` appears nowhere in its parameter list. The guide bridges iterator to element by naming a computation deduction is forbidden to invert. `container e{5, 6};` is still an error, because there is no `std::iterator_traits<int>::value_type`.

## When CTAD does the surprising thing

The fictional overload set has a consequence that catches almost everyone once. Given a `std::vector<int> v1`, the declaration `std::vector v2{v1};` deduces `std::vector<int>`, not `std::vector<std::vector<int>>`. The braces request list-initialization, `std::vector` has an initializer-list constructor, and the ordinary rule is that an initializer-list constructor dominates in list-initialization, so wrapping is what the syntax appears to ask for. What happens is copying.

The copy deduction candidate is a real member of the fictional set, and it usually wins the partial order outright. cppreference states this from both directions. In overload resolution, partial ordering takes precedence over whether a function template is generated from a user-defined deduction guide, and because the copy deduction candidate is typically more specialized than a wrapping constructor, this rule means that copying is generally preferred over wrapping. Stated as a rule about initializers: when initializing from a single argument of a type that is a specialization of the class template at issue, copying deduction is generally preferred over wrapping by default.

It was not always so, and the history is the argument for the current behavior. Defect report P0702R1, applied retroactively to C++17, records the behavior as published as an initializer-list constructor being able to pre-empt the copy deduction candidate, resulting in wrapping, and the correct behavior as the initializer-list phase being skipped when copying. The surprising outcome is the repair; the intuitive one was the defect.

The exception is exactly one argument wide, which is what makes cppreference's example matrix worth reading as a unit:

```cpp
std::vector v1{1, 2};   // std::vector<int>
std::vector v2{v1};     // std::vector<int>, not std::vector<std::vector<int>> (P0702R1)
std::vector v3{v1, v2}; // std::vector<std::vector<int>>
```

Two vectors in braces nest. One does not. And the carve-out does not generalize: outside the special case for copying versus wrapping, the strong preference for initializer-list constructors in list-initialization remains intact, which is why `std::vector v3{v1.begin(), v1.end()}` deduces `std::vector<std::vector<int>::iterator>` while the same pair in parentheses deduces `std::vector<int>`. Braces and parentheses are not interchangeable here even though both are spelled as initialization.

When partial ordering cannot separate two candidates, cppreference gives three tiebreakers in order: a function template generated from a user-defined deduction guide is preferred over one implicitly generated from a constructor or constructor template, the copy deduction candidate is preferred over all other implicitly generated ones, and one generated from a non-template constructor is preferred over one generated from a constructor template. A user-written guide therefore outranks the copy candidate only once ordering has already declared them equally specialized. cppreference's own demonstration adds `template<class T> A(A<T>) -> A<A<T>>;`, carrying the comment that it is as specialized as the copy deduction candidate, and `A b2 = a;` then deduces `A<A<int>>`. Wrapping is reachable. You have to write a guide that ties on specificity, because anything less specific loses before the tiebreakers are consulted.

Deduction stops once the argument list is fixed. What the compiler does with that list afterwards, stamping out one entity per distinct set of arguments, belongs to [[cs/languages/Cpp/template-instantiation-and-the-two-phase-rule|instantiation]], and the cost of doing that per argument list is the same [[cs/languages/Rust/monomorphization-and-code-bloat|monomorphization]] bill every language with reified generics pays.

> [!tip] Reading a deduction error
> Ask which `P`/`A` pair failed. If two disagree, one belongs in a non-deduced position or should be specified explicitly. If a parameter deduced to a reference you did not expect, look for a forwarding reference and an lvalue argument. If nothing deduced at all, find the `::`, the `decltype`, or the array-bound arithmetic that made the position unreadable. And if a class template will not deduce, check whether its constructors mention the class's own parameters, because a guide is needed only when they do not.

## Related Notes

- [[cs/languages/Cpp/sfinae-and-enable-if|SFINAE and enable_if]] - the substitution step that runs immediately after deduction, and what a failure there means
- [[cs/languages/Cpp/template-specialization-full-and-partial|Template Specialization, Full and Partial]] - the other consumer of the deduced argument list, and why partial ordering needs deduction
- [[cs/languages/Cpp/move-semantics-and-rvalue-references|Move Semantics and Rvalue References]] - value categories, and the `std::forward` that reference collapsing exists to serve
- [[cs/languages/Cpp/template-instantiation-and-the-two-phase-rule|Template Instantiation and the Two-Phase Rule]] - what happens to the argument list once deduction has fixed it
- [[cs/languages/Rust/monomorphization-and-code-bloat|Monomorphization and Code Bloat]] - the price of one entity per deduced argument list, counted in a language that made the same choice
- [[cs/languages/Go/type-inference-in-go|Type Inference in Go]] - a deliberately smaller deduction algorithm designed after watching this one
- [[cs/pl/hindleymilner-type-inference|Hindley-Milner and Type Inference]] - what a whole-program inference algorithm does that per-parameter matching cannot
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - where a syntactic matching rule sits among the things a type system can promise

## Sources

- "Template argument deduction," cppreference.com. https://en.cppreference.com/w/cpp/language/template_argument_deduction.html . Supports the deduction premise and the contexts in which it occurs, its position after name lookup and before substitution and overload resolution, the per-pair deduction and combination rule with the ambiguity failure, the pre-deduction adjustments to `P` and `A`, the statement that deduction does not consider implicit conversions, the definition and consequence of non-deduced contexts with the nested-name-specifier, `decltype`, array-bound, overload-set and default-argument entries, the forwarding-reference lvalue clause, and the note that a class template parameter is never a forwarding reference.
- "Class template argument deduction (CTAD)," cppreference.com. https://en.cppreference.com/w/cpp/language/class_template_argument_deduction.html . Supports the CTAD premise and its four contexts with the `std::pair` and `std::lock_guard` examples, the construction of implicitly-generated guides from constructors, the copy deduction candidate, the syntax and status of user-defined deduction guides, the `container` example with its iterator-pair guide and its error case, the precedence of partial ordering over guide provenance and the resulting preference for copying over wrapping, the three tiebreakers applied when partial ordering fails, the `A(A<T>) -> A<A<T>>` guide that ties with the copy deduction candidate, the `std::tuple` and `std::vector` copying-versus-wrapping examples and the iterator-pair braces-versus-parentheses pair, the note that the initializer-list preference is otherwise intact, defect report P0702R1 and its before-and-after behavior, and the `__cpp_deduction_guides` feature-test values.
- "Reference declaration," cppreference.com. https://en.cppreference.com/w/cpp/language/reference.html . Supports the definition of forwarding references and their value-category preservation, the exact declared form that qualifies, the `const T&&` counterexample, and the reference collapsing rules.
