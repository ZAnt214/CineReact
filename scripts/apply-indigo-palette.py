#!/usr/bin/env python3
"""Apply Cosmic Indigo blue/purple palette."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = list(ROOT.glob("src/**/*")) + list(ROOT.glob("public/*")) + [ROOT / "index.html"]
EXTENSIONS = {".tsx", ".ts", ".css", ".html", ".svg"}

REPLACEMENTS = [
    ("#0c1014", "#080a14"),
    ("#0C1014", "#080a14"),
    ("#ede8e1", "#eaeaf4"),
    ("#EDE8E1", "#eaeaf4"),
    ("#141a21", "#0f1324"),
    ("#1c242d", "#161b32"),
    ("#2d3744", "#2a3158"),
    ("#24303c", "#1e2548"),
    ("#8891a0", "#8b92b8"),
    ("#d4845c", "#7b8cff"),
    ("#D4845C", "#7b8cff"),
    ("#e8a882", "#a5b4ff"),
    ("#E8A882", "#a5b4ff"),
    ("#b5653f", "#5b6be0"),
    ("#6eb5a8", "#a78bfa"),
    ("#4f8f84", "#7c5fd4"),
    ("rgba(212,132,92", "rgba(123,140,255"),
    ("rgba(212, 132, 92", "rgba(123, 140, 255"),
    ("font-bricolage", "font-display"),
]

def main():
    changed = 0
    for path in TARGETS:
        if path.suffix not in EXTENSIONS or not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        original = text
        for old, new in REPLACEMENTS:
            text = text.replace(old, new)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed += 1
            print(f"updated: {path.relative_to(ROOT)}")
    print(f"done — {changed} files")

if __name__ == "__main__":
    main()
