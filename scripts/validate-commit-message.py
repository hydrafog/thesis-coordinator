#!/usr/bin/env python3
"""Enforce the repository's commit subject and body policy."""

import re
import sys
from pathlib import Path


SUBJECT_PATTERN = re.compile(
    r"^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test): .+"
)
TRAILER_PATTERN = re.compile(r"^Co-authored-by: .+ <[^>]+>$")
MAX_SUBJECT_LENGTH = 80


def main(message_path: str) -> int:
    lines = Path(message_path).read_text(encoding="utf-8").splitlines()
    subject = lines[0].strip() if lines else ""

    if not subject:
        print("commit subject must not be empty", file=sys.stderr)
        return 1
    if len(subject) > MAX_SUBJECT_LENGTH:
        print("commit subject must be 80 characters or fewer", file=sys.stderr)
        return 1
    if not SUBJECT_PATTERN.fullmatch(subject):
        print(
            "commit subject must use a supported prefix: "
            "build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test",
            file=sys.stderr,
        )
        return 1

    body = [line for line in lines[1:] if line.strip()]
    if body and not all(TRAILER_PATTERN.fullmatch(line) for line in body):
        print(
            "commit messages must have no description; only the co-author trailer "
            "is allowed",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: validate-commit-message.py <commit-message-file>")
    raise SystemExit(main(sys.argv[1]))
