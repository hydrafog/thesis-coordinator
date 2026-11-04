#!/usr/bin/env python3
"""Export repository documentation into one deterministic Markdown file."""

import argparse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT / "exports" / "documentation.md"


def export(output: Path) -> None:
    documents = sorted((ROOT / "docs").rglob("*.md"))
    sections = [
        "# Thesis Coordinator documentation export",
        "",
        "Generated from the repository's `docs/` directory.",
        "",
    ]

    for document in documents:
        relative = document.relative_to(ROOT)
        sections.extend(
            [
                f"## `{relative}`",
                "",
                document.read_text(encoding="utf-8").rstrip(),
                "",
            ]
        )

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(sections).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="destination Markdown file",
    )
    args = parser.parse_args()
    export(args.output if args.output.is_absolute() else ROOT / args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
