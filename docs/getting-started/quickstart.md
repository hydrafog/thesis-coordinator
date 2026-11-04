# Quickstart

1. Run `nix develop`, or install the required Node.js and Docker tools.
2. Run `pnpm install`.
3. Start PostgreSQL and MinIO from the target Compose configuration.
4. Run `pnpm db:generate` and `pnpm db:migrate` after the Prisma schema and initial migration exist.
5. Run `pnpm dev` and open the local application URL.

Use development-only accounts and synthetic data when testing each role. The scaffold currently exposes package scripts and route structure but does not yet provide a verified full-stack quickstart.
