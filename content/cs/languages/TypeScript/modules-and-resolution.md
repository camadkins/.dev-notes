---
title: "Modules and Resolution"
description: "Why a compiler that never loads a module has to simulate somebody else's file lookup, and what the moduleResolution setting is actually choosing between."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-08-16
updated:
aliases: []
---

Two lines of code, and the compiler cannot check either one without answering a question that has nothing to do with types:

```ts
import sayHello from "greetings";
sayHello("world");
```

To know whether the call is valid, the checker needs the type of `sayHello`, which requires knowing which file `"greetings"` names, which requires knowing what will be doing the looking. The handbook enumerates the chain of questions this opens, ending with "where will the module system look to find the module specified by "greetings"? Will the lookup succeed?" and "once the "greetings" module has been analyzed, what piece of that module is bound to sayHello?"

> [!note] The idea
> `moduleResolution` does not select a lookup algorithm that TypeScript owns. It selects which other program TypeScript is impersonating. The compiler emits no loader and participates in no runtime, so the only way it can assign a type to an import is to simulate the file search that Node or a bundler will perform later. Every mode is a model of a host, the modes multiplied because the hosts did, and a resolution bug is almost always a mismatch between the host you configured and the host you actually have.

## Why there is no single answer

The gap is in the specification itself. "The ECMAScript specification defines how ESM imports and exports link up with each other, but it doesn't specify how the file lookup in (4), known as module resolution, happens, and it doesn't say anything about other module systems like CommonJS."

That omission is the origin of everything downstream. "So runtimes and bundlers, especially those that want to support both ESM and CJS, have a lot of freedom to design their own rules." Node built one algorithm for `require` and later a different one for `import`. Bundlers built their own, sharing the `node_modules` convention but relaxing the parts that annoyed them. None of these is wrong, and no two agree.

TypeScript has to pick one to imitate, and it cannot infer which. "There's no single right answer, so the compiler must be told the rules through configuration options." That sentence is the honest explanation for why this corner of `tsconfig.json` has more options than seems reasonable.

There is a second twist worth holding onto. "The other key idea to keep in mind is that TypeScript almost always thinks about these questions in terms of its output JavaScript files, not its input TypeScript (or JavaScript!) files." The compiler is not reasoning about the imports you wrote. It is reasoning about the imports that will exist after emit, in a file with a different extension, in a directory that may not be this one. That is why extension rules and output paths leak into what looks like a pure type question, and it separates this from an ordinary [[cs/pl/modules-signatures-and-separate-compilation|separate compilation]] story, where the interface and the artifact travel together.

## The shape of a lookup

For anything that is not a relative or absolute path, resolution is a walk up the [[cs/systems/file-systems|directory tree]]. "Node.js treats module specifiers that aren't relative paths, absolute paths, or URLs as references to packages that it looks up in node_modules subdirectories," and TypeScript reproduces the search: "for each ancestor directory of the importing file, if a node_modules directory exists within it," look for a directory with the package's name, then look in `node_modules/@types` for a package of that name, returning as soon as either yields types.

Only after that entire walk fails for types does a second pass run: "repeat the previous search through all node_modules directories, but this time, allow JavaScript files as a result, and do not search in @types directories."

The two-pass structure explains a failure mode that otherwise looks like nonsense. An import can resolve successfully to a real JavaScript file and still give you nothing useful, because the types pass came up empty. The reference spells out the consequence: a second pass that finds only JavaScript "counts as a successful resolution, but one that does not provide types, leading to any-typed imports and a noImplicitAny error if enabled." The module is there. The build is broken anyway, and the error names a flag rather than the missing file.

This is also why [[cs/languages/TypeScript/declaration-files-and-ambient-types|declaration files]] are load-bearing at exactly this step. The lookup is searching for types first and code second, so where the declarations live and what the package's manifest says about them decides the answer.

## What the modes actually are

The tsconfig reference reads as a short history of the ecosystem.

`node16` and `nodenext` are "for modern versions of Node.js." Node supports both ECMAScript imports and CommonJS requires, "which resolve using different algorithms," so the mode has to pick one per import: "These moduleResolution values, when combined with the corresponding module values, picks the right algorithm for each resolution based on whether Node.js will see an import or require in the output JavaScript code." One project, two algorithms, chosen file by file according to what the emitted code will say.

`node10`, previously called `node`, is the mode "for Node.js versions older than v10, which only support" the CommonJS form. The reference is blunt about it: "you probably won't need to use node10 in modern code."

`bundler` models the tools rather than the runtime. "Like node16 and nodenext, this mode supports package.json "imports" and "exports", but unlike the Node.js resolution modes, bundler never requires file extensions on relative paths in imports." That last clause is the entire reason the mode exists, and it is the source of most cross-project confusion: whether `./util` is a legal specifier is not a language question, it is a question about who is loading the file.

`classic` is the fossil. It "was used in TypeScript before the release of 1.6," and the guidance is one sentence: "classic should not be used." It predates the convention it failed to anticipate, and it is the only mode that does not search `node_modules` for packages at all.

> [!warning] Two settings that sound like one
> `module` controls what syntax is emitted; `moduleResolution` controls how imports are found. They are separate options that must agree, because the resolution modes decide per import based on what the output will contain. A mismatch produces the characteristic symptom of this whole area: an import that the editor resolves and the runtime does not, or the reverse.

The practical reading is that this configuration is not about TypeScript. It is a description of your deployment target, and the correct value is whatever tool will actually open the file. That makes it closer to [[cs/languages/common/module-systems-and-namespacing|a module system question]] than a type system one, which is why it stays confusing for people who came for the types.

## Related Notes

- [[cs/languages/common/module-systems-and-namespacing|Module Systems and Namespacing]] - the general problem, and the conventions Node and bundlers settled on
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - what a module boundary means when the compiler owns both sides
- [[cs/systems/file-systems|File Systems]] - the directory walk that a bare specifier turns into
- [[cs/languages/Python/the-import-system|The Import System]] - another language whose import statement is really a search path
- [[cs/languages/TypeScript/declaration-files-and-ambient-types|Declaration Files and Ambient Types]] - what the first resolution pass is hunting for
- [[cs/languages/Java/the-module-system|The Module System]] - resolution as a declared graph rather than a filesystem search

## Sources

- TypeScript Handbook, "Modules: Theory." https://www.typescriptlang.org/docs/handbook/modules/theory.html . Supports the chain of questions raised by a single import, the absence of a file-lookup rule in the ECMAScript specification, the resulting freedom of runtimes and bundlers, the need to configure the rules, and the compiler reasoning in terms of output files.
- TypeScript Handbook, "Modules: Reference." https://www.typescriptlang.org/docs/handbook/modules/reference.html . Supports the treatment of bare specifiers as package references, the ancestor-directory `node_modules` search including the `@types` step, the second JavaScript-only pass, and the untyped-but-successful resolution outcome.
- TypeScript tsconfig reference, "moduleResolution." https://www.typescriptlang.org/tsconfig/moduleResolution.html . Supports the descriptions of `node16` and `nodenext`, `node10`, `bundler` and its extension behavior, and the status of `classic`.
