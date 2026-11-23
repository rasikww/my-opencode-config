---
name: api-developer-guide
description: Create or update a developer guide or API reference for a feature, module, or service. Use when asked to write developer documentation, API docs, onboarding docs, integration docs, or a technical guide for other developers.
---

# api-developer-guide

Create a developer guide that another developer can use without reading the implementation first. Cover the why, the domain model, the logic, the API, the operations, and the failure modes. Verify every claim against the code.

The clear-writing skill applies to all prose. Use the **flavored** mode. Keep code identifiers, field names, error codes, enum values, and command syntax exact.

## Workflow

Follow these steps in order. Do not skip a step.

1. Fix the scope and audience.
   - What feature, module, or service does the guide cover?
   - Who reads it: backend developers, frontend developers, integrators, operators, or reviewers?
   - What is out of scope? State it.
2. Read the code, not the plan.
   - Find the routes, controllers, DTOs, response types, error classes, permissions, and schema.
   - Find the write path: ingestion, jobs, workers, transactions, and retries.
   - Find the tests. They show the intended contract and the edge cases.
3. Verify the public contract.
   - Endpoint paths and HTTP methods.
   - Authentication and permission strings.
   - Query and path parameters, defaults, limits, and validation.
   - Request and response shapes, including nullable fields and enums.
   - Pagination envelope, sort metadata, and error envelope.
   - Status codes and error codes.
   - Ownership and tenant behavior.
4. Choose the guide shape.
   - A single feature guide when the reader needs the whole picture.
   - A separate API reference when the public contract is large.
   - A runbook section when operators must deploy, monitor, or recover the feature.
5. Build the outline from the standard structure below.
6. Draft with examples that match the code.
7. Validate against the checklist.
8. Link the guide from the project index or the module README.

## Source of truth

Read these sources before you write. Do not document from memory.

- Routes and HTTP methods: controller or router definitions.
- Validation: request DTOs, query DTOs, and the global validation pipe.
- Response shapes: response interfaces, serializers, and generated schema types.
- Errors and status codes: exception classes and the error filter.
- Permissions: permission constants and guard decorators.
- Database model: migrations and generated schema types.
- Transactions and retries: transaction provider, worker tasks, and job configuration.
- Behavior: tests for the endpoint, service, and worker.
- Deployment: migration scripts, environment variables, and release notes.

In a NestJS and Zapatos repository, the controller, DTO, generated Zapatos types, migration, and spec file are the usual contract sources. In another stack, use the equivalent router, schema, serializer, and test files.

## Research cache

Use this list for structure. Do not repeat the general research unless the target framework or domain is not covered.

- [Google AIP-121: Resource-oriented design](https://google.aip.dev/121). Use for resource names, standard methods, and custom methods.
- [Google AIP-132: List](https://google.aip.dev/132). Use for list semantics, ordering, and pagination.
- [Google AIP-158: Pagination](https://google.aip.dev/158). Use for page size, page tokens, and total counts.
- [Google AIP-193: Errors](https://google.aip.dev/193). Use for error codes, status mapping, and permission-denied versus not-found.
- [Stripe API reference](https://docs.stripe.com/api). Use for the shape of an endpoint page. See the authentication, errors, pagination, and idempotent request pages.
- [OpenAPI learn: best practices](https://learn.openapis.org/best-practices.html). Use for schema-first descriptions and reusable examples.
- [GOV.UK: how to document APIs](https://www.gov.uk/guidance/how-to-document-apis). Use for plain language, short sentences, and task-based navigation.
- [Microsoft REST API guidelines](https://github.com/microsoft/api-guidelines). Use for naming, versioning, and long-running operations.
- [Diátaxis](https://diataxis.fr/). Use to separate tutorials, how-to guides, reference, and explanation. Do not mix all four in one section.
- [The Good Docs Project: API reference template](https://www.thegooddocsproject.dev/template/api-reference). Use for a reusable endpoint page skeleton.

The stable pattern across these sources:

1. Explain the concept before the endpoint.
2. Show a quick start before the full reference.
3. Give each endpoint its own page or section.
4. Put the request, success response, and error table together.
5. State pagination, sorting, filtering, limits, and idempotency near the endpoint.
6. State authentication and permissions once, then link to them.
7. Put operations, limits, and troubleshooting after the reference.
8. End with a glossary and references.

## Standard outline

Use the sections that apply. Do not skip known limitations, security, or troubleshooting for a nontrivial feature.

1. Title and metadata: status, audience, scope, related docs.
2. Why this exists: the problem, the users, and the outcome.
3. At a glance: endpoints, permissions, storage, defaults.
4. Quick start: auth, one successful request per main endpoint, expected result.
5. Concepts and terminology: one table, one name per concept.
6. Architecture: layers, responsibilities, file map, and a simple diagram.
7. Data model: tables, columns, constraints, indexes, ownership, retention.
8. How it works: the algorithm or state machine, including edge cases.
9. Workflows: ingestion, background jobs, retries, and transaction boundaries.
10. API reference: conventions, then one section per endpoint.
11. Query semantics: pagination, sorting, filtering, positions, empty results, and date rules.
12. Response shapes: every object, every field, nullable markers, enums.
13. Security and multi-tenancy: auth, authorization, tenant and user isolation.
14. Operations: migration, deployment, performance, observability, and rollback.
15. Known limitations and trade-offs: what the feature does not do and why.
16. Testing: test layers, commands, fixtures, and known baseline failures.
17. Troubleshooting: symptom, likely cause, action.
18. FAQ: the questions new readers ask.
19. Glossary.
20. References.

For a single endpoint, use this page shape:

```markdown
### METHOD /path

Permission: ...
Purpose: one sentence.

Path parameters:
| Name | Type | Rules |

Query parameters:
| Name | Type | Default | Rules |

Request body:
...

Success: status, shape, example.

Errors:
| Status | Code | Meaning |

Notes: pagination, sorting, filters, idempotency, limits.
```

## Content rules

- Start with the reader's goal, not the implementation history.
- Define each term once, then reuse the same word.
- Put the common case first. Put edge cases after it.
- State units, time zones, and time formats.
- Show nullable fields as `null`. Do not hide them.
- Show enum values in full.
- Distinguish IDs, display names, and human labels.
- State default values and maximum values.
- State what happens on a repeat call.
- State what happens when a resource is missing or hidden by ownership.
- Separate current behavior from planned behavior with explicit labels.
- Put internal fields in a warning when the API returns them.
- Keep examples consistent. Reuse the same IDs and users across sections.
- Prefer a table for parameters and errors. Prefer prose for behavior.
- Use a diagram only when it removes text. A simple flow or entity diagram is enough.

## Verification checklist

Run these checks before you hand over the guide.

- Every endpoint appears in the controller or router.
- Every field appears in the DTO, serializer, or schema type.
- Every nullable field is marked.
- Every enum lists its allowed values.
- Every error code exists in the code.
- Every status code matches the thrown error.
- Every permission string matches the permission constant.
- Pagination defaults, maximums, and `hasNext` behavior match the code.
- Sort and filter whitelists match the validation.
- Date rules match the parser and the validation.
- Ownership and tenant behavior match the queries and RLS.
- Transaction and retry behavior matches the worker and transaction code.
- Examples are valid JSON.
- Query examples URL-encode reserved characters.
- Links resolve.
- No secrets, tokens, personal data, or internal hostnames appear.
- No planned feature is written in the present tense.
- Known limitations are stated.
- The guide is linked from the project index.

If you can run the API or a test, run one successful request per endpoint and compare the real response with the example. If you cannot run it, say so in the guide's status line.

## API reference rules

- Give each endpoint one heading with the method and path.
- Put the permission on the first line.
- Put the purpose in one sentence.
- Put path parameters, query parameters, and body in that order.
- Show one success example and one error example for the common failure.
- Put the error table next to the success shape.
- State idempotency and repeat-call behavior.
- State the pagination envelope once, then link to it from each list endpoint.
- State that `meta.sort` echoes the requested sort when the query adds hidden tie-breaks.
- State the exact date and timestamp format.
- State the maximum page size.
- State the behavior for an unknown query parameter.
- State the behavior for another user's resource.

## Anti-patterns

- Do not copy a phase plan or design note into the guide. Rewrite it for the reader.
- Do not describe internal tables as public API.
- Do not invent fields, defaults, or error codes.
- Do not claim a feature exists because a plan says so.
- Do not use "simply", "just", "obviously", or "of course".
- Do not use marketing adjectives.
- Do not use screenshots as the only explanation.
- Do not hide a limitation in a footnote.
- Do not ship a guide with broken relative links.
- Do not commit the guide unless the user asks.

## Done criteria

The guide is done when a new developer can:

1. Explain the feature in their own words.
2. Find the code path for each main behavior.
3. Call each endpoint with a valid request.
4. Predict the response shape and the common errors.
5. Know the ownership and permission rules.
6. Know the operational limits and the known failures.
7. Find the tests and run them.
