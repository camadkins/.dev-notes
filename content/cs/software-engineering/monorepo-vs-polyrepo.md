---
title: Monorepo vs Polyrepo
description: "One repository for many projects, or one repository per project. The choice moves a cost rather than removing it, and each side is only viable with the tooling that makes its worst case survivable."
draft: false
comments: true
tags:
  - cs
  - software-engineering
  - version-control
date: 2026-06-24
updated:
aliases:
  - Monorepo
  - Polyrepo
  - Multi-repo
---

A monorepo is "a software-development strategy in which the code for a number of projects is stored in the same repository." The alternative, splitting each project into its own repository, is the default most teams inherit without ever deciding on it. Neither is new: the monorepo practice "dates back to at least the early 2000s, when it was commonly called a shared codebase."

The first thing to clear away is a confusion of terms. A monorepo is not a monolith. "A related concept is a monolithic application, but whereas a monolith combines its sub-projects into one large project, a monorepo may contain multiple independent and unrelated projects." Repository layout and deployment topology are orthogonal. You can ship fifty independently deployed services from one repository, and you can ship one binary assembled from forty repositories.

> [!note] The idea
> The two strategies do not differ in how much coordination a change across N projects requires. They differ in *when* that coordination happens and *who* is forced to do it. A monorepo pays the cost up front, at commit time, by making the person who breaks a consumer fix it before landing: "developers may change multiple projects atomically." A polyrepo defers the cost to integration time, distributing it across every downstream team as a version-bump chore, which is why "managing compatible versions between dependencies can lead to dependency hell." Whether that trade is good depends entirely on whether you own tooling that can make commit-time coordination cheap, which is the part that is expensive and the part teams skip.

## What the monorepo buys

The advantages Wikipedia lists cluster around one structural fact: everything is visible and current in a single checkout.

Code reuse gets simpler because "similar functionality or communication protocols can be abstracted into shared libraries and directly included by projects, without the need of a dependency package manager." [[cs/languages/common/build-systems-and-dependency-management|Dependency management]] gets simpler for the same reason, since "in a multiple repository environment where multiple projects depend on a third-party dependency, that dependency might be downloaded or built multiple times," whereas "in a monorepo the build can be easily optimized, as referenced dependencies all exist in the same codebase."

The atomic commit is the load-bearing one. "When projects that work together are contained in separate repositories, releases need to sync which versions of one project work with the other," and at scale that version matrix becomes dependency hell. Landing a change across all affected projects in one commit makes the matrix go away.

That property is what enables the fourth advantage, [[refactoring|large-scale refactoring]]: "since developers have access to the full codebase wherein a component is reused, individuals working on a refactor can ensure that every project utilizing a reused component continues to function after the code is restructured." The fifth is social. In a monorepo built on source dependencies, which are "dependencies that are compiled from source," "teams can improve projects being worked on by other teams," which "leads to flexible code ownership."

Google's stated framing for its own repository is this last one generalized. Its "monolithic repository provides a common source of truth for tens of thousands of developers around the world."

## What it costs

The disadvantages are not minor, and two of them are governance rather than engineering.

Versioning gets coarse. "Although not required, some monorepo builds use one version number across all projects in the repository. This leads to a loss of per-project [[semantic-versioning|semantic versioning]]." A repo-wide version number carries almost no information to a consumer.

Access control gets coarse too. "With split repositories, access to a repository can be granted based upon need. By default, a monorepo allows a contributor read access to all software in the project, which violates the principle of least privilege and can lead to security risks like source code leaks and supply-chain attacks." Wikipedia flags that this is not universal: "when Subversion is used, it's possible to download any part of the repo (even a single directory), and path-based authorization can be used to restrict access to certain parts of a repository."

Then the mundane one: "with split repositories, you fetch only the project you are interested in by default. With a monorepo, you check out all projects by default," which "can take up a significant amount of storage space." Partial checkout exists in some systems, but "doing so defeats some of the advantages of a monorepo."

> [!warning] The access-control point is the one that transfers to defense and regulated work
> Least privilege is not a preference in an environment with compartmented code. A polyrepo enforces read boundaries with the repository ACL itself, which is a mechanism auditors already understand. A monorepo has to reproduce that boundary inside the version-control system, and the default posture is open. That is a real reason a shop can be technically right about atomic commits and still be unable to adopt the layout.

## The tooling each demands

Neither strategy is self-supporting past a certain size. The monorepo's bill arrives as scaling work in two places.

Version control first. "As their codebases grew, many companies using existing version control software found that it could not efficiently handle the amount of data required for a large monorepo. Facebook and Microsoft chose to contribute to or fork existing version control software Mercurial and Git respectively, while Google eventually created their own version control system." The Google trajectory is documented in numbers: "for more than ten years, Google had relied on an instance of Perforce's pseudonymous version control software hosted on a single machine. In 2005, Google's build servers could get locked up to 10 minutes at a time," a figure Wikipedia records as improved to a range of 30 seconds to 1 minute by 2010, and "due to scaling issues, Google eventually developed its own in-house distributed version control system dubbed Piper." Facebook "ran into performance issues with the version control system Mercurial and made upstream contributions to the client, and in January 2014 made it faster than a competing solution in Git." Microsoft "announced that virtually all of its Windows engineers use a Git monorepo" in May 2017, having made "substantial upstream contributions to the Git client to remove unnecessary file access and improve handling of large files with Virtual File System for Git."

Build systems second, and this is the constraint that bites earliest. "Few build tools work well in a monorepo, and flows where builds and continuous integration testing of the entire repository are performed upon check-in will cause performance problems." The fix is structural: "a build system that processes dependencies as a directed graph (such as Buck, Bazel, Please, or Pants) solves this by compartmentalizing each build or test to the active area of development." A naive [[continuous-integration|CI]] pipeline that rebuilds the world on every commit turns a monorepo into a queue.

What such a build system has to know is the entire input set of every action. Bazel's own description of the property: it "knows exactly what input files each build command needs, avoiding unnecessary work by re-running only when the set of input files have changed between each build." Correctness follows from the same tracking, since "Bazel actions run in individual sandboxes and Bazel tracks every input file of the build, only and always re-running build commands when it needs to," which "keeps your binaries up-to-date so that the same source code always results in the same binary, bit by bit." Determinism is what makes the cache trustworthy, and the cache is what makes the whole arrangement affordable. Bazel reports that at Google they "routinely achieve cache hit rates north of 99%."

The tooling story explains the pedigree of these tools. "Twitter began development of Pants in 2011, as both Facebook's Buck and Google's Bazel were closed-source at the time," and open-sourced it in 2012 under the Apache 2.0 License. "Please is a Go-based build system; it was developed in 2016 by Thought Machine, whose developers were both inspired by Google's Bazel and dissatisfied with Facebook's Buck." Four companies with monorepos wrote four graph-based build systems, which tells you the monorepo does not work without one.

The polyrepo's bill arrives elsewhere. Its coordination mechanism is package versioning, so it demands a package registry, a release process per project, and the discipline to keep versions meaningful. That is a smaller up-front investment and a larger recurring one, which is exactly why it feels free at the start.

## Scale of the extreme case

Whether any of this generalizes to your team is worth checking against the numbers involved. "Google's monorepo, speculated to be the largest in the world, meets the classification of an ultra-large-scale system and must handle tens of thousands of contributions every day in a repository over 80 terabytes in size." That is the environment the atomic-commit argument was developed in, and the environment the custom VCS and custom build system were built to serve.

Companies that adopt the layout without the tooling get the disadvantages immediately (full checkouts, whole-repo CI, no per-project access control) and the advantages only if their build system already understands the dependency graph. Companies with a handful of projects and one team may get most of the atomic-commit benefit from a monorepo with almost no tooling, because their build fits in a machine. The failure mode is the middle: enough code that naive CI collapses, not enough platform investment to fix it.

> [!tip] The question that actually decides it
> Do changes routinely need to cross project boundaries? If most changes touch one project, the polyrepo's per-repo isolation costs you nothing and buys you access control and independent versioning. If a typical refactor touches nine projects, you are already paying the monorepo's coordination cost, just spread over nine pull requests and a version matrix, and you are paying it without the atomic commit that would have made it safe.

## Related Notes

- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - the graph-based build systems a monorepo requires
- [[version-control-fundamentals|Version Control Fundamentals]] - the VCS scaling limits that forced Piper, VFS for Git, and the Mercurial work
- [[semantic-versioning|Semantic Versioning]] - the per-project versioning a repo-wide version number erases
- [[continuous-integration|Continuous Integration]] - why rebuilding the whole repo on check-in does not scale
- [[refactoring|Refactoring]] - the cross-cutting change the atomic commit is meant to enable
- [[software-architecture|Software Architecture]] - repository layout is not the same decision as deployment topology
- [[cs/languages/common/software-supply-chain-and-provenance|Software Supply Chain and Provenance]] - the access-control and leak risk a shared checkout carries

## Sources

- "Monorepo," Wikipedia. https://en.wikipedia.org/wiki/Monorepo . Supports the definition of a monorepo and its early-2000s "shared codebase" ancestry; the distinction from a monolithic application; the five listed advantages (code reuse without a package manager, simplified dependency management, atomic commits and dependency hell, large-scale refactoring, cross-team collaboration via source dependencies and flexible code ownership); the three listed disadvantages (loss of per-project semantic versioning, lack of per-project access control including the least-privilege and supply-chain risk and the Subversion path-based-authorization exception, and storage cost of full checkouts); the ultra-large-scale classification of Google's repository with tens of thousands of daily contributions and over 80 terabytes; the version-control scaling history for Google (single-machine Perforce, 10-minute lockups in 2005, 30 seconds to 1 minute by 2010, and the creation of Piper), Facebook (Mercurial performance work in January 2014), and Microsoft (May 2017 Windows Git monorepo and VFS for Git); and the build-tooling situation including whole-repo CI performance problems, directed-graph build systems Buck, Bazel, Please and Pants, Pants's 2011 start and 2012 Apache 2.0 release, and Please's 2016 origin at Thought Machine.
- Rachel Potvin and Josh Levenberg, "Why Google Stores Billions of Lines of Code in a Single Repository," Communications of the ACM 59 (2016), pp. 78-87, abstract via Google Research. https://research.google/pubs/why-google-stores-billions-of-lines-of-code-in-a-single-repository/ . Supports the statement that Google's monolithic repository provides a common source of truth for tens of thousands of developers around the world, and the paper's authorship, venue, and year.
- "Why Bazel?," Bazel documentation. https://bazel.build/about/why . Supports the claim that the build tool knows exactly what input files each build command needs and re-runs only when that input set changes; that actions run in individual sandboxes with every input tracked, so the same source code always produces the same binary bit by bit; and Bazel's report of cache hit rates north of 99% at Google.
