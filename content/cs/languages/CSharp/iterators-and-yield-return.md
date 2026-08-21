---
title: "Iterators and yield return"
description: "A method containing yield return is not a method that runs and returns a sequence. It is a method the compiler turns inside out into an object that remembers where it stopped."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-04
updated:
aliases:
  - yield return in C#
  - C# Iterator Methods
  - Lazy Sequences in C#
---

Write a method with `yield return` in it and the shape of the code lies to you in a productive way. It reads like a method that runs top to bottom and produces a sequence. What the compiler actually builds is an object with a resume point, and the body you wrote gets executed in slices, each slice triggered by a consumer asking for one more element.

> [!note] The idea
> `yield return` is a suspension point, and its existence changes what the method call means. Calling an iterator does not execute it. When you start to iterate, the iterator executes until the first `yield return`, then the execution of the iterator is suspended and the caller gets the value. On the next iteration, execution resumes after the `yield return` that caused the previous suspension. That is the same rewrite `await` gets, aimed at a different interface: one produces something a consumer pulls from, the other produces something a completion event pushes into.

## What `foreach` was always doing

`foreach` is not primitive. It relies on two generic interfaces defined in the core library to generate the code necessary to iterate a collection, `IEnumerable<T>` and `IEnumerator<T>`, and the compiler expands the loop into something close to this:

```csharp
IEnumerator<int> enumerator = collection.GetEnumerator();
while (enumerator.MoveNext())
{
    var item = enumerator.Current;
    Console.WriteLine(item.ToString());
}
```

The real expansion is wrapped in a `try` with a `finally` that disposes the enumerator, which is why breaking out of a `foreach` early still cleans up. The pair of interfaces is the whole contract: `MoveNext` advances or reports exhaustion, `Current` exposes the element it landed on. Anything that can implement those two members can be walked with `foreach`, which is why the language never needed a collection base class the way older frameworks did.

Implementing that pair by hand is where the pain used to live. You end up writing a class whose fields are the local variables of a loop you would rather have written as a loop, with an integer telling you which part of the traversal you are in. `yield return` is the language admitting that this class is mechanical and generating it for you.

## Laziness is the observable consequence

The documentation demonstrates the ordering directly, and the interleaving in the output is the entire lesson:

> [!example] Nothing runs until someone pulls
> ```csharp
> var numbers = ProduceEvenNumbers(5);
> Console.WriteLine("Caller: about to iterate.");
> foreach (int i in numbers) { Console.WriteLine($"Caller: {i}"); }
> ```
> ```
> Caller: about to iterate.
> Iterator: start.
> Iterator: about to yield 0
> Caller: 0
> Iterator: yielded 0
> Iterator: about to yield 2
> Caller: 2
> ```
> `Iterator: start.` prints after `Caller: about to iterate.`, even though the call came first. Producer and consumer alternate on one thread, each running until it needs the other.

This is [[cs/pl/evaluation-order-and-strictness|non-strict evaluation]] introduced into an otherwise eager language at one specific syntactic site. The sequence exists as a recipe, and elements are computed on demand. An infinite iterator is therefore not a hang, it is a normal object, as long as the consumer stops asking. It also means an argument validation check written at the top of an iterator method does not run when the method is called, which is the recurring bug: the exception you expected on the bad call surfaces later, at the first `MoveNext`, in whatever code happened to start enumerating.

Laziness is what makes iterator methods compose without materializing anything in between. Chain a filter onto a projection onto a sampler and no intermediate list is ever allocated, because each stage pulls one element from the stage above it. That pipeline property is exactly what [[cs/languages/CSharp/linq-and-expression-trees|LINQ]] is built out of, and most of the standard query operators are iterator methods with better names.

## The rules, and where they come from

The restrictions on `yield` look arbitrary until you remember that the method body is being torn apart and reassembled inside a generated class.

You cannot have both a `return` statement and a `yield return` statement in the same method. The method is either an ordinary method that hands back a finished sequence or an iterator that describes how to produce one, and the compiler will not let you be both. The documented remedy is to split it: a public method that uses `return` to hand back either an empty array or the result of a private iterator method. That split incidentally fixes the eager-validation problem, since the public half runs immediately.

`yield` is also forbidden in methods with `in`, `ref`, or `out` parameters, in lambda expressions and anonymous methods, and inside `unsafe` blocks. Before C# 13, `yield` was invalid in any method containing an `unsafe` block; from C# 13 it is allowed in such a method as long as it is not inside the unsafe block itself. The `ref` restriction is the same one `async` methods carry, and for the same reason: a reference to a caller stack slot cannot outlive a suspension.

Exception handling gets a narrower version of the rule. `yield return` and `yield break` cannot appear in `catch` or `finally` blocks, or in a `try` block that has a corresponding `catch`. They are allowed in a `try` block with no `catch` and only a `finally`. That carve-out is precisely shaped to let `using` work, since a `using` statement compiles into a `try` with a `finally` and no `catch`. The resource acquired in a `using` stays alive across every suspension and is disposed when the iterator completes, by reaching the end or by `yield break`, or when the iterator itself is disposed because the caller broke out of the enumeration early.

## The same machine, two interfaces

Replace `IEnumerable<T>` with `IAsyncEnumerable<T>` and add `async`, and the method becomes an asynchronous iterator that a consumer walks with `await foreach`. The body can now contain both `await` and `yield return`, and the compiler translates the loop into a `GetAsyncEnumerator` call with `await enumerator.MoveNextAsync()` at the top.

That symmetry is the payload. [[cs/languages/CSharp/async-await-and-the-state-machine|The async state machine]] and the iterator state machine are one transformation with two targets, and `IAsyncEnumerable<T>` is what you get when both suspension flavors land in the same body. The general name for the construct is a [[cs/pl/coroutines-and-generators|coroutine]], and C# grew two special cases of it a decade apart before ever naming the concept. [[cs/languages/Python/generators-and-iterators|Python took the other route]], exposing one generator mechanism and letting the async story be built from it.

## Related Notes

- [[cs/languages/CSharp/async-await-and-the-state-machine|async, await, and the State Machine]] - the same rewrite pointed at Task instead of IEnumerator.
- [[cs/languages/CSharp/linq-and-expression-trees|LINQ and Expression Trees]] - what deferred execution buys once the pipeline is a library.
- [[cs/pl/coroutines-and-generators|Coroutines & Generators]] - the concept both C# features are instances of.
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order & Strictness]] - why pull-based sequences behave unlike every other C# call.
- [[cs/languages/Python/generators-and-iterators|Generators and Iterators in Python]] - one mechanism where C# has two.
- [[cs/languages/Cpp/iterators-and-ranges|Iterators and Ranges]] - a language that made the enumerator a value type and paid for it in syntax.

## Sources

- "Iterators (C#)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/iterators . Supports the definition of an iterator method, the reliance of foreach on IEnumerable and IEnumerator, the compiler expansion of foreach into GetEnumerator and MoveNext with a try and finally, the asynchronous expansion with GetAsyncEnumerator and MoveNextAsync, the ban on mixing return with yield return, and the recommended split into two methods.
- "yield statement (C# reference)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/yield . Supports yield return and yield break, that calling an iterator does not execute it, the suspend and resume ordering with the worked output, the restrictions on in, ref, and out parameters, lambdas, and unsafe blocks including the C# 13 change, the try, catch, and finally rules, and the using statement lifetime and disposal behavior.
