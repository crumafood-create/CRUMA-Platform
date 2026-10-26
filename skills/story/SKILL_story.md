---
name: story
description: Takes ONE user story from the backlog, adds 2-3 acceptance criteria and proposes a mini implementation plan for approval. Writes no code; implementation is /pair's job.
disable-model-invocation: true
---

# Story

We refine a single story, right before building it. You propose and I decide.

## Steps

1. **Read the story** I give you (pasted text, GitHub issue, Jira ticket, etc.) and review the current code and `CLAUDE.md` to understand the context. **Also read `ARCHITECTURE.md`** (module catalog, dependency table, and its "known debt / open exceptions" section) if the repo has one.
2. **Confirm which module owns this story** against `ARCHITECTURE.md`'s module catalog. If the module isn't named there, or if more than one existing module could plausibly own it, **stop and ask me which one** — don't infer it from what seems reasonable. Say this explicitly in your output, even when the answer is obvious, so I can correct it if it's not.
3. **Acceptance criteria.** Propose 2–3 in Given/When/Then format. They only describe *what* the user sees or gets, never *how* it's implemented.
4. **If it needs more than 3 criteria, don't bloat it: propose splitting it.** Deliver the new stories in backlog format (`As a…, I want…, so that…`) for me to add to the tracker, and we continue with the first one.
5. **Mini plan.** 5 bullets max, no code or file names. How it cuts through the layers, with the minimum that meets the criteria.
6. **Wait for my approval.** We adjust until I say yes.

## Rules

- **Don't invent requirements.** If information is missing, ask me.
- **The simplest thing that meets the criteria.** No abstractions, layers, configuration or patterns "for the future".
- **No field, column, folder, or new module enters the plan without a named real consumer.** A real consumer is: an acceptance criterion that needs it, or an existing screen/flow that already expects it. "Might be useful later" or "other systems have it" is not a consumer — ask me, or drop it to "Suggestions".
- **If the plan would violate the dependency direction documented in `ARCHITECTURE.md`** (e.g. `shared` depending on a module, a module reaching into another module's internals instead of its public contract), flag it instead of proposing it, and ask how I want to resolve it.
- **Suggest, don't decide.** If a pattern could help (Atomic Design, middleware composition, extracting a component…), mention it under "Suggestions" with its why. Only suggest it if there's a concrete signal in the code (for example, something that already repeats), not in advance.
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
