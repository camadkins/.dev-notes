---
title: Authentication vs Authorization
description: Proving who you are and deciding what you may do are two separate steps, and the biggest access-control bugs come from doing the first and silently assuming the second.
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-02-11
updated:
aliases: []
---

The two words sound alike, get abbreviated to the same three letters minus a suffix, and sit next to each other in every login flow, so they blur together in most people's heads into one thing called "logging in." They are not one thing. They are two questions asked in sequence, about two different subjects, and answered by two different mechanisms. Keeping them apart is not pedantry. The moment you treat a passed identity check as if it were a passed permission check, you have written the most common access-control bug there is.

> [!note] The idea
> Authentication answers "who are you?" Authorization answers "what may you do?" They are ordered (you cannot decide permissions for an unknown subject) but independent (knowing who someone is tells you nothing about what they are allowed to touch). The failure mode is not mixing up the definitions, it is doing authentication once at the door and then never asking the authorization question again, so a valid identity is quietly treated as a valid permission for whatever it requests.

## Two questions, in order

[[cs/standards/what-a-standard-actually-is|NIST's glossary]] pins each term to a distinct act. Authentication is "verifying the identity of a user, process, or device, often as a prerequisite to allowing access to resources in an information system" (FIPS 200). It establishes a subject: a claimant proves possession of an authenticator, and the system now believes it knows who is making requests. [[cs/law/exceeds-authorized-access-and-van-buren|Authorization]] is a different decision entirely, "the process of granting or denying specific requests for obtaining and using information and related information processing services" (NIST SP 800-53 Rev. 5), or put as a boundary decision, "the decision to permit or deny a subject access to system objects" (NIST SP 800-162).

Read those two definitions side by side and the split is obvious. Authentication produces a *subject*. Authorization takes a subject, an action, and an object, and returns permit or deny. The output of the first is merely one of the three inputs to the second.

## Why the separation is where bugs live

Because authentication runs first and feels decisive, it is tempting to let a successful login stand in for permission. That is the error. A logged-in subject is authenticated for the whole session, but authorization is not a session-level fact, it is a decision that must be made fresh for every (subject, action, object) triple. The token in the request proves *who* is asking. It says nothing about whether *this* subject may read *that* particular record.

Skip the per-object authorization check and you get the classic broken-access-control bug: the server confirms the caller is a valid, authenticated user and then serves whatever object ID the request names, including objects belonging to someone else. The identity check passed. The permission check was never run. Nothing in a valid session prevents user A from asking for user B's data, so if the code does not explicitly ask "is this object A's to see?" it will hand it over.

> [!example] One request, two checks
> A request arrives: `GET /orders/1234` carrying user A's session token. Authentication: the token is valid and unexpired, so the caller is user A. That check passes cleanly. Authorization is a separate question the handler still has to ask: does order 1234 belong to user A? If the code stops after authentication and loads order 1234 by ID, then user A reads user B's order by changing one number in the URL. The vulnerability is not a weak password or a forged token. Authentication worked perfectly. The authorization step simply was not there.

> [!warning] Authorization is per-request, not per-login
> A subject authenticated at 9:00 is still the same subject at 9:05, but the objects they may touch, the roles they hold, and the policy that governs them can all change in between. Caching "user A is allowed" from login and reusing it defeats revocation and per-resource ownership. The permission decision belongs at the point of each action, evaluated against current policy, not inherited from the fact that a login once succeeded.

## Related Notes

- [[cs/security/access-control-models-rbac-abac|Access Control Models: RBAC and ABAC]], the models that actually answer the authorization question
- [[cs/security/multi-factor-authentication|Multi-Factor Authentication]], strengthening the authentication half
- [[cs/security/oauth2-and-openid-connect|OAuth 2.0 and OpenID Connect]], a protocol split that mirrors this one, with OIDC for authentication and OAuth for delegated authorization
- [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]], the principle that bounds what any authorized subject may do
- [[cs/security/owasp-top-10|OWASP Top 10]], where broken access control sits near the top

## Sources

- "authentication - Glossary," NIST Computer Security Resource Center. https://csrc.nist.gov/glossary/term/authentication . Supports the FIPS 200 definition of authentication as verifying the identity of a user, process, or device as a prerequisite to allowing access, and the SP 800-63 framing of a claimant proving possession of an authenticator.
- "authorization - Glossary," NIST Computer Security Resource Center. https://csrc.nist.gov/glossary/term/authorization . Supports the SP 800-53 Rev. 5 definition (granting or denying specific requests) and the SP 800-162 definition (the decision to permit or deny a subject access to system objects), establishing authorization as a distinct permit/deny decision.
