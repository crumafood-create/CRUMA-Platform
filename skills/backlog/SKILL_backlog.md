---
name: backlog
description: Turns a software idea or a discussed feature into a backlog of short, vertical user stories. No acceptance criteria or implementation; that's /story's job.
disable-model-invocation: true
---

# Backlog

Your job is to help me split what I tell you into user stories. I bring the requirements; you order and slice them.

## Conversation

1. **If this repo has an architecture doc** (`ARCHITECTURE.md`, or a project-alignment doc under `docs/architecture/`), **read it before anything else.** It tells you:
   - Which expensive-to-change decisions are already settled (don't re-open them as questions — reflect them as given facts in the context).
   - Which modules already exist (built or reserved) and who owns what, so you don't slice a story around a module that doesn't exist or that two modules could plausibly own.
   - Any open question already logged as pending a decision (e.g. a module-ownership ambiguity) — treat those as still open, don't resolve them yourself while slicing.
2. Listen to the idea or feature. Reuse explicit answers and decisions already recorded in the conversation, `AGENTS.md`, `backlog.md` and `plan.md`. Ask only about missing information that changes the stories; group related gaps in one concise question with a recommendation.
3. If it's a new project, let's discuss the stack. Only the stack, not the architecture or implementation.
4. Ask whether any of these expensive-to-change decisions apply — **skip any that `ARCHITECTURE.md` already answers**, and say so instead of asking again:
   - Multi-tenant or multi-organization
   - Permissions or roles model
   - Offline or sync
   - Multi-language or multi-currency
5. Before adding or prioritizing a future story, establish its real actor, immediate task, current workaround and consequence of postponement. Ask only for missing answers; use concrete business examples and group related questions without sending a long questionnaire.
6. Propose the story and priority with a reason. Obtain one approval before adding or changing it in `pendientes.md`; an approved story may be saved without another confirmation. Do not activate it automatically.

## Rules

- **Don't invent requirements.** Only split what I told you. If you see a gap, ask me; don't fill it.
- **A story that would require a new module, top-level folder, or database field counts as a requirement.** If `ARCHITECTURE.md` doesn't already name a real consumer for it, ask me before it goes in the backlog — don't assume it's needed because it seems reasonable.
- **If a story would touch a module with disputed or unclear ownership** (per `ARCHITECTURE.md` or its linked alignment doc), ask me which module owns it before slicing — don't pick one silently.
- **Each story delivers value on its own** and cuts through every layer (data, backend, UI). Never split by layer.
- **No technical stories.** The actor is never the developer or the system. "Set up the database" or "create the user model" are not stories; that infrastructure gets built inside the first story that needs it.
- **Few stories.** 10–15 max. I'd rather add than cut.
- **One line per story.** No acceptance criteria, technical details or estimates. Keep priority, its reason and indispensable dependencies as separate metadata.
- The first story is the smallest one usable end to end (walking skeleton).

## Future stories and priority

- Use the existing `pendientes.md` for approved future stories and `backlog.md` for active work. Do not create another pending-story file or duplicate stories across them.
- Before changing the existing list, compare it with completed deliveries; do not infer completion solely from a title or a checkbox.
- Use a stable ID, story, priority, reason and indispensable dependencies. Preserve existing IDs; do not renumber them just to sort priorities.
- **P1:** blocks the next agreed operation or addresses a demonstrated data-integrity or access risk. **P2:** needed for that operation, with an acceptable temporary workaround. **P3:** a confirmed-consumer improvement that can wait.
- If business impact is unknown, ask before assigning priority or adding the story. A technical preference, a hypothetical future need or an audit finding alone does not establish priority.
- Do not turn every technical finding into a user story. Keep required implementation tasks inside the approved story; refine independent business value before proposing a future story.

## Output format

```markdown
## Context
<one or two lines: what it is and who it's for>
Stack: <what we agreed>
Expensive decisions: <the ones that apply, or "none">
Architecture doc checked: <yes/no, and anything it already settled>

## Backlog
1. As a <actor>, I want <action>, so that <benefit>.
2. As a <actor>, I want <action>, so that <benefit>. Requires: #1
```

Add `Requires: #N` only when a story makes no sense without another.

When done, follow the repository's agreed destinations for context and stories. Reuse an existing authorization to update those files; ask only if no destination or permission was established. Do not activate deferred stories without a request.

