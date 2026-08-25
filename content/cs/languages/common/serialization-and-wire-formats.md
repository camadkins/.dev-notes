---
title: Serialization and Wire Formats
description: Turning a structure into bytes without the two ends disagreeing. Endianness and padding, the schema-versus-self-describing split, and why copying a struct's bytes straight onto the wire fails.
draft: false
comments: true
tags:
  - cs
  - languages
  - serialization
date: 2026-07-22
updated:
aliases: []
---

An in-memory structure is a layout private to one process on one machine: fields at offsets the compiler chose, integers in that CPU's byte order, pointers into that process's address space. A wire format is the opposite, a public agreement about a sequence of bytes that two programs, possibly written in different languages on different hardware, will both read the same way. Serialization is the translation between the two, and it is deceptively easy to get wrong, because the naive approach, copy the struct's bytes straight onto the wire, fails the moment the other end has a different byte order, a different alignment, or a pointer where you expected data.

This is the same boundary problem as the [[cs/languages/common/c-abi-and-ffi|C ABI]], turned ninety degrees. There the two sides shared memory and had to agree on layout for a call; here they share only a byte stream and have to agree on layout for a message. String encoding, the [[cs/dsa/strings|length-prefixed versus null-terminated choice and UTF-8]], is one corner of it. This note is the general problem.

> [!note] The idea
> A wire format is a contract about bytes that must not depend on either endpoint's machine. Two decisions define any format: how it handles the machine-specific hazards of byte order and alignment, and whether it carries its own shape (self-describing) or relies on both ends sharing a schema. Getting the first wrong makes the same message decode differently on two machines; the second is a tradeoff between compactness and flexibility.

## The two machine hazards: endianness and padding

The first hazard is byte order. A 32-bit integer is four bytes, but whether the most significant byte comes first (big-endian, the traditional network order) or last (little-endian, most common on modern CPUs) is a property of the machine. Send the raw bytes and a big-endian sender and little-endian receiver read different numbers from the same message. Python's `struct` module, which exists to pack and unpack C-style values to and from bytes, makes the choice a single character in the format string: `<` for little-endian, `>` for big-endian, `!` for network order, so `struct.pack('>h', 1023)` gives the bytes `03 ff` and `<h` gives `ff 03`. A wire format must pin the byte order down; it cannot inherit the machine's.

The second hazard is alignment padding. Compilers insert unused bytes between struct fields so each lands on a natural boundary, which is why the same fields in a different order can take a different number of bytes. Python's `struct` documentation is blunt about the consequence: in native mode the packed result includes pad bytes to maintain the C types' alignment, while the explicit byte-order modes `<`, `>`, `=`, and `!` use standard sizes and add no padding. That is precisely why you use them on the wire. The documentation's own guidance is to be precise when exchanging data beyond your process and specify the exact byte order, size, and alignment. The padding a compiler adds for the CPU's benefit is noise the wire must not carry, or must carry by explicit agreement.

## Self-describing or schema: the second decision

Once the machine hazards are handled, the format must decide whether a message carries its own shape. Two well-designed binary formats illustrate the opposite choices.

Protocol Buffers are schema-based. Both ends share a `.proto` definition, and the wire carries only field numbers and values, no field names. Each field is written as a tag computed as `(field_number << 3) | wire_type`, encoded as a variable-length integer, followed by the value. The varint uses the high bit of each byte as a continuation flag and the low seven bits as payload, so small numbers cost one byte. The handful of wire types, varint, 64-bit, length-delimited, 32-bit, tell a parser how to read the value that follows. The design buys two things. It is compact, because names never travel and small integers are tiny. And it is forward and backward compatible: a parser that meets a field number it does not know reads the wire type and skips the value cleanly, so old code tolerates messages from new code. The cost is that the bytes are meaningless without the schema.

CBOR, Concise Binary Object Representation, makes the other choice. RFC 8949 defines it as a binary format built on the JSON data model whose stated goals are extremely small code size, fairly small message size, and extensibility without version negotiation. It is self-describing: the high three bits of each initial byte give a major type, one of unsigned integer, negative integer, byte string, text string, array, map, tag, or a float/simple bucket, and the low five bits carry or introduce the argument. A decoder can walk a CBOR message with no schema at all, which is why it suits constrained and Internet-of-Things devices where a schema registry is impractical. The cost is the mirror image of Protocol Buffers: the type tags travel in every message, so it gives up some compactness to buy independence from a shared definition.

## Why the language angle matters

Each language reaches for this differently, and the reach reveals its priorities. Python treats byte packing as a library concern with `struct`, appropriate for a glue language that spends much of its time reading other systems' formats. Rust's ecosystem leans on serde, a framework where a type derives its encoding, so serialization is a compile-time property of the data rather than hand-written packing. C++ tends to sit closest to the metal and closest to the hazards, where the temptation to `memcpy` a struct to the wire is strongest and the endianness-and-padding trap is most likely to be sprung. The [[cs/software-engineering/api-design|API design]] question of REST versus RPC lives one layer up, deciding the message contract; wire formats decide how that contract becomes bytes, and how those bytes travel over the [[cs/systems/network-protocols|network protocols]] underneath.

> [!example] The same integer, three ways on the wire
> The value 300, sent as a field in three encodings:
> 1. **Raw little-endian 32-bit:** `2c 01 00 00`. Fast, but a big-endian receiver reads it as a huge number, and there is no tag saying what it is.
> 2. **Protocol Buffers** (field 1, varint): tag `08`, then varint `ac 02`. Three bytes, self-delimiting, skippable by a parser that does not know field 1, but meaningless without the `.proto`.
> 3. **CBOR** (unsigned integer): `19 01 2c`. Major type 0 with a two-byte argument; a schema-less decoder knows it is the integer 300 from the bytes alone.

## Related Notes

- [[cs/languages/common/c-abi-and-ffi|The C ABI and Foreign Function Interfaces]] - the same layout-agreement problem when the boundary is a function call sharing memory rather than a wire
- [[cs/dsa/strings|Strings]] - UTF-8, and the length-prefixed versus null-terminated choice, the string corner of wire encoding
- [[cs/software-engineering/api-design|API Design]] - the message-contract layer (REST, RPC, GraphQL) that sits above the byte encoding
- [[cs/systems/network-protocols|Network Protocols]] - the layered stack the serialized bytes actually travel over

## Sources

- "Protocol Buffers: Encoding," protobuf.dev (Google). https://protobuf.dev/programming-guides/encoding/ . Supports the tag being `(field_number << 3) | wire_type` encoded as a varint, varints using a per-byte continuation bit with a 7-bit payload in little-endian order, the wire types (VARINT, I64, LEN, I32), skipping unknown fields for forward/backward compatibility, and omitting absent fields.
- "Concise Binary Object Representation (CBOR)," RFC 8949 (Bormann and Hoffman, IETF). https://www.rfc-editor.org/rfc/rfc8949.html . Supports CBOR being a binary format on the JSON data model with design goals of extremely small code size, small message size, and extensibility without version negotiation, the initial byte's high 3 bits giving the major type and low 5 bits the argument, the eight major types, and its fit for constrained/IoT devices.
- "struct - Interpret bytes as packed binary data," Python Standard Library. https://docs.python.org/3/library/struct.html . Supports packing/unpacking C values to bytes, the byte-order prefixes `@` `=` `<` `>` `!` with `>` giving `03 ff` and `<` giving `ff 03` for 1023, native mode adding alignment padding while `<`/`>`/`=`/`!` use standard sizes with no padding, and the guidance to specify exact byte order, size, and alignment when exchanging data beyond the process.
