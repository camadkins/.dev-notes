---
title: "The Module System"
description: "What strong encapsulation means when the unit is a package rather than a class, how requires and exports build a graph, and the decade of ecosystem breakage that followed."
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-27
updated:
aliases:
  - Project Jigsaw
  - JPMS
  - Java Modules
---

Java shipped with four access levels and one gap. `public` meant public to everyone forever, so any class a library shared between its own packages was also a class its users could call. The convention that grew around that gap was a package named `internal` or `impl` and a note saying please do not use this. People used it anyway, and the JDK was the biggest offender, with `sun.misc.Unsafe` as the monument.

> [!note] The idea
> The module system adds a level of access control above `public` whose unit is the package, not the class, and then makes dependency a directed graph the runtime resolves before your code starts. Strong encapsulation is enforced by reflection as well as by the compiler, which is the part that broke everything: two decades of frameworks were built on `setAccessible(true)`, and the module system is precisely the feature that turns that call into an error. The interesting story here is not the syntax. It is that the JDK spent from Java 9 to Java 16 walking the enforcement in gradually, because turning it on all at once was not survivable.

## What a module declares

A module is a named set of packages with a `module-info.java` at its root, compiled to `module-info.class`. Its declaration says two things: `requires` names the modules this one reads, and `exports` names the packages it makes available, optionally qualified with `exports com.acme.internal to com.acme.client`.

Everything not exported is invisible from outside, no matter its access modifier. JEP 396 states the rule: "Code outside of a module can only access the public and protected" elements "of the packages exported by that module, and" protected elements only from subclasses. A `public class` in an unexported package is unreachable from another module, which is the new thing. This is the module-versus-signature distinction from [[cs/pl/modules-signatures-and-separate-compilation|module systems with signatures]] arriving in Java about forty years after ML, with `exports` as the signature and `requires` as the functor argument list, minus the parameterization.

Resolution builds a graph. `requires` adds "a readability edge from the source module to the target module," and JEP 261 exposes the same operation as the `--add-reads` command-line option, which is "essentially, a command-line form of a" `requires` clause. Access needs both ends to agree: the target has to export the package and the source has to read the target. Reading without exporting gets you nothing, and exporting to a module that does not read you gets you nothing either.

The loading path changed to match. "Module paths are very different from class paths: Class paths are a means to locate definitions of individual types and resources, whereas module paths are a means to locate definitions of whole modules." The class path is a flat search order where the first match wins and a missing class surfaces at the moment you touch it. The module path resolves up front into a graph, so a missing dependency fails at startup rather than three hours into a run. That is a change to [[cs/languages/Java/the-class-file-and-classloading|how classes are found and loaded]], not merely a compiler check.

## Enforced at run time, which is the hard part

The compile-time half of strong encapsulation is unremarkable. The run-time half is the whole fight. "Strong encapsulation applies at both compile time and run time, including when compiled code attempts to access elements via reflection at run time."

That sentence invalidates a pattern the entire ecosystem was built on. Serialization frameworks, DI containers, ORMs, mocking libraries, and test runners all reflect over your classes and call `setAccessible(true)` on private members. Under strong encapsulation that call throws unless the owning module has opened the package, which is what `opens` and `open module` exist for. `opens` grants deep reflective access without granting compile-time access, an asymmetry that makes sense only once you see which libraries needed rescuing.

The security argument is explicit and is why it was worth the pain. JEP 396 notes that internal elements define privileged operations such as defining a class in a specific class loader, and that others convey sensitive data such as cryptographic keys, so external reflective access "puts the security of the platform at risk." Encapsulation here is [[cs/security/privilege-separation-and-least-privilege|least privilege]] applied to an API surface: fewer entry points into privileged machinery means less for an attacker to reach through a deserialization bug or a gadget chain.

JEP 260 drew the line pragmatically. It divided "the JDK's internal APIs into two broad categories," non-critical ones like `sun.misc.BASE64Decoder` with easy replacements, and critical ones "which provide critical functionality that would be difficult, if not impossible, to implement outside of the JDK itself," with `sun.misc.Unsafe` the named example. Non-critical internals were encapsulated in Java 9; critical ones lacking replacements were left accessible, and `Unsafe` remains available.

## What it broke

Three separate breakages hit the ecosystem, and conflating them is why the migration is remembered as worse than any one of them was.

The first was reflection, and it was deliberately softened. Rather than enforce run-time encapsulation immediately, "we deliberately chose not to strongly encapsulate, at run time, the content of packages that existed in JDK 8," an arrangement JEP 396 names "relaxed strong encapsulation." It was controlled by `--illegal-access`, which JEP 396 says "is provocatively named in order to discourage its use." Permit was the default from Java 9 through 15, deny became the default in Java 16, and the option was removed later. Years of runway, still not enough for some libraries.

The second was the Java EE modules. `java.xml.bind`, `java.corba`, `java.activation`, and their siblings shipped in Java 9 but were not resolved by default, so class-path code that had always found `javax.xml.bind.JAXBContext` threw `NoClassDefFoundError`. JEP 261 says "This is an intentional, if painful, choice, driven by two goals": avoiding conflicts with libraries defining types in the same packages, `jsr305.jar` and `javax.annotation` being the cited case, and easing migration for application servers that override those modules. They were removed outright in Java 11.

The third was quieter and hit tooling hardest. "The application and platform class loaders are no longer instances of the" `URLClassLoader` "class, as noted above," so every framework that cast the system class loader to `URLClassLoader` to inspect or extend the class path broke on startup. It was a cast nobody had ever thought of as an API.

> [!warning] Automatic modules
> A plain JAR on the module path becomes an automatic module: it gets a name derived from its filename or manifest, reads every other module, and exports all of its packages. This is the bridge that let the ecosystem migrate incrementally, and JEP 261 provides `ALL-MODULE-PATH` partly "to add automatic modules to the root set." It also means most real applications run in a hybrid state where the guarantees are only as strong as the least modular JAR in the build.

## The verdict

Adoption of full modularity in application code has been thin. Most projects put dependencies on the class path, live in the unnamed module, and never write a `module-info.java`. But the JDK itself is modular, which is what lets `jlink` produce a runtime image containing only the modules an application reads, and what finally let internal APIs be closed. The feature achieved JEP 261's stated goal, "reliable configuration and strong encapsulation," for the one codebase where it mattered most and stayed optional for everyone else. That is the recurring pattern in [[cs/languages/common/module-systems-and-namespacing|module systems generally]]: one retrofitted onto a language with an installed base gets adopted first by the platform and last, if ever, by its users.

## Related Notes

- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the theory the JPMS instantiates, and the parts it left out
- [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] - why closing internal APIs was a security project first
- [[cs/languages/Java/the-class-file-and-classloading|The Class File and Classloading]] - the loader machinery the module path replaced
- [[cs/languages/common/module-systems-and-namespacing|Module Systems and Namespacing]] - how other ecosystems drew the same boundary
- [[cs/languages/Python/the-import-system|The Import System]] - a namespace mechanism with no encapsulation layer at all
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - the attack class that made reflective reach into the JDK worth closing

## Sources

- "JEP 261: Module System," OpenJDK. https://openjdk.org/jeps/261 . Supports the reliable-configuration and strong-encapsulation summary, the contrast between module paths and class paths, readability edges added by requires and --add-reads, ALL-MODULE-PATH and automatic modules in the root set, the deliberate non-resolution of the Java EE modules and its two stated reasons including the jsr305 package conflict, and the change that the application and platform class loaders are no longer URLClassLoader instances.
- "JEP 396: Strongly Encapsulate JDK Internals by Default," OpenJDK. https://openjdk.org/jeps/396 . Supports the definition of strong encapsulation in terms of exported packages and public/protected access, its application at run time including reflection, the naming of relaxed strong encapsulation and the decision not to encapsulate JDK 8 era packages at run time, and the description of --illegal-access as provocatively named.
- "JEP 260: Encapsulate Most Internal APIs," OpenJDK. https://openjdk.org/jeps/260 . Supports the split of JDK internal APIs into non-critical and critical categories and the description of critical internal APIs as functionality difficult or impossible to implement outside the JDK.
