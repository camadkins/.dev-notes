---
title: Packaging, Wheels, and Environments
description: "Why an sdist install runs arbitrary code and a wheel install does not, what a virtual environment actually changes, and where the supply-chain risk moved once building stopped happening on your machine."
draft: false
comments: true
tags:
  - cs
  - languages
  - build-systems
date: 2026-08-15
updated:
aliases: []
---

For most of Python's history, installing a package meant running a program the package author wrote. `setup.py` was Python source, `pip install` executed it, and whatever that script did on the way to placing files in `site-packages` was between you and the author. The wheel format exists to end that arrangement, and reading its rationale makes the motivation explicit: Python needs a package format that is easier to install than sdist, because sdists require the distutils and setuptools build systems, running arbitrary code to build-and-install, and re-compile, code just so it can be installed into a new virtualenv. The verdict on that design is blunt. This system of conflating build-install is slow, hard to maintain, and hinders innovation in both build systems and installers.

> [!note] The idea
> A wheel is a build artifact and an sdist is a build input, and the entire modern packaging stack is the consequence of separating them. Once installation is unzipping rather than executing, the install step becomes deterministic, cacheable, offline-capable, and inspectable before it runs. That separation is also the security boundary: an sdist install executes code chosen by the package author on your machine, and a wheel install does not, which relocates [[cs/languages/common/software-supply-chain-and-provenance|supply-chain risk]] from your machine to whichever machine built the wheel.

## What a wheel is

The specification is deliberately unexciting. A wheel is a ZIP-format archive with a specially formatted file name and the `.whl` extension, containing a single distribution nearly as it would be installed under a particular installation scheme. It is so nearly installed that the PEP notes a wheel file may be installed by simply unpacking into `site-packages` with the standard unzip tool, while preserving enough information to spread its contents onto their final paths later.

The filename is not cosmetic. It is `{distribution}-{version}(-{build tag})?-{python tag}-{abi tag}-{platform tag}.whl`, which makes the archive self-describing: which Python, which ABI, which platform. An installer picks a wheel by matching those tags against the interpreter it is installing into, which is why a project publishes many wheels for one release and why `none-any` in a filename means pure Python that fits anywhere. The build tag exists for a narrow case, acting as a tie-breaker if two wheel file names are the same in all other respects.

The ABI tag is the part that connects to the rest of the runtime. A wheel containing compiled code is bound to the interpreter's C ABI, so `cp312` wheels do not load into 3.13 unless they were built against the stable ABI. This is [[cs/languages/Python/the-c-api-and-extension-modules|the C API]] showing up in the distribution layer: the packaging system has to encode ABI compatibility in filenames because the language cannot check it at import time.

## What a virtual environment actually does

The mechanism is smaller than the mythology around it. PEP 405 proposes a mechanism for lightweight virtual environments with their own site directories, optionally isolated from system site directories. Each has its own Python binary and its own independent set of installed packages, but shares the standard library with the base installed Python.

Sharing is the whole trick. The predecessor approach, `PYTHONHOME`, required copying or symlinking the entire standard library into every environment, which is neither lightweight nor portable across platforms with inconsistent symlink support. The replacement is a text file. If a `pyvenv.cfg` file is found next to the Python executable or one directory above it, the file is scanned for lines of the form `key = value`, and if a `home` key is found, this signifies that the Python binary belongs to a virtual environment, with the value naming the directory of the interpreter that created it.

So an environment is a directory with a config file that redirects prefix resolution. It changes where [[cs/languages/Python/the-import-system|`sys.path` gets built from]] and nothing else. There is no container, no namespace, no isolation in the operating-system sense. Anything that bypasses `sys.path`, an absolute import from a hardcoded location, a compiled extension linked against a system library, a subprocess invoking a different interpreter, is unaffected by the environment entirely. Calling it isolation oversells it; it is a search-path convention with a marker file.

## Building, and where the code runs now

Wheels solved installation but left building unspecified, and PEP 517 names the trap that created: distutils and setuptools were hard to extend, and yet it is very difficult to use anything else, because distutils and setuptools provide the standard interface for installing packages expected by both users and installation tools. A monopoly held by an interface rather than by a product.

The fix was to define the interface itself. A source tree declares a build backend in `pyproject.toml`, and a frontend such as pip calls documented hooks like `build_wheel` and `build_sdist` rather than executing a script with an assumed shape. The PEP is explicit that the old form is a legacy: there is an existing, legacy source tree format involving `setup.py`, whose de facto specification is encoded in the source code and documentation of the tools that implement it. Naming the legacy as a legacy is what let flit, hatchling, poetry-core, and maturin exist.

The frontend's job is described in the same terms an installer would use: taking a set of package requirements and attempting to update a working environment to satisfy them, which may require locating, building, and installing a combination of wheels and sdists. Resolution is the part that turns out to be hard. A requirement names a version range, ranges from different packages must intersect, and the constraint set is not known until packages are downloaded, since a package's dependencies live in its own metadata. That makes resolution a search over a graph discovered while traversing it, closer to [[cs/dsa/backtracking-algorithms|backtracking search]] than to a lookup, and it is why installers backtrack, and why a resolution failure often surfaces after several minutes of downloads.

> [!warning] Where the supply-chain risk actually sits
> Wheels do not eliminate arbitrary code execution, they move it. Installing an sdist runs the author's build code on your machine with your credentials. Installing a wheel runs nothing at install time, but you are trusting whichever machine produced that archive, and a wheel on an index is an opaque binary that no one reviewed. Import time is a second window: `pip install` of a wheel is safe in a way that `import` of the package is not, since a package body executes at import. Lockfiles with hashes constrain what you install to what you reviewed, which is the same argument [[cs/security/subresource-integrity|subresource integrity]] makes for the browser, and the same reason verifiable public logs became the pattern for trusting artifacts you did not build.

The compressed version of all of this is that Python's packaging tooling looks chaotic because it is the only layer where three separate problems meet: describing what a build produces, deciding which prebuilt artifact fits your interpreter, and choosing versions that satisfy a constraint system. Wheels answered the first two with a filename convention, PEP 517 answered the build interface with a hook protocol, and the third remains genuinely hard because dependency resolution is. Compare Rust's approach in Cargo, where one build system, one artifact format, and one resolver were designed together from the start, and the contrast is not competence, it is that Python retrofitted a specification onto twenty years of deployed practice.

## Related Notes

- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - the trust question wheels relocate rather than remove
- [[cs/languages/Python/the-import-system|The Import System]] - the `sys.path` machinery a virtual environment redirects
- [[cs/languages/Python/the-c-api-and-extension-modules|The C API and Extension Modules]] - why a wheel filename has to encode an ABI tag
- [[cs/dsa/backtracking-algorithms|Backtracking Algorithms]] - the shape of dependency resolution once constraints are discovered lazily
- [[cs/languages/Rust/cargo-crates-and-the-module-tree|Cargo, Crates, and the Module Tree]] - what the design looks like when it is not retrofitted
- [[cs/security/subresource-integrity|Subresource Integrity]] - pinning an artifact by hash, the browser's version of a lockfile

## Sources

- "PEP 427 - The Wheel Binary Package Format 1.0," Python Enhancement Proposals. https://peps.python.org/pep-0427/ . Supports wheels being ZIP archives with a formatted name and `.whl` extension containing a nearly installed distribution; installability by plain unzipping into site-packages; the rationale that sdists require running arbitrary code to build and install and that conflating build with install is slow and hinders innovation; the filename tag convention; and the build tag acting as a tie-breaker.
- "PEP 405 - Python Virtual Environments," Python Enhancement Proposals. https://peps.python.org/pep-0405/ . Supports virtual environments having their own site directories and Python binary while sharing the base standard library; the `PYTHONHOME` alternative requiring the whole standard library to be copied or symlinked; and the `pyvenv.cfg` marker file being scanned for key-value lines with a `home` key marking the binary as belonging to an environment.
- "PEP 517 - A build-system independent format for source trees," Python Enhancement Proposals. https://peps.python.org/pep-0517/ . Supports distutils and setuptools being hard to replace because they provide the standard interface expected by users and installation tools; the `setup.py` source tree being treated as a legacy format with only a de facto specification; and an integration frontend needing to locate, build, and install a combination of wheels and sdists to satisfy requirements.
