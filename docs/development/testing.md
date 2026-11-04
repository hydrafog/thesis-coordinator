# Testing

The target test strategy uses unit tests for domain rules, integration tests for repositories and external adapters, and end-to-end tests for critical student, coordinator, committee, president, secretary, and administrator journeys. Priority scenarios include university-domain authentication, quota-safe proposal approval, 50 MB upload rejection, signed file authorization, conflict-free scheduling, final-submission locking, and grading-session finalization.

## Priority scenarios

| Scenario | Level | Assertion |
|---|---|---|
| University-domain auth | E2E | non-domain account rejected |
| Quota-safe approval | Integration | concurrent approvals cannot exceed quota |
| 50 MB upload rejection | Integration | oversize rejected before storage |
| Signed file authorization | Integration | unauthorized download returns 403 |
| Conflict-free scheduling | Integration | duplicate slot rejected |
| Final-submission locking | Integration | locked version immutable |
| Grading finalization | E2E | close locks scores, emits PDF and email |

The repository declares `pnpm test`, `pnpm test:e2e`, and quality-check scripts, but the current checkout contains no complete workflow test suite. Run those commands as implementation lands and treat absent tests as an unverified requirement rather than passing coverage.
