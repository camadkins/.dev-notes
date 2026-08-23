---
title: Portability and Cross-Compilation
description: "Target triples, ABI and platform assumptions, and why building for a machine you are not sitting at is a supply problem before it is a compiler problem."
draft: false
comments: true
tags:
  - cs
  - languages
  - build-systems
date: 2026-03-08
updated:
aliases:
  - Target Triples
  - Cross-Compilation
---

`x86_64-unknown-linux-gnu`. Four fields separated by hyphens, and every one of them is a promise about the machine that will eventually run your code: what instructions it decodes, who made it, what operating system [[cs/systems/system-calls-and-the-kernel-boundary|mediates its syscalls]], and which C library and calling convention the binary expects to find. Change any field and you are compiling a different program, even though the source did not move.

> [!note] The idea
> Cross-compiling is mostly not about the compiler. Modern compilers are cross-compilers already; Clang is natively a cross-compiler and rustc is a cross-compiler by default, so retargeting the code generator is a flag. The hard part is everything the compiler does not ship: the target's headers, its libraries, its linker, and the CPU and ABI details the triple leaves at defaults. Portability is therefore a supply problem plus an assumption problem, and the target triple is the name you give to a bundle of assumptions so that the toolchain, the standard library, and the linker can agree on which machine you meant.

## The triple names the assumptions

Clang's cross-compilation documentation gives the format directly: `<arch><sub>-<vendor>-<sys>-<env>`, where arch is `x86_64`, `i386`, `arm`, `thumb`, `mips` and so on, sub is a sub-architecture such as ARM's `v5`, `v6m`, `v7a`, `v7m`, vendor is `pc`, `apple`, `nvidia`, `ibm`, sys is the operating system (`linux`, `win32`, `darwin`, `cuda`, or the bare-metal `none`), and env is `eabi`, `gnu`, `android`, `macho`, `elf`. Rust uses the same identifier, calling the target triple the string that tells the compiler what kind of output to produce.

Each field earns its place. The environment field in particular is not cosmetic: Clang's docs describe it as picking the default CPU and FPU, defining specific behaviour of your code such as the procedure call standard and extensions, and choosing the correct library calls. That is why `arm-none-eabi` and `arm-linux-gnueabi` are different targets rather than two spellings of ARM.

Omitting a field is allowed and quietly costly. Unknown or unimportant parameters default to `unknown`, and if you supply something Clang does not recognize, like `blerg`, it ignores it and assumes `unknown`, which the docs note is not always what you wanted. The same class of silent-default failure applies to the target itself: if you do not pass `-target`, Clang assumes the host triple, CPU names will not match, and compilation proceeds happily producing host code that breaks later at assembly or link time. The error surfaces far from its cause.

## Defaults are conservative, which means slow

Once the target is fixed, the hardware within that target still has to be chosen, and the compiler's defaults are deliberately timid. Clang's guidance is that for every architecture a default set of CPU, FPU, and ABI is chosen and you will almost always have to change it with flags such as `-mcpu`, `-mfpu`, and `-mfloat-abi` (which controls whether floating-point arguments travel in FP registers or integer ones). The default is normally the common denominator, so that Clang does not generate code that breaks, with the consequence that you will not get the best code for your hardware, which may mean orders of magnitude slower than you expect.

The documented example is worth keeping: targeting `arm-none-eabi` gives you a default CPU of arm7tdmi using soft float, which is extremely slow on modern cores, whereas `armv7a-none-eabi` gives Cortex-A8 with NEON while still defaulting to soft float. Nothing failed. The binary just runs at a fraction of the speed the chip is capable of, because the triple did not say enough.

Rust exposes the same axis through `-C target-feature`, which adds or removes CPU-specific instruction set extensions such as AVX, BMI, or [[cs/security/aes-and-block-ciphers|AES]] on top of the x86 and ARMv8 baselines, and the rustc book flags that this is generally considered unsafe. It is the same tension in both toolchains: the baseline runs everywhere, the extensions run fast, and only the person deploying the binary knows which machines it will actually meet.

## The compiler is not the missing piece

The naive model of cross-compilation is that you need a special compiler. Clang's own framing rejects that. In the GCC world every host/target combination has its own set of binaries, headers, and libraries, so you download a package per combination. Clang/LLVM is natively a cross-compiler: one set of programs can compile to all targets by setting `-target`, which simplifies life for programmers, compiler developers, and OS distributions alike. rustc says the same thing about itself, that it is a cross-compiler by default and you can build for any listed architecture with `--target`, as in `--target=wasm32-unknown-unknown`.

What remains hard is the surrounding material. Compilers come with standard libraries only (`compiler-rt`, `libcxx`, `libgcc`, `libm`), so every other library your software needs has to be found and made available for the target; having your host's libraries installed is not enough. `--sysroot` exists to relocate the logical root for headers and libraries, but it assumes your binaries and libraries live in one directory, which is often false when the cross-compiler came from a distribution package, so in most cases you end up setting include paths (`-I`) and library paths (`-L`) by hand. Clang's summary of why this stays painful is a good description of build engineering generally: different toolchains can be host/target specific or flexible, live in one directory or be spread across the system, ship different default libraries and headers, and need special options the build system cannot infer.

> [!warning] "It cross-compiles" is a tiered claim, not a binary one
> Rust organizes platform support into three tiers with different guarantees. Tier 1 targets are described as guaranteed to work: the project builds official binary releases and automated testing ensures each one builds and passes tests after every change. Tier 2 targets are guaranteed to build: official standard library (or in some cases only core library) releases exist and automated builds confirm the target still works as a build target, but tests are not always run, so a successful build is not a guarantee of a working one. Tier 3 targets are supported in the codebase but not built or tested automatically, so they may or may not work, and no official builds are available. When someone says a language supports your platform, the useful question is which of those three sentences they mean.

## What actually makes code portable

The triple handles the machine. The assumptions inside your source are your problem, and they tend to be the same short list every time: integer widths that follow the target's word size (Rust's `usize`, C's `long`), byte order when data leaves the process, structure layout and calling convention at any [[cs/languages/common/c-abi-and-ffi|foreign function boundary]], filesystem and path conventions, and dependence on a specific libc. This is why the environment field of the triple carries `gnu` versus `musl` versus `msvc` as a first-class distinction: those are three different sets of runtime promises for the same CPU and OS, and a binary built against one does not run against another.

The engineering rule that falls out is to make platform assumptions explicit and few. Name fixed widths when the width matters, choose an [[cs/languages/common/serialization-and-wire-formats|explicit byte order]] at every boundary where bytes leave the machine, keep the platform-specific surface behind a narrow interface, and test on the target rather than on the target's description. The compiler will happily produce a binary for a machine that will refuse to run it.

## Related Notes

- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - the calling convention and layout rules the environment field is really about
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - where sysroots, target flags, and toolchain selection actually live
- [[cs/languages/common/numeric-types-and-overflow-semantics|Numbers, Overflow, and the Edge of the Type]] - the pointer-sized integer types that change with the target
- [[cs/languages/common/serialization-and-wire-formats|Serialization and Wire Formats]] - byte order and layout once data leaves one machine for another
- [[cs/languages/common/undefined-behavior-as-a-contract|Undefined Behavior as a Contract]] - why "it worked on my platform" is not evidence of correctness

## Sources

- "Cross-compilation using Clang," Clang documentation. https://clang.llvm.org/docs/CrossCompilation.html . Supports the `<arch><sub>-<vendor>-<sys>-<env>` triple format with its listed field values, the environment field selecting default CPU/FPU, procedure call standard, and library calls, unknown or unrecognized fields defaulting to `unknown`, the host-triple assumption when `-target` is omitted breaking at assembly or link time, Clang/LLVM being natively a cross-compiler driven by `-target`, the `-mcpu`/`-mfpu`/`-mfloat-abi` flags and common-denominator defaults, the `arm-none-eabi` arm7tdmi soft-float versus `armv7a-none-eabi` Cortex-A8 NEON example, compilers shipping only standard libraries, and `--sysroot` plus manual `-I`/`-L` paths.
- "Platform Support," The rustc book. https://doc.rust-lang.org/rustc/platform-support.html . Supports targets being identified by their target triple, and the three-tier guarantee structure: tier 1 as "guaranteed to work" with official binary releases and automated build-and-test on every change, tier 2 as "guaranteed to build" with tests not always run, and tier 3 as supported in the codebase but not built or tested automatically with no official builds.
- "Targets," The rustc book. https://doc.rust-lang.org/rustc/targets/index.html . Supports rustc being a cross-compiler by default, the `--target` flag with the `wasm32-unknown-unknown` example, and `-C target-feature` adding or removing CPU-specific instruction sets (AVX, BMI, AES) above the x86 and ARMv8 baselines, with the note that the flag is generally considered unsafe.
