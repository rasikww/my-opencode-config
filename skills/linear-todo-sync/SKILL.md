---
name: linear-todo-sync
description: Sync open Linear issues assigned to you, and issues where you were mentioned in comments, into the Microsoft To Do lists "Assigned Work" and "Mentioned Work". Use when the user asks to sync Linear with Microsoft To Do, refresh assigned or mentioned tasks, or reconcile the two lists.
---

# Linear to Microsoft To Do sync

Reconcile two Microsoft To Do lists with Linear. Apply all changes in one run, then report the result. A second run with unchanged Linear data makes no changes.

Linear is read only. Never create, update, comment on, or mark a Linear item.

## Tools

- Linear: `linear_whoami`, `linear_list_issues`, `linear_get_notifications`, `linear_get_issue`.
- Microsoft To Do: `microsoft-todo_list_task_lists`, `microsoft-todo_list_tasks`, `microsoft-todo_create_task`, `microsoft-todo_update_task`, `microsoft-todo_complete_task`, `microsoft-todo_delete_task`.

Do not use any other Linear tool. Do not use `microsoft-todo_move_task`. Create the task in the target list and delete the old task instead.

## Definitions

- Open issue: status type is `backlog`, `unstarted`, or `started`. In this workspace this includes Backlog, In Review, On Hold, Todo, and In Progress.
- Closed issue: status type is `completed`, `canceled`, or `duplicate`. This includes Done and Closed.
- Assigned set: open issues assigned to the user.
- Mentioned set: open issues where the user was mentioned in a comment, minus the assigned set.
- Managed task: a To Do task whose title starts with a Linear identifier, for example `INT-330: Title`. Never change a task that is not managed.

## Preconditions

1. Call `linear_whoami`. Keep the user id and name.
2. Call `microsoft-todo_list_task_lists` with `verbose: true`.
3. Find the lists named exactly `Assigned Work` and `Mentioned Work`.
4. If either list is missing, stop and ask the user to create it. The Microsoft To Do API cannot create lists.

## Step 1: Read current To Do tasks

For each of the two lists, call `microsoft-todo_list_tasks` with `top: 100`, `paginate: true`, and `verbose: true`.

Keep completed tasks. They prevent the skill from recreating work the user already finished.

A task is managed when its title matches `^([A-Za-z][A-Za-z0-9]*-\d+)\b`. Uppercase the identifier for comparison.

Build a map of identifier to the managed tasks that carry it. A task without a leading Linear identifier is unmanaged. Ignore it.

## Step 2: Read assigned issues

Call `linear_list_issues` with `assignee: "me"`, `limit: 250`, and these fields:

`id`, `title`, `status`, `statusType`, `priority`, `dueDate`, `project`, `url`, `assignee`, `assigneeId`

Follow `cursor` while `hasNextPage` is true. Keep issues whose `statusType` is `backlog`, `unstarted`, or `started`. Drop every other issue. Build a map of identifier to issue.

## Step 3: Read mention notifications

Call `linear_get_notifications` with `limit: 250`. Follow `cursor` while `hasNextPage` is true.

Keep a notification when both conditions hold:

- `type` contains `mention` in any case.
- `url` contains `/issue/`.

Ignore project update mentions and document mentions. Parse the identifier from the URL with `/issue/([A-Za-z][A-Za-z0-9]*-\d+)/`.

Keep the newest notification for each identifier. Read state does not matter. Do not filter on `readAt` or `archivedAt`.

## Step 4: Resolve mention issues

For each identifier from Step 3, call `linear_get_issue` with `id: "<identifier>"` and the same fields as Step 2. The parameter is `id`, not `issueId`.

The tool may return the issue at the top level or under `issue`. Handle both.

Drop the issue when any condition holds:

- The call fails because the issue is deleted.
- The status type is closed.
- The identifier is in the assigned map.
- The assignee is the user. Compare `assigneeId` with the user id. If `assigneeId` is absent, compare `assignee` with the user name.

The remaining issues form the mention map.

## Step 5: Keep existing mentioned tasks

Some notifications may be missing from the inbox, for example after the user archives them. Mentions do not expire, so do not delete an existing mentioned task only because its notification is gone.

For each managed task in `Mentioned Work` whose identifier is in neither the mention map nor the assigned map:

1. Call `linear_get_issue` if the issue is not resolved yet.
2. If the issue is open and unassigned, add it to the mention map.
3. If the issue is closed or deleted, leave it out. The task will be deleted.

## Step 6: Build the desired state

Create one entry per identifier:

- Assigned map → `Assigned Work`.
- Mention map → `Mentioned Work`.

An identifier appears in one list only. Assigned wins.

## Step 7: Reconcile

Process every identifier in the union of the desired state and the managed task map.

If several managed tasks share an identifier, keep one and delete the rest. Choose the primary task in this order:

1. The task in the desired list.
2. A task that is not completed.
3. The first task returned.

Report the deleted duplicates.

Then apply the first matching case:

### Missing task

The identifier is desired and no managed task exists.
Create it in the desired list with the fields from "Task fields".

### Correct list

The task is in the desired list.

- If the task status is `completed`, leave it alone. Do not reopen it, update it, or recreate it. The user marked the work done. Delete it only when the Linear issue closes.
- Otherwise update the title, body, due date, and importance when they differ. Never change the To Do status. Never set `inProgress` when Linear starts an issue.
- If the Linear issue has no due date and the task has one, delete the task and create it again without a due date. `update_task` cannot clear a due date.

### Wrong list

The task is in the other list.

1. Create a task in the desired list with the fields from "Task fields".
2. If the old task was completed, call `microsoft-todo_complete_task` on the new task.
3. Delete the old task.

If the create or complete call fails, keep the old task and report the error. Do not delete it.

### No longer desired

A managed task has no desired entry. Delete it. Do not complete it.

This covers closed issues, deleted issues, and unassigned issues that are not in the mention map.

## Task fields

- Title: `{IDENTIFIER}: {Linear title}`. Truncate to 250 characters.
- Body, plain text:

  ```
  Status: {status}
  Priority: {priority name or "None"}
  Project: {project or "None"}

  {url}
  ```

  For `Mentioned Work`, append one line:

  ```
  Mentioned by {author}: {comment text}
  ```

- Importance: Urgent or High → `high`. Medium → `normal`. Low → `low`. None → `normal`.
- Due date: `{YYYY-MM-DD}T00:00:00` with `time_zone: "Asia/Colombo"` when the issue has a due date. Omit both when it has none. If Microsoft rejects the time zone, retry with `Sri Lanka Standard Time`. Microsoft stores the instant in UTC, so `2026-11-27` becomes `2026-11-26T18:30:00Z`.
- Status: do not set it on create. Set `completed` only when moving a completed task.
- Do not add categories, checklists, linked resources, or extensions.

Compare the current task with the generated fields before an update. The body in a verbose response is an object. Compare its `content`. For the due date, convert the stored UTC `dateTime` to `Asia/Colombo` and compare the date with the Linear due date. Do not compare the raw UTC date part. Skip the update when all values match.

## Report

Print a short report:

- Assigned open issues: count.
- Mentioned open issues: count.
- Created: identifiers.
- Updated: identifiers.
- Moved: identifiers with source and target list.
- Deleted: identifiers with reason.
- Skipped completed: identifiers.
- Unmanaged tasks: count only.
- Errors: one line per failed item.

Sort each group by due date ascending, then priority, then title. Put tasks without a due date last.

Do not try to reorder tasks inside Microsoft To Do. The To Do app controls display order.

## Rules

- Never write to Linear. Do not call `linear_save_issue`, `linear_save_comment`, `linear_mark_notification`, or any other write tool.
- Never delete or update an unmanaged task.
- Never recreate a completed managed task in the same list while its Linear issue is open.
- Never add an assigned issue to `Mentioned Work`.
- Never create a Microsoft To Do list.
- Apply changes immediately. Do not ask for confirmation.
- If one item fails, continue with the rest and report the error.
- If a list is missing or Linear authentication fails, stop and report the problem.
