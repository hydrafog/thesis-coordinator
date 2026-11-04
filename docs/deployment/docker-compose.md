# Docker Compose deployment

## Production topology

Use Docker Compose for local or small self-hosted deployments of the Next.js application, PostgreSQL, and MinIO. For public deployments, put the application behind HTTPS and a reverse proxy or managed ingress. Configure SMTP, OAuth, and similarity-check providers through secret-managed environment variables.

## Release process

1. Build and test the application in CI.
2. Build an immutable application image or deployment artifact.
3. Apply compatible database migrations before enabling new application behavior.
4. Deploy the application with health checks and a rollback path.
5. Verify authentication, uploads, notifications, and a read-only workflow path.

Migrations must be backward-compatible across the deployment boundary when rolling deployments are used.

## Operations

Monitor application errors, request latency, background jobs, database health, storage failures, and authentication anomalies. Back up PostgreSQL on a tested schedule and configure object-storage versioning or equivalent retention for important submissions. Test restoration, not only backup creation.

Use Docker Compose for local or small self-hosted environments. For public deployments, terminate TLS, restrict database and storage network access, and keep administrative interfaces off the public internet.
