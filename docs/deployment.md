# Deployment

## Production topology

Deploy the Next.js application behind HTTPS and a reverse proxy or managed ingress. Use a managed PostgreSQL 16 instance with encrypted connections and an S3-compatible object store with private buckets. SMTP, OAuth, and similarity-check providers should be configured through secret-managed environment variables.

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
