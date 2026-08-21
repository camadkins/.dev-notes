---
title: "Decorators"
description: "The shipped ECMAScript decorators, what a decorator function actually receives, and why the older experimental form is not a version of the same thing."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-08
updated:
aliases:
  - TypeScript Decorators
  - experimentalDecorators
---

TypeScript has had decorators since 2015 and shipped decorators in 2023. Both statements are true, and the gap between them is the whole story.

"Decorators are an upcoming ECMAScript feature that allow us to customize classes and their members in a reusable way." That framing matters more than it looks. Decorators are not a TypeScript feature that TypeScript designed. They are a JavaScript proposal that TypeScript implemented early, twice, from two different drafts.

> [!note] The idea
> The two decorator systems are not versions of one feature. In the legacy design a decorator was handed the machinery around a member, the prototype, the key, and the property descriptor, and mutated it. In the shipped design a decorator is handed the value itself plus a context object, and returns a replacement. That is a shift from patching a class after the fact to participating in its construction, and it is why almost no existing decorator survives the move unchanged.

## What a decorator receives now

A method decorator is a function of two parameters. Applying it "got called with the method target and a context object." The first is the original method. The second "has some useful information about how the decorated method was declared," including the name, whether it is static, and whether it is private.

```ts
function loggedMethod(originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name);
  function replacementMethod(this: any, ...args: any[]) {
    console.log(`LOG: Entering method '${methodName}'.`);
    const result = originalMethod.call(this, ...args);
    console.log(`LOG: Exiting method '${methodName}'.`);
    return result;
  }
  return replacementMethod;
}
```

The return value is the mechanism: because the function returned a new function, "that function replaced the original definition of" the method. There is no descriptor to mutate and no prototype to reach into. You are handed a value and you hand one back, which makes the common case a plain higher-order function and puts this much closer to [[cs/languages/Python/decorators|the Python form]] than the old design ever was.

The context object carries the part that a wrapper alone cannot do. "Apart from metadata, the context object for methods also has a useful function called addInitializer. It's a way to hook into the beginning of the constructor (or the initialization of the class itself if we're working with statics)." That is what lets a `@bound` decorator perform the `this.greet = this.greet.bind(this)` that people write by hand in constructors, without the decorator having to know anything about the constructor. TypeScript supplies `ClassMethodDecoratorContext` and its siblings to type these, and the release notes are candid that "typing decorators can be fairly complex."

Decorators still compose, still stack, and can still be produced by a factory, since "we can even make functions that return decorator functions," which is how a decorator takes arguments.

## What the old one received

The legacy handbook page opens with a disclaimer that is itself the summary: "This document refers to an experimental stage 2 decorators implementation." Under it, "a Decorator is a special kind of declaration that can be attached to a class" declaration, method, accessor, property, or parameter, and the shape of the callback is entirely different. For a method, "the decorator is applied to the Property Descriptor for the method, and can be used to observe, modify, or replace a method definition," and "the expression for the method decorator will be called as a function at runtime, with the following three arguments": the constructor or prototype, the member name, and the property descriptor.

Three parameters, one of which is a reflection object, and the decorated thing itself is reached through that object rather than passed. It is a [[cs/pl/macros-and-metaprogramming|metaprogramming]] interface built on `Object.defineProperty`, where the new one is a functional interface built on substitution.

The composition rule is the same in both and is worth knowing because it surprises people: "the expressions for each decorator are evaluated top-to-bottom. The results are then called as functions from bottom-to-top." Factories run in reading order; the decorators they return run in the opposite one.

## Why the break is not survivable

The release notes do not soften it. "While these experimental decorators have been incredibly useful, they modeled a much older version of the decorators proposal, and always required an opt-in compiler flag called" `--experimentalDecorators`. Now, "without the flag, decorators will now be valid syntax for all new code," and outside the flag they are type-checked and emitted differently. "The type-checking rules and emit are sufficiently different that while decorators can be written to support both the old and new decorators behavior, any existing decorator functions are not likely to do so."

Two omissions decide the fate of the largest existing users. "This new decorators proposal is not compatible with" `--emitDecoratorMetadata`, "and it does not allow decorating parameters."

Those two together are the foundation of TypeScript's [[cs/software-engineering/dependency-injection-and-inversion-of-control|dependency injection]] frameworks. Constructor parameter decorators are how a container is told what to inject, and emitted design-time metadata is how it learns the parameter's type without being told twice. The standard proposal supplies neither, by design, because both are the kind of runtime type information that JavaScript does not have and TypeScript declined to invent. That is consistent with the language's own stated non-goal of adding or relying on run-time type information, and it is why the flag persists: `--experimentalDecorators` "will continue to exist for the foreseeable future" for the code that cannot move.

> [!warning] The flag is a fork, not a compatibility setting
> Turning `experimentalDecorators` on or off does not adjust behavior at the margins. It selects which of two unrelated calling conventions your decorator functions must satisfy. A codebase can be on one side or the other, and a library that supports both does so by branching on what it was handed.

The larger lesson is about the cost of implementing a moving specification. TypeScript's goals include aligning with current and future ECMAScript proposals, and decorators are what that promise looks like when the proposal changes underneath you: years of ecosystem built on a draft, then a standard that is better and incompatible. Unlike everything else in the language, this feature emits real code, so the [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|usual escape of erasing to nothing]] was never available here.

## Related Notes

- [[cs/languages/Python/decorators|Decorators in Python]] - the same syntax and a much simpler contract, where a decorator is just a function of the thing it decorates
- [[cs/pl/macros-and-metaprogramming|Macros & Metaprogramming]] - modifying declarations from inside the language, and what each design lets you reach
- [[cs/software-engineering/dependency-injection-and-inversion-of-control|Dependency Injection and Inversion of Control]] - the pattern that depended on parameter decorators and emitted metadata
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - property descriptors and prototypes, the substrate the legacy design manipulated
- [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|Erasure at Runtime and Type Guards]] - the rule decorators are the exception to
- [[cs/languages/CSharp/reflection-over-generic-types|Reflection Over Generic Types]] - what runtime type metadata looks like in a platform that actually keeps it

## Sources

- TypeScript 5.0 release notes, "Decorators." https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html . Supports decorators as an ECMAScript feature, the two-parameter calling convention and the context object, replacement by return value, `addInitializer`, decorator factories, the history and status of `--experimentalDecorators`, the differing type-checking and emit, and the incompatibility with `--emitDecoratorMetadata` and parameter decorators.
- TypeScript Handbook, "Decorators" (experimental). https://www.typescriptlang.org/docs/handbook/decorators.html . Supports the stage 2 disclaimer, the declarations a legacy decorator can attach to, the three arguments passed to a legacy method decorator, the property descriptor model, decorator factories, and the top-to-bottom then bottom-to-top evaluation order.
- TypeScript Wiki, "TypeScript Design Goals." https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals . Supports alignment with ECMAScript proposals as a stated goal and the non-goal of adding or relying on runtime type information.
