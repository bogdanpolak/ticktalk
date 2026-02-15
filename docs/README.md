# TickTalk Design System — File Guide

This folder now contains **3 key files** for AI-driven component generation.

---

## 📄 Files Overview

### 1. **DESIGN_SYSTEM.md** (Primary Reference)
- **What**: Complete design system specification
- **Who**: Architects, AI agents, component generators
- **Contains**:
  - Color tokens (semantic roles + palettes)
  - Spacing system (4px base grid)
  - Typography scale (2 weights, 7 sizes)
  - Radius, shadows, focus states
  - **8 core component specs** (Button, Timer, Participant Card, Input, Badge, Panel, Select, Modal)
  - Meeting page layout structure
  - State documentation (Lobby, Active, Warning, Expired, etc.)
  - CSS variables setup
  - Tailwind reference
  - Implementation notes for AI agents
- **Length**: ~600 lines
- **Use**: Bookmark this. Reference it before building anything.

---

### 2. **AI_COMPONENT_GENERATOR_GUIDE.md** (Quick Reference)
- **What**: Condensed quick-lookup for component generation
- **Who**: AI agents, frontend developers
- **Contains**:
  - Core rules (7 non-negotiable principles)
  - Token quick-paste tables
  - Component blueprint template
  - Copy-paste code structs for all 8 components
  - Meeting page layout diagram
  - State transitions
  - Performance notes
  - Accessibility checklist
- **Length**: ~300 lines
- **Use**: Use this when you're mid-generation and need exact values fast.

---

### 3. **tailwind.config.ai.ts** (Optional Tooling)
- **What**: Tailwind CSS configuration aligned to design system
- **Who**: If your project uses Tailwind
- **Contains**:
  - Color theme extension
  - Spacing scale
  - Border radius variants
  - FontSize with line height bundled
  - Custom focus utilities
  - Box shadow definitions
  - Transition duration presets
- **Length**: ~80 lines
- **Use**: Copy `extend` section into your `tailwind.config.ts` OR use this file as-is if starting fresh.
- **Note**: CSS variables (in DESIGN_SYSTEM.md section 12) are preferred for AI agents.

---

## 🎯 How to Use These Files

### For AI Component Generation (Recommended)

1. **Start with [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)**
   - Read sections 1.1 (Colors), 1.2 (Spacing), 1.3 (Typography)
   - Review section 8 (Component Specs) for the exact component you're building
   - Check section 13 (Implementation Notes) — this is for you

2. **Reference [AI_COMPONENT_GENERATOR_GUIDE.md](AI_COMPONENT_GENERATOR_GUIDE.md)**
   - Copy-paste the exact CSS/structure for your component
   - Use the "Token Quick Reference" for values
   - Cross-check states (Default, Hover, Active, Disabled, Focus)

3. **Implement in Your Language**
   - Use **CSS variables** (section 12 of DESIGN_SYSTEM.md)
   - Or use **Tailwind** (if you configure `tailwind.config.ai.ts`)
   - OR hardcode the exact values (less ideal, but works)

---

### For Manual Design Reviews

1. Read the **Design Philosophy** in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) intro
2. Check the **Meeting Page Layout** (section 9)
3. Review **State Documentation** (section 10) — critical!

---

### For Tailwind Users

1. Copy the `extend` section from `tailwind.config.ai.ts` into your `tailwind.config.ts`
2. Use semantic class names:
   ```jsx
   // Good:
   <button className="bg-brand text-surface px-m py-s rounded-none">
     Start Meeting
   </button>

   // Avoid:
   <button className="bg-blue-500 text-white px-4 py-2">
     Start Meeting
   </button>
   ```

---

## 🔑 Key Design Decisions (Why It's This Way)

| Decision | Rationale |
| -------- | --------- |
| **Dark mode only (MVP)** | Internal tool for developers. Eyes appreciate dark UI at night. |
| **6–8 components** | Covers 95% of meeting UX. No bloat. |
| **One density mode** | Desktop-first. Mobile scaling is 1:1 (responsive comes Phase 2). |
| **Brand blue #5B8DEF** | Your existing choice. Works well in dark mode. |
| **2 font weights only** | 400 (regular) and 500 (medium). Clean, fast rendering. |
| **4px spacing grid** | Fine-grain control. Works well at any scale. |
| **Semantic tokens** | AI agents can reason about "primary", "muted", etc. vs raw hex. |
| **CSS variables first** | Portable across frameworks. Language-agnostic. |

---

## 📋 Component Checklist

All 8 components are specified. When building/generating, ensure each has:

- [ ] **Button**: Primary, Secondary, Subtle variants
- [ ] **Timer Display**: Default, Warning, Expired states
- [ ] **Participant Card**: Default, Active, Hand Raised, Spoken states
- [ ] **Input Field**: Default, Focus, Disabled, Error states
- [ ] **Badge**: Hand Raise, Spoken, Active variants
- [ ] **Panel/Card**: Default, Hover states
- [ ] **Select Dropdown**: Closed, Open, Focus, Disabled states
- [ ] **Modal/Dialog**: Layout, close button, backdrop

All must include **focus states** with 2px `--color-focus-ring` outline.

---

## 🎨 Color Palette (One-Sheet)

```
SURFACES:   #0F172A (page) | #1E293B (card) | #334155 (hover) | #475569 (border)
TEXT:       #F8FAFC (primary) | #CBD5E1 (secondary) | #94A3B8 (muted)
BRAND:      #5B8DEF (default) → #4F46E5 (hover) → #3730A3 (active)
STATUS:     #22C55E (success) | #F59E0B (warning) | #EF4444 (error) | #3B82F6 (info)
```

All combinations meet WCAG AA 4.5:1 contrast minimum.

---

## 🚀 What's Next (Future Phases)

**Phase 2**: Light mode theme (same tokens, inverted palette)  
**Phase 3**: Responsive breakpoints (mobile optimization)  
**Phase 4**: Enhanced animations (non-critical for MVP)  
**Phase 5**: Accessibility audit (WCAG AAA stretch goal)

---

## ❓ FAQ

### Q: Can I use colors outside this palette?
**A**: No. Only values in section 1.2 of DESIGN_SYSTEM.md are allowed. This ensures AI consistency.

### Q: Do I have to use Tailwind?
**A**: No. CSS variables (section 12) are preferred for AI agents. Use Tailwind only if your build already depends on it.

### Q: Can I add more component variants?
**A**: Not for MVP. 8 components are tested and sufficient. Add variants in Phase 2+.

### Q: Why no light mode?
**A**: MVP scope. Dark mode is the primary internal tool theme. Light mode comes after validation.

### Q: Can I animate things more aggressively?
**A**: No. Timer warning pulse only. Transitions max 200ms. This keeps UI calm and responsive.

### Q: What about mobile?
**A**: Desktop-first for MVP. Components scale 1:1 on smaller screens (no responsive resize). Dedicated mobile optimization is Phase 3.

### Q: Where's the Figma file?
**A**: This IS the design system. No Figma. Token-based, AI-consumable, code-first.

---

## 📞 Questions?

If an AI agent is missing a token or spec:
1. Check [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) section 8 (components) or 12 (tokens)
2. Check [AI_COMPONENT_GENERATOR_GUIDE.md](AI_COMPONENT_GENERATOR_GUIDE.md) quick reference
3. **Do not invent tokens.** Use closest matching or escalate.

---

**Version**: TickTalk Design System v1.0 (MVP)  
**Date**: 2026-02-15  
**Status**: Ready for AI component generation
