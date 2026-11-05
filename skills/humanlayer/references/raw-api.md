# Raw HumanLayer API commands

Use these when the `hl` helper is missing. They cover the same operations.

## Tasks

```
humanlayer api tasks list --limit 100 --offset 0
```

Paginate in steps of 100 until a page returns fewer than 100 rows.

## Artifacts for a task

```
humanlayer api sync v2 artifacts --where '{"type":"comparison","field":["task_id"],"operator":"eq","value":"<task-id>"}' --limit 1000
```

The `--where` value is JSON with this shape:

```json
{ "type": "comparison", "field": ["task_id"], "operator": "eq", "value": "<task-id>" }
```

Rows include `id`, `file_name`, `content`, `content_hash`, `storage_type`, and timestamps. For `storage_type: "postgres"`, `content` holds the text. For `storage_type: "s3"`, `content` is empty and you need the download URL.

## Download one artifact

```
humanlayer api artifacts get --task-id <task-id> --file-name <file-name>
```

The response is one of:

- `{ "storageType": "postgres", "content": "..." }`
- `{ "storageType": "s3", "downloadUrl": "https://..." }`

Fetch the URL with `curl`, `Invoke-WebRequest`, or `fetch`. The URL is signed and expires.

## Sessions

```
humanlayer api sessions list --task-id <task-id> --limit 100 --offset 0
```

## Session transcript

```
humanlayer api sync v2 conversation-events --where '{"type":"comparison","field":["session_id"],"operator":"eq","value":"<session-id>"}' --limit 1000
```

Sort by `created_at`, then `run_index`. Events include messages, tool calls, and tool results.

## Push an artifact

```
humanlayer api artifacts upsert --task-id <task-id> --file-name <name> --content <text>
```

Limits:

- Content size: 10 MB.
- Windows command line: about 32,000 characters. Larger content fails before the API is reached.

## Comment on an artifact

```
humanlayer api comments create --artifact-id <artifact-id> --content-text <text>
```

Find the artifact ID in the `sync v2 artifacts` rows.

## Notes

- Commands print JSON to stdout. Errors go to stderr with a non-zero exit code.
- Run `humanlayer login` if a command returns an authentication error.
- `humanlayer api auth user info` shows the current user, organization, and role.
