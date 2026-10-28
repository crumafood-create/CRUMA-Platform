---
name: audit
description: Audits coherence between use cases, data (schema) and business rules in an agreed scope, producing evidence-backed findings and open decisions. Writes no code; findings can inform /backlog and /story.
disable-model-invocation: true
---

# Audit

Your job is to find where the three layers of a module disagree with each other — not to fix them. I decide what gets worked on and in what order.

## Scope

1. **Read `ARCHITECTURE.md`** (module catalog, dependency table, section 8 "known debt") and any alignment doc it links to, before touching code.
2. **Use the scope I name.** If it is missing or ambiguous, ask one concise question before auditing. Suggest a focused module when the current context identifies one; audit the whole repo only after I confirm that scope.

## What you inspect per module in scope

For each module, read these three layers and compare them against each other:

- **Data**: the real schema in migrations and generated types under `src/types/database/`, plus relevant SQL consumers and protections: functions, views, triggers, constraints and RLS policies. Not what you'd expect it to contain — what it actually contains.
- **Use cases**: the `application` layer (contracts, repositories, services, use-cases) — what they read, write, and assume exists.
- **Business rules**: validators, authorization guards, domain constraints, and any error-throwing logic that encodes a business decision (e.g. "quantity must be a positive integer").

## What counts as an incoherence (your checklist)

- **Dead data**: a schema column or field that no use case reads or writes.
- **Stale assumption**: application code reading/writing a field or type that the real schema doesn't have, or has under a different name/type.
- **Rule enforced in only one place when it should hold in both**: a uniqueness or integrity rule checked in application code with no matching database constraint (or the reverse — a database constraint whose violation reaches the user as a raw, unfriendly error instead of the rule's own message).
- **Duplicated or competing logic**: two modules implementing an equivalent rule or read for the same business concept (this is also an ownership-ambiguity signal — check whether `ARCHITECTURE.md` or its alignment doc already logged it).
- **Contradicted debt**: anything in scope that matches an exception already logged in `ARCHITECTURE.md` section 8, or an open question in its alignment doc — surface it, don't silently resolve it.

## Rules

- **Don't propose fixes for business-level ambiguity.** If an incoherence traces back to an undecided business question (which module owns this, what should happen when X), it goes in "Needs your decision", with the exact question — not in the to-do list.
- **Every finding needs evidence**: file path and line (or migration name), for both sides of the mismatch. No finding without a citation.
- **Don't write code.** This produces a to-do list; implementing it is `/story` and `/pair`'s job.
- **Don't invent severity.** Group findings by what's actually true: breaks something now (a use case referencing a field that no longer exists), silently wrong (a rule enforced in only one layer), or just unused (dead data) — don't rank by guessed business importance.

## Output format

```markdown
## Scope audited
<module(s) or "whole repo">, read against: ARCHITECTURE.md <and alignment doc if used>

## Findings

### Breaks something now
- [ ] <finding>. Evidence: <file:line> vs <file:line or migration>.
      Verification: <how to confirm after fixing, e.g. a test or query>

### Silently wrong
- [ ] <finding>. Evidence: <file:line> vs <file:line>.
      Verification: <...>

### Unused / dead
- [ ] <finding>. Evidence: <file:line or column name + migration>.
      Verification: <...>

## Needs your decision
- <question>: <which modules/files it affects, and why it can't be answered from the code alone>
```

When done, offer to turn confirmed findings into stories through `/backlog` or refine an existing story with `/story`. Don't create or save stories unless I ask. An approved implementation belongs to `/pair`.
