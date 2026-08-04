# Grant ROI & Szilard Point Calculator — Design Brainstorm

## Three Stylistic Approaches

**1. Scientific Dashboard** — Clean, data-forward interface inspired by academic journals and research dashboards. Neutral palette, precise typography, emphasis on the numbers.
Probability: 0.04

**2. Warm Academic** — Warm off-white parchment tones, serif typography, subtle paper texture. Feels like a well-designed academic report. Approachable and trustworthy.
Probability: 0.07

**3. Bold Policy Brief** — Deep navy and white with a single vivid accent (amber/gold). Inspired by policy documents and think-tank reports. Authoritative, confident, modern.
Probability: 0.08

---

## Chosen Approach: **Bold Policy Brief**

A researcher landing on this tool should feel they are consulting a serious, authoritative instrument — not a generic web form. The design draws from the visual language of policy briefs, economic research reports, and think-tank publications.

### Design Movement
Policy-document modernism — the aesthetic of Brookings Institution reports, OECD data dashboards, and Nature editorial graphics.

### Core Principles
1. **Authority through restraint** — every element earns its place; no decoration for decoration's sake
2. **Data is the hero** — the ROI number and Szilard point are displayed with maximum visual weight
3. **Legibility at all scales** — inputs, outputs, and explanatory text are all immediately readable
4. **Progressive disclosure** — the formula and methodology are accessible but not intrusive

### Color Philosophy
- **Background:** Deep navy `#0f1f3d` — conveys authority and seriousness
- **Surface:** Slightly lighter navy `#162447` for cards
- **Accent:** Warm amber `#f5a623` — used sparingly for the key result numbers and CTAs; creates urgency and draws the eye exactly where needed
- **Text:** Off-white `#f0f4ff` for primary, `#8ba3c7` for secondary/muted
- **Danger zone:** Red `#e05252` for ROI < 1 (below Szilard point)
- **Safe zone:** Green `#4caf82` for ROI ≥ 1

### Layout Paradigm
Asymmetric two-column layout on desktop: left column (40%) for inputs, right column (60%) for live results and the ROI curve chart. On mobile, stacks vertically. No centered hero — the tool is immediately visible above the fold.

### Signature Elements
1. **The ROI Gauge** — a large, animated circular gauge showing current ROI with colour transitions (green → amber → red as FTE increases)
2. **The Szilard Curve** — a live-updating line chart showing ROI vs FTE, with the Szilard point marked as a vertical dashed line
3. **The Verdict Banner** — a prominent coloured banner at the top of results: "ABOVE SZILARD POINT — Writing this grant is costing you more than it returns"

### Interaction Philosophy
Every input change triggers an immediate, animated update of all outputs. The chart redraws smoothly. The gauge needle sweeps. The verdict banner transitions colour. The tool feels alive and responsive.

### Animation
- Input changes: 200ms ease-out transitions on all result values
- Chart: 300ms smooth curve redraw using Recharts animation
- Gauge: 400ms sweep animation on needle
- Verdict banner: 250ms colour fade transition

### Typography System
- **Display/Headlines:** `Playfair Display` — authoritative serif for the title and key result numbers
- **Body/Labels:** `Inter` — clean, readable for inputs, descriptions, and secondary text
- **Monospace:** `JetBrains Mono` — for formula display

### Brand Essence
*A rigorous, data-driven decision tool for researchers who want to know the truth about grant writing — before they spend the time.*
Personality: **Authoritative. Honest. Precise.**

### Brand Voice
Headlines: "Is writing this grant worth your time?" / "Your Szilard Point: the moment grant writing stops paying"
No filler like "Welcome" or "Get started today."

### Signature Brand Color
Deep navy `#0f1f3d` — unmistakably this tool's own.
