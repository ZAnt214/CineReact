#!/usr/bin/env python3
"""Apply platform solid palette (YouTube/Twitch inspired)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = list(ROOT.glob("src/**/*")) + list(ROOT.glob("public/*")) + [ROOT / "index.html"]
EXTENSIONS = {".tsx", ".ts", ".css", ".html", ".svg"}

REPLACEMENTS = [
    ("#080a14", "#0f0f0f"),
    ("#0f1324", "#181818"),
    ("#161b32", "#212121"),
    ("#2a3158", "#303030"),
    ("#1e2548", "#303030"),
    ("#eaeaf4", "#f1f1f1"),
    ("#8b92b8", "#aaaaaa"),
    ("#7b8cff", "#8b5cf6"),
    ("#a5b4ff", "#a78bfa"),
    ("#5b6be0", "#7c3aed"),
    ("#c084fc", "#8b5cf6"),
    ("#a78bfa", "#a78bfa"),
    ("rgba(123,140,255", "rgba(139,92,246"),
    ("rgba(123, 140, 255", "rgba(139, 92, 246"),
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
