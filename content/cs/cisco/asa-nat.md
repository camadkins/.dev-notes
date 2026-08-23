---
title: NAT on the ASA
description: "Object NAT versus twice NAT, the three-section NAT table and its automatic ordering rules, and why an access rule that references your public address will never match."
draft: false
comments: true
tags:
  - cs
  - cisco
date: 2026-06-02
updated:
aliases:
  - ASA NAT
  - object NAT
  - twice NAT
  - manual NAT
---

Two NAT rules exist on the box, both look right, and traffic takes the wrong translation. Nothing in the configuration file explains why, because the file is not the evaluation order. The ASA sorts NAT rules into a table with its own precedence logic, and for one of the two rule types it sorts them for you, by criteria that have nothing to do with where you typed them.

> [!note] The idea
> The ASA's NAT design makes an explicit trade: object NAT is declared as a property of an address object and the box orders it deterministically for you, while twice NAT is declared as a standalone rule that you order by hand. That choice buys you the thing object NAT structurally cannot do, which is bind a source translation to a specific destination. The cost is that you now own rule order, and the sections that hold hand-ordered rules bracket the auto-ordered ones on both sides.

## Vocabulary that the commands assume

The guide is precise about two words that appear in every command. "The real address is the address that is defined on the host, before it is translated," and "the mapped address is the address that the real address is translated to." Real is not a synonym for inside: "if you configure NAT to translate outside addresses, 'real' can refer to the outside network when it accesses the inside network."

The four translation types:

- **Dynamic NAT.** "A group of real IP addresses are mapped to a (usually smaller) group of mapped IP addresses, on a first come, first served basis. Only the real host can initiate traffic."
- **[[cs/networking/nat-and-port-translation|Dynamic PAT]].** "A group of real IP addresses are mapped to a single IP address using a unique source port of that IP address."
- **Static NAT.** "A consistent mapping between a real and mapped IP address. Allows bidirectional traffic initiation."
- **Identity NAT.** "A real address is statically translated to itself, essentially bypassing NAT," used when "you want to translate a large group of addresses, but then want to exempt a smaller subset of addresses."

One detail that saves a confusing hour: "During address translation, IP addresses configured for the device interfaces are not translated."

## Object NAT

Object NAT is NAT expressed as an attribute. "All NAT rules that are configured as a parameter of a network object are considered to be network object NAT rules." You build the object, then hang the translation off it:

```
hostname(config)# object network my-range-obj
hostname(config-network-object)# range 10.2.2.1 10.2.2.10
hostname(config)# object network my-inside-net
hostname(config-network-object)# subnet 192.168.2.0 255.255.255.0
hostname(config-network-object)# nat (inside,outside) dynamic my-range-obj
```

That "configures dynamic NAT that hides the 192.168.2.0 network behind a range of outside addresses 10.2.2.1 through 10.2.2.10."

The structural limits are the reason twice NAT exists. First, **one rule per object**: "You can only define a single NAT rule for a given object." Second, and this is the one people design around without realizing it, source and destination are evaluated independently: "When a packet enters an interface, both the source and destination IP addresses are checked against the network object NAT rules. The source and destination address in the packet can be translated by separate rules if separate matches are made. These rules are not tied to each other." The consequence is stated flatly: "Because the rules are never paired, you cannot specify that sourceA/destinationA should have a different translation than sourceA/destinationB."

You also "cannot create these rules for a group object," which is why a large real-address set means many objects.

## Twice NAT

Twice NAT inverts the relationship. "You identify a network object or network object group for both the real and mapped addresses. In this case, NAT is not a parameter of the network object; the network object or group is a parameter of the NAT configuration." Because group objects are allowed for the real address, "twice NAT is more scalable."

The behavioral difference is the whole point: "A single rule translates both the source and destination. A packet matches one rule only, and further rules are not checked. Even if you do not configure the optional destination address, a matching packet still matches one twice NAT rule only." That is what lets you enforce "different translations depending on the source/destination combination."

The command carries the destination clause inline:

```
hostname(config)# nat (inside,outside) source dynamic MyInsNet NAT_POOL
destination static Server1_mapped Server1 service MAPPED_SVC REAL_SVC
```

Useful optional keywords, all from the syntax description: `unidirectional` "so the destination addresses cannot initiate traffic to the source addresses"; `inactive` "to make this rule inactive without having to remove the command," reactivated by "reentering the whole command without the `inactive` keyword"; and `description` for text "up to 200 characters."

Cisco's own default recommendation is conservative: "We recommend using network object NAT unless you need the extra features that twice NAT provides. It is easier to configure network object NAT, and it might be more reliable for applications such as Voice over IP (VoIP). (For VoIP, you might see a failure in the translation of indirect addresses that do not belong to either of the objects used in the rule.)"

## The NAT table has three sections, and you only control two

Both rule types "are stored in a single table that is divided into three sections. Section 1 rules are applied first, then section 2, and finally section 3, until a match is found. For example, if a match is found in section 1, sections 2 and 3 are not evaluated."

There is a fourth you cannot see in your configuration: "There is also a Section 0, which contains any NAT rules that the system creates for its own use. These rules have priority over all others. The system automatically creates these rules and clears xlates as needed. You cannot add, edit, or modify rules in Section 0."

| Section | Holds | Ordering |
|---|---|---|
| 0 | System-created rules | Priority over all others, not editable |
| 1 | Twice NAT (default) | First match, in configuration order |
| 2 | Object NAT | Automatic |
| 3 | Twice NAT (`after-auto`) | First match, in configuration order |

Section 1 is the default landing place for a twice NAT rule, and the warning is [[cs/security/firewalls|the standard first-match warning]] with teeth: "Because the first match is applied, you must ensure that specific rules come before more general rules, or the specific rules might not be applied as desired." Cisco defines "specific" for you: "Static rules should come before dynamic rules" and "rules that include destination translation should come before rules with source translation only."

To put a twice NAT rule in section 3 instead, "use the `after-auto` keyword," and "you can insert a rule anywhere in the applicable section using the `line` argument." Section 3 "should contain your most general rules."

## How the ASA sorts section 2 for you

This is the part worth committing to memory, because it is invisible in the configuration file. Object NAT rules are applied "in the following order: Static rules. Dynamic rules." Within each type, three tie-breakers apply in sequence:

1. "Quantity of real IP addresses, from smallest to largest. For example, an object with one address will be assessed before an object with 10 addresses."
2. "For quantities that are the same, then the IP address number is used, from lowest to highest. For example, 10.1.1.0 is assessed before 11.1.1.0."
3. "If the same IP address is used, then the name of the network object is used, in alphabetical order. For example, abracadabra is assessed before catwoman."

> [!example] The documented worked case
> Given these object NAT rules, in any configuration-file order:
>
> ```
> 192.168.1.0/24 (static)
> 192.168.1.0/24 (dynamic)
> 10.1.1.0/24   (static)
> 192.168.1.1/32 (static)
> 172.16.1.0/24 (dynamic) (object def)
> 172.16.1.0/24 (dynamic) (object abc)
> ```
>
> The ASA evaluates them in this order:
>
> ```
> 192.168.1.1/32 (static)
> 10.1.1.0/24   (static)
> 192.168.1.0/24 (static)
> 172.16.1.0/24 (dynamic) (object abc)
> 172.16.1.0/24 (dynamic) (object def)
> 192.168.1.0/24 (dynamic)
> ```
>
> Every static rule precedes every dynamic one. Inside the statics, the /32 wins on address count, then 10.1.1.0 beats 192.168.1.0 on numeric order. Inside the dynamics, two identical subnets are separated by nothing but object name, `abc` before `def`. Rename an object and you change your NAT behavior. That is a genuinely surprising coupling, and it is a good argument for a naming convention that encodes intended precedence.

## Interfaces in the rule

The `(real_ifc, mapped_ifc)` pair is positional and the parentheses are mandatory. "In routed mode, if you do not specify the real and mapped interfaces, all interfaces are used. You can also specify the keyword `any` for one or both of the interfaces, for example (any,outside)."

Bridge groups are carved out of that convenience: "the concept of 'any' interface does not apply to bridge group member interfaces. When you specify 'any' interface, all bridge group member interfaces are excluded. Thus, to apply NAT to bridge group members, you must specify the member interface." And "you cannot configure NAT for the Bridge Virtual Interface (BVI) itself, you can configure NAT for member interfaces only."

Interface PAT fallback is the `interface` keyword: "After the mapped IP addresses are used up, then the IP address of the mapped interface is used." It requires a specific mapped interface, and "you cannot specify `interface` when the mapped interface is a bridge group member."

## The interaction people get wrong

> [!warning] Access rules match the real address
> "Access rules always use the real IP addresses when determining an access rule match, even if you configure NAT." The documented case: an inside server at 10.1.1.5 mapped to 209.165.201.5 on the outside needs an inbound rule referencing "the server's real IP address (10.1.1.5), and not the mapped address (209.165.201.5)." Writing the rule against the public address produces a configuration that reads correctly to a reviewer, passes a syntax check, and never matches a packet. See [[asa-access-rules-and-acls|ASA access rules]].

> [!warning] Version scope
> Every command, keyword, and ordering rule above is taken from the ASA 9.17 firewall configuration guide. ASA NAT configuration syntax is not stable across all releases, so confirm against the configuration guide for the exact version running on your box rather than against whatever guide a search engine surfaces.

## Related Notes

- [[asa-access-rules-and-acls|ASA Access Rules and ACLs]] - real-address matching, and where NAT sits relative to the rule base
- [[asa-security-levels|ASA Security Levels]] - the interface ordering NAT rules are written against
- [[nat-and-port-translation|NAT and Port Translation]] - the protocol-level mechanics of address and port rewriting
- [[ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the address-quantity comparison the section 2 sort depends on
- [[asa-modular-policy-framework|ASA Modular Policy Framework]] - where DNS inspection, referenced by the `dns` keyword, is configured

## Sources

- Cisco, "CLI Book 2: Cisco ASA Series Firewall CLI Configuration Guide, 9.17 - Network Address Translation (NAT)." https://www.cisco.com/c/en/us/td/docs/security/asa/asa917/configuration/firewall/asa-917-firewall-config/nat-basics.html . Backs the real and mapped address definitions, the non-translation of device interface addresses, the four NAT types, the definition of object NAT as a parameter of a network object, the single-rule-per-object limit, the prohibition on group objects for object NAT, independent source and destination matching and the resulting inability to pair them, the twice NAT definition and single-rule matching, twice NAT scalability via network object groups, the recommendation to prefer object NAT and the VoIP caveat, the dynamic NAT example hiding 192.168.2.0 behind 10.2.2.1 through 10.2.2.10, the twice NAT command example, the `unidirectional`, `inactive`, and 200-character `description` keywords, the three-section NAT table with section 0, the section-by-section ordering, the specific-before-general guidance including static-before-dynamic and destination-translation-before-source-only, the `after-auto` and `line` keywords, the section 2 automatic ordering rules and the worked six-rule example, the `(real_ifc, mapped_ifc)` syntax and `any` keyword, the bridge group exclusions, and interface PAT fallback.
- Cisco, "CLI Book 2: Cisco ASA Series Firewall CLI Configuration Guide, 9.17 - Access Rules." https://www.cisco.com/c/en/us/td/docs/security/asa/asa917/configuration/firewall/asa-917-firewall-config/access-rules.html . Backs the rule that access rules always match real IP addresses even when NAT is configured, and the 10.1.1.5 / 209.165.201.5 example.
