# Project structure

`src/app` contains thin App Router routes, `src/features` contains use cases, `src/core` contains shared infrastructure (including `src/core/ui` for centralized design system UI primitives), `src/styles` contains the centralized modular design system stylesheets and tokens, `src/lib` contains edge utilities, and `src/types` contains ambient types.

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
│   ├── api/             # route handlers
│   └── layout.tsx       # root layout importing globals.css and fonts
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
│   ├── jobs/
│   └── ui/              # centralized design system UI primitives
├── styles/              # centralized modular design system
│   ├── tokens/          # palette, scale, motion, theme
│   ├── base/            # reset, elements
│   ├── layout/          # shell, grid
│   ├── components/      # controls, surfaces, data, feedback, people, chat, dialog
│   └── globals.css      # master stylesheet
├── lib/                 # edge utilities
└── types/               # ambient types
```
