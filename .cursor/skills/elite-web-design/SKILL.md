---
name: elite-web-design
description: Elite web design system v3.0 for building professional, friendly, clean UIs with strong visual hierarchy, accessible navigation, and polished interactions. Use when redesigning pages, building new UI components, improving UX, or when the user mentions elite design, clean layout, or professional interface work.
---

# ELITE WEB DESIGN SKILL v3.0

## Core Principles

1. **Clarity over decoration** — every element earns its place
2. **One accent color** — use brand cyan (`#00E5FF`) sparingly for CTAs, active states, links
3. **Dark-first** — black/near-black backgrounds (`#000`, `#0a0a0c`) with subtle radial gradients
4. **Glass surfaces** — `backdrop-blur` + low-opacity borders (`rgba(255,255,255,0.08)`)
5. **Generous spacing** — minimum 16px padding on cards, 12px gap between related items
6. **Touch-friendly** — buttons ≥ 44px tap target, pill shapes for primary actions

## Color Tokens (CineReact)

| Token | Value | Use |
|-------|-------|-----|
| `--clips-accent` | `#00E5FF` | CTAs, active tabs, links, glow |
| `--clips-accent-soft` | `rgba(0,229,255,0.12)` | Hover backgrounds |
| `--clips-accent-border` | `rgba(0,229,255,0.28)` | Focus/hover borders |
| Surface | `#0a0a0c` at 72–97% opacity | Cards, sheets, panels |
| Text primary | `#ffffff` | Headings, labels |
| Text muted | `#a1a1aa` / `zinc-400` | Descriptions, meta |

## Typography

- **Display/logo**: `font-display` (Sora / Plus Jakarta Sans), extrabold
- **Body**: `font-sans` (Inter), 14–15px for content, 10–12px for meta
- **Hierarchy**: title → creator → description → meta (decreasing size + opacity)
- **Line clamp**: `line-clamp-2` on titles/descriptions in feed cards

## Component Patterns

### Primary button
```html
<button class="cineclips-primary-btn">Label</button>
```
Pill shape, cyan fill, black text, `font-weight: 800`.

### Secondary button
```html
<button class="cineclips-secondary-btn">Label</button>
```
Glass background, white text, cyan border on hover.

### Info card (glass)
```html
<div class="cineclips-info-card">...</div>
```
Rounded `1.25rem`, blur backdrop, subtle border.

### Action rail (vertical)
- 48px circular buttons with icon + count label below
- Active state: accent color fill on icon
- Gap: 20px between actions

### Bottom sheet
- Drag handle bar at top (`w-10 h-1 rounded-full bg-white/15`)
- `rounded-t-[1.75rem]`, max-height 75vh
- Spring animation: `damping: 30, stiffness: 340`

### Tab navigation
- Pill tabs centered in header
- Active: cyan fill + black text + subtle glow shadow
- Inactive: transparent, muted white text

## Layout Rules

### Full-screen feed (TikTok-style)
- `snap-y snap-mandatory` scroll container, each section `h-full`
- Header: fixed top, gradient fade `from-black/90`
- Info card: bottom-left, action rail: bottom-right
- Progress dots: left edge, active dot taller + cyan glow
- Swipe hint: bottom center, subtle bounce animation

### Spacing zones
```
[Header:  top 0–5rem]
[Content: full bleed video]
[Info:    bottom 0, pr-4.5rem to clear action rail]
[Actions: right 12px, bottom 9rem]
```

## Interaction Checklist

- [ ] All buttons have `cursor-pointer` and hover transition
- [ ] Active states visually distinct (color + optional fill)
- [ ] Loading states use spinner in accent color
- [ ] Empty states: icon + headline + description + 1–2 CTAs
- [ ] Error states: message + recovery action (back/retry)
- [ ] `aria-label` on icon-only buttons

## Motion

- Page transitions: spring physics, not linear
- Hover: `transition: all 0.2s ease`
- Active press: `scale(0.94)` on action buttons
- Subtle ambient: `animate-bounce` on swipe hints only

## Anti-Patterns

- ❌ Multiple competing accent colors on one screen
- ❌ Yellow + cyan mixed without intent
- ❌ Text directly on video without gradient scrim
- ❌ Tiny tap targets (< 40px)
- ❌ Dense walls of text in feed overlays
- ❌ Hard borders without transparency

## Watermark / Brand Overlay

For video exports, use a **discreet centered vertical card** (~28% video width):

- Play icon squircle cyan + "CineReact" wordmark
- Subtitle: "assista mais reacts aqui"
- CTA pill: `bit.ly/CineReact`
- Position: center `(W-w)/2:(H-h)/2`
- See [cineclips-ui skill](../cineclips-ui/SKILL.md) for full specs

### Action rail (enhanced)

- Variant per action: `like`, `comment`, `favorite`, `share`, `download`, `report`
- 3.1rem glass circles with gradient, glow on active, Portuguese labels
- See [cineclips-ui skill](../cineclips-ui/SKILL.md)

## Workflow

1. Audit existing page — identify hierarchy gaps
2. Define zones (header / content / overlay / actions)
3. Apply color tokens — one accent, glass surfaces
4. Build components bottom-up (buttons → cards → layout)
5. Add motion last — only where it aids orientation
6. Test: empty, loading, error, single item, many items
