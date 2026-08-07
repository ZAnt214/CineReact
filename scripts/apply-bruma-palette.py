#!/usr/bin/env python3
"""Apply Bruma Azul palette hex/rgba updates."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = list(ROOT.glob("src/**/*")) + list(ROOT.glob("public/*")) + [ROOT / "index.html"]
EXTENSIONS = {".tsx", ".ts", ".css", ".html", ".svg"}

REPLACEMENTS = [
    ("#0f0d14", "#0c1014"),
    ("#0F0D14", "#0c1014"),
    ("#f3ece4", "#ede8e1"),
    ("#F3ECE4", "#ede8e1"),
    ("rgba(233,168,130", "rgba(212,132,92"),
    ("rgba(233, 168, 130", "rgba(212, 132, 92"),
    ("#e9a882", "#d4845c"),
    ("#E9A882", "#d4845c"),
    ("#f5c9a8", "#e8a882"),
    ("#F5C9A8", "#e8a882"),
    ("#c4a8e0", "#6eb5a8"),
    ("#C4A8E0", "#6eb5a8"),
    ("#2a2436", "#24303c"),
    ("font-syne", "font-bricolage"),
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
