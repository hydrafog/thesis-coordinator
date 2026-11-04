#!/usr/bin/env python3
"""Validate repository invariants that should hold before commits and pushes."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIRED_PATHS = (
    "README.md",
    "LICENSE",
    "flake.nix",
    "docs/index.md",
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/core",
    "src/features",
)


def main() -> int:
    missing = [path for path in REQUIRED_PATHS if not (ROOT / path).exists()]
    if missing:
        for path in missing:
            print(f"missing required path: {path}")
        return 1

    source_files = list((ROOT / "src").rglob("*.ts")) + list(
        (ROOT / "src").rglob("*.tsx")
    )
    if not source_files:
        print("src must contain TypeScript source files")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
