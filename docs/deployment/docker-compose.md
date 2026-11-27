# Docker Compose deployment

## Production topology

The production deployment uses Docker Compose for orchestrating the Next.js application, PostgreSQL, and MinIO storage services:

- `postgres`: PostgreSQL 16 Alpine container with database `thesis`, user `app`, persistent storage volume `postgres_data`, and health check.
- `minio`: MinIO object storage container with private bucket configuration, S3 API on port 9000, console on 9001, and persistent storage volume `minio_data`.
- `web`: Next.js web application container built from multi-stage `Dockerfile`, exposing port 3000, connecting to PostgreSQL and MinIO over internal Docker networking with health monitoring.

## Configuration

Compose reads environment parameters configured in `.env`:

```env
DATABASE_URL=postgresql://app:secret@postgres:5432/thesis
APP_URL=http://localhost:3000
AUTH_SECRET=development-auth-secret-key-32-chars-long
MINIO_ENDPOINT=http://minio:9000
MINIO_REGION=us-east-1
MINIO_BUCKET=thesis-private
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MAX_UPLOAD_BYTES=52428800
```

## Running the application

To start all services with container health checks:

```bash
docker compose up -d
```

To view service logs:

```bash
docker compose logs -f web
```

To apply database schema migrations:

```bash
docker compose exec web pnpm db:migrate
```
