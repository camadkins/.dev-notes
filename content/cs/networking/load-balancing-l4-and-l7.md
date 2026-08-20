---
title: Load Balancing, L4 and L7
description: "Transport-layer versus application-layer load balancing: what each layer can see, the scheduling algorithms, health checks that eject dead backends, and the session-persistence problem."
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-05-03
updated:
aliases:
  - layer 4 vs layer 7 load balancing
  - L4 vs L7
  - server load balancing
---

One server can only answer so many requests before it saturates. The standard answer is to put many identical servers behind one address and spread the work, but "spread the work" hides a real decision: which server gets the next request, and how much does the thing making that decision get to know about the request before it chooses. That question is what separates the two kinds of load balancer, and it maps cleanly onto how far up the protocol stack the balancer bothers to read.

> [!note] The idea
> A layer-4 load balancer routes on transport-layer facts alone (IP addresses and ports), forwarding a connection without reading its contents. A layer-7 load balancer reads the application-layer request (HTTP headers, URL, cookies) and can route on what the request actually asks for. Seeing more costs more work per request; the trade is visibility versus overhead.

## What each layer can see

The names come from the [[osi-and-tcp-ip-models|OSI model]]. A **layer-4 (transport) balancer**, which cloud vendors often call a network load balancer, examines IP addresses and other network information to redirect traffic. It works at the level of [[ports-and-sockets|TCP and UDP connections]]: it sees the four-tuple of source and destination IP and [[ports-and-sockets|port]], picks a backend, and forwards packets, without ever parsing what the connection carries. It is fast and content-blind, which is exactly right when every backend is interchangeable and the payload is opaque (encrypted, or a non-HTTP protocol).

A **layer-7 (application) balancer**, or application load balancer, looks at the request content, such as HTTP headers or SSL session IDs, to redirect traffic. Because it terminates the connection and reads the actual request, it can send a request for the product catalog to one server farm and a checkout request to another, route by hostname or URL path, and make decisions no L4 balancer could because an L4 balancer never sees the URL. The cost is that it must do the work of parsing (and usually of terminating [[tls-and-the-https-handshake|TLS]]) for every request.

## Scheduling algorithms: which backend next

Once a balancer has decided to forward, it needs a rule for choosing the backend. The simple algorithms are random choice, round robin, and least connections. Round robin walks the list in order: first request to the first server, next to the second, and back around. Least connections assigns each new request to the server with the fewest active connections, and can be weighted so a beefier server takes proportionally more. More sophisticated balancers fold in a server's reported load, least response times, active connection count, or geographic location. The static algorithms (round robin, plain hashing) ignore backend state and are trivial to run; the dynamic ones react to live conditions and distribute better under uneven load, at the price of tracking that state.

## Health checks: ejecting the dead

Spreading load across servers is worthless if requests keep going to a server that has crashed. A load balancer continuously polls its backends and removes failed servers from the pool, tracking up/down status through a monitoring poll, so a dead or overloaded server stops receiving traffic until it recovers. The check can be shallow (does the TCP port accept a connection) or deep (an application-layer probe that fetches a health URL and inspects the response), the latter catching a server that is listening but broken. This is also what makes the balancer a natural place to hide the backend topology: clients only ever talk to the balancer, never to the servers directly, which conceals the internal network and blocks direct attacks on back-end ports.

## Session persistence: the state problem

Spreading requests freely assumes any backend can serve any request, which breaks the moment a server keeps per-user state locally. If a user's shopping-cart data lives on server A and their next request lands on server B, the cart is gone. The clean fix is to make the backends stateless, holding session data in a shared store (a database or an in-memory cache like Memcached) so any server can serve any request. When that is not possible, the fallback is **persistence**, also called stickiness: send every request in a user's session to the same backend, keyed on client IP, a username, or a cookie. Stickiness has a real cost the note-worthy sources are blunt about: it defeats automatic failover, because when a sticky backend dies, the sessions pinned to it are lost, and client-IP stickiness is unreliable when [[nat-and-port-translation|NAT]] and proxies make many users share one apparent address.

> [!example] Same request, two balancers
> A browser sends `GET /checkout` over HTTPS. An L4 balancer sees only a TCP connection to port 443 from some IP and forwards it to whichever backend its algorithm picks; the path `/checkout` is invisible to it, buried in encrypted bytes. An L7 balancer terminates the TLS, reads `GET /checkout` and the `Host` header, and routes it specifically to the checkout server farm, perhaps pinning the user there by cookie so the rest of their session stays put.

> [!warning] The balancer must not become the single point of failure
> Putting every request through one box concentrates risk. Production load balancers are run in high-availability pairs, sometimes replicating session-persistence state, so the thing that was supposed to add resilience does not itself take the whole service down when it fails. Fronting many servers also lets the balancer absorb work like TLS termination and [[denial-of-service-and-ddos|SYN-flood]] mitigation on behalf of the backends.

## Related Notes

- [[ports-and-sockets|Ports and Sockets]] - the transport-layer identifiers an L4 balancer routes on
- [[osi-and-tcp-ip-models|OSI and TCP/IP Models]] - the layers the L4/L7 split is named after
- [[tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - the encryption an L7 balancer terminates to read the request
- [[nat-and-port-translation|NAT and Port Translation]] - why client-IP stickiness is unreliable
- [[dns-the-domain-name-system|DNS]] - round-robin DNS as a load-spreading method without a dedicated balancer
- [[denial-of-service-and-ddos|Denial of Service and DDoS]] - the flood mitigation a balancer offloads from backends

## Sources

- "Load balancing (computing)," Wikipedia. https://en.wikipedia.org/wiki/Load_balancing_%28computing%29 . Backs round robin, least connections (weighted), and random as scheduling algorithms; balancers taking into account reported load, least response times, and up/down status via a monitoring poll; the balancer polling backends for health and removing failed servers; server-side balancers hiding the backend structure; and persistence/stickiness with its loss of failover and client-address unreliability under NAT and proxies.
- "What is Load Balancing?" Amazon Web Services. https://aws.amazon.com/what-is/load-balancing/ . Backs application (layer-7) load balancers looking at request content such as HTTP headers or SSL session IDs to route traffic, and network (layer-4) load balancers examining IP addresses and other network information to redirect traffic.
