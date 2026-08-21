---
title: "Generic Methods and the Limits of Inference"
description: "C# infers type arguments from the arguments you pass and from nothing else. The exclusion of the return type is not an oversight, it is what keeps inference from having to know the answer before it starts."
draft: false
comments: true
tags:
  - cs
  - languages
  - type-theory
date: 2026-07-29
updated:
aliases:
  - C# Type Argument Inference
  - CS0411
  - Why C# Cannot Infer From the Return Type
---

Write a generic method and call it, and most of the time the angle brackets vanish:

```csharp
static void Swap<T>(ref T lhs, ref T rhs) { /* ... */ }

int a = 1, b = 2;
Swap(ref a, ref b);   // no <int> needed
```

You may omit the type argument and the compiler will infer it. Then one day you write a method whose type parameter appears only in the return type, the brackets stop being optional, and the error message is the flat one everybody has seen: the type arguments for the method cannot be inferred from the usage, try specifying the type arguments explicitly.

> [!note] The idea
> C# type inference is a function of one input: the static types of the arguments at the call site. It does not read the return type, it does not read the constraints, and it does not read what the result is being assigned to. That looks like a missing feature until you notice where inference sits in the pipeline. Inference runs first, and overload resolution runs on its output. Letting inference consult the return type would make the two steps depend on each other in both directions at once, so C# cuts the loop by declaring one direction off limits, and pays for it with the occasional explicit type argument.

## The rule, stated exactly

The documentation is unambiguous about the boundary. The compiler can infer the type parameters based on the method arguments you pass in, and it cannot infer the type parameters only from a constraint or return value. The immediate corollary is the one that catches people: type inference does not work with methods that have no parameters.

So a method shaped like this can never be called without brackets:

```csharp
static T Create<T>() where T : new() => new T();

var x = Create();        // CS0411
var y = Create<Widget>();  // fine
```

The constraint `where T : new()` is not a source of information for inference, and neither is the return type `T`. Whatever `x` was declared to be, whatever the surrounding expression expects, none of it reaches the inference algorithm. The error text even names the fix, which is the honest thing for a compiler to do: provide the arguments directly, changing `G()` to `G<int>()`.

This is why so much of the framework's factory surface carries explicit brackets. Anything that manufactures a `T` rather than consuming one has to be told which `T`.

## The ordering that motivates it

The reason for the boundary shows up in the phase structure. Type inference occurs at compile time before the compiler tries to resolve overloaded method signatures. The compiler applies type inference logic to all generic methods that share the same name, and in the overload resolution step, it includes only those generic methods on which type inference succeeded.

Read that sequence twice, because it settles the design question. Inference is a filter that runs across the whole candidate set, and its job is to decide which candidates are even eligible. If inference were allowed to consult the return type, it would need to know what the surrounding context expects. But the surrounding context often depends on which overload is chosen, and which overload is chosen depends on the filter. Two steps, each waiting on the other.

Excluding the return type collapses the cycle into a straight line. Argument types are known independently of everything downstream, so the filter always has its inputs available, always terminates, and always produces the same answer regardless of what the call is embedded in. That is a very different bargain from [[cs/pl/hindleymilner-type-inference|Hindley-Milner inference]], which solves for all types at once by unification and can therefore propagate information backward from a use to a definition. C# gives up the global solve in exchange for inference that is local, cheap, and composable with [[cs/pl/objects-classes-and-dispatch|overload resolution]], a feature Hindley-Milner languages mostly do not have.

## The same problem, answered the other way

Java made the opposite call, and the contrast is precise. [[cs/languages/Java/generic-methods-and-type-inference|The Java compiler]] takes advantage of target typing to infer the type parameters of a generic method invocation, where the target type of an expression is the data type the compiler expects depending on where the expression appears. Given `static <T> List<T> emptyList()`, the assignment

```java
List<String> listOne = Collections.emptyList();
```

works, because the statement expects a `List<String>` and that is the target type, so the compiler infers `T` is `String`. Java 8 expanded the notion of target type to include method arguments, so `processStringList(Collections.emptyList())` compiles too, where the Java 7 compiler had rejected it after defaulting `T` to `Object`.

The C# equivalent of that first line does not compile. This is a genuine expressiveness difference, and it is the price C# pays for having overload resolution and inference in a fixed order rather than a mutual fixed point. Java's version buys expressiveness and pays in inference complexity, which is why the interaction of target typing, overloads, and lambdas has been the source of some of the most intricate specification text in either language.

> [!warning] `var` is not an exception
> `var x = Create();` still fails, and the reason is worth internalizing. `var` does not supply a type to the right-hand side. It takes one from it. The direction of information flow is out of the expression, never into it, so `var` cannot rescue a call that inference already gave up on.

## Practical shapes

Three call patterns follow from the rule, and recognizing them saves the trip to the error list.

A method whose type parameter appears in a parameter is inference-friendly. `Process<T>(T item)`, `Map<TIn, TOut>(IEnumerable<TIn> src, Func<TIn, TOut> f)`: the second one infers both parameters, because `TOut` shows up in the lambda's return position and the lambda is an argument.

A method whose type parameter appears only in the return needs brackets. The API design lever here is real: if you want the call site to stay clean, give the method a parameter that carries the type, even a redundant one. A method taking a `Func<T>` or an `IEnumerable<T>` and returning `T` infers; the same method with the argument removed cannot.

A method with no parameters at all can never infer. There is no information to work from, and the compiler does not pretend otherwise.

## Related Notes

- [[cs/languages/Java/generic-methods-and-type-inference|Generic Methods and Type Inference]] - the same feature with target typing switched on, and what that costs.
- [[cs/pl/hindleymilner-type-inference|Hindley-Milner & Type Inference]] - what full inference looks like when there is no overloading to keep it honest.
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - overload resolution as static dispatch, the step inference has to feed.
- [[cs/languages/CSharp/constraints-on-type-parameters|Constraints on Type Parameters]] - the constraints inference is explicitly forbidden to read.
- [[cs/languages/CSharp/default-of-t-and-the-null-question|default of T and the Null Question]] - what a method returning a bare T can even produce without a value to work from.
- [[cs/pl/type-systems-goals-guarantees|Type Systems: Goals & Guarantees]] - the general trade between how much a checker infers and how predictable it stays.

## Sources

- "Generic Methods (C# Programming Guide)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/generic-methods . Supports the `Swap<T>` example and omitted type argument, the rule that inference uses method arguments and not constraints or return values, that inference fails for parameterless methods, and the ordering of inference before overload resolution.
- "Resolve errors and warnings related to generic type parameters and type arguments," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-messages/generic-type-parameters-errors . Supports the CS0411 message text, that the compiler infers type arguments from the types of the method arguments passed at the call site, and the suggested fix of writing the arguments explicitly.
- "Type Inference," The Java Tutorials. https://docs.oracle.com/javase/tutorial/java/generics/genTypeInference.html . Supports Java's use of target typing, the definition of a target type, the `Collections.emptyList()` assignment example, and the expansion of target typing to method arguments in Java SE 8.
