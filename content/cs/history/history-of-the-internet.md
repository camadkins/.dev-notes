---
title: History of the Internet
description: From Cold War research networks to the modern web - packet switching, TCP/IP, DNS, and the invention of the World Wide Web.
draft: false
comments: true
tags:
  - cs
  - history
date: 2026-03-12
updated:
aliases: []
---

## Intuition

The internet is not one invention - it is a stack of inventions layered over decades. It began as a US defense research project to build a communication network that could survive partial destruction, evolved into a protocol suite connecting heterogeneous networks worldwide, and was transformed by a physicist at CERN who added hyperlinks on top. Understanding the internet's history means understanding why it was designed as a decentralized, packet-switched, layered system - and why those design choices still matter.

Think of it this way: the telephone network was circuit-switched (a dedicated line for each call). The internet's founders asked, "What if we break messages into small packets, route each one independently, and let the endpoints reassemble them?" That question produced a fundamentally more resilient and flexible network.

---

## Core Idea

### Packet Switching

The foundational insight came independently from Paul Baran (RAND Corporation, 1964) and Donald Davies (NPL, UK, 1965). Instead of establishing a dedicated circuit between sender and receiver:

- Data is broken into **packets**, each carrying a destination address.
- Packets travel independently through the network, potentially along different routes.
- The destination reassembles packets in order.

Packet switching uses network capacity more efficiently than circuit switching and survives node failures gracefully - if one router goes down, packets route around it.

### ARPANET (1969)

The US Advanced Research Projects Agency (ARPA) funded the first packet-switched network. Key milestones:

- **1969**: First message sent between UCLA and Stanford Research Institute - the system crashed after transmitting "LO" (of "LOGIN").
- **1970**: ARPANET connected four nodes (UCLA, SRI, UC Santa Barbara, University of Utah).
- **1971**: Email invented by Ray Tomlinson (the `@` sign convention).
- **1973**: ARPANET goes international (connections to University College London and NORSAR in Norway).

ARPANET used the Network Control Protocol (NCP), a host-to-host protocol that assumed a single, reliable underlying network. Scaling beyond ARPANET required something more flexible.

### TCP/IP (1974–1983)

Vint Cerf and Bob Kahn designed TCP/IP to connect **different** networks - ARPANET, satellite networks, radio networks - into an **internetwork**:

- **IP (Internet Protocol)**: Handles addressing and routing. Each host gets an IP address; routers forward packets hop-by-hop toward the destination.
- **TCP (Transmission Control Protocol)**: Provides reliable, ordered, connection-oriented delivery on top of IP. Handles retransmission, flow control, and congestion control.
- **UDP**: A lighter alternative to TCP - no reliability guarantees, lower overhead, useful for real-time applications.

On January 1, 1983 ("Flag Day"), ARPANET switched from NCP to TCP/IP. This is often considered the birth of the internet as we know it.

### DNS (1983–1984)

As the network grew, remembering numeric IP addresses became impractical. Paul Mockapetris designed the **Domain Name System**:

- A distributed, hierarchical database mapping human-readable names (e.g., `mit.edu`) to IP addresses.
- Root servers, TLD servers (.com, .org, .edu), and authoritative name servers form the hierarchy.
- Caching at every level keeps the system fast despite billions of queries per day.

DNS is sometimes called "the internet's phone book," but it is really a globally distributed, eventually consistent key-value store - one of the earliest large-scale distributed systems.

### The World Wide Web (1989–1991)

Tim Berners-Lee at CERN proposed a hypertext system built on top of the internet:

- **HTML**: A markup language for documents with hyperlinks.
- **HTTP**: A stateless request-response protocol for fetching resources.
- **URLs**: A uniform addressing scheme combining protocol, host, and path.

The first website was created at CERN in late 1990 and became publicly accessible in August 1991. The web made the internet accessible to non-technical users and triggered explosive growth. Mosaic (1993) and Netscape (1994) brought graphical browsing to the mainstream.

> [!note]
> The web is not the internet. The internet is the network infrastructure (TCP/IP, routing, DNS). The web is an application layer built on top of it - just as email, FTP, and streaming are.

### From Web 1.0 to the Modern Internet

- **Mid-1990s**: The dot-com boom. E-commerce, search engines (AltaVista, Google), and the browser wars.
- **2000s**: Web 2.0 - user-generated content, social media, AJAX-driven interactivity, cloud computing.
- **2010s**: Mobile-first internet, HTTPS everywhere, CDNs, streaming dominance, IoT.
- **2020s**: Edge computing, HTTP/3 (QUIC), increasing centralization tension vs. decentralization efforts.

Throughout this evolution, the core design - packet switching, layered protocols, end-to-end principle - has remained remarkably stable.

---

## Example

**Tracing a web request through the stack:**

You type `https://example.com` into a browser. Here is what happens, layer by layer:

1. **DNS resolution**: The browser asks a DNS resolver for the IP address of `example.com`. The resolver queries root, TLD, and authoritative servers as needed, caching results.
2. **TCP connection**: The browser opens a TCP connection to the resolved IP (three-way handshake: SYN, SYN-ACK, ACK).
3. **TLS handshake**: Since the URL uses `https`, a TLS session is negotiated for encryption.
4. **HTTP request**: The browser sends `GET / HTTP/1.1` (or an HTTP/2 stream) with headers.
5. **Server response**: The server returns an HTML document with status 200.
6. **Rendering**: The browser parses HTML, fetches linked resources (CSS, JS, images) - each requiring its own DNS/TCP/HTTP cycle - and renders the page.

Every step in this chain traces back to a design decision made between 1969 and 1991. Packet switching carries the data. IP routes it. TCP ensures reliability. DNS translates the name. HTTP fetches the document. HTML structures the content.

---

## Related Notes

- [[turing-and-computability|Turing & Computability]] - the theoretical foundation underlying all networked computation
- [[von-neumann-architecture|Von Neumann Architecture]] - the machines the internet connects
- [[unix-and-open-source|Unix & Open Source]] - the OS culture that shaped internet infrastructure

## Sources

- "History of the Internet," Wikipedia. https://en.wikipedia.org/wiki/History_of_the_Internet . Supports packet switching developed independently by Paul Baran (RAND, early 1960s) and Donald Davies (NPL, 1965), the 1969 ARPANET first message between UCLA and SRI (the link crashed as the G of "LOG" was typed, after "LO" went through), Cerf and Kahn publishing TCP/IP in 1974, the ARPANET cutover to TCP/IP in January 1983, and the World Wide Web resulting from Tim Berners-Lee's work at CERN in 1989-90.
- "Ray Tomlinson," Wikipedia. https://en.wikipedia.org/wiki/Ray_Tomlinson . Supports Tomlinson writing the first network email on ARPANET in 1971 and choosing the @ sign to separate user from host.
- "Domain Name System," Wikipedia. https://en.wikipedia.org/wiki/Domain_Name_System . Supports Paul Mockapetris creating DNS in 1983 (RFC 882 and RFC 883, November 1983) as a hierarchical, distributed system mapping domain names to IP addresses.
- "Mosaic (web browser)," Wikipedia. https://en.wikipedia.org/wiki/Mosaic_%28web_browser%29 . Supports NCSA Mosaic's 1993 release popularizing graphical browsing and its developers going on to found Netscape (Navigator released 1994).
