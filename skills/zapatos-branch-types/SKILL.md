---
name: zapatos-branch-types
description: Regenerate the committed Zapatos schema types from the current branch's migrations in a throwaway database, so types from other branches do not leak into the generated file. Use when asked to get proper Zapatos types for the branch, regenerate Zapatos types, clean the generated schema, or refresh types after a migration.
---

# zapatos-branch-types

Generate `src/generated/zapatos/schema.d.ts` from a database that contains only the current branch's committed migrations. Keep the shared development database, its data, and its other-branch tables untouched.

## When to use

- The user asks for "proper Zapatos types for the branch", "regenerate Zapatos types", or "clean the generated schema".
- A migration is committed and the generated types must match it.
- The generated file contains namespaces for tables that no committed migration in the branch creates.
- A new branch needs types without resetting the shared development database.

## Why this is needed

`zapatos:generate` reads the live database named by `DATABASE_NAME`. The shared development database can contain schema from other branches. Generating against it copies those tables into the committed types file.

`migrations/committed/` is the source of truth for a branch. Build a throwaway database from it, then generate.

## Preconditions

1. The branch's migrations are committed. `migrations/current.sql` must hold only its placeholder comment. If it contains uncommitted DDL, commit it first, because `db:reset` applies only `committed/`.
2. Migration order is valid:

   ```bash
   npm run check:migrations-order
   ```

3. `.env` contains `NODE_ENV=development`, `DATABASE_NAME`, `DATABASE_OWNER`, `DATABASE_OWNER_PASSWORD`, `POSTGRES_ROOT`, `POSTGRES_ROOT_PASSWORD`, `DB_HOST`, and `DB_PORT`.
4. `db:reset` is development-only. On a managed or non-development database, use the `db:provision` alternative below.

## Workflow

Pick a throwaway database name that differs from `DATABASE_NAME`. Keep it short, because `db:reset` also creates `<name>_shadow`.

PowerShell:

```powershell
$typesDb = '<branch>_types'
$env:DATABASE_NAME = $typesDb
npm run db:reset
npm run zapatos:generate
Remove-Item Env:DATABASE_NAME
```

Bash:

```bash
export DATABASE_NAME='<branch>_types'
npm run db:reset
npm run zapatos:generate
unset DATABASE_NAME
```

`db:reset` drops and recreates the throwaway database and its shadow, then applies `migrations/committed/` from `000001` to the newest migration. `zapatos:generate` connects to the same database because the script reads `process.env.DATABASE_NAME`, and `dotenv/config` does not override an existing environment variable.

## Verify

1. Confirm the types file changed:

   ```bash
   git diff --stat src/generated/zapatos/schema.d.ts
   ```

2. Confirm every added namespace maps to a committed migration:

   ```bash
   git diff src/generated/zapatos/schema.d.ts | grep '^+    export namespace'
   ```

   If a namespace appears that no committed migration creates, the generation database still has leftovers or the pending migration was not committed.

3. Compile:

   ```bash
   npm run build
   ```

4. Commit the regenerated file, separately or with the migration. A common message is `feat: generate zapatos types`.

## Alternatives

**Shadow database.** After the last `db:migrate` or `db:commit`, the shadow database is built from committed migrations. It is faster because no database is created.

```powershell
$env:DATABASE_NAME = '<DATABASE_NAME>_shadow'
npm run zapatos:generate
Remove-Item Env:DATABASE_NAME
```

The shadow is a Graphile Migrate artifact and can be dropped by later migration runs. The dedicated database is more explicit and repeatable.

**Existing empty database.** Use this when `db:reset` is blocked or the database must not be dropped.

1. Create an empty database owned by `DATABASE_OWNER`.
2. Run:

   ```powershell
   $env:DATABASE_NAME = '<branch>_types'
   npm run db:provision
   npm run zapatos:generate
   Remove-Item Env:DATABASE_NAME
   ```

`db:provision` builds the schema in an existing database and skips migrations already recorded.

## Common mistakes

- Running `db:reset` without the `DATABASE_NAME` override. This drops the real development database. Confirm the variable value before the command.
- Forgetting to restore `DATABASE_NAME`. On PowerShell, `Remove-Item Env:DATABASE_NAME`. On bash, `unset DATABASE_NAME`.
- Generating before committing `current.sql`. Only committed migrations are applied.
- Committing the generated file while foreign namespaces remain. Check the diff.
- Using `db:uncommit` to clean schema leftovers. It only moves the latest committed migration back to `current.sql` and removes local tracking. It does not drop schema objects.
- Editing `src/generated/zapatos/schema.d.ts` by hand. Always regenerate.

## Report

State:

- The throwaway database name.
- The commands run.
- The namespaces added or removed in `schema.d.ts`.
- The `npm run build` result.
- The commit hash, if committed.
