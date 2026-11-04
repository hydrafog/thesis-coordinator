#!/usr/bin/env python3
"""Reject common credentials and private keys from staged or tracked content."""

import argparse
from pathlib import Path
import re
import subprocess
import sys


PATTERNS = (
    (r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", "private key"),
    (r"\bAKIA[0-9A-Z]{16}\b", "AWS access key"),
    (r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b", "GitHub token"),
    (r"\bsk-[A-Za-z0-9]{20,}\b", "OpenAI-style API key"),
    (r"https://hooks\.slack\.com/services/[A-Za-z0-9/_-]+", "Slack webhook"),
    (r"(?i)\b(password|secret|token|api[_-]?key)\s*[:=]\s*['\"][^'\"]{8,}", "credential assignment"),
)


def lines_to_scan(cached: bool) -> list[str]:
    if cached:
        command = [
            "git",
            "diff",
            "--cached",
            "--no-ext-diff",
            "--unified=0",
            "--",
            ".",
            ":(exclude)LICENSE",
            ":(exclude)assets",
        ]
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        return [
            line[1:]
            for line in result.stdout.splitlines()
            if line.startswith("+") and not line.startswith("+++")
        ]

    result = subprocess.run(
        ["git", "ls-files", "-z", "--", ".", ":(exclude)LICENSE", ":(exclude)assets"],
        check=True,
        capture_output=True,
    )
    lines: list[str] = []
    for raw_path in result.stdout.split(b"\0"):
        if raw_path:
            lines.extend(Path(raw_path.decode()).read_text(encoding="utf-8").splitlines())
    return lines


def main(cached: bool) -> int:
    findings: list[str] = []
    for line in lines_to_scan(cached):
        for expression, label in PATTERNS:
            if re.search(expression, line):
                findings.append(label)
                break

    if findings:
        for label in sorted(set(findings)):
            print(f"possible {label} detected; remove it before committing", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cached", action="store_true")
    args = parser.parse_args()
    raise SystemExit(main(args.cached))
