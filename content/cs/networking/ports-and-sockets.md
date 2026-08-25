---
title: Ports and Sockets
description: How a single machine with one IP address runs hundreds of simultaneous conversations, using port numbers to multiplex and the socket as the endpoint a process actually holds.
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-01-19
updated:
aliases:
  - port number
  - network socket
  - five-tuple
---

An IP address gets a packet to the right machine. It does nothing to say which of the dozens of programs on that machine should receive it. A laptop might have a browser, a mail client, a chat app, and a background updater all talking to the network at once, all behind one address. Something has to sort the arriving packets among them. That something is the port number, and the object a program holds to claim a port and read from it is the socket.

> [!note] The idea
> A port is a 16-bit number that identifies one endpoint inside a host, and a socket is the operating-system object a process binds to a (protocol, address, port) endpoint. A single IP address multiplexes many conversations because each is distinguished by the full set of five values: protocol, source address, source port, destination address, destination port.

## The port: an endpoint inside a host

A port is a communication endpoint. At the software level within an operating system it is a logical construct that identifies a specific process or a type of network service. For TCP and UDP a port number is a 16-bit unsigned integer, so it ranges from 0 to 65535. The port completes the destination and origination addresses of a message within a host, pointing past the machine to a particular operating-system process.

This is what makes multiplexing possible. Ports provide a multiplexing service for multiple services or multiple communication sessions at one network address. The IP address selects the host; the port selects the conversation. Without it, one address could carry one conversation at a time.

## Well-known versus ephemeral ports

Not all port numbers are used the same way. Port numbers lower than 1024 identify the historically most commonly used services and are called the well-known port numbers: 443 for HTTPS, 22 for [[cs/security/secure-shell-ssh|SSH]], 53 for [[cs/systems/dns-the-domain-name-system|DNS]]. A server listens on a fixed well-known port so clients know where to reach a service without being told.

The client side is different. An ephemeral port is a transport-layer endpoint used for only a short period, for the duration of a communication session, allocated automatically within a predefined range by the operating system's IP stack. TCP, UDP, and SCTP typically use an ephemeral port for the client end of a client-server exchange. RFC 6335 and IANA suggest the range 49152 to 65535 for these dynamic ports, though many Linux kernels use 32768 to 60999. When the session ends the port is released and its number becomes available again. A server's port is a published address; a client's port is a disposable ticket.

## The socket: what a process actually holds

A program does not manipulate a port directly. It holds a socket: a software structure within a network node that serves as an endpoint for sending and receiving data across the network. A process associates its input and output channels with an internet socket, which in Unix-like systems is a type of [[cs/systems/system-calls-and-the-kernel-boundary|file descriptor]], tied to a transport protocol, a network address, and a port number. Fixing those together is called binding. After binding, the program reads and writes the network the same way it reads and writes a file, through the descriptor.

A socket is externally identified to other hosts by its socket address, the triad of transport protocol, IP address, and port number. That triad is why a listener on TCP port 53 and a listener on UDP port 53 are entirely distinct sockets: same address and number, different protocol.

## The 5-tuple: what identifies one connection

A listening socket has only a local address. Once it accepts a connection it also gains a remote socket address, and the connection is now pinned by both ends at once. Two clients connecting to the same server port do not collide, because they have different socket-pair tuples: the remote address or remote port differs. Combine the shared protocol with both endpoints and a connection is uniquely identified by five values, commonly called the 5-tuple: protocol, source IP, source port, destination IP, destination port. This is exactly the information [[cs/networking/nat-and-port-translation|NAT]] rewrites and the kernel keys its connection table on.

> [!example] Two tabs, one server
> A browser opens two connections to `93.184.216.34:443`. The kernel gives each its own ephemeral source port, say 51000 and 51001. Connection one is `(TCP, 192.0.2.7, 51000, 93.184.216.34, 443)`; connection two is `(TCP, 192.0.2.7, 51001, 93.184.216.34, 443)`. Same destination, same protocol, same source address: the source port alone makes the 5-tuples distinct, so replies never go to the wrong tab.

## Related Notes

- [[cs/networking/tcp-vs-udp|TCP vs UDP]] - the two transport protocols that carry port numbers
- [[cs/networking/nat-and-port-translation|NAT and Port Translation]] - rewriting ports so many hosts share one address
- [[cs/networking/tcp-three-way-handshake|The TCP Three-Way Handshake]] - what binds a client ephemeral port to a server's listening port
- [[cs/networking/ip-addressing-and-subnetting|IP Addressing and Subnetting]] - the address half of every socket

## Sources

- "Port (computer networking)," Wikipedia. https://en.wikipedia.org/wiki/Port_%28computer_networking%29 . Supports a port as a communication endpoint / logical construct identifying a process or service, the 16-bit port number (0 to 65535), ports below 1024 being well-known port numbers with higher ports for general use, ports providing multiplexing for multiple sessions at one address, and a process binding an internet socket (a file descriptor) to a protocol, address, and port.
- "Network socket," Wikipedia. https://en.wikipedia.org/wiki/Network_socket . Supports a socket as a software structure serving as an endpoint for sending and receiving data, identified by its socket address (the triad of transport protocol, IP address, and port number), TCP/UDP port 53 being distinct sockets, a connected socket also having a remote socket address, and connections being distinguished by different socket-pair tuples.
- "Ephemeral port," Wikipedia. https://en.wikipedia.org/wiki/Ephemeral_port . Supports ephemeral ports as short-lived transport ports allocated automatically for a session, typically used for the client end, with the IANA/RFC 6335 range 49152 to 65535 and the 32768 to 60999 range used by many Linux kernels.
