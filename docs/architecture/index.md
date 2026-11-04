# Architecture

## System overview

The application is a role-aware Next.js web application backed by PostgreSQL. The web layer owns page rendering, API or server actions, validation, and session enforcement. PostgreSQL stores workflow state and audit-relevant metadata, while object storage stores binary files. Background work can handle notifications, similarity checks, and PDF generation without blocking interactive requests.

```text
Browser
   |
Next.js application --- authentication and authorization
   |          \
PostgreSQL    Object storage
   |
Background jobs --- email, similarity checks, document generation
```

## Design principles

- Model the thesis lifecycle explicitly rather than inferring state from unrelated records.
- Enforce authorization on the server for every read and mutation.
- Keep binary content out of PostgreSQL while storing ownership, versions, checksums, and access metadata in the database.
- Make deadline, approval, grading, and file transitions auditable.
- Prefer idempotent jobs and transactional state changes.

## Main boundaries

The domain is organized around identity and roles, topic proposals, thesis supervision, submissions and reviews, defense scheduling, committees, grading, notifications, and audit history. Integrations such as Google OAuth, SMTP, object storage, and similarity analysis should be isolated behind adapters so they can be replaced or tested independently.

See the [data model](data-model.md) for the core entities.
