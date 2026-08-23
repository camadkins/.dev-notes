---
title: Riley, Carpenter, and the Fourth Amendment Online
description: "Two opinions four years apart moved digital data out from under doctrines built for physical objects and business records, and the second one carved a hole in the third-party doctrine while insisting it was leaving the doctrine standing."
draft: false
comments: true
tags:
  - cs
  - law
date: 2026-08-16
updated:
aliases:
  - Riley v. California
  - Carpenter v. United States
  - Get a Warrant
---

For most of the twentieth century, Fourth Amendment law worked by analogy to physical things. A pocket is like a container. A record held by a company is like a ledger. Digital systems break the analogies in one specific way: they change the quantity of information a single object holds and the span of time a single record set covers. Two Supreme Court decisions, in 2014 and 2018, address exactly that break, and both end with the same four words.

> [!note] The idea
> Riley and Carpenter share one mechanism: **quantity becomes a difference in kind**. A search that would be trivially permitted at small scale is treated differently once the object searched holds everything, or once the record set covers everyone continuously. That is a scaling argument applied to a constitutional test, and it is the closest thing American search law has to an account of aggregation.

> [!warning] Scope
> This note describes what two Supreme Court opinions held and quotes their text. It is not legal advice, it does not tell you what process applies to any particular category of data, and both opinions expressly left adjacent questions open.

## Riley: the phone is not a container

Riley v. California, argued April 29, 2014 and decided June 25, 2014, consolidated two cases about searches of phones seized during arrest. Chief Justice Roberts framed the question as "whether the police may, without a warrant, search digital information on a cell phone seized from an individual who has been arrested."

The existing rule permitted searching items found on an arrestee, and the government argued that a phone was such an item. The Court declined the analogy. Its answer to whether a phone search was materially indistinguishable from searching a wallet: "that is like saying a ride on horseback is materially indistinguishable from a flight to the moon."

The reasoning is a description of the device rather than of the law, and it is unusually well observed. "The term 'cell phone' is itself misleading shorthand; many of these devices are in fact minicomputers that also happen to have the capacity to be used as a telephone." A reader of [[cs/history/smartphone-computing-and-arm|the history of smartphone computing]] will recognize the claim as literally accurate rather than rhetorical.

Then the scaling argument, in three steps. Capacity: sixteen gigabytes "translates to millions of pages of text, thousands of pictures, or hundreds of videos." Combination: "a cell phone collects in one place many distinct types of information" that "reveal much more in combination than any isolated record." Duration: the data can date back to the purchase of the device. And a fourth observation the Court sets apart: "finally, there is an element of pervasiveness that characterizes cell phones but not physical records," because prior to the digital age people did not carry a cache of sensitive personal information with them through the day.

The Court also noticed that the container framing collapses for remote data. The data a user views "may not in fact be stored on the device itself," and the container analogy "crumbles entirely when a cell phone is used to access data located elsewhere, at the tap of a screen." That is a Supreme Court opinion observing that the boundary of the object being searched is not where the object physically is.

The holding: "we therefore decline to extend Robinson to searches of data on cell phones, and hold instead that officers must generally secure a warrant before conducting such a search." And the closing line, which is the one people remember: phones hold for many Americans "the privacies of life," and "the fact that technology now allows an individual to carry such information in his hand does not make the information any less worthy of the protection for which the Founders fought. Our answer to the question of what police must do before searching a cell phone seized incident to an arrest is accordingly simple," followed by four words: get a warrant.

## Carpenter: the record set is not a ledger

Carpenter v. United States was decided June 22, 2018. Investigators obtained historical cell-site location information for a robbery suspect using a court order under [[cs/law/the-stored-communications-act|the Stored Communications Act]] rather than a warrant. "The Government was able to obtain 12,898 location points cataloging Carpenter's movements over 127 days," which the opinion works out to "an average of 101 data points per day."

The government's argument was a straight application of [[cs/law/the-third-party-doctrine|the third-party doctrine]]: the records belong to the carrier, the subscriber conveyed his location to it by using the phone, and Smith and Miller therefore control. The Court disagreed about what kind of request that was. "There is a world of difference between the limited types of personal information addressed in Smith and Miller and the exhaustive chronicle of location information casually collected by wireless carriers today," and so "the Government thus is not asking for a straightforward application of the third-party doctrine, but instead a significant extension of it to a distinct category of information."

The distinguishing move is careful. Smith and Miller "did not rely solely on the act of sharing," the Court said; they also considered the nature of the documents sought. A pen register had limited capabilities, and a check was a commercial instrument, while cell-site records carry no comparable limitation on their revealing nature. The doctrine survives; its premise about thin data does not hold here.

Two features of the data carried the argument. The first is retrospection: "the Government can now travel back in time to retrace a person's whereabouts, subject only to the retention polices of the wireless carriers," which the opinion states currently maintain records for up to five years. The second is universality: because location is logged for every device rather than only for people under investigation, the capability runs against everyone, and "only the few without cell phones could escape this tireless and absolute surveillance." The case, the Court said, "is about a detailed chronicle of a person's physical presence compiled every day, every moment, over several years."

Having found a search, the Court addressed process. "We also conclude that the Government must generally obtain a warrant supported by probable cause before acquiring such records." The statutory standard was not enough: the Stored Communications Act required only reasonable grounds to believe the records were relevant and material, and "that showing falls well short of the probable cause required for a warrant." Therefore "an order issued under Section 2703(d) of the Act is not a permissible mechanism for accessing historical cell-site records." The obligation, the Court said, "is a familiar one," and then repeated Riley's four words.

## What Carpenter did not do

The opinion spends a paragraph limiting itself, and reading it as a general repudiation of the third-party doctrine is the most common mistake made about it.

> Our decision today is a narrow one. We do not express a view on matters not before us: real-time CSLI or "tower dumps" (a download of information on all the devices that connected to a particular cell site during a particular interval).

And more pointedly: "we do not disturb the application of Smith and Miller or call into question conventional surveillance techniques and tools, such as security cameras." The Court also declined to address other business records that incidentally reveal location, and expressly did not consider collection techniques involving foreign affairs or national security. The reason given for the restraint is a quotation from Justice Frankfurter: "the Court must tread carefully in such cases, to ensure that we do not embarrass the future."

So the ledger reads like this. Carpenter created an exception for one category of records, historical cell-site location information, covering a period long enough to be a chronicle. It left Smith and Miller formally intact for the categories they decided, and said nothing about the many categories sitting between them, which is why the years since have produced litigation about which new data types are Carpenter-like and which are Smith-like. Section 2703(d) still exists and still names the same standard; what changed is that one category of records may no longer be obtained under it. A reader of [[cs/geopolitics/surveillance-and-privacy|the surveillance and privacy arguments]] will recognize the shape: a constitutional decision that removes one item from a menu rather than rewriting the menu.

## The through-line

Both opinions refuse an analogy on the ground that scale has changed the object. Riley refuses to treat a device holding a life as a cigarette pack. Carpenter refuses to treat four months of continuous positioning as a bank ledger. Neither announces a general theory of aggregation, and the Court has been explicit that it is not trying to. What they establish is that the quantity of data a technology makes available is a fact the Fourth Amendment analysis has to account for, which is a modest-sounding proposition with large consequences for anyone designing a system that retains anything.

## Related Notes

- [[cs/law/the-third-party-doctrine|The Third-Party Doctrine]] for the doctrine Carpenter declined to extend.
- [[cs/law/the-stored-communications-act|The Stored Communications Act]] for the order Carpenter held insufficient.
- [[cs/law/pen-registers-and-trap-and-trace|Pen Registers and Trap and Trace]] for the prospective regime built on Smith.
- [[cs/history/smartphone-computing-and-arm|Smartphone Computing and the ARM Processor]] because Riley's minicomputer description is accurate about the hardware.
- [[cs/geopolitics/surveillance-and-privacy|Surveillance and Privacy]] for the aggregation argument in non-legal form.
- [[cs/security/side-channel-attacks|Side-Channel Attacks]] for the technical version of the metadata-leaks claim.

## Sources

- <https://www.law.cornell.edu/supremecourt/text/13-132> for Riley v. California: dates, question presented, the device and capacity passages, the holding, and the closing instruction.
- <https://www.supremecourt.gov/opinions/17pdf/16-402_h315.pdf> for Carpenter v. United States: the date, the record volume, the third-party doctrine discussion, the warrant holding, and the narrowness paragraph.
- <https://www.law.cornell.edu/uscode/text/18/2703> for the statutory standard Carpenter measured against probable cause.
