---
title: Design Patterns
description: Reusable solutions to recurring object-oriented design problems, organized by the Gang of Four's creational, structural, and behavioral categories.
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

Every experienced developer notices the same problems appearing across unrelated projects - how to create objects without hardcoding classes, how to compose structures flexibly, how to let objects communicate without tight coupling. Design patterns name these recurring situations and provide tested blueprints for resolving them. They are not libraries or frameworks; they are [[cs/standards/iso-iec-ieee-42010-architecture-description|**shared vocabulary** for design decisions]].

The Gang of Four (Gamma, Helm, Johnson, Vlissides) catalogued 23 patterns in 1994, grouped by purpose. The catalog remains influential because the problems it addresses - decoupling creation from use, [[cs/languages/common/dispatch-vtables-fat-pointers-and-dictionaries|composing behavior at runtime]], managing complex interactions - persist regardless of language or era.

---

## Core Idea

### Creational Patterns

Creational patterns abstract the instantiation process, decoupling *what* gets created from *how*.

| Pattern | Intent |
|---------|--------|
| **Factory Method** | Define an interface for creating objects; let subclasses decide the concrete class. |
| **Abstract Factory** | Provide families of related objects without specifying concrete classes. |
| **Builder** | Separate construction of a complex object from its representation. |
| **Prototype** | Create new objects by cloning an existing instance. |
| **Singleton** | Ensure a class has exactly one instance with a global access point. |

### Structural Patterns

Structural patterns deal with composing classes and objects into larger structures while keeping them flexible.

| Pattern | Intent |
|---------|--------|
| **Adapter** | Convert one interface into another that clients expect. |
| **Bridge** | Separate abstraction from implementation so both can vary independently. |
| **Composite** | Treat individual objects and compositions uniformly via a tree structure. |
| **Decorator** | Attach additional responsibilities dynamically, without subclassing. |
| **Facade** | Provide a simplified interface to a complex subsystem. |
| **Proxy** | Control access to an object through a surrogate. |

### Behavioral Patterns

Behavioral patterns manage algorithms, responsibilities, and communication between objects.

| Pattern | Intent |
|---------|--------|
| **Observer** | Define a one-to-many dependency so dependents update automatically. |
| **Strategy** | Encapsulate interchangeable algorithms behind a common interface. |
| **Command** | Encapsulate a request as an object, enabling undo and queuing. |
| **Iterator** | Provide sequential access to elements without exposing internals. |
| **State** | Let an object alter its behavior when its internal state changes. |
| **Template Method** | Define an algorithm skeleton; let subclasses fill in specific steps. |
| **Visitor** | Add operations to object structures without modifying the classes. |

> [!note]
> Patterns are language-agnostic in concept, but some become unnecessary in languages with first-class functions, traits, or algebraic data types. Strategy, for instance, collapses to a function parameter in most functional languages.

---

## Example

The **Observer** pattern in action - a weather station notifying multiple displays:

```python
class WeatherStation:
    def __init__(self):
        self._observers = []
        self._temperature = 0.0

    def attach(self, observer):
        self._observers.append(observer)

    def set_temperature(self, temp):
        self._temperature = temp
        for obs in self._observers:
            obs.update(temp)

class PhoneDisplay:
    def update(self, temp):
        print(f"Phone: {temp}°C")

class WebDashboard:
    def update(self, temp):
        print(f"Dashboard: {temp}°C")

station = WeatherStation()
station.attach(PhoneDisplay())
station.attach(WebDashboard())
station.set_temperature(22.5)
# Phone: 22.5°C
# Dashboard: 22.5°C
```

The station knows nothing about display internals - it only calls `update`. New displays can be added without changing `WeatherStation`. This is the core payoff: **extensibility without modification**.

> [!tip]
> Before reaching for a pattern, ask whether the language already provides the mechanism natively. Python's `@property` eliminates many uses of Proxy; Rust's `enum` with `match` often replaces Visitor.

---

## Related Notes

- [[cs/pl/objects-classes-and-dispatch|Objects, Classes & Dispatch]] - the OOP substrate patterns build on
- [[software-architecture|Software Architecture]] - patterns at the system level rather than class level
- [[api-design|API Design]] - where pattern choices surface as public contracts
