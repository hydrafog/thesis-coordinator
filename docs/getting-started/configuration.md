# Configuration

Configure the database URL, application URL, Auth.js secret, university-domain Google OAuth credentials, SMTP host and sender, and private MinIO endpoint, region, bucket, access key, and secret through a local `.env` file. The target application also needs upload limits and deployment URLs to be explicit configuration rather than client-controlled values.

## Environment variables

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://app:secret@localhost:5432/thesis` |
| `APP_URL` | Public application URL | `http://localhost:3000` |
| `AUTH_SECRET` | Auth.js session signing key | 32-byte random |
| `GOOGLE_CLIENT_ID` | University OAuth client | n/a |
| `GOOGLE_CLIENT_SECRET` | University OAuth secret | n/a |
| `SMTP_HOST` / `SMTP_PORT` | Mail relay | `smtp.univ.edu` / `587` |
| `SMTP_FROM` | Sender identity | `thesis@univ.edu` |
| `MINIO_ENDPOINT` | Object-storage endpoint | `http://localhost:9000` |
| `MINIO_REGION` | Bucket region | `us-east-1` |
| `MINIO_BUCKET` | Private bucket name | `thesis-private` |
| `MINIO_ACCESS_KEY` | Access key | n/a |
| `MINIO_SECRET_KEY` | Secret key | n/a |
| `MAX_UPLOAD_BYTES` | Upload ceiling | `52428800` |

## Rules

Never commit `.env` files or production credentials. Use the deployment platform's secret manager outside local development, and use demonstration accounts and synthetic thesis files when testing locally.
