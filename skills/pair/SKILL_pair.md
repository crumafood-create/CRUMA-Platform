---
name: pair
description: Implements an approved story through sequential small test-driven cycles, reusing existing approvals and reporting evidence. Pauses for unresolved decisions or scope changes; commits and publication require explicit authorization.
disable-model-invocation: true
---

# Pair

Implement one approved story at a time. Keep the user informed while progressing through its agreed scope.

## 1. Recover the agreement

- Read the story, owning module, criteria, plan and test list from the conversation and agreed repository files. Check them against `AGENTS.md` and `ARCHITECTURE.md`.
- Reuse explicit decisions and approvals. A handoff between skills, a new session or a failed command does not invalidate them.
- If the plan or test list is missing, propose only the missing part and obtain approval once. Combine related pending decisions in one concise question.
- Do not reopen a resolved ownership decision unless new evidence contradicts it.
- Inspect adjacent functions that produce or consume the affected data: contracts, actions, queries, RPC, views, triggers and screens. Check permissions, validation, atomicity, concurrency, units, costs and historical compatibility where relevant; keep this review bounded to the story.
- Fix what is necessary for approved behavior. Ask before changing a business rule or scope. Route independent improvements through `/backlog`: establish their real consumer and impact, then obtain one approval for the story and priority before adding it to `pendientes.md`. Do not add future stories automatically or start unrelated cleanup; apply the bounded dead-code policy below.
- Confirm unresolved business uses with the user: actor, moment, preceding and following steps, and consequence of removal. Reuse existing answers; do not preserve or extend a workflow merely because its code exists.

### Technical foundations

- For each technical decision, answer: **What real behavior does this protect, and what is the smallest solution that guarantees it?** Briefly explain material decisions in the existing plan or progress update. Do not ask the user to approve routine implementation choices again.
- Use the agreed authoritative source and owning module for affected data. Keep stored and derived values coherent and avoid competing write paths.
- Enforce permissions and input validation in the server. Protect database invariants against relevant writers; use atomic transactions and concurrency checks when required by the guarantee.
- Preserve the meaning of quantities and money: units, currency, price basis, precision and rounding. Do not silently convert or infer missing equivalences.
- Preserve compatibility with legacy data, references and in-flight operations. Version schema changes; do not overwrite applied migrations or fill unknown business data with invented defaults.

### Remove verified dead code

- Remove verified unused or behaviorally redundant code in the reviewed scope, as a separate small cleanup step with checks green. This project policy authorizes the removal without another approval for each function or file.
- Verify relevant consumers and side effects, including imports, framework routes and conventions, dynamic registration, RPC and SQL dependencies, jobs, external callers and public contracts where applicable. A search returning no matches is insufficient evidence on its own.
- Record what was removed, the evidence of non-use or redundancy, and the checks executed. Retain coverage of supported behavior; do not delete or weaken tests to conceal a defect.
- If the function's real use is uncertain, ask before removal. Do not extend cleanup across unrelated modules, remove a used flow without an approved business decision, delete historical migrations or treat data loss as having no effect.

### Keep code clean and organized

- Use clear names, cohesive responsibilities and explicit dependencies. Review long functions, files or modules for mixed responsibilities, duplication, complex control flow and difficulty testing; length alone is not a defect or a mandatory split threshold.
- Refactor demonstrated maintainability problems in the reviewed flow through small, behavior-preserving steps with tests green. This project policy authorizes those extractions and moves without another per-step approval; keep them separate from functional changes.
- Extract or relocate implementation to the owning layer defined by `ARCHITECTURE.md`. Update imports, consumers and tests while preserving public contracts, framework entry points, observable behavior and side effects.
- Ask before changing disputed ownership, permitted dependency direction, externally consumed contracts or unrelated flows. Do not relocate code merely to satisfy a structural test or to meet a line count.
- Avoid empty scaffolding, speculative abstractions, unnecessary wrappers and excessive fragmentation. Explain which responsibility was separated and verify the affected behavior.

## 2. Test list

- Derive test names and responsible layers from approved observable behavior. Prefer public interfaces and the highest practical test level.
- Mark manual checks explicitly. Distinguish local automated tests, SQL executed manually, concurrency checks and browser verification.
- Reuse an approved test list, including one approved together with the story plan. Routine fixture changes or subdivision of a case do not require a second approval.

## 3. Execute small cycles

1. Write or extend the next approved test.
2. Run it and confirm the failure demonstrates the intended missing behavior, rather than a fixture, mock, permission or environment problem.
3. Implement the minimum change required by that behavior.
4. Run the focused checks and record their actual result.
5. Continue with the next approved cycle. Stop after a cycle only when the user requested that checkpoint or a real blocker remains.

If the behavior already exists, add the missing coverage and report that no production change was needed. Do not manufacture a red test by breaking correct code.

- Complete a requested number of cycles sequentially. Do not write all tests first and implement everything afterward.
- Treat approximately 50 lines or three files as a signal to split into reviewable steps. Split autonomously within the approved scope; preserve the complete acceptance criterion.
- After two unsuccessful attempts, reassess the diagnosis. Continue if evidence identifies a routine fixture, mock or environment correction; pause if the cause remains unresolved or the next step needs a new decision.
- Give concise progress updates: what passed, what changed, what remains pending. Do not end each update with a permission question.
- If Docker, database access or browser verification is unavailable, complete independent authorized work and report the exact remaining check. Do not claim execution or completion without evidence.

## 4. Protect test meaning

- Derive expected results from the approved criteria, never from the production implementation.
- Do not reorder, extract or otherwise modify correct production code solely to satisfy an expectation about internal structure, source text, call order or a mock.
- Check whether order is observable or required for authorization, integrity or transactions before treating it as irrelevant.
- Correct an inaccurate expectation, fixture or mock when evidence shows it contradicts the approved behavior. Explain the mismatch, retain the original guarantee and rerun the affected checks without asking for permission again.
- For example, a table read is not a write: an integrity check must precede the actual mutation, but need not precede a harmless lookup.
- Never skip, delete or weaken a test to hide a defect or obtain green. Pause if correcting the test would change approved behavior or remove a guarantee.
- Keep refactoring separate from functional changes. Use the minimum implementation needed by the approved behavior; perform authorized organization, responsibility extraction and dead-code removal in their own verified steps.

## 5. Pause only for a real decision

Pause when:

- A business rule, module owner or architecture exception remains unresolved.
- The work would change criteria, expand scope, weaken a guarantee or add an element without a real consumer.
- The failure remains unexplained after reassessing the diagnosis.
- A required action is outside the user's explicit authorization.

Explain the blocker and recommend a concrete next step. Continue independent authorized work when possible.

## 6. Verify and deliver

- Run checks appropriate to the final changes, including existing related tests; a narrow subset can miss regressions in adjacent contracts.
- Review the complete final diff for scope, related regressions and unrelated or generated changes. When schema changes are involved, verify migration application from a clean baseline and applicable generated types using the existing workflow.
- After authorized publication, verify CI against the latest commit SHA. A green previous commit does not validate later changes; do not declare merge readiness while required checks remain pending or failed.
- Record executed checks and manual evidence separately from pending verification. Suggest an independent `/code-review` when implementation is complete.
- Update the agreed progress files without re-requesting an authorization already given. Flag architecture documentation changes if boundaries or dependencies are affected; do not silently resolve them.
- Do not commit, publish or merge without explicit authorization for that action. Prepare the reviewable change first and ask once if authorization is missing.
- Reuse authorization within its stated scope and conditions; do not ask again for each corrective commit or retry in the same delivery. Do not extend it to other stories, production migrations or merging.
- When the user retains commits, propose a commit message and the exact files to include. Keep unrelated working-tree changes separate.

