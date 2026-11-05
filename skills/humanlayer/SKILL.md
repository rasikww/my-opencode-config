---
name: humanlayer
description: Work with the organization's HumanLayer project from OpenCode. Use when the user mentions HumanLayer, org tasks, task plans, PRDs, TDDs, design docs, prior agent sessions, or asks to pull context from other developers or push work back to HumanLayer.
---

# HumanLayer

HumanLayer is the shared system of record for the organization's tasks, plans, and agent sessions. Use the `hl` helper to read live data and to push work back.

## Before you start

- Run `hl status`. It prints the HumanLayer binary, the signed-in user, and the current repo.
- If authentication fails, run `humanlayer login`.
- Never push without explicit confirmation from the user.

## Find a task

- `hl list` shows active tasks with slug, name, status, updated time, and owner.
- `hl list --match <text>` narrows by name or slug.
- `hl list --all` includes archived tasks.
- `hl list --json` returns raw task records.

Copy the exact slug. Slugs are long and usually end in a short suffix.

## Read a task

`hl show <slug>` prints the task summary, description, artifact list, and sessions. It uses the local mirror when one exists and fetches live data otherwise.

- `hl show <slug> --artifact <file-name>` prints one artifact's full text.
- `hl show <slug> --session <session-id>` prints a session transcript.
- `hl show <slug> --full` removes truncation.
- `hl show <slug> --out <file>` writes the output to a file. Use this for binary artifacts.

Artifacts include plans, PRDs, TDDs, research notes, and review files. Session transcripts include prompts, replies, tool calls, and results.

## Pull a local mirror

Pull when you want to grep, diff, or hand files to another tool.

- `hl pull --task <slug>` writes `<repo>/.humanlayer/tasks/<slug>/`.
- `hl pull --all --since 2026-10-01` pulls every task updated since a date.
- `hl pull --task <slug> --transcripts` also writes one markdown file per session.
- To make a task the repo default, write its slug to `.humanlayer/active-task`, then `hl pull` uses it.

The layout is:

```
.humanlayer/tasks/<slug>/
  README.md          task summary and artifact links
  _task.json         raw task record
  artifacts/         every artifact, original names
  sessions/INDEX.md  session list
  sessions/*.md      transcripts, only with --transcripts
  manifest.json      content hashes for incremental pulls
```

Re-running a pull is incremental. S3-backed artifacts are downloaded through presigned URLs.

## Search

Use ripgrep when available:

```
rg -n "<query>" .humanlayer/tasks
```

On PowerShell without `rg`:

```
Get-ChildItem .humanlayer\tasks -Recurse -File | Select-String "<query>"
```

Task descriptions are in each `README.md`.

## Push work

1. Run a dry run first: `hl push <slug> <file> --dry-run`.
2. Show the user the task, file name, and character count. Ask for confirmation.
3. Push with `hl push <slug> <file>`. Add `--comment "<text>"` to leave a note on the artifact.
4. In a non-interactive shell, pass `--yes` only after the user has confirmed.

`hl push` replaces the artifact that has the same file name. Prefer a new file name, or a comment, when the target is another developer's document.

Windows limits a process command line to about 32,000 characters. `hl push` refuses larger files. Use the HumanLayer web UI for those.

## Guardrails

- Do not commit `.humanlayer/tasks/`. Add it to `.gitignore`.
- Do not push secrets, `.env` files, credentials, tokens, or customer data.
- Read before you write. Prefer `hl show` plus a comment over overwriting.
- Confirm the task slug and file name before any write.
- A local mirror can be stale. Use `hl show` when freshness matters.

## When `hl` is unavailable

Read `references/raw-api.md` for the equivalent `humanlayer api` commands, including the `--where` JSON shape and the S3 download flow.
