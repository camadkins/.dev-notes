---
title: Continuous Delivery and Deployment
description: "Continuous delivery is a property of the software, not a property of the pipeline: at any moment, could a business sponsor ask for production and nobody panic?"
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-03-11
updated:
aliases:
  - Continuous Delivery
  - Continuous Deployment
  - Deployment Pipeline
  - Blue-Green Deployment
  - Canary Release
---

Fowler states the test as a thought experiment rather than a checklist: "a business sponsor could request that the current development version of the software can be deployed into production at a moment's notice - and nobody would bat an eyelid, let alone panic." Notice what that measures. Not whether you have a pipeline, not whether the build is green, but whether the room reacts calmly. Continuous delivery is a claim about the state of the software, and it is falsified by anyone flinching.

> [!note] The idea
> Continuous delivery is defined by Fowler as "a software development discipline where you build software in such a way that the software can be released to production at any time." The load-bearing word is *discipline*. One of his four indicators is that "your team prioritizes keeping the software deployable over working on new features," which is a statement about how a team spends contested time, not about tooling. A pipeline can be fully automated while the software is undeployable, because someone chose feature work over the thing that broke deployability. The automation is necessary and not sufficient.

## Delivery is not deployment

The two CDs are often collapsed into one abbreviation and they are different claims. Fowler separates them cleanly: "Continuous Deployment means that every change goes through the pipeline and automatically gets put into production, resulting in many production deployments every day. Continuous Delivery just means that you are able to do frequent deployments but may choose not to do it, usually due to businesses preferring a slower rate of deployment."

The dependency runs one way. "In order to do Continuous Deployment you must be doing Continuous Delivery." So the pair forms a ladder, each rung a strictly larger commitment than the last:

| Practice | The claim |
|---|---|
| Continuous integration | Integrating, building, and testing code within the development environment. |
| Continuous delivery | The software is deployable at any point in its lifecycle; deploying is a choice. |
| Continuous deployment | Every change that passes the pipeline goes to production automatically. |

Fowler positions the relationship between the first two directly: "Continuous Integration usually refers to integrating, building, and testing code within the development environment. Continuous Delivery builds on this, dealing with the final stages required for production deployment." [[continuous-integration|CI]] ends at a green mainline. CD carries that mainline the rest of the way.

## How you get there

The mechanism is progressive exposure to reality. You achieve continuous delivery "by continuously integrating the software done by the development team, building executables, and running automated tests on those executables to detect problems," and then you "push the executables into increasingly production-like environments to ensure the software will work in production." The vehicle for that staged march is the deployment pipeline.

Two prerequisites sit underneath, and only one of them is technical. The first is "a close, collaborative working relationship between everyone involved in delivery," which Fowler is careful to scope beyond the devops label: it "should extend beyond developers and operations to include testers, database teams, and anyone else needed to get software into production." The second is "extensive automation of all possible parts of the delivery process."

The benefits he lists are worth reading in order, because they escalate from mechanical to strategic. Reduced deployment risk, "since you are deploying smaller changes, there's less to go wrong and it's easier to fix should a problem appear." Believable progress, because a feature that developers merely declare done is a weaker signal than one sitting in a production-like environment. And user feedback, against "the biggest risk to any software effort," which is "that you end up building something that isn't useful."

## Blue-green: two environments, one switch

The hard moment in any deployment is the cut-over, "taking software from the final stage of testing to live production," and you want it fast to minimize downtime. Blue-green removes the risk by removing the moment.

You keep "two production environments, as identical as possible." One is live, call it blue. You do the final stage of testing in green, and when green works you "switch the router so that all incoming requests go to the green environment - the blue one is now idle." Blue is not torn down. It sits there as the rollback: "if anything goes wrong you switch the router back to your blue environment."

Then the roles rotate. Once green is live and stable, blue becomes the staging environment for the next release, so "both green and blue environments are regularly cycling between live, previous version (for rollback) and staging the next version." A side effect Fowler flags is that this is "the same basic mechanism as you need to get a hot-standby working," which means you exercise your disaster-recovery path on every single release. His parenthetical: "I hope that you release more frequently than you have a disaster."

The two environments do not have to be two racks. They "can be different pieces of hardware, or they can be different virtual machines running on the same (or different) hardware," or "a single operating environment partitioned into separate zones with separate IP addresses for the two slices." One project switched by bouncing the web server instead of touching the router.

> [!warning] The database is where blue-green gets hard
> Two application environments are easy to duplicate. A schema is not. Fowler's remedy is sequencing: "separate the deployment of schema changes from application upgrades. So first apply a database refactoring to change the schema to support both the new and old version of the application, deploy that, check everything is working fine so you have a rollback point, then deploy the new version of the application." Support for the old version comes out later, once the upgrade has settled. There is also an unavoidable residue at cut-over, "the issue of dealing with missed transactions while the green environment was live," which you handle by feeding both environments or by running read-only across the switch.
>
> Also on names: Fowler credits the term to "some foggy combination of Daniel Terhorst-North and Jez Humble." The technique itself, he notes, "has been 'out there' for ages."

## Canary: a small blast radius, on purpose

Where blue-green flips all traffic at once, a canary release moves it gradually. Danilo Sato defines it as "a technique to reduce the risk of introducing a new software version in production by slowly rolling out the change to a small subset of users before rolling it out to the entire infrastructure and making it available to everybody."

The shape is familiar from blue-green: deploy the new version to a subset of infrastructure with no users routed to it, then start routing a few. Who those few are is a design decision. A random sample is the simple option. "Some companies choose to release the new version to their internal users and employees before releasing to the world," and a more sophisticated approach selects "users based on their profile and other demographics." Facebook's variant uses multiple canaries, "the first one being visible only to their internal employees and having all the FeatureFlags turned on so they can detect problems with new features early." In geographically distributed systems the partition can be a region or a brand rather than a router rule.

Rollback is trivial by construction: "reroute users back to the old version until you have fixed the problem."

The benefit that gets least attention is capacity testing. Ramping load slowly on real infrastructure lets you "monitor and capture metrics about how the new version impacts the production environment," which Sato offers as "an alternative approach to creating an entirely separate capacity testing environment, because the environment will be as production-like as it can be." A separate perf environment is always a guess about production. A canary is production.

The name comes from mining. Miners "would carry a canary in a cage down the coal mines," and toxic gas would kill the bird before the men. The practice predates the label and also travels under "phased rollout" or "incremental rollout."

> [!warning] Do not run your canary as an A/B test
> They look identical in implementation and they answer different questions. "While canary releases are a good way to detect problems and regressions, A/B testing is a way to test a hypothesis using variant implementations." Conflating them corrupts both: if you are watching business metrics to catch a canary regression, an A/B experiment running on the same split "could interfere with the results." The timescales disagree too. "It can take days to gather enough data to demonstrate statistical significance from an A/B test, while you would want a canary rollout to complete in minutes or hours."
>
> The automated form of the metric-watching, "monitoring business metrics and automatically rolling back a release on a statistically significant regression," is called a cluster immune system, and Sato credits it to IMVU.

Canaries carry two costs. You "have to manage multiple versions of your software at once," and while more than two concurrent versions is possible, "it is best to keep the number of concurrent versions to a minimum." And they fit badly where you do not control the upgrade, as with software installed on users' own computers or phones. There the fallback is to support both versions at the backend, monitor which client versions are still calling, and drop the old path once usage falls far enough.

> [!tip] Partial rollout is also how you get honest feedback
> Fowler's note that user feedback "does require you to be doing continuous deployment" comes with an escape hatch for teams unwilling to ship to everyone: "you can deploy to a subset of users." He describes a retailer that "deployed its new online system first to its employees, then to an invited set of premium customers, and finally to all customers." The same partial-exposure machinery that limits blast radius also buys graduated feedback. Risk control and learning come from the same lever.

## Related Notes

- [[continuous-integration|Continuous Integration]] - the practice CD builds on, ending where CD begins
- [[testing-strategies|Testing Strategies]] - the automated tests that make an unattended pipeline trustworthy
- [[observability-logging-metrics-tracing|Observability, Logging, Metrics, and Tracing]] - how you know a canary is failing before your users tell you
- [[incident-postmortems-and-blameless-culture|Incident Postmortems and Blameless Culture]] - what happens when the rollback was not fast enough
- [[semantic-versioning|Semantic Versioning]] - versioning artifacts that a pipeline promotes between environments
- [[software-architecture|Software Architecture]] - deployability is an architectural property, not a late-stage concern
- [[cs/systems/virtualization-vms-and-containers|Virtualization, VMs, and Containers]] - what makes two "as identical as possible" environments cheap

## Sources

- "Continuous Delivery," Martin Fowler. https://martinfowler.com/bliki/ContinuousDelivery.html . Supports the definition of continuous delivery as a discipline of always-releasable software; the four indicators including prioritizing deployability over new features and push-button deployment of any version to any environment; the business-sponsor-at-a-moment's-notice test; the achievement path through continuous integration, executable testing, and increasingly production-like environments via a deployment pipeline; the two prerequisites of a collaborative delivery relationship (scoped beyond developers and operations) and extensive automation; the continuous delivery versus continuous deployment distinction and the dependency between them; CI as integrating/building/testing in the development environment with CD handling the final production stages; the three benefits of reduced deployment risk, believable progress, and user feedback; and deploying to a subset of users, including the retailer that went employees, then premium customers, then everyone.
- "Blue Green Deployment," Martin Fowler. https://martinfowler.com/bliki/BlueGreenDeployment.html . Supports the cut-over as the challenge in automated deployment; two as-identical-as-possible production environments with router switching and rapid rollback; the environments cycling between live, rollback, and staging; the hot-standby equivalence and testing disaster recovery on every release; hardware, VM, and partitioned-zone implementations plus the web-server-bounce variation; the missed-transactions and read-only-mode caveats; the database schema sequencing (refactor to support both versions, deploy, verify, then upgrade the application); and the name being credited to a foggy combination of Daniel Terhorst-North and Jez Humble.
- "Canary Release," Danilo Sato (martinfowler.com). https://martinfowler.com/bliki/CanaryRelease.html . Supports the definition of canary release as slow rollout to a subset of users; deploying with no users routed then routing a few; the random-sample, internal-employees, and profile-based selection strategies; Facebook's multiple-canary approach with feature flags on for employees; geographic and brand partitioning; reroute-to-old-version rollback; capacity testing in production as an alternative to a separate performance environment; the coal-mine origin of the name and the phased/incremental rollout synonyms; the argument against conflating canaries with A/B testing including the statistical-significance timescale mismatch; the cluster immune system credited to IMVU; and the drawbacks of managing multiple concurrent versions and of client-installed software.
