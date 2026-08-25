---
title: Memory Analysis and Process Reconstruction
description: "Rebuilding a process list from a memory image is type-directed reading of a foreign address space, which makes the symbol table for that exact kernel build the binding constraint on everything an examiner can say."
draft: false
comments: true
tags:
  - cs
  - forensics
date: 2026-06-30
updated:
aliases: []
---

A memory image is a few gigabytes of undifferentiated bytes. Nothing in it is labeled. There is no file system, no directory, and no header saying where the process list begins. Yet a working analysis pulls out running processes, their parents, their command lines, their loaded modules, their open handles, and their network connections. The gap between those two descriptions is the whole subject.

> [!note] The idea
> Memory analysis works because an operating system keeps its bookkeeping **in memory, as typed structures**, in order to function at all. The analyst reconstructs state by applying the kernel's own type definitions to raw offsets, which means the analysis is only as good as the type information for that exact build. Symbols, not tooling, are the binding constraint, and a memory image whose kernel version cannot be matched to a symbol table is close to inert.

## Addressing someone else's address space

The first problem is that addresses in the image do not mean what they appear to mean. Volatility's documentation frames its abstraction around exactly this. A memory layer is a body of data that can be accessed by requesting data at a specific address. Because modern architectures moved to a paged model, programs ask for any address and the processor looks up their virtual address in a map to find the physical address where it lives.

The framework can work with these layers as long as it knows the map. The automagic that runs at the start of every session often locates the kernel's memory map and creates a kernel virtual layer, which allows kernel addresses to be looked up and the correct data returned. Crucially, there can be several maps, and in general there is a different map for each process, although a portion of the operating system's memory is usually mapped to the same location across all processes. The maps may take the same address but point to different parts of physical memory, and two processes can share memory by having virtual addresses mapped to the same physical address.

That last sentence is why an examiner cannot read a process's memory without first finding that process's page table. [[cs/systems/virtual-memory|Virtual memory]] is not an inconvenience layered on top of the analysis; it is the structure the analysis has to reproduce.

Volatility represents mappings as a directed graph of layers, whose end nodes are data layers and whose internal nodes are translation layers. The composition property this buys is unusually elegant. A raw memory image in the LiME file format and a page file can be combined to form a single Intel virtual memory layer, so that when an address is requested the Intel mapping algorithm translates it and the request is directed either to the swap layer or to the LiME layer. Pages that were evicted to disk are transparently resolved from the [[cs/forensics/the-page-file-and-hibernation-artifacts|page file]] as though they had never left RAM.

## Types, symbols, and why the build matters

Above the addressing layer sits the type system. A template contains all the information you can know about the structure of an object without it being populated by any data: the size of a structure and its members, how far into the structure a particular member lives, and potentially what various values in a field would mean, but not what resides in a particular member. Using a template on a memory layer at a specific offset produces an object, whose members can be interrogated and whose pointers can be followed.

Where do templates come from? Most compiled programs know their own templates and define the structure and location of these templates as a symbol, and lookup tables of these symbols are often produced as debugging information alongside compilation. Volatility reads them from its own JSON formatted file, which acts as a common intermediary between Windows PDB files, Linux DWARF files, and other symbol formats, and it uses the naming convention module!symbol to refer to them.

The practical consequence shows up in the Windows workflow. When using Windows plugins in Volatility 3, the required intermediate symbol file can often be generated from PDB files automatically downloaded from Microsoft servers, so specific symbol files do not have to be located and added by hand. Windows analysts get this for free because Microsoft publishes symbols. Linux analysts frequently do not, because the required DWARF information depends on the exact kernel build running on the subject machine, and an unpatched match is not close enough.

This is the point most worth carrying away. An examiner who says "the tool could not parse the image" is usually describing a symbol problem, not a corruption problem, and the fix is provenance work on the target's kernel version rather than a different tool.

## Reconstructing processes

Volatility does not provide the ability to acquire memory; acquisition is a separate job done by tools such as WinPmem or FTK Imager. What it provides is plugins, each of which carries out a specific form of analysis on the context of layers and symbol tables and returns results in a structured grid rather than as formatted text, so that consumers of the library can handle the data without knowing how it is formatted.

The two foundational Windows plugins show the reconstruction in its simplest form. windows.pslist lists the processes running while the memory dump was taken, emitting for each one the PID, parent PID, image file name, virtual offset, thread and handle counts, session ID, Wow64 flag, and creation and exit times. windows.pstree displays the parent-child relationships between processes, rendering the same records as a hierarchy.

Look at what those columns are. They are fields of a kernel structure, read through a template, at an offset arrived at by translation. On Windows that structure is the EPROCESS block, which the kernel debugger's process extension displays and whose address the debugger prints alongside each process. The debugger documentation also records a detail that constrains every tool built on this structure: the image name in the EPROCESS block is generally the executable name that was invoked to start the process, including the file extension, and truncated after the fifteenth character. Analysts see the truncation constantly and it is a property of the data structure, not of the tool.

Walking from one process record to the next is a [[cs/dsa/linked-list|linked list]] traversal performed in someone else's address space, and it inherits the weakness of every list: the traversal returns what the links say is there. A record whose links have been rewritten is invisible to the walk while remaining present in the image, which is why plugin families that scan physical memory for structure signatures exist alongside those that follow the kernel's own bookkeeping. Agreement between the two methods is corroboration. Disagreement is a finding.

> [!warning] Analysis inherits the acquisition's flaws
> Every reconstruction above depends on page tables that were read at one moment and referenced at another. When [[cs/forensics/memory-acquisition|acquisition]] smears them, translation silently returns the wrong physical page, and a plugin will report the result with the same confident formatting it uses for correct output. Nothing in the output distinguishes the two cases, which is why the acquisition method belongs in the report alongside the findings.

## Related Notes

- [[cs/forensics/memory-acquisition|Memory Acquisition]] produces the image and determines how much of it can be trusted.
- [[cs/forensics/the-page-file-and-hibernation-artifacts|The Page File and Hibernation Artifacts]] holds the pages this analysis resolves through the swap layer.
- [[cs/systems/virtual-memory|Virtual Memory]] is the translation machinery the analysis reimplements from the outside.
- [[cs/systems/processes-and-threads|Processes and Threads]] describe the abstraction whose kernel representation is being read.
- [[cs/dsa/linked-list|Linked List]] is the structure whose traversal a rootkit only has to unlink from.
- [[cs/forensics/malware-triage-static-and-dynamic|Malware Triage]] is what an examiner usually does with the regions a memory analysis extracts.

## Sources

- [Volatility 3 Basics](https://volatility3.readthedocs.io/en/latest/basics.html) backs memory layers and translation, the automagic kernel virtual layer, the combination of a LiME image with a page file, templates and objects, symbol tables and the JSON intermediary, and the plugin and renderer model.
- [Volatility 3 Windows Tutorial](https://volatility3.readthedocs.io/en/latest/getting-started-windows-tutorial.html) backs the statement that Volatility does not acquire memory, the automatic generation of symbol files from Microsoft PDB servers, and the behavior of windows.pslist and windows.pstree.
- [!process, Windows Debugger documentation, Microsoft Learn](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/-process) backs the EPROCESS block and the fifteen-character truncation of the image name.
