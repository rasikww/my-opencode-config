---
name: pr-description
description: Generate PR titles and descriptions from git changes. Detects frontend vs backend, finds Linear issues, checks Bruno collection for API gaps, captures screenshots for UI changes, and creates the PR via gh. Use when the user asks to create a PR, write a PR description, or prepare a PR for the current branch.
---

# pr-description

Generate a PR title and description from the current branch's changes. Detect the PR type from changed files. Find and link Linear issues. For backend PRs, check the Bruno collection for missing API endpoints. For frontend PRs, capture screenshots of affected views. Show the title and description to the user for review before creating the PR.

The clear-writing skill applies to all prose in the PR description. Use the **flavored** mode: active voice, simple tenses, short sentences, no phrasal verbs, no marketing adjectives, no semicolons or em dashes. The description explains what changed and why, not how the code works.

## Workflow

Follow these steps in order. Do not skip a step.

### Step 1 — Detect PR type

Run `git diff main...HEAD --name-only` to get the list of changed files.

Classify the PR:

| Pattern                                                         | Type      |
| --------------------------------------------------------------- | --------- |
| `*.tsx`, `*.css`, `*.scss`, `apps/web/`, `components/`          | Frontend  |
| `src/**/*.ts` (controllers, services, repositories, migrations) | Backend   |
| Files from both categories                                      | Fullstack |

### Step 2 — Find Linear issue

Parse the branch name for an issue key. Common patterns: `INT-123`, `feat/INT-123-description`, `fix/int-123-description`.

If a key is found:

1. Search Linear with `linear_list_issues` using the key as query.
2. Get the issue URL.
3. Use `[INT-123](url)` at the top of the PR description.
4. Use `[INT-123]` in the PR title.

If no key is found:

1. Use `[NO TICKET]` at the top of the PR description.
2. Generate a meaningful title from the main changes (not just "topic").

### Step 3 — Analyze API changes (backend only)

Skip this step for frontend-only PRs.

1. Scan the diff for new or changed controller route decorators (`@Get`, `@Post`, `@Put`, `@Delete`, `@Patch`).
2. Look for new or updated DTOs and migration files.
3. List the Bruno `dms` collection with `bruno-mcp_list_requests` (collection path: `D:/Files/DBox/OneDrive/Documents/bruno/dms`).
4. For each new or changed endpoint in the diff:
   - Check if a matching request exists in the Bruno collection (match by HTTP method and route path).
   - If missing, create it with `bruno-mcp_create_request`. Use the existing Bruno folder structure. Place the request in the folder that matches the domain (e.g., `document`, `user`, `tenant`).
5. Record the affected endpoints for the API Changes table.

### Step 4 — Generate PR title

The title must:

- Start with the issue key if found: `[INT-123]` or `[NO TICKET]`
- Follow with a quoted summary of the main change: `meaningful summary`
- Use imperative mood: "Add", "Fix", "Update", "Remove"
- Stay under 72 characters total
- Describe the outcome, not the mechanism

Examples:

- `[INT-282] Add document sharing via time-limited links`
- `[NO TICKET] Fix metadata validation on document upload`
- `[INT-150] Update tenant storage settings endpoint`

### Step 5 — Generate PR description

Write the description in clear-writing **flavored** mode. Apply these rules:

- Active voice: "This change adds X", not "X is added"
- Simple tenses: present, past, future. No present perfect.
- Short sentences: max 25 words per sentence
- No phrasal verbs: use "start" not "spin up", "add" not "roll out"
- No marketing adjectives: seamless, robust, powerful, cutting-edge
- One name for one thing. Do not rotate synonyms.
- Use plain connectors: but, then, as a result. No semicolons.

Structure:

```markdown
[Int-282](linear-url)

## Summary

<One sentence. What this PR does in plain terms.>

## What changed

- <Bullet for each concrete change. Use labels, not full sentences.>

## Why

<The problem this solves. How it affects the user. Max 3 sentences.>

## How to test

1. <Step-by-step instructions. One action per item.>
```

For **backend PRs**, add:

```markdown
## API Changes

| Method | Endpoint          | Description       |
| ------ | ----------------- | ----------------- |
| POST   | /api/v1/documents | Create a document |

Bruno collection: `dms` — folder: `document`
```

For **frontend PRs**, add a `## Screenshots` section (see Step 6).

If risks or rollback steps are needed, add:

```markdown
## Risks and rollback

<What could go wrong. How to revert.>
```

Do not add empty sections. Only include sections that add value.

### Step 6 — Capture screenshots (frontend only)

Skip this step for backend-only PRs.

Use Playwright MCP to capture screenshots of views affected by the changes.

1. Identify the affected views or pages from the changed files (route definitions, component names, page files).
2. Start the server if it is not running: run `npm run build && npm run start` in the background.
3. Use Playwright MCP tools to navigate to each affected view.
4. Take a screenshot of each view.
5. Save screenshots to a temp directory.
6. Add each screenshot to the PR description under `## Screenshots`:

```markdown
## Screenshots

### Document List View

![Document list view](path/to/screenshot.png)

### Document Detail View

![Document detail view](path/to/screenshot2.png)
```

Use descriptive titles that explain what the screenshot shows.

### Step 7 — Show to user for review

Present both the PR title and description to the user. Do not create the PR yet.

Format the output:

```
**PR Title:**
[INT-282] "Add document sharing via time-limited links"

**PR Description:**
<Int-282>(url)

## Summary
...
<rest of the description>
```

Ask the user:

- "Do you approve this title and description?"
- "Any changes before I create the PR?"

### Step 8 — Create PR

On user approval, run:

```bash
gh pr create --title "PR_TITLE" --body "PR_DESCRIPTION"
```

If the command fails, show the error and ask the user how to proceed.

## Bruno collection reference

The Bruno collection is at `D:/Files/DBox/OneDrive/Documents/bruno/dms`. It has requests across these folders:

- AUTH, Email Attachments, Gmail watch, Outlook emails
- advanced search, autorag, bulk upload-create, dashboard
- default tag, demurrage watch, document, document category
- document history, document tag, document tag assignment
- document type, document user access assignment, document version
- email attachment import rules, email body search
- intelligence (findings, rules), my documents
- permission, push notifications, push subscriptions
- search, search-bookmarks, service account
- task management, tenant, tenant storage settings
- upload related apis storage, user, user group
- user role, user settings, user tag assignment, user tenant info

When creating missing requests, use the folder that matches the domain. Match the naming style of existing requests in that folder.

## Guards

- Never guess the Linear issue key. If the branch name does not contain one, use ``.
- Never create a PR without showing the title and description to the user first.
- Never add empty sections to the description.
- Never include changed file names or diff stats in the description.
- If the dev server is already running, do not start another instance.
- Preserve code identifiers exactly in the description. Do not rename variables or functions.
