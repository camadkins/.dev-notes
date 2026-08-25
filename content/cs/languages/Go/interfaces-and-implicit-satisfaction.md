---
title: "Interfaces and Implicit Satisfaction"
description: "Conformance the compiler computes rather than the programmer declares, the interface value as a type and value pair, and the nil trap that falls straight out of that representation."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-24
updated:
aliases: []
---

In most statically typed object languages, the relationship between a concrete type and an abstract one is a thing you write down. A Java class carries an `implements` clause, a C# class lists its interfaces after a colon, and the compiler checks the claim you made. Go has no such clause. You declare the interface in one file, the type in another, and if the methods line up, the relationship already exists. Nobody declared it, and nobody had to be told.

> [!note] The idea
> Go moves interface conformance from a **declared** property to a **computed** one. The consequence people notice first is convenience. The consequence that actually matters is directional: because the concrete type never names the interface, an interface can be invented after the fact, by a package the type's author never heard of, and the dependency arrow points from the consumer to the producer instead of the other way around. The price is paid at the representation layer, where an interface value is a pair of words rather than a pointer, and one of those two words is what makes a non-nil interface holding a nil pointer possible.

## Conformance as something the compiler works out

The Go FAQ states the design choice plainly: "Rather than requiring the programmer to declare ahead of time that two types are related, in Go a type automatically satisfies any interface that specifies a subset of its methods." The same entry lists what falls out of that. Types satisfy many interfaces at once without the machinery of multiple inheritance. An interface with one method, or even zero, can express a useful idea. And, the part that reshapes how libraries get built, "Interfaces can be added after the fact if a new idea comes along or for testing" without annotating the original types.

The language specification frames this in terms of sets rather than declarations. An interface type defines a type set, and "A variable of interface type can store a value of any type that is in the type set of the interface." A type in that set is said to implement the interface. Since Go 1.18 the same machinery describes generic constraints, which is why the [[cs/languages/Go/constraint-interfaces-and-type-sets|type set view of an interface]] is not a separate feature bolted on for generics but a re-reading of what interfaces always were.

The contrast worth drawing is with [[cs/pl/type-classes-and-traits|type classes]], where conformance is also decoupled from the type definition but still requires an explicit instance declaration somewhere. Haskell wants you to write `instance Show Foo`. Go wants nothing. That difference decides who can add a conformance and where a coherence conflict can arise, and it is the reason Go interfaces cannot carry the kind of static dispatch that a type class instance enables.

## What the compiler actually compares

Satisfaction is decided by method sets, and the spec's rules for those are narrower than intuition suggests. The method set of a defined type `T` consists of the methods declared with receiver type `T`. The method set of a pointer to a defined type contains the methods declared with receiver `*T` **or** `T`. So a pointer receiver method belongs to `*T` alone, and a value of type `T` does not satisfy an interface that method was written for. This asymmetry produces most of the "does not implement" errors a newcomer hits.

Method sets also fail to survive a type definition. The spec's own example is exact about it: given a `Mutex` with `Lock` and `Unlock` declared on `*Mutex`, a new defined type built from it has an empty method set. Methods are bound to the name, not to the shape.

Matching is by name and exact signature, with no variance in either direction. The FAQ works through an `Equaler` interface whose method takes an `Equaler`, and a type `T` whose `Equal` method takes a `T`. These look interchangeable and are not. Go's rule here is the same one that makes [[cs/pl/subtyping-variance-type-constraints|variance]] a non-issue in the language: parameter types are compared for identity, so a method is either the method the interface asked for or it is not.

## The pair

Structural satisfaction has to be paid for at run time, because a method call on an interface value cannot be resolved when the call is compiled. The stored value could be any type in the set. Rob Pike's account of reflection gives the shape: "A variable of interface type stores a pair," where "the value is the underlying concrete data item that implements the interface and the type describes the full type of that item." The FAQ says the same thing in implementation terms, that "Under the covers, interfaces are implemented as two elements, a type" and a value.

That second word is why an interface value carries more than the interface exposes. Assign an `*os.File` to an `io.Reader` and the interface value holds the full `*os.File` type, not a narrowed view of it, which is what makes an assertion back out to `io.Writer` succeed. It also means every interface-mediated call is an indirect call resolved through the stored type, the same runtime [[cs/pl/objects-classes-and-dispatch|dispatch]] problem a vtable solves in a class-based language, arrived at from the opposite direction.

## The nil that is not nil

Now the trap. The FAQ's rule is that an interface value is nil only if the type and the value are both unset, and "In particular, a nil interface will always hold a nil type." Store a nil pointer of type `*int` in an interface and "the inner type will be `*int` regardless of the value of the pointer." One of the two words is populated, so the interface is not nil.

This detonates on error returns. A function declaring `error` as its result type, returning a nil `*MyError`, returns a non-nil `error`. The caller's `if err != nil` fires on a value that means success. The bug is not in the comparison and not in the pointer. It is in the pair, and it is the clearest case in Go where a representation detail is load-bearing semantics rather than an implementation note.

> [!warning] The cost of no declaration site
> Because nothing binds a type to an interface, the compiler has no place to report a mismatch until the assignment happens, which may be in another package. The FAQ's remedy is a discarded assignment of the zero value, `var _ I = T{}`, which turns a distant failure into a local compile error. The mirror-image risk is accidental satisfaction, where an unrelated type happens to carry the right method name and signature. The FAQ's answer there is a marker method, useful only to "resolve ambiguities among similar interfaces."

## Related Notes

- [[cs/languages/Go/the-empty-interface-any-and-type-assertions]] - what the second word of the pair is checked against when you assert
- [[cs/languages/Go/constraint-interfaces-and-type-sets]] - the same interface machinery reused to bound a type parameter
- [[cs/languages/Go/generics-versus-interfaces-when-to-use-which]] - when the runtime pair is the wrong tool and a type parameter is the right one
- [[cs/pl/type-classes-and-traits]] - conformance decoupled from the type but still explicitly declared
- [[cs/pl/objects-classes-and-dispatch]] - the general problem of resolving a call when the receiver type is only known at run time
- [[cs/languages/Java/default-methods-and-interface-evolution]] - what it takes to extend an interface when conformance was declared rather than computed

## Sources

- [The Go Programming Language Specification](https://go.dev/ref/spec) - interface types as type sets, method set rules for `T` and `*T`, and the loss of methods across a type definition
- [Go Frequently Asked Questions](https://go.dev/doc/faq) - the rationale for no type inheritance and no `implements` clause, the `Equaler` signature-matching example, the two-element interface representation, and the non-nil nil error
- [The Laws of Reflection](https://go.dev/blog/laws-of-reflection) - the interface value as a concrete value paired with a type descriptor
