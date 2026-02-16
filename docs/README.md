# Tick-Talk — Documentation Guide

This folder contains **5 key files** that define the product, architecture, and design system for Tick-Talk.

---

## 📄 Files Overview

### 1. **PRD.md** (Product Requirements Document)
- **What**: Complete product specification and requirements
- **Who**: Product managers, stakeholders, developers, AI agents
- **Contains**:
  - Problem statement and goals
  - Target users and roles (Host, Participant)
  - Core features (Session Creation, Lobby, Meeting Room, Timer Logic, Hand Raise)
  - User flows (Host and Participant journeys)
  - Functional and non-functional requirements
  - Data model (Session, User)
  - Edge cases and risk mitigation
  - Success metrics
  - Future enhancements roadmap
- **Length**: ~400 lines
- **Use**: Start here to understand WHAT we're building and WHY.

---

### 2. **plan.md** (Implementation Plan)
- **What**: Technical architecture and implementation strategy
- **Who**: Developers, architects, AI agents
- **Contains**:
  - Architecture overview (Next.js + Firebase stack)
  - Complete data model with Firebase structure
  - Page structure (Home, Join, Meeting)
  - Core logic (Session creation, speaker selection, timer, transactions)
  - Firebase configuration and security rules
  - Component breakdown
  - Edge case handling
  - UX polish requirements
  - Deployment steps
- **Length**: ~500 lines
- **Use**: Read this to understand HOW we're building it.

---

### 3. **tasks.md** (Task Tracker)
- **What**: Implementation task list with progress tracking
- **Who**: Developers, project managers, AI agents
- **Contains**:
  - 21 numbered tasks (REQ-0001 through REQ-0021)
  - Status indicators (⬜ Not Started, 🟨 Requirements Created, ✅ Completed)
  - Task breakdown from Firebase setup through end-to-end testing
  - Notes section for implementation details
- **Length**: ~80 lines
- **Use**: Track progress and see what needs to be done next.

---

### 4. **DESIGN_SYSTEM.md** (Primary Design Reference)
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

### 5. **AI_COMPONENT_GENERATOR_GUIDE.md** (Quick Reference)
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

## 🎯 How to Use These Files

### For Product Understanding (Start Here)

1. **Read [PRD.md](PRD.md)** first to understand:
   - What problem we're solving
   - Who the users are
   - What features are required
   - Success criteria

2. **Read [plan.md](plan.md)** to understand:
   - Technical architecture decisions
   - Data model and Firebase structure
   - Implementation approach
   - Component architecture

3. **Check [tasks.md](tasks.md)** to see:
   - What's been completed (✅)
   - What's in progress (🟨)
   - What's next (⬜)

---

### For Component Development

1. **Start with [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)**
   - Read sections 1.1 (Colors), 1.2 (Spacing), 1.3 (Typography)
   - Review section 8 (Component Specs) for the exact component you're building
   - Check section 13 (Implementation Notes) — this is for AI agents

2. **Reference [AI_COMPONENT_GENERATOR_GUIDE.md](AI_COMPONENT_GENERATOR_GUIDE.md)**
   - Copy-paste the exact CSS/structure for your component
   - Use the "Token Quick Reference" for values
   - Cross-check states (Default, Hover, Active, Disabled, Focus)

3. **Implement Using CSS Variables**
   - Use **CSS variables** (section 12 of DESIGN_SYSTEM.md)
   - Or use Tailwind (see tailwind.config.ts in root)
   - OR hardcode the exact values (less ideal, but works)

---

### For Design Reviews

1. Read the **Design Philosophy** in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) intro
2. Check the **Meeting Page Layout** (section 9)
3. Review **State Documentation** (section 10) — critical!

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
**A**: No. CSS variables (section 12) are preferred for AI agents. Tailwind configuration exists in the root if needed.

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

If an AI agent is missing information:

**For Product/Requirements**: Check [PRD.md](PRD.md)  
**For Architecture/Implementation**: Check [plan.md](plan.md)  
**For Task Status**: Check [tasks.md](tasks.md)  
**For Design Tokens/Components**: Check [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) section 8 (components) or 12 (tokens)  
**For Quick Component Reference**: Check [AI_COMPONENT_GENERATOR_GUIDE.md](AI_COMPONENT_GENERATOR_GUIDE.md)  

**Do not invent tokens, features, or requirements.** Use existing specs or escalate.

---

## 📂 Recommended Reading Order

1. **PRD.md** → Understand the product
2. **plan.md** → Understand the architecture
3. **tasks.md** → See current progress
4. **DESIGN_SYSTEM.md** → Learn the design tokens
5. **AI_COMPONENT_GENERATOR_GUIDE.md** → Generate components

---

**Version**: Tick-Talk Documentation v1.0 (MVP)  
**Date**: 2026-02-15  
**Status**: Ready for implementation
