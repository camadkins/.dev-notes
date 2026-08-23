---
title: "Fairness as Equal Concern"
description: "The attitudinal answer to the algorithmic fairness debate: Babic and Johnson King argue unfairness is not a property of outcomes but of the unequal concern a decision-maker has for different groups, a concern that surfaces in the decision thresholds a utility function chooses, so an algorithm with no mind can still embody it."
draft: false
comments: true
tags:
  - cs
  - ethics
  - philosophy
  - ai
date: 2026-06-30
updated:
aliases:
  - fairness as equal concern
  - attitudinal account of algorithmic fairness
  - algorithmic fairness and resentment
  - unequal concern
---

Most of the algorithmic fairness debate argues about what a number means. Given [[cs/machine-learning/logistic-regression|a risk score that a model assigns to a loan applicant]] or a defendant, the statistical accounts ask whether that score carries the same meaning across groups, whether it is calibrated the same way, whether its errors fall evenly. Boris Babic and Zoë Johnson King ask a different question, one that skips the score entirely and goes to the person setting the policy: does the decision-maker care equally about the people in each group? Their claim is that unfairness lives not in the outcomes but in the unequal regard that produces them, and that outcomes are just the evidence we use to read that regard off the machine.

> [!note] The idea
> The statistical accounts (Hedden, Hellman, the [[the-impossibility-of-algorithmic-fairness|impossibility results]]) treat fairness as a property of the classifier's outputs and ask what a risk score means across groups. Babic and Johnson King pose the attitudinal question instead: is the decision-maker showing equal concern for the plight of people in different groups? On their theory fairness is a matter of relative concern, and that concern is not a hidden feeling but a measurable thing, because a decision-maker who cares less about harming one group will set a different decision threshold for it. The account rests on three pillars: Gary Becker's taste-based discrimination, Bayesian decision theory, and P. F. Strawson's quality of will. Its payoff is that it locates unfairness in a utility function, which means an algorithm with no mind at all can still be unfair.

## The threshold reveals the concern

The mechanism is the whole argument, so it is worth walking through carefully. A classifier outputs a probability, and then someone has to pick the cutoff above which that probability triggers a decision. Bayesian decision theory fixes that cutoff from the costs of the two ways a binary decision can go wrong. Take a lender deciding whether to extend a loan when the applicant repays with probability p. Let c1 be [[cs/machine-learning/evaluation-metrics|the cost of a false positive]] (lending to someone who defaults) and c2 the cost of a false negative (refusing someone who would have repaid). Maximizing [[expected-value|expected value]] means extending the loan when the expected gain beats the expected loss, and when the benefits of the two correct outcomes are set aside the decision rule collapses to a clean threshold: lend when p exceeds c1 / (c1 + c2). Babic and Johnson King derive exactly this fractile in the paper.

Read that formula backwards and it becomes a confession. The threshold is not a neutral engineering choice; it is a direct function of how the decision-maker weighs the two errors. A 50 percent threshold means c1 equals c2, the two mistakes hurt equally. An 80 percent threshold means c1 is four times c2, so a wrongful denial is being treated as only a quarter as bad as a wrongful loan. Now suppose a lender applies the 50 percent threshold to one applicant and the 80 percent threshold to another. The second applicant has to clear a much higher bar to get the same yes, and the arithmetic says why: the lender has discounted the harm of wrongly refusing them. Different thresholds for different groups is not a symptom of unequal concern that we then have to interpret. It is unequal concern, [[cs/machine-learning/loss-functions|written into the loss function]]. As the authors put it, if the threshold varies by group then the decision-maker simply has a different utility function depending on which group you belong to.

## Three pillars: preference, probability, and regard

The theory borrows one load-bearing idea from each of three traditions. From economics it takes Becker's account of discrimination as a taste. In [[social-categories-and-machine-learning|the standard economic picture]] there are two rival stories: the Phelps and Arrow model of statistical discrimination, where a decision-maker treats a group differently because of accurate beliefs about group averages under uncertainty, and Becker's taste-based model, where discrimination is a preference, an extra term the discriminator is willing to pay to satisfy. Becker's version matters here because it can explain a discriminator whose factual beliefs are entirely correct, someone who is not making a statistical inference at all but simply cares less. That is the case the statistical accounts cannot touch, and it is the case the threshold formula captures, because the weighting of errors sits in the utility function alongside Becker's taste, not in the probabilities.

From decision theory it takes the machinery that turns a preference into a number. Expected utility is the probability-weighted sum of the utilities of the outcomes, and the threshold above is what falls out when you maximize it. This is why the account can be so precise: the philosophical claim about concern and the mathematical claim about thresholds are the same claim, because [[bayesian-inference|the Bayesian apparatus]] makes the cost of an error and the placement of a threshold dual to each other. Care and cutoff are two views of one object.

From philosophy it takes Strawson's quality of will. In "Freedom and Resentment" Strawson observed how much we care whether the actions of others reflect goodwill toward us or contempt and indifference, and he argued that our reactive attitudes, resentment chief among them, are responses precisely to the quality of others' wills toward us. Resentment is what it feels like to be shown less regard than the moral demand for goodwill requires. This is the pillar that makes the account normative rather than merely descriptive. A person handed the higher threshold is receiving more than a worse deal; they are being shown systematically less concern, and Strawson's framework says that is exactly the kind of treatment that warrants resentment. The title of the paper is the argument in miniature: unequal concern is the thing resentment tracks, and the threshold is where that concern becomes visible.

## An algorithm can embody concern without a mind

The obvious objection is that Strawson's whole apparatus is about attitudes, and a classifier has no attitudes. It has no goodwill to withhold, nothing it is like to be it (compare [[could-an-llm-be-conscious|the question of machine consciousness]]), no inner state that could be contemptuous. So how can it be unfair in the sense the theory demands?

The answer is that the account never needed mental states, only a utility function. An algorithm does not feel, but it optimizes something, and that objective weights outcomes against each other exactly as a person's error costs do. A thermostat has no desire for a warm room, yet it acts to hold the temperature at seventy degrees because that setpoint is written into what it minimizes. In the same bloodless way, if a classifier's objective function treats one group's wrongful rejections as less costly than another's, it will place a higher threshold on that group, and the unequal concern is fully present with no feeling anywhere in the system. Babic and Johnson King make this move deliberately: by locating fairness in the utility function rather than in a mind, they let the Strawsonian diagnosis reach the machine. The person who deploys the system, and the system itself as a bearer of that person's weighted objective, can both be read for the concern they show, because the concern is a number and the number is on the page.

> [!example] Two applicants, one lender
> 1. **Same threshold, equal concern.** Adela and John both need the probability of repayment to clear 50 percent to get the loan. Here c1 equals c2: a wrongful loan and a wrongful denial are treated as equally bad for each of them. The lender is weighing both people's potential losses the same way.
> 2. **A higher bar for one group.** John's requests are now judged against an 80 percent threshold while Adela's stay at 50 percent. By the formula, John's false-negative cost c2 has been quartered relative to his false-positive cost. The harm of wrongly refusing John has been marked down, and nothing about John's actual repayment probability changed to justify it.
> 3. **What the numbers say.** The gap in thresholds is not evidence pointing at unequal concern; it is the unequal concern, expressed. On Strawson's account John can legitimately resent it, because he is being shown less regard than the demand for goodwill requires.
> 4. **No mind required.** Replace the lender with a scoring algorithm whose objective weights John's wrongful rejections at a quarter of Adela's. The thresholds diverge for the same reason, and the unfairness is located without attributing a single feeling to the machine.

## Related Notes

- [[the-impossibility-of-algorithmic-fairness|The Impossibility of Algorithmic Fairness]], the statistical accounts this theory answers, which ask what a risk score means rather than what concern produced it
- [[social-categories-and-machine-learning|Social Categories and Machine Learning]], where taste-based and statistical discrimination sit in the broader picture of grouping people by category
- [[bayesian-inference|Bayesian Inference]], the decision-theoretic machinery that makes error costs and decision thresholds two views of the same object
- [[expected-value|Expected Value]], the quantity a rational decision-maker maximizes, whose maximization yields the threshold formula
- [[could-an-llm-be-conscious|Could an LLM Be Conscious?]], the companion question of whether a machine has any inner life, which this account is built to not require

## Sources

- Boris Babic and Zoë Johnson King, "Algorithmic fairness and resentment," Philosophical Studies 182(1), 87-119, 2025. Author PDF: https://borisbabic.com/research/afr.pdf . Journal: https://link.springer.com/article/10.1007/s11098-023-02006-5 . Supports the thesis that fairness is a decision-maker's relative concern for people in different groups rather than a property of outcomes; that this concern manifests as a difference in decision thresholds; the derivation that with the benefit terms set to zero the threshold is t = c1 / (c1 + c2), where c1 is the cost of a false positive and c2 the cost of a false negative, so a value-free threshold has c1 = c2; the explicit grounding in Becker's taste-based discrimination, Bayesian decision theory, and Strawson's "quality of will"; the contrast with the Phelps and Arrow statistical theory of discrimination; and the point that discriminatory attitudes are located in the utility function rather than requiring "contentful mental states."
- "Taste-based discrimination," Wikipedia. https://en.wikipedia.org/wiki/Taste-based_discrimination . Supports Becker's 1957 model of discrimination as a preference employers are willing to pay a financial penalty to satisfy, unrelated to actual worker productivity, and its status as one of the two leading explanations of labor-market discrimination alongside statistical discrimination.
- "Moral Responsibility," Stanford Encyclopedia of Philosophy. https://plato.stanford.edu/entries/moral-responsibility/ . Supports Strawson's "Freedom and Resentment," the importance we attach to whether others' actions reflect goodwill or contempt toward us, and the claim that our reactive attitudes such as resentment are responses "to the quality of others' wills towards us."
- "Expected utility hypothesis," Wikipedia. https://en.wikipedia.org/wiki/Expected_utility_hypothesis . Supports the definition of expected utility as the probability-weighted sum of the utilities of the outcomes, U(p) = sum of u(x_k) times p_k.
- "Bayes estimator," Wikipedia. https://en.wikipedia.org/wiki/Bayes_estimator . Supports the general result that under an asymmetric linear loss with penalties a and b the optimal estimate is the a/(a+b) quantile, the decision-theoretic form of the threshold-from-relative-error-costs relationship used in the note.
