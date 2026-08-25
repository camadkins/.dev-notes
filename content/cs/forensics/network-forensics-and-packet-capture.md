---
title: Network Forensics and Packet Capture
description: "A full packet capture is the only artifact that shows the thing itself rather than a record about it, and every practical constraint on it points the same direction: you will not have all of it."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-07-14
updated:
aliases: []
---

Almost every artifact in this section is a record that some component chose to write. A log entry exists because a developer called a logging function. A registry key exists because an installer set it. A packet capture is different in kind. It is the traffic, copied off the wire, including bytes nobody intended to preserve and often bytes nobody intended to send.

That makes it the strongest evidence available for anything that crossed a network, and it is also why almost nobody has enough of it.

> [!note] The idea
> Full capture is the only network artifact that can answer a question the analyst did not think to ask in advance, because it retains content rather than a summary. Every operational pressure on capture, storage cost, snapshot length, filtering, and encryption, converts it back into a summary. **Network forensics is mostly the study of what a partial capture still proves**, and the honest report says which of those reductions applied.

## What a capture is

NIST describes the mechanism without ceremony. "Packet sniffers are designed to monitor network traffic on wired or wireless networks and capture packets." A normal interface accepts only frames addressed to it, so capture depends on changing that: "packet sniffers generally work by placing the NIC in promiscuous mode; the user then configures the sniffer to capture all packets or only those with particular characteristics."

The capture file is then a sequence of timestamped frames. tcpdump's manual describes writing one as "write the raw packets to file rather than parsing and printing them out," and notes that "the MIME type application/vnd.tcpdump.pcap has been registered with IANA for pcap files." The file is the evidence. The decode is an interpretation of the file produced by a tool, and that distinction matters when the decode is contested, because a reader can always go back to the bytes.

Analysis rests on reassembly. NIST notes that most sniffers are also protocol analyzers, "which means that they can reassemble streams from individual packets and decode communications that use any of hundreds or thousands of different protocols," and that they can process both live traffic and previously recorded files. Reassembly is where a capture becomes a narrative: individual frames become connections, connections become sessions, and sessions carry transferred files that can be extracted whole.

## The three reductions

**Storage.** NIST states the constraint plainly: "although logging all packets records more information about recent network activity than does logging information for connections and connection attempts, space limitations might permit packets to be kept for a short time only," and "the overhead required to record all packets might cause the system's performance to degrade." A busy link fills disks at a rate that turns retention into a budget decision, and NIST warns that during a large volume of activity, "if insufficient storage is available, information about recent activity may be overwritten and lost." The window in which an incident must be detected in order for its traffic to still exist is set by that budget.

**Snapshot length.** Capture tools can truncate each frame. tcpdump's option "snarf snaplen bytes of data from each packet rather than the default of 262144 bytes," and the manual warns that "taking smaller snapshots will discard data from protocols above the transport layer, which loses information that may be important." A capture taken with a short snapshot preserves headers and destroys payloads, which is a defensible engineering choice and a permanent evidentiary loss. Usefully, truncation is visible: truncated packets are marked in the output, so an examiner can tell the difference between traffic that carried nothing and traffic that was cut.

**Encryption.** This is the one that changed the discipline. NIST describes the effect: when protocols such as IPsec, SSH, and SSL are used, "devices monitoring network traffic along the encrypted path can see only the most basic characteristics of the traffic, such as source and destination IP addresses." Tunnels make it worse, because "the IP addresses might be for the tunnel itself and not the true source and destination of the activity."

The mitigation NIST gives is positional rather than cryptographic: "to collect data about the decrypted traffic, a data source must be positioned where it can see the decrypted activity." Capture at the endpoint or immediately behind the gateway that terminates the tunnel. On a modern network, where [[cs/systems/tls-and-the-https-handshake|TLS]] runs end to end to the internal host, NIST is blunt that "devices monitoring network traffic cannot see the decrypted packets."

What survives encryption is still substantial: endpoints, timing, direction, volume, and duration. That is the same information a [[cs/forensics/flow-records-and-log-based-investigation|flow record]] carries, which is why encryption has quietly pushed network investigation toward metadata analysis, and why a mid-path capture of an encrypted session is best described in a report as an expensive flow record.

## What a capture proves, and what it does not

A capture proves that bytes matching those frames traversed the monitored point during the capture window. That is a narrow claim, and everything past it needs support.

It does not prove which host originated the traffic, because "address mapping performed by these devices is important for network forensics" and, as NIST notes, "the apparent IP address of an attacker or a victim might actually have been used by hundreds or thousands of hosts" behind [[cs/networking/nat-and-port-translation|address translation]]. It does not prove which user acted, because a capture sees hosts. It does not prove what service was involved from the port alone, since NIST warns that "most services can be run on any port number." And it does not prove absence, because the capture point saw one path and the traffic may have taken another.

Time is its own problem. A capture's timestamps come from the capturing host's clock, which is why capture appliances are synchronized and why the offset between a capture clock and a host clock has to be established before frames and log entries can be placed on one timeline.

## Capture is an intercept

Content collection is legally distinct from record collection, and NIST raises it as the first consideration rather than a footnote: collecting traffic risks "the capture (intentional or incidental) of information with privacy or security implications, such as passwords or the contents of emails." It also warns that "long-term storage of such information might violate an organization's data retention policy," and that recording all packets sent and received by a particular user "should be initiated only after the successful completion of a formal request and approval process."

That is the operational shadow of [[cs/law/the-wiretap-act-and-interception|the statute governing interception]]: acquiring contents in transit sits under a different and more demanding regime than acquiring stored records, and an examiner who starts a full capture has started collecting contents. The same publication also flags preservation of the original: organizations copy traffic logs to central devices and analyze them with tools, so the question of which artifact is the original, and whether it was preserved unaltered, arrives immediately. Hashing the capture file at collection and treating it as an exhibit is the same discipline applied to [[cs/forensics/disk-imaging-formats-and-hashing|a disk image]], for the same reason.

## Related Notes

- [[cs/forensics/flow-records-and-log-based-investigation|Flow Records and Log-Based Investigation]] for what remains when full capture is impossible or encrypted.
- [[cs/law/the-wiretap-act-and-interception|The Wiretap Act and Interception]] for why collecting contents in transit is its own legal category.
- [[cs/systems/tls-and-the-https-handshake|TLS and the HTTPS Handshake]] for the encryption that made mid-path content capture largely useless.
- [[cs/networking/nat-and-port-translation|NAT and Port Translation]] for why an address in a capture is not a host.
- [[cs/security/ids-and-ips|Intrusion Detection and Prevention]] for the sensors that decide which traffic gets recorded at all.
- [[cs/forensics/chain-of-custody|Chain of Custody]] because a capture file is an exhibit and needs the same handling as an image.

## Sources

- <https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf> for packet sniffer operation, protocol analyzer reassembly, storage limits, encrypted traffic, address mapping, port assumptions, and the legal considerations of traffic collection.
- <https://www.tcpdump.org/manpages/tcpdump.1.html> for writing raw packets, the registered pcap MIME type, snapshot length, and what truncation discards.
