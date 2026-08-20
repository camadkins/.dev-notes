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
aliases:
  - Security
---

Security is the study of systems that keep working when someone is actively trying to break them. Everything else in engineering assumes a cooperative environment; this section drops that assumption. The notes are grouped so you can start at a foundation note and follow links down into specifics, or drop straight into whichever cluster you need.

### Foundations and threat models

Start here. These fix the vocabulary the rest of the section leans on.

- [[cia-triad|The CIA Triad]] - confidentiality, integrity, availability, and where the model strains
- [[authentication-vs-authorization|Authentication vs Authorization]] - proving who you are against deciding what you may do
- [[privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]] - shrinking what a compromise can reach
- [[zero-trust-architecture|Zero Trust Architecture]] - dropping the trusted-network assumption
- [[stride-threat-modeling|STRIDE Threat Modeling]] - enumerating threats by category before writing code
- [[the-cyber-kill-chain-and-mitre-attack|The Cyber Kill Chain and MITRE ATT&CK]] - intrusion as stages, and the observed-technique catalog
- [[owasp-top-10|The OWASP Top 10]] - the recurring application risk classes
- [[vulnerability-scoring-cve-and-cvss|Vulnerability Scoring, CVE and CVSS]] - naming and ranking weaknesses

### Cryptographic primitives

The building blocks. Learn what each primitive guarantees, and just as importantly what it does not.

- [[symmetric-vs-asymmetric-cryptography|Symmetric vs Asymmetric Cryptography]] - shared secrets against key pairs
- [[aes-and-block-ciphers|AES and Block Ciphers]] - the workhorse symmetric primitive
- [[block-cipher-modes-of-operation|Block Cipher Modes of Operation]] - turning a block cipher into a usable scheme
- [[cryptographic-hash-functions|Cryptographic Hash Functions]] - one-way, collision-resistant fingerprints
- [[message-authentication-codes-hmac|Message Authentication Codes and HMAC]] - integrity with a shared key
- [[authenticated-encryption-aead|Authenticated Encryption and AEAD]] - confidentiality and integrity in one construction
- [[cryptographically-secure-randomness|Cryptographically Secure Randomness]] - why ordinary PRNGs fail here
- [[key-derivation-functions|Key Derivation Functions]] - stretching passwords and secrets into keys
- [[diffie-hellman-and-key-exchange|Diffie-Hellman and Key Exchange]] - agreeing on a secret over a public wire
- [[digital-signatures|Digital Signatures]] - authenticity and non-repudiation
- [[elliptic-curve-cryptography|Elliptic Curve Cryptography]] - equivalent strength at smaller key sizes
- [[perfect-forward-secrecy|Perfect Forward Secrecy]] - past traffic staying safe after a key leak
- [[post-quantum-cryptography|Post-Quantum Cryptography]] - what a cryptographically relevant quantum computer would break

### Keys, certificates, and trust

Primitives are useless without an answer to "whose key is this?"

- [[pki-and-x509-certificates|PKI and X.509 Certificates]] - binding identities to public keys
- [[certificate-transparency|Certificate Transparency]] - public logs that make misissuance visible
- [[certificate-revocation-ocsp-and-crls|Certificate Revocation, OCSP and CRLs]] - undoing trust before expiry
- [[certificate-pinning|Certificate Pinning]] - narrowing the set of acceptable certificates
- [[pgp-and-the-web-of-trust|PGP and the Web of Trust]] - decentralized trust and why it stayed niche
- [[hardware-security-modules-and-key-management|Hardware Security Modules and Key Management]] - keys that never leave the boundary
- [[secure-boot-and-the-chain-of-trust|Secure Boot and the Chain of Trust]] - anchoring integrity in hardware
- [[comsec-principles|COMSEC Principles]] - communications security as an operational discipline

### Identity and access

- [[access-control-models-rbac-abac|Access Control Models, RBAC and ABAC]] - roles against attributes
- [[password-hashing-and-salting|Password Hashing and Salting]] - storing credentials that survive a database leak
- [[multi-factor-authentication|Multi-Factor Authentication]] - independent factors and their failure modes
- [[kerberos-authentication|Kerberos Authentication]] - ticket-based single sign-on
- [[oauth2-and-openid-connect|OAuth 2.0 and OpenID Connect]] - delegated authorization, and the identity layer above it
- [[saml-and-federated-identity|SAML and Federated Identity]] - assertions across organizational boundaries
- [[json-web-tokens-jwt|JSON Web Tokens]] - self-contained claims and their sharp edges
- [[webauthn-passkeys-and-fido2|WebAuthn, Passkeys and FIDO2]] - phishing-resistant public-key credentials
- [[session-management-and-secure-cookies|Session Management and Secure Cookies]] - keeping state after the login

### Web application attacks and defenses

- [[cross-site-scripting-xss|Cross-Site Scripting]] - injecting script into another origin's page
- [[cross-site-request-forgery-csrf|Cross-Site Request Forgery]] - riding an authenticated session
- [[sql-injection|SQL Injection]] - data crossing into the query language
- [[command-injection|Command Injection]] - data crossing into the shell
- [[path-traversal-and-directory-traversal|Path Traversal]] - escaping the intended directory
- [[server-side-request-forgery-ssrf|Server-Side Request Forgery]] - making the server fetch on your behalf
- [[insecure-deserialization|Insecure Deserialization]] - untrusted bytes becoming live objects
- [[clickjacking-and-ui-redressing|Clickjacking and UI Redressing]] - stealing clicks through framing
- [[same-origin-policy-and-cors|The Same-Origin Policy and CORS]] - the browser's core isolation boundary
- [[content-security-policy|Content Security Policy]] - constraining what a page may load and run
- [[hsts-and-http-security-headers|HSTS and HTTP Security Headers]] - hardening defaults over the wire
- [[subresource-integrity|Subresource Integrity]] - pinning third-party assets by hash
- [[web-application-firewalls-waf|Web Application Firewalls]] - filtering at the edge, and its limits

### Memory safety and exploitation

Where the attacker stops speaking the application's language and starts speaking the machine's.

- [[buffer-overflows|Buffer Overflows]] - writing past the end and taking control
- [[format-string-vulnerabilities|Format String Vulnerabilities]] - the format argument as an attacker primitive
- [[integer-overflow-vulnerabilities|Integer Overflow Vulnerabilities]] - arithmetic that wraps into a bad allocation
- [[use-after-free-and-heap-exploitation|Use-After-Free and Heap Exploitation]] - reusing memory the program already released
- [[return-oriented-programming|Return-Oriented Programming]] - executing code without injecting any
- [[memory-protections-aslr-dep-canaries|Memory Protections, ASLR, DEP and Canaries]] - raising the cost of exploitation
- [[control-flow-integrity|Control-Flow Integrity]] - constraining indirect transfers to legal targets
- [[race-conditions-and-toctou|Race Conditions and TOCTOU]] - the window between check and use
- [[side-channel-attacks|Side-Channel Attacks]] - leaking secrets through time, power, and cache

### Network security

- [[firewalls|Firewalls]] - policy enforcement at the network boundary
- [[ids-and-ips|IDS and IPS]] - detecting and blocking known-bad traffic
- [[vpns-and-tunneling|VPNs and Tunneling]] - carrying private traffic over a public network
- [[secure-shell-ssh|Secure Shell]] - authenticated encrypted remote access
- [[dnssec|DNSSEC]] - signing the name system
- [[email-authentication-spf-dkim-dmarc|Email Authentication, SPF, DKIM and DMARC]] - proving a message came from the domain it claims
- [[wifi-security-wpa2-wpa3|WiFi Security, WPA2 and WPA3]] - securing a shared radio medium
- [[arp-spoofing-and-lan-attacks|ARP Spoofing and LAN Attacks]] - abusing a protocol with no authentication
- [[man-in-the-middle-attacks|Man-in-the-Middle Attacks]] - sitting between two parties who think they are alone
- [[denial-of-service-and-ddos|Denial of Service and DDoS]] - attacking availability instead of secrecy
- [[port-scanning-and-network-reconnaissance|Port Scanning and Network Reconnaissance]] - mapping a target before touching it

### Operating securely

- [[penetration-testing-methodology|Penetration Testing Methodology]] - structured authorized attack
- [[fuzzing|Fuzzing]] - finding bugs by generating hostile input at volume
- [[malware-classes|Malware Classes]] - viruses, worms, trojans, ransomware, and rootkits
- [[phishing-and-social-engineering|Phishing and Social Engineering]] - attacking the human in the loop
- [[sandboxing-and-isolation|Sandboxing and Isolation]] - containing what you cannot trust
- [[siem-and-security-logging|SIEM and Security Logging]] - the evidence you need before an incident
- [[incident-response-lifecycle|The Incident Response Lifecycle]] - preparation through lessons learned

---

*The full file listing follows below, generated automatically by Quartz.*
