---
title: Testing Strategies
description: A survey of software testing levels - unit, integration, end-to-end, and property-based - and the test pyramid model for balancing them.
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

Software breaks in predictable layers: a function computes the wrong value, two modules misunderstand each other's contracts, or the whole system fails under a workflow nobody tested. Testing strategies mirror these layers. The goal is not to test everything everywhere, but to **test the right things at the right granularity** so that bugs surface early, cheaply, and with clear diagnostics.

The classic insight is the **test pyramid** - many fast, isolated unit tests at the base; fewer integration tests in the middle; a thin layer of slow, brittle end-to-end tests at the top. Inverting the pyramid (heavy E2E, sparse unit) leads to slow feedback, flaky suites, and debuggability nightmares.

---

## Core Idea

### Unit Tests

Test a single function, method, or class in isolation. Dependencies are replaced with mocks, stubs, or fakes.

- **Fast** - milliseconds per test, thousands per second.
- **Precise** - a failure points to one unit of code.
- **Fragile if over-mocked** - tests that mirror implementation details break on every refactor.

```python
def celsius_to_fahrenheit(c):
    return c * 9 / 5 + 32

def test_freezing_point():
    assert celsius_to_fahrenheit(0) == 32

def test_boiling_point():
    assert celsius_to_fahrenheit(100) == 212
```

### Integration Tests

Test the interaction between two or more components - a service calling a real database, an API handler hitting an actual queue.

- **Catches contract mismatches** that unit tests miss.
- **Slower** - requires setup/teardown of real or containerized dependencies.
- **Key principle:** test the *boundary*, not the internals on either side.

### End-to-End (E2E) Tests

Drive the entire application as a user would - browser automation, full API call chains, deployed environments.

- **High confidence** that the whole system works together.
- **Slow and flaky** - network latency, rendering timing, environment drift.
- **Use sparingly** for critical user journeys only.

### Property-Based Tests

Instead of specifying exact inputs and outputs, describe **invariants** that should hold for all valid inputs. The framework generates hundreds of random cases.

```python
from hypothesis import given, strategies as st

@given(st.floats(allow_nan=False, allow_infinity=False))
def test_roundtrip(c):
    f = celsius_to_fahrenheit(c)
    assert abs(fahrenheit_to_celsius(f) - c) < 1e-9
```

Property-based testing excels at finding edge cases (off-by-one, overflow, empty collections) that example-based tests miss.

### The Test Pyramid

```
        /  E2E  \          Few, slow, high-fidelity
       /----------\
      / Integration \      Moderate count, real boundaries
     /----------------\
    /    Unit Tests     \   Many, fast, isolated
   /____________________\
```

The pyramid is a heuristic, not law. Some domains (data pipelines, UI-heavy apps) need different shapes. But the underlying principle holds: **push verification down to the cheapest level that can catch the bug**.

> [!warning]
> A test suite with no integration tests can pass perfectly while the system fails at every seam. Unit tests prove components work; integration tests prove they work *together*.

---

## Example

A payment service tested at each level:

| Level | What's tested | Example assertion |
|-------|--------------|-------------------|
| **Unit** | `calculate_tax(amount, rate)` | Returns correct decimal for known inputs |
| **Integration** | Payment service + Stripe API (sandbox) | Charge created, returns a valid charge ID |
| **E2E** | User clicks "Pay" in browser → order confirmed | Order status page shows "Paid" |
| **Property** | For all positive amounts and valid rates, tax is non-negative and less than amount | `0 <= tax < amount` |

> [!tip]
> Treat test code as production code. Duplicated setup, unclear assertions, and dead tests erode trust in the suite faster than missing tests do.

---

## Related Notes

- [[design-patterns|Design Patterns]] - patterns like Strategy and Dependency Injection make code more testable
- [[software-architecture|Software Architecture]] - architecture determines where integration boundaries fall
- [[api-design|API Design]] - contract tests validate API promises between services
