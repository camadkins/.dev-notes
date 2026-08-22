---
title: Zero-Trust Architecture
description: "Why NIST SP 800-207 replaces the perimeter's implicit trust with per-request verification, and what changes when the network is assumed hostile."
draft: false
comments: true
tags:
  - cs
  - security
date: 2026-05-19
updated:
aliases:
  - zero trust
  - ZTA
  - never trust always verify
---

The old network security model was a castle: a hard perimeter of [[firewalls|firewalls]] and VPN gateways, and inside, a soft trusted zone where being *on the LAN* was itself a credential. That model fails the moment anything inside is compromised, because an attacker who breaches one internal host inherits the network's implicit trust and [[cs/forensics/flow-records-and-log-based-investigation|moves laterally]] at will. Zero trust throws out the premise that location implies trust.

> [!note] The idea
> Zero trust deletes the trusted interior. It assumes the network is already compromised and makes every single access request prove itself, verifying identity, device, and context per request, regardless of where the request comes from. NIST SP 800-207 frames it as minimizing uncertainty in "least privilege per-request access decisions" made "in the face of a network viewed as compromised."

## No trust from location

The load-bearing sentence in SP 800-207 is about what stops counting as a credential: "Zero trust assumes there is no implicit trust granted to assets or user accounts based solely on their physical or network location (i.e., local area networks versus the internet) or based on asset ownership (enterprise or personally owned)." Being [[cs/networking/vlans-and-802-1q-trunking|plugged into the corporate switch]], sitting behind the VPN, or carrying a company-issued laptop earns nothing by itself. "Authentication and authorization (both subject and device) are discrete functions performed before a session to an enterprise resource is established."

This is the inversion. The perimeter model verified you once, at the edge, and trusted you thereafter. Zero trust verifies continuously and trusts nothing by default. The document's operative definition: "Zero trust (ZT) provides a collection of concepts and ideas designed to minimize uncertainty in enforcing accurate, least privilege per-request access decisions in information systems and services in the face of a network viewed as compromised."

Two phrases in that sentence carry the whole model. "Per-request access decisions" means the unit of trust is a single request, not a session or a network segment. And "a network viewed as compromised" means the architecture is designed for the case where the attacker is already inside, which is exactly the case the perimeter model handled worst.

## Per-session, least-privilege, re-evaluated

SP 800-207 makes the granularity explicit: "Access to individual enterprise resources is granted on a per-session basis. Trust in the requester is evaluated before the access is granted." Access to one resource does not extend to the next; each is its own decision. And the grant itself is minimal: access "should also be granted with the least privileges needed to complete the task." That is [[privilege-separation-and-least-privilege|least privilege]] lifted from a single process to the whole enterprise: no request gets more authority than its immediate task requires, and that authority does not persist.

The practical consequence is a shift in where enforcement lives. Instead of a firewall at the boundary deciding what may cross, a policy engine at each resource evaluates identity, device posture, and context for every request. Strong authentication becomes central, which is why [[multi-factor-authentication|multi-factor authentication]] and device attestation are foundational to any real zero-trust deployment rather than optional add-ons.

> [!warning] Zero trust is an architecture, not a product
> SP 800-207 is deliberately abstract because zero trust is a set of principles, not a box you buy. "Never trust, always verify" is the slogan, but the standard's substance is the per-request, per-session, least-privilege discipline plus the assumption of a hostile network. A vendor appliance labeled "zero trust" that still hands out standing network-level trust after one login has kept the castle and repainted the sign.

## Related Notes

- [[firewalls|Firewalls]] - the perimeter chokepoint whose implicit-trust interior zero trust rejects
- [[multi-factor-authentication|Multi-Factor Authentication]] - the strong per-request identity proof zero trust depends on
- [[privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] - the least-privilege principle scaled to the enterprise
- [[stride-threat-modeling|STRIDE Threat Modeling]] - a way to reason about the lateral-movement threats zero trust targets
- [[kerberos-authentication|Kerberos Authentication]] - an authentication backbone that per-request verification builds on

## Sources

- "NIST Special Publication 800-207: Zero Trust Architecture." https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf . Supports zero trust assuming no implicit trust based on physical or network location or asset ownership, with authentication and authorization performed before a session; the operative definition minimizing uncertainty in least-privilege per-request access decisions in the face of a network viewed as compromised; and per-session access with trust evaluated before the grant and least privileges applied.
