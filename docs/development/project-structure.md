# Project structure

`src/app` contains thin App Router routes, `src/features` contains use cases, `src/core` contains shared infrastructure, `src/lib` contains edge utilities, and `src/types` contains ambient types.

Keep feature imports directed inward toward domain and data boundaries; shared code must not import feature modules.

## Tree

```text
src/
├── app/                 # thin App Router routes
│   ├── (auth)/
│   ├── (student)/
│   ├── (coordinator)/
│   ├── (committee)/
│   ├── (admin)/
│   └── api/             # route handlers
├── features/            # use cases, one folder per capability
│   ├── proposals/
│   ├── supervision/
│   ├── submissions/
│   ├── reviews/
│   ├── similarity/
│   ├── defense/
│   ├── grading/
│   └── messaging/
├── core/                # shared infrastructure
│   ├── auth/
│   ├── db/
│   ├── storage/
│   ├── mail/
│   ├── events/
│   └── jobs/
├── lib/                 # edge utilities
└── types/               # ambient types
```
