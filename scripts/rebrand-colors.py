#!/usr/bin/env python3
"""Replace amber/yellow brand colors with warm stone neutrals across source files."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = list(ROOT.glob("src/**/*")) + list(ROOT.glob("index.html"))
EXTENSIONS = {".tsx", ".ts", ".css", ".html"}

REPLACEMENTS = [
    # Opacity variants first (longest match)
    ("amber-500/40", "stone-400/40"),
    ("amber-500/30", "stone-400/30"),
    ("amber-500/25", "stone-400/25"),
    ("amber-500/20", "stone-400/20"),
    ("amber-500/15", "stone-400/15"),
    ("amber-500/10", "stone-400/10"),
    ("amber-400/90", "stone-300/90"),
    ("amber-400/80", "stone-300/80"),
    ("amber-400/70", "stone-300/70"),
    ("amber-400/60", "stone-300/60"),
    ("amber-400/40", "stone-300/40"),
    ("amber-400/30", "stone-300/30"),
    ("amber-400/20", "stone-300/20"),
    ("amber-400/15", "stone-300/15"),
    ("amber-400/10", "stone-300/10"),
    ("yellow-500/25", "stone-400/25"),
    ("yellow-500/20", "stone-400/20"),
    ("yellow-500/10", "stone-400/10"),
    ("yellow-400/30", "stone-300/30"),
    ("yellow-400/20", "stone-300/20"),
    ("amber-950/40", "stone-900/40"),
    ("amber-950/30", "stone-900/30"),
    ("amber-950/25", "stone-900/25"),
    ("amber-950/20", "stone-900/20"),
    ("amber-950/15", "stone-900/15"),
    ("amber-950/10", "stone-900/10"),
    ("yellow-950/30", "stone-900/30"),
    ("yellow-200/90", "stone-200/90"),
    ("shadow-amber-950/10", "shadow-stone-950/10"),
    ("to-amber-700", "to-stone-600"),
    ("from-amber-950", "from-stone-900"),
    ("to-amber-950", "to-stone-900"),
    ("via-yellow-950", "via-stone-900"),
    ("from-amber-900", "from-stone-800"),
    ("amber-950", "stone-900"),
    ("amber-900", "stone-800"),
    ("amber-700", "stone-600"),
    ("amber-950/10", "stone-900/10"),
    ("amber-50", "stone-50"),
    ("orange-500", "stone-500"),
    ("orange-400", "stone-400"),
    ("orange-950", "stone-900"),
    ("yellow-200", "stone-200"),
    ("#0d0d10", "#141210"),
    ("#0D0D10", "#141210"),
    ("text-yellow-100", "text-stone-100"),
    ("text-orange-400", "text-stone-400"),
    ("text-orange-300", "text-stone-300"),
    ("text-orange-200", "text-stone-200"),
    ("via-orange-500", "via-stone-500"),
    ("via-orange-400", "via-stone-400"),
    ("from-orange-950", "from-stone-900"),
    ("from-orange-700", "from-stone-600"),
    ("ring-orange-500/80", "ring-stone-400/80"),
    ("ring-orange-500/70", "ring-stone-400/70"),
    ("ring-orange-400/60", "ring-stone-400/60"),
    ("#fcd34d", "#d6d3d1"),
    ("rgba(234,179,8", "rgba(168,162,158"),
    ("rgba(249,115,22", "rgba(120,113,108"),
    # Gradients
    ("from-amber-500", "from-stone-300"),
    ("from-amber-400", "from-stone-200"),
    ("via-yellow-400", "via-stone-300"),
    ("via-yellow-300", "via-stone-200"),
    ("via-amber-400", "via-stone-300"),
    ("to-yellow-500", "to-stone-400"),
    ("to-yellow-400", "to-stone-300"),
    ("to-amber-500", "to-stone-400"),
    ("to-amber-400", "to-stone-300"),
    # Base shades
    ("amber-600", "stone-500"),
    ("amber-500", "stone-400"),
    ("amber-400", "stone-300"),
    ("amber-300", "stone-200"),
    ("amber-200", "stone-100"),
    ("amber-100", "stone-50"),
    ("yellow-600", "stone-500"),
    ("yellow-500", "stone-400"),
    ("yellow-400", "stone-300"),
    ("yellow-300", "stone-200"),
    # Hex / rgba
    ("#f59e0b", "#a8a29e"),
    ("#F59E0B", "#A8A29E"),
    ("#fbbf24", "#d6d3d1"),
    ("#FBBF24", "#D6D3D1"),
    ("#d97706", "#78716c"),
    ("#D97706", "#78716C"),
    ("rgba(245,158,11", "rgba(168,162,158"),
    ("rgba(251, 191, 36", "rgba(214,211,209"),
]

def process_file(path: Path) -> bool:
    if path.suffix not in EXTENSIONS or not path.is_file():
        return False
    text = path.read_text(encoding="utf-8")
    original = text
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False

def main():
    changed = 0
    for path in TARGETS:
        if process_file(path):
            changed += 1
            print(f"updated: {path.relative_to(ROOT)}")
    print(f"done — {changed} files")

if __name__ == "__main__":
    main()
