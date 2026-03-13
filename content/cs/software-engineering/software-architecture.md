---
title: Software Architecture
description: High-level structural decisions - monoliths vs microservices, layered and hexagonal architectures, and event-driven systems.
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-03-12
updated:
aliases: []
---

## Intuition

Architecture is the set of decisions that are **expensive to change later** - how a system is decomposed into components, how those components communicate, and where the boundaries of responsibility lie. A function name is cheap to rename; whether your system is a monolith or a mesh of services is not.

Good architecture makes the system's intent legible. When you open the source tree, the folder structure should whisper what the system *does*, not just what framework it uses. The patterns below represent recurring answers to the question: "How should we carve up this system?"

---

## Core Idea

### Monolith

A single deployable unit containing all application logic. The codebase is unified, the database is shared, and deployment is atomic.

- **Strengths:** simple to develop, test, and deploy at small scale; no network boundaries between components; straightforward debugging.
- **Weaknesses:** coupling grows silently; scaling requires replicating the entire application; team coordination bottlenecks emerge as the codebase grows.

> [!note]
> A well-structured monolith with clean internal module boundaries is often a better starting point than premature microservices. The "modular monolith" is a legitimate architecture, not a compromise.

### Microservices

The system is decomposed into independently deployable services, each owning its own data and communicating over the network (HTTP, gRPC, messaging).

- **Strengths:** independent scaling and deployment; technology heterogeneity; fault isolation.
- **Weaknesses:** distributed systems complexity (network failures, data consistency, observability); operational overhead; latency at every service boundary.

### Layered (N-Tier) Architecture

Organize code into horizontal layers, each with a single responsibility:

```
┌──────────────────────┐
│   Presentation       │   UI, controllers, API endpoints
├──────────────────────┤
│   Application        │   Use cases, orchestration
├──────────────────────┤
│   Domain             │   Business rules, entities
├──────────────────────┤
│   Infrastructure     │   Database, external services, I/O
└──────────────────────┘
```

Each layer depends only on the layer directly below it. This enforces separation of concerns but can lead to "pass-through" layers that add ceremony without value.

### Hexagonal (Ports & Adapters)

The domain sits at the center, surrounded by **ports** (interfaces the domain exposes or requires) and **adapters** (implementations that connect ports to the outside world).

- **Inbound adapters:** HTTP controllers, CLI handlers, message consumers.
- **Outbound adapters:** database repositories, API clients, file writers.

The key rule: **dependencies point inward**. The domain never imports infrastructure code. This makes the core logic testable without databases, frameworks, or network access.

### Event-Driven Architecture

Components communicate through **events** rather than direct calls. A component publishes a fact ("OrderPlaced"), and interested consumers react independently.

- **Event notification:** lightweight signals that something happened.
- **Event sourcing:** persist every state change as an immutable event; reconstruct current state by replaying the log.
- **CQRS:** separate read models from write models, optimizing each independently.

> [!warning]
> Event-driven systems trade call-stack clarity for temporal decoupling. Debugging requires distributed tracing, and eventual consistency must be explicitly handled.

---

## Example

An e-commerce system under three architectures:

| Architecture | Order placement flow |
|-------------|---------------------|
| **Monolith** | `OrderController` calls `OrderService` calls `InventoryService` calls `PaymentService` - all in-process method calls, single transaction. |
| **Microservices** | Order Service receives HTTP request, sends gRPC to Inventory Service, publishes `PaymentRequested` event to a message broker, Payment Service consumes and confirms. |
| **Hexagonal** | `PlaceOrderUseCase` (application layer) calls `OrderRepository` port and `PaymentGateway` port. In production, adapters connect to Postgres and Stripe. In tests, adapters are in-memory fakes. |

The same business logic, shaped differently by where you draw the boundaries.

> [!tip]
> Start with the simplest architecture that handles your current scale and team size. Extract services at the seams where independent deployment or scaling is actually needed - not where it might theoretically be needed.

---

## Related Notes

- [[design-patterns|Design Patterns]] - class-level patterns that implement architectural decisions
- [[api-design|API Design]] - the contracts between architectural components
- [[testing-strategies|Testing Strategies]] - architecture determines where integration boundaries fall
