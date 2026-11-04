# CI/CD

The repository's GitHub Actions quality workflow runs repository validation, secret scanning, source-policy checks, formatting, linting, type checking, tests, builds, and Nix validation. The package scripts define the JavaScript checks. Dependabot is a target dependency-management control and is not asserted as present until its configuration is committed.

## Pipeline

```mermaid
flowchart LR
	P[Push / PR] --> V[Validate repo]
	V --> S[Secret scan]
	S --> L[Lint + format]
	L --> T[Typecheck + tests]
	T --> B[Build]
	B --> N[Nix validation]
	N --> D[Deploy artifact]
	D --> M[Apply migrations]
	M --> H[Health checks]
	H --> R[Release]
```
