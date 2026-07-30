# ARCANA STATE — Design Brainstorm

## Chosen Approach: Hermetic Void

**Design Movement:** Dark Occultism meets Manuscript Illumination — a fusion of 17th-century celestial cartography and modern terminal aesthetics.

**Core Principles:**

1. Void-first: near-black backgrounds (#030508) with luminous text emerging from darkness
2. Typographic ritual: Cinzel (serif caps) for sacred labels; Crimson Pro (italic serif) for body prose
3. Amber ember accents (#c8923a) as the only warm light source — like candlelight on parchment
4. Triadic color system: Mind (ice-blue), Soul (amber-orange), Spirit (violet-purple)

**Color Philosophy:**

- Background void: #030508 — absolute dark, like deep space
- Surface layers: #080d14 → #111d2e — depth through subtle blue-black gradients
- Accent ember: #c8923a — the only warmth, used sparingly for headings and CTAs
- Silver prose: #b8c8d8 — cool, readable, like moonlight on text
- Triadic pillars: blue (#6ab0e8), orange (#e8a06a), purple (#a878e8)

**Layout Paradigm:**

- Single-column ritual scroll — the user descends through the reading
- Input panels side-by-side (natal / transits) then full-width synthesis
- Output sections accordion-collapsed, opened by curiosity
- No sidebar — the reading IS the page

**Signature Elements:**

1. Starfield background via CSS radial-gradients (fixed, non-scrolling)
2. Horizontal ember gradient dividers between sections
3. Planet glyphs (☉ ☽ ☿ ♀ ♂ ♃ ♄ ☊ ☋) as section icons

**Interaction Philosophy:**

- Minimal interaction — the app is contemplative, not gamified
- Sections collapse/expand with smooth transitions
- Loading state: spinning ring + "READING THE HEAVENS" flicker text
- Fade-up entrance animations for output sections

**Animation:**

- Pulsing triad dots (0.5s stagger) in header
- Spin animation for loading ring (1.2s linear)
- FadeUp for output sections (0.6s ease, staggered delays)
- Flicker for loading text (2s ease-in-out)

**Typography System:**

- Display: Cinzel 900 — titles, section headers, labels (ALL CAPS, letter-spacing: 2-5px)
- Body: Crimson Pro 400/300 italic — all prose, textarea input, planet descriptions
- Scale: 52px title → 20px section → 15px body → 11px labels
