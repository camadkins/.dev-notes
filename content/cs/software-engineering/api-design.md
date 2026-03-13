---
title: API Design
description: Principles for designing application programming interfaces — REST, GraphQL, RPC paradigms, and the art of contract design.
draft: false
comments: false
tags:
  - cs
  - software-engineering
date: 2026-03-12
aliases: []
---

## Intuition

An API is a **promise**: "Send me this shape of request, and I will return that shape of response." The quality of an API is measured not by its cleverness but by how rarely its consumers need to read the documentation twice. Good APIs are predictable, consistent, and hard to misuse.

The paradigm — REST, GraphQL, RPC — matters less than the discipline of thinking carefully about what you expose, what you hide, and what contracts the type system can enforce for you.

---

## Core Idea

### REST (Representational State Transfer)

Resources are identified by URLs. Operations map to HTTP methods. State is transferred as representations (typically JSON).

| Method | Semantics | Idempotent? |
|--------|-----------|-------------|
| `GET` | Read a resource | Yes |
| `POST` | Create a new resource | No |
| `PUT` | Replace a resource entirely | Yes |
| `PATCH` | Partially update a resource | Depends |
| `DELETE` | Remove a resource | Yes |

**Key principles:**
- Resources are nouns (`/users/42`), not verbs (`/getUser?id=42`).
- Use HTTP status codes meaningfully (201 Created, 404 Not Found, 409 Conflict).
- Hypermedia (HATEOAS) lets responses contain links to related actions, though few APIs achieve this fully.

### GraphQL

A query language where the client specifies exactly which fields it needs. A single endpoint serves all queries.

```graphql
query {
  user(id: 42) {
    name
    posts(limit: 5) {
      title
      createdAt
    }
  }
}
```

- **Strengths:** eliminates over-fetching and under-fetching; strongly typed schema; introspectable.
- **Trade-offs:** complexity shifts to the server (query parsing, authorization per field, N+1 problems); caching is harder than REST.

### RPC (Remote Procedure Call)

Expose server functions directly. The client calls a named procedure with arguments and receives a result. gRPC (Protocol Buffers over HTTP/2) is the dominant modern implementation.

- **Strengths:** efficient binary serialization; strong typing via schema; streaming support; code generation.
- **Trade-offs:** less discoverable than REST; tighter coupling between client and server versions.

### Contract Design Principles

Regardless of paradigm, well-designed APIs share common traits:

1. **Consistency** — similar operations behave the same way everywhere.
2. **Least surprise** — naming, error formats, and conventions match what developers expect.
3. **Evolvability** — additive changes (new fields, new endpoints) don't break existing clients.
4. **Explicit errors** — error responses carry enough detail to diagnose without server logs.
5. **Versioning strategy** — URL path (`/v2/users`), header (`Accept: application/vnd.api+json;v=2`), or schema evolution (Protocol Buffers' field numbering).

> [!note]
> The strongest API contracts are enforced by type systems. A `.proto` file or GraphQL schema catches breaking changes at compile time — far cheaper than discovering them in production. See [[type-systems-goals-guarantees|Type Systems — Goals & Guarantees]] for why static contracts matter.

---

## Example

The same operation — "get a user's recent posts" — across paradigms:

**REST:**
```http
GET /users/42/posts?limit=5&sort=created_at:desc
Accept: application/json
```

**GraphQL:**
```graphql
query {
  user(id: 42) {
    posts(limit: 5, sort: CREATED_AT_DESC) {
      id
      title
    }
  }
}
```

**gRPC:**
```protobuf
rpc GetUserPosts(GetUserPostsRequest) returns (PostList);
message GetUserPostsRequest {
  int32 user_id = 1;
  int32 limit = 2;
}
```

REST returns a fixed shape. GraphQL returns exactly what was asked. gRPC returns a typed message. The choice depends on client diversity, performance needs, and team familiarity.

---

## Related Notes

- [[type-systems-goals-guarantees|Type Systems — Goals & Guarantees]] — type-level contracts as the foundation of API safety
- [[design-patterns|Design Patterns]] — Facade, Adapter, and Proxy patterns shape API boundaries
- [[software-architecture|Software Architecture]] — APIs are the seams between architectural components
- [[testing-strategies|Testing Strategies]] — contract tests validate API promises between services
