---
title: Continuous Integration
description: "CI is not a server that runs your tests. It is the practice of everyone pushing to one shared mainline daily, and the confusion between the tool and the practice is why most teams claiming to do it do not."
draft: false
comments: true
tags:
  - cs
  - software-engineering
  - testing
date: 2026-01-28
updated:
aliases:
  - CI
  - CI/CD
---

The failure mode CI was invented against is worth picturing concretely. Fowler opens his article with a memory from a 1980s internship: a warehouse of programmers who had finished writing code a couple of years earlier, "their separate units were now being integrated together, and they had been integrating for several months," and nobody knew how long it would take to finish. The general lesson he drew is the one CI attacks: "integrating the work of multiple developers is a long and unpredictable process."

The unpredictability is the expensive part. Merging can be trivial and then "a subtle integration bug takes days to find and fix." Push all of that to the end and you have "a hard-to-predict phase late in the day," at exactly the moment schedule pressure is highest.

> [!note] The idea
> CI's mechanism is not automation, it is **frequency**. Integration cost grows superlinearly with how long branches diverge, so the fix is to make each integration small enough to be boring. Fowler's definition is a cadence, not a toolchain: every team member "merges their changes into a codebase together with their colleagues changes at least daily," with each integration "verified by an automated build (including test)." The server is an aid. Deleting the server would slow you down; deleting the daily push would end CI.

## The practice, in one rule

Everything follows from the rule that everyone pushes to the mainline every day. Kent Beck's phrasing is tighter: "No code sits unintegrated for more than a couple of hours."

The reason is communication, not tidiness. "Integration allows developers to tell other developers about the changes they have made." When everyone pushes frequently, "a conflict can be detected within a few hours of it occurring, at that point not much has happened and it's easy to resolve. Conflicts that stay undetected for weeks can be very hard to resolve." Wikipedia states the same dynamic from the failure side, where a repository drifts so far from developers' baselines that they hit "merge hell," or "integration hell," and "the time it takes to integrate exceeds the time it took to make their original changes."

Around that rule sit the supporting practices, each of which exists because the rule would otherwise be unsafe:

- **A version-controlled mainline** with every commit built in a reference environment. [[cs/languages/common/build-systems-and-dependency-management|Every push triggers a full build]], and "only once this integration build is green can the developer consider the integration to be complete." Building on every push also localizes blame: a failure means "the fault lies in that latest push."
- **A self-testing build.** Compiling proves the program runs, not that it does the right thing, and "manual testing is too slow to cope with the frequency of change." So a comprehensive suite runs before each integration, and "a programmer's job isn't done merely when the new feature is working, but also when they have automated tests to prove it."
- **Fix broken builds immediately.** Beck's line is "nobody has a higher priority task than fixing the build." The usual remedy is not heroics but reverting: revert the offending commit to restore the last known good state, and debug it elsewhere while the team keeps working.
- **A fast build.** The XP guideline is ten minutes. The argument is arithmetic: "every minute chiseled off the build time is a minute saved for each developer every time they commit," and CI demands frequent commits. Where builds are slow, "the usual bottleneck is testing, particularly tests that involve external services such as a database." The structural fix is a deployment pipeline whose first stage, the commit build, is deliberately fast and takes shortcuts, with slower verification staged behind it.
- **Hidden work in progress.** Integrating daily means shipping code for unfinished features. The preferred technique is a keystone interface, "ensuring the interface that provides a path to the new feature is the last thing we add," so latent code is fully tested but unreachable in production. Feature flags cover the cases keystones cannot.

Wikipedia adds one requirement that is easy to overlook: CI "requires the version control system to [[cs/systems/two-phase-commit-and-distributed-transactions|support atomic commits]]," so a developer's changes land as a single unit rather than a partially-visible sequence.

> [!warning] Running a CI service on feature branches is not CI
> This is the article's central correction, and it names the confusion precisely. Building your feature branch continuously is **semi-integration**: "Full mainline integration requires that developers push their work back into the mainline. If they don't do that, then other team members can't see their work and check for any conflicts."
>
> Fowler's answer to "can we run a CI service on our feature branches?" is "yes, but you're not doing Continuous Integration," and he blames the naming: "The confusion comes from calling these tools Continuous Integration Services, a better term would be something like 'Continuous Build Services'." He goes further, calling CI and feature branching "in general... mutually exclusive approaches." Your green Jenkins dashboard measures whether your branch works. It says nothing about whether the team's work composes.

## Trunk-based development is the same thing renamed

Since "CI" had been diluted into "we run a build server," some practitioners coined **trunk-based development** to recover the original meaning. Fowler's read: "In general I see this as a synonym to Continuous Integration," and attempts to draw a distinction between them are "neither consistent nor compelling." He declines to adopt the newer name partly because renaming "rudely erases the work of those, especially Kent Beck, who championed and developed Continuous Integration in the beginning," while acknowledging that much good material is written under the trunk-based flag.

Where the practice came from depends on who you ask, and the two accounts here disagree in a way worth flagging. Wikipedia records that "Grady Booch first proposed the term CI in 1991," used the phrase in the 1994 second edition of *Object-Oriented Analysis and Design with Applications*, and notes he "did not advocate integrating multiple times a day." Fowler is sharper about the credit: Booch "only used the phrase as an offhand description in a single sentence in his object-oriented design book. He did not treat it as a defined practice, indeed it didn't appear in the index." Both agree on where the practice, as opposed to the phrase, comes from: Kent Beck developed CI as part of Extreme Programming in the 1990s, on the Chrysler Comprehensive Compensation project alongside Ron Jeffries. Wikipedia also names an earlier ancestor, the Infuse environment of Kaiser, Perry, and Schell in 1989, and dates CruiseControl, one of the first open-source CI tools, to 2001.

## CI, CD, and the other CD

The three terms form a chain, and each one is a strictly larger claim than the last.

| Term | What it guarantees |
|---|---|
| **Continuous Integration** | Everyone integrates to the mainline in version control at least daily. |
| **Continuous Delivery** | The product is always in a state where the latest build could be released. |
| **Continuous Deployment** | The product is automatically released to production whenever it passes every check in the pipeline. |

Continuous Delivery emerged because early CI descriptions "focused on the cycle of developer integration with the mainline in the team's development environment" and said little about the path from an integrated mainline to production. In the early 2000s that path was often complicated, so the work of making it reliable became its own named activity. Its aim is stated as an organizational property rather than a technical one: "the release to production is a business decision."

Continuous Deployment is the automation of the last step. Every commit pushed to mainline "will be automatically deployed to production providing all of the verifications in the deployment pipeline are green," which makes Continuous Delivery its prerequisite. Note the asymmetry the popular abbreviation hides: CI/CD usually means delivery, not deployment, and the two differ on whether a human still decides.

> [!tip] The friction that CI and pull requests create for each other
> Pre-integration review sits awkwardly against the daily-push rule. Fowler is blunt about why: instead of an automated check finishing in minutes, "we have to find someone to do the code review, schedule their time, and wait for feedback," which "can easily end up being hours or days, breaking the timing that makes Continuous Integration work." Teams doing both resolve it by moving review off the critical path, through pair programming as continuous real-time review, or by reserving blocking review for cases that need it. Which is to say the CI-versus-review tension is real and gets resolved in the review process, not by weakening the integration cadence.

## Related Notes

- [[cs/software-engineering/version-control-fundamentals|Version Control Fundamentals]] - the mainline, branching models, and the atomic commits CI requires
- [[cs/software-engineering/testing-strategies|Testing Strategies]] - the self-testing build is what makes daily integration safe
- [[cs/software-engineering/code-review|Code Review]] - the practice whose latency CI is most in tension with
- [[cs/software-engineering/refactoring|Refactoring]] - a low-friction integration process is what makes continuous restructuring affordable
- [[cs/software-engineering/technical-debt|Technical Debt]] - painful integration discourages cleanup and lets cruft accumulate
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - the automated build CI triggers on every push

## Sources

- "Continuous Integration," Martin Fowler. https://martinfowler.com/articles/continuousIntegration.html . Supports the definition as daily merges verified by an automated build; the 1980s warehouse anecdote and the unpredictability of late integration; the everyone-pushes-daily rule and Beck's "no code sits unintegrated for more than a couple of hours"; integration as communication and fast conflict detection; every push triggering a build in a reference environment and green-build-means-integrated; self-testing builds and manual testing being too slow; "nobody has a higher priority task than fixing the build" and reverting as the usual fix; the ten-minute build guideline, per-commit time savings, testing as the usual bottleneck, and the commit-build/deployment-pipeline structure; keystone interfaces and feature flags for latent code; semi-integration and the "yes, but you're not doing Continuous Integration" answer on feature branches; CI Services being better named Continuous Build Services; CI and feature branching being generally mutually exclusive; trunk-based development as a synonym and the reason Fowler avoids the name; Booch's offhand single-sentence use; Beck developing CI within Extreme Programming; the CI / Continuous Delivery / Continuous Deployment definitions, release as a business decision, and delivery as a prerequisite for deployment; and the pull-request review friction with CI timing.
- "Continuous integration," Wikipedia. https://en.wikipedia.org/wiki/Continuous_integration . Supports the general definition and per-commit or scheduled automated build; Booch first proposing the term in 1991 and the 1994 second-edition usage without advocating multiple daily integrations; the 1989 Infuse environment of Kaiser, Perry, and Schell; Beck and Jeffries inventing XP including CI in 1997 on the Chrysler Comprehensive Compensation System project; CruiseControl released in 2001; the atomic-commit requirement; and merge hell / integration hell where integration time exceeds the time taken to make the change.
