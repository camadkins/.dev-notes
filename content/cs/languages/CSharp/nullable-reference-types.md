---
title: "Nullable Reference Types"
description: "string and string? are the same .NET type. The whole feature is a compile-time flow analysis over a runtime that has no idea it exists, and every design decision in it follows from that."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-17
updated:
aliases:
  - NRT in C#
  - The Null-Forgiving Operator
  - Null-State Analysis
---

C# 8 added a question mark to reference type declarations and produced years of confusion about what it means, because the syntax borrows from nullable value types where it does something real. `int?` is `Nullable<int>`, a different type with different storage. `string?` is `System.String`. So is `string`. The compiler enforces distinctions between them that the runtime knows nothing about.

> [!note] The idea
> Nullable reference types are entirely a compile-time feature, and the runtime behavior of your program is unchanged by them. There is no runtime difference between a non-nullable reference type and a nullable one, and the compiler does not add any runtime checking for non-nullable reference types. What you get is a static analysis that tracks a two-valued null-state through your code and warns when your usage contradicts your declarations. That is why the feature ships as warnings rather than errors, why it needs an escape hatch, and why two documented holes in it are unfixable without changing the runtime.

## Three parts, one diagnostic

The documentation names three building blocks that work together. Variable annotations, `string` against `string?`, express which references are intended to allow null. Null-state analysis tracks whether the value of an expression is not-null or maybe-null at each point in the code. Attributes on APIs describe more nuanced contracts, such as an argument that may be null where the return value is null only when the argument was.

The annotation does not change the runtime type. It informs the compiler of your design intent, and the intent shapes the warnings. A non-nullable variable has a default null-state of not-null, so the compiler warns if you assign a value that might be null. A nullable variable has a default null-state of maybe-null, so the compiler warns if you dereference it without checking first. Either kind of warning means the same thing: the behavior of the code does not match its stated design.

Because the two annotations are one type, several syntactic positions are simply unavailable. You cannot generally use a nullable reference type as a base class or implemented interface, in an object creation or type testing expression, or as the type of a member access expression. `new object?()` and `catch (Exception? e)` are not allowed. This is the tell that `?` is metadata attached to a type reference rather than a type constructor, which is the same shape as [[cs/languages/Python/type-hints-and-gradual-typing|Python type hints]]: annotations checked by a tool the runtime never consults.

## The analysis, and its stated boundary

The compiler tracks null-state as one of exactly two values, not-null or maybe-null. Two things update a local variable's state: assignments and null checks. After an assignment the state matches the right-hand side. After a null check the state reflects whichever branch was taken. The analysis works across `if` checks, pattern matching, and control flow that loops or returns early, which is why walking a parent chain in a `while (current is not null)` loop produces no warnings inside the body.

One sentence in the documentation defines the ceiling: the analysis does not trace into the bodies of methods. Everything else about the feature is a consequence of that. If a method could tell its callers something about null-state, the only channel is its signature, which is what the nullable analysis attributes are for. `[NotNullWhen(true)]` on a parameter says that when the method returns `true`, that argument is not-null, and inside the `if` block the caller gets not-null with no further ceremony. As of .NET 5, all .NET runtime APIs are annotated, so the analysis benefits any code that calls them.

Compare this to [[cs/pl/type-soundness-progress-preservation|a sound type system]], where well-typed programs cannot go wrong in a specified sense. Null-state analysis makes no such promise and does not try to. It is deliberately incomplete in the direction of usability, which is exactly the tradeoff [[cs/pl/type-systems-goals-guarantees|a type system chooses]] when it is added to a language that already shipped without it.

## Two flags, not one

The nullable context is two independent settings, and the reason is migration. The annotation context determines whether the compiler interprets `?` and tracks nullability; the warning context determines whether it reports what it found. There are four combinations. Both disabled makes the code nullable-oblivious, matching the behavior before the feature existed. Both enabled turns on all null reference analysis and all language features. Warnings enabled with annotations disabled performs the analysis and emits warnings without letting you express intent. Annotations enabled with warnings disabled lets you annotate a codebase without drowning in diagnostics.

Both settings are disabled by default for existing projects, and since .NET 6 with C# 10 both are enabled by default for new projects. The `#nullable` directives give the same control per file or per line, including `#nullable restore` to return to the project settings, so a large codebase can be converted a file at a time.

> [!warning] Oblivious is not the same as nullable
> Reference type variables compiled in a disabled context are nullable-oblivious. You can assign a null literal or a maybe-null variable to a nullable-oblivious variable, but the default state of a nullable-oblivious variable is not-null. An unannotated library is therefore treated as a source of not-null values by default, which is generous rather than safe. This is the practical reason annotated dependencies matter more than annotating your own code.

## What `!` actually asserts

The unary postfix `!` is the null-forgiving, or null-suppression, operator. In an enabled nullable annotation context it suppresses all nullable warnings for the preceding expression. It has no effect at run time: `x!` evaluates to the result of `x`, and the only thing it changes is the null state the compiler's flow analysis carries forward.

Read carefully, `!` is not a claim that a value is not null. It is a claim that the analysis should stop reasoning here. Those are different, and the difference is why `!` is the one construct in this feature that can convert a warning into a `NullReferenceException`. The documented advice is to use it sparingly, since each occurrence is a place the compiler can no longer protect you, and to prefer a null check, restructuring, or annotating the relevant API. The legitimate uses are narrow: testing argument-validation logic by passing `null!` on purpose, and the case where you know an invariant the signature cannot express.

## The two holes

Both documented pitfalls leave a non-nullable reference holding null with no warning, and both are limitations of the static analysis rather than bugs in your code.

A struct created with `default` or `new()` leaves its fields uninitialized, so a `struct Student` with non-nullable `string` fields produces an instance whose `FirstName` is null and no diagnostic. The recommended defense is `required` members or a parameterized constructor. This is [[cs/languages/CSharp/value-types-structs-and-boxing|the definite-assignment rule for value types]] colliding with a promise the type system made on a different layer, and the value type wins because it predates the promise by two decades.

The second is arrays. A new array of a non-nullable reference type contains all null elements until you assign each one, and the same applies to arrays of structs, where every element starts at the struct default and its non-nullable reference fields start as null. Collection expressions and target-typed `new` are the concise fixes, because they initialize every slot at creation. The parallel question for type parameters, where `default(T)` means null for a class and zero for a struct, is [[cs/languages/CSharp/default-of-t-and-the-null-question|its own problem]].

One footnote complicates the pure compile-time framing in a useful way. The annotations do reach the metadata, and other libraries can read them with reflection: Entity Framework Core interprets a nullable reference as an optional value and a non-nullable reference as a required one. The runtime does not enforce nullability, but it does carry it, which means the annotation is documentation the machine can read.

## Related Notes

- [[cs/languages/CSharp/default-of-t-and-the-null-question|default(T) and the Null Question]] - what null means when the type is not known until instantiation.
- [[cs/languages/CSharp/value-types-structs-and-boxing|Value Types, Structs, and Boxing]] - the default-instance rule that punches the first hole.
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - the frame for judging a checker that warns instead of rejecting.
- [[cs/pl/type-soundness-progress-preservation|Type Soundness: Progress & Preservation]] - the property this analysis explicitly does not have.
- [[cs/languages/Python/type-hints-and-gradual-typing|Type Hints and Gradual Typing]] - the same retrofit in a language that never had a static checker at all.
- [[cs/languages/Rust/error-handling-result-and-question-mark|Error Handling in Rust: Result, Option, and ?]] - what absence looks like when the language had it from the start.

## Sources

- "Nullable reference types," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references . Supports the compile-time-only framing and unchanged runtime behavior, the three building blocks, the default null-states and what each warning means, the two-value null-state model and how assignments and checks update it, that the analysis does not trace into method bodies, the NotNullWhen contract example, the .NET 5 annotation of runtime APIs, the null-forgiving guidance, and both documented pitfalls with their recommended fixes.
- "Nullable reference types (C# reference)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/nullable-reference-types . Supports that T and T? are the same .NET type, the forbidden syntactic positions, the absence of runtime checking, the four annotation and warning context combinations and their defaults, the #nullable directives, the nullable-oblivious rules, and the Entity Framework Core reflection note.
- "! (null-forgiving) operator," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/null-forgiving . Supports the operator name, the suppression of all nullable warnings for the preceding expression, the absence of runtime effect, the change to static flow analysis state, and the argument-validation test example.
