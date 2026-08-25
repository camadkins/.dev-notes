---
title: Insecure Deserialization
description: "Why deserialization can hand an attacker remote code execution without a single line of injected code: the bytes decide which objects get built, and building an object can run behavior."
draft: false
comments: true
tags:
  - cs
  - security
  - serialization
date: 2026-07-25
updated:
---

[[cs/languages/common/serialization-and-wire-formats|Serialization]] looks like plumbing. You flatten an object into bytes to store or send it, and later you rebuild it. The rebuild is where the danger hides, because rebuilding is not a passive copy. In many languages, reconstructing an object runs code: [[cs/pl/objects-classes-and-dispatch|constructors]], callbacks, hooks that fire as the object comes back to life. If the attacker controls the bytes, the attacker controls which objects get built and, through those hooks, what runs while they are built. No injected script is required. The serialized stream is the payload.

> [!note] The idea
> Insecure deserialization is dangerous because a native deserializer treats the input stream as instructions for which objects to instantiate and how, so untrusted bytes get to choose object types and trigger the side effects of reconstructing them. The vulnerability is rarely in code you wrote. It is in the deserializer plus whatever classes happen to be reachable, and it can escalate all the way to remote code execution.

## Rebuilding is not reading

OWASP frames deserialization neutrally: "Deserialization is the reverse of that process, taking data structured in some format, and rebuilding it into an object." The word *rebuilding* is doing quiet work. A pure data parser reads values into fields. A native object deserializer does more: it decides which class to instantiate based on [[cs/languages/common/runtime-type-information|type information]] in the stream, and it invokes the language's reconstruction machinery for that class. When the class carries logic in that machinery, deserializing an instance of it executes that logic.

The consequence is stark. OWASP: "Attacks against deserializers have been found to allow denial-of-service, access control, or remote code execution (RCE) attacks." RCE from parsing data is the part that surprises people. It happens because the attacker does not inject code; they select, from the classes already present in the application, a chain whose reconstruction side effects add up to code execution. The application supplied all the pieces. The attacker only supplied the order.

## Why the fix is at the format, not the filter

You cannot reliably scan a serialized blob for malice, because whether it is malicious depends on which classes exist in the running process, not on any pattern in the bytes. So the strongest mitigation changes the format. OWASP: "A great reduction of risk is achieved by avoiding native (de)serialization formats. By switching to a pure data format like JSON or XML, you lessen the chance of custom deserialization logic being repurposed towards malicious ends." A pure data format has no notion of "instantiate this class," so there is no reconstruction machinery for an attacker to aim.

When native serialization is unavoidable, the second control is authentication of the stream itself. OWASP: "If the application knows before deserialization which messages will need to be processed, they could sign them as part of the serialization process," and then refuse to deserialize any message that lacks a valid signature. This is where a [[cs/security/digital-signatures|digital signature]] earns its keep: it moves the trust decision *before* the dangerous rebuild, so an attacker-forged stream is rejected while it is still inert bytes. As a last-resort language control, OWASP's Java advice is to "override the ObjectInputStream#resolveClass() method to prevent arbitrary classes from being deserialized," constraining the type choice the attacker was relying on.

> [!warning] Allowlisting classes is a floor, not a ceiling
> Restricting which classes may be deserialized (via `resolveClass` or a library) shrinks the attack surface, but gadget chains have been found even within seemingly innocuous allowed classes. Prefer removing native deserialization of untrusted input entirely; treat class allowlisting as hardening for the cases you cannot yet remove, not as the primary defense.

## Related Notes

- [[cs/security/digital-signatures|Digital Signatures]], the primitive behind refusing to deserialize any message that is not authenticated
- [[cs/security/sql-injection|SQL Injection]], another failure where untrusted input crosses from data into execution
- [[cs/security/owasp-top-10|The OWASP Top 10]], where this sits inside the A08 Software and Data Integrity Failures category

## Sources

- "Deserialization Cheat Sheet," OWASP Cheat Sheet Series. https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html . Supports that "Deserialization is the reverse of that process, taking data structured in some format, and rebuilding it into an object," that "Attacks against deserializers have been found to allow denial-of-service, access control, or remote code execution (RCE) attacks," that "A great reduction of risk is achieved by avoiding native (de)serialization formats. By switching to a pure data format like JSON or XML," that signed messages let the application "choose not to deserialize any message which didn't have an authenticated signature," and the Java guidance to "override the ObjectInputStream#resolveClass() method to prevent arbitrary classes from being deserialized."
