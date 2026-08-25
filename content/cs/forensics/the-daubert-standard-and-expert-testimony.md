---
title: The Daubert Standard and Expert Testimony
description: "A 1993 opinion replaced a popularity test with a reliability test, and in doing so wrote a short list of questions about method that any technical discipline offering testimony has to be able to answer."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-08-18
updated:
aliases: []
---

The evidence in a digital investigation reaches a decision-maker through a person: an examiner who states what an artifact means. That transfer is governed not by anything in computing but by a rule of evidence and a line of cases interpreting it, and those documents ask questions about method that most technical practitioners never have to answer in their own field.

> [!note] The idea
> Daubert replaced a test of **who accepts a technique** with a test of **whether the technique is reliable**, and it located the assessment in method rather than result. The Court was explicit that the focus "must be solely on principles and methodology, not on the conclusions that they generate," which is why a procedurally unsound analysis fails even when its conclusion happens to be right, and why documenting the method is the load-bearing act in this entire section.

> [!warning] Scope
> This note describes what a rule and an opinion say. It is not legal advice, it does not state how any court would rule on any particular analysis, and it does not address the many state jurisdictions that follow a different standard.

## What the rule says

Federal Rule of Evidence 702 governs testimony by expert witnesses. Its current text conditions admission on a showing by the proponent, stating that a qualified witness "may testify in the form of an opinion or otherwise if the proponent demonstrates to the court that it is more likely than not that" four things hold.

The four are worth reading as written, because each one is a separate place an analysis can fail. First, that "the expert's scientific, technical, or other specialized knowledge will help the trier of fact to understand the evidence or to determine a fact in issue." Second, that "the testimony is based on sufficient facts or data." Third, that "the testimony is the product of reliable principles and methods." And fourth, that "the expert's opinion reflects a reliable application of the principles and methods to the facts of the case."

The third and fourth conditions are distinct, and the distinction matters to an examiner. A reliable method applied carelessly to this case fails the fourth even if it satisfies the third. [[cs/standards/ieee-1012-verification-and-validation|Validated tooling]] does not save a sloppy examination, which is the same separation that runs between [[cs/forensics/tool-validation-and-nist-cftt|tool validation]] and [[cs/forensics/forensic-soundness-and-repeatability|soundness of the process that used the tool]].

## What Daubert decided

Before 1993, federal courts widely applied the rule from Frye v. United States, under which "expert opinion based on a scientific technique is inadmissible unless the technique is" generally accepted as reliable in the relevant scientific community. Daubert v. Merrell Dow Pharmaceuticals arose from Bendectin litigation in which the plaintiffs' experts relied on animal studies, chemical structure analyses, and a reanalysis of published human statistical studies, and the lower courts held that this did not meet the general acceptance standard.

The Supreme Court held otherwise: "the Federal Rules of Evidence, not Frye, provide the standard for admitting expert scientific testimony in a federal trial." General acceptance was not abolished as a consideration, but it stopped being the gate.

In its place the Court put reliability grounded in method. To qualify as scientific knowledge, "an inference or assertion must be derived by the scientific method," and "proposed testimony must be supported by appropriate validation." The Court then tied that vocabulary directly to admissibility: the requirement that testimony pertain to scientific knowledge "establishes a standard of evidentiary reliability."

The judge does the assessing. Under the Rules, "the trial judge, pursuant to Rule 104(a), must make a preliminary assessment of whether the testimony's underlying reasoning or methodology is scientifically valid and properly can be applied to the facts at issue." The Court described the resulting posture as "a gatekeeping role for the judge," and acknowledged its cost in the same breath, noting that such a role "no matter how flexible, inevitably on occasion will prevent the jury from learning of authentic insights and innovations."

## The factors

The Court declined to write a checklist and then offered a list of considerations anyway, which is why the profession calls them the Daubert factors. The opinion summarizes them together: "whether the theory or technique in question can be (and has been) tested, whether it has been subjected to peer review and publication, its known or potential error rate, and the existence and maintenance of standards controlling its operation, and whether it has attracted widespread acceptance within a relevant scientific community."

Each is developed in the body of the opinion. On testing: "ordinarily, a key question to be answered in determining whether a theory or technique is scientific knowledge that will assist the trier of fact will be whether it can be (and has been) tested," and the Court quoted the account of scientific methodology as "generating hypotheses and testing them to see if they can be falsified," citing Popper on falsifiability and Hempel on empirical test.

On peer review, the Court was careful to keep it from becoming a new gate: "publication (which is but one element of peer review) is not a sine qua non of admissibility."

On error, the language is precise and worth quoting exactly, because it asks for something most tools do not publish: "in the case of a particular scientific technique, the court ordinarily should consider the known or potential rate of error," alongside "the existence and maintenance of standards controlling the technique's operation." Those two clauses are the legal reason a program that publishes [[cs/standards/conformance-testing-and-plugfests|tested specifications and enumerated anomalies]] exists at all, and the reason an examiner benefits from being able to state a technique's failure modes in the vocabulary of [[cs/statistics/hypothesis-testing|error rates]] rather than as an assurance of correctness.

And the summary sentence that constrains all of it: "the inquiry is a flexible one, and its focus must be solely on principles and methodology, not on the conclusions that they generate."

## What happens to weak but admissible work

Admissibility is not the end of the process, and the Court said so directly when answering the worry that loosening the gate would flood juries with junk: "vigorous cross-examination, presentation of contrary evidence, and careful instruction on the burden of proof are the traditional and appropriate means of attacking shaky but admissible evidence."

That sentence describes the environment every forensic report is written for. Getting in is not winning. An analysis that passes the gate then faces an opposing expert reading the same artifacts, and the parts that fail are the unsupported inferential steps, the undocumented handling, the tool whose behavior in this configuration was never characterized, and the conclusion stated with more confidence than the method allows.

The consequence for practice is the one this section keeps arriving at from different directions. Method, documentation, and stated uncertainty are the parts that hold up, because they are the parts the process is built to examine, and they belong in [[cs/forensics/forensic-reporting-for-an-adverse-audience|the written report]] from the start rather than being reconstructed later.

## Related Notes

- [[cs/forensics/tool-validation-and-nist-cftt|Tool Validation and NIST CFTT]] for testing, standards, and error rates as published artifacts.
- [[cs/forensics/forensic-soundness-and-repeatability|Forensic Soundness and Repeatability]] for the reliable-application half of the rule.
- [[cs/forensics/forensic-reporting-for-an-adverse-audience|Forensic Reporting for an Adverse Audience]] for how the resulting document is written.
- [[cs/forensics/chain-of-custody|Chain of Custody]] for the handling record that a gatekeeping inquiry can examine.
- [[cs/statistics/hypothesis-testing|Hypothesis Testing]] for the error-rate vocabulary the opinion asks a technique to have.
- [[cs/standards/conformance-testing-and-plugfests|Conformance Testing and Plugfests]] for the standards-controlling-operation factor in its engineering form.

## Sources

- <https://www.law.cornell.edu/rules/fre/rule_702> for the current text of Rule 702 and its four conditions.
- <https://www.law.cornell.edu/supremecourt/text/509/579> for the holding in Daubert v. Merrell Dow Pharmaceuticals, the displacement of Frye, the gatekeeping role, the enumerated considerations, and the treatment of shaky but admissible evidence.
