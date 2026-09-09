---
name: test-auditing
description: Audit test files changed or created in the current branch against industry standards and framework best practices, then write a missing-tests report. Use when the user asks to audit tests, review test coverage on a branch, find missing tests, or run a test audit.
---

# test-auditing

Audit every test file changed or created in the current branch. For each file, research the standards for its scope and framework, build the ideal test matrix, compare it with the actual tests, and collect findings. Rebuild one report at `docs/test-audits/missing-tests.md` in the audited repo. You orchestrate. The `test-auditor` subagent does the per-file research.

The clear-writing skill applies to all prose in the report. Use the **flavored** mode.

## Workflow

Follow these steps in order. Do not skip a step.

### Step 1 — Find changed test files

1. Detect the base branch. Check `main`, then `master`. Use the one that is not the current branch. Ask the user if the base is unclear.
2. Run `git diff <base>...HEAD --name-only`.
3. Filter to test files. A test file matches one of these patterns:
   - Any `*.test.*` or `*.spec.*` file (`*.test.ts`, `*.test.js`, `*.test.tsx`, `*.test.py`, `*.test.go`, and the rest)
   - Any file under `__tests__/`, `test/`, `tests/`, `e2e/`, or `spec/`
4. If the user names specific files, audit only those.
5. If no test files changed, stop and say so.
6. If more than 15 test files changed, confirm with the user before continuing.

### Step 2 — Map tests to sources

For each test file, find its source file:

1. Read the test file imports. The module under test is usually the import with the longest relative path or the deepest project-internal path.
2. Fall back to naming conventions: `foo.test.ts` → `foo.ts`, `__tests__/foo.ts` → `../foo.ts`, `src/foo.spec.ts` → `src/foo.ts`.
3. If no source maps cleanly, mark the file as standalone (e2e or integration).
4. Detect the language and test framework from imports, `package.json`, config files (`vitest.config`, `jest.config`, `pytest.ini`, `go.mod`), or the folder layout.

### Step 3 — Checkpoint

Show the user a table before running:

| Test file | Source | Scope guess | Framework |
| --------- | ------ | ----------- | --------- |

Ask: "Proceed with auditing all of these?" Wait for approval.

### Step 4 — Per-file audit

For each test file, in order:

1. Dispatch a task to the `test-auditor` subagent. Pass: repo root, test file path, source file path (or "none"), language, framework, and scope hints.
2. If two files share the same scope and framework, pass a reuse hint: "An earlier audit in this run already researched <scope> with <framework>. Reuse its sources and focus on what differs."
3. Collect the findings block from each task.
4. If a findings block is malformed or missing sections, re-run the task with the format reminder. Never invent findings.

### Step 5 — Write the report

1. Create `docs/test-audits/` in the audited repo if it does not exist. In a monorepo, prefer the affected package's `docs/` when it exists, else the repo root.
2. Rebuild `missing-tests.md` from scratch each run. Never append.

Format:

```markdown
# Test Audit Report

Generated: <date> | Branch: <branch> | Base: <base> | Files audited: <n>

## Summary

| Test file | Source | Missing | Discrepancies | High priority |

<one row per file>

## <test file path>

### Scope

<one line from the subagent>

### Sources

<cited URLs with one-line notes>

### Missing tests

<priority-ordered list from the subagent>

### Discrepancies

<severity-ordered list from the subagent>

### Notes

<assumptions and conflicts>

## Recommended actions

<numbered list of the highest-value additions across all files, priority first>
```

Omit a section when it is empty.

### Step 6 — Handoff

Tell the user:

- How many files were audited.
- Total missing tests and discrepancies, and how many are high priority.
- The top 3 recommended actions.
- The report path.

Do not commit anything.

## Guards

- The only file write is the report. Never touch test or source files.
- Rebuild the report each run. Never append.
- Never commit. The user reviews and acts.
- Preserve code identifiers exactly in the report.
- Reuse research across files with the same scope and framework.
- If the subagent returns malformed findings, re-run the task. Never invent findings.
- If research conflicts with observed code behavior, the code wins. Flag the conflict in the report.
