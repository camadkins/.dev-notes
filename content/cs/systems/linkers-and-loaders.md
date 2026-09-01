---
title: Linkers and Loaders
description: "Compilation ends with holes where the addresses go. A linker fills the ones it can from other object files, and a loader fills the rest at the moment the program starts."
draft: false
comments: true
tags:
  - cs
  - systems
  - build-systems
  - operating-systems
date: 2026-08-31
updated:
aliases:
  - ELF
---

A compiler that reads one source file cannot know where anything else lives. It emits a call to `printf` as a call to a name, leaves a hole where the address belongs, and records the hole. The linker's whole job is filling holes: it combines intermediate build files such as object and library files into a single executable file, resolving symbols as it goes. Its documentation-shaped cousin, the loader, is the part of the operating system responsible for loading programs and libraries, placing them into memory and preparing them for execution, then passing control to the loaded code.

> [!note] The idea
> One binary file is read twice, by two programs, through two incompatible views of the same bytes. An ELF file's section header table describes sections, which carry the data needed for linking and relocation; its program header table describes segments, which carry what is needed at run time. The linker reads sections and produces segments. The loader reads only segments and never looks at a section again. Every confusing build error is a question about which of those two readings was supposed to satisfy a given symbol, and when.

## Three kinds of symbol

An object file holds three kinds of symbol: defined external symbols, sometimes called public or entry symbols, which allow the object to be called by other modules; undefined external symbols, which reference other modules where these symbols are defined; and local symbols, used internally within the object file to facilitate relocation. For most compilers, each object file is the result of compiling one input source file.

Linking is then a matching problem across that set. Every undefined external must find exactly one defined external somewhere in the inputs. Zero matches is the undefined-reference error. Two matches is the duplicate-symbol error, and in C++ the rule that keeps you out of it is [[cs/languages/Cpp/the-one-definition-rule|the one definition rule]], which also explains why templates and inline functions need a special exemption: they genuinely are defined in every [[cs/languages/Cpp/translation-units-linkage-and-the-build-model|translation unit]] that includes their header, and the linker is instructed to keep one and discard the rest rather than to complain.

Static libraries add a filtering step that surprises people. Most linkers do not include all the object files in a static library in the output; they include only those object files from the library that are referenced by other object files or libraries directly or indirectly. Library linking may thus be an iterative process, with some referenced modules requiring additional modules to be linked, and so on. That iteration is why link order matters on classic Unix linkers: a library is scanned once, against the undefined set as it stands at that moment, so a library listed before the code that needs it contributes nothing.

## Relocation, and why the compiler guesses zero

The linker arranges the objects in a program's address space. Since a compiler seldom knows where an object will reside, it often assumes a fixed base location, commonly zero, so relocating that code into its real base means re-targeting absolute jumps, loads, and stores. The relocation entries the compiler emitted alongside the code are the instructions for doing that: each names a place in the output that has to be patched and the symbol whose final address to patch in.

There is a second-order effect worth knowing about, because it is the reason a linker is more than a memcpy with arithmetic. Since the compiler has no information on the final layout, it cannot choose the shorter instruction encodings that depend on how far away the target is. The toolchain answers by generating the most conservative instruction, usually the largest relative or absolute variant, and adding relaxation hints; the linker then substitutes shorter sequences during the final link. That pass can only run after all input objects have been read and assigned temporary addresses, and the reassignment it performs may in turn allow more relaxations, so the pass iterates. The substituted sequences are generally shorter, which is what makes it converge.

## Static versus dynamic

Static linking is the result of the linker copying all library routines used in the program into the executable image. It costs disk and memory and buys portability, since it does not require the library to be present on the system where the program runs, and it prevents DLL hell, because each program includes exactly the versions of the routines it requires with no conflict with other programs.

Dynamic linking defers the resolution of some undefined symbols until the program is run. The executable still contains undefined symbols, plus a list of the objects or libraries that will provide definitions for them; loading the program loads those libraries too and performs a final linking. The two arguments for it are shared and clear: an often-used library is stored in one location rather than duplicated into every executable, and a bug fixed by replacing the library benefits every program that links it dynamically after a restart, where a statically linked program would have to be re-linked. The counter-argument has a name. DLL hell is what happens when an incompatible updated library breaks executables that depended on the previous version's behavior, and it is the practical reason [[cs/software-engineering/semantic-versioning|semantic versioning]] exists as a social protocol.

On ELF systems the mechanism is unusually visible. The path of the dynamic linker is embedded at link time into the `.interp` section of the executable's `PT_INTERP` segment. When the executable is loaded, the kernel reads that path and attempts to load and execute that other binary first; if the attempt fails, because there is no file at that path, the attempt to run the original executable fails too. The dynamic linker then loads the initial executable image and every library it depends on, and starts it. The consequence is stated plainly in the documentation and is easy to underrate: the pathname of the dynamic linker is part of the operating system's [[cs/languages/common/c-abi-and-ffi|application binary interface]]. A statically linked binary has no such dependency, which is the entire reason "static binary" and "runs on any distribution" are treated as the same claim.

## What the loader actually does

On Unix, the loader is the handler for the `execve()` [[cs/systems/system-calls-and-the-kernel-boundary|system call]], and its tasks are short: validate permissions and memory requirements, memory-map the executable object from disk into main memory, copy the command-line arguments into virtual memory, initialize registers such as the stack pointer, and jump to the entry point `_start`.

The memory-mapping step is where [[cs/systems/virtual-memory|virtual memory]] changes the shape of the job. On a system with virtual memory the loader may not copy the executable's contents into memory at all, and instead declares to the virtual-memory subsystem that a mapping exists between a region of the process's address space and the contents of the file. Pages in that region are then filled on demand if and when execution reaches them, so parts of a program's code may not be copied into memory until they are used, and unused code may never be loaded at all. Process startup becomes a bookkeeping operation whose cost is roughly independent of binary size.

Virtual memory also deletes work the loader used to do. The executable output by the linker may need another relocation pass when it is finally loaded, but this pass is usually omitted on hardware offering virtual memory, because every program gets its own address space and there is no conflict even if all programs load at the same base address. It is also omitted if the executable is position independent. Relocating loaders are needed on systems where a program is not always loaded at the same virtual address *and* pointers are absolute addresses rather than offsets from a base, which is why they are discussed mostly in the context of OS/360 and its descendants.

Dynamic loading is the third mechanism and it is the one under program control rather than toolchain control. A program can, at run time, load a library into memory, retrieve the addresses of functions and variables in it, call those functions, and unload the library. Unlike static and dynamic linking, dynamic loading lets a program start up in the absence of these libraries, discover available libraries, and potentially gain additional functionality. That property is the whole plugin architecture, which is why Apache's `*.dso` plugin files work the way they do.

> [!example] Following one call through
> `main.c` calls `helper()`, defined in `helper.c`, and `printf`, defined in libc.
>
> Compiling `main.c` produces `main.o` with two undefined externals, `helper` and `printf`, plus a relocation entry for each call site. Compiling `helper.c` produces `helper.o` with `helper` as a defined external.
>
> The linker reads both. `helper` matches, so the call site is patched with a real offset and that hole is closed at build time. `printf` does not match anything in the inputs, but libc was named on the command line as a shared library, so the linker records the dependency, leaves the call routed through a stub, and writes the dynamic linker's path into `PT_INTERP`.
>
> At `execve`, the kernel reads that path, runs the dynamic linker, and the dynamic linker maps libc, finds `printf`, and fills the stub. The same call in the same source line was resolved in two entirely different eras of the program's life, and which era it was is not visible anywhere in the C.

## Related Notes

- [[cs/languages/Cpp/translation-units-linkage-and-the-build-model|Translation Units, Linkage, and the Build Model]] - the front half, where the object files and their undefined symbols come from
- [[cs/languages/Cpp/the-one-definition-rule|The One Definition Rule]] - the rule that keeps the symbol match unambiguous, and what happens when it does not
- [[cs/systems/virtual-memory|Virtual Memory]] - why loading is mapping rather than copying, and why a relocating loader is rarely needed
- [[cs/systems/system-calls-and-the-kernel-boundary|System Calls and the Kernel Boundary]] - `execve`, the call the loader implements
- [[cs/dsa/topological-sorting|Topological Sorting]] - the ordering the build computes over source dependencies before any of this begins
- [[cs/languages/common/c-abi-and-ffi|The C ABI and FFI]] - the calling and naming conventions that make a symbol match mean anything
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - what a language gets when the module boundary is a language feature instead of a file-name convention
- [[cs/software-engineering/semantic-versioning|Semantic Versioning]] - the promise that keeps a replaced shared library from breaking its dependents

## Sources

- "Linker (computing)," Wikipedia. https://en.wikipedia.org/wiki/Linker_%28computing%29 . Backs the definition of a linker as combining intermediate build files such as object and library files into a single executable, the three kinds of symbol an object file can contain (defined external, undefined external, local), each object file typically being the result of compiling one source file, the linker resolving symbols while combining, static libraries contributing only the object files actually referenced and the resulting iterative linking, the linker arranging objects in the address space and relocating code compiled against an assumed base such as zero by re-targeting absolute jumps, loads, and stores, the load-time relocation pass usually being omitted on virtual-memory hardware or for position-independent executables, linker relaxation with conservative instructions plus relaxation hints substituted after temporary address assignment and the iteration this permits, dynamic linking deferring resolution of undefined symbols with its two advantages and the DLL hell disadvantage, and static linking copying all used library routines into the image for portability and conflict avoidance.
- "Loader (computing)," Wikipedia. https://en.wikipedia.org/wiki/Loader_%28computing%29 . Backs the loader as the part of the operating system responsible for loading programs and libraries by memory-mapping or copying the executable into memory and preparing it for execution before passing control to it, the virtual-memory case where the loader declares a mapping and pages are filled on demand so unused code may never be loaded, the Unix loader being the handler for `execve()` with its five listed tasks ending at the `_start` entry point, and the conditions under which a relocating loader is required.
- "Dynamic linker," Wikipedia. https://en.wikipedia.org/wiki/Dynamic_linker . Backs the dynamic linker as an operating system feature that loads and links dynamic libraries for an executable at run time, copying library content into RAM, filling jump tables, and relocating pointers, the ELF convention of embedding the dynamic linker's path at link time in the `.interp` section of the `PT_INTERP` segment, the kernel reading that path and failing the exec if the interpreter cannot be run, and the pathname of the dynamic linker being part of the operating system's ABI.
- "Executable and Linkable Format," Wikipedia. https://en.wikipedia.org/wiki/Executable_and_Linkable_Format . Backs ELF as a common standard format for executables, object code, shared libraries, device drivers, and core dumps, first published in the System V Release 4 ABI, and the two-view structure in which the program header table describes segments containing what is needed for run-time execution while the section header table describes sections containing the data needed for linking and relocation.
- "Dynamic loading," Wikipedia. https://en.wikipedia.org/wiki/Dynamic_loading . Backs dynamic loading as a run-time mechanism for loading a library, retrieving addresses of its functions and variables, calling them, and unloading it, its position as the third mechanism alongside static and dynamic linking, its distinguishing property of letting a program start in the absence of the libraries and discover available ones, and its most frequent use in software plugins including Apache's `*.dso` files.
