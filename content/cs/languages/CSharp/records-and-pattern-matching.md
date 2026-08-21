---
title: "Records and Pattern Matching"
description: "A record does not introduce a new kind of type. It instructs the compiler to synthesize the equality, copying, and formatting members you would otherwise hand-write, and one of them changes what equality means."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-02
updated:
aliases:
  - C# Records
  - with Expressions
  - Pattern Matching in C#
---

The `record` modifier looks like a small convenience and behaves like a change of semantics. A `class` gets reference equality, a `struct` gets memberwise equality by reflection, and a record gets memberwise equality generated at compile time against a runtime type check. That last combination does not exist anywhere else in the language, and it is what makes records suitable for some jobs and disqualifying for others.

> [!note] The idea
> The record modifier provides built-in functionality for encapsulating data, and `record class` and `record struct` still declare an ordinary reference type and value type respectively. What changes is the member set the compiler synthesizes. Equality is the load-bearing one: for record types, two objects are equal if they are of the same type and store the same values, and the compiler enforces the same type half by synthesizing an `EqualityContract` property returning a `Type` that matches the record. Equality therefore depends on the runtime type of the object, not on the declared type of the variable, which is a stricter rule than any hand-written `Equals` usually implements.

## What gets generated

Declaring a primary constructor on a record makes the compiler generate public properties for the primary constructor parameters, which the documentation calls positional parameters. It also generates a `Deconstruct` method with an `out` parameter for each of them, deconstructing only the positional properties and ignoring those written with standard property syntax. The same primary constructor on a non-record type synthesizes no properties at all, which is the sharpest available statement of what the modifier buys.

To implement value equality the compiler synthesizes an override of `Object.Equals(Object)`, a virtual or sealed `Equals(R? other)` implementing `IEquatable<T>`, an override of `Object.GetHashCode()`, and overrides of `operator ==` and `operator !=`. Declaring the `Object.Equals` override or the operators yourself is an error; declaring `Equals(R? other)` or `GetHashCode` is allowed, and writing one obliges you to write the other. The compiler skips synthesizing any member whose signature you already provided and which is legal to provide.

The equality story for `record struct` carries a performance consequence that is easy to miss. The definition of equality for a record struct is the same as for a struct, but the implementation differs: for a plain struct it lives in `ValueType.Equals(Object)` and relies on reflection, while for records the implementation is compiler synthesized and uses the declared data members. Adding one modifier replaces a reflective comparison with straight-line generated code. That is a good reason to prefer `readonly record struct` over `struct` for [[cs/languages/CSharp/value-types-structs-and-boxing|any value type]] you intend to compare.

> [!warning] Value equality is shallow, and hash codes remember
> The documentation's own example makes the point with an array property. Two `Person` records constructed with the same `string[]` compare equal, and after `person1.PhoneNumbers[0]` is assigned they still compare equal, while `ReferenceEquals` says they are different objects. Equality compares the reference, not the array contents. Combine that with a synthesized `GetHashCode` built from all declared data members and you get the classic hazard: mutate a member of a record used as a key and the entry becomes unreachable in [[cs/dsa/hash-tables|its hash table]], because the bucket was chosen with the old hash.

## `with`, and why it needs a clone

A `with` expression creates a new record instance that is a copy of an existing one, with specified properties and fields modified through object initializer syntax. Explicitly declared properties need an `init` or `set` accessor to be changed this way. The result is a shallow copy: for a reference property it copies only the reference, so original and copy end up pointing at the same instance.

The implementation for `record class` types is a synthesized clone method plus a copy constructor. The virtual clone method returns a new record initialized by the copy constructor, and a `with` expression compiles into a call to clone followed by assignments for the listed properties. You cannot override that method or declare a member named `Clone`, because its actual name is compiler-generated. For `record struct` types the compiler synthesizes no copy constructor at all, and the values are copied on assignment.

The virtual clone is what makes `with` behave under inheritance: the result has the same run-time type as its operand, all properties of the run-time type get copied, and only properties of the compile-time type can be set.

> [!warning] Compute on access, not on construction
> Since a `with` expression first copies the instance and then modifies the listed members, a property computed during initialization is copied with its stale value. The documentation walks through a `Distance` property cached at construction, where the copy reports the distance of the original. Computed properties in record types should be computed on access.

## Equality that reads the runtime type

Two record variables are equal only if the run-time type is equal, even when the declared types of the variables differ. Given abstract `Person` with derived `Teacher` and `Student` carrying identical property values, `teacher == student` is `False` while `student2 == student` is `True`, and every variable in that example is declared as `Person`. The synthesized `EqualityContract` is what implements this. When the base type of a record is `object` the property is virtual; when the base is another record it is an override; a sealed record makes it effectively sealed. Comparing two derived instances checks all data members of both the base and derived types, and the data members of a record include declared fields plus the compiler-synthesized backing field of every automatically implemented property.

This is [[cs/pl/objects-classes-and-dispatch|virtual dispatch]] recruited to answer a question usually answered statically, and it is why records model closed data hierarchies well and persisted entities badly. Entity Framework Core depends on reference equality to ensure it uses only one instance of an entity type for what is conceptually one entity, so records and record structs are not appropriate as EF Core entity types. [[cs/languages/Java/records-sealed-types-and-pattern-matching|Java arrived at records from the same direction]] and paired them with sealed types, closing the hierarchy in the type system rather than at the equality check.

## The pattern vocabulary

Patterns are consumed by exactly three constructs: the `is` expression, the `switch` statement, and the `switch` expression. Inside them the vocabulary is a declaration pattern, which checks the run-time type and binds the result to a variable; a type pattern, which checks the run-time type without binding; a constant pattern, an alternative syntax for `==` when the right operand is a constant; relational patterns using `<`, `>`, `<=`, or `>=` against a constant of integer, floating-point, `char`, or `enum` type; logical patterns built with `not`, `and`, and `or`; property patterns testing nested patterns against properties or fields; positional patterns, which deconstruct a result and test the pieces; `var` and discard patterns, which match anything; and list patterns, which test a sequence against nested patterns.

Logical, property, positional, and list patterns are recursive patterns: they can contain nested patterns. That is the property that turns a switch into a structural matcher rather than a lookup table, and it is why generated `Deconstruct` methods matter so much. Records supply the deconstruction that positional patterns consume, which is the same pairing [[cs/pl/records-variants-and-pattern-matching|algebraic data types and case analysis]] have had since ML.

> [!example] The precedence trap
> `not` binds first, then `and`, then `or`. So `c is not >= 'a' and <= 'z'` does not mean what it reads as. It parses as `c is ((not >= 'a') and <= 'z')`, which tests characters below `a` that are also at or below `z`, not characters outside the range. The fix is parentheses forcing `and` to bind first.

A `null` check falls out of the same machinery rather than being special: `input is not null` is a negated constant pattern, and declaration and type patterns match only when the expression result is non-null to begin with.

## Related Notes

- [[cs/languages/Java/records-sealed-types-and-pattern-matching|Records, Sealed Types, and Pattern Matching]] - the same feature pair in a language that reached it via sealed hierarchies.
- [[cs/pl/records-variants-and-pattern-matching|Records, Variants, and Pattern Matching]] - the theory records and recursive patterns are an instance of.
- [[cs/languages/CSharp/value-types-structs-and-boxing|Value Types, Structs, and Boxing]] - why record struct equality is faster than struct equality.
- [[cs/dsa/hash-tables|Hash Tables]] - the structure that punishes a mutated member with a generated hash code.
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the mechanism EqualityContract borrows to make equality runtime-typed.
- [[cs/languages/CSharp/nullable-reference-types|Nullable Reference Types]] - the other C# feature whose behavior is decided entirely at compile time.

## Sources

- "Records (C# reference)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record . Supports the record modifier and the record class and record struct declarations, generated positional properties and the Deconstruct method, the equality rules for class, struct, and record types, the list of synthesized equality members and which may be declared explicitly, the reflection-based ValueType.Equals contrast, the shared-array equality example, the Entity Framework Core reference-equality caveat, with expressions and their shallow-copy semantics, the clone method and copy constructor, the computed-property pitfall, and the inheritance equality behavior with EqualityContract.
- "Pattern matching (C# reference)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/patterns . Supports the three constructs that accept patterns, the definitions of the declaration, type, constant, relational, logical, property, positional, var, discard, and list patterns, the operators and constant types allowed in relational patterns, the identification of logical, property, positional, and list patterns as recursive, the not, and, or binding order, and the worked lowercase-letter precedence error.
