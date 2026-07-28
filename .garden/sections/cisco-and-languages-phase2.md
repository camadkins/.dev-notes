# Phase 2 spec — Cisco section + language deep-dives

Captured 2026-07-24 from Cameron. Launches as the next workflow wave. Same proven pipeline as the security proof
(fetch-first, claim->verbatim-quote sidecar, independent re-fetch verify, deterministic gate, per-section commit,
soft counts, negative control on the first Cisco batch). Folder-disjoint from the in-flight full run, so it can run
concurrently or after it.

## Quality bar (Cameron's words): "more useful than the documentation"

Not a syntax dump. Each note leads with WHEN you reach for the thing and WHY, the gotcha that bites in the field, and
the command WITH what it actually does to the box. Practical for him at work, generic enough that anyone finds it useful.
Red line applies hard to CLI: every command name, flag, and behavior verified against real Cisco public docs / RFCs /
the protocol standard. A fabricated command or wrong behavior is a red-line failure, same as any other.

## Cisco section (~200 notes) — content/cs/cisco, tag `cisco` (+ Tier-3 networking/security where apt)

Sub-domains and their batches (each ~8-note batch, reader-arc ordered):

1. **Foundations / IOS (~30):** IOS CLI modes, running vs startup config, show/debug methodology, console/SSH/AAA,
   TACACS+ vs RADIUS, SNMP, syslog, NTP, CDP/LLDP, DHCP on IOS, licensing, config backup, IOS upgrade path.
2. **Switching (~35):** VLANs, 802.1Q trunking, DTP, native VLAN, STP/RSTP/MST, PortFast/BPDU guard, EtherChannel/LACP,
   port security, VTP, inter-VLAN routing/SVIs, CAM table, storm control, SPAN/RSPAN, voice VLAN, err-disable recovery.
3. **Routing (~35):** static/floating-static, administrative distance, OSPF (areas/LSAs/DR-BDR), EIGRP (DUAL/feasible
   successor), BGP basics, route summarization, redistribution, PBR, VRF-lite, HSRP/VRRP/GLBP, ACLs (standard/extended/named),
   NAT/PAT, the routing-table longest-prefix logic.
4. **Security / ASA firewall (~40):** security levels, access rules vs ACLs, NAT on ASA, object/object-groups, MPF (modular
   policy framework), site-to-site IPsec, remote-access/AnyConnect, failover (active/standby, active/active), packet-tracer,
   ASDM concepts, transparent vs routed mode.
5. **Firepower / FTD / FMC (~35):** FTD vs ASA, FMC management model, access control policy, prefilter, intrusion policy
   (Snort 2/3), network analysis policy, security intelligence, URL filtering, malware/file policy, SSL policy, deployment
   workflow, health/monitoring. (Confirm "FMDs" = FTD/FMC with Cameron.)
6. **Troubleshooting / ops (~25):** ping/traceroute on IOS, show ip route/interface/protocols, debug discipline, common
   failure patterns (native-VLAN mismatch, duplex, STP loops, ACL order), log interpretation, packet-tracer on ASA.

Sourcing: Cisco public configuration/command guides (cisco.com), the underlying RFCs/IEEE standards (802.1Q, OSPF RFC 2328,
BGP RFC 4271, IPsec), and reputable references. Wikipedia for protocol concepts; Cisco docs for CLI specifics. Drop any
command that cannot be verified against a fetched Cisco doc or standard.

### HOW TO FETCH CISCO DOCS (learned 2026-07-28, batch 1 — do not re-derive this)

Cisco's Akamai edge blocks on **TLS/header fingerprint, not on file type or path**. Plain `curl -A "<UA>"` gets 403 on
everything, HTML and PDF alike, `td/docs` and `support/docs` alike. WebFetch also 403s. (The earlier "PDF works, HTML is
blocked" theory was WRONG.) What works is a full Chrome header set: use **`.garden/cget.sh <url> <outfile>`**, which is
persisted next to this spec. Pace requests ~4s apart. Interceptor is not a fallback (extension not connected).

Confirmed-200 docs to reuse:
- `support/docs/ip/access-lists/13608-21.html` — "Harden IOS Devices", the highest-value doc in the set (tty/vty, console/AUX, SSH, AAA, logging)
- `support/docs/security-vpn/secure-shell-ssh/4145-ssh.html` — Configure SSH on Routers
- `support/docs/dial-access/.../10374-debug.html` — Important Information on Debug Commands
- `support/docs/routers/10000-series-routers/50421-config-register-use.html` — Configuration Register Usage
- `td/docs/switches/lan/catalyst2960/software/release/12-2_55_se/configuration/guide/scg_2960/<chapter>.pdf` — pdftotext it
- RFCs are unblocked with plain curl.

**DEAD / TRAP URLS (do not reuse):**
- `support/docs/lan-switching/spanning-tree-protocol/5234-5.html` — returns **200 but silently redirects to an unrelated memory-component field notice**. A 200 is therefore NOT evidence you fetched the document you asked for. Always confirm the fetched page's title matches the document you intend to cite; this is the exact trap that manufactures a real-looking citation for content the page never contained. Use the 2960 `swstp.pdf` instead.
- `support/docs/lan-switching/etherchannel/98469-ether-chan-cat-sw-config.html` — 404.
- `support/docs/ip/open-shortest-path-first-ospf/7039-1.html` — the widely-cited "OSPF Design Guide". Returns **200 but serves the "IP Routing - Troubleshooting TechNotes" index page** instead. Two independent traps of this shape now confirmed, so treat title-matching as mandatory, not optional. Useful side effect: that index is a complete link directory of Cisco's IP routing TechNotes with anchor text, so fetch it deliberately AS AN INDEX to discover real URLs, and never cite it.

**Routing docs confirmed working (titles verified):** `support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html` (best of the set: full default-AD table, RIB install sequence, and the explicit statement that AD does not override longest-prefix match), `.../floating-static-route/118263-technote-nexthop-00.html`, `.../open-shortest-path-first-ospf/13685-13.html` (neighbor states), `13699-29.html` (neighbor troubleshooting), `13703-8.html` (areas and virtual links), `.../enhanced-interior-gateway-routing-protocol-eigrp/16406-eigrp-toc.html`, `.../border-gateway-protocol-bgp/26634-bgp-toc.html`, `.../hot-standby-router-protocol-hsrp/13780-6.html`.

**ALIAS COLLISION RULE (learned the hard way, see the alias-shadow fix in commit f7a8ef5):** before adding an alias, check it does not match an existing note's filename anywhere in the garden. `GardenGate.resolve()` prefers aliases over filenames, so a colliding alias silently steals every link to the other note. The routing batch hit this with `OSPF` and `BGP` (existing `ospf-and-link-state-routing`, `bgp-and-internet-routing-as-control`) and disambiguated to "OSPF on IOS" / "BGP on IOS".

**Verification note:** a PDF-sourced or Cisco-sourced batch will flag at 70-100% in `verify-quotes.ts`, because that tool
substring-matches the bytes it fetches (PDF bytes never match text; blocked pages return an Access Denied stub). Use
`.garden/recheck-pdf.py` for those sections, and where cisco.com 403s the re-check, verify via the Wayback Machine
(`http://archive.org/wayback/available?url=...`), which served as the independent check for batch 1.

## Language deep-dives (15-20 notes EACH) — content/cs/languages/<Lang>, tag `languages`

Write language-SPECIFIC value, better than the current thin coverage. Dedup against languages/common (cross-cutting
concepts already there become links).

- **Rust:** ownership, borrowing, lifetimes, traits, generics/bounds, Result/? error handling, iterators/adapters, closures
  (Fn/FnMut/FnOnce), pattern matching, Box/Rc/RefCell, Send/Sync, async/await, unsafe, macros, cargo/crates, slices.
- **Python:** comprehensions, generators/yield, decorators, context managers, the GIL, dunder/data model, dataclasses,
  typing/mypy, asyncio, packaging/venv, mutable-default gotcha, descriptors, the import system, stdlib gems (itertools/collections).
- **C++ (Cpp):** RAII, move semantics/rvalue refs, templates + SFINAE/concepts, smart pointers, const-correctness, rule of
  0/3/5, references vs pointers, STL containers/iterators/algorithms, constexpr, lambdas/captures, undefined behavior in practice.
- **Racket:** s-expressions/evaluation, hygienic macros, continuations/call-cc, contracts, structs, tail calls, higher-order
  functions, modules, pattern matching, the language-oriented-programming pitch.
- **Ansible:** playbooks, roles, inventory (static/dynamic), modules vs tasks, idempotence, Jinja2 templating, handlers,
  variables/precedence, facts, vault, loops/conditionals, check mode.

## Launch

New workflow mode `phase2` in `scratchpad/garden-grow.mjs`: SECTIONS = [cisco sub-domains as pseudo-sections all writing
to content/cs/cisco but DISJOINT slugs] + [5 language subfolders]. Negative control seeded with false Cisco-command claims
for the first cisco batch (prove the verifier on CLI facts specifically). Same gate + commit + soft counts.
