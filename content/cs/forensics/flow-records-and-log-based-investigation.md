---
title: Flow Records and Log-Based Investigation
description: "A flow record is a summary produced by a timer, not an observation of a conversation, and knowing which parts of it are artifacts of the metering process is the difference between an inference and a mistake."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-08-11
updated:
aliases:
  - NetFlow Forensics
  - IPFIX
---

Nobody captures every packet on a backbone link. What organizations do keep, often for months, is a compact summary: which address talked to which address, on what ports, for how long, and how many bytes moved. That is a flow record, and in a large fraction of real investigations it is the only network evidence that still exists by the time anyone starts looking.

> [!note] The idea
> A flow record is not an observation of a conversation. It is the output of a metering process whose boundaries are set by **timers and resource limits**, not by the endpoints. The record's start time, end time, and byte counts are all shaped by expiration rules, and a long connection appears as several records for reasons that have nothing to do with what the hosts did. Reading flow data correctly means reading the exporter's configuration as part of the evidence.

## What a flow is, precisely

IPFIX gives the definition the whole field now uses: "A Flow is defined as a set of packets or frames passing an Observation Point in the network during a certain time interval. All packets belonging to a particular Flow have a set of common properties."

Those properties are the flow keys, and the specification names the familiar case: "the traditional 5-tuple Flow Key of source and destination IP address, source and destination transport port, and transport protocol." Everything the record says is an aggregate over packets that matched that key. Cisco's earlier v9 specification is compatible and adds the direction: "a flow is defined as a unidirectional sequence of packets with some common properties that pass through a network device."

Unidirectional matters. A request and its response are two flows, and pairing them is an analytic step performed by the collector or the analyst, not something the exporter asserted.

The IPFIX definition also folds in a detail with real consequences: "as sampling is a Packet Treatment, this definition includes packets selected by a sampling mechanism." A flow record on a sampled exporter describes the sampled subset. It looks exactly like a full record, and its byte counts are a statistical estimate rather than a measurement. NetFlow v9 acknowledges the same reality by carrying the sample rate as configuration data, since "the Options Template FlowSet can report the sample rate of a specific interface, if sampling is supported, along with the sampling method used."

## The timers make the record

The most misread field in flow data is time, and the specification says why. A flow is "considered to be inactive if no packets belonging to the Flow have been observed at the Observation Point for a given timeout," and a record can be exported under four conditions: when the exporter detects the end of a flow, for example on a TCP FIN or RST; when the flow has been inactive past a configurable timeout; on a regular basis for long-lasting flows, because "for long-lasting Flows, the Exporter SHOULD export the Flow Records on a regular basis"; and finally, "if the Exporter experiences internal constraints, a Flow MAY be forced to expire prematurely; for example, counters wrapping or low memory."

Read those four as evidence rules. Only the first ties a record boundary to something the endpoints did. The second turns a pause into an ending. The third splits one continuous transfer into a series of records at intervals chosen by an administrator. The fourth drops boundaries wherever the device was under pressure, which is precisely when an incident is happening.

So a single long session may appear as six records, and six records do not mean six connections. A record ending does not mean a connection closed. And the duration field measures the metering interval, not the conversation. The one relation that stays solid across all of this is ordering and coexistence: these endpoints exchanged traffic during this window.

## What is lost, and what remains

Compared to [[cs/forensics/network-forensics-and-packet-capture|full capture]], flow data loses payload entirely. There is no file to extract, no command to read, no credential to recover. NIST describes the same tradeoff for the log sources that sit alongside flow data: "because these sources typically record little information about each event, the data provides little insight into the nature of the events," and "the primary value of the data is to correlate events recorded by other sources."

That last sentence is the working model. Flow data is a join key. It says which internal host talked to a known bad address at 03:14, which turns a single external indicator into a list of machines to examine, and it does so over a retention window that packet capture cannot afford. NIST also warns about the volume: "many events might be logged each day, so the sheer volume of data can be overwhelming."

What survives is the shape of communication: peers, ports, direction, timing, duration, and volume. That is enough to see a long-lived connection to an unusual destination, a transfer whose byte count dwarfs everything else that host does, or a periodic beacon. It is also the same category of information that remains visible when traffic is encrypted, which is why flow analysis absorbed so much of the work that content inspection used to do.

Note what that means legally. Records of who contacted whom, when, and for how long, without contents, are the same non-content category that [[cs/law/pen-registers-and-trap-and-trace|pen register and trap-and-trace]] doctrine addresses, and the reduced protection given to that category is one reason so much of it exists to be collected in the first place.

## The transport can lose records

Flow data is exported over a network, and export is not reliable by default. NetFlow v9 packets "are encapsulated into UDP datagrams for export to the NetFlow Collector," which means a record that the exporter generated may never reach the collector, silently, with no gap marker in the collected data. IPFIX tightened that: SCTP with the partially reliable extension "MUST be implemented by all compliant implementations," while UDP and TCP "MAY also be implemented." A deployment can still choose the lossy option, and many do.

There is a second failure mode specific to the template model. Both protocols send data records as bare field values whose meaning is defined by a separately transmitted template, and templates expire: "templates not refreshed from the Exporter within the timeout are expired at the Collector," after which "the Collector MUST NOT attempt to decode the Flow or Options Data Records with an expired Template."

An examiner should treat both as ordinary conditions rather than exotic ones. Absence in flow data is weak evidence, because the record may have been sampled away, dropped in transit, or undecodable at the collector. The same reasoning applies as with [[cs/forensics/windows-event-logs-and-user-activity|audit configuration]]: the collection system's settings are part of what the evidence means, and a report that quotes flow data without them is quoting a number whose provenance is undocumented.

> [!tip] The claim flow data supports
> "Traffic matching this key passed this observation point during this interval, as metered by this device under this configuration." Anything stronger, a specific transfer, a specific session count, an exact duration, or a confident absence, needs a second artifact from a system with different failure modes, which is usually [[cs/security/siem-and-security-logging|a host or proxy log]].

## Related Notes

- [[cs/forensics/network-forensics-and-packet-capture|Network Forensics and Packet Capture]] for the content that flow records deliberately omit.
- [[cs/law/pen-registers-and-trap-and-trace|Pen Registers and Trap and Trace]] for the legal treatment of exactly this non-content category.
- [[cs/networking/tcp-vs-udp|TCP vs UDP]] for why an unreliable export transport quietly loses records.
- [[cs/security/siem-and-security-logging|SIEM and Security Logging]] for the correlation pipeline that flow data feeds.
- [[cs/forensics/cloud-forensics-and-the-acquisition-problem|Cloud Forensics and the Acquisition Problem]] for the provider-side flow logs that replace on-premises exporters.
- [[cs/forensics/timestamps-macb-and-timeline-analysis|Timestamps, MACB, and Timeline Analysis]] for placing timer-shaped intervals against host-clock events.

## Sources

- <https://www.rfc-editor.org/rfc/rfc7011.html> for the IPFIX flow definition, flow keys, the inclusion of sampled packets, and the transport requirements.
- <https://www.rfc-editor.org/rfc/rfc3954.html> for the unidirectional flow definition, the four export conditions, UDP encapsulation, template expiry, and sample-rate reporting.
- <https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf> for the limited insight of summary sources, their volume, and their primary value as correlation material.
