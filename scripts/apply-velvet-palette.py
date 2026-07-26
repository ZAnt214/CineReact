#!/usr/bin/env python3
"""Apply Velvet Bloom palette — replace stone brand tokens with cine-* theme colors."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = list(ROOT.glob("src/**/*")) + [ROOT / "index.html"]
EXTENSIONS = {".tsx", ".ts", ".css", ".html"}

REPLACEMENTS = [
    # Opacity variants (longest first)
    ("stone-400/90", "cine-accent/90"),
    ("stone-400/80", "cine-accent/80"),
    ("stone-400/70", "cine-accent/70"),
    ("stone-400/60", "cine-accent/60"),
    ("stone-400/50", "cine-accent/50"),
    ("stone-400/40", "cine-accent/40"),
    ("stone-400/35", "cine-accent/35"),
    ("stone-400/30", "cine-accent/30"),
    ("stone-400/25", "cine-accent/25"),
    ("stone-400/20", "cine-accent/20"),
    ("stone-400/15", "cine-accent/15"),
    ("stone-400/10", "cine-accent/10"),
    ("stone-400/8", "cine-accent/8"),
    ("stone-400/5", "cine-accent/5"),
    ("stone-300/90", "cine-accent-light/90"),
    ("stone-300/80", "cine-accent-light/80"),
    ("stone-300/70", "cine-accent-light/70"),
    ("stone-300/60", "cine-accent-light/60"),
    ("stone-300/40", "cine-accent-light/40"),
    ("stone-300/30", "cine-accent-light/30"),
    ("stone-300/20", "cine-accent-light/20"),
    ("stone-300/15", "cine-accent-light/15"),
    ("stone-300/10", "cine-accent-light/10"),
    ("stone-200/90", "cine-cream/90"),
    ("stone-900/40", "cine-surface/40"),
    ("stone-900/30", "cine-surface/30"),
    ("stone-900/25", "cine-surface/25"),
    ("stone-900/20", "cine-surface/20"),
    ("stone-900/15", "cine-surface/15"),
    ("stone-900/10", "cine-surface/10"),
    ("stone-950/10", "cine-bg/10"),
    # Gradients
    ("from-stone-500", "from-cine-accent-dark"),
    ("from-stone-400", "from-cine-accent"),
    ("from-stone-300", "from-cine-accent-light"),
    ("from-stone-200", "from-cine-cream"),
    ("via-stone-500", "via-cine-accent-dark"),
    ("via-stone-400", "via-cine-accent"),
    ("via-stone-300", "via-cine-accent-light"),
    ("via-stone-200", "via-cine-cream"),
    ("to-stone-500", "to-cine-accent-dark"),
    ("to-stone-400", "to-cine-accent"),
    ("to-stone-300", "to-cine-accent-light"),
    ("to-stone-200", "to-cine-cream"),
    ("to-stone-600", "to-cine-accent-dark"),
    # Base shades
    ("text-stone-400", "text-cine-accent"),
    ("text-stone-300", "text-cine-accent-light"),
    ("text-stone-200", "text-cine-cream"),
    ("text-stone-100", "text-cine-cream"),
    ("text-stone-50", "text-cine-cream"),
    ("bg-stone-400", "bg-cine-accent"),
    ("bg-stone-300", "bg-cine-accent-light"),
    ("border-stone-400", "border-cine-accent"),
    ("border-stone-300", "border-cine-accent-light"),
    ("ring-stone-400", "ring-cine-accent"),
    ("shadow-stone-400", "shadow-cine-accent"),
    ("stone-400", "cine-accent"),
    ("stone-300", "cine-accent-light"),
    ("stone-200", "cine-cream"),
    ("stone-100", "cine-cream"),
    ("stone-500", "cine-accent-dark"),
    ("stone-600", "cine-accent-dark"),
    ("stone-900", "cine-surface"),
    ("stone-950", "cine-bg"),
    ("stone-50", "cine-cream"),
    # Hex / rgba
    ("#141210", "#0f0d14"),
    ("#0d0d10", "#0f0d14"),
    ("#a8a29e", "#9d92a8"),
    ("#d6d3d1", "#f5c9a8"),
    ("#e7e5e4", "#f3ece4"),
    ("#fafaf9", "#f3ece4"),
    ("#78716c", "#9d92a8"),
    ("rgba(168,162,158", "rgba(233,168,130"),
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
