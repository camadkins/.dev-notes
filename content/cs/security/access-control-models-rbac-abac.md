---
title: "Access Control Models: RBAC and ABAC"
description: "Why NIST frames roles and access lists as special cases of attribute policy, and how role explosion is the structural pressure that pushes an organization from RBAC toward ABAC."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-04-08
updated:
aliases:
  - RBAC
  - ABAC
  - Role-Based Access Control
  - Attribute-Based Access Control
  - Access Control Models
---

Authorization has one job: given a request to do something to some resource, return yes or no. The naive implementation is an access control list, one entry per user per object, and it collapses the moment an organization has thousands of users and millions of objects. Every model past the ACL is an attempt to move the decision up a level of abstraction so the yes-or-no stops being hand-maintained per pair. Roles were the first big lift. Attributes were the next.

> [!note] The idea
> Role-Based Access Control "employs pre-defined roles that carry a specific set of privileges associated with them and to which subjects are assigned," so you grant to the role once and assign people to roles. Attribute-Based Access Control instead decides "by evaluating attributes associated with the subject, object, requested operations, and, in some cases, environment conditions against policy, rules, or relationships." NIST's sharp observation is that these are not rival philosophies but points on one scale: "ACLs and RBAC are in some ways special cases of ABAC. ACLs work on the attribute of 'identity'. RBAC works on the attribute of 'role'."

## RBAC: the indirection that tamed the ACL

RBAC's win was inserting one layer between people and permissions. Instead of granting a user access to an object directly, you grant the *role* the access and grant the *user* the role. "At the point of an access request, the access control mechanism evaluates the role assigned to the subject requesting access and the set of operations this role is authorized to perform on the object." A new hire in accounting inherits the accounting role's permissions on day one; a departure drops them just as cleanly. NIST records the historical payoff bluntly: "As the RBAC specification gained popularity, it made central management of enterprise access control capabilities possible and reduced the need for ACLs." This is the same least-authority instinct behind [[privilege-separation-and-least-privilege|least privilege]], applied to administration rather than to processes.

## Where roles run out: role explosion

The trouble is that a role is a single static label, and real authorization questions are not single or static. Consider a rule like "nurse practitioners in cardiology may view heart-patient records, but only from a hospital location and only if HIPAA training is current." A role captures "nurse practitioner." It does not capture department, location, or training recency without minting a new role for every combination. NIST names the failure mode: "RBAC does not easily support multi-factor decisions," and "RBAC role assignments tend to be based upon more static organizational positions," so encoding dynamic conditions "would require the creation of numerous roles that are ad hoc and limited in membership, leading to what is often termed 'role explosion'." Role explosion is the point where the abstraction that saved you starts costing more than the ACLs it replaced.

## ABAC: policy over attributes

ABAC dissolves the combinatorial problem by not enumerating combinations at all. It evaluates a Boolean policy over whatever attributes are available. "The key difference with ABAC is the concept of policies that express a complex Boolean rule set that can evaluate many different attributes." The nurse-practitioner rule becomes one policy: `role == nurse_practitioner AND department == cardiology AND location == on_site AND hipaa_training == current`. No new roles, and the decision tracks reality without administrative churn: "Under ABAC, access decisions can change between requests by simply changing attribute values, without the need to change the subject/object relationships defining underlying rule sets." Update the training-date attribute and access flips automatically at the next request.

That dynamism is exactly what a [[zero-trust-architecture|zero-trust]] posture needs, where each request is evaluated on current context rather than a standing grant. The cost is real: ABAC needs a trustworthy attribute-management infrastructure and machine-enforceable policy, and a wrong or stale attribute silently changes an answer.

> [!warning] Flexibility moves the risk, it does not remove it
> Under RBAC the audit question is "who is in this role?" Under ABAC it becomes "what does this policy evaluate to across every attribute source it reads?", which is harder to reason about and harder to prove compliant. NIST notes that demonstrating requirements compliance with the coarser models "is difficult and costly," but ABAC trades that for a policy surface whose correctness depends on the integrity of every attribute feeding it.

## Related Notes

- [[privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] - the principle both models exist to enforce at scale
- [[zero-trust-architecture|Zero Trust Architecture]] - the per-request, context-driven posture that leans on attribute evaluation
- [[kerberos-authentication|Kerberos Authentication]] - how a subject's identity is established before any role or attribute is checked
- [[oauth2-and-openid-connect|OAuth 2.0 and OpenID Connect]] - scoped tokens as another way to bound what a client may do
- [[stride-threat-modeling|STRIDE Threat Modeling]] - where elevation-of-privilege risks in an access model surface

## Sources

- "Guide to Attribute Based Access Control (ABAC) Definition and Considerations," NIST Special Publication 800-162. https://nvlpubs.nist.gov/nistpubs/specialpublications/NIST.SP.800-162.pdf . Supports the ABAC definition as evaluating attributes of subject, object, operations, and environment against policy; the RBAC definition of pre-defined roles carrying privileges to which subjects are assigned and the request-time role evaluation; RBAC enabling central management and reducing the need for ACLs; ACLs and RBAC as special cases of ABAC on the identity and role attributes; ABAC's Boolean rule sets over many attributes; RBAC's difficulty with multi-factor decisions and the resulting role explosion; and access decisions changing between requests by changing attribute values.
