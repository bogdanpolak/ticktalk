# TickTalk Design System — AI Component Generator Guide

This is a **quick lookup** for AI agents building components. Use this as your source of truth.

---

## 🎯 Core Rules (Non-negotiable)

1. **Never invent tokens** — only use values from section 1 of [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
2. **Every interactive element must have focus state** — 2px outline, `--color-focus-ring`
3. **No animations except**: Timer warning pulse, hover (150ms), focus (200ms)
4. **Min touch target**: 44px height for buttons/inputs
5. **Dark mode only** — assume --color-surface as background
6. **Spacing rule**: No arbitrary values. Use xs/s/m/l/xl/xxl only.
7. **Font family**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` always

---

## 📊 Token Quick Reference

### Colors (Copy-Paste Ready)

```
Surfaces:         #0F172A (bg) | #1E293B (card) | #334155 (hover) | #475569 (border)
Text:             #F8FAFC (primary) | #CBD5E1 (secondary) | #94A3B8 (muted)
Brand:            #5B8DEF | hover: #4F46E5 | active: #3730A3
Status:           #22C55E (success) | #F59E0B (warning) | #EF4444 (error) | #3B82F6 (info)
```

### Spacing (px)

```
xs: 4px  |  s: 8px  |  m: 16px  |  l: 24px  |  xl: 32px  |  xxl: 48px
```

### Typography

```
Display:  64px 500
Headline: 32px 500 (L) | 24px 500 (M) | 18px 500 (S)  
Body:     14px 400
Label:    12px 500
Caption:  11px 400
```

### Radius

```
none: 0px  |  sm: 4px  |  md: 8px  |  lg: 12px
```

---

## 🧩 Component Blueprint Template

Use this structure for every new component:

```yaml
Component: [Name]
States: [List all, e.g., default, hover, active, disabled, focus]
Visual Spec:
  Layout: flex | grid | block
  Padding: [spacing token]
  Background: [color token]
  Border: [width color radius]
  Min Height: [pixel]
  Font: [size weight line-height]
  Color: [text color token]
Hover:
  [property]: [value]
Active:
  [property]: [value]
Disabled:
  [property]: [value]
  cursor: not-allowed
Focus:
  outline: 2px solid --color-focus-ring
  outline-offset: 0
Transition: [property] [duration] ease-out
```

---

## 🔘 Button Variants (Copy-Paste Structure)

### Primary Button
```css
padding: var(--spacing-s) var(--spacing-m);  /* 8px 16px */
height: 40px;
background: var(--color-brand);
color: #FFFFFF;
font-size: 12px;
font-weight: 500;
border: none;
border-radius: var(--radius-none);
cursor: pointer;
transition: all 150ms ease-out;

:hover {
  background: var(--color-brand-hover);
}

:active {
  background: var(--color-brand-active);
}

:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 0px;
}
```

### Secondary Button (Outline)
```css
padding: var(--spacing-s) var(--spacing-m);
height: 40px;
background: transparent;
color: var(--color-text-primary);
border: 1px solid var(--color-border);
font-size: 12px;
font-weight: 500;
border-radius: var(--radius-none);
cursor: pointer;
transition: all 150ms ease-out;

:hover {
  background: var(--color-surface-subtle);
}

:active {
  background: var(--color-surface-subtle);
  border-color: var(--color-text-primary);
}

:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 0px;
}
```

### Subtle Button (Ghost)
```css
padding: var(--spacing-s) var(--spacing-m);
height: 40px;
background: transparent;
color: var(--color-text-secondary);
border: none;
font-size: 12px;
font-weight: 500;
cursor: pointer;
transition: color 150ms ease-out;

:hover {
  color: var(--color-text-primary);
}

:active {
  color: var(--color-brand);
}

:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 0px;
}
```

---

## ⏱️ Timer Display States

### Default (Active, Counting)
```css
font-size: 64px;
font-weight: 500;
line-height: 1.2;
color: var(--color-text-primary);
margin-bottom: var(--spacing-xxl);
letter-spacing: -0.02em;
/* MM:SS format */
```

### Warning (≤15s remaining)
```css
/* Everything above, plus: */
color: var(--color-warning);
animation: pulse 0.5s ease-in-out infinite;

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

### Expired
```css
color: var(--color-error);
text-content: "Time Expired";
animation: none;
```

---

## 👤 Participant Card States

### Default
```css
display: flex;
align-items: center;
gap: var(--spacing-s);
padding: var(--spacing-s) var(--spacing-m);
background: var(--color-surface-elevated);
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
min-height: 56px;
margin-bottom: var(--spacing-m);
```

### Active Speaker
```css
/* Above + */
border: 2px solid var(--color-brand);
box-shadow: var(--shadow-sm);
```

### Hand Raised
```css
/* Above + */
border: 2px solid var(--color-warning);
/* Add badge: "Hand Raise" text with orange indicator dot */
```

### Spoken (Completed Turn)
```css
/* Above + */
border: 1px solid var(--color-success);
/* Add checkmark badge */
```

---

## 📝 Input Field

```css
display: block;
padding: var(--spacing-s) var(--spacing-m);
min-height: 40px;
font-size: 14px;
background: var(--color-surface-elevated);
color: var(--color-text-primary);
border: 1px solid var(--color-border);
border-radius: var(--radius-none);
transition: all 150ms ease-out;
font-family: var(--font-family-base);

::placeholder {
  color: var(--color-text-muted);
}

:focus {
  border-color: var(--color-brand);
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 0px;
  box-shadow: var(--shadow-sm);
}

:disabled {
  background: var(--color-surface-subtle);
  color: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.5;
}
```

---

## 🏷️ Badge (Status Indicators)

### Hand Raise (Warning)
```css
display: inline-flex;
align-items: center;
gap: var(--spacing-xs);
padding: var(--spacing-xs) var(--spacing-s);
background: var(--color-warning);
color: #000000;
font-size: 12px;
font-weight: 500;
border-radius: var(--radius-sm);
```

### Spoken (Success)
```css
display: inline-flex;
align-items: center;
gap: var(--spacing-xs);
padding: var(--spacing-xs) var(--spacing-s);
background: transparent;
color: var(--color-success);
border: 1px solid var(--color-success);
font-size: 12px;
font-weight: 500;
border-radius: var(--radius-sm);
```

### Active (Brand)
```css
display: inline-flex;
align-items: center;
gap: var(--spacing-xs);
padding: var(--spacing-xs) var(--spacing-s);
background: var(--color-brand-subtle);
color: var(--color-brand);
border: 1px solid var(--color-brand);
font-size: 12px;
font-weight: 500;
border-radius: var(--radius-sm);
```

---

## 🎨 Panel / Card Container

```css
display: block;
padding: var(--spacing-l);
background: var(--color-surface-elevated);
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
margin-bottom: var(--spacing-l);
transition: all 150ms ease-out;

:hover {
  border-color: var(--color-text-secondary);
  box-shadow: var(--shadow-sm);
}
```

---

## 📋 Select Dropdown

### Closed State
```css
display: flex;
align-items: center;
justify-content: space-between;
padding: var(--spacing-s) var(--spacing-m);
min-height: 40px;
background: var(--color-surface-elevated);
border: 1px solid var(--color-border);
border-radius: var(--radius-none);
font-size: 14px;
color: var(--color-text-primary);
cursor: pointer;
transition: all 150ms ease-out;
```

### Open Menu
```css
position: absolute;
top: 100%;
left: 0;
right: 0;
margin-top: var(--spacing-s);
background: var(--color-surface-elevated);
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
box-shadow: var(--shadow-md);
z-index: 1000;
```

### Menu Item (Default)
```css
padding: var(--spacing-s) var(--spacing-m);
color: var(--color-text-primary);
cursor: pointer;
transition: background 150ms ease-out;

:hover {
  background: var(--color-surface-subtle);
}
```

### Menu Item (Selected)
```css
/* Above + */
background: var(--color-brand-subtle);
color: var(--color-brand);
/* Display checkmark on right */
```

---

## 🪟 Modal / Dialog

```css
position: fixed;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
z-index: 2000;
width: 90vw;
max-width: 500px;
padding: var(--spacing-l);
background: var(--color-surface-elevated);
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
box-shadow: var(--shadow-md);
```

### Close Button (X)
```css
position: absolute;
top: var(--spacing-s);
right: var(--spacing-s);
width: 32px;
height: 32px;
display: flex;
align-items: center;
justify-content: center;
background: transparent;
border: none;
cursor: pointer;
opacity: 0.8;
transition: opacity 150ms ease-out;

:hover {
  opacity: 1;
}

:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 0px;
}
```

### Backdrop (Overlay)
```css
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.7);
z-index: 1999;
```

---

## 🎪 Meeting Page Layout (Desktop 1440px)

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: Logo + Settings                           xxl   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                  HERO / TIMER SECTION              xxl   │
│           Timer in Display size (64px)                   │
│     [Start] [Pause] [Reset] Primary buttons            │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  LEFT (60% width)        │  RIGHT (40% width)   gap: m  │
│  ─────────────────────── │  ─────────────────────      │
│  PARTICIPANTS            │  CONTROLS SIDEBAR            │
│  • [Avatar] Speaker      │  [Settings Card]             │
│    Hand Raise / Spoken   │  [Queue Status]              │
│  • [Avatar] Next (m gap) │  [Time Summary]              │
│  • [Avatar] Queue...     │                              │
│    (cards stacked m)     │                              │
│                          │                              │
│  Scrollable if >6        │  Fixed/sticky if scroll     │
│                                                          │
└──────────────────────────────────────────────────────────┘

Margins: xl (32px) on sides
Gap between columns: m (16px)
Participant cards: m gap between each
Max container width: 1440px, center on larger screens
```

---

## 🔄 State Transitions

### Lobby → Active
- Buttons change from [Start] to [Pause] [Next]
- Participant cards go from neutral to active highlighting
- Timer changes from #000 to brand color if counting

### Active → Time Warning (≤15s)
- Timer color: primary → warning
- Timer animation: Static → pulse (0.5s cycle)
- No sound for MVP

### Time Warning → Time Expired
- Timer text changes to "Time Expired"
- Timer color: warning → error
- No auto advance (manual [Next] button)

### Paused State
- Timer color: primary → muted
- Buttons: [Resume] visible
- Participant cards: No highlighting

---

## ⚡ Performance Notes for AI Agents

- **No shadows by default** — only on hover/focus (lighter DOM)
- **No backdrop blur** — use solid colors only
- **No gradient fills** — solid colors only
- **Transitions**: 150ms or 200ms never longer (feels responsive)
- **No parallax or transforms** — keep layout stable
- **Focus ring should not trigger reflow** — use outline (not box-shadow)

---

## 🔐 Accessibility Checklist

- [ ] All text meets 4.5:1 contrast on dark background
- [ ] All interactive elements 44px+ touch target
- [ ] Focus ring visible (2px, --color-focus-ring)
- [ ] Icon size ≥ 20px for legibility
- [ ] No color-only communication (use text + icon)
- [ ] Semantic HTML (button, input, select, etc.)
- [ ] Alt text on all images
- [ ] ARIA labels where needed (dialog, modal, toast)

---

**For component generation**: Start with this reference, cross-check against [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) section 8 for full specs.

If token is missing, **do not invent it**. Escalate or use closest matching token.
