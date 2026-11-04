# Thesis Coordinator documentation

Thesis Coordinator is a workflow platform for managing bachelor thesis supervision from topic proposal through final defense and grading.

## Contents

- [Getting started](getting-started.md): prerequisites, configuration, and local development.
- [Architecture](architecture/index.md): system boundaries and the domain model.
- [Features](features.md): supported roles and thesis workflow capabilities.
- [Development](development.md): project conventions and verification practices.
- [Deployment](deployment.md): deployment topology and operational guidance.
- [Security](security.md): authorization, data protection, and reporting requirements.

## Product scope

The platform provides a shared source of truth for students, supervisors, defense committees, and faculty administrators. It replaces disconnected email threads and spreadsheets with auditable records, controlled file access, deadlines, notifications, and live defense grading.

## Technology baseline

The planned application baseline is Next.js 15 with TypeScript 5, PostgreSQL 16 for durable data, and object storage for thesis files and generated documents. Local development should be reproducible with the Nix flake and may use Docker Compose for infrastructure services.
