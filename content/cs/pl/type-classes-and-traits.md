---
title: Type Classes & Traits
description: "Ad hoc polymorphism done principledly: constraining a type variable to types that support named operations, and compiling the constraint into a hidden dictionary argument."
draft: false
comments: true
tags:
  - cs
  - pl
  - type-theory
date: 2026-02-16
updated:
aliases: []
---

`length :: [a] -> Int` works for every list because it never looks inside an element. `elem` cannot make that promise. Comparing two elements requires knowing how to compare *that* type, so `elem` needs something between "works for exactly one type" and "works for every type."

Type classes are that middle setting, and they are unusual among language features in that the mechanism is almost boring while the consequences are not.

> [!note] The idea
> A type class is a type-system construct that supports ad hoc polymorphism by adding **constraints to type variables** in [[cs/pl/parametric-polymorphism-adts|parametrically polymorphic]] types. The non-obvious part is what happens after type checking: a constraint is not erased, it is compiled into an extra argument. `Eq a =>` becomes a hidden parameter holding a record of the operations, so overloading resolves to ordinary function application and the runtime needs no method lookup at all.

## Constraining a type variable

A type class is defined by specifying a set of function or constant names, together with their types, that must exist for every type belonging to the class.

```haskell
class Eq a where
  (==) :: a -> a -> Bool
  (/=) :: a -> a -> Bool
```

This reads as: a type `a` belongs to type class `Eq` if there are functions named `(==)` and `(/=)`, of the appropriate types, defined on it. A function can then require it:

```haskell
elem :: Eq a => a -> [a] -> Bool
elem y []     = False
elem y (x:xs) = (x == y) || elem y xs
```

`elem` has the type `a -> [a] -> Bool` with the context `Eq a`, which constrains the types `a` can range over to those belonging to `Eq`. The `=>` is a class constraint. Without it, the signature would be the ordinary parametrically polymorphic `a -> [a] -> Bool`, which is precisely why type classes are described as closely related to parametric polymorphism rather than opposed to it.

Membership is granted after the fact. Any type `t` is made a member of a class `C` by an **instance declaration** defining implementations of all of `C`'s methods for `t`. Define a new data type, write an `Eq` instance for it, and `elem` immediately works on lists of it.

> [!warning]
> A type class is not an OO class. `Eq` is not a type, and there is no such thing as a value of type `Eq`. The class names a constraint on types, not a set of objects.

## Where they came from

Type classes were first implemented in Haskell after being proposed by Philip Wadler and Stephen Blott as an extension to `eqtypes` in Standard ML, and were originally conceived as a way to implement overloaded arithmetic and equality operators in a principled fashion. The comparison with what came before is the interesting part: unlike Standard ML's equality types, overloading equality through type classes in Haskell does not need extensive modification of the compiler frontend or the underlying type system.

Standard ML's equality types derive all equality operators automatically in the compiler, and the programmer's control is limited to designating which type components are equality types. Modules and functors in SML and OCaml can play a similar role, the principal difference being the role of [[cs/pl/hindleymilner-type-inference|type inference]], which is what makes type classes suitable for ad hoc polymorphism.

## Dictionary passing

The implementation is the payload. A polymorphic function with a class constraint,

```haskell
sum :: Num a => [a] -> a
```

can be intuitively treated as a function that implicitly accepts an instance of `Num`:

```haskell
sum_ :: Num_ a -> [a] -> a
```

The instance `Num_ a` is essentially a record containing the instance definition of `Num a`. This is in fact how type classes are implemented under the hood by GHC. The constraint arrow `=>` is a function arrow the compiler fills in for you.

This is why type classes are cheap at runtime. Multi-parameter type classes do not require searching for the method to call on every call; the method to call is compiled and stored in the dictionary of the type class instance, just as with single-parameter classes. Dispatch is a field access on a record the caller already handed over, not a search through a hierarchy.

## Coherence, and why it costs something

Type classes and implicit parameters look nearly identical from the dictionary view, and the difference is instructive. Implicit parameters are more flexible, since different instances of `Num Int` can be passed. Type classes instead enforce **coherence**: there should be only one unique choice of instance for any given type.

Coherence is not free. It makes type classes somewhat antimodular, which is why orphan instances (instances defined in a module that contains neither the class nor the type) are strongly discouraged. What it buys is a guarantee that two disjoint parts of the same code will share the same instance.

> [!example] Why coherence matters
> An ordered set of type `Set a` needs a total ordering on `a`, evidenced by an `Ord a` constraint. There can be numerous ways to impose a total order. Set algorithms are generally intolerant of changes in ordering once a set has been constructed, so passing an incompatible `Ord a` instance to functions operating on the set may produce incorrect results or crashes. Coherence is what rules this out statically.

Scala shows the alternative. Instances (dictionaries) in Scala are ordinary values in the language rather than a separate kind of entity, and because they can be supplied explicitly to resolve ambiguity, Scala type classes do not satisfy coherence and are effectively syntactic sugar for implicit parameters.

## Rust traits

Rust's [[cs/languages/Rust/traits-and-generic-bounds|traits occupy the same slot]]. A trait defines the functionality a particular type has and can share with other types, and trait bounds specify that a generic type can be any type with certain behavior. The Rust book notes traits are similar to interfaces in other languages, with differences.

Coherence appears in Rust under its own name, with a memorable rule attached. A trait can be implemented on a type only if either the trait or the type, or both, are local to the crate. Implementing `Display` for `Vec<T>` inside your own crate is rejected because both are defined in the standard library. This restriction is part of coherence, specifically the **[[cs/languages/Rust/the-orphan-rule-and-the-newtype-pattern|orphan rule]]**, so named because the parent type is not present, and it exists because without it two crates could implement the same trait for the same type and Rust would not know which implementation to use.

Two features do work a class system cannot do as neatly. **[[cs/languages/Java/default-methods-and-interface-evolution|Default implementations]]** let a trait supply behavior for some or all methods, so a type opts in with an empty `impl` block and inherits the default. **Blanket implementations** implement a trait for any type satisfying a trait bound, and are used extensively in the standard library: `impl<T: Display> ToString for T` is why `3.to_string()` works.

## Static dispatch, and what it is not

The generic side of Rust compiles by **[[cs/languages/Rust/monomorphization-and-code-bloat|monomorphization]]**, the process of turning generic code into specific code by filling in the concrete types used at compile time. The compiler looks at every place generic code is called and generates code for the concrete types it is called with, so `Option<T>` used at `i32` and `f64` becomes two specialized definitions. There is no runtime cost, because the code performs as if each definition had been duplicated by hand.

Traits and trait bounds let the compiler check that all concrete types used with the code provide the correct behavior. In dynamically typed languages, calling a method a type does not define is a runtime error; Rust moves that error to compile time, and no runtime behavior check is needed because the check already happened.

> [!tip]
> Both dictionary passing and monomorphization solve the same problem, which is knowing which implementation an overloaded name refers to. Dictionaries answer it at runtime with a value passed along the call chain, and monomorphization answers it at compile time by making a separate copy. Neither one is dynamic dispatch on a receiver, which is the mechanism [[cs/pl/objects-classes-and-dispatch|objects]] use. That difference is why multi-parameter type classes can select an implementation depending on the types of multiple arguments, and indeed return types.

## Related Notes

- [[cs/pl/parametric-polymorphism-adts|Parametric Polymorphism & ADTs]]
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]]
- [[cs/pl/hindleymilner-type-inference|Hindley-Milner Type Inference]]
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes & Dispatch]]
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]]
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures & Separate Compilation]]

## Sources

- "Type class," Wikipedia. https://en.wikipedia.org/wiki/Type_class . Backs the definition of a type class as constraining type variables in parametrically polymorphic types, the `Eq` and `elem` examples and the class-constraint reading, instance declarations conferring membership, the fact that `Eq` is not a type, the Wadler and Blott origin as an extension to Standard ML `eqtypes` and the arithmetic/equality motivation, the contrast with SML equality types and ML modules, the dictionary implementation of constraints in GHC, the absence of runtime method search, the coherence property and its antimodular cost including orphan instances, the ordered-set example, and Scala's non-coherent instances-as-values.
- "Traits: Defining Shared Behavior," The Rust Programming Language. https://doc.rust-lang.org/book/ch10-02-traits.html . Backs the definition of a trait and trait bounds, the comparison to interfaces, the locality restriction and the coherence/orphan rule with its rationale, default implementations, blanket implementations and the `ToString`/`Display` example, and the compile-time checking of behavior versus runtime method errors in dynamic languages.
- "Generic Data Types," The Rust Programming Language. https://doc.rust-lang.org/book/ch10-01-syntax.html . Backs monomorphization as turning generic code into specific code at compile time, the `Option<T>` specialization example, and the claim that generics carry no runtime cost.
