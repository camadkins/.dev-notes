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
aliases:
  - Software Engineering
---

Software engineering is where computer science meets craft - the discipline of turning ideas into reliable, maintainable systems. These notes cover the recurring patterns, architectural decisions, testing strategies, and tooling that shape professional software development.

### Design Principles

- [[design-patterns|Design Patterns]]
- [[api-design|API Design]]
- [[solid-principles|SOLID Principles]] - the five principles, what each actually prevents, and the common misreadings
- [[coupling-and-cohesion|Coupling and Cohesion]] - the two forces behind every modularity argument
- [[dependency-injection-and-inversion-of-control|Dependency Injection and IoC]] - what injection actually decouples, and Fowler's own caution about the testability argument

### Architecture & Patterns

- [[software-architecture|Software Architecture]]

### Testing & Quality

- [[testing-strategies|Testing Strategies]]
- [[code-review|Code Review]]
- [[code-coverage-and-its-limits|Code Coverage and Its Limits]] - what coverage measures, and why a coverage target makes a poor goal

### Maintaining a Codebase

- [[refactoring|Refactoring]]
- [[technical-debt|Technical Debt]]

### Version Control

- [[version-control-fundamentals|Version Control Fundamentals]]
- [[monorepo-vs-polyrepo|Monorepo vs Polyrepo]] - what each repository strategy optimizes, and the tooling each demands

### DevOps & Deployment

- [[continuous-integration|Continuous Integration]]
- [[continuous-delivery-and-deployment|Continuous Delivery and Deployment]] - the pipeline past CI, and blue-green against canary
- [[feature-flags-and-trunk-based-development|Feature Flags and Trunk-Based Development]] - decoupling deploy from release, and the debt flags create
- [[semantic-versioning|Semantic Versioning]]
- [[the-twelve-factor-app|The Twelve-Factor App]] - what the twelve factors were written against, and which have aged well

### Running Systems in Production

- [[observability-logging-metrics-tracing|Observability: Logging, Metrics, Tracing]] - the three signals, and how observability differs from monitoring
- [[incident-postmortems-and-blameless-culture|Incident Postmortems and Blameless Culture]] - why blame suppresses the information you need most

More coming - containerization. The language-and-tooling half of this area lives in the [[cs/languages/common/index|Languages: Common Concerns]] cluster: [[cs/languages/common/build-systems-and-dependency-management|build systems and dependency management]] and [[cs/languages/common/declarative-models-and-idempotence|declarative configuration and idempotence]]. This section keeps the pipeline-and-platform half.

---

*The full file listing follows below, generated automatically by Quartz.*
