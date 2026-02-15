# TickTalk Design System v1
## MVP — Dark Mode First, AI Agent Consumable

**Purpose**: Automated UI component generation for consistent TickTalk interface. All values are deterministic and non-negotiable.

**Scope**: Internal dev teams. Desktop-first. Brand-aware.

**Core Axioms**:
1. Timer is the dominant visual element
2. State is always unambiguous (color + contrast)
3. Dark mode is primary (eyes-friendly for dev work)  
4. Minimal token set (no decorative variants for MVP)
5. AI-readable structure (tokens are deterministic)

---

# 1. COLOR SYSTEM

## 1.1 Semantic Tokens (Use These in Components)

All components must use these token names, not raw hex values.

```css
/* Surfaces */
--color-surface: #0F172A;           /* Page background, darkest */
--color-surface-elevated: #1E293B;  /* Cards, containers, panels */
--color-surface-subtle: #334155;    /* Hover states, overlay */
--color-border: #475569;            /* Dividers, input borders, outlines */

/* Text */
--color-text-primary: #F8FAFC;      /* Primary body text */
--color-text-secondary: #CBD5E1;    /* Secondary, description text */
--color-text-muted: #94A3B8;        /* Disabled, hints, captions */

/* Brand & Actions */
--color-brand: #5B8DEF;             /* Primary actions, brand accent */
--color-brand-hover: #4F46E5;       /* Brand on hover (darker) */
--color-brand-active: #3730A3;      /* Brand on press (darkest) */
--color-brand-subtle: #1E293B;      /* Brand background with border --color-brand */

/* Status States */
--color-success: #22C55E;           /* Completed, hand raised accepted */
--color-warning: #F59E0B;           /* Time warning (15s remaining) */
--color-error: #EF4444;             /* Time expired, errors */
--color-info: #3B82F6;              /* Informational messages */

/* Focus & Interaction */
--color-focus-ring: #5B8DEF;        /* Focus outline (same as brand) */
--color-focus-ring-offset: 0;       /* No offset for dark mode */
```

## 1.2 Color Palette Reference

For AI component generation, these are the base hues available:

| Category | Values | Notes |
| -------- | ------ | ----- |
| **Slate (Neutral)** | #0F172A, #1E293B, #334155, #475569, #64748B, #94A3B8, #CBD5E1, #F1F5F9, #F8FAFC | Use for surfaces, text, borders |
| **Brand Blue** | #5B8DEF (base), #4F46E5 (hover), #3730A3 (active) | Only primary action color |
| **Semantic** | Success: #22C55E, Warning: #F59E0B, Error: #EF4444, Info: #3B82F6 | Status-only, do not use for other purposes |

## 1.3 Color Usage Rules (Critical for Consistency)

- **No arbitrary colors** — only use tokens above
- **Status colors communicate state only** — never use for decorative emphasis
- **Brand color reserved for primary actions** — button, timer controls, active speaker indicator
- **Text contrast minimum 4.5:1** — all text must pass WCAG AA on --color-surface
- **Hover/focus states are darker** (not lighter, this is dark mode)

---

# 2. SPACING SYSTEM

One base unit: **4px**. All spacing is a multiple of 4.

| Token | Value | Context |
| ----- | ----- | ------- |
| **xs** | 4px | Icon gaps, micro spacing |
| **s** | 8px | Component padding, small gaps |
| **m** | 16px | Standard spacing between sections |
| **l** | 24px | Larger sections, major gaps |
| **xl** | 32px | Page margins, large container padding |
| **xxl** | 48px | Hero/timer area, maximum breathing room |

**Usage Rule**: Use adjacent tokens, never skip (e.g., `m` then `l`, not `m` then `xl`).

---

# 3. TYPOGRAPHY SYSTEM

**Font Stack**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**Weight Palette**: Regular (400) and Medium (500) only. No semibold, no bold.

### Type Scale

| Role | Size | Weight | Line Height | Use Case |
| ---- | ---- | ------ | ----------- | --------- |
| **Display** | 64px | 500 | 1.2 (76.8px) | Timer number ONLY |
| **Headline-Large** | 32px | 500 | 1.3 (41.6px) | Page title, major heading |
| **Headline-Medium** | 24px | 500 | 1.3 (31.2px) | Section title, speaker name |
| **Headline-Small** | 18px | 500 | 1.4 (25.2px) | Card title, subsection |
| **Body** | 14px | 400 | 1.5 (21px) | Paragraph text, descriptions |
| **Label** | 12px | 500 | 1.4 (16.8px) | Button text, badges, input labels |
| **Caption** | 11px | 400 | 1.4 (15.4px) | Hints, secondary info |

**Rules**:
- No font-size below 11px (unreadable on screen)
- Bold emphasis uses Medium weight + slightly larger size, not Bold weight
- All sizes must be exact pixel values (not relative `em`, not `rem`)

---

# 4. RADIUS SYSTEM

| Token | Value | Use |
| ----- | ----- | --- |
| **none** | 0px | Buttons, inputs, strictly angular |
| **sm** | 4px | Small components, badges, tags |
| **md** | 8px | Cards, containers, panels |
| **lg** | 12px | Large modals, major containers |

---

# 5. SHADOW SYSTEM

Keep shadows minimal. This is not a decorated UI.

| Token | Value | Use |
| ----- | ----- | --- |
| **sm** | `0 1px 2px 0 rgba(0,0,0,0.5)` | Subtle elevation, hover states |
| **md** | `0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)` | Panels, dropdowns, cards |
| **none** | `none` | Flat buttons, inputs, default state |

---

# 6. FOCUS & INTERACTION

## Focus Ring
- **Width**: 2px
- **Color**: `var(--color-focus-ring)` (#5B8DEF)
- **Offset**: 0px (no offset for dark mode)
- **Style**: `outline`

```css
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 0px;
}
```

## Transition Timing
- **Hover/focus**: 150ms ease-out
- **State change**: 200ms ease-out
- **No transition** on: size change, layout shift

---

# 7. DENSITY MODE

**Single mode: Regular (Desktop)**

- Padding: `m` to `l` (16–24px)
- Line height: 1.4–1.5
- Min touch target: 44px height
- No compact variant for MVP

---

# 8. COMPONENT SPECIFICATIONS

### 8.1 Button

**States**: Default, Hover, Active, Disabled, Focus

**Variants**: Primary (brand), Secondary (outline), Subtle (ghost)

#### Primary Button
```
Display: flex
Padding: s m (8px 16px)
Height: 40px (min touch target)
Background: var(--color-brand)
Text: var(--color-surface), Label weight
Radius: none
Hover: background var(--color-brand-hover)
Active: background var(--color-brand-active)
Disabled: opacity 50%, cursor not-allowed
Border: none
Focus: outline 2px solid var(--color-focus-ring), outline-offset 0
Transition: all 150ms ease-out
```

#### Secondary Button (Outline)
```
Display: flex
Padding: s m
Height: 40px
Background: transparent
Text: var(--color-text-primary), Label weight
Border: 1px solid var(--color-border)
Radius: none
Hover: background var(--color-surface-subtle)
Active: background var(--color-surface-subtle), border var(--color-text-primary)
Disabled: opacity 50%, cursor not-allowed
Focus: outline 2px solid var(--color-focus-ring), outline-offset 0
Transition: all 150ms ease-out
```

#### Subtle Button (Ghost)
```
Display: flex
Padding: s m
Height: 40px
Background: transparent
Text: var(--color-text-secondary), Label weight
Border: none
Hover: text var(--color-text-primary)
Active: text var(--color-brand)
Disabled: opacity 30%, cursor not-allowed
Focus: outline 2px solid var(--color-focus-ring), outline-offset 0
Transition: color 150ms ease-out
```

---

### 8.2 Timer Display

**State dependent**: Default, Warning (15s), Expired

#### Default State
```
Display: flex, column, center
Font-size: Display (64px)
Font-weight: 500
Color: var(--color-text-primary)
Line-height: 1.2
Margin-bottom: xxl (48px)
Letter-spacing: -0.02em (tight)
No animation
```

#### Warning State (15s remaining)
```
Color: var(--color-warning) (#F59E0B)
Pulse animation: opacity 0.6 → 1 → 0.6 over 1s, repeat 2x/sec
No size change, no shake
```

#### Expired State
```
Color: var(--color-error)
Text: "Time Expired" (replace numbers)
No animation
Button to dismiss appears below
```

---

### 8.3 Participant Card

**Structure**: Avatar + Name + Status Badge + Hand Raise Indicator

#### Base State
```
Display: flex, row, align-center
Padding: s m
Background: var(--color-surface-elevated)
Border: 1px solid var(--color-border)
Radius: md
Min-height: 56px
Margin-bottom: m
```

#### Active Speaker State
```
Border: 2px solid var(--color-brand)
Background: var(--color-surface-elevated)
Shadow: sm
Scale: 1 (no transform)
```

#### Hand Raised State
```
Border: 2px solid var(--color-warning)
Right badge: "Hand raise" in Label, orange indicator dot
```

#### Spoken State
```
Border: 1px solid var(--color-success)
Right badge: checkmark icon, small
```

---

### 8.4 Input Field

**States**: Default, Focus, Disabled, Error

```
Display: block
Padding: s m
Min-height: 40px
Font-size: Body (14px)
Background: var(--color-surface-elevated)
Color: var(--color-text-primary)
Border: 1px solid var(--color-border)
Radius: none
Placeholder: var(--color-text-muted)

Focus:
  Border: 1px solid var(--color-brand)
  Outline: 2px solid var(--color-focus-ring)
  Outline-offset: 0
  Shadow: sm

Disabled:
  Background: var(--color-surface-subtle)
  Color: var(--color-text-muted)
  Cursor: not-allowed
  Opacity: 50%

Error:
  Border: 1px solid var(--color-error)
  Support text below: var(--color-error), Caption weight
```

---

### 8.5 Badge (Status Indicator)

**Types**: Hand Raise, Spoken, Active, Neutral

#### Hand Raise Badge
```
Display: inline-flex
Padding: xs s (4px 8px)
Background: var(--color-warning)
Color: #000
Font-size: Label
Border-radius: sm
Icon: hand-raise (12px)
Margin-left: s
No animation (static)
```

#### Spoken Badge
```
Display: inline-flex
Padding: xs s
Background: transparent
Color: var(--color-success)
Border: 1px solid var(--color-success)
Font-size: Label
Border-radius: sm
Icon: checkmark (12px)
```

#### Active Badge
```
Display: inline-flex
Padding: xs s
Background: var(--color-brand-subtle)
Color: var(--color-brand)
Border: 1px solid var(--color-brand)
Font-size: Label
Border-radius: sm
Dot indicator: 6px, var(--color-brand), pulse @1s
```

---

### 8.6 Panel / Card Container

**Use**: Section grouping, settings, controls

```
Display: block
Padding: l
Background: var(--color-surface-elevated)
Border: 1px solid var(--color-border)
Radius: md
Margin-bottom: l
Shadow: none (default)

Hover (if interactive):
  Border: 1px solid var(--color-text-secondary)
  Shadow: sm
  Transition: all 150ms ease-out
```

---

### 8.7 Select Dropdown

**States**: Closed, Open, Disabled, Focus

```
Display: flex
Padding: s m
Min-height: 40px
Background: var(--color-surface-elevated)
Border: 1px solid var(--color-border)
Radius: none
Font-size: Body (14px)
Color: var(--color-text-primary)

Focus:
  Border: 1px solid var(--color-brand)
  Outline: 2px solid var(--color-focus-ring)

Open Menu:
  Position: absolute
  Background: var(--color-surface-elevated)
  Border: 1px solid var(--color-border)
  Radius: md
  Shadow: md
  Z-index: 1000
  Top: 100% + s margin

Menu Item (default):
  Padding: s m
  Color: var(--color-text-primary)
  Hover: background var(--color-surface-subtle)

Menu Item (selected):
  Background: var(--color-brand-subtle)
  Color: var(--color-brand)
  Checkmark icon: right-aligned
```

---

### 8.8 Dialog / Modal

**Types**: Confirm, Alert, Form Input

```
Position: fixed
Top: 50%
Left: 50%
Transform: translate(-50%, -50%)
Z-index: 2000
Width: 90vw
Max-width: 500px
Background: var(--color-surface-elevated)
Border: 1px solid var(--color-border)
Radius: md
Shadow: md
Padding: l

Close Button:
  Position: absolute
  Top: s
  Right: s
  Icon: X (20px)
  Transparent button, hover: opacity 80%

Overlay (backdrop):
  Position: fixed
  Inset: 0
  Background: rgba(0, 0, 0, 0.7)
  Z-index: 1999
  Click to close (optional)
```

---

# 9. MEETING PAGE LAYOUT

Reference structure for meeting timer view (desktop, 1440px width).

```
┌─────────────────────────────────────────────────┐
│              HEADER (Logo, Settings)            │  xxl padding
├─────────────────────────────────────────────────┤
│                                                 │
│                  HERO SECTION                   │  xxl padding
│                Timer Display (64px)             │
│                "MM:SS" in brand color           │
│           [Start] [Pause] [Reset] buttons      │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  PARTICIPANT LIST          │   SIDEBAR          │  l padding sides
│  • [Avatar] Speaker Name   │   [Settings Card]  │
│    Hand Raise / Spoken     │   [Queue Info]     │
│  • [Avatar] Next Speaker   │                    │
│  • [Avatar] Queue...       │                    │
│                            │                    │
└─────────────────────────────────────────────────┘

Left Column (Participants): 60% width
Right Sidebar (Controls): 40% width
Gap: m (16px)

Participant Cards in left column stacked m apart
Active speaker card: border --color-brand, elevated
```

---

# 10. STATE DOCUMENTATION

## Meeting States

### Lobby (Pre-start)
- Timer shows: "00:00" in --color-text-primary
- Buttons: [Start Meeting]
- Participants list: grayed, inactive
- No animations
- Feel: Calm, ready

### Active (Speaking)
- Timer: Counting down in --color-text-primary
- Active speaker card: Elevated, brand border
- Buttons: [Pause] [Next Speaker]
- Hand raises visible with warning color
- Feel: Focused, clear hierarchy

### Time Warning (≤15s)
- Timer color: --color-warning (#F59E0B)
- Timer pulsing (opacity). No shake.
- Audio cue optional: quiet chime once at 15s
- Background: No color change
- Feel: Alerted, not panicked

### Time Expired
- Timer color: --color-error
- Timer text: "Time Expired"
- Active speaker card: error border
- Button: [Next Speaker] highlighted
- Feel: Neutral, factual (not aggressive)

### Paused
- Timer: Frozen, --color-text-muted (grayed)
- Button: [Resume]
- Participants: Normal state
- Feel: On hold

### Finished
- Timer: "Complete" or meeting summary
- Buttons: [New Meeting] [Export]
- Participants: Spoken count displayed
- Feel: Relaxed, retrospective

---

# 11. ACCESSIBILITY & DARK MODE

### Contrast Ratios (WCAG AA minimum 4.5:1)

| Text + Background | Ratio | Pass? |
| -------- | ----- | ----- |
| #F8FAFC + #0F172A | ~20:1 | ✓ |
| #CBD5E1 + #0F172A | ~9:1 | ✓ |
| #94A3B8 + #0F172A | ~5:1 | ✓ |
| #5B8DEF + #0F172A | ~5:1 | ✓ |
| #F59E0B + #0F172A | ~8:1 | ✓ |
| #EF4444 + #0F172A | ~7:1 | ✓ |

All combinations meet or exceed WCAG AA.

### Dark Mode Rules

- **No pure white text** — use --color-text-primary (#F8FAFC)
- **No pure black background** — use --color-surface (#0F172A)
- **Blue light filter friendly** — avoid pure blue on pure black late night
- **Border visibility** — borders must be visible at --color-border, not --color-text-muted
- **Icons** — outlined icons only (not solid fills), 20–24px min size

---

# 12. CSS VARIABLE SETUP

Copy this into your global CSS (`globals.css` or root stylesheet):

```css
:root {
  /* Surfaces */
  --color-surface: #0F172A;
  --color-surface-elevated: #1E293B;
  --color-surface-subtle: #334155;
  --color-border: #475569;

  /* Text */
  --color-text-primary: #F8FAFC;
  --color-text-secondary: #CBD5E1;
  --color-text-muted: #94A3B8;

  /* Brand & Status */
  --color-brand: #5B8DEF;
  --color-brand-hover: #4F46E5;
  --color-brand-active: #3730A3;
  --color-brand-subtle: #1E293B;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Focus */
  --color-focus-ring: #5B8DEF;

  /* Spacing (in px, use with calc for rem conversion) */
  --spacing-xs: 4px;
  --spacing-s: 8px;
  --spacing-m: 16px;
  --spacing-l: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  /* Radius */
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3);

  /* Typography */
  --font-family-base: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-display: 64px;
  --font-size-headline-l: 32px;
  --font-size-headline-m: 24px;
  --font-size-headline-s: 18px;
  --font-size-body: 14px;
  --font-size-label: 12px;
  --font-size-caption: 11px;

  --line-height-tight: 1.2;
  --line-height-body: 1.5;
  --line-height-label: 1.4;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
}
```

---

# 13. IMPLEMENTATION NOTES FOR AI AGENTS

1. **Token-first approach**: Always reference `--color-*`, `--spacing-*`, do not hardcode values
2. **Component variants**: Each component has explicit states (default, hover, active, disabled, focus) — implement all or none
3. **No custom colors**: Only values in section 1.2 are available
4. **Spacing rule**: Adjacent tokens only (s→m→l, never s→l, never s→s→s)
5. **Typography is exact**: Use pixel values, not `em` or `rem`, for consistency
6. **Dark mode only**: No light mode variant for MVP. All tokens assume dark background.
7. **Desktop priority**: Components designed for 1440px+ viewports. Mobile scaling is 1:1 (no responsive resize for MVP).
8. **Focus states mandatory**: Every interactive element must have 2px focus ring
9. **No animations except**: Timer warning pulse, hover transitions (150ms), focus transitions (200ms)
10. **Accessibility assumed**: All color combinations meet WCAG AA. Use semantic HTML for screen readers.

---

# 14. TAILWIND CONFIGURATION (Reference)

If using Tailwind, extend config like this:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0F172A',
          elevated: '#1E293B',
          subtle: '#334155',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          muted: '#94A3B8',
        },
        brand: {
          DEFAULT: '#5B8DEF',
          hover: '#4F46E5',
          active: '#3730A3',
          subtle: '#1E293B',
        },
      },
      spacing: {
        xs: '4px',
        s: '8px',
        m: '16px',
        l: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
    },
  },
};
```

**However**: For AI agent consumption, prefer CSS variables over Tailwind classes. This is more portable and language-agnostic.

---

**Version**: 1.0 (MVP)  
**Last updated**: 2026-02-15  
**Next**: Light mode (Phase 2), responsive breakpoints (Phase 3)
