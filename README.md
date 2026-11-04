<div align="center">
  <img src="assets/banner.png" width="100%" alt="Thesis Coordinator banner">
</div>

<div align="center">
  <h1>Thesis Coordinator</h1>
  <p><strong>Bachelor thesis supervision and defense management</strong></p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15-black.svg" alt="Next.js"></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16-blue.svg" alt="PostgreSQL"></a>
    <a href="https://www.gnu.org/licenses/agpl-3.0.html"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License: AGPL-3.0"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-blue.svg" alt="TypeScript"></a>
  </p>
</div>

Thesis Coordinator consolidates topic proposals, draft reviews, similarity checks, defense scheduling, and committee grading into a single workflow for students, supervisors, committees, and faculty administrators, replacing scattered email threads and manual spreadsheets.

## Documentation

<details>
<summary><strong>Getting Started</strong></summary>

| Document | Description |
|----------|-------------|
| [Overview](docs/getting-started/index.md) | Documentation home and navigation |
| [Installation](docs/getting-started/installation.md) | Setup Docker, PostgreSQL, MinIO, and environment variables |
| [Configuration](docs/getting-started/configuration.md) | Google OAuth, SMTP, and storage credentials |
| [Quickstart](docs/getting-started/quickstart.md) | Run the full stack locally with Docker Compose |

</details>

<details>
<summary><strong>Architecture</strong></summary>

| Document | Description |
|----------|-------------|
| [Overview](docs/architecture/index.md) | System boundaries and design |
| [High-Level](docs/architecture/high-level.md) | Next.js, Socket.io, PostgreSQL, and MinIO components |
| [Data Model](docs/architecture/data-model.md) | Core entities and relationships |
| [Database Schema](docs/architecture/database-schema.md) | Prisma schema and table definitions |
| [Thesis Workflow](docs/architecture/thesis-workflow.md) | Topic approval, supervision, and defense stages |
| [Real-time Events](docs/architecture/realtime.md) | Socket.io events for quota, messaging, and live grading |
| [File Storage](docs/architecture/file-storage.md) | Private MinIO buckets and signed authorization |
| [PDF Generation](docs/architecture/pdf-generation.md) | Assignment and defense minutes rendering |

</details>

<details>
<summary><strong>Features</strong></summary>

| Document | Description |
|----------|-------------|
| [Overview](docs/features/index.md) | Product capabilities and workflow stages |
| [Authentication & Profile](docs/features/authentication-profile.md) | Google sign-in, study groups, and coordinator quotas |
| [Topic Proposal](docs/features/topic-proposal.md) | Coordinator filtering and proposal submission |
| [Approval & Deadlines](docs/features/approval-deadlines.md) | Approve, reject, or request revisions |
| [Private Messaging](docs/features/private-messaging.md) | Supervisor-student chat with attachments |
| [Files & Submissions](docs/features/files-submissions.md) | Versioned PDF and ZIP uploads |
| [Review & Similarity](docs/features/review-similarity.md) | Chapter annotation and text comparison |
| [Defense Scheduling](docs/features/defense-scheduling.md) | Slot assignment and committee conflict checks |
| [Defense File](docs/features/defense-file.md) | Dossier verification and correction |
| [Live Gradebook](docs/features/live-gradebook.md) | Committee grading and defense minutes PDF |

</details>

<details>
<summary><strong>Development</strong></summary>

| Document | Description |
|----------|-------------|
| [Overview](docs/development/index.md) | Contribution and engineering conventions |
| [Coding Style](docs/development/coding-style.md) | TypeScript, Next.js, and Prisma conventions |
| [Testing](docs/development/testing.md) | Unit, integration, and end-to-end tests |
| [Project Structure](docs/development/project-structure.md) | Directory layout and module boundaries |
| [Team Responsibilities](docs/development/team-responsibilities.md) | Scope split across three developers |

</details>

<details>
<summary><strong>Deployment & Operations</strong></summary>

| Document | Description |
|----------|-------------|
| [Docker Compose](docs/deployment/docker-compose.md) | Container setup and Cloudflare Tunnel |
| [CI/CD](docs/deployment/ci-cd.md) | GitHub Actions pipeline |
| [Backups](docs/operations/backups.md) | PostgreSQL nightly automated backups |

</details>

<details>
<summary><strong>Security & Compliance</strong></summary>

| Document | Description |
|----------|-------------|
| [Overview](docs/security-compliance/index.md) | Security and compliance boundaries |
| [Security](docs/security-compliance/security.md) | Signed authorization and role guards |
| [Privacy](docs/security-compliance/privacy.md) | Data handling and user privacy |

</details>

## License

All project source code, APIs, and scripts are licensed under the [GNU Affero General Public License v3.0](LICENSE).
