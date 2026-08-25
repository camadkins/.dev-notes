---
title: Dependency Injection and Inversion of Control
description: "An object that builds its own collaborators has hard-coded a decision that belongs to whoever assembles the program. Injection moves that decision out, and the famous testability argument is the weakest reason to do it."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-03-11
updated:
aliases:
  - Dependency Injection
  - Inversion of Control
  - Constructor Injection
---

Dependency injection is "a programming technique in which an object or function receives other objects or functions that it requires, as opposed to creating them internally." That is the whole mechanism. A class that writes `new PostgresUserStore()` inside itself has answered a question ("which store?") that it was never in a position to answer, because the right answer depends on the deployment, and the class does not know which deployment it is in. Injection takes the answer away from the class and gives it to an external assembler.

The term arrived because an older one had gone soft. Martin Fowler, writing in January 2004 about the wave of Java lightweight containers, complained that when they "talk about how they are so useful because they implement 'Inversion of Control' I end up very puzzled. Inversion of control is a common characteristic of frameworks, so saying that these lightweight containers are special because they use inversion of control is like saying my car is special because it has wheels." His fix was to ask "what aspect of control are they inverting?" and then name the specific answer: "Inversion of Control is too generic a term, and thus people find it confusing. As a result with a lot of discussion with various IoC advocates we settled on the name Dependency Injection."

> [!note] The idea
> Injection is a relocation of an *authority*, not a reduction in coupling per se. Something still decides that this interface is served by that class; injection only moves the decision to a module whose job is deciding. The reason this matters is scoping: Fowler's conclusion is that "the choice between Service Locator and Dependency Injection is less important than the principle of separating service configuration from the use of services within an application." The testability argument, which is the one everyone reaches for first, does not actually distinguish injection from its main alternative, and treating it as the justification produces codebases full of single-implementation interfaces that separate nothing.

## Two senses of "inversion of control"

The original sense is about control *flow*. Inversion of control is "a design principle in which custom-written portions of a computer program receive the flow of control from an external source (e.g. a framework)." [[cs/pl/programming-paradigms-models-of-computation|In procedural programming]] "a program's custom code calls reusable libraries to take care of generic tasks, but with inversion of control, it is the external code or framework that is in control and calls the custom code." Fowler's own first encounter was exactly this: early user interfaces were driven by the application program, which issued a sequence of prompts, and then "with graphical (or even screen based) UIs [[cs/history/xerox-parc-and-the-gui|the UI framework would contain this main loop]] and your program instead provided event handlers for the various fields on the screen." The slogan for it is the "Hollywood Principle: Don't call us, we'll call you." The etymology of the phrase "has been traced back to 1988."

The second sense is the Java-container one, and it is narrower. The phrase "has separately also come to be used in the community of Java programmers to refer specifically to the patterns of dependency injection (passing services to objects that need them) that occur with 'IoC containers' in Java frameworks such as the Spring Framework," where it means "granting the framework control over the implementations of dependencies that are used by application objects" rather than granting the framework control flow. Frameworks routinely do both at once: "the framework first constructs an object (such as a controller), and then passes control flow to it," and with injection it also "instantiates the dependencies declared by the application object (often in the constructor method's parameters), and passes the dependencies into the object."

Confusing the two senses is why people describe a plain constructor parameter as advanced architecture. Passing an argument is not inverting anything on its own. The inversion is in who calls the constructor.

## The four roles

The pattern names four participants: "services, clients, interfaces, and injectors." A service is "any class which contains useful functionality"; a client is "any class which uses services"; and the same object can be both, since "the names relate only to the role the objects play in an injection." The interface is what keeps the client honest, because "clients should not know how their dependencies are implemented, only their names and API." The example given is an email-retrieval service that "may use the IMAP or POP3 protocols behind the scenes, but this detail is likely irrelevant to calling code that merely wants an email retrieved."

The fourth role is the one that does the work. "The injector, sometimes also called an assembler, container, provider or factory, introduces services to the client," and its job is "[[cs/dsa/topological-sorting|to construct and connect complex object graphs]], where objects may be both clients and services." There is one structural constraint on it: the injector "must not be the client, as this would create a circular dependency." A side effect worth noticing is that injection "often diminishes the importance of the `new` keyword found in most object-oriented languages," leaving the programmer directly constructing mostly value objects that represent domain entities.

## Forms, and why constructor injection is the default

Fowler identifies "three main styles of dependency injection," which he names "Constructor Injection, Setter Injection, and Interface Injection," noting they were then circulating as type 1, type 2, and type 3 IoC respectively, "numeric names" he found "rather hard to remember." Later catalogues add method injection, "where dependencies are provided to a method only when required for specific functionality."

His preference for constructors is an object-lifecycle argument that has nothing to do with containers. "My long running default with objects is as much as possible, to create valid objects at construction time," because "constructors with parameters give you a clear statement of what it means to create a valid object in an obvious place." The second reason is immutability: constructor initialization "allows you to clearly hide any fields that are immutable by simply not providing a setter," and "if something shouldn't change then the lack of a setter communicates this very well."

The counterpressures are real and he lists them. Long parameter lists get messy, "particularly in languages without keyword parameters," though "a long constructor is often a sign of an over-busy object that should be split." Simple string parameters read badly, since "with constructors you are just relying on the position, which is harder to follow," where a setter carries a name. Multiple constructors plus inheritance "can lead to an even bigger explosion of constructors." His landing point: "start with constructor injection, but be ready to switch to setter injection as soon as the problems I've outlined above start to become a problem."

## The testability argument, examined

The standard pitch is that injection makes a class testable because you can substitute a stub. That much is true and widely reported: injection "can be applied to legacy code as a refactoring," which "makes clients more independent and are easier to unit test in isolation, using stubs or mock objects, that simulate other objects not under test," and "this ease of testing is often the first benefit noticed when using dependency injection."

Fowler's response is that the benefit is real but does not belong to injection. "A common reason people give for preferring dependency injection is that it makes testing easier. The point here is that to do testing, you need to easily replace real service implementations with stubs or mocks. However there is really no difference here between dependency injection and service locator: both are very amenable to stubbing. I suspect this observation comes from projects where people don't make the effort to ensure that their service locator can be easily substituted." The diagnostic he draws from it is more useful than the pattern advice: "if you can't easily stub services for testing, then this implies a serious problem with your design."

So testability is evidence that *something* decoupled the client from the concrete service. It is not evidence that injection is the right mechanism. The real discriminator Fowler gives is ownership of the lookup. "The key difference is that with a Service Locator every user of a service has a dependency to the locator," and if you are shipping a class into applications you do not control, that assumption breaks, because "each customer might have their own incompatible service locators." Injection wins there. Inside a single application he is blunter: inversion of control "tends to be hard to understand and leads to problems when you are trying to debug. So on the whole I prefer to avoid it unless I need it."

> [!warning] The costs are documented, not hypothetical
> Injection "creates clients that demand configuration details, which can be onerous when obvious defaults are available," "makes code difficult to trace because it separates behavior from construction," "is typically implemented with reflection or dynamic programming, hindering IDE automation," "typically requires more upfront development effort," and "encourages dependence on a framework." Every one of those is the price of moving the decision out of the class. A codebase that pays them for interfaces with exactly one implementation, which is the common outcome when testability is the stated goal, has bought the costs without the option.

## What it actually decouples

The advantage that survives scrutiny is legibility of the dependency graph. "Using dependency injection can help make it easier to see what the component dependencies are. With dependency injector you can just look at the injection mechanism, such as the constructor, and see the dependencies. With the service locator you have to search the source code for calls to the locator." A constructor signature is a machine-readable statement of everything a class needs. That is a documentation property, and it holds whether or not a container is present.

Underneath sits the principle Fowler puts above the pattern choice: "the important issue in all of this is to ensure that the configuration of services is separated from their use. Indeed this is a fundamental design principle that sits with the separation of interfaces from implementation." Injection is one implementation of that separation, which is why the technique is usually described as a way "to keep code in-line with the [[cs/software-engineering/solid-principles|dependency inversion principle]]" and as aiming "to separate the concerns of constructing objects and using them, leading to [[cs/software-engineering/coupling-and-cohesion|loosely coupled]] programs."

> [!tip] The test to apply
> Before adding an interface and a constructor parameter, ask what second implementation the decision is for, and who chooses between them. If the answer is "the test suite, and only the test suite," you have discovered that your design was already stubbable and you are buying framework dependence to prove it. If the answer names a deployment, a customer, or a plugin author, the injection is doing its job.

## Related Notes

- [[cs/software-engineering/solid-principles|SOLID Principles]] - the D is the principle injection is usually deployed to satisfy
- [[cs/software-engineering/coupling-and-cohesion|Coupling and Cohesion]] - the property injection claims to improve, and the one to measure it against
- [[cs/software-engineering/design-patterns|Design Patterns]] - service locator and factory are the alternatives Fowler weighs injection against
- [[cs/software-engineering/testing-strategies|Testing Strategies]] - stubs and mocks are the substitution this note argues is not injection-specific
- [[cs/software-engineering/software-architecture|Software Architecture]] - deciding which side of a boundary the abstraction sits on is an architectural call
- [[cs/pl/objects-classes-and-dispatch|Objects, Classes, and Dispatch]] - the runtime dispatch that makes a swapped implementation work
- [[cs/pl/modules-signatures-and-separate-compilation|Modules, Signatures, and Separate Compilation]] - the same separation expressed in a module system instead of a container

## Sources

- Martin Fowler, "Inversion of Control Containers and the Dependency Injection pattern," 23 January 2004. https://martinfowler.com/articles/injection.html . Supports the lightweight-container context and the "car is special because it has wheels" complaint; the "what aspect of control are they inverting?" question; the early-UI versus event-handler example of inverted control flow; the naming of Dependency Injection after IoC proved too generic; the three main styles and the type 1/2/3 numbering; the constructor-versus-setter argument including valid-objects-at-construction, immutability, long parameter lists, positional string parameters, and constructor explosion under inheritance; the recommendation to start with constructor injection; the rebuttal that testability does not distinguish injection from service locator and the stubbing-difficulty design diagnostic; the service-locator dependency and incompatible-customer-locator argument; the "hard to understand and leads to problems when you are trying to debug" cost; the visibility-of-dependencies advantage; and the separating-configuration-from-use conclusion.
- "Dependency injection," Wikipedia. https://en.wikipedia.org/wiki/Dependency_injection . Supports the definition of the technique and its aim of separating construction from use toward loose coupling; the link to the dependency inversion principle; framework construction plus dependency instantiation; the four roles of services, clients, interfaces, and injectors; the IMAP/POP3 interface example; the injector's aliases, its object-graph job, and the circular-dependency constraint; the diminished role of `new`; the list of injection types including method injection; the unit-testing benefits including refactoring legacy code and first-noticed ease of testing; and the enumerated disadvantages.
- "Inversion of control," Wikipedia. https://en.wikipedia.org/wiki/Inversion_of_control . Supports the control-flow definition of IoC and its contrast with procedural programming; the Hollywood Principle slogan; the 1988 etymology; and the separate Java-community usage of the term for dependency injection in IoC containers such as the Spring Framework.
