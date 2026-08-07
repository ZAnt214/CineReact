#!/usr/bin/env python3
"""Monochrome white/gray palette — remove purple accents."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = list(ROOT.glob("src/**/*")) + list(ROOT.glob("public/*"))
EXTENSIONS = {".tsx", ".ts", ".css", ".html", ".svg"}

REPLACEMENTS = [
    ("#8b5cf6", "#ffffff"),
    ("#8B5CF6", "#ffffff"),
    ("#a78bfa", "#fafafa"),
    ("#A78BFA", "#fafafa"),
    ("#7c3aed", "#d4d4d4"),
    ("#7C3AED", "#d4d4d4"),
    ("#9146ff", "#ffffff"),
    ("rgba(139,92,246", "rgba(255,255,255"),
    ("rgba(139, 92, 246", "rgba(255, 255, 255"),
    ("rgba(123,140,255", "rgba(255,255,255"),
    ("rgba(123, 140, 255", "rgba(255, 255, 255"),
    ("#f1f1f1", "#fafafa"),
    ("#aaaaaa", "#a3a3a3"),
    ("bg-gradient-to-r from-cine-accent-light to-cine-accent", "bg-white"),
    ("bg-gradient-to-r from-cine-accent-light via-cine-accent-light to-cine-accent", "bg-white"),
    ("hover:from-cine-cream hover:to-cine-accent-light", "hover:bg-neutral-200"),
    ("hover:from-cine-cream hover:to-cine-accent", "hover:bg-neutral-200"),
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
