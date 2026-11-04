#!/usr/bin/env python3
"""Export source and project configuration into one deterministic Markdown file."""

import argparse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT / "exports" / "source-code.md"
SOURCE_DIRECTORIES = ("src", "scripts")
ROOT_FILES = (
    "package.json",
    "tsconfig.json",
    "eslint.config.mjs",
    "lefthook.yml",
    "flake.nix",
)
LANGUAGES = {
    ".cjs": "javascript",
    ".css": "css",
    ".js": "javascript",
    ".json": "json",
    ".mjs": "javascript",
    ".py": "python",
    ".scss": "scss",
    ".sh": "bash",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".yml": "yaml",
    ".yaml": "yaml",
}


def source_files() -> list[Path]:
    files = [
        path
        for directory in SOURCE_DIRECTORIES
        for path in (ROOT / directory).rglob("*")
        if path.is_file() and path.suffix in LANGUAGES
    ]
    files.extend(ROOT / name for name in ROOT_FILES if (ROOT / name).is_file())
    return sorted(files)


def fence_for(content: str) -> str:
    longest = max((len(line) - len(line.lstrip("`")) for line in content.splitlines()), default=0)
    return "`" * max(3, longest + 1)


def export(output: Path) -> None:
    sections = [
        "# Thesis Coordinator source export",
        "",
        "Generated from the repository's source and project configuration files.",
        "",
    ]

    for source in source_files():
        relative = source.relative_to(ROOT)
        content = source.read_text(encoding="utf-8").rstrip()
        fence = fence_for(content)
        sections.extend(
            [
                f"## `{relative}`",
                "",
                f"{fence}{LANGUAGES.get(source.suffix, '')}",
                content,
                fence,
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
