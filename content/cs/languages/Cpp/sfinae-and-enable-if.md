---
title: SFINAE and enable_if
description: "Substitution failure is not an error: how a defensive rule about failed deduction became the only way C++98 could ask a question about a type, where the immediate-context boundary puts the limit, and what it cost."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-08-05
updated:
aliases: []
---

The name is a rule, not a feature. cppreference states it in one sentence: during overload resolution of function templates, when substituting the explicitly specified or deduced type for the template parameter fails, the specialization is discarded from the overload set instead of causing a compile error. Then it adds the sentence that the next twenty years of C++ library design hung on: this feature is used in template metaprogramming.

The rule exists so that a template which cannot possibly apply gets out of the way instead of breaking the build. Somebody noticed that a failure you control is a question you can ask.

> [!note] The idea
> SFINAE turns a compile-time question into an overload-resolution side effect. You cannot write "does `T` have a nested `type`?" in C++98, so instead you write a declaration that only compiles if it does, and read the answer off which overload got picked. The question and the attempt are the same operation, which is why the whole technique lives or dies on one boundary: cppreference states that only failures in the immediate context of the function type or its template parameter types are SFINAE errors, and that if evaluating a substituted type or expression causes a side effect such as instantiating some template specialization, errors in those side effects are treated as hard errors. Ask carefully and you get a `false`. Ask one level too deep and you get a broken build with no overload to fall back to.

## Where substitution happens, and in what order

cppreference is precise about the mechanics, and the details matter because SFINAE is order-sensitive in a way most language features are not.

Function template parameters are substituted twice: explicitly specified template arguments are substituted before template argument deduction, and deduced arguments plus arguments obtained from defaults are substituted after it. Substitution occurs in all types used in the function type, which includes the return type and every parameter type, in all types used in the template parameter declarations, and in all types used in the template argument list of a partial specialization, plus since C++11 the corresponding expressions in each of those positions.

A substitution failure, in cppreference's definition, is any situation where the type or expression above would be ill-formed, with a required diagnostic, if written using the substituted arguments.

Then the ordering rule: substitution proceeds in lexical order and stops when a failure is encountered. That is what makes this example work rather than explode:

```cpp
template<typename A> struct B { using type = typename A::type; };

template<class T,
         class U = typename T::type,     // SFINAE failure if T has no member type
         class V = typename B<T>::type>  // hard error if B has no member type
void foo(int);
```

Substituting into `V` would instantiate `B<T>`, and a failure inside an instantiation is not in the immediate context, so it would be a hard error. cppreference annotates that this is guaranteed not to occur, because substitution into the default template argument of `U` fails first. The safe question is written to the left of the dangerous one. C++ programmers were doing manual short-circuit evaluation on their type-level predicates, using declaration order as the operator.

The same page notes the flip side. If two declarations of a template have different lexical orders, such as one with a trailing return type and a redeclaration with an ordinary return type, and that would cause instantiations to occur in a different order or not at all, the program is ill-formed with no diagnostic required.

## Asking a question by writing something illegal

The mechanism for asking is to construct a type that is invalid for the answers you want to exclude. cppreference lists the type errors that count as SFINAE errors, and the list reads like a catalogue of things the language happens to forbid: creating an array of `void`, of references, of functions, of negative size, of non-integral size, or of size zero; using a non-class, non-enumeration type on the left of `::`; naming a member that does not exist, or that is not a type where a type is required; creating a pointer to a reference, a reference to `void`, or a pointer to member of a non-class type.

Its parity dispatcher is the purest illustration:

```cpp
template<int I> void div(char(*)[I % 2 == 0] = nullptr) { /* I is even */ }
template<int I> void div(char(*)[I % 2 == 1] = nullptr) { /* I is odd  */ }
```

Nothing here is about arrays. One of the two array types has size zero for any given `I`, which is illegal, which removes that overload, which selects the other one. The type system is being used as a computer by feeding it expressions that are illegal in exactly the cases you want to reject.

## enable_if is two lines of specialization

`std::enable_if` packages the trick. cppreference gives the whole possible implementation:

```cpp
template<bool B, class T = void> struct enable_if {};
template<class T>               struct enable_if<true, T> { typedef T type; };
```

If `B` is `true` there is a member typedef `type`; otherwise there is no member typedef, and naming `enable_if<false, X>::type` is a substitution failure. That is it. The most heavily used metaprogramming facility of the C++11 era is one primary template and one [[cs/languages/Cpp/template-specialization-full-and-partial|partial specialization]], and cppreference describes it as a convenient way to leverage SFINAE prior to C++20's concepts, in particular for conditionally removing functions from the candidate set based on type traits.

Two traps come with it, both documented on the same page and both worse than they look.

The first is that you cannot distinguish overloads by default template argument. cppreference calls it a common mistake to declare two function templates that differ only in their default template arguments, because default template arguments are not accounted for in function template equivalence, so the declarations are treated as redeclarations of the same function template. The working version moves the `enable_if_t` into a non-type template parameter instead.

The second escapes the type system entirely. cppreference warns about `enable_if` in the type of a non-type template parameter of a namespace-scope function template, because some ABI specifications like the Itanium ABI do not include the instantiation-dependent portions of non-type template parameters in the mangling. Its example has two translation units defining different function templates, one constrained on `T::value1` and one on `T::value2`, and explicitly instantiating each for the same `X`. The two are distinct templates with different signatures. They mangle to the same name, `_Z4funcI1XLi0EEvv`, and cppreference states the outcome plainly: the linker will erroneously consider them to be the same entity. A compile-time predicate leaked through the [[cs/languages/common/c-abi-and-ffi|ABI]] and became a silent link-time substitution.

## The cost, counted

The C++ Core Guidelines' rule T.48 says to fake concepts with `enable_if` if your compiler does not support them, on the grounds that it is the best we can do without direct concept support, and shows the pair: `enable_if_t<is_integral_v<T>> f(T v)` against the concept form `template<Integral T> void f(T v)`.

The rule immediately warns about what happens next. Faking concept overloading with `enable_if` forces the error-prone design the Guidelines call complementary constraints: writing `enable_if<!C<T>, void>` and `enable_if<C<T>, void>` as a pair, because there is no ordering between constrained overloads to lean on and so every case must be spelled out and made mutually exclusive by hand. Their note on scaling is the part to keep. Complementary requirements on one requirement are sometimes wrongly considered manageable, but for two or more requirements the number of definitions needed can go up exponentially, and they list the four combinations of two predicates before observing that the opportunities for errors multiply. Two predicates is four overloads, three is eight; the [[cs/math/combinatorics|count doubles with every question you ask]], and each one must be written and kept consistent by a human.

That is the real indictment. Not that `enable_if` is ugly, but that it makes the number of things you have to write grow with the number of things you want to know. It is what a [[cs/pl/type-systems-goals-guarantees|type system]] looks like when the checking mechanism has no way to order two partially overlapping requirements.

cppreference's own recommendation section is short and final: where applicable, tag dispatch, `if constexpr`, and concepts are usually preferred over use of SFINAE, and `static_assert` is usually preferred if only a conditional compile-time error is wanted. Every one of those is a way to state the question directly instead of encoding it in a failed substitution, and the arc from here to [[cs/languages/Cpp/concepts-and-requires-clauses|concepts]] is the language slowly acquiring the vocabulary to say what these tricks were always trying to say.

## Related Notes

- [[cs/languages/Cpp/template-specialization-full-and-partial|Template Specialization, Full and Partial]] - the two lines `enable_if` is built from
- [[cs/languages/Cpp/type-traits-and-tag-dispatch|Type Traits and Tag Dispatch]] - the other pre-concepts answer, and the one cppreference prefers
- [[cs/languages/Cpp/concepts-and-requires-clauses|Concepts and requires Clauses]] - substitution failure promoted from trick to declared interface
- [[cs/math/combinatorics|Combinatorics]] - why hand-written complementary constraints double with each predicate
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - what a checking mechanism owes you, and what SFINAE never provided
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - the mangling layer where the `enable_if` collision happens

## Sources

- "SFINAE," cppreference.com. https://en.cppreference.com/w/cpp/language/sfinae.html . Supports the definition and the discard-from-overload-set behavior, the note that the feature is used in template metaprogramming, the two substitution points and the list of positions substituted, the definition of a substitution failure, the immediate-context rule and side effects being hard errors, lexical-order substitution stopping at the first failure with the `B<T>` example and CWG 1227, the ill-formed-no-diagnostic-required rule for differently ordered redeclarations, the list of type SFINAE errors, the even and odd `div` example, and the recommendation of tag dispatch, `if constexpr`, concepts, and `static_assert` over SFINAE.
- "std::enable_if," cppreference.com. https://en.cppreference.com/w/cpp/types/enable_if.html . Supports the behavior of the member typedef, the description of `enable_if` as leveraging SFINAE prior to concepts, the possible implementation as a primary template plus a partial specialization for `true`, the common mistake of two templates differing only in default template arguments and the reason it fails, and the Itanium ABI mangling collision with the example and the mangled name.
- "C++ Core Guidelines," isocpp.github.io. https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines . Supports rule T.48 and its `enable_if` versus concept example, the warning that faking concept overloading forces complementary constraints, the `enable_if<!C<T>>` and `enable_if<C<T>>` pair marked bad, and the exponential growth of definitions with the four-combination example.
