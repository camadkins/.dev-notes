---
title: "Modules and the Import Path"
description: "Minimal version selection deliberately refuses to be a solver, and the import path is a name resolved by indirection rather than a URL you fetch."
draft: false
comments: true
tags:
  - cs
  - languages
  - build-systems
date: 2026-06-17
updated:
aliases:
  - Go Modules
  - Minimal Version Selection
---

Two things about Go modules look wrong on first contact. Upgrading a dependency picks the oldest version that satisfies the constraints, not the newest. And releasing version 2 of a library requires renaming it. Both are consequences of decisions made to avoid a specific failure, and both are more interesting than the surface annoyance suggests.

> [!note] The idea
> A Go import path is an **identity**, not an address, and the versioning rules exist to keep one identity meaning one compatible API forever. From that, everything else follows. Because a path names a stable contract, a requirement can be stated as a minimum with no upper bound. Because requirements have no upper bounds, resolution is a graph traversal instead of a constraint search, and it stays out of NP-complete territory by construction rather than by luck.

## The path is a name

A module is "identified by a module path," declared in its `go.mod`, and "A module's path is the prefix for package paths within the module." Concatenating the module path with a subdirectory gives a package path, so `golang.org/x/net` plus `html` is `golang.org/x/net/html`. The reference recommends that a path "describe both what the module does and where to find it," which sounds like the path is a URL.

It is not. When the go command needs a repository for a path, it issues a GET to that path with a `?go-get=1` query and looks in the HTML response "for a `<meta>` tag with the name go-import." The tag names the actual repository, which can live anywhere. A path can point at a proxy: a response of `<meta name="go-import" content="example.com/gopher mod https://modproxy.example.com">` says fetch this module from an entirely different host by the proxy protocol. The domain in the path is a naming authority, not a storage location.

The seam is visible in what the go command declines to resolve. "The Go standard library uses package paths that do not contain a dot in the first path element, and the go command does not attempt to resolve such paths from network servers." A dotless first element is reserved, which is why `fmt` cannot be shadowed by anything on the internet. `example` and `test` are reserved for users the same way. This is [[cs/languages/common/module-systems-and-namespacing|namespacing]] done with a global registry that has no registry, using DNS as the allocator and an HTTP indirection as the lookup.

## Why version 2 gets a new name

Starting at major version 2, "module paths must have a major version suffix like /v2 that matches the major version." A library at `example.com/mod` becomes `example.com/mod/v2`, and the reference states the rule this serves in one sentence: "If an old package and a new package have the same import path, the new package must be backwards compatible with the old package."

Read that as a definition rather than as advice. An import path is a promise about an API, so a breaking change is not a new version of the same thing, it is a different thing that needs a different name. This is stricter than [[cs/software-engineering/semantic-versioning|semantic versioning]] alone: semver tells you a major bump signals incompatibility, and Go makes the incompatibility visible in the identifier so that no tool has to interpret a number.

The payoff is the diamond. "Major version suffixes let multiple major versions of a module coexist in the same build." Ordinarily, a module required at two versions resolves to the higher one, but if the two are incompatible neither satisfies both clients, and every package manager without this rule has an escalation procedure for that case. Go does not need one. Incompatible versions have different major numbers, therefore different paths, therefore they are separate modules whose packages are distinct types. The conflict cannot be constructed.

Suffixes are not permitted at v0 or v1, because v0 carries no compatibility guarantee and "a v1 version acts as a commitment to compatibility, rather than an indication of incompatible changes compared with v0."

## Minimal version selection

With no upper bounds anywhere, selection becomes tractable. Each `go.mod` states minimums, so the requirement graph has one vertex per module version and one edge per "minimum required version" relation. MVS "starts at the main modules" and traverses that graph, "tracking the highest required version of each module. At the end of the traversal, the highest required versions comprise the build list: they are the minimum versions that satisfy all requirements."

The name confuses people because the algorithm picks the *highest required* version, which is the *lowest* version consistent with the requirements. The essay is explicit that the two-word summary is the point: "the build list is exactly the versions specified in the requirements." Nothing is inferred; nothing floats.

Mechanically it is a reachability computation. The rough build list "is also just the list of all modules reachable in the requirement graph starting at M and following arrows," computed by an ordinary [[cs/dsa/graph-traversals-bfs-dfs|depth-first traversal]] that skips already-visited nodes, then simplified by keeping the newest version of each module. Cost is proportional to the size of that list plus the arrows traversed, and critically the algorithm "completely ignores versions left off the rough build list," which matters because each version it does not consider is a network round trip it does not make.

Because the answer is fully determined by the inputs, there is no lock file. "MVS is deterministic, and the build list doesn't change when new versions of dependencies are released, so MVS is used to compute it at the beginning of every module-aware command."

> [!tip] Why it is not a solver
> The design constraint was to stay out of Boolean satisfiability. Most version resolvers fall into SAT, where "version searches in these systems are inherently intricate, complex problems for which we know no general efficient solutions." Schaefer's dichotomy theorem names the six classes of formulas decidable in polynomial time and proves everything else NP-complete, and MVS "lies in the intersection of three of the six tractable SAT subproblems: 2-SAT, Horn-SAT, and Dual-Horn-SAT." Being both Horn and dual-Horn is what gives the build list a unique minimal answer. It also bounds future features: negative implications, meaning "if X is installed, then Y must not be installed," break the form, so exclusions "must be decided independent of selections made during build list construction." The [[cs/math/propositional-logic|logical form of the constraints]] is the design document.

## What the build inherits

The stated goal is high fidelity. A build is high fidelity "when it deviates from the author's own build only to satisfy a requirement elsewhere in the build," which is a stronger claim than reproducibility because it applies to libraries inside larger programs rather than only to whole binaries. Since the version chosen is the one the author declared, a consumer runs what the author tested unless someone else in the graph forced an upgrade.

Determinism about which version is not determinism about which bytes. That is `go.sum`, which "contains cryptographic hashes of the module's direct and indirect dependencies," checked against the hash computed when a `.mod` or `.zip` lands in the module cache. A public checksum database backs it up, consulted unless a path is matched by `GOPRIVATE` or `GONOSUMDB`. Version selection answers what to build; the [[cs/languages/common/software-supply-chain-and-provenance|checksum layer]] answers whether you got it.

## Related Notes

- [[cs/software-engineering/semantic-versioning]] - the versioning convention Go turns from a signal into a naming rule
- [[cs/dsa/graph-traversals-bfs-dfs]] - the traversal MVS is, once the upper bounds are gone
- [[cs/math/propositional-logic]] - Horn and dual-Horn formulas, and why the shape of a constraint decides whether resolution is cheap
- [[cs/languages/common/build-systems-and-dependency-management]] - the resolver designs Go is reacting against
- [[cs/languages/Python/the-import-system]] - a name resolved at runtime by a search path rather than at build time by a graph
- [[cs/languages/Java/the-module-system]] - modules layered onto an ecosystem that had already chosen coordinates over paths

## Sources

- [Go Modules Reference](https://go.dev/ref/mod) - module and package paths, the go-import meta tag lookup, dotless standard library paths, major version suffixes and the import compatibility rule, the MVS traversal and the absence of a lock file, and go.sum
- [Minimal Version Selection](https://research.swtch.com/vgo-mvs) - the reachability formulation and its cost, the deliberate avoidance of SAT via Schaefer's theorem, the Horn and dual-Horn constraint on future features, and the definition of a high-fidelity build
