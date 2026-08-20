---
title: DHCP and Address Assignment
description: The DORA lease cycle that hands a new device an IP address in four messages, dynamic versus static assignment, and the options that come with the lease.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-01-19
updated:
aliases:
  - DHCP
  - DORA
  - dynamic host configuration protocol
---

Plug a new laptop into a network and it works within a second: it has an address, knows its gateway, and can resolve names. Nobody typed any of that in. A protocol did it, in a short broadcast conversation that happens every time a device joins a network. Understanding that exchange explains how the modern internet stays plug-and-play despite every device needing a unique, correctly-configured [[ip-addressing-and-subnetting|IP address]].

> [!note] The idea
> DHCP is a client-server protocol that automatically hands a joining device an IP address and its supporting configuration. A new client and a server complete a four-message exchange, Discover, Offer, Request, Acknowledge, and the address comes as a time-limited lease rather than a permanent grant.

## What DHCP actually delivers

The Dynamic Host Configuration Protocol has two jobs: allocating network addresses to hosts, and delivering host-specific configuration parameters from a server to a host. It runs on a client-server model, where designated DHCP servers allocate addresses and deliver configuration to clients. The address is only the headline. The same exchange also carries the options a host needs to function: the default gateway, the domain name, the [[dns-the-domain-name-system|name servers]], and time servers. That is why one automatic conversation is enough to make a device fully operational.

## The DORA lease cycle

Allocating a new address takes four messages, commonly abbreviated DORA for discovery, offer, request, and acknowledgement:

1. **Discover.** The client broadcasts a `DHCPDISCOVER` message on its local physical subnet. It has no address yet, so it shouts to locate any available servers. The message may include options suggesting a desired address and lease duration.
2. **Offer.** Each server that hears the discover may respond with a `DHCPOFFER` carrying an available network address in the `yiaddr` field plus configuration options. Several servers can offer at once.
3. **Request.** The client broadcasts a `DHCPREQUEST` that names, via the server identifier option, the one server it selected. Broadcasting it (rather than unicasting) implicitly declines every other server's offer at the same time.
4. **Acknowledge.** The chosen server replies with `DHCPACK` containing the configuration parameters and the committed network address. The binding is now official and the client may use the address.

The client has no address of its own until step four, which is why the early messages are broadcast: there is no unicast return path to a host that is not yet addressable. When a client and server sit in different broadcast domains, a DHCP relay agent forwards these broadcasts across the boundary.

## Dynamic versus static

DHCP supports three allocation mechanisms, and the difference is who owns the address and for how long. In **dynamic allocation**, DHCP assigns an address for a limited period of time, or until the client explicitly relinquishes it. This is the lease: the address is borrowed, must be renewed before it expires, and returns to the pool otherwise. In **automatic allocation**, DHCP assigns a permanent address. In **manual allocation**, the administrator fixes the client's address and DHCP merely conveys it, which is the "static" assignment used for servers and infrastructure that must always be found at the same address.

Dynamic leasing is what lets a small pool of addresses serve a much larger, churning population of devices, because addresses in use by absent devices eventually expire and get reused.

> [!example] A phone joins the coffee-shop Wi-Fi
> The phone broadcasts `DHCPDISCOVER`. The shop's router offers `192.168.1.47` with a one-hour lease, the gateway, and a DNS server. The phone broadcasts `DHCPREQUEST` for that address, declining any other offer. The router sends `DHCPACK`, and the phone is online. Fifty minutes later it renews; leave and the lease lapses, freeing `.47` for the next customer.

> [!warning] The first conversation is unauthenticated
> Base DHCP has no built-in authentication of the server. A rogue DHCP server answering `DHCPDISCOVER` first can hand a victim a malicious gateway or DNS address, a foothold for a [[man-in-the-middle-attacks|man-in-the-middle]] position on the LAN. Defenses like DHCP snooping live in the switch, not the base protocol.

## Related Notes

- [[ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the addresses DHCP hands out
- [[nat-and-port-translation|NAT and Port Translation]] - what the private addresses DHCP assigns run behind
- [[dns-the-domain-name-system|DNS]] - the name-server address delivered as a DHCP option
- [[arp-and-mac-addressing|ARP and MAC Addressing]] - how a freshly-leased address gets mapped to hardware
- [[osi-and-tcp-ip-models|OSI and TCP/IP Models]] - where address configuration sits in the stack

## Sources

- "RFC 2131: Dynamic Host Configuration Protocol," R. Droms / RFC Editor. https://www.rfc-editor.org/rfc/rfc2131.txt . Supports DHCP's two components (address allocation and configuration delivery) on a client-server model, the four-message allocation exchange (DHCPDISCOVER broadcast to locate servers, DHCPOFFER with an address in yiaddr, DHCPREQUEST selecting one server and implicitly declining others, DHCPACK with the committed address), and the three allocation mechanisms (automatic = permanent, dynamic = limited-time lease, manual = administrator-assigned).
- "Dynamic Host Configuration Protocol," Wikipedia. https://en.wikipedia.org/wiki/Dynamic_Host_Configuration_Protocol . Supports DHCP automatically assigning IP addresses and parameters over a client-server architecture, the DORA abbreviation for the discovery/offer/request/acknowledgement stages, and options such as default gateway, domain name, name servers, and time servers.
