---
title: "Declaration Files and Ambient Types"
description: "A .d.ts is a signature with no implementation attached, which is what makes it able to type JavaScript and what makes a wrong one invisible."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-06-30
updated:
aliases: []
---

TypeScript was never going to rewrite the JavaScript ecosystem, and it did not try. The strategy was to describe what already existed, from the outside, in a file containing types and no code. That file is a `.d.ts`, and the entire adoption story of the language runs through it.

"The most common case for learning how .d.ts files work is that you're typing an npm package with no types."

> [!note] The idea
> A declaration file is a module signature that has been separated from its implementation, and unlike a signature in a language with real separate compilation, it is usually separated from an implementation the compiler will never see. That is exactly what lets it type a JavaScript library, and it is exactly why a mistake in one is undetectable: the compiler has no second artifact to check the claim against. A `.d.ts` is not a description of a library. It is an assertion about a library, trusted absolutely.

## What is in one

Declarations describe shape. They are written in the ambient forms, `declare function`, `declare const`, `declare class`, `declare namespace`, alongside ordinary `interface` and `type` aliases, which never had runtime content to begin with.

"Use declare namespace to describe types or values accessed by dotted notation," so a global `myLib` with a method and a counter becomes a namespace holding a function signature and a `let`. A function that "accepts a number and returns a Widget, or accepts a string and returns a Widget array" is written as two `declare function` lines with the same name. The whole exercise is reconstructing an API contract from the outside: "We are often faced with writing a declaration file when we only have examples of the underlying library to guide us."

The word "ambient" is doing real work. An ambient declaration tells the compiler that a name exists in the environment without saying where it comes from. That is how the standard library is delivered, how a global injected by a script tag becomes typeable, and how a module written in JavaScript acquires a public interface. It is also how something that does not exist at all can be declared, since nothing verifies the environment either.

Not every declaration file is handwritten. When the source is TypeScript, the compiler can produce them: the `declaration` flag will "generate .d.ts files for every TypeScript or JavaScript file inside your project," and "these .d.ts files are type definition files which describe the external API of your module." Generated declarations are derived from code the checker verified, so they inherit that verification. Handwritten ones inherit nothing, and the distinction between the two cases is the whole subject of this note.

## Why they exist at all

This is not a workaround bolted on late. It follows from where TypeScript decided to sit. The compiler emits erased JavaScript and ships no runtime of its own, so a TypeScript program consuming a JavaScript library has no mechanism by which types could arrive with the code. They must arrive separately or not at all.

The consequence for tooling is stated plainly: "With .d.ts files, tools like TypeScript can provide intellisense and accurate types for un-typed code." Completion, navigation, and error checking against a library you cannot compile are all downstream of one file that describes it. That is a large amount of leverage resting on a small artifact, and it is why the documentation carries a whole section on publishing: it "explains how to publish your declaration files to an npm package, and shows how to manage your dependent packages," with a matching consumer-side section that "offers a few simple steps to locate and install corresponding declaration files."

Structurally, a `.d.ts` is the same idea as an [[cs/pl/modules-signatures-and-separate-compilation|ML signature or a C header]]: a compile-time interface that lets a consumer be checked without the provider's source. The difference is what backs it. A header is checked against the translation unit that implements it; a signature is checked against the structure that ascribes to it. A handwritten declaration file for a JavaScript package is checked against nothing at all.

## What a wrong declaration costs

Nothing, at build time. That is the problem.

Declare `find` as returning `T` instead of `T | undefined` and every consumer's [[cs/languages/TypeScript/strict-null-checks|null checking]] is disarmed for that call, with no warning anywhere. Declare a parameter as required when the library treats it as optional and correct code becomes uncompilable. Declare a callback as synchronous when it is not and the ordering bugs appear at runtime, in someone else's module, long after the declaration was written.

These failures have a shape worth naming: the declaration is believed, so the error surfaces wherever the belief was used rather than where it was introduced. That makes a bad `.d.ts` behave like a distributed [[cs/languages/TypeScript/the-any-unknown-never-triangle|`any`]], except worse, because `any` at least announces that checking has stopped while a wrong declaration announces that checking succeeded. The documentation acknowledges the hazard category directly, with a whole section on the fact that "many common mistakes in declaration files can be easily avoided," and a warning that "authors of new declaration files are strongly encouraged to read this section to properly understand how the format of the library influences the writing of the declaration file."

Two further sources of drift make this a maintenance problem rather than a one-time authoring problem. First, the declaration and the implementation version independently. A library can ship a patch release that changes a return shape while the declarations sit at a version that says otherwise, so [[cs/software-engineering/semantic-versioning|version ranges]] that are correct for the code can be wrong for the types. Second, declarations are ordinary package content: installing types is installing files that will shape how every consumer's code is checked, which folds them into the same [[cs/languages/common/software-supply-chain-and-provenance|dependency provenance]] questions as any other artifact you did not write.

> [!tip] Treat a handwritten declaration as untested code
> The only real defenses are the ones you would apply to code with no tests: keep declarations next to the implementation when you own it, generate them when the source is TypeScript, write usage examples that fail to compile when the declaration is wrong, and be suspicious of any signature that is more convenient than the library.

## Related Notes

- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the general form of a compile-time interface, and what normally checks it
- [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|Erasure at Runtime and Type Guards]] - why types cannot travel with the JavaScript in the first place
- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - declarations are dependencies, and they decide what your compiler believes
- [[cs/software-engineering/semantic-versioning|Semantic Versioning]] - the drift between a package version and the version its types describe
- [[cs/languages/TypeScript/modules-and-resolution|Modules and Resolution]] - how the compiler decides which declaration file answers for a given import
- [[cs/languages/Java/the-module-system|The Module System]] - declaring a public surface where the compiler can actually verify it

## Sources

- TypeScript Handbook, "Declaration Files: Introduction." https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html . Supports the primary use case of typing an untyped npm package, writing declarations from examples of the underlying library, and the existence and framing of the common-mistakes guidance for declaration authors.
- TypeScript Handbook, "Declaration Reference." https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html . Supports the structure of the guide and the ambient declaration forms, including `declare namespace` for dotted access and repeated declarations for overloads.
- TypeScript tsconfig reference, "declaration." https://www.typescriptlang.org/tsconfig/declaration.html . Supports generation of `.d.ts` files from project sources, their description as type definition files covering the external API of a module, and their role in providing accurate types for untyped code.
