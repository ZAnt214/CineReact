#!/usr/bin/env python3
"""Apply YouTube dark-theme interface palette."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = list(ROOT.glob("src/**/*")) + list(ROOT.glob("public/*")) + [ROOT / "index.html"]
EXTENSIONS = {".tsx", ".ts", ".css", ".html", ".svg"}

REPLACEMENTS = [
    ("#181818", "#212121"),
    ("#303030", "#3f3f3f"),
    ("#fafafa", "#f1f1f1"),
    ("#FAFAFA", "#f1f1f1"),
    ("#a3a3a3", "#aaaaaa"),
    ("#A3A3A3", "#aaaaaa"),
    ("#737373", "#717171"),
    ("#d4d4d4", "#aaaaaa"),
    ("bg-white text-black", "bg-[#ff0000] text-white"),
    ("hover:bg-neutral-200", "hover:bg-[#cc0000]"),
    ("hover:brightness-110", "hover:brightness-105"),
    ("zinc-950", "neutral-950"),
    ("zinc-900", "neutral-900"),
    ("zinc-850", "neutral-800"),
    ("zinc-800", "neutral-800"),
    ("font-bricolage", "font-display"),
    ("Plus Jakarta Sans", "Roboto"),
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
