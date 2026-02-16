# 1. Design System Philosophy

The product must feel:

* Structured
* Calm
* Fair
* Transparent
* Low friction
* Non-distracting

This is not a marketing product.
It’s a *ritual tool* used repeatedly in meetings.

So your system principles should be:
1. **Clarity over decoration**
2. **Timer is the hero**
3. **State is always obvious**
4. **Color communicates status only**
5. **No visual noise**

This is where minimalism becomes functional.

Since this is internal and you want a soft brand accent:
* Base: Neutral, light, breathable
* Accent: One controlled brand color
* Status colors: Derived from semantic roles, not arbitrary

The interface should feel:
* Quiet when nothing is happening
* Visually active only when someone is speaking
* Slightly tense when time is about to expire

---

# 2. Token Architecture for Tick-Talk

We’ll keep this lean because it’s MVP.

---

## 🔹 Reference Tokens (Raw Values)

Define full scale once.

### Color Reference

| Token                   | Value   |
| ----------------------- | ------- |
| ref.palette.neutral.100 | #FFFFFF |
| ref.palette.neutral.98  | #FAFAFA |
| ref.palette.neutral.90  | #E5E7EB |
| ref.palette.neutral.50  | #6B7280 |
| ref.palette.neutral.10  | #111827 |

Soft brand accent (example – replace with your brand later):

| Token                | Value   |
| -------------------- | ------- |
| ref.palette.brand.40 | #5B8DEF |
| ref.palette.brand.90 | #E8F0FF |

Status:

| Token                  | Value   |
| ---------------------- | ------- |
| ref.palette.warning.40 | #F59E0B |
| ref.palette.error.40   | #EF4444 |
| ref.palette.success.40 | #22C55E |

---

## 🔹 System Tokens (Semantic Roles)

This is what your components use.

### Surface

| Role              | System Token                | Reference   |
| ----------------- | --------------------------- | ----------- |
| App Background    | sys.color.surface           | neutral.100 |
| Secondary Surface | sys.color.surface.container | neutral.98  |
| Border            | sys.color.outline           | neutral.90  |

### Text

| Role           | Token                        |
| -------------- | ---------------------------- |
| Primary text   | sys.color.on-surface         |
| Secondary text | sys.color.on-surface.variant |

### Brand

| Role           | Token                |
| -------------- | -------------------- |
| Primary action | sys.color.primary    |
| On primary     | sys.color.on-primary |

### Timer States (critical)

| Role          | Token                   |
| ------------- | ----------------------- |
| Timer default | sys.color.timer.default |
| Timer warning | sys.color.timer.warning |
| Timer expired | sys.color.timer.expired |

Timer warning maps to warning palette.
Timer expired maps to error palette.

This gives emotional clarity without chaos.

---

# 3. Spatial System (This Will Make It Feel Premium)

Minimal tools fail when spacing is inconsistent.

Use 8px base grid.

| Role | Token |
| ---- | ----- |
| xs   | 4px   |
| s    | 8px   |
| m    | 16px  |
| l    | 24px  |
| xl   | 32px  |
| xxl  | 48px  |

Timer area should use xl–xxl spacing.
Participant list uses s–m.

Large rhythm difference = clear hierarchy.

---

# 4. Typography System

This product is typography-driven.

Hierarchy suggestion:

| Role            | Size    | Weight  |
| --------------- | ------- | ------- |
| Display (Timer) | 48–64px | Medium  |
| Speaker Name    | 24–28px | Medium  |
| Section Label   | 14px    | Medium  |
| Body            | 14–16px | Regular |

Avoid too many weights.
Two weights are enough for MVP.

The timer must dominate the page.

---

# 5. Component Strategy

Keep It Lean, you only need core components:
* Button (primary / subtle)
* Timer Display
* Participant Row
* Badge (hand raise / spoken / active)
* Card/Panel
* Input Field
* Select
* Modal (maybe optional for MVP)

Don’t build a full UI library.
Build exactly what the product needs.

---

# 6. Interaction Hierarchy

The UI has 3 states:

1. Lobby → Calm
2. Active → Focused
3. Finished → Relaxed

Active state should:

* Elevate active speaker visually
* Increase contrast slightly
* Emphasize timer
* Dim non-relevant elements slightly

Not through opacity tricks — through hierarchy and spacing.

---

# 7. Specific Design Decisions for Tick-Talk

### 🎤 Active Speaker Highlight

Instead of bright background:

Use:

* Slight surface elevation (container tone change)
* Accent border
* Larger typography
* Subtle shadow (very light)

Do NOT:

* Use full accent background
* Flash colors
* Animate aggressively

### ⏳ Timer

The timer is your product.

It should:

* Be center-aligned
* Be large
* Change color at 15s and 5s
* Not shake or flash

When expired:

* Text changes to “Time Expired”
* Accent changes to error color
* No auto movement

Calm authority > urgency panic.

### ✋ Hand Raise

Keep it subtle:

* Small badge
* Accent outline
* No big color blocks

This is a signal, not a spotlight.

---

# 8. Tailwind Strategy (Important)

Because you’re using Tailwind Don’t hardcode colors in classes. Instead:
* Define CSS variables for system tokens
* Map Tailwind config to those variables
* Use semantic class naming in components

This makes your system scalable later. Example:

Instead of:
```
bg-blue-500
```

Use:
```
bg-primary
```

Which maps to:
```
--sys-color-primary
```
