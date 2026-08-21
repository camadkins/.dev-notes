---
title: "LINQ and Expression Trees"
description: "The same where clause compiles into two unrelated artifacts depending on the static type of the source: a delegate the runtime calls, or a data structure a database provider reads."
draft: false
comments: true
tags:
  - cs
  - languages
  - databases
date: 2026-08-11
updated:
aliases:
  - Deferred Execution in LINQ
  - IEnumerable vs IQueryable
  - How LINQ Becomes SQL
---

Two queries can be character-for-character identical and compile into artifacts with nothing in common. Written against an array, the lambda in a `where` clause becomes a compiled method the runtime invokes per element. Written against a database table, the same lambda becomes an object graph that no one invokes at all, which a provider walks and translates into SQL. Nothing in the syntax marks the difference. The static type of the source decides it.

> [!note] The idea
> A lambda in C# has two possible fates and the target type picks between them. Assigned to a delegate type it is compiled to a method. Assigned to `Expression<TDelegate>` the compiler emits code to build an expression tree that represents the lambda expression, and your predicate becomes data. That single overload resolution decision is the entire mechanism by which a query written in C# executes on a database engine, and it is also why some perfectly legal C# throws only once it reaches a provider that cannot translate it.

## Executing a query is a separate event from writing one

The first thing to unlearn is that a query variable holds results. In LINQ, the execution of the query is distinct from the query itself, and you do not retrieve any data by creating a query variable. A query is executed in a `foreach` statement, because `foreach` requires `IEnumerable` or `IEnumerable<T>`. The rule for what can be queried is correspondingly simple: a LINQ data source is any object that supports the generic `IEnumerable<T>` interface, or an interface that inherits from it, typically `IQueryable<T>`.

Standard query operators split into immediate and deferred. Immediate execution means the data source is read and the operation is performed once, and all the standard query operators that return a scalar result execute immediately. `Count`, `Max`, `Average`, and `First` are in that group, and they run without an explicit `foreach` because the query itself must use `foreach` in order to return a result. Deferred execution means the operation is not performed at the point in the code where the query is declared, but only when the query variable is enumerated. Almost all standard query operators whose return type is `IEnumerable<T>` or `IOrderedEnumerable<TElement>` execute in this deferred manner.

The consequence reads as a bug until you expect it. The results depend on the contents of the data source when the query is executed rather than when it is defined, so enumerating a query variable twice might give different answers each time. That is the design: deferred execution provides query reuse, since the query fetches updated data each time the results are iterated. `ToList` or `ToArray` forces immediate execution and caches the results, which provides reuse of the query results rather than of the query declaration.

Deferred operators divide again. Streaming operators do not have to read all the source data before they yield elements; each source element is processed as it is read and yielded if appropriate. Nonstreaming operators must read all the source data before they can yield a single result element, which is where sorting and grouping live: they read everything, put it into a data structure, perform the operation, and then yield. This is why an `OrderBy` in the middle of a pipeline quietly converts a constant-memory stream into a full materialization.

All of this is [[cs/languages/CSharp/iterators-and-yield-return|the iterator machinery]] wearing library clothes. A streaming operator is an iterator method that pulls one element from upstream and yields at most one downstream.

## The two `Where` methods

There are two `Where` extension methods with the same name and different receivers. The one on `IQueryable<TSource>` declares its predicate parameter as `Expression<Func<TSource, bool>>`, and the API reference states the rule for such parameters plainly: you can pass in a lambda expression and it will be compiled to an `Expression<TDelegate>`. You write the same lambda for both, and [[cs/languages/CSharp/delegates-events-and-the-func-family|the delegate case]] is the ordinary one: in a typical LINQ query those function arguments are transformed into a delegate the compiler creates.

The other case is where it gets interesting. Expression trees represent code as a structure you examine, modify, or execute. When a lambda expression is assigned to a variable of type `Expression<TDelegate>`, the compiler emits code to build an expression tree that represents the lambda expression rather than a method that performs it.

```csharp
Expression<Func<int, bool>> lambda = num => num < 5;
```

That line allocates nodes: a binary less-than node, a parameter node, a constant node, assembled at run time by code the compiler wrote for you. The predicate is now a value you can traverse, and traversal is the whole business model. Entity Framework accepts expression trees as the arguments for the LINQ query expression pattern, which is what enables it to translate the query you wrote in C# into SQL that executes in the database engine. The mocking framework Moq reads the same structures for an unrelated purpose.

Handing a compiler a source-level structure and getting a manipulable representation back is the [[cs/pl/macros-and-metaprogramming|code-as-data]] move, done at run time and confined to expressions. The target of the translation is a language with its own algebra and its own optimizer, so a well-formed tree can be rewritten into [[cs/history/relational-model-and-sql|relational operations]] the server plans on its own terms. [[cs/languages/Java/streams-and-the-collector-abstraction|Java streams]] made the opposite choice and kept everything in delegate form, which is why the JPA Criteria API is a separate builder rather than the same query text.

The handoff to a provider is mechanical rather than magical. `Queryable.Where` generates a `MethodCallExpression` that represents calling `Queryable.Where` itself as a constructed generic method, then passes that expression to the `CreateQuery` method of the `IQueryProvider` represented by the `Provider` property of the source. The operator does not filter anything. It appends a node describing itself to a tree and hands the tree back to whoever owns the data. What happens next depends on the implementation of the type of the source parameter, with the expected behavior being that the elements satisfying the predicate come back.

Trees are immutable. To modify one you construct a new tree by copying the existing one and replacing nodes, traversing with an expression tree visitor. Providers are visitors that emit a different language on the way out.

## What the compiler refuses to turn into a tree

> [!warning] Compiling is not the same as being translatable
> The C# compiler generates expression trees only from expression lambdas, the single-line kind. It cannot parse statement lambdas. Beyond that, expression trees do not support new expression node types, because introducing one would be a breaking change for every library that interprets trees. The excluded list is long and includes constructs that feel routine: assignments and statement bodies, `await` expressions and async lambdas, interpolated strings, tuple literals and `with` expressions, pattern matching with `is` and switch expressions, unsafe pointer operations, `dynamic`, the null-propagating `?.` operator, collection expressions, `throw` expressions, and `ref`, `in`, or `out` parameters. Features added in C# 6 and later that do appear are exposed in the equivalent earlier syntax where possible, which is deliberate: it means code that interprets expression trees works the same when new language features are introduced.

Separate the two failure modes. A statement lambda where an `Expression<TDelegate>` is expected is a compile error, and you find out immediately. A perfectly buildable tree that calls a method your provider does not recognize fails at run time, because the compiler only guarantees it can build the structure, never that a provider knows what to do with each node. Every "could not be translated" exception is a provider declining a node the language was happy to hand it.

## Related Notes

- [[cs/languages/CSharp/iterators-and-yield-return|Iterators and yield return]] - the pull-based execution model deferred operators are built on.
- [[cs/languages/CSharp/delegates-events-and-the-func-family|Delegates, Events, and the Func Family]] - the other fate of a lambda, and the one most LINQ actually uses.
- [[cs/pl/macros-and-metaprogramming|Macros & Metaprogramming]] - code as data, at compile time rather than run time.
- [[cs/pl/grammar-ambiguity-parse-trees|Grammar Ambiguity & Parse Trees]] - what an expression tree is a run-time instance of.
- [[cs/history/relational-model-and-sql|The Relational Model and SQL]] - the language a provider is translating into, and why it can be optimized on arrival.
- [[cs/languages/Java/streams-and-the-collector-abstraction|Streams and the Collector Abstraction]] - the same pipeline idea without the expression-tree half.

## Sources

- "Introduction to LINQ queries (C#)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/linq/get-started/introduction-to-linq-queries . Supports the separation of query execution from query declaration, the queryable-type rule covering IEnumerable and IQueryable, immediate versus deferred execution and their operator groups, ToList and ToArray forcing execution and caching, the varying-results consequence of deferred execution, and the streaming versus nonstreaming classification.
- "Queryable.Where Method," Microsoft Learn API reference. https://learn.microsoft.com/en-us/dotnet/api/system.linq.queryable.where . Supports the Expression-typed predicate parameter on the IQueryable overload, the rule that a lambda passed to such a parameter is compiled into an Expression, the generation of a MethodCallExpression representing the call itself, the handoff to CreateQuery on the source provider, and that the resulting behavior depends on the implementation of the source type.
- "Expression Trees (C#)," Microsoft Learn. https://learn.microsoft.com/en-us/dotnet/csharp/advanced-topics/expression-trees/ . Supports lambda arguments becoming compiler-created delegates in a typical LINQ query, Entity Framework accepting expression trees and translating C# queries into SQL, the Moq example, expression trees as a structure you examine, modify, or execute, the Expression<TDelegate> assignment emitting tree-building code, tree immutability and the visitor pattern, the expression-lambda-only limitation, and the list of language constructs that cannot appear in a tree.
