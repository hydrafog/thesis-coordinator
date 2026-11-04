# Project structure

`src/app` contains thin App Router routes, `src/features` contains use cases, `src/core` contains shared infrastructure, `src/lib` contains edge utilities, and `src/types` contains ambient types.

Keep feature imports directed inward toward domain and data boundaries; shared code must not import feature modules.
