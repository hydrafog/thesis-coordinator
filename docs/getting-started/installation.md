# Installation

Install Node.js 22, pnpm 10, Git, Docker, and Docker Compose. Enter the development environment with `nix develop` when available. These versions match the repository engine and package-manager declarations.

Install dependencies with `pnpm install`. The target setup starts PostgreSQL and MinIO using a repository Compose configuration, applies reviewed Prisma migrations, and then runs the Next.js server. The current checkout does not yet include the Compose file, Prisma schema, or migration history, so a successful end-to-end installation is not currently verified.

Install the Python renderer used by the documentation PDF exporter:

```bash
python3 -m pip install -r scripts/export/requirements-docs.txt
```

## Documentation build

Build the documentation source and PDF:

```bash
pnpm export:docs:pdf
```

The command writes `exports/documentation.typ` and `exports/documentation.pdf`. Use `pnpm export:docs:pdf -- --typst-only` when only the Typst source is required.

## Quickstart (target)

```bash
nix develop                # or install Node.js and Docker tools
pnpm install
# start PostgreSQL and MinIO from the target Compose configuration
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Use development-only accounts and synthetic data when testing each role. The scaffold exposes package scripts and route structure but does not yet provide a verified full-stack quickstart.
