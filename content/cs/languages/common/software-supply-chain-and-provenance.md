---
title: Software Supply Chain and Provenance
description: Most of your code is code you never wrote. Lockfiles, reproducible builds, SBOMs, and provenance as the tools for trusting an artifact you did not build yourself.
draft: false
comments: true
tags:
  - cs
  - languages
date: 2026-07-22
updated:
aliases:
  - Software Supply Chain
  - Provenance
  - SBOM
---

A modern program is mostly other people's code. A small Rust binary pulls in dozens of crates, a Python service sits on a tower of packages from PyPI, a C++ project links libraries it never audited. Each of those dependencies runs with the same privileges as the code you did write, and each arrived over a package registry from an author you have never met. The software supply chain is that whole path, from a maintainer's commit to the artifact running in production, and every hop on it is a place an attacker can insert code. This is the software mirror of the hardware problem in [[cs/geopolitics/semiconductor-supply-chains|semiconductor supply chains]]: the further the thing you depend on is from your own hands, the harder it is to know what is really in it.

Naming the components is a language-and-tooling concern, which is why it belongs here rather than in the pipeline-and-platform half of [[cs/software-engineering/index|software engineering]]. Every language's package manager makes the same promises and faces the same attacks.

> [!note] The idea
> You cannot personally audit every dependency, so trust has to come from mechanism instead of inspection. Four mechanisms do most of the work: a lockfile pins exactly which versions you got, a reproducible build lets anyone confirm a binary matches its source, an SBOM inventories what is actually inside an artifact, and provenance attests to how and where it was built. Together they turn "trust the author" into "verify the artifact."

## The attack surface: source, build, and dependency

The SLSA framework (Supply-chain Levels for Software Artifacts), an industry-consensus set of supply-chain security guidelines, names the threat cleanly. Code can be tampered with after review, the build platform itself can be compromised so that the artifact does not match the reviewed source, and a dependency can be swapped or poisoned upstream. These are three distinct doors, and a defense that closes one leaves the others open. The registry attacks that make the news, a malicious version published under a trusted package name, a typosquatted package one keystroke from a popular one, a maintainer account taken over, all live in that dependency door.

## Lockfiles: pin exactly what you got

The first mechanism is the humblest. A manifest like `Cargo.toml` or a `requirements.txt` states loose version requirements: give me `regex` version 1-point-something. That looseness is a hole. As the Cargo book puts it, if you build today and I build tomorrow from the same loose manifest, new upstream commits could land in between and we would get different builds. The lockfile closes it. `Cargo.lock` records the exact resolved versions, down to the git SHA, so that everyone who builds from it gets bit-for-bit the same dependency set; the book's guidance is, when in doubt, commit the lockfile. Every ecosystem has this file, `Cargo.lock`, `package-lock.json`, `poetry.lock`, and it is the difference between "some version of this dependency" and "this exact one."

## Reproducible builds: prove the binary matches the source

Pinning the inputs is not enough if the build itself can be subverted. You download a compiled binary; how do you know it was built from the source it claims? A reproducible build answers this. Per the Reproducible Builds project, a build is reproducible if, given the same source code, build environment, and build instructions, any party can recreate bit-for-bit identical copies of all specified artifacts. That property is quietly powerful. If independent rebuilders all produce the same bytes, matching hashes confirm the binary corresponds to the public source, and if a compromised build server injected something, its artifact differs and the tampering is exposed. Reproducibility turns "trust the builder" into a check anyone can run.

## SBOMs and provenance: know what is inside and where it came from

The last two mechanisms are about visibility. A Software Bill of Materials is a machine-readable inventory of every component and dependency inside an artifact, a list of ingredients. Open standards like SPDX exist to document and exchange exactly this: what is in the software, how the pieces relate, and their licensing and known vulnerabilities. When a vulnerability drops in some widely used library, the organizations with an SBOM can answer "are we affected" in minutes instead of weeks, because they already have the inventory.

Provenance is the complementary claim about origin. In SLSA's model it is tamper-resistant metadata attesting how an artifact was built, by which build platform, from which sources, so a consumer can verify the artifact came from the expected pipeline rather than an attacker's. SLSA grades this with ascending build levels: the higher the level, the stronger the guarantee that the artifact is what its provenance says. Provenance is to a binary what a chain of custody is to evidence.

> [!warning] These mechanisms detect, they do not prevent
> A lockfile, a reproducible build, and an SBOM do not stop a maintainer from shipping malicious code; they make it detectable and attributable after the fact. That is still most of the value, because supply-chain attacks depend on going unnoticed, but it is why the security guidance pairs them with human review of new dependencies. The [[cs/military-computing/stuxnet-and-cyber-physical-exploitation|Stuxnet]] lesson holds here too: a determined attacker chains small, individually plausible steps, and the defense is making each step leave a trace.

## Related Notes

- [[cs/geopolitics/semiconductor-supply-chains|Semiconductor Supply Chains]] - the hardware mirror of the same trust problem, at the level of fabs and export controls
- [[cs/military-computing/stuxnet-and-cyber-physical-exploitation|Stuxnet and Cyber-Physical Exploitation]] - what a patient supply-chain-style attack looks like when it chains plausible steps
- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - dependencies are code you did not write running with your privileges, the same trust boundary from the linking side
- [[cs/software-engineering/version-control-fundamentals|Version Control Fundamentals]] - the content-addressed commit hashes that pinning and provenance both build on

## Sources

- "SLSA: About / Threats," slsa.dev (OpenSSF). https://slsa.dev/spec/v1.0/about . Supports SLSA being an industry-consensus set of incrementally adoptable supply-chain security guidelines, its threat model (code tampering after review, build-platform compromise, dependency risk), provenance as tamper-resistant metadata about how an artifact was built, and ascending build levels.
- "Definition," Reproducible Builds. https://reproducible-builds.org/docs/definition/ . Supports the definition that a build is reproducible if, given the same source, environment, and instructions, any party can recreate bit-for-bit identical artifacts, and that this lets independent rebuilders detect a compromised build by comparing outputs.
- "Cargo.toml vs Cargo.lock," The Cargo Book. https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html . Supports the manifest holding loose version requirements while `Cargo.lock` records exact resolved versions (down to the git SHA) for reproducible builds, and the guidance to commit the lockfile.
- "SPDX Overview," spdx.dev (Linux Foundation). https://spdx.dev/learn/overview/ . Supports SPDX being an open standard for communicating Bill of Materials information, and an SBOM being a machine-readable inventory of a software's components, relationships, licensing, and vulnerabilities for supply-chain transparency and security.
