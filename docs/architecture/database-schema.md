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
| `Submission` | `id`, `thesisId`, `milestoneId`, `state`, `lockedAt` | FK `thesisId`, optional FK `milestoneId`, `state` is `OPEN`, `LOCKED`, or `SUPERSEDED` |
| `FileVersion` | `id`, `submissionId`, `version`, `uploadedById`, `fileKey`, `checksum`, `extractedText` | Unique `(submissionId, version)`, unique `fileKey` |
| `Review` | `id`, `submissionId`, `authorId`, `version`, `decision` | FK `submissionId` |
| `ReviewAnnotation` | `id`, `reviewId`, `chapter`, `page`, `quote`, `comment` | FK `reviewId`, cascade delete |
| `SimilarityReport` | `id`, `submissionId`, `provider`, `inputVersion`, `score`, `state`, `metadata`, `resolution` | Unique `submissionId` |
| `SupervisorReport` | `id`, `thesisId`, `authorId`, `fileKey`, `checksum`, `submittedAt` | Unique `thesisId`, unique `fileKey` |
| `Conversation` | `id`, `thesisId` | Unique `thesisId` (one conversation per thesis) |
| `ConversationParticipant` | `conversationId`, `userId` | Unique `(conversationId, userId)` |
| `DefenseSession` | `id`, `thesisId`, `slot`, `committeeId` | Unique active slot per participant |
| `Committee` | `id`, `defenseId` | 1:1 with `DefenseSession` |
| `GradingSession` | `id`, `defenseId`, `state` | Unique `defenseId` while `Open` |
| `Grade` | `id`, `gradingSessionId`, `memberId`, `value` | Unique `(gradingSessionId, memberId, criterion)` |
| `Message` | `id`, `conversationId`, `senderId`, `readAt`, `emailAlertedAt`, `createdAt` | FK `conversationId`, index `(conversationId, createdAt)` |
| `Attachment` | `id`, `messageId`, `fileKey`, `checksum` | FK `messageId`, unique `fileKey` |
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
