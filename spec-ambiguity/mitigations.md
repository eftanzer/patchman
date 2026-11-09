# Recovering the Lost Information

Every source of ambiguity in [taxonomy.md](taxonomy.md) comes down to information the writer had and the text didn't carry. Each fix works by adding that information back in a less ambiguous form.

| Technique | What it recovers | Example |
|---|---|---|
| **Concrete examples** | Emphasis, boundaries, connectives | "An order of exactly $100 gets the discount; $100.01 does not." |
| **Executable tests** | Almost everything, checked by a machine | `expect(discount(100)).toBe(10)` |
| **Glossary** | Lexical ambiguity, reference | "*Inactive*: no login in 90 days. *Delete*: set `deleted_at`, purge after 30 days." |
| **RFC 2119 keywords** | Modality | "The service MUST reject unsigned webhooks." |
| **Given / When / Then** | Time, perspective, context | "Given a session idle for 31 minutes, when a request arrives, then return 401." |
| **Explicit non-goals** | Implicature, open lists | "Safari is out of scope; do not block it." |
| **Stated priorities** | Conflicting goals | "Correctness over latency in checkout." |
| **Clarifying questions** | Unstated assumptions, intent | The agent asks "Should admins be exempt?" before writing code. |

## The uncomfortable conclusion

Each fix moves the spec toward something formal: examples, tests, defined terms, logical operators. Push hard enough on disambiguation and you end up writing a test suite, or something that is basically code.

That's the critique of spec-driven development: **the only fully unambiguous spec of a program is a program.** English is great for conveying intent and terrible at pinning down behavior. Treat the English spec as a starting point for a conversation, and use examples and tests as the contract.
