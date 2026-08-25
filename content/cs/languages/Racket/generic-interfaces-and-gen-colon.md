---
title: Generic Interfaces and the gen Prefix
description: "define-generics, the method table that rides on a structure type property, and dispatch chosen by argument name rather than by receiver position."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-02
updated:
aliases:
  - define-generics
---

Racket has classes. `racket/class` is a full object system with inheritance, mixins, and interfaces. Almost nobody reaches for it when defining a protocol that several data types should satisfy. They write this instead:

```racket
(define-generics printable
  (gen-print printable [port])
  (gen-port-print port printable))

(struct num (v)
  #:methods gen:printable
  [(define (gen-print n [port (current-output-port)])
     (fprintf port "Num: ~a" (num-v n)))
   (define (gen-port-print port n) (gen-print n port))])
```

The struct gains a protocol without gaining a superclass, and the second method takes its receiver in the *second* argument position. Both facts follow from the same design.

> [!note] The idea
> A generic interface is a method table attached to a structure type as a property, and the dispatch argument is identified by **name**, not by position. Each method's formal argument list must contain an argument spelled the same as the interface identifier, and that argument is the one dispatch looks at. Dispatch therefore does not need a privileged first slot, does not need a receiver syntax, and does not need the value to be an object. It needs the value's *type* to carry the table, which is what a structure type property is for.

## Three names out of one form

`define-generics` defines a family. Given the identifier `printable`, it binds `gen:printable` as a transformer binding for the static information about a new generic interface, `printable?` as a predicate identifying instances of structure types that implement this generic group, and each listed method identifier as a generic method that calls the corresponding method on values where the predicate is true. It also binds `printable/c`, a contract combinator that recognizes instances of structure types implementing the interface and takes pairs of method identifiers and contracts, applying each contract to the corresponding method implementation.

The `gen:` prefix is the tell that the first of these is not a value. It is a transformer binding, visible to the expander, which is why `#:methods gen:printable [...]` inside a `struct` form works at all: the struct macro needs to know at compile time which methods the interface expects and in what shape, and it gets that by resolving `gen:printable` during expansion rather than by looking anything up at runtime. The predicate `printable?` is the runtime half.

## Dispatch by name is the load-bearing choice

Each method's formal arguments must include a required by-position argument that is `free-identifier=?` to the interface identifier, and the Reference is explicit about what that argument does: it is used in the generic definition to locate the specialization. Look again at `(gen-port-print port printable)`. The receiver is named `printable`, matching the interface name, and it sits second because the method is meant to read like the `fprintf` family, port first.

This is a small syntactic rule with a real consequence. In a class system the dispatch value is structurally privileged: it is the thing before the dot, or the implicit `self`, and a method that wants to dispatch on its second argument has to be written backwards or wrapped. That constraint is the source of the double-dispatch problem and of a good share of the visitor pattern's existence, described more generally in [[cs/pl/objects-classes-and-dispatch|objects, classes, and dispatch]]. Racket's generics do not remove single dispatch, they only stop insisting the dispatch argument come first. The method signature stays in whatever order reads well.

## The table lives on the type, not the value

The Reference for structure type properties states the layering plainly: generic interfaces provide a high-level API on top of structure type properties, and a structure type property allows per-type information to be associated with a structure type, as opposed to per-instance information associated with a structure value. Subtypes inherit the property values of their parent types, and subtypes can override an inherited property value with a new value.

That is a vtable, described in different words. One table per type, shared by every instance, inherited by subtypes, overridable. The difference from the layout in [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|C++ virtual dispatch]] is where the pointer lives: a C++ object carries a vptr in its own storage, so the object's size and layout change when it acquires virtual methods. A Racket struct instance carries nothing extra. The property hangs off the structure type descriptor, and instances reach it through the descriptor they already point at. Adding a generic interface to a struct is free at the instance level, which is why [[cs/languages/Racket/structs-and-pattern-matching|Racket structs]] can pick up half a dozen interfaces without becoming heavier values.

## Opting in is explicit, and can be enforced

The `#:methods` keyword is nominal opt-in: a type implements the interface because its definition says so, not because its method names happen to line up. Whether a protocol is joined by declaration or by shape is the axis [[cs/pl/type-classes-and-traits|type classes and traits]] turn on, and Racket picks declaration. It buys a specific thing, which is that `printable?` can answer truthfully in constant time by checking a property rather than by scanning for a set of method names.

Partial implementation is allowed by default, and since version 8.7.0.5 of the `base` package there is a way to forbid it. With `#:requires`, any instance of the generic interface must supply an implementation of the specified methods, and otherwise a compile-time error is raised. Without it, a missing method is a runtime condition: `raise-support-error` raises an `exn:fail:support` exception for a generic method that does not support a given instance.

> [!example] Calling the generic from inside a specialization
> A struct that composes two other printable values needs to call the *generic* `gen-print`, not its own specialization, on the parts. Writing `gen-print` inside the method body would be ambiguous, so `define/generic` binds a local name to the generic version:
>
> ```racket
> (struct string+num (v n)
>   #:methods gen:printable
>   [(define/generic super-print gen-print)
>    (define (gen-print b [port (current-output-port)])
>      (super-print (string+num-v b) port)
>      (fprintf port " ")
>      (super-print (string+num-n b) port))])
> ```
>
> The Reference describes this form as useful for method specializations to use generic methods, as opposed to the local specialization, on other values. It is a syntax error anywhere outside a `#:methods`, `#:fallbacks`, `#:defaults`, or `#:fast-defaults` block, because outside those contexts there is no specialization to distinguish it from.

## Where the contract goes

`printable/c` is not meant to wrap a value at an arbitrary boundary. The Reference says the combinator is intended to be used to contract the range of a constructor procedure for a struct type that implements the generic interface. Guarding the constructor guards every instance that type will ever produce, once, at the point where the type is defined, rather than at every call site that touches one. That placement is the same instinct as attaching a contract to a `provide` clause, covered in [[cs/languages/Racket/contracts-and-blame|contracts and blame]]: pick the narrowest boundary that every value must cross.

## Related Notes

- [[cs/languages/Racket/structs-and-pattern-matching|Structs and Pattern Matching in Racket]] - the type the property attaches to, and the opacity decision it interacts with
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - what changes when the dispatch argument stops being positionally special
- [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|Virtual Dispatch, Vtables, and Object Layout]] - the same table, stored inside the object instead of beside the type
- [[cs/languages/Go/interfaces-and-implicit-satisfaction|Interfaces and Implicit Satisfaction]] - structural opt-in as the alternative to naming the interface
- [[cs/pl/type-classes-and-traits|Type Classes and Traits]] - the static version, resolved at compile time rather than through a property lookup
- [[cs/languages/Racket/contracts-and-blame|Contracts and Blame in Racket]] - why the interface contract belongs on the constructor's range

## Sources

- "5.4 Generic Interfaces," The Racket Reference. https://docs.racket-lang.org/reference/struct-generics.html . Supports a generic interface associating per-type methods with generic functions, the three-plus names bound by `define-generics` (`gen:id` as a transformer binding for static information, `id?` as a predicate identifying implementing instances, each method as a generic method), the dispatch argument being the one `free-identifier=?` to the interface name and used to locate the specialization, `id/c` as a combinator intended to contract a constructor's range, `#:requires` forcing a compile-time error on a missing implementation as of base 8.7.0.5, `raise-support-error` and `exn:fail:support`, and `define/generic` with the `string+num` example and its restriction to method blocks.
- "5.3 Structure Type Properties," The Racket Reference. https://docs.racket-lang.org/reference/structprops.html . Supports generic interfaces being a high-level API over structure type properties, a property carrying per-type rather than per-instance information, and subtypes inheriting and overriding property values.
