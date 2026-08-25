---
title: Dependent Names and the typename Keyword
description: "Why C++ makes you write typename and template inside templates: the same token sequence parses two different ways depending on what a name means, and inside a template the parser cannot know yet."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-02
updated:
aliases: []
---

`T::x * p;` is either a declaration of a pointer named `p` or a multiplication whose result is thrown away. Which one it is depends entirely on whether `T::x` names a type, and inside a template `T` has not arrived yet. Every other language with generics ducks this by having a grammar that does not care. C++ cannot duck it, because the C declarator syntax it inherited makes the parse of a statement depend on the meaning of the names in it.

> [!note] The idea
> `typename` and `template` are not annotations for the reader. They are the programmer hand-feeding the parser a fact it cannot look up. C++ resolves the ambiguity with a default plus an override: a dependent qualified name is assumed **not** to be a type, and you say otherwise by writing `typename`. The non-obvious consequence is that the wrong choice does not always produce a syntax error. cppreference's own example of the omission compiles cleanly at the point of definition, because the accidental multiplication happens to be well formed, and fails much later at instantiation with an error about a member variable that was never there.

## The rule, and what it costs to forget it

cppreference states it directly: in a declaration or definition of a template, a name that is not a member of the current instantiation and is dependent on a template parameter is not considered to be a type unless the keyword `typename` is used, or unless it was already established as a type name, for example by a `typedef` or by being used to name a base class.

Its worked example is worth reading slowly. Inside `template<typename T> void foo(const std::vector<T>& v)`, the line `typename std::vector<T>::const_iterator it = v.begin();` is fine. The next line drops the keyword:

```cpp
std::vector<T>::const_iterator * p;
```

cppreference annotates what happens. Without `typename`, this is parsed as multiplication of the type-dependent data member `const_iterator` and some variable `p`, and since there is a global `p` visible at this point, this template definition compiles. Nothing is wrong yet. The template is a valid template. It is only when `foo(v)` is called with a real `std::vector<int>` that the instantiation fails, and the diagnostic complains that there is no member variable called `const_iterator` in the type `std::vector<int>`. The error message is describing a program you never meant to write.

This is the same [[cs/languages/Cpp/template-instantiation-and-the-two-phase-rule|two-phase split]] seen from the parser's side. Phase one must produce a parse tree, and a parse tree requires deciding what each construct is. Where the decision cannot be made, the language picks a default and gives you a way to override it.

## The parse depends on the meaning

The general fact underneath is that in C++ the same token sequence has two different [[cs/pl/grammar-ambiguity-parse-trees|parses]] depending on information that is not in the tokens. `A * B;` is a declaration when `A` is a type and an expression statement when it is a variable. Outside a template the compiler consults its symbol table and the ambiguity evaporates. Inside a template the symbol table has a hole in it exactly where the answer is. That is a case where [[cs/pl/language-overview-syntax-semantics|syntax cannot be separated from semantics]], and the fix is to make the programmer supply the missing entry.

The `template` disambiguator solves the identical problem one level up, for the `<` token. cppreference shows a member call inside a template:

```cpp
S<T> s;
s.foo<T>();          // error: < parsed as less than operator
s.template foo<T>(); // OK
```

Both `<` interpretations are grammatical. Only one of them makes the rest of the line parse. The keyword may only be used after `::`, `->`, and `.`, and cppreference lists the valid shapes: `T::template foo<X>()`, `s.template foo<X>()`, `this->template foo<X>()`, and `typename T::template iterator<int>::value_type v;`. That last one needs both keywords for the same expression, which is the point at which the syntax stops looking like a language feature and starts looking like a confession.

## The escapes

Three things narrow how often you have to write either keyword.

**The current instantiation.** cppreference explains that within a class template definition, some names may be deduced to refer to the current instantiation, and this both allows certain errors to be detected at the point of definition rather than instantiation and removes the requirement on the `typename` and `template` disambiguators. Its example writes `S<T>::value_t n{};` with no `typename`, because `value_t` is a member of the template being defined and therefore known.

**Contexts where only a type can appear.** Since C++20, cppreference lists a set of positions where a dependent qualified name is assumed to name a type and no `typename` is required: the declaration specifiers of a namespace-scope simple declaration or function definition, class member declarations, most parameter declarations, the type of a non-type template parameter, the type in a `new` expression that does not parenthesize its type, the type-id of an alias declaration, a trailing return type, the default argument of a type template parameter, and the type-id of the four named casts. The committee did not make the parser smarter. It enumerated the places where nothing else could have been meant.

**Neither keyword is restricted to templates.** cppreference notes that `typename` can be used even outside of templates, and that the `template` prefix is allowed even if the name is not dependent or the use does not appear in the scope of a template, giving `::template S<void> q;` as allowed but unnecessary.

> [!warning] typename does not change how the name is looked up
> This is the detail that catches people who reason by analogy with the elaborated type specifier `struct X`, which skips over non-type declarations of the same name. cppreference is explicit that usual qualified name lookup is used for the identifier prefixed by `typename`, and unlike the case with an elaborated type specifier, the lookup rules do not change despite the qualifier. Its example gives `struct A` both a nested `struct X` and an `int X` member. `typename T::X x;` instantiated with `B`, which has only the type, works. Instantiated with `A` it is an error, because qualified name lookup for `A::X` finds the data member. `typename` asserts that the lookup will find a type. It does not ask the lookup to go find one.

## The same keyword, asking instead of asserting

C++20 gave `typename` a second job that inverts its meaning. Inside a `requires` expression, a type requirement written `typename T::inner;` asserts that the type named is valid, which cppreference says can be used to verify that a certain named nested type exists, or that a class or alias template specialization names a type. In a template body, `typename` is a promise the programmer makes and the instantiation checks. In a [[cs/languages/Cpp/concepts-and-requires-clauses|requires expression]] the same keyword is a question, and a failure produces `false` instead of an error. The parser problem did not go away. It was turned into a predicate.

## Related Notes

- [[cs/languages/Cpp/template-instantiation-and-the-two-phase-rule|Template Instantiation and the Two-Phase Rule]] - the split these keywords exist to bridge
- [[cs/languages/Cpp/argument-dependent-lookup|Argument-Dependent Lookup]] - the other half of what phase two does with a dependent name
- [[cs/pl/grammar-ambiguity-parse-trees|Grammar Ambiguity and Parse Trees]] - why one token sequence can have two trees, and what a parser does about it
- [[cs/pl/language-overview-syntax-semantics|Language Overview: Syntax vs Semantics]] - the boundary C++ declarator syntax refuses to respect
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding, and Closures]] - the name-to-declaration mapping that templates leave partly unfilled
- [[cs/languages/Rust/macros-declarative-and-procedural|Macros: Declarative and Procedural]] - a metaprogramming system that parses into a token tree first and never faces this

## Sources

- "Dependent names," cppreference.com. https://en.cppreference.com/w/cpp/language/dependent_name.html . Supports the rule that a dependent name is not considered a type without `typename`, the `std::vector<T>::const_iterator * p` example and its parse as a multiplication against a visible global `p`, the instantiation-time failure message, the `template` disambiguator with the `s.foo<T>()` error and the list of valid positions, the current-instantiation exemption, the C++20 list of contexts where `typename` is not required, the use of both keywords outside templates, and the statement that qualified name lookup is unchanged by `typename` with the `struct A` example.
- "Requires expression," cppreference.com. https://en.cppreference.com/w/cpp/language/requires.html . Supports the type requirement form and its purpose of verifying that a named nested type or a template specialization is valid.
