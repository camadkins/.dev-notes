---
title: "Checked and Unchecked Exceptions"
description: "Java put failure into the type system with the throws clause, exempted two whole hierarchies from the rule, and has been arguing about the result ever since."
draft: false
comments: true
tags:
  - cs
  - languages
  - error-handling
date: 2026-08-04
updated:
aliases:
  - Java throws Clause
  - Catch or Specify
  - Checked Exceptions
---

Most languages let a function fail without saying so. Java made saying so mandatory for one category of failure, and the compiler enforces it. A method that can throw `IOException` must declare `throws IOException`, and every caller must then either handle it or repeat the declaration. Failure became part of the signature.

> [!note] The idea
> Java's real move was not adding checked exceptions but adding an effect to a method's type and then enforcing it through the override rule. A `throws` clause is a static promise about what a call can do, and the language requires an overriding method's promise to be no weaker than the one it overrides. That constraint is what makes the feature work as a contract, and it is also what makes it break down at scale: any interface written without a `throws` clause permanently forbids every implementation of it from failing in a checked way, so a single unadorned abstraction can force an entire layer beneath it to lie about its failure modes.

## What the rule actually says

The language specification is precise about the requirement. "The Java programming language requires that a program contains handlers for checked exceptions which can result from execution of a method or constructor," and the point of that requirement is stated plainly: "This compile-time checking for the presence of exception handlers is designed to reduce the number of exceptions which are not properly handled."

The Java Tutorials give the rule its operational name. "Valid Java programming language code must honor the Catch or Specify Requirement," meaning such code must be enclosed by either a `try` statement that catches the exception or a method that lists it in a `throws` clause. There is no third option: "Code that fails to honor the Catch or Specify Requirement will not compile."

For each checked exception that can result, "the throws clause for the method or constructor must mention the class of that exception or one of the superclasses of the class of that exception." That allowance is why `throws Exception` compiles and why it is a way of saying nothing.

## The exemption

The taxonomy is a partition rather than a list of special cases. "The unchecked exception classes are the run-time exception classes and the error classes," and "the checked exception classes are all exception classes other than the unchecked exception classes." Concretely: everything under `Throwable` except `RuntimeException` and its subclasses and `Error` and its subclasses.

The specification also records the reasoning, which is unusual for a language standard and makes it the best primary source on design intent. Error classes are exempt "because they can occur at many points in the program and recovery from them is difficult or impossible," and the specification adds the consequence: "A program declaring such exceptions would be cluttered, pointlessly."

Runtime exceptions get a different justification, and it is explicitly a judgment call. They "are exempted because, in the judgment of the designers of the Java programming language, having to declare such exceptions would not aid significantly in establishing the correctness of programs."

The tutorial expands on why. Runtime exceptions "represent problems that are the result of a programming problem, and as such, the API client code cannot reasonably be expected to recover from them or to handle them in any way." Dereferencing null, dividing by zero, indexing past the end of an array: these "can occur anywhere in a program, and in a typical one they can be very numerous," so declaring them "would reduce a program's clarity."

That gives the system a single design axis, stated as the tutorial's closing guideline: "If a client can reasonably be expected to recover from an exception, make it a checked exception. If a client cannot do anything to recover from the exception, make it an unchecked exception." Recoverability, not severity, decides which hierarchy a new exception class joins.

## Why a throws clause is a contract and not a warning

The specification is explicit that this is interface, not advice. The checked exception classes named in a `throws` clause "are part of the contract between the implementor and user of the method or constructor." The tutorial argues the same point from the caller's side: "Any exception that can be thrown by a method is part of the method's public programming interface," and "These exceptions are as much a part of that method's programming interface as its parameters and return value." That framing puts failure modes squarely inside [[cs/software-engineering/api-design|API Design]] rather than beside it.

Contracts have to survive subtyping, and this one does, by narrowing in exactly one direction. "The throws clause of an overriding method may not specify that this method will result in throwing any checked exception which the overridden method is not permitted, by its throws clause, to throw." An override may declare fewer exceptions, never more, and when several inherited declarations are overridden at once the constraint is their intersection.

This is the variance rule for an effect, and it points the same way as the rules in [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]]: a subtype may promise more, never less. It is also where the practical trouble starts.

## The argument

The complaint is usually stated as boilerplate, which is the weak version. The strong version is compositional, and it falls out of the override rule above.

An interface method with no `throws` clause forbids every implementation from throwing a checked exception. If the interface was written before anyone imagined an implementation backed by a network or a file, that implementation has no legal way to report a network or file failure. It can catch and wrap in an unchecked exception, or it can swallow. The same wall stands in front of any lambda passed to a functional interface whose method declares no checked exceptions, which is most of them, and it is why so much modern Java contains a `try` block whose entire body is a rethrow.

Oracle's own documentation names the resulting behavior and disapproves of it. Because unchecked exceptions are not subject to the requirement, "programmers may be tempted to write code that throws only unchecked exceptions or to make all their exception subclasses inherit from RuntimeException." Both shortcuts "allow programmers to write code without bothering with compiler errors and without bothering to specify or to catch any exceptions," and the verdict is that this "sidesteps the intent of the Catch or Specify Requirement and can cause problems for others using your classes." The tutorial concedes that some developers "consider this a serious flaw in the exception mechanism and bypass it by using unchecked exceptions in place of checked exceptions."

> [!warning] The empty catch block is the tell
> A `catch` clause with nothing in it is the checked-exception system being satisfied rather than used. The compiler's requirement is that the exception be caught or specified; it has no requirement that the handler do anything. That gap is the difference between checking that a decision was made and checking that it was a good one, and no type system closes it.

The defensible reading is that the feature is right about the goal and wrong about the mechanism. Making failure part of a declared interface is sound, and later languages kept the idea while changing its form: an error becomes a value in the return type, which composes through generics because it is an ordinary type argument rather than a clause with its own variance rule. That is the shape of [[cs/languages/Rust/error-handling-result-and-question-mark|Error Handling in Rust: Result, Option, and ?]], and the general comparison lives in [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]]. What Java kept, and what the alternatives give up, is the non-local unwinding described in [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]].

## Related Notes

- [[cs/languages/common/errors-as-values-vs-control-flow|Errors as Values vs Control Flow]] - the same contract expressed in the return type instead
- [[cs/languages/Rust/error-handling-result-and-question-mark|Error Handling in Rust: Result, Option, and ?]] - the design that composes through generics
- [[cs/pl/exceptions-handlers-and-non-local-control|Exceptions, Handlers, and Non-Local Control]] - the underlying control mechanism the checking is layered on
- [[cs/software-engineering/api-design|API Design]] - failure modes as part of a published interface
- [[cs/pl/subtyping-variance-type-constraints|Subtyping, Variance & Type Constraints]] - why an override may narrow a throws clause and never widen it
- [[cs/languages/Java/the-class-file-and-classloading|The Class File and Classloading]] - where a method's compiled contract is recorded

## Sources

- "Exceptions," The Java Language Specification, Java SE 21 Edition, chapter 11. https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html . Supports the compile-time handler requirement and its stated purpose, the definition of checked and unchecked exception classes, the stated reasons for exempting error and run-time exception classes, the throws clause as part of the contract between implementor and user, and the override narrowing rule.
- "The Catch or Specify Requirement," The Java Tutorials. https://docs.oracle.com/javase/tutorial/essential/exceptions/catchOrDeclare.html . Supports the name and content of the requirement, the two ways to satisfy it, the fact that code failing it does not compile, and the note that some developers regard the mechanism as flawed.
- "Unchecked Exceptions, The Controversy," The Java Tutorials. https://docs.oracle.com/javase/tutorial/essential/exceptions/runtime.html . Supports exceptions as part of a method's public programming interface, the reasoning about runtime exceptions being programming problems that clients cannot recover from, the clarity argument against declaring them, the temptation to make everything unchecked, and the recoverability guideline.
