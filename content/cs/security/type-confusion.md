---
title: Type Confusion
description: "A value created as one type and accessed as another. In a language where the type is an assumption baked into the generated code rather than a fact stored beside the bytes, the disagreement is an arbitrary read and write."
draft: false
comments: true
tags:
  - cs
  - security
  - type-theory
date: 2026-08-31
updated:
aliases:
  - Object Type Confusion
---

MITRE's definition is short enough to hold in one breath: the product allocates or initializes a resource such as a pointer, object, or variable using one type, but it later accesses that resource using a type that is incompatible with the original type. When the product accesses the resource using an incompatible type, this could trigger logical errors because the resource does not have expected properties, and in languages without memory safety, such as C and C++, type confusion can lead to out-of-bounds memory access.

> [!note] The idea
> In a memory-safe language a type is a fact stored somewhere the runtime can check. In C and C++ it is an assumption the compiler consumed at compile time and then discarded: field accesses became fixed byte offsets, a virtual call became an index into a table found at a fixed offset, and the bytes themselves carry no record of what they are. So a type mismatch is not caught, it is *executed*. The code computes offsets for the type it believes in, against a buffer laid out for a different one, and what should have been a type error becomes a read or write at an attacker-influenced address.

## The union case, and why it generalizes

The weakness is frequently associated with unions when parsing data with many different embedded object types in C, and MITRE's worked example is the clearest statement of the mechanism. A `struct MessageBuffer` holds an `int msgType` and a union of `char *name` and `int nameID`. Because both members are part of the same union, they can act as aliases for the same memory location depending on memory layout after compilation, so modification of `buf.nameID`, an `int`, can effectively modify the pointer stored in `buf.name`, a string. Writing `nameID` to one past the original pointer value makes the subsequent `printf` of `buf.name` print `ello World` instead of `Hello World`, with the pointer changed even though `buf.name` was never explicitly assigned. MITRE draws the conclusion directly: if an attacker can fully control the value of `buf.nameID`, then `buf.name` could contain an arbitrary pointer, leading to out-of-bounds reads or writes.

That is the whole class in miniature. A tag says which member is live, the tag and the data are separate, and nothing enforces their agreement. Whenever those three conditions hold, you have the same bug in a different costume, and the weakness can be present in any application that can interpret the same variable or memory location in multiple ways.

The consequence table is blunt about the ceiling. When a memory buffer is accessed using the wrong type, it could read or write memory out of the bounds of the buffer if the allocated buffer is smaller than the type the code is attempting to access, leading to a crash and possibly code execution. Out-of-bounds access from the wrong type is the same primitive [[cs/security/use-after-free-and-heap-exploitation|use-after-free]] delivers by a different route, and the exploitation techniques downstream are shared: reclaim the allocation with an object of the attacker's choosing, then let the victim's code interpret it under the type it expected. A confused pointer read through a vtable slot is a hijacked indirect call, which is exactly the primitive [[cs/security/control-flow-integrity|control-flow integrity]] exists to constrain.

## The C++ case with no cast in it

The ODR angle is the one that surprises people, because there is no union, no cast, and no obviously suspicious line anywhere in the source.

C++ permits a class to be defined in more than one translation unit, provided every definition consists of the same sequence of tokens. Satisfy that and the program behaves as if there is only one definition in the entire program. Fail it and, as [[cs/languages/Cpp/the-one-definition-rule|the one definition rule]] records, the program is ill-formed with no diagnostic required. Nobody owes you a message, because the condition being tested spans translation units and each compiler invocation sees exactly one of them.

Now trace what that means at run time. Suppose `a.cpp` and `b.cpp` each see a `struct Config`, and one of them was compiled against an older header where a field was missing. Each translation unit's generated code has member offsets from *its own* view baked in as constants. The linker sees two definitions of the same symbol, keeps one, and discards the other. Both sets of machine code now operate on one object using two incompatible layouts. The write through `a.cpp`'s offset for the third field lands on `b.cpp`'s second field, and if the layouts disagree about which fields are pointers, a write of an integer lands on a pointer, which is the union example again with the linker playing the part of the union.

Add [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|virtual functions]] and the same divergence puts a different function's address in the slot the caller indexes, so the confusion moves from data to control flow. This is the mechanism behind the practical rule that mixing two versions of a library's headers into one binary is a linkage hazard rather than an inconvenience, and it is why the failure appears only when a particular pair of object files ends up in the same binary. The type system did its job in both translation units. What failed was the assumption that "the same type" meant the same thing in both.

## Not only in unsafe languages

The weakness is not unique to C and C++. Errors in PHP applications can be triggered by providing array parameters where scalars are expected, or the reverse, and languages such as Perl, which perform automatic conversion of a variable of one type when it is accessed as if it were another type, can also contain these issues. MITRE's second example is a PHP handler that adds 5 to a query-string parameter and behaves entirely differently when the parameter arrives as an array. A third shows a Perl privilege check comparing a string against the scalar representation of an array reference, something of the form `ARRAY(0x229e8)`, because a subscript was omitted; since the logic also fails open, every user is assigned administrator privileges. That one is a forced example, and MITRE says so, but it demonstrates how type confusion can have security consequences even in memory-safe languages.

Memory safety changes the *impact*, not the presence of the bug. Without it you get out-of-bounds access; with it you get logical errors, and an authorization check that compares the wrong two things is a logical error with full consequences. CVE-2025-32352 is exactly that shape: type confusion in a PHP application allowing authentication bypass when users have passwords whose MD5 hashes can be interpreted as numbers.

> [!warning]
> The dynamic-language variant almost always arrives through a deserializer, because that is where an external party gets to choose a value's type as well as its contents. A JSON body can send `5`, `"5"`, or `[5]` into the same field, and a language with implicit conversion will do something with each. This is why the fix belongs at [[cs/security/input-validation-and-trust-boundaries|the trust boundary]], as a check on the specified type of the input, rather than at the comparison that eventually goes wrong. MITRE tracks that check as its own peer weakness, improper validation of specified type of input, and [[cs/security/insecure-deserialization|insecure deserialization]] is the extreme case where the type choice happens during the parse.

## Where it sits in the taxonomy

CWE-843 is a child of CWE-704, incorrect type conversion or cast, which is the wider family a bad `static_cast` or `reinterpret_cast` also belongs to. Type confusion is the subset where the mismatch is between how a resource was created and how it is later reached, rather than a single conversion being wrong on its own terms.

MITRE rates automated static analysis as highly effective at finding some instances, by building a model of data flow and control flow and searching for patterns connecting sources, the origins of input, with sinks. The word carrying the weight is *some*: the analysis works when both the allocation and the incompatible access are visible in the code under analysis, and the ODR case above is precisely the one where they are not, since the whole point is that no single compilation sees both definitions.

The type-theoretic name for what has been lost is [[cs/pl/type-soundness-progress-preservation|soundness]]. A sound type system guarantees that a well-typed program never reaches a state where an operation is applied to a value of the wrong type; type confusion is that state, reached anyway. [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Java's covariant arrays]] are the clean illustration of the alternative bargain: the language admits an unsound rule and then pays for it with a runtime check, throwing `ArrayStoreException` at the moment the confusion would occur. C++ takes the same unsound step and, per [[cs/languages/common/undefined-behavior-as-a-contract|undefined behavior as a contract]], declines to pay for the check.

## Related Notes

- [[cs/languages/Cpp/the-one-definition-rule|The One Definition Rule]] - the C++ rule whose silent violation produces type confusion with no cast in the source
- [[cs/languages/Cpp/virtual-dispatch-vtables-and-object-layout|Virtual Dispatch, Vtables, and Object Layout]] - the offsets and function-pointer table a confused type indexes into
- [[cs/security/use-after-free-and-heap-exploitation|Use-After-Free and Heap Exploitation]] - the sibling weakness that yields the same primitive by reclaiming an allocation
- [[cs/security/control-flow-integrity|Control-Flow Integrity]] - the mitigation aimed at the hijacked indirect call a confused vtable produces
- [[cs/security/input-validation-and-trust-boundaries|Input Validation and Trust Boundaries]] - where the type of external input has to be pinned down, before anything interprets it
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - the case where the attacker picks the type during the parse itself
- [[cs/languages/common/runtime-type-information|Runtime Type Information]] - what a language has to keep beside the bytes for a checked cast to be possible at all
- [[cs/pl/type-soundness-progress-preservation|Type Soundness: Progress & Preservation]] - the property whose absence this weakness is the practical face of
- [[cs/languages/Java/covariant-arrays-vs-invariant-generics|Covariant Arrays vs Invariant Generics]] - an unsound rule paid for with a runtime check instead of a vulnerability

## Sources

- "CWE-843: Access of Resource Using Incompatible Type ('Type Confusion')," MITRE. https://cwe.mitre.org/data/definitions/843.html . Backs the definition of allocating or initializing a resource using one type and later accessing it using an incompatible type; the extended description covering logical errors from unexpected properties and out-of-bounds memory access in languages without memory safety such as C and C++; the association with unions parsing many embedded object types and the generalization to any application that can interpret the same variable or memory location in multiple ways; the alternate term Object Type Confusion; the consequence that accessing a buffer with the wrong type can read or write out of bounds when the buffer is smaller than the type being accessed, leading to a crash and possibly code execution; the `MessageBuffer` union example with `name` and `nameID` aliasing the same location, the `ello World` output, and the arbitrary-pointer conclusion if an attacker controls `nameID`; the PHP array-versus-scalar and Perl automatic-conversion cases including the `ARRAY(0x229e8)` privilege-check example that fails open and grants all users administrator privileges, with MITRE's own note that it is a forced example demonstrating consequences even in memory-safe languages; CVE-2025-32352 as type confusion in a PHP application allowing authentication bypass when password MD5 hashes can be interpreted as numbers; the ChildOf relationship to CWE-704 Incorrect Type Conversion or Cast and the PeerOf relationship to CWE-1287 Improper Validation of Specified Type of Input; and automated static analysis being rated highly effective at finding some instances by modelling data and control flow between sources and sinks.
