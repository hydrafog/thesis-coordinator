# Security

These controls are target requirements for the ideal system. The current scaffold does not yet prove that the guards, signed URLs, upload validation, audit events, or retention handlers are operational.

## Authorization

Authentication identifies the user; server-side authorization decides whether that user may read or mutate a record. Enforce role and ownership checks on every route, server action, background job, and object-storage operation. Never rely on hidden controls or client-provided role fields.

## Sensitive data

Thesis drafts, personal information, grades, messages, and defense records are confidential institutional data. Store only the information needed for the workflow, encrypt transport, restrict object-storage buckets, and issue short-lived download URLs after authorization. Do not log file contents, OAuth secrets, session tokens, or full personal records.

## Files and integrations

Validate upload size, type, filename, and ownership. Scan uploaded files where supported, store generated object keys rather than user-controlled paths, and prevent path traversal. Validate webhook or provider responses and make external jobs idempotent.

## Audit and retention

Record significant approvals, assignments, submissions, grading actions, permission changes, and administrative corrections with actor and timestamp. Define retention and deletion rules with the institution; preserve records required for academic appeals and audit while honoring applicable privacy obligations.

## Security process

Keep dependencies updated, review authentication and authorization changes carefully, and run automated checks in CI. Report suspected vulnerabilities privately to the maintainers rather than publishing exploit details in an issue.
