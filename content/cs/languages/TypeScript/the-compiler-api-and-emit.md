---
title: "The Compiler API and Emit"
description: "tsc is a library with three moving parts, and the reason type-aware tooling is slow is that the middle one cannot answer anything without the whole program."
draft: false
comments: true
tags:
  - cs
  - languages
  - compilers
date: 2026-08-02
updated:
aliases:
  - TypeScript Compiler API
  - ts.createProgram
---

The TypeScript compiler is shipped as a library, and the shape of that library explains more about the ecosystem than any feature does. Editors, linters, bundlers, documentation generators, and codemods all reach for the same package, and they all reach for it in the same order.

"The compiler API has a few main components." There is "a Program which is the TypeScript terminology for your whole application," then "a CompilerHost which represents the users' system, with an API for reading files, checking directories and case sensitivity etc.," and then many `SourceFile` objects, "which represent each source file in the application, hosting both the text and TypeScript AST."

> [!note] The idea
> The unit of work is the whole application. A `SourceFile` alone is a parse tree with no types in it, because a type in a structural, inference-driven system is a fact about a graph of files rather than a property of a token. That is why every type-aware tool has to build a `Program` before it can answer a question about one line, and it is the real reason type-aware linting costs so much more than syntactic linting. The expense is not the rules, it is the prerequisite.

## A compiler in six lines

The minimal program is genuinely small.

```ts
let program = ts.createProgram(fileNames, options);
let emitResult = program.emit();
let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
```

The first move is to build a `Program` with `ts.createProgram`, and "this will create a default CompilerHost which uses the file system to get files." Everything else is reporting: mapping diagnostics back to line and character, and exiting non-zero when `emitResult.emitSkipped` is set.

The `CompilerHost` seam is worth pausing on. Nothing above assumes a disk. Supply your own host and the same compiler runs over an in-memory map of virtual files, which is how playgrounds, browser-based editors, and test harnesses work. The compiler does not open files; it asks something else to.

If all you want is JavaScript out, there is a shortcut that skips the entire apparatus: "you may want to just get the corresponding JavaScript output given TypeScript sources. For this you can use ts.transpileModule to get a string" to string transformation in two lines. That call parses and emits one file, with no `Program`, no cross-file resolution, and no checking, which is exactly why it is fast and exactly why it cannot report a type error. Every fast TypeScript build tool sits somewhere on this line, and the tradeoff is always the same one.

## The checker is the expensive part

Types are not attached to syntax. They are computed, and the object that computes them hangs off the program: "The type checker can be retrieved like" `program.getTypeChecker()`.

Its vocabulary is two layers deep. For a declaration named `greet`, "TypeScript will create a Symbol in the containing scope for" it, and "this Symbol will contain information about how greet was declared, and can be used to gain information about the type of" the function. Separately, the checker also builds a type describing it. Symbols are about declaration and identity; types are about structure. The common entry points make the split obvious: `getSymbolAtLocation(node)` "retrieves the Symbol associated with an AST node," `getTypeAtLocation(node)` "retrieves the Type associated with an AST node," and `typeToString(type)` "prints a type to a human-readable string."

One naming warning is in the docs because it catches everyone: "The type checker concept of Symbol only coincidentally has the same name as the JavaScript concept of" the same name. "JavaScript's Symbol is a runtime primitive that is used to create unique identifiers," while the compiler's is a representation of the type system's view of an entity.

This is why a lint rule that asks whether an expression is a promise, or whether a value can be `null`, cannot be implemented over the AST alone. Answering it requires resolving an import, finding a declaration in a package you did not write, and computing a structural type from it. There is no shortcut that reads only the file in front of you, so type-aware tooling has to run the real checker, which is a large part of why lint time in [[cs/software-engineering/continuous-integration|CI]] tends to be dominated by one plugin.

The AST side, by contrast, is cheap and ordinary. "The Node interface is the root interface for the TypeScript AST. Generally, we use the forEachChild function in a recursive manner to iterate through the tree. This subsumes the visitor pattern and often gives more flexibility." A syntactic rule is a [[cs/dsa/recursion|recursive walk]] over one file and costs what a walk costs.

## Emit is the boring end

The output stage is a source-to-source transform, which makes this a different kind of compiler from the ones that produce an instruction stream. There is no [[cs/languages/CSharp/the-il-and-the-jit|intermediate language]] to lower into and no code generator to tune, because the target is JavaScript that a human could have written. The library exposes the printer directly, so a tool can build or modify nodes and call `printer.printNode(...)` to get text back, which is what codemods do.

Emit and checking are also deliberately independent. `program.emit()` produces output whether or not the checker complained, unless you ask otherwise with `noEmitOnError`. That falls out of erasure: since [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|types never influence the generated code]], a type error does not make the output invalid JavaScript, it just makes it unverified. It is also why a build can be split, with one tool transpiling for speed and `tsc --noEmit` checking in parallel.

For editors there is a third layer above both. The language service "augments the concept of a file with a version, an isOpen flag, and a ScriptSnapshot. The version allows the language service to track changes to files," so that a keystroke re-checks what changed rather than rebuilding everything. Completion, rename, and go-to-definition are all this layer, sitting on the same checker.

> [!warning] The API is not the language
> The wiki carries its own notice: "The contents of this page currently describe TypeScript 6.0 and earlier. TypeScript 7.1 will have a completely different API." The compiler API has never been covered by the language's own stability promises the way the syntax is, which is worth knowing before building a tool on top of it.

That the API exists at all is a stated position rather than an accident. Providing an end-to-end build pipeline is an explicit non-goal; instead the intent is to "make the system extensible so that external tools can use the compiler for more complex build workflows." TypeScript declined to own the build and shipped the checker as a component, and the result is an ecosystem where [[cs/pl/compilation-vs-interpretation|the compiler]] is something other tools embed rather than something they replace.

## Related Notes

- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]] - where a source-to-source compiler sits, and what it is allowed to skip
- [[cs/languages/CSharp/the-il-and-the-jit|The IL and the JIT]] - a toolchain whose emit target is an instruction set rather than another language
- [[cs/languages/TypeScript/erasure-at-runtime-and-type-guards|Erasure at Runtime and Type Guards]] - why emit can succeed while checking fails
- [[cs/software-engineering/continuous-integration|Continuous Integration]] - where the cost of building a Program for every lint run actually lands
- [[cs/dsa/recursion|Recursion]] - the shape of every AST traversal in this API
- [[cs/pl/intermediate-representations-and-ssa|Intermediate Representations & SSA]] - the layer this compiler does not have, and what that buys it

## Sources

- TypeScript Wiki, "Using the Compiler API." https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API . Supports the main components of the API, the minimal compiler using `createProgram` and `emit`, the default `CompilerHost`, `transpileModule` as a two-line string transform, retrieving the checker from the program, the Symbol and Type concepts and the common checker APIs, the warning about the JavaScript `Symbol` name collision, `forEachChild` as the traversal idiom, the language service host with versions and snapshots, and the notice about the API changing in a future release.
- TypeScript Wiki, "TypeScript Design Goals." https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals . Supports the non-goal of providing an end-to-end build pipeline and the stated intent that external tools use the compiler instead.
