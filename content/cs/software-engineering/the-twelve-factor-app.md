---
title: The Twelve-Factor App
description: "Twelve constraints written to make a web app deployable on someone else's platform. Most of them are really one idea repeated: push every environment-specific decision out of the artifact."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-04-16
updated:
aliases:
  - Twelve-Factor App
  - 12 Factor
  - Twelve Factors
---

The twelve-factor app is "a methodology for building software-as-a-service apps," written by Adam Wiggins and last updated in 2017. Its opening premise dates it precisely: "in the modern era, software is commonly delivered as a service: called web apps, or software-as-a-service." That sentence is doing the work of a scope statement. The document is not general software engineering advice, it is advice for one deployment shape, and reading it as universal is the most common way to misapply it.

The stated goals give the shape away. A twelve-factor app should "[[cs/languages/common/declarative-models-and-idempotence|use declarative formats for setup automation]], to minimize time and cost for new developers joining the project"; "have a clean contract with the underlying operating system, [[cs/languages/common/portability-and-cross-compilation|offering maximum portability between execution environments]]"; be "suitable for deployment on modern cloud platforms, obviating the need for servers and systems administration"; "minimize divergence between development and production, enabling continuous deployment for maximum agility"; and "scale up without significant changes to tooling, architecture, or development practices."

> [!note] The idea
> Nine of the twelve are the same constraint stated about different resources: nothing environment-specific may live inside the deployable artifact. Config leaves ("store config in the environment"), the database leaves ("treat backing services as attached resources"), the web server leaves ("export services via port binding"), state leaves ("execute the app as one or more stateless processes"), log routing leaves ("treat logs as event streams"). What remains is a process that reads its environment, does work, and can be killed. The reason that shape is worth the discipline is not elegance, it is that a process with no environment-specific insides is *interchangeable*, which is the precondition for both horizontal scaling and continuous deployment. The methodology's real subject is portability across execution environments, and everything else follows.

## The twelve, as stated

| # | Factor | Statement |
|---|---|---|
| I | Codebase | "One codebase tracked in revision control, many deploys" |
| II | Dependencies | "Explicitly declare and isolate dependencies" |
| III | Config | "Store config in the environment" |
| IV | Backing services | "Treat backing services as attached resources" |
| V | Build, release, run | "Strictly separate build and run stages" |
| VI | Processes | "Execute the app as one or more stateless processes" |
| VII | Port binding | "Export services via port binding" |
| VIII | Concurrency | "Scale out via the process model" |
| IX | Disposability | "Maximize robustness with fast startup and graceful shutdown" |
| X | Dev/prod parity | "Keep development, staging, and production as similar as possible" |
| XI | Logs | "Treat logs as event streams" |
| XII | Admin processes | "Run admin/management tasks as one-off processes" |

The methodology claims language independence: it "can be applied to apps written in any programming language, and which use any combination of backing services (database, queue, memory cache, etc)." Its audience is stated as "any developer building applications which run as a service. Ops engineers who deploy or manage such applications."

## The problem it was written against

The document is explicit about its provenance, and the provenance explains the emphasis. "The contributors to this document have been directly involved in the development and deployment of hundreds of apps, and indirectly witnessed the development, operation, and scaling of hundreds of thousands of apps via our work on the Heroku platform." The twelve factors are, structurally, the list of things an app must do to be hostable by a platform that knows nothing about it.

The failure mode they were written to prevent is named. The document "is a triangulation on ideal practices for app development, paying particular attention to the dynamics of the organic growth of an app over time, the dynamics of collaboration between developers working on the app's codebase, and avoiding the cost of software erosion." Its aim was "to raise awareness of some systemic problems we've seen in modern application development, to provide a shared vocabulary for discussing those problems, and to offer a set of broad conceptual solutions to those problems with accompanying terminology." The format credit goes to "Martin Fowler's books *Patterns of Enterprise Application Architecture* and *Refactoring*," which is why it reads as a pattern catalog rather than a specification.

Shared vocabulary is worth pausing on. Half the value of the document was terminological. "Backing service," "deploy" as a noun, "one-off process," and "dev/prod parity" all became words teams could argue in, which is the same function [[cs/software-engineering/design-patterns|design patterns]] served a decade earlier.

## Factor III, and the litmus test that still works

Config is the factor most often quoted and most often reduced to "use environment variables," which loses the argument. The document defines config as "everything that is likely to vary between deploys (staging, production, developer environments, etc)," listing "resource handles to the database, Memcached, and other backing services," "[[cs/languages/Ansible/vault-and-secret-management|credentials to external services such as Amazon S3 or Twitter]]," and "per-deploy values such as the canonical hostname for the deploy." The boundary is drawn by rate of change: "config varies substantially across deploys, code does not."

It then explicitly excludes internal wiring: "this definition of 'config' does not include internal application config, such as `config/routes.rb` in Rails, or how code modules are connected in Spring. This type of config does not vary between deploys, and so is best done in the code." That exclusion is the part most readers drop, and dropping it produces applications where every structural decision has been dragged out into environment variables for no reason.

> [!tip] The litmus test
> "A litmus test for whether an app has all config correctly factored out of the code is whether the codebase could be made open source at any moment, without compromising any credentials."
>
> This has aged better than the mechanism it was proposing. It converts an architectural question into a leak question, it is checkable by a person in a minute, and it is exactly the check a repository scanner automates. The specific answer ("env vars") is arguable and has been argued about since; the test survives whatever storage mechanism you end up choosing.

The reasoning for environment variables is comparative rather than absolute. Uncommitted config files "are a huge improvement over using constants which are checked into the code repo, but still have weaknesses: it's easy to mistakenly check in a config file to the repo; there is a tendency for config files to be scattered about in different places and different formats, making it hard to see and manage all the config in one place. Further, these formats tend to be language- or framework-specific." Env vars win on three properties: they "are easy to change between deploys without changing any code," "there is little chance of them being checked into the code repo accidentally," and "unlike custom config files, or other config mechanisms such as Java System Properties, they are a language- and OS-agnostic standard."

The subtler prescription in this factor is about *grouping*, and it is the one almost universally ignored. Batching config into named environments "does not scale cleanly: as more deploys of the app are created, new environment names are necessary, such as staging or qa. As the project grows further, developers may add their own special environments like joes-staging, resulting in a combinatorial explosion of config which makes managing deploys of the app very brittle." The prescribed alternative: "in a twelve-factor app, env vars are granular controls, each fully orthogonal to other env vars. They are never grouped together as 'environments', but instead are independently managed for each deploy."

The document itself names the convention it is arguing against, "the development, test, and production environments in Rails," which is the convention most frameworks still ship. This is the factor with the widest gap between what the text prescribes and what the ecosystem does.

## Factor X, and what dating a document looks like

Dev/prod parity is the clearest case of an argument that aged well carried by examples that did not. It names three gaps: "the time gap: A developer may work on code that takes days, weeks, or even months to go into production"; "the personnel gap: Developers write code, ops engineers deploy it"; and "the tools gap: Developers may be using a stack like Nginx, SQLite, and OS X, while the production deploy uses Apache, MySQL, and Linux." The prescription closes each: deploy in "hours or even just minutes," have "developers who wrote code ... closely involved in deploying it and watching its behavior in production," and "keep development and production as similar as possible."

The personnel-gap prescription is an organizational claim smuggled into a technical document, and it arrives as a one-line consequence of wanting continuous deployment rather than as an argument in its own right. The document's own summary table puts traditional apps at weeks between deploys with "different people" authoring and deploying, against hours and "same people" for a twelve-factor app.

The technical core is a warning against convenient substitutions. "The twelve-factor developer resists the urge to use different backing services between development and production, even when adapters theoretically abstract away any differences in backing services. Differences between backing services mean that tiny incompatibilities crop up, causing code that worked and passed tests in development or staging to fail in production." The economic argument is that the resulting friction "disincentivizes continuous deployment," and "the cost of this friction and the subsequent dampening of continuous deployment is extremely high when considered in aggregate over the lifetime of an application." Adapters keep a narrower role: they "are still useful, because they make porting to new backing services relatively painless. But all deploys of the app (developer environments, staging, production) should be using the same type and version of each of the backing services."

> [!warning] Read the tooling names as a timestamp
> The same chapter argues that "lightweight local services are less compelling than they once were," because "modern backing services such as Memcached, PostgreSQL, and RabbitMQ are not difficult to install and run thanks to modern packaging systems, such as Homebrew and apt-get," and because "declarative provisioning tools such as Chef and Puppet combined with light-weight virtual environments such as Docker and Vagrant allow developers to run local environments which closely approximate production environments." Chef, Puppet, and Vagrant sat at the center of that sentence when it was written. The claim they support, that reproducing production locally is cheap enough to be mandatory, got more true, not less. That split is the general pattern in this document: the constraints held, the named tools rotated.

## What held and what did not

The factors that describe a boundary rather than a mechanism have aged best, because a boundary survives a change of implementation. "Treat backing services as attached resources" says nothing about which database or which broker. "Execute the app as one or more stateless processes" and "scale out via the process model" name a scaling model without naming a scheduler. "Maximize robustness with fast startup and graceful shutdown" is a statement of what a process must tolerate having done to it, which is the interesting property whether the thing doing it is a platform or an orchestrator. "Strictly separate build and run stages" describes the stage split a [[cs/software-engineering/continuous-delivery-and-deployment|delivery pipeline]] is built around. "Treat logs as event streams" pushes routing and storage out of the app, which is the same boundary an [[cs/software-engineering/observability-logging-metrics-tracing|observability]] pipeline draws.

The factors that named a mechanism have travelled less well, and the config chapter shows why: its case for environment variables is comparative, resting on properties (hard to commit by accident, language- and OS-agnostic) that a different storage mechanism could also claim, while the litmus test it offers alongside is independent of any mechanism at all. Read that chapter closely and you get two artifacts of very different durability sitting in the same section. The refusal to group config into named environments is the other mechanism-level prescription, and it is the one the document argues hardest for and the ecosystem adopted least.

The summary that follows from the document's own framing is that the twelve factors are constraints for making an artifact hostable by a platform that knows nothing about it, which is what "a clean contract with the underlying operating system, offering maximum portability between execution environments" means. Where that is still the arrangement, the constraints apply almost unchanged. Where it is not, several of them are answering a question nobody asked.

## Related Notes

- [[cs/software-engineering/continuous-delivery-and-deployment|Continuous Delivery and Deployment]] - the practice dev/prod parity and build/release/run separation exist to enable
- [[cs/software-engineering/observability-logging-metrics-tracing|Observability: Logging, Metrics, and Tracing]] - what "treat logs as event streams" became
- [[cs/languages/common/build-systems-and-dependency-management|Build Systems and Dependency Management]] - factor II, explicit declaration and isolation of dependencies
- [[cs/software-engineering/software-architecture|Software Architecture]] - the factors are constraints on deployment shape, not on internal design
- [[cs/software-engineering/design-patterns|Design Patterns]] - the pattern-catalog format the document borrows from Fowler
- [[cs/software-engineering/feature-flags-and-trunk-based-development|Feature Flags and Trunk-Based Development]] - the other half of separating deploy from release
- [[cs/systems/virtualization-vms-and-containers|Virtualization, VMs, and Containers]] - the execution environment that generalized the platform this was written for

## Sources

- "The Twelve-Factor App," Adam Wiggins, last updated 2017. https://12factor.net/ . Supports the description of the twelve-factor app as a methodology for building software-as-a-service apps and its software-as-a-service framing; the five stated goals (declarative setup automation, clean OS contract and portability, suitability for modern cloud platforms, minimized dev/production divergence for continuous deployment, and scaling without tooling or architecture changes); applicability to any language and any combination of backing services; the stated audience; the names and one-line statements of all twelve factors; the background claim of direct involvement in hundreds of apps and indirect observation of hundreds of thousands via Heroku; the triangulation framing including organic growth, developer collaboration, and avoiding software erosion; the motivation of raising awareness, providing shared vocabulary, and offering conceptual solutions; and the credit of the format to Martin Fowler's *Patterns of Enterprise Application Architecture* and *Refactoring*.
- "III. Config," The Twelve-Factor App. https://12factor.net/config . Supports the definition of config as everything likely to vary between deploys and its three listed examples; the requirement of strict separation of config from code and the rate-of-change justification; the open-source litmus test; the explicit exclusion of internal application config such as Rails routes and Spring module wiring; the critique of uncommitted config files; the three stated advantages of environment variables over config files and Java System Properties; the critique of grouping config into named environments and the joes-staging combinatorial-explosion argument; and the prescription that env vars be granular, orthogonal, and never grouped as environments.
- "X. Dev/prod parity," The Twelve-Factor App. https://12factor.net/dev-prod-parity . Supports the three gaps (time, personnel, tools) with their stated examples; the three corresponding prescriptions and the traditional-versus-twelve-factor summary table values; the argument against using different backing services in development and production, including tiny incompatibilities causing production failures and the aggregate cost of dampened continuous deployment; the continued usefulness of adapters for porting alongside the requirement that all deploys use the same type and version of each backing service; and the claim that lightweight local services are less compelling than they once were given Homebrew and apt-get, Chef and Puppet, and Docker and Vagrant.
