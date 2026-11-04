# Getting started overview

## Prerequisites

- Git
- Node.js 22, or the development shell provided by `nix develop`
- pnpm
- Docker and Docker Compose, if running PostgreSQL and object storage locally

The application package is managed with pnpm. The repository does not yet include a committed Compose file or environment template, so the commands below describe the target local environment and complete as those artifacts are implemented.

## Local services

| Service | Version | Purpose |
|---|---|---|
| PostgreSQL | 16 | Application database and workflow state |
| MinIO (S3-compatible) | Current | Profile photos, thesis uploads, review attachments, assignment PDFs, defense minutes |

Keep service data in local volumes. Never commit credentials or uploaded files.

## Environment configuration

At minimum, local configuration should define:

- Database connection URL and migration settings.
- Application URL and session/authentication secrets.
- Google OAuth client ID and secret.
- SMTP host, port, sender, and credentials for notifications.
- Object-storage endpoint, region, bucket, access key, and secret key.

Use a local `.env` file ignored by Git. Keep production credentials in the deployment platform's secret store.

## First run

1. Enter the reproducible shell with `nix develop`, or install the prerequisites manually.
2. Start PostgreSQL and MinIO with the repository's Compose configuration when it is available.
3. Install JavaScript dependencies.
4. Apply database migrations and seed only non-sensitive development data.
5. Start the Next.js development server and open the configured application URL.

Never use production data for local development. Create test accounts representing each application role.
