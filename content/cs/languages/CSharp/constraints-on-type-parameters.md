---
title: "Constraints on Type Parameters"
description: "The where vocabulary read as a permission system: each constraint is less a filter on callers than a widening of what the generic body is allowed to do with T."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-19
updated:
aliases:
  - where Clauses in C#
  - Generic Constraints
---

The usual way to teach `where` is as a gate: this constraint keeps the wrong types out. That framing explains the compile errors and none of the design. Constraints exist because of a limitation on the inside of the generic body, not the outside. Without one, the documentation says, "the compiler can only assume the members of System.Object," so an unconstrained `T` can be assigned, boxed, and passed along, and nothing else. Every `where` clause buys back a specific set of operations.

> [!note] The idea
> A constraint is a permission slip written in the type system. The docs put it exactly this way: constraints "specify the capabilities and expectations of a type parameter," and "declaring those constraints means you can use the operations and method calls of the constraining type." The gate on the caller is the mechanism; the widened body is the purpose. Read the vocabulary in that direction and the odd members of the list, `new()`, `unmanaged`, `default`, stop looking like a grab bag and start looking like answers to specific questions about what a body needs to be allowed to do.

## The vocabulary, and what each one unlocks

**`where T : class`** requires a reference type, and the documentation notes it "applies also to any class, interface, delegate, or array type." Inside the body you gain null as a usable value and reference assignment semantics. You do not gain equality, and the docs are pointed about it: avoid `==` and `!=` on a `class`-constrained parameter, because "the compiler only knows that T is a reference type at compile time and must use the default operators that are valid for all reference types." Two equal strings compare false through such a parameter. The prescribed fix is to constrain to `IEquatable<T>` or `IComparable<T>` instead, which is the difference between constraining for a category and constraining for a capability.

**`where T : struct`** requires "a non-nullable value type," which "includes record struct types." The body gains a guarantee that `T` is never null and never boxed by assignment. It also gains a constructor for free: "because all value types have an accessible parameterless constructor, either declared or implicit, the struct constraint implies the new() constraint," and for that reason the two cannot be combined.

**`where T : notnull`** requires a non-nullable type of either kind: "the argument can be a non-nullable reference type or a non-nullable value type." This is the constraint for a dictionary key or anything else where null is meaningless but the value-versus-reference distinction is not your business. It behaves unlike the rest in two ways worth remembering. "Unlike most other constraints, if a type argument violates the" `notnull` constraint the compiler emits a warning rather than an error, and the constraint has effect only inside a nullable context.

**`where T : new()`** requires "a public parameterless constructor," and it is the one that unlocks `new T()` in the body. It has to be last in the clause, and it cannot be combined with `struct` or `unmanaged`, both of which already imply it.

**`where T : SomeBaseClass`** requires that the argument "must be or derive from the specified base class," and the body gains every accessible member of that class. The documentation's worked example is a linked list constrained to `Employee` whose search method reaches `current.Data.Name` directly, with the comment that the constraint is what enables the property access. Without it the body would have `object` and a cast.

**`where T : ISomeInterface`** is the same trade through an interface, and the constraining interface "can also be generic," which is what makes the self-referential form `where T : IComparable<T>` expressible. That pattern is how a sort routine gets `CompareTo` without a cast and without a comparer object, and it is the closest thing C# had to [[cs/pl/type-classes-and-traits|type classes]] before static abstract members arrived.

**`where T : unmanaged`** requires "a non-nullable unmanaged type" and implies `struct`. It is the memory-layout constraint: it "enables you to write reusable routines to work with types that can be manipulated as blocks of memory," and the documentation's example takes `sizeof(T)` and walks the argument byte by byte through a pointer. The unlock is precisely stated, since "the preceding method must be compiled in an unsafe context because it uses the" `sizeof` operator on a type not known to be built-in, and "without the unmanaged constraint, the sizeof operator is unavailable." A `T` whose layout could contain a managed reference has no stable size and no legal byte-wise reading, so the constraint is what makes the question well-formed. This is the same property that governs what can cross into native code, which puts it next to [[cs/languages/common/c-abi-and-ffi|the C ABI]] rather than next to the other constraints.

**`where T : default`** is the strangest entry and the least about filtering anything. It "resolves the ambiguity when you need to specify an unconstrained type parameter when you override a method or provide an explicit interface implementation." Overrides do not restate constraints, they inherit them, so when a base method constrained neither `class` nor `struct` a derived override needs a way to say so explicitly. `default` says it. The reason the ambiguity exists at all is nullable reference types, which is its own subject.

**`where T : U`** constrains one parameter by another, so a method's own parameter can be tied to the enclosing type's. The documentation is candid that the usefulness is limited, "because the compiler can assume nothing about the type parameter except that it derives from System.Object," and recommends it only where you want to enforce an inheritance relationship between two parameters.

There is also an anti-constraint, `allows ref struct`, which widens rather than narrows the accepted set and obliges the generic body to obey ref safety rules for every instance of `T`.

> [!example] Ordering is not stylistic
> ```csharp
> class EmployeeList<T> where T : notnull, Employee, IComparable<T>, new()
> ```
> The rules the compiler enforces: at most one of `struct`, `class`, `class?`, `notnull`, and `unmanaged`, and if present it must come first. At most one base class constraint. `new()` last. Anti-constraints after `new()`. A base class constraint cannot be combined with `struct`, `class`, `class?`, `notnull`, or `unmanaged`.

## Why this list is longer than Java's

[[cs/languages/Java/bounded-type-parameters|Java's bounds]] are one mechanism: a type parameter is bounded by a class or interface, and its erasure becomes that bound. There is no `new()` because the type argument is not available to construct, no `struct` because there are no user value types on the type-parameter path, no `unmanaged` because layout is not a thing the language exposes, and no `default` because nullable annotations are not part of the type system.

Each of those absences is downstream of the same decision. Constraints in C# can require runtime capabilities, because the runtime knows what `T` is. They are metadata rather than a compile-time-only check, which is why the CLR rejects a bad type argument passed through reflection and why the constraint survives to be read back. The general theory of what a constraint is doing, and where it sits relative to subtyping, is in [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]]; the closest thing in another systems language is [[cs/languages/Rust/traits-and-generic-bounds|Rust's trait bounds]], which take the permission-slip reading much further by making it the only mechanism.

> [!warning] A constraint is not a contract about behavior
> Constraints check shape, not semantics. `where T : IComparable<T>` guarantees a `CompareTo` exists, not that it implements a total order, and a generic sort handed an inconsistent comparison can loop or throw. The documentation is explicit that "users of the generic type cannot substitute type arguments that do not satisfy the constraints," which is a statement about the type system and not about correctness. Everything past shape is still on the author of the type argument.

## Related Notes

- [[cs/languages/CSharp/reified-generics-in-the-clr|Reified Generics in the CLR]] - why constraints can demand runtime capabilities like a constructor
- [[cs/languages/CSharp/reflection-over-generic-types|Reflection Over Generic Types]] - constraints as metadata, readable and enforced at runtime
- [[cs/languages/Java/bounded-type-parameters|Bounded Type Parameters]] - the same job with one mechanism and a much shorter list
- [[cs/languages/Rust/traits-and-generic-bounds|Traits and Generic Bounds in Rust]] - the permission-slip reading taken to its conclusion
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - where constraints sit in the theory
- [[cs/pl/type-classes-and-traits|Type Classes & Traits]] - the self-referential interface constraint as an approximation of a type class

## Sources

- "Constraints on type parameters (C# Programming Guide)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/constraints-on-type-parameters . Supports the full constraint table and its wording for struct, class, notnull, new(), base class, interface, unmanaged, default, and T : U; the ordering and mutual-exclusion rules; the warning about == and != under a class constraint; the notnull warning-not-error behavior; and the sizeof unlock under the unmanaged constraint.
- "Generics in .NET," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/standard/generics/ . Supports that constraints are limits placed on generic type parameters and that users of a generic type cannot substitute arguments that fail them.
- "Generic types and methods," C# fundamentals, Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/generics . Supports that constraints restrict which type arguments are accepted and let the body call members unavailable on object alone.
