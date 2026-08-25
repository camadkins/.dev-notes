---
title: Protocols and Structural Subtyping
description: "A Protocol moves the interface declaration from the implementer to the consumer, which is what makes duck typing checkable. Python keeps nominal typing as the default and makes structural an opt-in per type."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-06-30
updated:
aliases: []
---

PEP 484 only specifies the semantics of nominal subtyping. That one sentence explains why annotating idiomatic Python was awkward for four years: the language's runtime had always been structural, and its type system was not.

The problem PEP 544 names is concrete. To satisfy `Sized` and `Iterable[int]` under PEP 484, a class has to be explicitly marked to support them, which is unpythonic and unlike what one would normally do in idiomatic dynamically typed Python code. The same problem appears with user-defined abstract base classes: they must be explicitly subclassed or registered, which is particularly difficult to do with library types as the type objects may be hidden deep in the implementation of the library.

> [!note] The idea
> A `Protocol` relocates the interface declaration from the *implementer* to the *consumer*. The class being checked says nothing, imports nothing, and inherits nothing. That inversion is the entire mechanism, and the PEP demonstrates it with a detail worth pausing on: static type checkers will recognize protocol implementations even if the corresponding protocols are not imported. A class in `main.py` satisfies a protocol declared in `lib.py` without `main.py` ever naming it. Duck typing becomes checkable the moment the duck's shape is written down somewhere the duck cannot see.

## What a protocol declares

Protocols are defined by including the special class `typing.Protocol`, an instance of `abc.ABCMeta`, in the base classes list, typically at the end of the list. Everything in the body becomes part of the contract. All methods defined in the protocol class body are protocol members, both normal and decorated with `abstractmethod`. Static methods, class methods, and properties are equally allowed.

Two rules about the body matter more than they look. If any parameters of a protocol method are not annotated, then their types are assumed to be `Any`, so an under-annotated protocol quietly accepts anything in those positions. And bodies of protocol methods are type checked, which means a protocol is real code with a real default implementation, not a signature-only declaration.

Variables become members through PEP 526 annotations in the class body. Additional attributes only defined in the body of a method by assignment via `self` are not allowed. The rationale is precise and is the one design decision that separates a protocol from a base class: the protocol class implementation is often not shared by subtypes, so the interface should not depend on the default implementation. An attribute you can only discover by running `__init__` is not part of an interface, because a structural implementer never runs your `__init__`.

## The subtyping rules

Protocols cannot be instantiated, so there are no values whose runtime type is a protocol. From there the relation is short. A protocol is never a subtype of a concrete type. A concrete type `X` is a subtype of protocol `P` if and only if `X` implements all protocol members of `P` with compatible types, and in other words, subtyping with respect to a protocol is always structural. One protocol is a subtype of another if it defines all the other's members with compatible types.

The asymmetry is the interesting half. Concrete-to-protocol is structural; protocol-to-concrete never holds. So a protocol is a *ceiling* on what a checker will believe about a value, never a floor, which is what keeps the [[cs/pl/subtyping-variance-type-constraints|subtyping relation]] from collapsing into "everything matches everything."

Generic protocols follow the rules for generic abstract classes, except for using structural compatibility instead of compatibility defined by inheritance relationships. Variance works exactly as it does elsewhere, which is why protocol classes were the first place checkers implemented [[cs/languages/Python/variance-in-python-generics|variance inference]], years before it was generalized.

`type[Proto]` is deliberately excluded from the structural rule: variables and parameters annotated with `type[Proto]` accept only concrete, non-protocol subtypes of `Proto`. You can ask for a value shaped like a protocol. You cannot ask for the protocol's class object, because there isn't one to hand you.

## How this differs from TypeScript

Comparing against [[cs/languages/TypeScript/structural-typing-and-assignability|TypeScript's assignability rule]] sharpens what Python actually did. TypeScript's assignability is structural for every type, always, with no opt-in; nominal behavior has to be simulated with brand fields. Python went the other direction: nominal remains the default, and structural is available per type by inheriting one marker class.

PEP 544 is explicit that this was deliberate, not transitional. It does not propose to replace the nominal subtyping described by PEP 484 with structural subtyping completely. Instead, protocol classes complement normal classes, and users are free to choose where to apply a particular solution. There is a rejected-ideas entry titled "make every class a protocol by default," which is precisely the TypeScript design, considered and declined.

The library split shows the reasoning applied. `Callable`, `Iterable`, `Iterator`, `Hashable`, `Sized`, `Container`, and the `Supports*` family became protocols. `list`, `set`, `IO`, and `deque` did not, on the grounds that they are sufficiently complex that it makes sense to keep them non-protocols and require code to be explicit about them. The justification for keeping them nominal is a maintenance argument: it is too easy to leave some methods unimplemented by accident, and explicitly marking the subclass relationship allows type checkers to pinpoint the missing implementations. Structural matching tells you a class failed. Nominal declaration tells you which method is missing.

> [!example] Explicit subclassing is still allowed, and it means something different
> To explicitly declare that a certain class implements a given protocol, it can be used as a regular base class, and in this case a class could use default implementations of protocol members. Subclassing a protocol class would not turn the subclass into a protocol unless it also has `typing.Protocol` as an explicit base class. So the same class object plays two roles: a shape to match against, and an ordinary abstract base you can inherit from for code reuse. The PEP kept explicit subclassing partly because it makes it possible to force a class to be considered a subtype of a protocol, using a `# type: ignore` together with an explicit base class, when it is not strictly compatible, such as when it has an unsafe override.

## The runtime is not involved

At runtime, protocol classes will be simple abstract base classes. There is no intent to provide sophisticated runtime instance and class checks against protocol classes, and following PEP 484 and PEP 526 the PEP states that protocols are completely optional, with no runtime semantics imposed for variables or parameters annotated with a protocol class. All structural subtyping checks will be performed by static type checkers, and no additional support for protocol validation will be provided at runtime.

This is the same side channel as every other typing feature, and it is why the [[cs/languages/Python/runtime-checkable-protocols-and-their-limits|`runtime_checkable` escape hatch]] checks so much less than people expect.

The comparison to Java the PEP draws is worth keeping. Protocols do not require explicit declaration of implementation, they are mainly oriented on duck typing, and unlike an interface they can have default implementations of members and store state. That last clause is what makes a protocol the checkable form of the [[cs/software-engineering/dependency-injection-and-inversion-of-control|dependency inversion]] instinct: the consumer writes the interface it needs, and any object already in the program may turn out to satisfy it.

## Related Notes

- [[cs/languages/TypeScript/structural-typing-and-assignability|Structural Typing and Assignability]] - the same idea as a language-wide default rather than an opt-in
- [[cs/languages/Go/interfaces-and-implicit-satisfaction|Interfaces and Implicit Satisfaction]] - implicit satisfaction with runtime enforcement behind it
- [[cs/languages/Python/runtime-checkable-protocols-and-their-limits|Runtime-Checkable Protocols and Their Limits]] - what survives into `isinstance`, and what does not
- [[cs/software-engineering/dependency-injection-and-inversion-of-control|Dependency Injection and Inversion of Control]] - the design instinct protocols make checkable
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance, and Type Constraints]] - the relation protocols participate in structurally
- [[cs/languages/Python/the-data-model-and-dunder-methods|The Data Model and Dunder Methods]] - the runtime protocols that existed long before anyone could annotate them

## Sources

- "PEP 544 - Protocols: Structural subtyping (static duck typing)," Python Enhancement Proposals. https://peps.python.org/pep-0544/ . Supports PEP 484 specifying only nominal subtyping, the requirement that a class be explicitly marked as unpythonic, abstract base classes needing explicit subclassing or registration and the difficulty with library types, the definition of protocols via a `typing.Protocol` base typically at the end of the list, all class-body methods being protocol members including `abstractmethod` ones, unannotated parameters defaulting to `Any`, protocol method bodies being type checked, static methods, class methods, and properties being allowed, variable annotations defining members while `self` assignments are not allowed and the rationale about not depending on the default implementation, protocols not being instantiable with no values whose runtime type is a protocol, a protocol never being a subtype of a concrete type, the if-and-only-if structural rule for concrete subtypes and the protocol-to-protocol rule, generic protocols following generic abstract class rules with structural compatibility, `type[Proto]` accepting only concrete subtypes, checkers recognizing implementations even when the protocol is not imported, the refusal to replace nominal subtyping with structural and the complement framing, the list of `typing` classes becoming protocols and the decision to keep `list`, `set`, `IO`, and `deque` non-protocols with the accidental-missing-method justification, explicit subclassing giving default implementations, subclassing not producing a protocol without an explicit `Protocol` base, the `# type: ignore` forcing case, protocol classes being simple abstract base classes at runtime with no sophisticated runtime checks and no imposed runtime semantics, all checks being performed by static type checkers with no runtime validation support, and the contrast with Java interfaces on explicit declaration, default implementations, and stored state.
