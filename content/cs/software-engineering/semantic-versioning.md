---
title: Semantic Versioning
description: "SemVer turns a version number into a machine-readable compatibility promise: the position that changed tells a dependency resolver whether the upgrade is safe."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-04-22
updated:
aliases:
  - SemVer
  - Semantic Versioning 2.0.0
  - MAJOR.MINOR.PATCH
---

A version number is usually treated as a label. SemVer treats it as a contract. The specification opens on the failure mode it exists to prevent, "[[cs/languages/common/build-systems-and-dependency-management|a dreaded place called dependency hell]]," and names the two ways you get there. Pin your dependencies too tightly and you hit **version lock**, "the inability to upgrade a package without having to release new versions of every dependent package." Pin them too loosely and you hit **version promiscuity**, "assuming compatibility with more future versions than is reasonable." Both come from the same root cause: the version string carried no information a tool could act on.

> [!note] The idea
> SemVer's leverage is not the three-number format, which predates it by decades. It is the rule that **the version number is derived from what changed in a declared public API**, so a resolver can decide an upgrade's safety without reading the diff. "For this system to work, you first need to declare a public API." Without that declaration there is nothing for MAJOR, MINOR, and PATCH to be *about*, and the numbers revert to marketing.

## The three positions

The summary is four lines long. Given `MAJOR.MINOR.PATCH`, increment MAJOR "when you make incompatible API changes," MINOR "when you add functionality in a backward compatible manner," and PATCH "when you make backward compatible bug fixes."

The normative rules sharpen each one. A patch bump is for backward compatible bug fixes only, where "a bug fix is defined as an internal change that fixes incorrect behavior." A minor bump is required for new backward compatible public functionality, and also required "if any public API functionality is marked as deprecated," which is the clause most people miss. Marking something deprecated is itself an API event. A minor bump *may* also be used for substantial internal improvements that never surface publicly.

Two mechanical rules keep the numbers honest. Each element "MUST increase numerically," so `1.9.0` goes to `1.10.0`, not `2.0.0`, and the fields are not decimals. And the lower fields reset: patch resets to 0 on a minor bump, patch and minor both reset to 0 on a major bump.

## Immutability, and version zero

One rule underwrites everything else: "Once a versioned package has been released, the contents of that version MUST NOT be modified. Any modifications MUST be released as a new version." A version identifier that can be re-pointed at different bytes is not an identifier. [[cs/languages/common/software-supply-chain-and-provenance|Every lockfile, every reproducible build, every cached artifact depends on this holding.]]

`0.y.z` is the deliberate escape hatch. "Major version zero (0.y.z) is for initial development. Anything MAY change at any time. The public API SHOULD NOT be considered stable." So a project genuinely churning its interface is not required to burn major versions, it is required to stay in the zero series. The spec's own FAQ closes the loop from the other side: "If your software is being used in production, it should probably already be 1.0.0."

> [!warning]
> `1.0.0` is not a quality claim. Per the spec it is the release that "defines the public API," and every increment after it is measured against that definition. Projects that sit at `0.x` for years while shipping to production have made their version number stop carrying compatibility information, which is exactly the state SemVer exists to fix.

## Pre-release and build metadata

Two optional suffixes hang off the core.

A pre-release is a hyphen plus dot-separated identifiers: `1.0.0-alpha.1`, `1.0.0-rc.1`. Two properties matter. Pre-releases "have a lower precedence than the associated normal version," so `1.0.0-alpha < 1.0.0` and a resolver asking for the latest `1.0.0` will not hand you a release candidate by accident. And the tag is a semantic warning, the version "is unstable and might not satisfy the intended compatibility requirements as denoted by its associated normal version."

Build metadata is a plus sign plus identifiers: `1.0.0+20130313144700`, `1.0.0-beta+exp.sha.5114f85`. The defining rule is that it "MUST be ignored when determining version precedence. Thus two versions that differ only in the build metadata, have the same precedence." That makes it the right place to stamp a commit hash or build number, and the wrong place to encode anything a consumer must distinguish, since by the spec no tool is allowed to tell those two builds apart by ordering.

Precedence itself is defined field by field, left to right. Major, minor, and patch compare numerically. Within pre-release identifiers, all-digit identifiers compare numerically, identifiers with letters or hyphens "[[cs/languages/common/text-encoding-and-unicode|are compared lexically in ASCII sort order]]," numeric identifiers rank below non-numeric ones, and a longer set of fields outranks a shorter one when everything before it is equal.

> [!example] The spec's own ordering chain
> `1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta < 1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1 < 1.0.0`
>
> Read `beta.2 < beta.11` carefully. Those are numeric identifiers, so they compare as integers, not as strings, where `"11"` would sort before `"2"`. And `alpha < alpha.1` because the longer field set wins when the shared prefix is equal.

## What the discipline actually costs

The spec anticipates the standard objection, that requiring a major bump for the tiniest incompatibility drives you to version 42 quickly, and answers with intent rather than mechanism. Incompatible changes "should not be introduced lightly to software that has a lot of dependent code," and having to bump major "means you'll think through the impact of your changes, and evaluate the cost/benefit ratio involved." The friction is the feature.

The deprecation path follows from the same reasoning. Before removing anything in a major release, ship "at least one minor release that contains the deprecation so that users can smoothly transition to the new API." And when you break the rules by accident, the fix is a new corrective release, never an edit, since "it is unacceptable to modify versioned releases."

A last piece of pedantry the spec is explicit about: `v1.2.3` is not a semantic version. The `v` is a conventional prefix, common on git tags, and the semantic version is the `1.2.3` inside it.

> [!tip]
> SemVer only ever encodes what the author *believed* about compatibility. It is a declaration, not a proof. Nothing in the format verifies that a minor release is actually backward compatible, which is why the spec tells you to verify upgrades yourself: "The real world is a messy place; there's nothing we can do about that but be vigilant."

## Related Notes

- [[api-design|API Design]] - the declared public API is the surface SemVer's numbers are measured against
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - resolvers and lockfiles are what consume the version contract
- [[version-control-fundamentals|Version Control Fundamentals]] - tags are where versions are stamped into history
- [[continuous-integration|Continuous Integration]] - the pipeline that decides a release is fit to be numbered
- [[software-architecture|Software Architecture]] - module boundaries determine how much surface each version has to promise about

## Sources

- "Semantic Versioning 2.0.0," semver.org. https://semver.org/ . Supports the MAJOR/MINOR/PATCH summary rules; dependency hell, version lock, and version promiscuity; the requirement to declare a public API; the normative rules on patch, minor (including the deprecation clause), and major increments, numeric-increase and field-reset behavior; release immutability; the 0.y.z initial-development clause and 1.0.0 defining the public API; pre-release and build-metadata syntax and their precedence rules; the full precedence ordering example; the FAQ answers on when to release 1.0.0, the major-version-bump objection, deprecation, correcting a spec violation, and "v1.2.3" not being a semantic version; and the note that the real world is messy and upgrades should still be verified.
