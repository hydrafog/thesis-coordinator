# High-level architecture

Next.js App Router provides thin route entry points. Feature modules contain use-case logic, domain rules, repositories, and presentation components. Shared infrastructure lives under `src/core`.

PostgreSQL stores workflow state, MinIO stores private files, Socket.IO provides live updates, and background jobs handle notifications, similarity checks, and PDF generation.
