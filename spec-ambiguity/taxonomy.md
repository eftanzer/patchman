# Sources of Ambiguity in Software Prompts

Each entry has a prompt you might plausibly give a coding agent, a few implementations that a reasonable agent (or engineer) could produce from it, and the information the prompt left out.

The first four are the core claim: **emphasis, context, convention, and unstated assumptions carry meaning that a written spec doesn't capture.** The rest are further ways English underdetermines software.

---

## The core four

### 1. Emphasis (stress)

> "Users shouldn't be able to edit their own posts after publishing."

- **USERS**: admins are exempt.
- **SHOULDN'T**: a warning, not a hard block.
- **ABLE**: enforced on the server, not just hidden in the UI.
- **EDIT**: deleting is still allowed.
- **POSTS**: comments are still editable.
- **AFTER PUBLISHING**: drafts are editable, possibly with a grace period.

**Missing:** which word carried the stress. See the [README](README.md) for the full table.

### 2. Context

> "Revert the last change."

- Undo the agent's most recent file edit.
- `git revert HEAD`.
- Revert the last merged PR (which could be several commits).
- Roll back the last production deploy.

**Missing:** what happened just before the request. The words are the same; the referent depends on the conversation.

### 3. Convention

> "Add pagination to the `/orders` endpoint."

- `?page=1&per_page=20`, with pages starting at 1.
- `?offset=0&limit=20`.
- Cursor-based: `?after=ord_123`, with a `next_cursor` field in the response.
- An RFC 8288 `Link: <...>; rel="next"` header and no body change.

> "Return an error if the user isn't found."

- HTTP 404, or `200 { "error": "not found" }`, or return `null`, or throw `UserNotFoundError`.

**Missing:** which community's conventions apply (REST, GraphQL, this codebase, this team).

### 4. Unstated assumptions

> "Let users reset their password via email."

A competent human assumes, without being told:

- The reset token is single-use and expires.
- The response is identical whether or not the email exists (no account enumeration).
- Requests are rate-limited.
- Other sessions are logged out after a reset.
- The token is stored hashed.

A literal implementation emails a permanent link and says "No account with that email."

**Missing:** everything "obvious" to the person writing the spec.

---

## Beyond the core four

### 5. Lexical ambiguity (one word, several meanings)

> "Delete inactive accounts."

- **Delete**: soft delete (`deleted_at`), hard delete, anonymize, or archive?
- **Inactive**: unverified, unpaid, not logged in for N days, or manually disabled?
- **Account**: a user, an organization or workspace, or a billing account?

**Missing:** a glossary. Common words (*user*, *account*, *order*, *close*, *archive*, *day*) are often the most overloaded.

### 6. Structural ambiguity (what attaches to what)

> "Notify admins and users with expired passwords."

- All admins, plus users with expired passwords.
- Admins and users, but only those with expired passwords.

> "Show the latest orders from each customer sorted by date."

- Sort within each customer's group, or sort the combined list?
- Is "latest" one order per customer, or the last N?

**Missing:** parentheses. English has no operator precedence.

### 7. Scope of negation and quantifiers

> "Don't email users who haven't verified and opted out."

- Skip users who are unverified AND opted out.
- Skip users who are unverified, and also skip users who opted out.
- Skip users who have not (verified and opted out).

> "Every request should hit a cache."

- The same shared cache, or any cache layer at all?

**Missing:** how far a "not" or "every" reaches.

### 8. Vagueness (words with no threshold)

> "Show recent activity, and reject large uploads. Search should be fast."

- Recent: 24 hours? 7 days? The last 20 items?
- Large: 5 MB? 100 MB? Relative to the plan tier?
- Fast: p50 under 100 ms? p99 under 1 s? Fast enough to search as you type?

**Missing:** numbers. The agent will invent them, usually without saying so.

### 9. Modality (how strong the requirement is)

> "The service should validate webhook signatures."

- MUST: reject unsigned requests with 401.
- SHOULD: log a warning and process anyway.
- MAY: add a config flag, off by default.

> "Users can export their data."

- *Can* as permission: add an authorization rule.
- *Can* as capability: build the export feature.

**Missing:** RFC 2119 keywords, and a way to tell permission apart from capability.

### 10. Implicature (what's implied but not said)

> "Support Chrome and Firefox."

- Safari is unsupported: show a "browser not supported" banner.
- Safari is simply untested: do nothing.
- Every browser should work; these two are examples.

> "Users can export to CSV."

- Is JSON forbidden, or just not requested? Should the export be built so formats are pluggable, or hard-coded?

**Missing:** whether a list is exhaustive. Listeners assume it is (Gricean maxim of quantity); writers often don't mean it to be.

### 11. Reference and deixis (what "it", "now", and "today" point to)

> "When an order is cancelled, update it."

- Update the order's status, or the inventory, or the invoice?

> "Send the daily report at midnight."

- UTC, server-local time, the company's timezone, or each recipient's timezone?
- What happens on DST transition days?

**Missing:** what the pronoun refers to, and whose clock is meant.

### 12. Time and aspect

> "Expire sessions after 30 minutes."

- 30 minutes since login (absolute timeout).
- 30 minutes since the last request (idle timeout).

> "Email the user when a payment fails."

- On every failure, on the first failure only, or once a day as a digest?

> "Users active in the last 30 days."

- A rolling 30-day window, or the current calendar month?

**Missing:** whether an event is a point, a duration, or a repetition.

### 13. Boundaries and inclusivity

> "Apply a 10% discount to orders between $50 and $100."

- `50 <= x <= 100`, `50 < x < 100`, or `50 <= x < 100`?
- Before or after tax and shipping?

> "Block users under 18."

- Is the age computed from the birthdate in UTC or in the user's local timezone? Is the 18th birthday itself allowed?

**Missing:** which side of the fencepost each endpoint falls on.

### 14. Collective vs. distributive quantities

> "Users can upload 5 files of up to 10 MB."

- Five files per user ever, per day, or per request?
- 10 MB per file, or 10 MB in total?

**Missing:** what the quantity applies to.

### 15. Logical connectives (*and*, *or*)

> "Let users search by name and email."

- Two separate filters.
- One query that must match both.
- One search box that matches either field.

> "Grant access to admins or editors with an active subscription."

- `admin OR (editor AND subscribed)`
- `(admin OR editor) AND subscribed`

**Missing:** English *and* often means OR (and vice versa), and there's no grouping.

### 16. Intent vs. literal goal (especially risky with agents)

> "Make the failing tests pass."

- Fix the bug in the code.
- Change the assertions to match current behavior.
- Mark the tests `skip`, or delete them.

> "Fix the flaky test."

- Find the race condition, add a retry, raise the timeout, or quarantine the test.

**Missing:** the goal behind the instruction. Agents optimize for the literal target (Goodhart's law).

### 17. Locale and culture

> "Sort customer names alphabetically and show the signup date."

- Case-sensitive? Is `Émile` sorted under E? Is `file10` before or after `file2`?
- Is `01/02/2026` January 2nd or February 1st? Or should it be ISO 8601?
- Sort by family name or given name? Which comes first?

> "Disable deliveries on weekends."

- Saturday and Sunday, or Friday and Saturday?

**Missing:** whose locale and conventions apply.

### 18. Perspective

> "Show the newest items at the top, and let users move items up."

- Newest by creation date or by last update?
- Does "up" mean toward index 0, or a higher rank number?
- If the list is reversed for display, is "up" visual or logical?

> "Handle incoming messages before forwarding them upstream."

- Incoming relative to the client or the server? Which way is upstream?

**Missing:** where the speaker is standing.

### 19. Analogies and open-ended lists

> "Make comments work like Slack threads."

- Nested replies? A side panel? "Also send to channel"? Unread tracking? Which parts of Slack threads?

> "Accept common image formats: PNG, JPG, etc."

- Does "etc." include GIF? WebP? HEIC? SVG (which can carry scripts)?

**Missing:** which features of the analogy count, and where the list ends.

### 20. Unstated priorities

> "Make checkout fast and secure, and keep it simple to use."

- Skip re-authentication for speed and simplicity, or require 3-D Secure for security?
- Cache the cart client-side (fast), or validate it server-side on every step (secure)?

**Missing:** which goal wins when they conflict. The agent picks one quietly, and the spec reads as satisfied either way.

---

## The pattern

Every one of these prompts is grammatical, reasonable, and the kind of thing people actually write in tickets and agent prompts. Each one has several implementations that all faithfully satisfy the text. The gap isn't sloppy writing. It's the gap between language, which relies on a shared listener, and software, which needs one exact reading.
