# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: EcomPulse (Scantop)

E-commerce analytics dashboard for Brazilian sellers (Shopee / Mercado Livre). Fully client-side SPA — no build step, no server, no package.json. Open `ecompulse_dark.html` directly in a browser.

## Running the App

Open `ecompulse_dark.html` in any modern browser. No installation or server required. All persistence uses `localStorage`.

## Architecture

### Single-file SPA
All logic lives in `ecompulse_dark.html`:
- **HTML** (lines 1–94): layout structure (header, upload area, 7-tab dashboard, modals)
- **CSS** (inside `<style>`): dark/light theme via CSS variables; no external stylesheet
- **JavaScript** (~2000 lines, minified, inside `<script>`): all app logic

Legacy/intermediate versions are preserved in `__check_ecompulse.mjs` (v1) and `__syntax_check.mjs` (v2) for reference.

### External CDN Dependencies
- **Chart.js 4.4.1** — 4 charts (bar, horizontal bar, pie, priority scatter)
- **PapaParse 5.4.1** — CSV parsing
- **XLSX 0.18.5** — Excel (.xlsx/.xls) parsing

### Data Flow
```
User uploads CSV/XLSX
  → Column auto-detection (16 column types via fuzzy matching)
  → Column mapping modal (user confirms)
  → normalizeProduct() → typed product objects
  → Stored in localStorage + in-memory array
  → Analytics engine computes KPIs, rhythm, priority score
  → Chart.js + DOM rendering
```

### localStorage Keys (versioned)
- Accounts: `ecompulse_accounts_v5`, `ecompulse_active_account_v5`
- Report history: `ecompulse_net_eletrica_history_v3[_accountId]`
- Favorites: `ecompulse_favorites_v4[_accountId]`
- UI state: `ecompulse_theme`, `ecompulse_screen_v4`, `ecompulse_net_eletrica_tab_v3`
- Period: `ecompulse_revenue_period_v5` (values: 30, 15, 7)

### Product Object Shape
```js
{ name, id, price, old, rev, rev15, rev7, units, units15, units7,
  trend, rating, reviews, images, clip, clipSource, cat, catRaw }
```

## Key Business Logic

**Rhythm thresholds** (`RHYTHM_LIMIT = 15`):
- Crescente (up): `trend > +15`
- Estável (flat): `-15 ≤ trend ≤ +15`
- Queda (down): `trend < -15`

**Priority score formula:**
```
score = revenue * multiplier + clip_bonus + image_bonus
multiplier: 1.35 (down) | 0.75 (flat) | 0.45 (up)
clip_bonus:  max(rev * 0.25, 100)  if no clip detected
image_bonus: max(rev * 0.15, 60)   if images < 7
```

**Clip detection:** 30+ pattern rules. Numeric clip columns: value > 0 = has clip. String: "sim", "yes", "ativo", "com clip" = true; "nao", "no", "sem", "0" = false.

**Period fallback:** If 15d/7d columns are absent, estimates are `rev30 * (X/30)`.

**Category inference** (`cat()` function): classifies products into electrical, outlets, garden, energy, or other based on name keyword matching.

## Tabs & Screens
| Tab | Key function |
|-----|-------------|
| Overview | `drawCharts()` |
| Rhythm | `renderRitmo()` |
| Categories | `renderCategories()` |
| Ranking | `buildRanking()` |
| Todos | `renderTodos()` |
| Favorites | `renderFavorites()` |
| Comparison | `buildCompare()` |

## Cloud Migration Notes
Current state is localStorage-only. For cloud deployment the replacement targets are:
- **Accounts + Auth** → backend auth service
- **Report history** → database (one row per upload per account)
- **Favorites** → database (per user)
- **Product data** → server-side storage or object storage (S3-compatible)
- **Static hosting** → Vercel / Netlify / GitHub Pages (no server needed for the frontend itself)
