#!/usr/bin/env python3
"""Apply cyan interface palette — remove YouTube red."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = list(ROOT.glob("src/**/*")) + list(ROOT.glob("public/*")) + [ROOT / "index.html"]
EXTENSIONS = {".tsx", ".ts", ".css", ".html", ".svg"}

REPLACEMENTS = [
    ("#0f0f0f", "#0a0e14"),
    ("#0F0F0F", "#0a0e14"),
    ("#212121", "#121a24"),
    ("#272727", "#1a2533"),
    ("#3f3f3f", "#2a3a4f"),
    ("#f1f1f1", "#e8f4fc"),
    ("#F1F1F1", "#e8f4fc"),
    ("#aaaaaa", "#7a8fa6"),
    ("#AAAAAA", "#7a8fa6"),
    ("#ff0000", "#22d3ee"),
    ("#FF0000", "#22d3ee"),
    ("#ff4d4d", "#67e8f9"),
    ("#cc0000", "#0891b2"),
    ("#CC0000", "#0891b2"),
    ("bg-[#ff0000]", "bg-cine-accent"),
    ("hover:bg-[#cc0000]", "hover:bg-cine-accent-dark"),
    ("rgba(255, 0, 0", "rgba(34, 211, 238"),
    ("rgba(255,0,0", "rgba(34,211,238"),
    ("Roboto", "Sora"),
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
