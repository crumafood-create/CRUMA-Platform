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
2. Listen to the idea or feature. If something is unclear, ask. One question at a time, with your suggested answer.
3. If it's a new project, let's discuss the stack. Only the stack, not the architecture or implementation.
4. Ask whether any of these expensive-to-change decisions apply — **skip any that `ARCHITECTURE.md` already answers**, and say so instead of asking again:
   - Multi-tenant or multi-organization
   - Permissions or roles model
   - Offline or sync
   - Multi-language or multi-currency
5. Propose the backlog. I adjust it.

## Rules

- **Don't invent requirements.** Only split what I told you. If you see a gap, ask me; don't fill it.
- **A story that would require a new module, top-level folder, or database field counts as a requirement.** If `ARCHITECTURE.md` doesn't already name a real consumer for it, ask me before it goes in the backlog — don't assume it's needed because it seems reasonable.
- **If a story would touch a module with disputed or unclear ownership** (per `ARCHITECTURE.md` or its linked alignment doc), ask me which module owns it before slicing — don't pick one silently.
- **Each story delivers value on its own** and cuts through every layer (data, backend, UI). Never split by layer.
- **No technical stories.** The actor is never the developer or the system. "Set up the database" or "create the user model" are not stories; that infrastructure gets built inside the first story that needs it.
- **Few stories.** 10–15 max. I'd rather add than cut.
- **One line per story.** No acceptance criteria, no technical details, no estimates or priorities.
- The first story is the smallest one usable end to end (walking skeleton).

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

When done, offer to save the context and stack in `CLAUDE.md` (or `AGENTS.md`). The stories go to my tracker; don't save them to files unless I ask.
