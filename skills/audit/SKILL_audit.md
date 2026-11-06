---
name: audit
description: Audits coherence between use cases, data (schema) and business rules in an agreed scope, producing evidence-backed findings and open decisions. Writes no code; findings can inform /backlog and /story.
disable-model-invocation: true
---

# Audit

Your job is to find where the three layers of a module disagree with each other — not to fix them. I decide what gets worked on and in what order.

## Scope

1. **Read `ARCHITECTURE.md`** (module catalog, dependency table, section 8 "known debt") and any alignment doc it links to, before touching code.
2. **Use the scope I name or already agreed in the conversation.** Ask one concise question only when the available context cannot resolve the scope. Do not reconfirm an explicit scope at each step; do not expand it to the whole repository without authorization.

## What you inspect per module in scope

For each module, read these three layers and compare them against each other:

- **Data**: the real schema in migrations and generated types under `src/types/database/`, plus relevant SQL consumers and protections: functions, views, triggers, constraints and RLS policies. Not what you'd expect it to contain — what it actually contains.
- **Use cases**: the `application` layer (contracts, repositories, services, use-cases) — what they read, write, and assume exists.
- **Business rules**: validators, authorization guards, domain constraints, and any error-throwing logic that encodes a business decision (e.g. "quantity must be a positive integer").

## Validate the real workflow

- Compare the relevant functions and workflow steps with actual business operations. Reuse confirmed context; ask about the actor, timing, preceding and following steps, data and decisions involved, and consequences of removal only where these remain unknown.
- Classify usage as confirmed, unresolved or verified unused. Existing code does not establish business need; absence of imports does not establish non-use.
- Before declaring code dead or behaviorally redundant, inspect relevant framework entry points, dynamic registration, external callers, RPC and SQL dependencies, jobs, public contracts and side effects. Report the evidence and its limits.
- During this read-only audit, report verified dead code for removal in implementation. Project policy authorizes `/pair` to remove it in the reviewed scope without another per-deletion approval, as a separate verified step. Ask about uncertain usage before recommending removal; do not equate historical migrations or stored data with disposable code.

## What counts as an incoherence (your checklist)

- **Competing sources of truth:** stored and derived balances, costs or states disagree, or write paths maintain them inconsistently. Identify the actual owner, writers and reconciliation rule before suggesting a change.
- **Poor responsibility separation:** long or tangled functions, files or modules mix concerns, duplicate logic or make behavior difficult to verify. Cite the specific responsibility or dependency problem, not just the number of lines; recommend bounded behavior-preserving extraction or relocation to the documented owning layer, without speculative scaffolding.
- **Unprotected invariants:** required server validation or database protection is missing on a relevant write path, or an operation's atomicity/concurrency does not preserve the agreed rule. Explain the concrete guarantee; do not assume every rule needs duplicate validation.
- **Ambiguous quantities or money:** the unit, currency, price basis, precision or rounding is undefined or inconsistent across the reviewed flow. Do not supply a conversion that the business has not agreed.
- **Legacy incompatibility:** a change reinterprets historical values, invalidates references or in-flight operations, invents unknown business defaults or depends on rewriting applied migrations.
- **Incomplete delivery evidence:** the complete diff, related tests, clean migration application or CI for the latest published commit has not been verified. Distinguish missing evidence from a demonstrated defect.
- **Dead data**: a schema column or field that no use case reads or writes.
- **Stale assumption**: application code reading/writing a field or type that the real schema doesn't have, or has under a different name/type.
- **Rule enforced in only one place when it should hold in both**: a uniqueness or integrity rule checked in application code with no matching database constraint (or the reverse — a database constraint whose violation reaches the user as a raw, unfriendly error instead of the rule's own message).
- **Duplicated or competing logic**: two modules implementing an equivalent rule or read for the same business concept (this is also an ownership-ambiguity signal — check whether `ARCHITECTURE.md` or its alignment doc already logged it).
- **Contradicted debt**: anything in scope that matches an exception already logged in `ARCHITECTURE.md` section 8, or an open question in its alignment doc — surface it, don't silently resolve it.

## Rules

- **Don't propose fixes for business-level ambiguity.** If an incoherence traces back to an undecided business question (which module owns this, what should happen when X), it goes in "Needs your decision", with the exact question — not in the to-do list.
- **Inspect test assumptions too.** A failing structural assertion is not proof of a production defect. Contrast it with the approved behavior and the actual read/write operation; do not recommend reordering production solely to satisfy the test.
- For each technical recommendation, answer: **What real behavior does this protect, and what is the smallest solution that guarantees it?** Keep the answer in the existing finding, without adding documents or user-approval checkpoints.
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
      Usage: <confirmed unused or unresolved; checked consumers and side effects>.
      Verification: <checks needed for removal, or business question if usage is unresolved>.

## Needs your decision
- <question>: <which modules/files it affects, and why it can't be answered from the code alone>
```

When done, offer to turn confirmed findings into stories through `/backlog` or refine an existing story with `/story`. Don't create or save stories unless I ask. An approved implementation belongs to `/pair`.

Before proposing a future story or priority, clarify missing business impact, its real consumer and the next operation it enables. Reuse previous answers. Present the story, priority and reason for one approval, then save approved future work in the existing `pendientes.md`; never create another pending-story list or treat a finding as an automatically approved story. Leave technical implementation tasks within their owning approved story when they add no independent business value.

