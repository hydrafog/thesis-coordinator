# Defense scheduling

Secretaries and administrators assign 20-minute defense slots and committees after the defense file reaches the required readiness state. The scheduler checks participant availability, duplicate assignments, and supervisor or committee conflicts before publication. Administrators may reorder candidates before finalization. Published schedules are emailed and visible only to authorized students, coordinators, committee members, and administrators.

## Scheduling flow

```mermaid
flowchart TD
	A[Dossier verified] --> B[Select candidate]
	B --> C{Conflict check}
	C -->|duplicate| X[Reject]
	C -->|availability clash| X
	C -->|supervisor conflict| X
	C -->|clear| D[Assign 20-minute slot + committee]
	D --> E[Publish + email]
	E --> F[Visible to authorized roles]
```

## Slot invariants

- Each slot is exactly 20 minutes (`DEFENSE_SLOT_DURATION_MINUTES = 20`), enforced by `calculateSlotEndTime`.
- A committee member cannot hold two simultaneous slots, validated by `checkDefenseSlotConflicts`.
- A supervisor cannot serve on their own student's committee, enforced via `checkDefenseSlotConflicts`.
- A candidate cannot be scheduled unless their defense dossier is in `VERIFIED` state.
- Published schedules are immutable; changes go through an audited reschedule flow.

## Implementation modules

- Domain logic: `src/features/defense/domain/defense-slot.ts`, `src/features/defense/domain/committee.ts`
- Data repositories: `src/features/defense/data/slot-repository.ts`, `src/features/defense/data/committee-repository.ts`
- Server actions: `src/features/defense/actions.ts` (`scheduleDefenseSlotAction`, `reorderDefenseSlotsAction`, `deleteDefenseSlotAction`)
- Presentation: `src/features/defense/presentation/schedule-board.tsx`, `src/features/defense/presentation/slot-editor.tsx`
- Administration routes: `src/app/(admin)/admin/schedule/page.tsx`, `src/app/(admin)/committees/page.tsx`
