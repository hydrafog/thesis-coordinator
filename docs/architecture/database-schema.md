# Database schema

The target Prisma schema represents users, profiles, roles, theses, proposals, milestones, submissions, reviews, similarity reports, defense sessions, committees, defense files, grading sessions, grades, messages, attachments, and audit events. The repository currently declares Prisma dependencies and migration commands, but a completed schema and migration history remain implementation work.

Use foreign keys, unique constraints, explicit state fields, timestamps, and reviewed migrations. Encode proposal and grading-session state transitions as domain rules executed inside transactions. Never edit an applied migration; introduce a new reviewed migration and a data-migration path when the model changes.

## Table inventory

| Table | Key columns | Constraints |
|---|---|---|
| `User` | `id`, `institutionalEmail`, `status` | Unique `institutionalEmail` |
| `Role` | `userId`, `role` | Unique `(userId, role)` |
| `Thesis` | `id`, `studentId`, `status` | FK `studentId -> StudentProfile.id` |
| `Proposal` | `id`, `thesisId`, `state`, `revision` | Unique `(thesisId, revision)` |
| `Milestone` | `id`, `proposalId`, `dueAt`, `state` | FK `proposalId` |
| `Submission` | `id`, `thesisId`, `lockedAt` | FK `thesisId` |
| `FileVersion` | `id`, `submissionId`, `version`, `checksum` | Unique `(submissionId, version)` |
| `Review` | `id`, `submissionId`, `authorId`, `decision` | FK `submissionId` |
| `SimilarityReport` | `id`, `submissionId`, `score`, `state` | FK `submissionId` |
| `DefenseSession` | `id`, `thesisId`, `slot`, `committeeId` | Unique active slot per participant |
| `Committee` | `id`, `defenseId` | 1:1 with `DefenseSession` |
| `GradingSession` | `id`, `defenseId`, `state` | Unique `defenseId` while `Open` |
| `Grade` | `id`, `gradingSessionId`, `memberId`, `value` | Unique `(gradingSessionId, memberId, criterion)` |
| `Message` | `id`, `conversationId`, `senderId`, `sentAt` | FK `conversationId` |
| `AuditEvent` | `id`, `actorId`, `action`, `targetId`, `at` | Indexed `(targetId, at)` |

## Capacity protection

Approval increments the coordinator's accepted count only while below quota:

```sql
UPDATE "CoordinatorProfile"
	 SET "acceptedCount" = "acceptedCount" + 1
 WHERE "id" = $1
	 AND "acceptedCount" < "quota";
```

The update and proposal transition commit in one transaction; a zero-row result returns a `capacity_exceeded` domain error.
