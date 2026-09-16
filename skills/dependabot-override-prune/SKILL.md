---
name: dependabot-override-prune
description: Check npm package.json overrides against the natural dependency resolution on a checked-out Dependabot branch and remove the overrides the update made redundant. Use when the user asks to prune overrides, check if an override is still needed, reconcile overrides with a Dependabot branch, or clean up vulnerability overrides.
---

# dependabot-override-prune

Report which `overrides` in an npm `package.json` are still needed. An override is redundant when the dependency tree now resolves the package to the same version, or a higher version, without it. Remove the redundant ones. Keep the rest.

The clear-writing skill applies to all prose in the report. Use the **flavored** mode.

## Why this is not a lockfile diff

An override masks the version the tree would choose on its own. Dependabot does not touch the `overrides` block, so a Dependabot branch keeps the override and the lockfile keeps the pinned version.

Two npm behaviors defeat the obvious manual checks.

1. npm does not re-resolve when an override changes. A plain `npm install` reports "up to date", the lockfile stays byte-identical, and `npm ls` shows the old pinned version. Removing an override by hand and reading `npm ls` therefore proves nothing.
2. A re-resolution inside the repo still reuses the installed `node_modules`. Deleting only the lockfile is not enough. The result comes back biased to what is already installed, which for an overridden package is the pinned version. Every override then looks redundant.

The script avoids both. It copies `package.json` into a throwaway directory with no `node_modules` and no lockfile, removes one override, and lets npm resolve from the registry. That version is the natural resolution. The repo is never modified during a check.

The natural resolution is the highest version the parent ranges allow. A stale override that pins an older version therefore reports `REDUNDANT`, and removing it lets the dependency move forward.

## Prerequisites

- The target is an npm repo with `package.json` and `package-lock.json`.
- The Dependabot branch is already checked out. The script never switches branches.
- Network access for the npm registry.
- Node 18 or newer. The script uses no dependencies.
- npm workspaces are supported by copying member manifests into the temp directory. Verify results with `--list` on a workspace repo.

## Workflow

### Step 1: Locate the repo

Use the repository root of the current working directory. If the working directory is not the repo, ask the user for the path and pass `--repo <path>`.

### Step 2: List the overrides

```
node "<skills>/dependabot-override-prune/scripts/analyze-overrides.mjs" --repo <path> --list
```

This runs no installs. Show the user the override list and the parent chains.

### Step 3: Confirm the cost

The full check resolves the tree once per override, in an isolated directory. Expect about 15 to 30 seconds per override with a warm npm cache, and longer on the first run. Tell the user the estimate and get approval. To check a subset, pass `--only name1,name2`.

### Step 4: Run the check

```
node "<skills>/dependabot-override-prune/scripts/analyze-overrides.mjs" --repo <path>
```

### Step 5: Show the verdicts

Read the verdict column.

| Verdict | Meaning | Action |
| --- | --- | --- |
| `REDUNDANT` | The tree resolves the package at or above the pinned version without the override. | Propose removal. |
| `KEEP` | The tree resolves lower without the override. | Leave it. |
| `REVIEW` | The override is a `$name` self-reference, or the package appears only on one side. | Ask the user. Never remove it unprompted. |
| `NOT-PRESENT` | The package is not installed. The override is a no-op. | Propose removal, but flag it. |
| `ERROR` | The install failed. | Report the message. Do not remove. |

Show the whole table, including `KEEP` rows. The user needs to see that the tool found both outcomes.

When `Natural` is above `Pinned`, say so plainly. The override is stale, and it holds the package below the version the tree would otherwise take.

### Step 6: Apply on approval

Ask the user which `REDUNDANT` entries to remove. Never remove a `KEEP`, `REVIEW`, `ERROR`, or `NOT-PRESENT` entry without an explicit instruction.

```
node "<skills>/dependabot-override-prune/scripts/analyze-overrides.mjs" --repo <path> --apply --only name1,name2
```

Applying removes the entries from `package.json` and runs `npm install --ignore-scripts`. The lockfile normally stays unchanged, because the resolution already matches.

### Step 7: Verify

1. Run `git diff package.json`. Confirm only the approved override lines are gone.
2. Run `git diff --stat package-lock.json`. Confirm the lockfile is unchanged. A large lockfile diff means the removal changed the resolution. Stop and tell the user.
3. Run `npm ci --dry-run --ignore-scripts`. Confirm exit code `0`. This proves the CI install still accepts the package.json and lockfile pair.
4. Tell the user the lockfile still holds the old versions. A later lockfile refresh moves each package to its natural version.
5. Do not commit. The user reviews and commits.

## Guards

- Never remove an override the script did not mark `REDUNDANT`.
- Never remove the whole `overrides` block. Remove entries only.
- Never switch branches, commit, or push.
- The script backs up `package.json` and `package-lock.json` and restores them on every exit path. If a run is interrupted, check `git status` before continuing.
- Installs run with `--ignore-scripts`, `--no-audit`, and `--no-fund`.
- If the base branch is unclear, or the script reports `ERROR`, stop and ask.

## Script reference

`scripts/analyze-overrides.mjs [--repo <path>] [--only a,b] [--list] [--apply] [--json] [--timeout <ms>] [--keep-temp] [--exit-code]`

- Exit `0` on success. Exit `1` on error. Exit `2` when redundant overrides exist and `--exit-code` is set.
- `--json` prints the full result, including every resolved copy and parent edge.
- `--keep-temp` keeps the temp resolution directory for inspection.
- Override forms handled: flat, parent-scoped object, `name@selector`, and `$name` self-references.
