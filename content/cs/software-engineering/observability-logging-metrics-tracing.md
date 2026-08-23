---
title: Observability, Logging, Metrics, and Tracing
description: "Monitoring answers questions you thought to ask in advance. Observability is the property of a system that lets you ask new ones, and the difference shows up the day something breaks in a way nobody predicted."
draft: false
comments: true
tags:
  - cs
  - software-engineering
  - distributed-systems
date: 2026-06-24
updated:
aliases:
  - Observability
  - Three Pillars
  - Distributed Tracing
  - Four Golden Signals
  - Structured Logging
---

The two words get used interchangeably and their definitions do not overlap. Google's SRE book defines monitoring as "collecting, processing, aggregating, and displaying real-time quantitative data about a system, such as query counts and types, error counts and types, processing times, and server lifetimes." That is a description of a pipeline, and it presumes you already decided what to collect.

OpenTelemetry defines observability differently, as a property of the system rather than a thing you run: it "lets you understand a system from the outside by letting you ask questions about that system without knowing its inner workings." Then the phrase that carries the whole distinction: it "allows you to easily troubleshoot and handle novel problems, that is, 'unknown unknowns'."

> [!note] The idea
> A monitoring system is a set of answers to questions someone anticipated. An observable system is one where you can pose a question nobody anticipated and get an answer without shipping code. The operational test OpenTelemetry gives is exactly that: "an application is properly instrumented when developers don't need to add more instrumentation to troubleshoot an issue, because they have all of the information they need." Notice this is not a claim about volume. You can emit terabytes of logs and still fail the test if the field you need was never attached to the record. Observability is about the *dimensionality* of what you emit, and about whether the pieces can be correlated after the fact.

## The three signals

OpenTelemetry names traces, metrics, and logs as the signals an application must emit to be observable, defining telemetry as "data emitted from a system and its behavior." They answer different questions and degrade differently.

**Metrics** are "aggregations over a period of time of numeric data about your infrastructure or application," with system error rate, CPU utilization, and per-service request rate as examples. Aggregation is both the strength and the limit: it is cheap and long-retainable because the individual events are gone, which also means metrics can tell you *that* something changed but rarely *which request*.

**Logs** are the oldest and the loosest. [[cs/security/siem-and-security-logging|A log is "a timestamped message emitted by services or other components,"]] and the crucial contrast is that "unlike traces, they aren't necessarily associated with any particular user request or transaction." The primer is blunt about the consequence: logs "aren't enough for tracking code execution, as they usually lack contextual information, such as where they were called from." A raw line like `I, [2021-02-23T13:26:23.505892 #22473] INFO -- : [6459ffe1-...] Started GET "/" for ::1` is a fact with no neighbors. Logs "become far more useful when they are included as part of a span, or when they are correlated with a trace and a span."

That is the real argument for structured logging, and it is a correlation argument before it is a parsing argument. Emitting key-value fields rather than a prose sentence is what lets a log line carry the trace and span identifiers that stitch it into a request. Unstructured logs force you to reconstruct context with regular expressions after the fact. Structured logs carry it.

**Traces** supply the context the other two lack.

## Distributed tracing: spans, traces, and why local debugging fails

Distributed tracing "[[cs/systems/logical-clocks-lamport-and-vector|lets you observe requests as they propagate through complex, distributed systems]]," and OpenTelemetry frames its necessity in terms of reproducibility rather than visibility. It "lets you debug behavior that is difficult to reproduce locally," and it "is essential for distributed systems, which commonly have nondeterministic problems or are too complicated to reproduce locally." That is the honest case for tracing. In a monolith you attach a debugger. Across twelve services under production load you cannot, and the bug frequently does not exist anywhere except in the interaction.

A **span** "represents a single unit of work or operation," tracking "specific operations that a request makes, painting a picture of what happened during the time in which that operation was executed." It carries a name, time-related data, structured log messages, and attributes. Those attributes are where the observability actually lives, since they are the dimensions you can later slice on: `http.request.method` of `"GET"`, `url.path` of `"/webshop/articles/4"`, `http.response.status_code` of `200`, `server.address`, `client.address`, `user_agent.original`, and `http.route` as `"/webshop/articles/:article_id"`. The last pair matters more than it looks. Keeping the templated route alongside the concrete path is what makes aggregation possible without losing the specific request.

A **trace**, formally a distributed trace, "records the path taken by a single request (made by an application or end user) as it propagates through multiple services in an architecture." It "is made of one or more spans," where "the first span represents the root span" covering the request start to finish, and the spans underneath give "a more in-depth context of what occurs during a request." Loading a web page might pass through an API gateway, a backend service, and a database, each a span, together forming one trace of the end-to-end journey. Backends usually render this as a waterfall showing "the parent-child relationship between a root span and its child spans."

Reliability is the property all this serves, and OpenTelemetry defines it in user terms: "Is the service doing what users expect it to be doing?" The example is precise about why uptime is the wrong metric. "A system could be up 100% of the time, but if, when a user clicks 'Add to Cart' to add a black pair of shoes to their shopping cart, the system doesn't always add black shoes, then the system could be unreliable." An SLI "represents a measurement of a service's behavior," and "a good SLI measures your service from the perspective of your users." An SLO attaches one or more SLIs to business value, and is "the means by which reliability is communicated to an organization/other teams."

## What to measure: the four golden signals

Google's answer to instrumentation paralysis is a short list. "The four golden signals of monitoring are latency, traffic, errors, and saturation. If you can only measure four metrics of your user-facing system, focus on these four."

- **Latency**, "the time it takes to service a request." The subtlety is that failures distort it in both directions. An HTTP 500 from a dead database "might be served very quickly," so folding 500s into overall latency "might result in misleading calculations." But you cannot simply drop them either, because "a slow error is even worse than a fast error." Track successful and failed latency separately.
- **Traffic**, "a measure of how much demand is being placed on your system, measured in a high-level system-specific metric." Requests per second for a web service, network I/O rate or concurrent sessions for audio streaming, transactions and retrievals per second for a key-value store.
- **Errors**, "the rate of requests that fail, either explicitly (e.g., HTTP 500s), implicitly (for example, an HTTP 200 success response, but coupled with the wrong content), or by policy." The policy case is worth reading twice: "if you committed to one-second response times, any request over one second is an error." Detection cost varies enormously across those three. "[[cs/networking/load-balancing-l4-and-l7|Catching HTTP 500s at your load balancer]] can do a decent job of catching all completely failed requests, while only end-to-end system tests can detect that you're serving the wrong content."
- **Saturation**, "how 'full' your service is," emphasizing whichever resource is most constrained. "Many systems degrade in performance before they achieve 100% utilization, so having a utilization target is essential." Latency increases "are often a leading indicator of saturation," and measuring the 99th percentile over a one-minute window "can give a very early signal." Saturation also covers prediction, as in "it looks like your database will fill its hard drive in 4 hours."

> [!warning] Averages hide exactly the requests you care about
> "If you run a web service with an average latency of 100 ms at 1,000 requests per second, 1% of requests might easily take 5 seconds." That would be tolerable if requests were independent, and in a service architecture they are not: "if your users depend on several such web services to render their page, the 99th percentile of one backend can easily become the median response of your frontend." The tail of a dependency becomes the typical experience of the caller, because a page that fans out to many backends is likely to hit at least one slow one.
>
> The fix is structural, not statistical. Rather than recording latencies, "collect request counts bucketed by latencies (suitable for rendering a histogram)": how many requests took 0 to 10 ms, 10 to 30, 30 to 100, 100 to 300, and so on. Boundaries spread "approximately exponentially (in this case by factors of roughly 3)" cover the range readably. You cannot recover a percentile from a stored mean. You can from a histogram.

## White-box, black-box, and what should page you

The SRE book splits monitoring by vantage point. White-box monitoring is "based on metrics exposed by the internals of the system, including logs, interfaces like the Java Virtual Machine Profiling Interface, or an HTTP handler that emits internal statistics." Black-box monitoring is "testing externally visible behavior as a user would see it." Google combines "heavy use of white-box monitoring with modest but critical uses of black-box monitoring."

The division of labor is clean. Black-box is symptom-oriented and reports active, not predicted, problems: "the system isn't working correctly, right now." For paging it "has the key benefit of forcing discipline to only nag a human when a problem is both already ongoing and contributing to real symptoms," and it is "fairly useless" for problems that have not happened yet. White-box "allows detection of imminent problems, failures masked by retries, and so forth," and it is "essential" for debugging telemetry, because if web servers seem slow on database-heavy requests "you need to know both how fast the web server perceives the database to be, and how fast the database believes itself to be." Without both, a slow database and a slow network between them look identical.

The framing that ties it together is symptom versus cause. "Your monitoring system should address two questions: what's broken, and why?" The what is the symptom, the why is a possibly intermediate cause, and "'what' versus 'why' is one of the most important distinctions in writing good monitoring with maximum signal and minimum noise." The layering caveat matters in practice: "one person's symptom is another person's cause." Slow database reads are a symptom to the database SRE and a cause to the frontend SRE watching a slow website.

> [!tip] A page is a claim on a human being
> "Paging a human is a quite expensive use of an employee's time," and the failure mode compounds: "when pages occur too frequently, employees second-guess, skim, or even ignore incoming alerts, sometimes even ignoring a 'real' page that's masked by the noise." The philosophy Google states is four lines long. "Every page should be actionable." "Every page response should require intelligence. If a page merely merits a robotic response, it shouldn't be a page." "Pages should be about a novel problem or an event that hasn't been seen before." And the constraint underneath all of them: "I can only react with a sense of urgency a few times a day before I become fatigued."
>
> Two consequences follow. Any alert satisfying those criteria is fine whether it came from white-box or black-box monitoring, so that distinction dissolves at the pager. And you should "never trigger an alert simply because 'something seems a bit weird'."

## Complexity is the failure mode

Observability tooling rots the way any system rots. "Like all software systems, monitoring can become so complex that it's fragile, complicated to change, and a maintenance burden," and Google's stated guidelines are aggressive about pruning. "The rules that catch real incidents most often should be as simple, predictable, and reliable as possible." Configuration "that is rarely exercised (e.g., less than once a quarter for some SRE teams) should be up for removal." And "signals that are collected, but not exposed in any prebaked dashboard nor used by any alert, are candidates for removal."

Google also avoids "'magic' systems that try to learn thresholds or automatically detect causality," and has had "only limited success with complex dependency hierarchies," partly because "our infrastructure has a steady rate of continuous refactoring" so the dependency model goes stale. The resolution advice is the same discipline applied to sampling rate: measuring CPU load over a minute "won't reveal even quite long-lived spikes that drive high tail latencies," while probing a 99.9%-uptime web service for a 200 status "more than once or twice a minute is probably unnecessarily frequent."

The architectural recommendation is a [[coupling-and-cohesion|coupling]] argument. It is tempting to fold profiling, single-process debugging, crash tracking, load testing, log analysis, and traffic inspection into the monitoring system, but "blending together too many results in overly complex and fragile systems," so "maintaining distinct systems with clear, simple, loosely coupled points of integration is a better strategy."

## Related Notes

- [[incident-postmortems-and-blameless-culture|Incident Postmortems and Blameless Culture]] - what you do with the telemetry after the outage
- [[continuous-delivery-and-deployment|Continuous Delivery and Deployment]] - canary releases only work if you can see the canary failing
- [[coupling-and-cohesion|Coupling and Cohesion]] - the loosely-coupled-integration argument applied to your own tooling
- [[software-architecture|Software Architecture]] - tracing is what makes a service architecture debuggable at all
- [[testing-strategies|Testing Strategies]] - end-to-end tests are the only way to catch a correct status code with wrong content
- [[cs/security/incident-response-lifecycle|Incident Response Lifecycle]] - the security-side counterpart to this telemetry
- [[cs/systems/logical-clocks-lamport-and-vector|Logical Clocks: Lamport and Vector]] - the ordering problem underneath correlating events across machines

## Sources

- "Observability primer," OpenTelemetry Docs. https://opentelemetry.io/docs/concepts/observability-primer/ . Supports the definition of observability as understanding a system from the outside without knowing its inner workings and handling unknown unknowns; the properly-instrumented test that developers need no additional instrumentation to troubleshoot; traces, metrics, and logs as the signals and telemetry as data emitted from a system; the definition of reliability and the add-to-cart black shoes example; the definitions of metrics, SLI, and SLO; the definition of a log, the sample log line, logs not being associated with a particular request, logs lacking contextual information, and logs becoming more useful inside a span or correlated with a trace; the definition of a span, its contents, and the table of span attributes; the definition of a distributed trace, root and child spans, the API-gateway/backend/database example, and waterfall visualization; and distributed tracing being essential for systems with nondeterministic problems or that are too complicated to reproduce locally.
- "Monitoring Distributed Systems," Chapter 6, *Site Reliability Engineering*, Rob Ewaschuk (ed. Betsy Beyer), Google. https://sre.google/sre-book/monitoring-distributed-systems/ . Supports the definition of monitoring; the white-box and black-box definitions and their respective roles for paging and debugging; the symptom-versus-cause framing and the one-person's-symptom caveat; the four golden signals of latency, traffic, errors, and saturation with each definition, including successful-versus-failed latency, the traffic examples per system type, the explicit/implicit/policy error taxonomy and load-balancer-versus-end-to-end detection, and saturation, utilization targets, 99th-percentile latency as a leading indicator, and impending-saturation prediction; the average-latency and 99th-percentile-becomes-frontend-median tail argument plus latency-bucketed histograms with roughly exponential boundaries; the cost of paging humans and alert fatigue; the never-alert-because-something-seems-weird rule; the four-bullet pager philosophy and the dissolution of the white-box/black-box distinction at the pager; the simplicity guidelines for removing rarely-exercised configuration and unexposed signals; the avoidance of magic threshold-learning systems and complex dependency hierarchies given continuous refactoring; the measurement-resolution examples; and the argument for keeping monitoring separate from profiling, debugging, load testing, and log analysis with loosely coupled integration points.
