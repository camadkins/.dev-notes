---
title: Self and Recursive Bounds
description: "Self is defined as a TypeVar bound to the enclosing class, so the interesting question is what it reaches that the hand-written bound cannot: attributes, protocol compatibility, and generic classes."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-15
updated:
aliases:
  - typing.Self
  - PEP 673
  - Python Self type
---

A method that returns `self` is the most common shape in fluent APIs, and annotating it correctly used to require knowing a trick.

```python
class Shape:
    def set_scale(self, scale: float) -> "Shape":
        self.scale = scale
        return self

class Circle(Shape):
    def set_radius(self, r: float) -> "Circle":
        self.radius = r
        return self

Circle().set_scale(0.5).set_radius(2.7)
# error: Shape has no attribute set_radius
```

The annotation is not wrong. It is just less than the truth. Calling `set_scale` on a subclass still infers `Shape`, and the chain breaks on the next call.

> [!note] The idea
> `Self` used in the signature of a method is treated as if it were a `TypeVar` bound to the class. That is the whole definition, and it means `Self` adds no expressive power to the type system. What it adds is a *correct default for a pattern people were writing wrong*, plus three places where the desugaring stops being a mechanical rewrite: attribute annotations, protocol compatibility, and generic classes. Those three are where `Self` is actually load-bearing rather than convenient.

## The workaround it replaced, and why it failed

The present workaround was to define a `TypeVar` with the base class as the bound and use it as the annotation for the `self` parameter and the return type. Written out, `TShape = TypeVar("TShape", bound="Shape")`, then `def set_scale(self: TShape, scale: float) -> TShape`. It works. The chain type-checks.

PEP 673's diagnosis of why nobody wrote it is the useful part. Because `self` is usually not explicitly annotated, the solution does not immediately come to mind, and even if it does, it is very easy to go wrong by forgetting either the bound on the `TypeVar` or the annotation for `self`. Drop the bound and the checker will accept unrelated types. Drop the `self` annotation and the variable is unbound at the call site. Both mistakes produce code that looks annotated.

The consequence the PEP names is the one that matters for a gradually typed system: this difficulty means that users often give up and either use fallback types like `Any` or just omit the type annotation completely, both of which make the code less safe. A correct-but-unusable annotation is functionally an unannotated one.

The frequency claim is specific and checkable. In typeshed alone, such self types are used 523 times, compared to 1286 uses of `dict` and 1314 uses of `Callable` as of October 2021. That is a construct roughly 40% as common as the two most familiar generics in the standard library's own stubs.

## The classmethod case is where it earns its keep

`__init__` returning the class is uninteresting; `cls(...)` returning it is not. A `from_config` classmethod annotated `-> Shape` means `Circle.from_config(...)` is inferred to return a value of type `Shape`, when in fact it should be `Circle`, and the next attribute access is an error.

The old spelling for this required annotating `cls` itself: `def from_config(cls: type[Self], config: dict[str, float]) -> Self`. `Self` avoids the complicated `cls: type[Self]` annotation and the `TypeVar` declaration with a bound. The `type[...]` layer is the part people never got right, because it means "the class object of the eventual subtype," which is one indirection past what the code looks like it is doing. This is the same relationship between an instance and its class that [[cs/pl/objects-classes-and-dispatch|dispatch]] rests on, spelled in the type language.

## Where the desugaring stops being a desugaring

**Attributes.** A `LinkedList` with `next: LinkedList[T] | None` lets you attach a plain `LinkedList[int]` to an `OrdinalLinkedList` node, because `LinkedList[int]` satisfies the annotation. Reading `xs.next.ordinal_value()` then fails at runtime. Writing `next: Self | None` rejects the assignment statically. The mechanism is not a substitution: the code is semantically equivalent to treating each attribute containing a `Self` type as a property that returns that type. So an annotation on a class-body name silently becomes a getter and setter pair, which is [[cs/languages/Python/the-descriptor-protocol|the descriptor protocol]] used as a specification device rather than as code.

**Protocols.** If a protocol uses `Self` in methods or attribute annotations, then a class is considered compatible with the protocol if its corresponding methods and attribute annotations use either `Self` or the class itself or any of its subclasses. A class returning a concrete `ReturnConcreteShape` from `set_scale` satisfies a `Self`-returning protocol; a class returning `int` does not; and a class that returns a *different* class is rejected because it returns a non-subclass. The rule is deliberately looser than identity, and it has to be, because [[cs/languages/Python/protocols-and-structural-subtyping|structural matching]] cannot require an implementer to have used a particular spelling.

**Generic classes.** Here the mechanical rewrite produces the wrong answer. `Self` in `class Container(Generic[T])` is equivalent to a `TypeVar` bound to `Container[Any]`, but the specified behavior is to preserve the type argument of the object on which the method was called. Called on a `Container[int]`, `Self` is bound to `Container[int]`, not `Container[Any]`.

> [!warning] The PEP leaves a hole and says so
> Inside `set_value`, the PEP does not specify the exact type of `self.value`. Some type checkers may choose to implement self types using class-local type variables with a bound of `Container[T]`, which will infer a precise `T`. But given that class-local type variables are not a standardized type system feature, it is also acceptable to infer `Any` for `self.value`, and the PEP leaves this up to the type checker. So `Self` in a generic class is defined in terms of a feature the type system does not have, and two conforming checkers may disagree about a member's type. `Self` with explicit arguments, such as `Self[int]`, is rejected outright because it creates ambiguity about the type of the `self` parameter, with the recommendation to write the explicit `self: Container[T]` instead.

## Scope rules and the recursive-bound comparison

A `Self` annotation is only valid in class contexts, and will always refer to the encapsulating class. In nested classes, `Self` will always refer to the innermost class. It nests inside other types freely, so `-> list[Self]` and `-> type[Self]` are both accepted, and a subclass may override a method that uses `Self` annotations.

What `Self` is not is a general recursive bound. Python cannot express a bound that mentions another type parameter, so the pattern [[cs/languages/Java/recursive-generic-bounds-and-self-types|Java writes as a recursive bound]] and C++ writes as CRTP has no direct Python spelling. `Self` covers the one instance of that pattern that accounts for nearly all real uses, the returns-my-own-type case, and declines the general problem. That is a defensible trade for a system whose stated aim is [[cs/pl/type-systems-goals-guarantees|catching the errors people actually make]] rather than expressing every type relation.

## Related Notes

- [[cs/languages/Python/typevar-and-generic-functions|TypeVar and Generic Functions]] - the bound mechanism `Self` is defined in terms of
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals and Guarantees]] - a system that covers the common case of a general pattern and declines the rest
- [[cs/languages/Python/the-descriptor-protocol|The Descriptor Protocol]] - what a `Self`-annotated attribute is specified to behave like
- [[cs/languages/Java/recursive-generic-bounds-and-self-types|Recursive Generic Bounds and Self Types]] - the general form Python's bounds cannot express
- [[cs/languages/Cpp/crtp-and-static-polymorphism|CRTP and Static Polymorphism]] - the same problem solved by inheritance instead of by a type variable
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - why `type[Self]` on `cls` is the honest annotation

## Sources

- "PEP 673 - Self Type," Python Enhancement Proposals. https://peps.python.org/pep-0673/ . Supports the `Shape` and `Circle` example failing with a `Shape` return type, the `TypeVar` with a base-class bound as the prior workaround, the verbosity diagnosis and the two ways to get it wrong, the fallback to `Any` or omitted annotations making code less safe, the typeshed counts of 523 self types against 1286 `dict` and 1314 `Callable` as of October 2021, the roughly 40% frequency comparison, `Self` in a method signature being treated as a `TypeVar` bound to the class, the `from_config` classmethod inferring `Shape` instead of `Circle` and `Self` avoiding the `cls: type[Self]` annotation, the `LinkedList` attribute example and the specification that a `Self`-typed attribute behaves like a property returning that type, the protocol compatibility rule accepting `Self`, the class, or its subclasses with the concrete, bad-return-type, and different-class examples, the generic-class equivalence to a bound of `Container[Any]` alongside the rule that the type argument is preserved, the unspecified type of `self.value` with class-local type variables not being a standardized feature and `Any` being acceptable, the rejection of `Self[int]` for ambiguity with the explicit-annotation recommendation, and the scope rules restricting `Self` to class contexts, binding to the innermost nested class, and permitting nesting inside other types and overriding in subclasses.
