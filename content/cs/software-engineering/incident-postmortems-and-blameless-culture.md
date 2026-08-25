---
title: Incident Postmortems and Blameless Culture
description: "Blame is not primarily an ethics problem. It is an information problem: the people who know why an outage happened stop telling you, and the postmortem stops being able to prevent anything."
draft: false
comments: true
tags:
  - cs
  - software-engineering
date: 2026-04-30
updated:
aliases:
  - Postmortem
  - Blameless Postmortem
  - Postmortem Culture
  - Learning from Failure
---

A postmortem is "a written record of an incident, its impact, [[cs/security/incident-response-lifecycle|the actions taken to mitigate or resolve it]], the root cause(s), and the follow-up actions to prevent the incident from recurring." The argument for writing one is stated as a recurrence argument rather than a documentation argument. Incidents are inevitable at scale, and "unless we have some formalized process of learning from these incidents in place, they may recur ad infinitum."

> [!note] The idea
> Blamelessness is usually presented as kindness. Google's SRE book presents it as an epistemics constraint, and that framing is the useful one: "if a culture of finger pointing and shaming individuals or teams for doing the 'wrong' thing prevails, people will not bring issues to light for fear of punishment." The information you need to prevent recurrence is held almost exclusively by the people closest to the failure, which is to say the people most exposed to blame. Blame does not merely feel bad. It reliably deletes your best evidence, before you ever see it.
>
> The operative move is a substitution. When postmortems "shift from allocating blame to investigating the systematic reasons why an individual or team had incomplete or incorrect information, effective prevention plans can be put in place." And the reason to make that substitution is capability, not virtue: "you can't 'fix' people, but you can fix systems and processes to better support people making the right choices."

## Where the practice comes from, and what blameless actually requires

"Blameless culture [[cs/standards/ieee-1012-verification-and-validation|originated in the healthcare and avionics industries where mistakes can be fatal]]," domains that "nurture an environment where every 'mistake' is seen as an opportunity to strengthen the system." That lineage explains the strictness. When the downside is a body count, an investigative process that suppresses testimony is not an acceptable process.

The requirement is precise. "For a postmortem to be truly blameless, it must focus on identifying the contributing causes of the incident without indicting any individual or team for bad or inappropriate behavior," and it "assumes that everyone involved in an incident had good intentions and did the right thing with the information they had."

That assumption is the whole thing, and it is not naive. It is a working premise adopted because the alternative degrades the investigation. Google's workbook states the corollary directly: "individuals act in good faith and make decisions based on the best information available. Investigating the source of misleading information is much more beneficial to the organization than assigning blame."

> [!warning] Blameless does not mean toothless
> The most common misreading is that a blameless postmortem is a soft one. It is not. "While a blameless postmortem doesn't simply vent frustration by pointing fingers, it should call out where and how services can be improved." The contrast Google draws is between two versions of the same conclusion:
>
> *Pointing fingers*: "We need to rewrite the entire complicated backend system! It's been breaking weekly for the last three quarters and I'm sure we're all tired of fixing things onesy-twosy. Seriously, if I get paged one more time I'll rewrite it myself..."
>
> *Blameless*: "An action item to rewrite the entire backend system might actually prevent these annoying pages from continuing to happen, and the maintenance manual for this version is quite long and really difficult to be fully trained up on. I'm sure our future on-callers will thank us!"
>
> Same verdict, same severity, and only one of them survives contact with the person who has to act on it. Note also the practical difficulty admitted up front: "blameless postmortems can be challenging to write, because the postmortem format clearly identifies the actions that led to the incident."

## When to write one

The process "does present an inherent cost in terms of time or effort," so triggers are defined in advance. Common ones at Google:

- User-visible downtime or degradation beyond a certain threshold
- Data loss of any kind
- On-call engineer intervention, [[cs/networking/load-balancing-l4-and-l7|such as a release rollback or rerouting of traffic]]
- A resolution time above some threshold
- A monitoring failure, "which usually implies manual incident discovery"

Beyond those, "any stakeholder may request a postmortem for an event." The timing rule is what makes the list work: "it is important to define postmortem criteria before an incident occurs so that everyone knows when a postmortem is necessary." Deciding afterward whether an incident "deserves" a postmortem turns the trigger itself into a judgment about the people involved.

The framing on the writing side is unambiguous: "writing a postmortem is not punishment, it is a learning opportunity for the entire company." And "it is also important not to stigmatize frequent production of postmortems by a person or team," since an atmosphere of blame "risks creating a culture in which incidents and issues are swept under the rug, leading to greater risk for the organization."

## Action items are the part that matters

The most quotable line in this literature is Ben Treynor Sloss's, Google's VP for 24/7 Operations: "To our users, a postmortem without subsequent action is indistinguishable from no postmortem. Therefore, all postmortems which follow a user-affecting outage must have at least one P[01] bug associated with them. I personally review exceptions. There are very few exceptions."

Google's workbook dissects a deliberately bad postmortem to name the specific ways action items fail:

- **They are all mitigative.** "To minimize the likelihood of the outage recurring, you should include some preventative action items and fixes."
- **They try to fix humans.** The bad example's one preventative item is to make humans less error-prone, and the response is blunt: "in general, trying to change human behavior is less reliable than changing automated systems and processes." Dan Milstein's quip is quoted: "Let's plan for a future where we're all as stupid as we are today."
- **They are all the same priority.** "There's no way to determine which action to tackle first."
- **They are vague.** Phrases like "Improve" and "Make better" are "open to interpretation," and "using unclear language makes it difficult to measure and understand success criteria."
- **They are untracked.** "Without a formal tracking process, action items from postmortems are often forgotten, resulting in outages."
- **They are unowned.** "Declaring official ownership results in accountability, which leads to action," and "action items without clear owners are less likely to be resolved." The same holds for the document: "ideally, an owner is a single point of contact who is responsible for the postmortem, follow-up, and completion," so "it's better to have a single owner and multiple collaborators."

The incentive structure has to match. "If you reward engineers for writing postmortems, but not for closing the associated action items, you risk an unvirtuous cycle of unclosed postmortems." Google's countermeasures include twice-yearly FixIt weeks where "SREs who close the most postmortem action items receive small tokens of appreciation and (of course) bragging rights."

> [!example] What a blameful postmortem does to its own findings
> The workbook's case study is a rack decommission that went global. Google keeps proxy and cache racks in colocation facilities, called satellites; decommissioning one runs `diskerase`, which overwrites every drive. One rack's diskerase succeeded but the rest of the automation failed, so the engineers retried. On the retry, `GetMachines(satellite)` returned an empty list because the flow had already run, and "an empty list is treated as 'no filter', rather than 'act on no machines'." The filter vanished, and "within minutes, the disks of all satellite machines, globally, were erased."
>
> Users were routed to datacenters instead and saw a slight latency increase. "Thanks to good capacity planning, very few of our users noticed the issue during the two days it took us to reinstall machines." Afterward Google spent several weeks adding sanity checks "to make our decommission workflow idempotent." Three years later a similar incident drained a number of satellites, and "the action items implemented from the original postmortem dramatically reduced the blast radius and rate of the second incident." That is the practice paying out, three years late, on an incident nobody remembered.
>
> The bad postmortem written against this incident locates the root cause in a person: "dylanfour@ ignored the automation setup and ran the cluster turnup logic manually, which triggered an existing bug," compounded by "careless ignorance." Every one of those words is wrong in a specific way. The real defect is an API in which an empty filter means *everything*, plus documentation that never mentioned the hazard, which is why "most team members think it's okay to run the process multiple times if it doesn't work." A postmortem that stops at the name of the operator never reaches the API, and the API is the only part that can be fixed. Blame is unkind here, and it is also a shallower root cause.
>
> The bad version fails in three more ways worth naming. It uses **animated language** ("which is ridiculous," "I can't believe we survived this one!!!"), and "animated language and dramatic descriptions of events distract from the key message and erode psychological safety." It **omits context**, using terms like satellite and diskerase with the Background and Glossary sections left blank, so "the document might be misunderstood or even ignored" by the audience that "extends beyond the immediate team." And it **omits numbers**: duration is the only figure given, which matters because "if you don't know how to measure it, then you can't know it's fixed." Even a rough estimate beats nothing, since "a well-informed estimate is better than no data at all."

## Review, sharing, and the failure modes of the culture itself

An unshared postmortem does not compound. Google's rule is that "an unreviewed postmortem might as well never have existed," so drafts go to a group of senior engineers against criteria like: was key incident data collected, are impact assessments complete, "was the root cause sufficiently deep," is the action plan appropriate with bugs at appropriate priority, and did we share the outcome with stakeholders. Then it goes wide, "typically with the larger engineering team or on an internal mailing list," and into a repository of past incidents, because "transparent sharing makes it easier for others to find and learn from the postmortem." The bad example failed here too, shared "only among members of the team" when "by default, the document should have been accessible to everyone at the company."

Google's dissemination rituals include Postmortem of the Month in a newsletter, postmortem reading clubs where the document under discussion "is months or years old," and the Wheel of Misfortune, in which "a previous postmortem is reenacted with a cast of engineers playing roles as laid out in the postmortem," with the original incident commander attending to keep it realistic.

The culture degrades in recognizable ways, and the workbook names them:

**Avoiding association.** Engineers distancing themselves from the process is a warning sign. The overheard exchange is two SWEs saying "they'll have to write a postmortem now" and "I'm so glad I'm not involved with that." The remedy is reviewing high-visibility postmortems for blameful prose before they circulate.

**Failing to reinforce the culture.** The hardest case is a senior leader breaking it. The example is a VP saying "I know we are supposed to be blameless, but this is a safe space. Someone must have known beforehand this was a bad idea, so why didn't you listen to that person?" The suggested redirect is not confrontation but reframing, an SRE offering "maybe we ask generically if there were any warning signs we could have heeded, and why we might have dismissed them." The same technique appears in the language guidance. Instead of asking a manager "why aren't you making sure that everyone finishes the training?", which "will instantly put the recipient on the defensive," the balanced version proposes structural fixes and adds "escalation is not a sin, especially if it helps lower customer pain," then concedes the deeper point: "long term, we shouldn't really rely so much on training, as it's easy to forget in the heat of the moment."

**Lacking time to write them.** Overloaded teams write worse postmortems, and "subpar postmortems with incomplete action items make a recurrence far more likely." The line that reframes the whole exercise: "postmortems are letters you write to future team members: it's very important to keep a consistent quality bar, lest you accidentally teach future teammates a bad lesson."

**Repeating incidents.** Failures mirroring previous ones are the signal to stop treating each as an instance. Ask whether action items are taking too long to close, whether "feature velocity is trumping reliability fixes," whether "the right action items are being captured in the first place," whether the service is overdue for a [[cs/software-engineering/refactoring|refactor]], and whether "people are putting Band-Aids on a more serious problem."

One structural note for anyone running this process: "it can be easy to overlook key contributing factors to an outage when the postmortem is written in isolation or by a single team," so all incident participants should be in the authoring. And on root causes, the SRE book is careful that the singular is misleading. A root cause is "a defect in a software or human system that, if repaired, instills confidence that this event won't happen again in the same way," and "a given incident might have multiple root causes," each of which "should be repaired."

## Related Notes

- [[cs/software-engineering/observability-logging-metrics-tracing|Observability, Logging, Metrics, and Tracing]] - the telemetry a postmortem reconstructs the timeline from
- [[cs/software-engineering/continuous-delivery-and-deployment|Continuous Delivery and Deployment]] - smaller deploys and fast rollback shrink what a postmortem has to explain
- [[cs/software-engineering/technical-debt|Technical Debt]] - repeating incidents are usually debt reporting itself through the pager
- [[cs/software-engineering/code-review|Code Review]] - the other practice whose value collapses when it becomes a search for someone to blame
- [[cs/software-engineering/refactoring|Refactoring]] - the answer when the same service keeps producing the same postmortem
- [[cs/security/incident-response-lifecycle|Incident Response Lifecycle]] - the security-side process, with its own lessons-learned phase

## Sources

- "Postmortem Culture: Learning from Failure," Chapter 15, *Site Reliability Engineering*, John Lunney and Sue Lueder (ed. Gary O'Connor), Google. https://sre.google/sre-book/postmortem-culture/ . Supports the definition of a postmortem; the recur-ad-infinitum argument for a formalized learning process; the list of common postmortem triggers and the requirement to define criteria before an incident, plus any stakeholder being able to request one; postmortems as a learning opportunity rather than punishment and the cost that justifies deliberate triggering; the definition of a blameless postmortem, the good-intentions assumption, and the fear-of-punishment consequence; the origin of blameless culture in healthcare and avionics; the shift from allocating blame to investigating systematic reasons and the you-can't-fix-people line; the pointing-fingers versus blameless backend-rewrite examples; the difficulty of writing blameless postmortems, the warning against stigmatizing frequent postmortem production, and the swept-under-the-rug risk; the review criteria including whether the root cause was sufficiently deep; the no-postmortem-left-unreviewed rule and the repository/transparent-sharing practice; and the Postmortem of the Month, reading clubs, and Wheel of Misfortune activities.
- "Monitoring Distributed Systems," Chapter 6, *Site Reliability Engineering*, Rob Ewaschuk (ed. Betsy Beyer), Google. https://sre.google/sre-book/monitoring-distributed-systems/ . Supports the definition of a root cause as a defect in a software or human system that, if repaired, instills confidence the event will not happen again in the same way, and the point that a given incident might have multiple root causes, each of which should be repaired.
- "Postmortem Culture: Learning from Failure," Chapter 10, *The Site Reliability Workbook*, Daniel Rogers, Murali Suriar, Sue Lueder, Pranjal Deo, and Divya Sudhakar with Gary O'Connor and Dave Rensin, Google. https://sre.google/workbook/postmortem-culture/ . Supports the satellite rack decommission case study including diskerase, the empty-list-treated-as-no-filter API bug, the global erase within minutes, the latency impact and two-day reinstall, the several weeks of sanity checks for idempotency, and the reduced blast radius of the similar incident three years later; the bad postmortem's blameful root cause naming dylanfour@ and its "careless ignorance" wording; the critique of the bad postmortem for missing context, omitted numerical detail, animated language eroding psychological safety, missing ownership, and limited audience; the well-informed-estimate and if-you-don't-know-how-to-measure-it lines; the action item critique covering mitigative-only items, changing human behavior being less reliable than changing systems, the Dan Milstein quip, equal priorities, vague language, and untracked items; the Ben Treynor Sloss quote on postmortems without subsequent action; the reward-action-item-closeout guidance and the FixIt weeks; the blameless-language example contrasting the leading question with the balanced response including "escalation is not a sin"; the instruction to include all incident participants in authoring; and the culture failure patterns of avoiding association, failing to reinforce the culture (the VP "safe space" exchange and SRE Dana's redirect), lacking time (postmortems as letters to future team members), and repeating incidents with its diagnostic questions.
