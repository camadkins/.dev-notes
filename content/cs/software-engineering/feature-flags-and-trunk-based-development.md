---
title: Feature Flags and Trunk-Based Development
description: "A flag lets unfinished code ship to production without being reachable, which is how a team keeps one integration branch releasable at all times. Every flag is also inventory with a carrying cost."
draft: false
comments: true
tags:
  - cs
  - software-engineering
  - version-control
date: 2026-05-08
updated:
aliases:
  - Feature Flags
  - Feature Toggles
  - Trunk-Based Development
---

Two practices that are usually taught separately are actually one practice with a conditional in the middle. Trunk-based development wants every developer integrating to a shared branch constantly, which means half-finished work lands in the branch you deploy from. Feature flags are what make that survivable: they are "a powerful technique, allowing teams to modify system behavior without changing code," and the specific category built for this job, the release toggle, exists to "allow incomplete and un-tested codepaths to be shipped to production as latent code which may never be turned on."

Pete Hodgson states the coupling directly. Release toggles "are feature flags used to enable trunk-based development for teams practicing Continuous Delivery. They allow in-progress features to be checked into a shared integration branch (e.g. master or trunk) while still allowing that branch to be deployed to production at any time." Used this way they are "the most common way to implement the Continuous Delivery principle of 'separating [feature] release from [code] deployment.'"

> [!note] The idea
> A flag converts a *branching* problem into a *conditional* problem, and conditionals compound. One flag doubles the codepaths through the artifact; the honest consequence Hodgson draws is that "in order to validate all codepaths which may end up live in production we must perform test our artifact in both states: with the toggle flipped On and flipped Off," and "with multiple toggles in play we have a combinatoric explosion of possible toggle states." The escape is not better tooling, it is treating flags as perishable: "savvy teams view the Feature Toggles in their codebase as inventory which comes with a carrying cost and seek to keep that inventory as low as possible."

## Deploy is not release

The deployment of a binary and the exposure of a behavior are separate events, and a flag is the seam between them. The product argument for the seam is not engineering convenience. Hodgson's example is a product manager who "might not want to let users see a new Estimated Shipping Date feature which only works for one of the site's shipping partners, preferring to wait until that feature has been implemented for all shipping partners," and who may withhold a feature that is fully implemented and tested anyway because "feature release might be being coordinated with a marketing campaign."

Once the two events are separate, one artifact can serve several audiences at once, which is where the other toggle categories come from. Experiment toggles "[[cs/statistics/hypothesis-testing|are used to perform multivariate or A/B testing]]," placing "each user of the system into a cohort" so the router "will consistently send a given user down one codepath or the other, based upon which cohort they are in." Ops toggles "control operational aspects of our system's behavior," introduced "when rolling out a new feature which has unclear performance implications so that system operators can disable or degrade that feature quickly in production if needed." Permissioning toggles "change the features or product experience that certain users receive," such as premium features toggled on only for paying customers.

Hodgson insists these are not one thing. "It can be tempting to lump all feature toggles into the same bucket, but this is a dangerous path. The design forces at play for different categories of toggles are quite different and managing them all in the same way can lead to pain down the road." The two axes he uses are "how long the feature toggle will live and how dynamic the toggling decision must be."

| Category | Expected lifetime | Dynamism |
|---|---|---|
| Release | "should generally not stick around much longer than a week or two" | "typically very static" |
| Experiment | "a lifetime of hours or weeks" | "highly dynamic," routed per request |
| Ops | "relatively short-lived," but some long-lived kill switches | must be "re-configured extremely quickly" |
| Permissioning | possibly "at the scale of multiple years" | "always be per-request" |

The lifetime column is the one that should drive implementation. "If we're adding a Release Toggle which will be removed in a few days time then we can probably get away with a Toggle Point which does a simple if/else check on a Toggle Router," whereas for a long-lived permissioning toggle "we certainly don't want to implement those Toggle Points by sprinkling if/else checks around indiscriminately."

## Trunk-based development, and the naming argument

The branching side is simpler than the flag side. Trunk-based development "focuses on doing all work on Mainline (called 'trunk', which is a common synonym for 'mainline'), and thus avoiding any kind of long-lived branches." Small teams commit straight to mainline; larger teams "may use short-lived Feature Branching where 'short' means no more than a couple of days."

Fowler treats the term as mostly a renaming of something older, and objects to the rename. The rule of thumb for continuous integration is that "everyone commits to the mainline every day," or more precisely "you should never have more than a day's work sitting unintegrated in your local repository." He argues that because most organizations wire their CI tools to feature branches, "which, while useful, means they don't actually practice Continuous Integration," some people adopted "Trunk-Based Development" as a replacement label. His objection is attributional: "changing terminology rudely erases the contribution of the early Extreme Programming pioneers, in particular Kent Beck, who coined and clearly defined the practice of Continuous Integration in the 1990s."

Flags are not the only way to hide unfinished work, and Fowler reaches for them second. Sometimes concealment is free, as with "a discount algorithm that relies on a coupon code" where the code "isn't going to get called even if it is production." Sometimes you order the work so the user-facing piece lands last, "hiding a partially built feature by hooking up a Keystone Interface last." Flags come in "if there's no way to easily hide the partial feature," and they buy something the alternatives do not: they "also allow the feature to be selectively revealed to a subset of users."

He also names the cost that stays after the flag is flipped: "while feature flags allow features to be switched on or off from the users' perspective, the code for the feature is still in the product." And the prerequisite is not optional, since integrating part-built work means "teams who want to do Continuous Integration must develop a strong testing regimen so they can be confident that mainline remains healthy even with many integrations a day."

> [!example] The conditional that should not stay a conditional
> Hodgson's worked case is an invoice emailer that asks the flag system how to behave. The problem is coupling: the emailer "has one extra concept it needs to be aware of - feature flagging - and an extra module it is coupled to," which makes it "harder to work with and think about in isolation, including making it harder to test." Scaled up, "we will see more and more modules becoming coupled to the feature flagging system as a global dependency."
>
> His fix is [[cs/software-engineering/dependency-injection-and-inversion-of-control|inversion of control]]. Rather than the emailer reaching out to the decision object, "it has those decisions injected into it at construction time via a config object," after which the emailer "has no knowledge whatsoever about feature flagging. It just knows that some aspects of its behavior can be configured at runtime." Testing follows for free: you exercise both paths "just by passing a different configuration option during test."
>
> A prior step matters as much. "One common mistake with Feature Toggles is to couple the place where a toggling decision is made (the Toggle Point) with the logic behind the decision (the Toggle Router)." Naming the decision (`includeOrderCancellationInEmail`) rather than the flag gives "a singular place to manage it," so the reason can later change from static configuration to an A/B experiment to an operational concern without touching the caller.

## Configuration is part of the design

The instinct is to reach for a dynamic flag service immediately. Hodgson argues the opposite default: "managing toggle configuration via source control and re-deployments is preferable, if the nature of the feature flag allows it." Keeping the configuration beside the code means "toggle configuration will move through your Continuous Delivery pipeline in the exact same way as a code change or an infrastructure change would," and [[cs/math/combinatorics|it directly shrinks the combinatorics]], since "there is less need to verify how the release will perform with both a toggle Off and On, since that state is baked into the release and won't be changed." A bonus is archaeology: "we can easily see the state of the toggle in previous releases, and easily recreate previous releases if needed."

Placement follows the toggle's information needs. Toggles requiring per-request context "make sense to place ... in the edge services of your system," where "your Toggle Router has the most context available to make toggling decisions based on the user and their request," and it "keeps fiddly conditional toggling logic out of the core." Technical toggles that "control how some functionality is implemented internally," such as one choosing whether to [[cs/networking/cdn-and-edge-caching|front a third-party API with a new cache]], must go deep instead, because "localizing these toggling decisions within the service whose functionality is being toggled is the only sensible option in these cases."

On testing, the explosion is bounded in practice rather than in theory. "Most feature flags will not interact with each other, and most releases will not involve a change to the configuration of more than one feature flag." The prescription is to test "the current production toggle configuration plus any toggles which you intend to release flipped On," plus "the fall-back configuration where those toggles you intend to release are also flipped Off," and often "some tests with all toggles flipped On." That advice is conditional on a convention, and Hodgson says so: it "only makes sense if you stick to a convention of toggle semantics where existing or legacy behavior is enabled when a feature is Off and new or future behavior is enabled when a feature is On."

## The debt

Flags "have a tendency to multiply rapidly, particularly when first introduced. They are useful and cheap to create and so often a lot are created." What they cost is stated plainly: "they require you to introduce new abstractions or conditional logic into your code. They also introduce a significant testing burden." Hodgson cites "Knight Capital Group's $460 million dollar mistake" as "a cautionary tale on what can go wrong when you don't manage your feature flags correctly (amongst other things)."

The countermeasures are all forms of forced expiry. "Some teams have a rule of always adding a toggle removal task onto the team's backlog whenever a Release Toggle is first introduced. Other teams put 'expiration dates' on their toggles. Some go as far as creating 'time bombs' which will fail a test (or even refuse to start an application!) if a feature flag is still around after its expiration date." The strongest version is a hard cap: "placing a limit on the number of feature flags a system is allowed to have at any one time. Once that limit is reached if someone wants to add a new toggle they will first need to do the work to remove an existing flag."

Note what that implies about the accounting. A flag is borrowed structure repaid by deletion, which makes an un-removed flag a specific and unusually legible form of [[cs/software-engineering/technical-debt|technical debt]]: you can count them, date them, and fail a build on them. Very little other debt admits that.

> [!warning] Category migration is a real event
> A toggle does not always stay what it was. Hodgson's recommendations section walks a Recommended Products feature from a release toggle, to an experiment toggle "to validate that it was helping drive revenue," to an ops toggle "so that we can turn it off when we're under extreme load." If the decision logic was decoupled properly, "these differences in toggle category should have had no impact on the Toggle Point code at all." The management side is another matter: transitioning from release to experiment means "the way the toggle is configured will change, and likely move to a different area - perhaps into an Admin UI rather than a yaml file in source control," and "product folks will likely now manage the configuration rather than developers." The next hop "will mean another change in how the toggle is configured, where that configuration lives, and who manages the configuration."

## Related Notes

- [[cs/software-engineering/continuous-integration|Continuous Integration]] - the practice trunk-based development is a renaming of, per Fowler
- [[cs/software-engineering/continuous-delivery-and-deployment|Continuous Delivery and Deployment]] - separating release from deployment is a CD principle
- [[cs/software-engineering/version-control-fundamentals|Version Control Fundamentals]] - branches, mainline, and the merge cost flags avoid
- [[cs/software-engineering/technical-debt|Technical Debt]] - the carrying cost model applied to flags
- [[cs/software-engineering/testing-strategies|Testing Strategies]] - the combinatorial validation burden flags add
- [[cs/software-engineering/dependency-injection-and-inversion-of-control|Dependency Injection and Inversion of Control]] - Hodgson's fix for flag coupling
- [[cs/software-engineering/coupling-and-cohesion|Coupling and Cohesion]] - a global flag module is a global dependency

## Sources

- Pete Hodgson, "Feature Toggles (aka Feature Flags)," martinfowler.com, 09 October 2017. https://martinfowler.com/articles/feature-toggles.html . Supports the definition of feature toggles and the synonym list; release toggles enabling trunk-based development and shipping latent codepaths; the separating-release-from-deployment framing and the shipping-date and marketing-campaign examples; the experiment, ops, and permissioning categories with their lifetimes and dynamism; the two categorization axes and the warning against one-bucket management; the if/else versus maintainable toggle-point distinction; the decision-point/decision-logic coupling mistake and the named-decision fix; the inversion-of-decision refactoring and its testing benefit; the preference for static source-controlled configuration and its pipeline and archaeology benefits; toggle placement at the edge versus in the core; the both-states testing requirement, combinatoric explosion, non-interaction observation, recommended configurations to test, and the Off-is-legacy convention; category-migration effects on configuration and ownership; and the carrying-cost framing including the Knight Capital citation and the removal-task, expiration-date, time-bomb, and hard-limit countermeasures.
- Martin Fowler, "Patterns for Managing Source Code Branches," martinfowler.com. https://martinfowler.com/articles/branching-patterns.html . Supports the definition of Trunk-Based Development as all work on mainline avoiding long-lived branches, with small teams committing directly and larger teams using branches of no more than a couple of days; the everyone-commits-daily rule of thumb and the never-more-than-a-day's-unintegrated-work formulation; the observation that CI tools are usually pointed at feature branches so teams are not practicing continuous integration; the semantic-diffusion origin of the Trunk-Based Development label and Fowler's objection that it erases Kent Beck's coining of continuous integration in the 1990s; the coupon-code and keystone-interface alternatives to flags; flags as the fallback when a partial feature cannot easily be hidden and their ability to reveal a feature to a subset of users; the note that flagged code remains in the product; and the strong-testing-regimen prerequisite for a healthy mainline.
