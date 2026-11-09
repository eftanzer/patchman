# English Is a Lossy Spec Language

> "I never said he bit my finger."

Stress a different word and the sentence means something different: *someone else* said it, it's a *denial*, I only *implied* it, it wasn't *him*, he did something *other than bite*, it was *someone else's* finger, it was *something other than* my finger.

When we speak, stress carries meaning. When we write, it disappears. A written spec, or a prompt to a coding agent such as Codex or Claude Code, keeps the words and loses the stress. It also loses the **context**, **conventions**, and **unstated assumptions** that a human listener uses to fill the gaps.

Spec-driven development assumes that a detailed English spec pins down behavior. It doesn't. English is ambiguous, and an agent resolves the ambiguity by quietly picking the statistically likely reading. It does not ask which one you meant.

## Main example

> **"Users shouldn't be able to edit their own posts after publishing."**

| Stressed word | What the listener hears | What gets built |
|---|---|---|
| **USERS** shouldn't... | But admins or moderators can | A role check that exempts staff |
| users **SHOULDN'T**... | It's discouraged, not forbidden (*should*, not *must*) | A warning dialog, with editing still allowed |
| shouldn't be **ABLE** to... | It must be impossible, not just hidden | Server-side enforcement plus an API rejection, not only a hidden Edit button |
| ...**EDIT**... | Deleting or unpublishing is still fine | Edit is blocked; delete stays |
| ...their **OWN** posts... | Editing other people's posts is handled differently | A separate permission path for collaborators or moderators |
| ...**POSTS**... | Comments and profiles can still be edited | The rule applies to the `Post` model only |
| ...**AFTER PUBLISHING** | Drafts are editable. Does "after" mean immediately, or after a grace period? | A draft/published state machine, maybe with a 5-minute edit window |

That's seven words, seven readings, and at least seven different pull requests. Each one is a faithful implementation of the sentence.

## Backup example

> **"We don't retry failed payments automatically."**

| Stressed word | What it implies | What gets built |
|---|---|---|
| **WE** don't | The payment provider (e.g. Stripe) already retries | Nothing. Don't build retries |
| we **DON'T** | Correcting someone who assumed we do | Remove the existing retry logic |
| don't **RETRY** | We do something else instead | A refund or a "payment failed" notification |
| **FAILED** payments | Timed-out or pending payments *are* retried | Retries for non-terminal states only |
| failed **PAYMENTS** | Other failed jobs are retried | A generic job retry that excludes payments |
| **AUTOMATICALLY** | A human can retry | A "Retry payment" button in the admin UI |

## More

- [taxonomy.md](taxonomy.md): the sources of ambiguity (emphasis, context, convention, unstated assumptions, and 16 more), each with an example prompt and the different implementations it can produce.
- [mitigations.md](mitigations.md): what recovers the lost information, and why it suggests that the tests or code end up being the real spec.
