---
title: Title 10 and Title 50 Authorities
description: "The line between a military operation and an intelligence activity is not drawn by secrecy. It is drawn by a definition, four exclusions, and a deeming clause Congress wrote in 2015."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-06
updated:
aliases:
  - Title 10 vs Title 50
  - Covert Action and Traditional Military Activity
---

In practitioner conversation "Title 10" and "Title 50" work as shorthand for two worlds: the armed forces on one side, the intelligence community on the other. The shorthand is useful and slightly misleading. In the United States Code they are two titles containing a great many unrelated provisions, and the boundary people mean is drawn in a small number of specific sections. Reading those sections shows that the boundary is not about who acts, and not about whether the action is secret. Both categories can be secret. The boundary is about which definition an activity falls into, and therefore which committees of Congress get told.

> [!note] The idea
> Secrecy does not separate covert action from clandestine military activity. Both are defined by the intent that the government's role "will not be apparent or acknowledged publicly," in nearly identical statutory language. What separates them is an exclusion. Covert action under 50 U.S.C. 3093(e) expressly does not include "traditional diplomatic or military activities," and in 2015 Congress legislated that clandestine military operations in cyberspace count as traditional military activity for exactly that purpose. One deeming clause moved an entire class of operations from the finding-and-intelligence-committee regime to the defense-committee regime.

> [!warning] Scope
> This note describes what three sections of the United States Code provide. It is not legal advice, it takes no position on the lawfulness or wisdom of any operation, and it does not describe classified authorities, executive orders, or policy documents that also govern this area.

## What Title 50 demands

Section 3093 of Title 50 is the covert action statute. Its first sentence is a prohibition on the President: he "may not authorize the conduct of a covert action by departments, agencies, or entities of the United States Government unless the President determines such an action is necessary to support identifiable foreign policy objectives of the United States and is important to the national security of the United States, which determination shall be set forth in a finding."

The finding is a document with statutory properties. Each finding "shall be in writing, unless immediate action by the United States is required and time does not permit," in which case a contemporaneous written record must be reduced to a written finding "in no event more than 48 hours after the decision is made." Findings cannot be retroactive: "a finding may not authorize or sanction a covert action, or any aspect of any such action, which already has occurred." Each finding "shall specify each department, agency, or entity of the United States Government authorized to fund or otherwise participate in any significant way in such action."

Reporting runs to the two intelligence committees. Officials "shall keep the congressional intelligence committees fully and currently informed of all covert actions," a duty the statute extends explicitly to "significant failures," and shall furnish requested material "including the legal basis under which the covert action is being or was conducted." Approved findings must be "reported in writing to the congressional intelligence committees as soon as possible after such approval and before the initiation of the covert action authorized by the finding," subject to enumerated exceptions. A separate subsection forbids a whole category outright: "No covert action may be conducted which is intended to influence United States political processes, public opinion, policies, or media."

## The definition, and the four things it is not

Subsection (e) defines the term. Covert action means "an activity or activities of the United States Government to influence political, economic, or military conditions abroad, where it is intended that the role of the United States Government will not be apparent or acknowledged publicly." Then come four exclusions: activities whose primary purpose is to acquire intelligence, traditional counterintelligence, traditional operational-security activities, or administrative activities; "traditional diplomatic or military activities or routine support to such activities"; traditional law enforcement activities; and routine support to the overt activities of other agencies abroad.

The first exclusion matters for anyone who has worked collection. Espionage is not covert action under this statute, because its primary purpose is to acquire intelligence rather than to influence conditions abroad. The second exclusion is the one that carries the weight for military cyber operations, and Congress did not leave its application to argument.

## What Title 10 answers

Section 394 of Title 10, titled "Authorities concerning military cyber operations," directs that the Secretary of Defense "shall develop, prepare, and coordinate; make ready all armed forces for purposes of; and, when appropriately authorized to do so, conduct, military cyber activities or operations in cyberspace, including clandestine military activities or operations in cyberspace, to defend the United States and its allies, including in response to malicious cyber activity carried out against the United States or a United States person by a foreign power."

Subsection (b) then affirms reach below the threshold of war. Congress affirms that those operations, when authorized, "include the conduct of military activities or operations in cyberspace short of hostilities," or in areas where hostilities are not occurring, "including for the purpose of preparation of the environment, information operations, force protection, and deterrence of hostilities." Preparation of the environment is the phrase to hold onto: gaining and maintaining access before anything is done with it is inside the affirmed authority. On the wire that work is indistinguishable from the early phases of [[cs/security/the-cyber-kill-chain-and-mitre-attack|an intrusion campaign]], and it is often indistinguishable from collection.

Subsection (c) is the pivot of the whole arrangement, and it is one sentence: "A clandestine military activity or operation in cyberspace shall be considered a traditional military activity for the purposes of section 503(e)(2) of the National Security Act of 1947 (50 U.S.C. 3093(e)(2))." Section 3093(e)(2) is the traditional-military-activities exclusion from the covert action definition. Congress reached into the Title 50 definition and placed a category of Title 10 operations outside it by statute.

The oversight consequence follows immediately. Instead of findings and intelligence committee notification, subsection (d) requires that the Secretary "brief the congressional defense committees about any military activities or operations in cyberspace, including clandestine military activities or operations in cyberspace, occurring during the previous quarter."

Subsection (f) defines the deemed category. A clandestine military activity or operation in cyberspace is one authorized by the President or the Secretary that "is marked by, held in, or conducted with secrecy, where the intent is that the activity or operation will not be apparent or acknowledged publicly," and that is carried out as part of an approved operation plan in anticipation of hostilities, or to "deter, safeguard, or defend against attacks or malicious cyber activities" against United States or Department of Defense assets, or in support of information related capabilities. Set that clause beside the covert action definition and the shared language is exact. Both turn on the government's role not being apparent or acknowledged. The categories are distinguished by purpose and by statutory bucket, not by tradecraft.

The section's own source credit dates the arrangement. It entered the code as section 130g on November 25, 2015, and was renumbered as section 394 and amended on August 13, 2018, which places the codified boundary in the period after [[cs/military-computing/stuxnet-and-cyber-physical-exploitation|Stuxnet]] made the question concrete.

## Where the command sits

Section 167b of Title 10 establishes the operational home. The President, through the Secretary of Defense, "shall establish under section 161 of this title a unified combatant command for cyber operations forces," and the principal mission of United States Cyber Command "is to direct, synchronize, and coordinate military cyberspace planning and operations to defend and advance national interests in collaboration with domestic and international partners."

That section then marks its own limit, in a subsection titled Intelligence and Special Activities. It "does not constitute authority to conduct any activity which, if carried out as an intelligence activity by the Department of Defense, would require a notice to the Select Committee on Intelligence of the Senate and the Permanent Select Committee on Intelligence of the House of Representatives under title V of the National Security Act of 1947." The command authority is drawn to stop precisely where the Title 50 notification duty would begin. Two statutes, drafted to interlock at a definition, governing operations that may run over the same access, with the same tools, against the same target. The technical description of the activity does not settle which regime applies; the authorization and purpose do, which is why the [[cs/military-computing/cyber-warfare-and-the-fifth-domain|domain framing]] and the legal framing answer different questions.

## Related Notes

- [[cs/law/cyber-operations-and-the-law-of-armed-conflict|Cyber Operations and the Law of Armed Conflict]] for the international-law layer that sits above these domestic authorities.
- [[cs/law/attribution-and-state-responsibility|Attribution and State Responsibility]] for what follows when an operation is traced back to a state.
- [[cs/law/the-wiretap-act-and-interception|The Wiretap Act and Interception]] for the domestic surveillance statutes these authorities are drafted around.
- [[cs/military-computing/cyber-warfare-and-the-fifth-domain|Cyber Warfare and the Fifth Domain]] for the doctrinal history behind the establishment of a combatant command.
- [[cs/military-computing/stuxnet-and-cyber-physical-exploitation|Stuxnet and Cyber-Physical Exploitation]] for the operation that made the categorization question unavoidable.
- [[cs/security/the-cyber-kill-chain-and-mitre-attack|The Cyber Kill Chain and MITRE ATT&CK]] because preparation of the environment and intrusion look the same when described technically.

## Sources

- <https://www.law.cornell.edu/uscode/text/50/3093> for the text of 50 U.S.C. 3093: the presidential finding requirement and its conditions, the 48-hour rule, the reporting duties to the congressional intelligence committees, the definition of covert action and its four exclusions, and the prohibition on covert action aimed at United States political processes.
- <https://www.law.cornell.edu/uscode/text/10/394> for the text of 10 U.S.C. 394: the Secretary of Defense's cyber operations authority, the affirmation of operations short of hostilities, the clause deeming clandestine military cyberspace operations traditional military activity, the quarterly briefing requirement, and the definition of a clandestine military activity in cyberspace.
- <https://www.law.cornell.edu/uscode/text/10/167b> for the text of 10 U.S.C. 167b: the establishment and principal mission of United States Cyber Command, and the subsection disclaiming authority for activities that would require intelligence committee notice.
