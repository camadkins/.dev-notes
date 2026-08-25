---
title: Code Review
description: "Most of what code review actually catches is not bugs. The measured majority of review comments concern maintainability, which reframes review as a design and knowledge practice with defect detection as a side effect."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-03-30
updated:
aliases: []
---

The definition is narrower than the folklore. Code review is "a software quality assurance activity in which one or more people examine the source code of a computer program, either after implementation or during the development process," and it carries one structural requirement: "At least one reviewer must not be the code's author." That constraint is what separates review from the neighboring practices. Static analysis is automated, self-checks involve only the author, testing requires running the code, and pair programming happens continuously rather than as a separate step.

> [!note] The idea
> Ask most engineers what review is for and they will say catching bugs. The measurements say otherwise. Studies indicate "up to 75% of code review comments affect software evolvability and maintainability rather than functionality," and consequently "less than 15% of issues discussed in code reviews relate directly to bugs." Review's dominant output is not defect detection, it is pressure on the code's future cost of change, plus the knowledge transfer that happens as a byproduct. Which means a review process optimized purely as a bug filter is optimizing for its minority effect.

## What the practice is actually chasing

Defect discovery is "often the main goal," but reviews in industry are performed to reach a combination of goals, and the list is worth reading as a whole:

- **Code quality**: internal maintainability through readability, uniformity, understandability.
- **Defect detection**: correctness, plus performance problems, security vulnerabilities, and [[cs/languages/common/software-supply-chain-and-provenance|injected malware]].
- **Learning and knowledge transfer**: codebase knowledge, solution approaches, and quality expectations flowing in both directions, to the reviewers as well as the author.
- **Mutual responsibility**: a sense of collective code ownership.
- **Finding better solutions**: ideas beyond the specific code at hand.
- **Compliance**: reviews are mandatory in some contexts, such as [[cs/standards/ieee-1012-verification-and-validation|air traffic software and safety-critical software]].

The knowledge-transfer goal explains something the bug-filter framing cannot: why reviewing code you did not write is valuable to *you*. A reviewer who learns the module's layout has cheaply reduced the project's bus factor.

## Inspection, and the lightweight practice that replaced it

The first review process studied and described in detail was **Inspection**, invented by Michael Fagan at IBM. Fagan inspection is formal: multiple participants, defined phases, developers attending "a series of meetings to examine code line by line, often using printed copies." Research found formal inspections "extremely thorough and highly effective at identifying defects."

Almost nobody works this way now. Teams adopt **regular, change-based code review**, where the scope of a review is the change corresponding to a ticket, user story, commit, or similar unit, and review is folded into the workflow by convention (typically mandatory review on every ticket, usually as a pull request) rather than scheduled as an event. A 2017 survey of 240 development teams found "90% of teams using code review followed a change-based process, with 60% specifically using regular change-based review." Microsoft, Google, and Facebook are named as change-based practitioners.

The evidence on which is better is genuinely contested, and worth presenting as such. Capers Jones, analyzing over 12,000 software development projects, found formal inspections had a latent defect discovery rate of 60 to 65 percent, informal inspections under 50 percent, and "the latent defect discovery rate for most forms of testing is about 30%." A case study published in *Best Kept Secrets of Peer Code Review* contradicted that result, finding "lightweight reviews can uncover as many bugs as formal reviews while being faster and less costly." Two numbers pointing opposite directions is the honest state of the field.

> [!warning] Rate is a real constraint
> Review effectiveness correlates with how fast you read. The reported optimum is **200 to 400 lines of code per hour**, and for critical software (safety-critical embedded code is the example given) "inspecting and reviewing more than a few hundred lines of code per hour... may be too fast to find errors."
>
> Run the arithmetic on that and the practical implication is uncomfortable. A 2,000 line pull request implies five to ten hours of attentive review to be done at the effective rate. Nobody does that, so what actually happens is the reviewer reads at 2,000 lines per hour and approves. The size of a change is therefore not a courtesy issue; past a few hundred lines the review is nominally happening and empirically not.

## Latency is the other half

Size determines whether a review finds anything. Latency determines whether the process survives contact with the team.

Google's engineering practices state the tradeoff explicitly: they "optimize for the speed at which a team of developers can produce a product together, as opposed to optimizing for the speed at which an individual developer can write code." Under that objective, slow review is a team-level cost even though the waiting developer stays busy: "new features and bug fixes for the rest of the team are delayed by days, weeks, or months as each CL waits for review and re-review."

Two second-order effects are more interesting than the delay itself.

The first is that latency masquerades as strictness. "If a reviewer only responds every few days, but requests major changes to the CL each time, that can be frustrating." Ask for the same substantial changes while responding quickly and "the complaints tend to disappear." Google's conclusion is blunt: "Most complaints about the code review process are actually resolved by making the process faster." If your team is arguing about how picky reviewers should be, the real variable may be turnaround time.

The second is that slow review corrodes code quality through incentives rather than through missed bugs. "When reviews are slow, there is increased pressure to allow developers to submit CLs that are not as good as they could be. Slow reviews also discourage code cleanups, refactorings, and further improvements." A queue with a multi-day wait makes every optional improvement expensive, so optional improvements stop happening.

The stated standard is response time, not completion time: "One business day is the maximum time it should take to respond to a code review request," with the goal that "a typical CL should get multiple rounds of review (if needed) within a single day." And there is one carve-out that runs the other way. If you are in the middle of focused work, do not interrupt yourself, because getting back into flow is expensive enough that "interrupting yourself while coding is actually more expensive to the team than making another developer wait a bit for a code review." Respond at a break point instead.

## The pull request model

The pull request is the packaging that made change-based review the default. GitHub describes pull requests as "proposals to merge code changes into a project," letting teams "discuss and review changes before merging them."

Its real contribution is assembling everything a reviewer needs in one place. A pull request organizes context into tabs: **Conversation** (description, timeline, comments, reviews), **Commits** (how the branch changed over time), **Checks** (automated tests, builds, and other validations), **Files changed** (the diff reviewers use to understand the proposal), and **Findings** (automated code review results such as code scanning alerts). Separately, the merge status "highlights blockers, missing approvals, and other requirements before merging."

That last piece is the quiet part. The PR is not only a discussion thread, it is a **gate**: human approval and automated checks are conditions on the same merge, which is how review became something a repository can enforce rather than something a team agrees to do. Draft pull requests handle the other direction, sharing work in progress without requesting review, since drafts "cannot be merged, and code owners are not automatically requested to review them."

> [!tip]
> The pieces compose into one rule of thumb. Small changes are reviewable at the effective rate, reviewed quickly because they are small, and hold latency low enough that the process does not degrade into rubber-stamping. Nearly every observed review pathology, superficial approvals, strictness complaints, deferred cleanups, traces back to changes that were too large or waits that were too long.

## Related Notes

- [[cs/software-engineering/continuous-integration|Continuous Integration]] - the automated checks a pull request gates on, and the practice review latency is in tension with
- [[cs/software-engineering/testing-strategies|Testing Strategies]] - the automated half of verification that review deliberately does not duplicate
- [[cs/software-engineering/refactoring|Refactoring]] - named transformations make a large diff reviewable, and slow review discourages cleanup
- [[cs/software-engineering/technical-debt|Technical Debt]] - review is where inadvertent debt is cheapest to catch
- [[cs/software-engineering/version-control-fundamentals|Version Control Fundamentals]] - branches and merges are what a pull request wraps
- [[cs/software-engineering/api-design|API Design]] - reviewing a public interface change is the highest-leverage review a team does

## Sources

- "Code review," Wikipedia. https://en.wikipedia.org/wiki/Code_review . Supports the definition and the requirement that at least one reviewer is not the author; the contrast with static analysis, self-checks, testing, and pair programming; the combined goal list including quality, defect detection, learning, mutual responsibility, better solutions, and mandatory review in air traffic and safety-critical software; Fagan inspection as the first studied process and its formality and effectiveness; regular change-based review and the 2017 survey of 240 teams finding 90% change-based and 60% regular change-based, with Microsoft, Google, and Facebook named; the Capers Jones figures over 12,000 projects (60-65% formal, under 50% informal, about 30% for most testing) and the contradicting *Best Kept Secrets of Peer Code Review* case study; the up-to-75% evolvability/maintainability and under-15% bug figures; and the 200 to 400 lines per hour optimal rate with the too-fast-to-find-errors caveat for critical software.
- "Speed of Code Reviews," Google Engineering Practices. https://google.github.io/eng-practices/review/reviewer/speed.html . Supports optimizing for team velocity over individual velocity; delays of days, weeks, or months to the rest of the team; complaints about strictness being resolved by faster responses; slow reviews increasing pressure to submit weaker CLs and discouraging cleanups and refactorings; the one-business-day maximum response time and multiple rounds within a single day; and the flow-interruption carve-out.
- "About pull requests," GitHub Docs. https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests . Supports pull requests as proposals to merge with discussion and review before merging; the Conversation, Commits, Checks, Files changed, and Findings tabs and what each contains; the merge status highlighting blockers, missing approvals, and other requirements; and draft pull requests not being mergeable and not auto-requesting code owners.
