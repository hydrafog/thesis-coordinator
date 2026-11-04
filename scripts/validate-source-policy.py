#!/usr/bin/env python3
"""Reject debug and type-safety escapes from application source files."""

import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATTERN = re.compile(r"^src/.*\.(?:ts|tsx|js|jsx)$")
FORBIDDEN = (
    (re.compile(r"\bconsole\.(?:log|debug|info|warn|error)\s*\("), "console logging"),
    (re.compile(r"@ts-(?:ignore|expect-error)\b"), "TypeScript suppression"),
    (re.compile(r"\b(?:as\s+any|:\s*any\b)"), "explicit any"),
    (re.compile(r"eslint-disable"), "lint suppression"),
)


def tracked_sources() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "src"], check=True, capture_output=True, text=True
    )
    return [
        ROOT / path
        for path in result.stdout.splitlines()
        if SOURCE_PATTERN.match(path)
    ]


def main() -> int:
    findings: list[str] = []
    for path in tracked_sources():
        for line_number, line in enumerate(
            path.read_text(encoding="utf-8").splitlines(), start=1
        ):
            for pattern, label in FORBIDDEN:
                if pattern.search(line):
                    findings.append(f"{path.relative_to(ROOT)}:{line_number}: {label}")

    if findings:
        print("\n".join(findings), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
