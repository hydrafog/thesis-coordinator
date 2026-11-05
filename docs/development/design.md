# Design system

The design system establishes a centralized, accessible, high-contrast visual architecture ported directly from the verified prototype application (`.prototype/`). It provides modular CSS tokens, layout grids, and strictly typed React UI primitives for all application roles.

## Architecture

Styles are organized into four modular layers under `src/styles/` aggregated by a single entrypoint [`src/styles/globals.css`](../../src/styles/globals.css) and imported at the application root in [`src/app/layout.tsx`](../../src/app/layout.tsx).

```text
src/styles/
├── tokens/          # Primitives, scale, motion, theme variables
│   ├── palette.css  # Ink, paper, night, tone, and accent colors
│   ├── scale.css    # Typography scale, 4px grid spacing, radii, borders
│   ├── motion.css   # Atlassian durations, easings, component curves
│   └── theme.css    # Semantic theme variables for light and dark modes
├── base/            # Element defaults
│   ├── reset.css    # Modern CSS box-sizing and margins reset
│   └── elements.css # HTML elements, typography defaults, focus rings
├── layout/          # Structural containers
│   ├── shell.css    # Sidebar, topbar, view container, account block
│   └── grid.css     # Responsive columns, stacks, split headers
└── components/      # Modular component styling
    ├── controls.css # Buttons, inputs, selects, toggles
    ├── surfaces.css # Panels, cards, wells, callouts, modals
    ├── data.css     # Tables, metrics, progress bars, meters
    ├── feedback.css # Status badges, banners, toasts, empty states
    ├── people.css   # Avatars, person cards, author chips
    ├── chat.css     # Chat feed, bubbles, message composer
    └── dialog.css   # Modal dialogs, scrim backdrops, animations
```

Shared UI component primitives reside in [`src/core/ui/`](../../src/core/ui/) and export typed React components without importing domain or feature code, preserving inward architectural boundaries.

## Design tokens

### Palette and color roles

Color tokens separate color primitives from semantic application roles.

- **Ink**: Deep navy values used for text, borders, and primary branding (`--ink-900: #162456`, `--ink-800: #273872`, `--ink-600: #4d5e94`).
- **Paper**: High-brightness canvas and surface backgrounds (`--paper-000: #ffffff`, `--paper-050: #f7f8fa`, `--paper-100: #eef1f5`, `--paper-200: #e2e6ed`).
- **Night**: Dark-mode canvas, surface, and muted tones (`--night-000: #0e1014` through `--night-900: #e2e8f4`).
- **Semantic tones**: State feedback colors across badges, alerts, and metrics:
  - `success`: `#059458` (approved, complete, ok)
  - `warning`: `#d97706` (changes requested, needs work)
  - `danger`: `#be2111` (rejected, overdue)
  - `info`: `#273872` (submitted, active)
  - `neutral`: `#4d5e94` (draft, pending)
- **Accents**: Brand and emphasis accents (`vermilion: #df3422`, `pink: #ea2b7b`, `teal: #08969f`, `amber: #d97706`, `violet: #763fe6`). Default active accent is vermilion.

### Typography

Typography uses **Source Sans 3** loaded via `next/font/google` in `src/app/layout.tsx` to eliminate layout shift and avoid runtime external font dependencies.

| Role | Font size | Line height | Weight |
|---|---|---|---|
| Display | `2.5rem` (`40px`) | `1.15` | Bold (700) |
| Title | `1.75rem` (`28px`) | `1.2` | Semibold (600) |
| Heading | `1.25rem` (`20px`) | `1.3` | Semibold (600) |
| Body | `1.0rem` (`16px`) | `1.5` | Regular (400) |
| Description | `0.9375rem` (`15px`) | `1.45` | Regular (400) |
| Caption | `0.8125rem` (`13px`) | `1.4` | Medium (500) |

### Spacing and geometry

- **Base grid**: 4px grid system using tokens `--space-1` (`0.25rem`) through `--space-12` (`3rem`).
- **Radii**: `--radius-sm` (`6px`), `--radius-md` (`8px`), `--radius-lg` (`12px`), `--radius-pill` (`999px`).
- **Borders**: Thin crisp borders (`--border-width: 1px`, `--border-width-strong: 2px`) in favor of heavy drop shadows (`--shadow-overlay: none`).

### Motion

Motion curves are derived from the Atlassian Design System:
- **Button hover**: 100ms with gentle deceleration (`cubic-bezier(0.4, 1, 0.6, 1)`).
- **Modal enter**: 250ms with paired scale and repositioning (`cubic-bezier(0.4, 0, 0, 1)`).
- **Modal exit**: 200ms accelerating away (`cubic-bezier(0.6, 0, 0.8, 0.6)`).
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` caps transitions to 50ms simple opacity crossfades.

## Theming

Theming is controlled via data attributes on the root `<html>` element:
- `data-theme-mode="light"` (default) or `data-theme-mode="dark"`
- `data-accent="vermilion"` (default), `pink`, `teal`, `amber`, or `violet`

Components consume semantic CSS custom properties (`--color-canvas`, `--color-surface`, `--color-text`, `--color-line`, `--color-control`) rather than raw hex literals, allowing theme switching without component class changes.

## UI component primitives

All reusable components are located in [`src/core/ui/`](../../src/core/ui/) and exported via [`src/core/ui/index.ts`](../../src/core/ui/index.ts):

| Component | Source file | Key props & capabilities |
|---|---|---|
| `Button` | `src/core/ui/button.tsx` | Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), `iconOnly`, `action`, ref forwarding |
| `StatusBadge` | `src/core/ui/status-badge.tsx` | Semantic status keys (`submitted`, `approved`, etc.), tone mapping, `Badge` alias |
| `Dialog` | `src/core/ui/dialog.tsx` | Accessible native `<dialog>`, `open`, `onClose`, Escape key dismissal, backdrop dismissal, `DialogActions` |
| `Table` | `src/core/ui/table.tsx` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` (with `numeric` alignment) |
| `Icon` | `src/core/ui/icon.tsx` | `name`, `small`, referencing the centralized SVG sprite mounted by `IconSprite` |
| `Metric` | `src/core/ui/metric.tsx` | `label`, `value`, `unit`, optional inline progress meter |
| `EmptyState` | `src/core/ui/empty-state.tsx` | Accessible empty placeholder with `title`, `text`, optional action button |
| `Panel` | `src/core/ui/panel.tsx` | Collapsible section container with header toggle |
| `Person` | `src/core/ui/person.tsx` | User display with computed initials avatar, full name, and subtitle role |
| `DateChip` | `src/core/ui/date-chip.tsx` | Compact academic date block with day number and short month |
| `CapacityBar` | `src/core/ui/progress.tsx` | Linear quota progress bar with percentage fill |
| `PlacesMeter` | `src/core/ui/progress.tsx` | Segmented pip meter for discrete student supervisor quotas |

## Accessibility standards

1. **Skip link**: A hidden skip link (`.skip-link`) allows keyboard users to jump directly to `#main`.
2. **Keyboard focus**: High-visibility focus rings (`:focus-visible`) use `--accent-focus` with clear outline offsets.
3. **Screen readers**: Icon-only buttons render `<span class="sr-only">` fallback text.
4. **Semantics**: Native dialogs, status regions (`role="status"`), and progress bars (`role="progressbar"`) carry valid ARIA attributes.

