# Approval and deadlines

Coordinators approve, reject, or request revisions with an auditable decision reason. Approval decrements available capacity atomically and generates a signed assignment PDF. The student and coordinator maintain milestones for proposal, drafts, final submission, and defense. Deadline reminders are sent through SMTP, while late or blocked milestones remain visible to responsible roles.

## Milestone set

| Milestone | Owner | Reminder |
|---|---|---|
| Proposal submitted | Student | 3 days before |
| Chapter drafts | Student | per chapter deadline |
| Final submission | Student | 7 days before lock |
| Defense | Coordinator | per schedule |

## Reminder flow

```mermaid
sequenceDiagram
	participant J as Scheduler
	participant P as PostgreSQL
	participant M as SMTP
	participant R as Recipient

	J->>P: load due milestones
	P-->>J: list within window
	J->>M: send reminder
	M-->>R: email
	J->>P: mark reminder sent
```
