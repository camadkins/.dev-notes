---
title: Software Engineering
description: Principles and practices for building, testing, deploying, and maintaining software systems at scale.
draft: false
comments: false
tags:
  - cs
  - software-engineering
date: 2026-03-12
updated:
aliases: []
---

Software engineering is where computer science meets craft - the discipline of turning ideas into reliable, maintainable systems. These notes cover the recurring patterns, architectural decisions, testing strategies, and tooling that shape professional software development.

### Design Principles

- [[cs/software-engineering/design-patterns|Design Patterns]]
- [[cs/software-engineering/api-design|API Design]]
- [[cs/software-engineering/solid-principles|SOLID Principles]] - the five principles, what each actually prevents, and the common misreadings
- [[cs/software-engineering/coupling-and-cohesion|Coupling and Cohesion]] - the two forces behind every modularity argument
- [[cs/software-engineering/dependency-injection-and-inversion-of-control|Dependency Injection and IoC]] - what injection actually decouples, and Fowler's own caution about the testability argument

### Architecture & Patterns

- [[cs/software-engineering/software-architecture|Software Architecture]]

### Testing & Quality

- [[cs/software-engineering/testing-strategies|Testing Strategies]]
- [[cs/software-engineering/code-review|Code Review]]
- [[cs/software-engineering/code-coverage-and-its-limits|Code Coverage and Its Limits]] - what coverage measures, and why a coverage target makes a poor goal

### Maintaining a Codebase

- [[cs/software-engineering/refactoring|Refactoring]]
- [[cs/software-engineering/technical-debt|Technical Debt]]

### Version Control

- [[cs/software-engineering/version-control-fundamentals|Version Control Fundamentals]]
- [[cs/software-engineering/monorepo-vs-polyrepo|Monorepo vs Polyrepo]] - what each repository strategy optimizes, and the tooling each demands

### DevOps & Deployment

- [[cs/software-engineering/continuous-integration|Continuous Integration]]
- [[cs/software-engineering/continuous-delivery-and-deployment|Continuous Delivery and Deployment]] - the pipeline past CI, and blue-green against canary
- [[cs/software-engineering/feature-flags-and-trunk-based-development|Feature Flags and Trunk-Based Development]] - decoupling deploy from release, and the debt flags create
- [[cs/software-engineering/semantic-versioning|Semantic Versioning]]
- [[cs/software-engineering/the-twelve-factor-app|The Twelve-Factor App]] - what the twelve factors were written against, and which have aged well

### Running Systems in Production

- [[cs/software-engineering/observability-logging-metrics-tracing|Observability: Logging, Metrics, Tracing]] - the three signals, and how observability differs from monitoring
- [[cs/software-engineering/incident-postmortems-and-blameless-culture|Incident Postmortems and Blameless Culture]] - why blame suppresses the information you need most

More coming - containerization. The language-and-tooling half of this area lives in the [[cs/languages/common/index|Languages: Common Concerns]] cluster: [[cs/languages/common/build-systems-and-dependency-management|build systems and dependency management]] and [[cs/languages/common/declarative-models-and-idempotence|declarative configuration and idempotence]]. This section keeps the pipeline-and-platform half.

---

*The full file listing follows below, generated automatically by Quartz.*
