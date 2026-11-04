#!/usr/bin/env python3
"""Check relative Markdown links without third-party dependencies."""

import re
import sys
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
LINK_PATTERN = re.compile(r"\]\(([^)#]+)(?:#[^)]*)?\)")


def markdown_files(arguments: list[str]) -> list[Path]:
    if arguments:
        return [
            (ROOT / argument).resolve()
            for argument in arguments
            if argument.endswith(".md") and (ROOT / argument).exists()
        ]
    return sorted(ROOT.rglob("*.md"))


def main(arguments: list[str]) -> int:
    errors: list[str] = []
    for source in markdown_files(arguments):
        for link in LINK_PATTERN.findall(source.read_text(encoding="utf-8")):
            parsed = urlsplit(link)
            if parsed.scheme or link.startswith("#"):
                continue
            target = (source.parent / parsed.path).resolve()
            if not target.exists():
                errors.append(f"{source.relative_to(ROOT)}: missing {link}")

    for error in errors:
        print(error)
    return int(bool(errors))


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
