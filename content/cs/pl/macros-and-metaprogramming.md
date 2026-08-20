---
title: Macros & Metaprogramming
description: "Three kinds of macro system, text substitution, procedural, and syntactic, and why hygiene is the property that makes the third one safe."
draft: false
comments: true
tags:
  - cs
  - pl
  - compilers
date: 2026-03-11
updated:
aliases:
  - Hygienic Macros
  - syntax-rules
  - Macro Expansion
---

A macro is a rule or pattern specifying how a certain input should be mapped to a replacement output, and applying one is called macro expansion. That definition is deliberately broad, because macro systems disagree wildly about what the input and output actually *are*. They may be a sequence of characters, a sequence of lexical tokens, or a syntax tree.

That disagreement is the whole subject. Everything else about a macro system follows from which representation its expander gets to touch.

> [!note] The idea
> A macro system is a programmable stage inserted into the front end of a language, and its power ceiling is set by the representation it manipulates. A character or token substituter cannot know what a variable *is*, so it cannot avoid breaking binding. A system that operates on syntax trees can, which is why the interesting question about a macro system is not "how expressive is the macro language" but "does the expander understand scope."

## Text substitution

C and some assembly languages have rudimentary macro systems implemented as preprocessors to the compiler or assembler. C preprocessor macros work by simple textual substitution at the token level rather than the character level, which is already a step up from raw character splicing but still leaves the expander completely ignorant of the program's structure.

This is the cheapest possible design. It also has a hard ceiling: some macro facilities cannot be built this way at all. In IBM's High Level Assembler, the code for assembling instructions and data is interspersed with the code for assembling macro invocations, so a separate preprocessor pass is not enough.

## Procedural macros

The next design lets the macro language be a real programming language that the compiler runs. Macros in PL/I are written in a subset of PL/I itself: the compiler executes preprocessor statements at compilation time, and the output of that execution forms part of the code that is then compiled.

Using a familiar procedural language as the macro language gives power far greater than text substitution, at the cost of a larger and slower compiler. It also opens a door that text substitution kept shut. PL/I macros, like macros in many assemblers, may have side effects, for example setting variables that other macros can read. Compile time becomes a place where a program runs, with its own state.

## Syntactic macros

Syntactic macro systems work at the level of [[cs/pl/grammar-ambiguity-parse-trees|abstract syntax trees]] and preserve the lexical structure of the original program. The most widely used implementations live in Lisp-like languages, which are especially suited to the style because of their uniform parenthesized syntax (S-expressions). Uniform syntax makes it easier to determine where the macro invocations are in the first place. Lisp macros transform the program structure itself, with the full language available to express the transformation.

Syntactic macros are not exclusive to Lisp. Prolog, Erlang, Dylan, Scala, Nemerle, Rust, Elixir, Nim, Haxe, and Julia all have them.

## The hygiene problem

Once macros splice trees containing binders, they can break [[cs/pl/scoping-binding-and-closures|scope]] by accident. In languages with non-hygienic macro systems, existing variable bindings can be hidden from a macro by bindings created during its expansion.

> [!example] The classic capture bug
> ```c
> #define INCI(i) { int a=0; ++i; }
> int main(void)
> {
>   int a = 4, b = 8;
>   INCI(a);
>   INCI(b);
>   printf("a is now %d, b is now %d\n", a, b);
>   return 0;
> }
> ```
>
> After the preprocessor runs, the first call expands to `{ int a = 0; ++a; }`. The `a` the programmer meant is shadowed by the `a` the macro introduced, so it is never incremented. The program prints:
>
> ```
> a is now 4, b is now 9
> ```
>
> The macro is textually correct and semantically wrong, and nothing in the expansion machinery is in a position to notice.

Hygienic macros are macros whose expansion is guaranteed not to cause the accidental capture of identifiers. The general problem was well known in the Lisp community before hygienic systems existed; macro writers used `gensym` to generate unique identifiers, or simply picked obfuscated names, and hoped. Hygiene replaces that discipline with a guarantee built into the expander itself. The term was coined in Kohlbecker, Friedman, Felleisen, and Duba's 1986 paper introducing hygienic macro expansion, borrowing terminology from mathematics.

The capture problem is not limited to local variables. It extends to any identifier a macro's expansion mentions, including standard library functions the invocation site may have redefined.

Scheme's answer is `syntax-rules`, a pattern-based system in which the syntactic environments of the macro definition and the macro use are kept distinct, so neither the definer nor the user has to think about inadvertent capture. Hygienic macros have been standardized for Scheme in R5RS, R6RS, and R7RS. Several competing implementations coexist: `syntax-rules`, `syntax-case`, explicit renaming, and syntactic closures, with the first two standardized.

## Rust: matchers and transcribers

Rust's `macro_rules!` is a declarative syntax extension in the same family. Each macro by example has a name and one or more rules, and each rule has two parts: a **matcher**, describing the syntax it matches, and a **transcriber**, describing the syntax that replaces a successful match. A macro can expand to expressions, statements, items (including traits, impls, and foreign items), types, or patterns, which is a much wider surface than a C macro's expression-or-statement soup.

Matching is strict about ambiguity. No lookahead is performed, so if the compiler cannot determine how to parse an invocation one token at a time, that is an error rather than a guess.

Hygiene in Rust is partial by design. Macros by example have **mixed-site hygiene**: loop labels, block labels, and local variables are looked up at the macro *definition* site, while other symbols are looked up at the *invocation* site. That split is deliberate. Full definition-site lookup would make it impossible to write a macro that calls a function the caller provides, and full invocation-site lookup reintroduces the `INCI` bug. A consequence of the local-variable rule is that labels and locals introduced by one expansion are not shared with another, so a macro cannot define `x` in one invocation and refer to it in the next.

The remaining gap is paths. A macro exported from one crate and invoked in another may reference items that are not in scope at the call site, which is why `$crate` exists: it resolves to the crate defining the macro and can head a path to items the invoker never imported.

## What macros are for

> [!tip]
> Felleisen conjectured that three categories cover the primary legitimate uses of a macro system: controlling **evaluation order**, defining **data sub-languages and DSLs**, and introducing new **binding constructs**.

Each is something a function cannot do. Controlling evaluation order lets a programmer build control structures indistinguishable from built-in ones; in a Lisp dialect with `cond` but no `if`, `if` is definable as a macro. Data sub-languages let constructs such as state machines compile straight into code. New binding constructs are the deepest case, and the canonical example is `let`, which is a macro transforming into the application of a function to a set of arguments.

Racket pushes this furthest by combining hygiene with a tower of evaluators, so that the syntactic expansion time of one macro system is the ordinary runtime of another block of code, and modules can export macros to other modules with hygiene keeping the syntactic layers distinct.

> [!warning]
> Macros move work from runtime to [[cs/pl/compilation-vs-interpretation|compile time]], which means bugs move there too. Errors surface in generated code the programmer never wrote, expansion order interacts with module and import systems in ways that must be defined rather than assumed, and a procedural macro system with side effects makes compilation itself stateful. The interaction of macros with modules and components has been a productive research area precisely because it is not free.

## Related Notes

- [[cs/pl/grammars-notation-bnfebnf|Grammars: BNF & EBNF]]
- [[cs/pl/grammar-ambiguity-parse-trees|Grammar Ambiguity & Parse Trees]]
- [[cs/pl/scoping-binding-and-closures|Scoping, Binding & Closures]]
- [[cs/pl/compilation-vs-interpretation|Compilation vs Interpretation]]
- [[cs/pl/evaluation-order-and-strictness|Evaluation Order & Strictness]]
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures & Separate Compilation]]

## Sources

- "Macro (computer science)," Wikipedia. https://en.wikipedia.org/wiki/Macro_%28computer_science%29 . Backs the definition of a macro and macro expansion, the character/token/syntax-tree representation split, C preprocessor token-level substitution, HLASM's interspersed macro assembly, PL/I procedural macros and their side effects, syntactic macros operating on ASTs, the list of languages with syntactic macros, the Kohlbecker et al. 1986 hygiene paper and R5RS/R6RS/R7RS standardization, the competing hygienic implementations, Felleisen's three categories of legitimate macro use, and Racket's tower of evaluators.
- "Hygienic macro," Wikipedia. https://en.wikipedia.org/wiki/Hygienic_macro . Backs the definition of hygiene as a guarantee against accidental identifier capture, the `gensym` workaround predating it, the `INCI` C example and its printed output, and the extension of the problem to standard library redefinition.
- "Macros By Example," The Rust Reference. https://doc.rust-lang.org/reference/macros-by-example.html . Backs `macro_rules!` rules consisting of a matcher and a transcriber, the set of things a macro can expand to, the no-lookahead matching rule, Rust's mixed-site hygiene and its definition-site vs invocation-site split, the non-sharing of macro-introduced locals across invocations, and the `$crate` metavariable.
