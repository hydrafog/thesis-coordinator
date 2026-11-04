# Development

## Working conventions

Use strict TypeScript and existing Next.js patterns. Keep domain validation close to the boundary, use typed service interfaces for external integrations, and avoid duplicating authorization logic across pages and API handlers. Prefer small, composable modules over broad catch-all utilities.

Database changes must be delivered as reviewed migrations. Do not edit an applied migration or use destructive schema changes without a documented data-migration path.

## Local workflow

1. Create a focused branch for the change.
2. Run the application and required infrastructure locally.
3. Implement the smallest complete change, including authorization and audit behavior.
4. Add or update unit, integration, and end-to-end coverage for changed behavior.
5. Run formatting, linting, type checking, tests, and migration checks before opening a pull request.

## Testing priorities

Test role boundaries and ownership rules first. Exercise state transitions such as proposal approval, final submission locking, committee assignment, and grade finalization. Integration tests should cover database constraints and storage adapters; end-to-end tests should cover the critical student and administrator journeys.

## Documentation

Update the relevant documentation when a feature changes configuration, workflow states, data retention, operational procedures, or security assumptions. Do not document credentials or real user data.
