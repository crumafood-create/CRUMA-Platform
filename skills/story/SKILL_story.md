---
name: story
description: Takes ONE user story from the backlog, adds 2-3 acceptance criteria and proposes a mini implementation plan for approval. Writes no code; implementation is /pair's job.
disable-model-invocation: true
---

# Story

We refine a single story, right before building it. You propose and I decide.

## Steps

1. **Read the story** I give you (pasted text, GitHub issue, Jira ticket, etc.) and review the current code and `CLAUDE.md` to understand the context. **Also read `ARCHITECTURE.md`** (module catalog, dependency table, and its "known debt / open exceptions" section) if the repo has one.
2. **Declare which module owns this story** against `ARCHITECTURE.md` and prior explicit decisions. Reuse an agreed owner. Ask only if ownership remains unresolved or new evidence conflicts with that decision; do not infer it from the current file location.
3. **Acceptance criteria.** Propose 2–3 in Given/When/Then format. They only describe *what* the user sees or gets, never *how* it's implemented.
4. **If it needs more than 3 criteria, don't bloat it: propose splitting it.** Deliver the new stories in backlog format (`As a…, I want…, so that…`) for me to add to the tracker, and we continue with the first one.
5. **Mini plan.** 5 bullets max, no code or file names. How it cuts through the layers, with the minimum that meets the criteria.
6. **Obtain approval for new or changed criteria and plan.** Reuse approval already given for the same scope; do not restart refinement at a skill handoff. When useful, present the test list and its layers with the plan for one combined approval before implementation. `/pair` can execute that approved list without another confirmation.

## Impact and business questions

- For each technical decision, answer: **What real behavior does this protect, and what is the smallest solution that guarantees it?** Use the existing plan for a brief explanation of material decisions; this is a reasoning check, not another user-approval step.
- Identify the affected data's owner and authoritative source. Explain how stored and derived balances, costs or states remain consistent instead of introducing competing writers.
- Identify invariants and all relevant write paths. Plan server validation, database protection, transactions and concurrency checks according to the guarantee required, without automatically duplicating every rule across layers.
- Make quantity units, currency, price basis, precision and rounding explicit where relevant. Ask about missing business meaning; do not infer conversions.
- Review legacy data, references and in-flight operations before changing contracts or schema. Plan versioned migrations and explicit treatment of unknown data; do not rewrite applied migrations or invent defaults for unknown business values.
- Trace the affected data through its actual producers and consumers, including relevant contracts, queries, functions, RPC, database protections and screens. Inspect adjacent functions when they use the same rule or data; do not audit an entire module without a reason.
- Check authorization, validation, atomicity, concurrency, quantities, units, cost meaning, recoverable errors and historical compatibility where the story depends on them.
- Ask for missing business decisions with real examples before fixing the criteria. Reuse prior answers and do not reopen settled decisions at each layer.
- Challenge the relevant functions and workflow steps against actual operations: who uses them, when, what precedes and follows them, and what would happen if removed. Treat existing code as evidence of implementation, not proof of business need. Classify usage as confirmed, unresolved or verified unused; ask only about unresolved uses.
- Include verified dead or behaviorally redundant code in the bounded cleanup scope. Its removal is already authorized by project policy and does not require a new user story or per-deletion approval. Leave ambiguous behavior or destructive data changes for an explicit decision.
- Identify long or tangled functions, files and modules in the affected flow when mixed responsibilities, duplication or complexity make changes unsafe. Plan small behavior-preserving extractions or moves to their documented owning layer, separately from functionality; do not require a split solely because of a line count or invent new architecture.
- Include necessary work within existing criteria. If a finding changes a business rule, broadens scope or resolves disputed ownership, propose that change for approval first.
- For independent improvements, ask the questions needed to establish business value and propose a future story with priority and reason. Add it to `pendientes.md` only after approval; do not silently enlarge the active story or create another backlog file.
- Include a verification plan for the complete diff and related regressions. Distinguish local automated evidence, manual SQL, concurrency and browser checks; require CI on the latest published commit before declaring it ready to merge.

## Rules

- **Don't invent requirements.** Ask only for missing information that affects the criteria or scope, after checking previous answers and repository context.
- **The simplest thing that meets the criteria.** No abstractions, layers, configuration or patterns "for the future".
- **No field, column, folder, or new module enters the plan without a named real consumer.** A real consumer is: an acceptance criterion that needs it, or an existing screen/flow that already expects it. "Might be useful later" or "other systems have it" is not a consumer — ask me, or drop it to "Suggestions".
- **If the plan would violate the dependency direction documented in `ARCHITECTURE.md`** (e.g. `shared` depending on a module, a module reaching into another module's internals instead of its public contract), flag it instead of proposing it, and ask how I want to resolve it.
- **Use evidence for organization.** Routine behavior-preserving cleanup and responsibility extraction within the reviewed flow are authorized by project policy. Propose broader patterns or architectural changes under "Suggestions" only when concrete evidence justifies them; obtain approval before changing ownership, dependency direction or public contracts.
- **Don't write code.**

## Output format

A block ready to paste into the issue. `/pair` uses it as input.

```markdown
## Story
As a <actor>, I want <action>, so that <benefit>.

## Owning module
<module name> — <how ARCHITECTURE.md confirms it, or "ambiguous, needs your call">

## Acceptance criteria
- [ ] Given <context>, when <action>, then <result>.
- [ ] ...

## Plan
- ...

## Out of scope
- <what's left out of this story, so it doesn't sneak in>

## Suggestions (your call)
- <optional>
```

