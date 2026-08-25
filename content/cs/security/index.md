---
title: Security
description: Cryptography, identity, memory safety, web attacks, network defense, and the practice of operating under adversarial pressure.
draft: false
comments: false
tags:
  - cs
  - security
date: 2026-07-18
updated:
aliases: []
---

Security is the study of systems that keep working when someone is actively trying to break them. Everything else in engineering assumes a cooperative environment; this section drops that assumption. The notes are grouped so you can start at a foundation note and follow links down into specifics, or drop straight into whichever cluster you need.

### Foundations and threat models

Start here. These fix the vocabulary the rest of the section leans on.

- [[cs/security/cia-triad|The CIA Triad]] - confidentiality, integrity, availability, and where the model strains
- [[cs/security/authentication-vs-authorization|Authentication vs Authorization]] - proving who you are against deciding what you may do
- [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] - shrinking what a compromise can reach
- [[cs/security/zero-trust-architecture|Zero Trust Architecture]] - dropping the trusted-network assumption
- [[cs/security/stride-threat-modeling|STRIDE Threat Modeling]] - enumerating threats by category before writing code
- [[cs/security/the-cyber-kill-chain-and-mitre-attack|The Cyber Kill Chain and MITRE ATT&CK]] - intrusion as stages, and the observed-technique catalog
- [[cs/security/owasp-top-10|The OWASP Top 10]] - the recurring application risk classes
- [[cs/security/vulnerability-scoring-cve-and-cvss|Vulnerability Scoring, CVE and CVSS]] - naming and ranking weaknesses

### Cryptographic primitives

The building blocks. Learn what each primitive guarantees, and just as importantly what it does not.

- [[cs/security/symmetric-vs-asymmetric-cryptography|Symmetric vs Asymmetric Cryptography]] - shared secrets against key pairs
- [[cs/security/aes-and-block-ciphers|AES and Block Ciphers]] - the workhorse symmetric primitive
- [[cs/security/block-cipher-modes-of-operation|Block Cipher Modes of Operation]] - turning a block cipher into a usable scheme
- [[cs/security/cryptographic-hash-functions|Cryptographic Hash Functions]] - one-way, collision-resistant fingerprints
- [[cs/security/message-authentication-codes-hmac|Message Authentication Codes and HMAC]] - integrity with a shared key
- [[cs/security/authenticated-encryption-aead|Authenticated Encryption and AEAD]] - confidentiality and integrity in one construction
- [[cs/security/cryptographically-secure-randomness|Cryptographically Secure Randomness]] - why ordinary PRNGs fail here
- [[cs/security/key-derivation-functions|Key Derivation Functions]] - stretching passwords and secrets into keys
- [[cs/security/diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]] - agreeing on a secret over a public wire
- [[cs/security/digital-signatures|Digital Signatures]] - authenticity and non-repudiation
- [[cs/security/elliptic-curve-cryptography|Elliptic Curve Cryptography]] - equivalent strength at smaller key sizes
- [[cs/security/perfect-forward-secrecy|Perfect Forward Secrecy]] - past traffic staying safe after a key leak
- [[cs/security/post-quantum-cryptography|Post-Quantum Cryptography]] - what a cryptographically relevant quantum computer would break

### Keys, certificates, and trust

Primitives are useless without an answer to "whose key is this?"

- [[cs/security/pki-and-x509-certificates|PKI and X.509 Certificates]] - binding identities to public keys
- [[cs/security/certificate-transparency|Certificate Transparency]] - public logs that make misissuance visible
- [[cs/security/certificate-revocation-ocsp-and-crls|Certificate Revocation, OCSP and CRLs]] - undoing trust before expiry
- [[cs/security/certificate-pinning|Certificate Pinning]] - narrowing the set of acceptable certificates
- [[cs/security/pgp-and-the-web-of-trust|PGP and the Web of Trust]] - decentralized trust and why it stayed niche
- [[cs/security/hardware-security-modules-and-key-management|Hardware Security Modules and Key Management]] - keys that never leave the boundary
- [[cs/security/secure-boot-and-the-chain-of-trust|Secure Boot and the Chain of Trust]] - anchoring integrity in hardware
- [[cs/security/comsec-principles|COMSEC Principles]] - communications security as an operational discipline

### Identity and access

- [[cs/security/access-control-models-rbac-abac|Access Control Models, RBAC and ABAC]] - roles against attributes
- [[cs/security/password-hashing-and-salting|Password Hashing and Salting]] - storing credentials that survive a database leak
- [[cs/security/multi-factor-authentication|Multi-Factor Authentication]] - independent factors and their failure modes
- [[cs/security/kerberos-authentication|Kerberos Authentication]] - ticket-based single sign-on
- [[cs/security/oauth2-and-openid-connect|OAuth 2.0 and OpenID Connect]] - delegated authorization, and the identity layer above it
- [[cs/security/saml-and-federated-identity|SAML and Federated Identity]] - assertions across organizational boundaries
- [[cs/security/json-web-tokens-jwt|JSON Web Tokens]] - self-contained claims and their sharp edges
- [[cs/security/webauthn-passkeys-and-fido2|WebAuthn, Passkeys and FIDO2]] - phishing-resistant public-key credentials
- [[cs/security/session-management-and-secure-cookies|Session Management and Secure Cookies]] - keeping state after the login

### Web application attacks and defenses

- [[cs/security/cross-site-scripting-xss|Cross-Site Scripting]] - injecting script into another origin's page
- [[cs/security/cross-site-request-forgery-csrf|Cross-Site Request Forgery]] - riding an authenticated session
- [[cs/security/sql-injection|SQL Injection]] - data crossing into the query language
- [[cs/security/command-injection|Command Injection]] - data crossing into the shell
- [[cs/security/path-traversal-and-directory-traversal|Path Traversal]] - escaping the intended directory
- [[cs/security/server-side-request-forgery-ssrf|Server-Side Request Forgery]] - making the server fetch on your behalf
- [[cs/security/insecure-deserialization|Insecure Deserialization]] - untrusted bytes becoming live objects
- [[cs/security/clickjacking-and-ui-redressing|Clickjacking and UI Redressing]] - stealing clicks through framing
- [[cs/security/same-origin-policy-and-cors|The Same-Origin Policy and CORS]] - the browser's core isolation boundary
- [[cs/security/content-security-policy|Content Security Policy]] - constraining what a page may load and run
- [[cs/security/hsts-and-http-security-headers|HSTS and HTTP Security Headers]] - hardening defaults over the wire
- [[cs/security/subresource-integrity|Subresource Integrity]] - pinning third-party assets by hash
- [[cs/security/web-application-firewalls-waf|Web Application Firewalls]] - filtering at the edge, and its limits

### Memory safety and exploitation

Where the attacker stops speaking the application's language and starts speaking the machine's.

- [[cs/security/buffer-overflows|Buffer Overflows]] - writing past the end and taking control
- [[cs/security/format-string-vulnerabilities|Format String Vulnerabilities]] - the format argument as an attacker primitive
- [[cs/security/integer-overflow-vulnerabilities|Integer Overflow Vulnerabilities]] - arithmetic that wraps into a bad allocation
- [[cs/security/use-after-free-and-heap-exploitation|Use-After-Free and Heap Exploitation]] - reusing memory the program already released
- [[cs/security/return-oriented-programming|Return-Oriented Programming]] - executing code without injecting any
- [[cs/security/memory-protections-aslr-dep-canaries|Memory Protections, ASLR, DEP and Canaries]] - raising the cost of exploitation
- [[cs/security/control-flow-integrity|Control-Flow Integrity]] - constraining indirect transfers to legal targets
- [[cs/security/race-conditions-and-toctou|Race Conditions and TOCTOU]] - the window between check and use
- [[cs/security/side-channel-attacks|Side-Channel Attacks]] - leaking secrets through time, power, and cache

### Network security

- [[cs/security/firewalls|Firewalls]] - policy enforcement at the network boundary
- [[cs/security/ids-and-ips|IDS and IPS]] - detecting and blocking known-bad traffic
- [[cs/security/vpns-and-tunneling|VPNs and Tunneling]] - carrying private traffic over a public network
- [[cs/security/secure-shell-ssh|Secure Shell]] - authenticated encrypted remote access
- [[cs/security/dnssec|DNSSEC]] - signing the name system
- [[cs/security/email-authentication-spf-dkim-dmarc|Email Authentication, SPF, DKIM and DMARC]] - proving a message came from the domain it claims
- [[cs/security/wifi-security-wpa2-wpa3|WiFi Security, WPA2 and WPA3]] - securing a shared radio medium
- [[cs/security/arp-spoofing-and-lan-attacks|ARP Spoofing and LAN Attacks]] - abusing a protocol with no authentication
- [[cs/security/man-in-the-middle-attacks|Man-in-the-Middle Attacks]] - sitting between two parties who think they are alone
- [[cs/security/denial-of-service-and-ddos|Denial of Service and DDoS]] - attacking availability instead of secrecy
- [[cs/security/port-scanning-and-network-reconnaissance|Port Scanning and Network Reconnaissance]] - mapping a target before touching it

### Operating securely

- [[cs/security/penetration-testing-methodology|Penetration Testing Methodology]] - structured authorized attack
- [[cs/security/fuzzing|Fuzzing]] - finding bugs by generating hostile input at volume
- [[cs/security/malware-classes|Malware Classes]] - viruses, worms, trojans, ransomware, and rootkits
- [[cs/security/phishing-and-social-engineering|Phishing and Social Engineering]] - attacking the human in the loop
- [[cs/security/sandboxing-and-isolation|Sandboxing and Isolation]] - containing what you cannot trust
- [[cs/security/siem-and-security-logging|SIEM and Security Logging]] - the evidence you need before an incident
- [[cs/security/incident-response-lifecycle|The Incident Response Lifecycle]] - preparation through lessons learned

---

*The full file listing follows below, generated automatically by Quartz.*
