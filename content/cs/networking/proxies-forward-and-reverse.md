---
title: Proxies, Forward and Reverse
description: The same intermediary server, pointed two opposite directions - a forward proxy fronts clients and hides who is asking, a reverse proxy fronts servers and hides who is answering.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-06-14
updated:
aliases:
  - proxy server
  - forward proxy
  - reverse proxy
  - TLS termination proxy
---

A proxy is a middleman for requests: instead of a client connecting straight to a server, it hands the request to a proxy that carries it out on the client's behalf. That much is simple. What confuses people is that the same idea, an intermediary that relays requests, points in two opposite directions depending on whose side it is on. One kind stands in front of the clients and shields them. The other stands in front of the servers and shields them. Knowing which is which comes down to a single question: which end does it hide?

> [!note] The idea
> A proxy server is an intermediary between a client requesting a resource and the server providing it. A forward proxy is Internet-facing and used by clients to retrieve data from anywhere, hiding the client from the destination. A reverse proxy is internal-facing, a front-end that controls and protects access to servers on a private network, hiding the servers from the client. "Reverse" names the direction it fronts, and because every request funnels through that one point, the reverse proxy becomes the natural home for load balancing, TLS termination, and caching.

## The forward proxy hides the client

A forward proxy is the kind most people mean when they say "proxy." It sits between a user's machine and the wider Internet and retrieves data from a wide range of sources, in most cases anywhere on the Internet, on the client's behalf. Because the destination server sees the connection coming from the proxy rather than the user, the forward proxy can conceal the originating client. An anonymous proxy, for instance, reveals that it is a proxy but does not disclose the client's originating IP address.

This is the proxy a corporate network puts in front of its employees, or a user routes through for privacy: the server on the far side learns about the proxy, not about you. Some forward proxies append headers such as `X-Forwarded-For` to pass along the client information that would otherwise be lost, but those headers are deployment-dependent and should not be trusted blindly, since they can be absent, modified, or stacked by multiple proxies along the way.

## The reverse proxy hides the servers

A reverse proxy points the other way. It appears to clients to be an ordinary web server, but it merely forwards each request to one or more real servers behind it and returns their responses as if they came from the proxy itself, leaving the client with no knowledge of the origin server. It is installed in the vicinity of the web servers it fronts and serves a restricted set of sites, whereas a forward proxy serves clients reaching out to the whole Internet.

The payoff is that the real web servers can hide behind a firewall on an internal network, and only the reverse proxy is directly exposed to the Internet. That single exposed choke point is also what makes it hard to locate origin servers, and application-firewall features on the proxy can absorb attacks like [[load-balancing-l4-and-l7|DDoS floods]] before they reach the backends.

## The roles that pile onto a reverse proxy

Because every client request already passes through it, the reverse proxy is where a cluster of jobs naturally lands.

- **Load balancing.** It distributes incoming requests across several backend servers, often rewriting the URL of each request to match the internal location of the resource. Large sites and [[cdn-and-edge-caching|content delivery networks]] use reverse proxies together with other techniques to balance load.
- **TLS termination.** A web server may not perform [[tls-and-the-https-handshake|TLS]] encryption itself and instead offload it to a reverse proxy, which centralizes certificate management and reduces the TLS-related work on the backends. This is the TLS termination proxy.
- **Caching.** It can keep a cache of static and dynamic content, known as web acceleration, which further reduces load on the internal servers and the internal network.

> [!warning] The reverse proxy sees everything, which cuts both ways
> Because it terminates connections and can decrypt traffic, a reverse proxy can track the IP addresses of relayed requests and read or modify any non-encrypted traffic passing through it. That is exactly what lets it route, cache, and inspect. It also means anyone who compromises the proxy gains the same view. The single point that concentrates capability concentrates risk in the same place.

## Related Notes

- [[load-balancing-l4-and-l7|Load Balancing, L4 and L7]] - the request distribution a reverse proxy commonly performs
- [[cdn-and-edge-caching|CDN and Edge Caching]] - a globally distributed reverse-proxy cache in front of origin servers
- [[tls-and-the-https-handshake|TLS and the HTTPS Handshake]] - the encryption a TLS termination proxy offloads from backends
- [[nat-and-port-translation|NAT and Port Translation]] - a different intermediary that also rewrites what the far end sees

## Sources

- "Proxy server," Wikipedia. https://en.wikipedia.org/wiki/Proxy_server . Backs a proxy as an intermediary between a client requesting a resource and the server providing it; a forward proxy being Internet-facing and used to retrieve data from a wide range of sources; a reverse proxy being internal-facing, used as a front-end to control and protect access to a server on a private network and commonly performing load-balancing, authentication, decryption, and caching; reverse proxies returning responses as if from the proxy leaving the client with no knowledge of the origin; anonymous proxies hiding the client IP; and the X-Forwarded-For header being deployment-dependent and not inherently trustworthy.
- "Reverse proxy," Wikipedia. https://en.wikipedia.org/wiki/Reverse_proxy . Backs reverse proxies hiding web servers behind a firewall with only the proxy exposed, distributing load across internal servers and rewriting request URLs, caching static and dynamic content (web acceleration), offloading TLS to a TLS termination proxy, application-firewall protection against DoS/DDoS, tracking IP addresses and reading or modifying non-encrypted traffic (with the same power available to an attacker who compromises it), and the contrast that forward proxies are used when the client is restricted to a private network and fetches from the public Internet.
