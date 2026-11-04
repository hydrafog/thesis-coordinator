#!/usr/bin/env python3
"""Build the documentation directory as Typst and compile it to PDF."""

import argparse
import hashlib
import re
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_TYPST = ROOT / "exports" / "documentation.typ"
DEFAULT_PDF = ROOT / "exports" / "documentation.pdf"
DEFAULT_DIAGRAM_CACHE = ROOT / "exports" / "diagrams"
SVG_NORMALIZER_VERSION = "3"


def typst_escape(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace("#", "\\#")
        .replace("[", "\\[")
        .replace("]", "\\]")
        .replace("<", "\\<")
        .replace(">", "\\>")
    )


def typst_string(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
    )


def normalize_mermaid_svg(svg: str) -> str:
    replacements = {
        "var(--_bg)": "#ffffff",
        "var(--_fg)": "#1f1f1f",
        "var(--_m)": "#6e6e6e",
        "var(--_l)": "#1f1f1f",
        "var(--_s)": "#f3f3f3",
        "var(--_a)": "#e6e6e6",
        "var(--_b)": "#8a8a8a",
        "var(--_c)": "#5b7bd5",
        "var(--_r)": "4",
        "var(--_fm)": "monospace",
        "var(--pele-bg,#fff)": "#ffffff",
        "var(--pele-fg,#1f1f1f)": "#1f1f1f",
        "var(--pele-line,#1f1f1f)": "#1f1f1f",
        "var(--pele-surface,#f3f3f3)": "#f3f3f3",
        "var(--pele-border,#8a8a8a)": "#8a8a8a",
        "var(--pele-accent,#5b7bd5)": "#5b7bd5",
        "var(--pele-muted,#6e6e6e)": "#6e6e6e",
        "var(--pele-surface-alt,#e6e6e6)": "#e6e6e6",
        "var(--pele-radius,4px)": "4",
        "var(--pele-font,sans-serif)": "sans-serif",
        "var(--pele-font-mono,monospace)": "monospace",
    }
    for source, target in replacements.items():
        svg = svg.replace(source, target)
    svg = re.sub(r' style="rx:([^"]+)"', r' rx="\1"', svg)
    return svg


def diagram_image_options(svg: str) -> str:
    match = re.search(r'viewBox="\s*[-+\d.]+\s+[-+\d.]+\s+([\d.]+)\s+([\d.]+)"', svg)
    if match is None:
        return 'width: 100%'
    width, height = (float(value) for value in match.groups())
    natural_height_cm = 16.6 * height / width if width else 0
    if natural_height_cm > 14:
        return 'width: 100%, height: 14cm, fit: "contain"'
    return 'width: 100%'


def inline_markup(value: str) -> str:
    placeholders: list[str] = []

    def preserve(content: str) -> str:
        placeholders.append(content)
        return f"\x00{len(placeholders) - 1}\x00"

    value = re.sub(
        r"!\[([^]]*)\]\(([^)]+)\)",
        lambda match: preserve(f'#text(size: 9pt, fill: rgb("#4a4a4a"))[Image: {typst_escape(match.group(1) or match.group(2))}]'),
        value,
    )
    value = re.sub(
        r"\[([^]]+)\]\(([^)]+)\)",
        lambda match: preserve(f'#link("{match.group(2)}")[{inline_markup(match.group(1))}]'),
        value,
    )
    value = re.sub(r"`([^`]+)`", lambda match: preserve(f'`{typst_escape(match.group(1))}`'), value)
    value = re.sub(
        r"\*\*([^*]+)\*\*|__([^_]+)__",
        lambda match: preserve(f"*{inline_markup(match.group(1) or match.group(2))}*"),
        value,
    )
    value = re.sub(
        r"(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)",
        lambda match: preserve(f"_{inline_markup(match.group(1) or match.group(2))}_"),
        value,
    )
    value = typst_escape(value)

    for index, content in enumerate(placeholders):
        value = value.replace(f"\x00{index}\x00", content)
    return value


def split_table_row(line: str) -> list[str]:
    row = line.strip().strip("|")
    return [cell.strip() for cell in row.split("|")]


def is_table_separator(line: str) -> bool:
    cells = split_table_row(line)
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells)


def render_mermaid(source: str, cache_dir: Path, typst_root: Path) -> str:
    try:
        import mermaidx
    except ImportError as error:
        raise RuntimeError(
            "Mermaid diagrams require mermaidx and its native runtime; "
            "install scripts/export/requirements-docs.txt and use nix develop"
        ) from error

    cache_dir.mkdir(parents=True, exist_ok=True)
    version = getattr(mermaidx, "__version__", "unknown")
    backend = "js:pele"
    digest = hashlib.sha256(
        f"{version}\0{backend}\0{SVG_NORMALIZER_VERSION}\0{source}".encode("utf-8")
    ).hexdigest()[:16]
    diagram_path = cache_dir / f"{digest}.svg"
    if not diagram_path.exists():
        diagram_path.write_text(
            normalize_mermaid_svg(mermaidx.render(source, backend=backend).svg()),
            encoding="utf-8",
        )
    svg = diagram_path.read_text(encoding="utf-8")
    relative_path = diagram_path.relative_to(typst_root.parent).as_posix()
    return (
        f'#figure(image("{typst_string(relative_path)}", '
        f'{diagram_image_options(svg)}), caption: [Mermaid diagram])'
    )


def render_table(lines: list[str]) -> str:
    header = split_table_row(lines[0])
    body = [split_table_row(line) for line in lines[2:]]
    columns = max([len(header), *(len(row) for row in body)], default=1)
    rows = [header] + body
    rendered_rows = []
    for row in rows:
        cells = row + [""] * (columns - len(row))
        rendered_rows.append(",\n".join(f"[{inline_markup(cell)}]" for cell in cells))
    body = ",\n  ".join(row for row in rendered_rows[1:])
    return "#table(\n  columns: (" + ", ".join("1fr" for _ in range(columns)) + "),\n  table.header(" + rendered_rows[0] + "),\n  " + body + "\n)"


def render_markdown(document: Path, diagram_cache: Path, typst_root: Path) -> str:
    lines = document.read_text(encoding="utf-8").splitlines()
    output: list[str] = []
    index = 0
    in_code = False
    code_language = ""
    code_lines: list[str] = []

    while index < len(lines):
        line = lines[index]
        if line.startswith("```"):
            if in_code:
                if code_language == "mermaid":
                    output.append(render_mermaid("\n".join(code_lines), diagram_cache, typst_root))
                else:
                    lang = code_language if code_language else "text"
                    output.append(
                        f'#raw(block: true, lang: "{lang}", "'
                        + typst_string("\n".join(code_lines))
                        + '")'
                    )
                code_lines = []
                in_code = False
            else:
                in_code = True
                code_language = line[3:].strip().lower()
            index += 1
            continue
        if in_code:
            code_lines.append(line)
            index += 1
            continue
        if not line.strip():
            index += 1
            continue
        if line.startswith("|") and index + 1 < len(lines) and is_table_separator(lines[index + 1]):
            table_lines = [line, lines[index + 1]]
            index += 2
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(lines[index])
                index += 1
            output.append(render_table(table_lines))
            continue
        heading = re.match(r"^(#{1,6})\s+(.+)$", line)
        if heading:
            level = min(len(heading.group(1)), 3)
            title = inline_markup(heading.group(2).strip())
            output.append("=" * level + " " + title)
        elif re.match(r"^\s*[-*+]\s+", line):
            output.append("- " + inline_markup(re.sub(r"^\s*[-*+]\s+", "", line)))
        elif re.match(r"^\s*\d+[.)]\s+", line):
            output.append("+ " + inline_markup(re.sub(r"^\s*\d+[.)]\s+", "", line)))
        elif line.startswith("> "):
            output.append("#block(inset: (x: 1em, y: 0.6em), [" + inline_markup(line[2:]) + "])")
        else:
            output.append(inline_markup(line))
        index += 1

    if in_code:
        if code_language == "mermaid":
            output.append(render_mermaid("\n".join(code_lines), diagram_cache, typst_root))
        else:
            lang = code_language if code_language else "text"
            output.append(
                f'#raw(block: true, lang: "{lang}", "'
                + typst_string("\n".join(code_lines))
                + '")'
            )
    return "\n\n".join(output)


def typst_document() -> str:
    return '''#set page(
  paper: "a4",
  margin: (top: 2.2cm, bottom: 2.2cm, left: 2.2cm, right: 2.2cm),
  numbering: "1",
  number-align: center,
)
#set text(
  font: ("IBM Plex Serif", "DejaVu Serif", "Liberation Serif"),
  size: 10pt,
  fill: black,
  lang: "en",
)
#set par(justify: true, leading: 0.75em, spacing: 1.15em)
#show heading: it => {
  let size = if it.level == 1 { 15pt } else if it.level == 2 { 12.5pt } else { 11pt }
  set text(weight: "bold", size: size)
  block(above: 1.85em, below: 0.85em, sticky: true, it.body)
}
#set table(stroke: none, fill: none, inset: (x: 5pt, y: 4pt), align: top + left)
#show table.cell: it => {
  set text(size: 9.5pt, number-type: "lining", number-width: "tabular")
  set par(justify: false, leading: 0.65em)
  it
}
#show table.cell.where(y: 0): it => {
  set text(weight: "bold", size: 9.5pt)
  set table.cell(fill: rgb("#f0f0f0"), stroke: (bottom: 0.6pt + rgb("#c4c4c4")))
  it
}
#set list(indent: 2.5em, spacing: 0.85em)
#show enum: it => {
  set text(size: 9pt)
  set enum(indent: 3em, spacing: 0.55em)
  it
}
#show raw: set text(font: ("DejaVu Sans Mono", "Liberation Mono", "Courier New"), size: 9pt)
#show raw.where(block: true): it => block(
  inset: (x: 0.9em, y: 0.7em),
  radius: 3pt,
  fill: rgb("#f5f5f5"),
  stroke: 0.4pt + rgb("#d6d6d6"),
  width: 100%,
  it,
)

#align(center)[
  #text(size: 20pt, weight: "bold")[Thesis Coordinator]
  #v(0.45em)
  #text(size: 13pt)[Bachelor thesis supervision and defense management]
]
'''


def build_typst(output: Path) -> None:
    documents = sorted((ROOT / "docs").rglob("*.md"))
    diagram_cache = output.parent / "diagrams"
    sections = [typst_document()]
    for document in documents:
        relative = document.relative_to(ROOT).as_posix()
        sections.append(
            "#block(\n"
            "  above: 1.2em,\n"
            "  below: 1.4em,\n"
            "  inset: (x: 7pt, y: 3pt),\n"
            "  radius: 3pt,\n"
            "  fill: rgb(\"#f2f2f2\"),\n"
            "  stroke: 0.4pt + rgb(\"#cfcfcf\"),\n"
            f"  text(size: 8.5pt, weight: \"medium\", fill: rgb(\"#333333\"))[{typst_escape(relative)}]\n"
            ")\n\n"
            f"{render_markdown(document, diagram_cache, output)}"
        )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n\n#pagebreak()\n\n".join(sections) + "\n", encoding="utf-8")


def compile_pdf(typst_path: Path, pdf_path: Path) -> None:
    typst = shutil.which("typst")
    if typst is None:
        raise RuntimeError("Typst is not installed; install it and rerun the export command")
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([typst, "compile", str(typst_path), str(pdf_path)], cwd=ROOT, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--typst-output", type=Path, default=DEFAULT_TYPST)
    parser.add_argument("--pdf-output", type=Path, default=DEFAULT_PDF)
    parser.add_argument("--typst-only", action="store_true", help="write Typst without compiling a PDF")
    args = parser.parse_args()
    typst_path = args.typst_output if args.typst_output.is_absolute() else ROOT / args.typst_output
    pdf_path = args.pdf_output if args.pdf_output.is_absolute() else ROOT / args.pdf_output
    build_typst(typst_path)
    if not args.typst_only:
        try:
            compile_pdf(typst_path, pdf_path)
        except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
            print(f"documentation export failed: {error}", file=sys.stderr)
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
