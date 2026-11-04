# Features overview

The target product supports identity, topic proposals, supervision, messaging, submissions, reviews, similarity checks, defense scheduling, dossier verification, and live grading. The repository provides feature directories and placeholder modules; the workflows below define the intended behavior to implement and verify.

See the feature pages for workflow-specific rules and user responsibilities.

## Roles

- **Students** select a coordinator, submit proposals and drafts, message the coordinator, and view defense schedules and results.
- **Coordinators** supervise 5–7 students, approve proposals, review drafts, set milestones, check similarity, and submit a supervisor report.
- **Committee members** inspect the defense file, record rubric scores, and contribute to final minutes.
- **Committee presidents** control grading sessions, review the computed average, and approve defense minutes.
- **Secretaries and administrators** manage accounts, committees, defense slots, document checks, conflicts, and reports.

## Thesis lifecycle

1. A student selects a coordinator by research area and available capacity.
2. The student submits a structured topic proposal.
3. The coordinator approves, rejects, or requests changes; approval consumes capacity atomically and creates an assignment PDF.
4. The student and coordinator track milestones, drafts, feedback, and similarity checks.
5. The coordinator submits a supervisor report and the student locks the final submission for defense preparation.
6. An administrator assigns a conflict-free 20-minute defense slot and committee.
7. The student and administrator complete the defense file, and the committee checks its required documents.
8. Committee members enter grades independently, the president closes the session, and the system generates approved minutes and emails results.

## Supporting capabilities

The target platform provides university-domain Google sign-in plus demonstration password accounts, confirmation and deadline email, private messaging with read receipts and typing indicators, versioned PDF and ZIP uploads up to 50 MB, chapter annotations, local similarity reports, committee conflict checks, a live gradebook, assignment PDFs, defense minutes, and audit history.

All feature mutations should expose clear validation errors and preserve an audit trail. A user's interface may hide unavailable actions, but the server remains the source of truth for permission checks.
