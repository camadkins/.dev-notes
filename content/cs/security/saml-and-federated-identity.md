---
title: SAML and Federated Identity
description: "How SAML lets one identity provider vouch for a user to many service providers through signed XML assertions, and why a role is just which side makes the assertion versus uses it."
draft: false
comments: true
tags:
  - cs
  - security
  - web
date: 2026-02-17
updated:
aliases:
  - SAML
---

An enterprise runs a payroll app, a benefits portal, an expense tool, and a wiki, each from a different vendor. Nobody wants four passwords, and IT does not want four copies of the employee directory [[cs/systems/consistency-models|drifting out of sync]]. The fix is to let one system do the authenticating and let the others believe it. [[cs/standards/what-a-standard-actually-is|SAML is the standard]] that makes "believe it" precise enough to be safe.

> [!note] The idea
> SAML "defines an XML-based framework for describing and exchanging security information between on-line business partners." That information travels as a signed assertion: a portable statement about a user that "applications working across security domain boundaries can trust." One party proves who the user is and writes the assertion; many other parties read it and grant access. Single sign-on falls out of that arrangement rather than being bolted on.

## Two roles, one asymmetry

SAML names the participants by what they do with an assertion, not by what they are. "An asserting party is a system entity that makes SAML assertions." "A relying party is a system entity that uses assertions it has received." For web single sign-on the spec gives these the familiar names: to support single sign-on, "SAML defines the roles called identity provider (IdP) and service provider (SP)."

That is the whole indirection. The identity provider holds the credentials and authenticates the human. The service provider holds the application and holds no credentials at all. When a user reaches an SP without a session, the SP redirects the browser to the IdP; the IdP authenticates the user (against whatever [[cs/security/multi-factor-authentication|multi-factor]] policy it enforces) and hands back an assertion; the SP consumes it and opens a local session. The same IdP can vouch to a dozen SPs, so the user authenticates once and the credential store lives in exactly one place.

## What an assertion actually says

An assertion is not a blob of trust. SAML "defines three kinds of statements that can be carried within an assertion." Authentication statements "are created by the party that successfully authenticated a user" and record how and when that happened. Attribute statements "contain specific identifying attributes about the subject," for example that a user has a particular department or clearance. Authorization decision statements "define something that the subject is entitled to do." Most SSO traffic rides on authentication and attribute statements; the SP reads the attributes to decide what the user may see.

The assertion is [[cs/languages/common/serialization-and-wire-formats|signed XML]], so the SP can verify it with the IdP's key rather than calling back. That offline check is the same [[cs/security/digital-signatures|digital-signature]] property that lets a [[cs/security/json-web-tokens-jwt|JWT]] or a [[cs/security/kerberos-authentication|Kerberos]] ticket be trusted without a round trip to the issuer. SAML simply chose XML and enterprise deployment where the web later chose JSON.

## Federation is a prior agreement

The word "federated" carries the load-bearing subtlety. Two organizations do not automatically share a user just because both can speak SAML. They first agree on how to name that user across the boundary: "The user is said to have a federated identity when partners have established such an agreement on how to refer to the user." Federation, in other words, is the out-of-band trust and naming contract that has to exist before any assertion means anything. The signed XML is the mechanism; the federation agreement is the reason the receiver believes it.

> [!warning] Trust flows only as far as the agreement
> An SP accepts assertions from IdPs it has explicitly federated with, keyed to a specific signing certificate. A signature the SP cannot tie back to a trusted IdP is worthless, and a mis-scoped or over-broad federation lets one compromised IdP mint access across every SP that trusts it. The security of the whole mesh is the security of its weakest asserting party.

## Related Notes

- [[cs/security/oauth2-and-openid-connect|OAuth 2.0 and OpenID Connect]] - the JSON-era identity layer that displaced SAML for new consumer and API single sign-on
- [[cs/security/json-web-tokens-jwt|JSON Web Tokens]] - the compact signed-claims format that plays the role SAML's XML assertion plays
- [[cs/security/kerberos-authentication|Kerberos Authentication]] - the older ticket-issuing model of a central authority vouching for users
- [[cs/security/digital-signatures|Digital Signatures]] - what makes a SAML assertion verifiable without calling the issuer
- [[cs/security/multi-factor-authentication|Multi-Factor Authentication]] - the authentication strength an identity provider enforces before issuing an assertion

## Sources

- "Security Assertion Markup Language (SAML) V2.0 Technical Overview," OASIS Committee Draft 02. https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html . Supports SAML as an XML-based framework for exchanging security information between online business partners; portable assertions trusted across security-domain boundaries; the asserting-party and relying-party definitions and the identity-provider and service-provider roles for single sign-on; the three kinds of statements (authentication, attribute, authorization decision); and the definition of a federated identity as a prior agreement between partners on how to refer to a user.
