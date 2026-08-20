---
title: TCP Congestion Control
description: "Slow start, congestion avoidance, and fast retransmit/recovery: how a TCP sender probes for bandwidth it cannot see and backs off the instant loss says the network is full."
draft: false
comments: true
tags:
  - cs
  - networking
date: 2026-06-07
updated:
aliases:
  - slow start
  - congestion avoidance
  - AIMD
---

A TCP sender cannot see the network. It has no meter for how much bandwidth sits between it and the receiver, no readout of the queues filling up in routers along the way. All it gets back are acknowledgments. From that thin signal it has to guess how fast to send: too slow and it wastes capacity, too fast and it drowns a router's queue and triggers the very loss it was trying to avoid. Congestion control is the set of algorithms that turn returning ACKs into a running estimate of how hard the sender can push.

> [!note] The idea
> TCP keeps a congestion window that limits how much unacknowledged data it will put on the wire, grows that window while ACKs keep coming, and shrinks it hard the moment loss appears. Loss is read as the network's only honest signal that it is full, so the classic response is additive increase, multiplicative decrease: creep up, then halve on trouble.

RFC 5681 defines TCP's four intertwined congestion control algorithms: slow start, congestion avoidance, fast retransmit, and fast recovery. The first two decide how the window grows; the last two decide how it recovers from loss without falling back to zero.

## The congestion window and its threshold

Two state variables run the whole scheme. The congestion window (cwnd) is a sender-side limit on the amount of data the sender can transmit into the network before receiving an acknowledgment. The receiver also advertises its own window (rwnd), and the minimum of cwnd and rwnd governs data transmission, so the sender is always throttled by whichever limit is tighter: what the receiver can hold, or what the sender believes the network can carry.

A second variable, the slow start threshold (ssthresh), decides which growth mode is active. The slow start algorithm is used when cwnd is below ssthresh, and congestion avoidance takes over when cwnd is above it. ssthresh is the sender's memory of roughly where trouble started last time.

## Slow start: probing an unknown network

Beginning transmission into a network with unknown conditions requires TCP to slowly probe the network to determine the available capacity, so as to avoid congesting it with an inappropriately large burst of data. Despite the name, slow start ramps up quickly. During slow start, a TCP increments cwnd by at most one sender maximum segment size for each ACK received that cumulatively acknowledges new data. Because every acknowledged segment adds another segment's worth of window, the window roughly doubles each round trip. That is exponential growth used deliberately: start cautious, find the ceiling fast.

## Congestion avoidance: creeping toward the limit

Once cwnd passes ssthresh, the sender assumes it is near the network's real capacity and switches to a gentler climb. During congestion avoidance, cwnd is incremented by roughly one full-sized segment per round-trip time. This is the additive increase half of AIMD: one segment per RTT, a slow linear probe upward, feeling for the edge of congestion rather than charging at it.

## When loss happens

Loss is the signal, and TCP detects it two ways with two different reactions.

A retransmission timeout is the severe case: an expected ACK never arrives. The sender sets ssthresh to no more than half the flight size (bounded below by two segments), collapses cwnd to one full-sized segment, and re-enters slow start to climb back up to the new ssthresh, at which point congestion avoidance again takes over. A timeout is read as a network that may have badly congested, so the sender nearly starts over.

The milder case is caught by fast retransmit. A TCP receiver sends a duplicate ACK whenever an out-of-order segment arrives. The fast retransmit algorithm uses the arrival of three duplicate ACKs as an indication that a segment has been lost, and retransmits what appears to be the missing segment without waiting for the retransmission timer to expire. Waiting for a timer would waste an entire timeout interval; three duplicate ACKs are strong enough evidence to act immediately.

After the retransmit, the fast recovery algorithm governs transmission of new data until a non-duplicate ACK arrives. The reason for not dropping back to slow start is subtle: each duplicate ACK means a later segment did arrive at the receiver, so segments are still leaving the network, and the ACK clock is preserved. The sender keeps transmitting new data, just with a reduced cwnd, because loss is still an indication of congestion. This pairing of fast retransmit and fast recovery is the difference between the old TCP Tahoe (collapse to slow start on every loss) and TCP Reno (halve and keep going).

> [!example] A sawtooth
> Slow start doubles cwnd each RTT until it crosses ssthresh, then congestion avoidance adds one segment per RTT, a slow rising line. Three duplicate ACKs arrive: fast retransmit resends the lost segment, fast recovery halves cwnd, and the linear climb resumes from the lower window. Plotted over time, cwnd is a sawtooth: gentle rises, sharp cuts, forever probing for a ceiling that keeps moving.

## Beyond Reno: CUBIC and BBR

Classic AIMD ties the sending rate to loss events, which behaves poorly on fast, long-distance links where the window must grow enormous. CUBIC replaces the linear increase with a window that is a cubic function of time since the last congestion event, with the inflection point set at the window size just before that event; it has been the Linux default since kernel 2.6.19. BBR, developed at Google in 2016, breaks with the loss-based tradition entirely: rather than waiting for packet loss, it builds a model of the network from the maximum bandwidth and round-trip time it has measured, and paces itself against that model. Loss-based control asks "have I broken something yet?"; BBR tries to estimate the pipe directly and stay just under it.

## Related Notes

- [[tcp-three-way-handshake|The TCP Three-Way Handshake]] - where the connection and its initial window are established
- [[tcp-vs-udp|TCP vs UDP]] - UDP has none of this, and skipping congestion control carelessly can harm the network
- [[http-evolution-1-1-to-3|HTTP Evolution]] - QUIC reimplements congestion control in user space over UDP
- [[mtu-and-fragmentation|MTU and Fragmentation]] - the segment size the window is counted in

## Sources

- "RFC 5681: TCP Congestion Control," M. Allman, V. Paxson, E. Blanton / RFC Editor. https://www.rfc-editor.org/rfc/rfc5681.txt . Supports the four algorithms (slow start, congestion avoidance, fast retransmit, fast recovery), cwnd/rwnd/ssthresh definitions, slow start probing capacity and incrementing cwnd by at most SMSS per new-data ACK, congestion avoidance adding roughly one segment per RTT, ssthresh = max(FlightSize/2, 2*SMSS) and cwnd reset to one segment on retransmission-timer loss, fast retransmit on three duplicate ACKs without waiting for the timer, and fast recovery continuing with reduced cwnd because the ACK clock is preserved.
- "TCP congestion control," Wikipedia. https://en.wikipedia.org/wiki/TCP_congestion_control . Supports TCP using an additive increase/multiplicative decrease (AIMD) scheme with slow start and a congestion window, CUBIC as a cubic function of time since the last congestion event and the Linux default since kernel 2.6.19, and BBR as a model-based CCA from Google (2016) using maximum bandwidth and round-trip time instead of loss.
