# WR Counter — Wild Rift Lane Counter Guide (PWA)

A fast, offline-capable mobile-first PWA. Pick your champion, the enemy champion and
your role → get a single-screen **counter card**: item build with reasoning, rune swaps,
summoner spells, power-spike timeline, ability trading windows, wave-management notes —
plus **base stats** and an **enemy-items adapter** that re-optimizes your build against
what your lane opponent is actually buying. Static hosting only (no backend), free on
Vercel/Netlify/GitHub Pages.

## Features

- **Full Wild Rift roster** — all **142 champions** (patch **7.3**, Oct 2026; latest:
  Hwei, Smolder, Mel, Norra, K'Sante, Skarner, Taliyah, Yunara, Cho'Gath) with real
  base stats (HP/mana/AD/armor/MR + per-level growth, regen, move speed, attack range,
  melee/ranged), official ability names + summaries and full ability windows.
- **50 curated pro matchups** (25 pairs × both directions) with item reasoning,
  rune swaps, matchup-specific power spikes and ability windows — deep-linkable.
- **Counter engine fallback**: every one of the ~20k possible matchup combinations gets
  an auto-generated card (build path, rune swaps, timing windows, wave notes) derived
  from the champion data.
- **Enemy Items → "Counter their build"**: tap the items your lane opponent is buying;
  a rules adapter suggests counter-build answers (armor → penetration, MR → void,
  healing → Grievous Wounds, crit → Randuin's, HP stacking → BotRK/Liandry's, attack
  speed → Frozen Heart…). Selection persists per matchup.
- **Counter Pick section** on every card (4 alternatives for the player's champion in
  that role + lane matchup notes).
- **Real icons** — champion, item, summoner-spell and **ability** PNGs synced from the
  community asset mirror (`TheePepS/League_Of_Legends_Assets`), with a complete
  **fallback glyph system** (champion = colored circle, item/ability = rounded square,
  rune = diamond, spell = hexagon) whenever an icon is missing (e.g. Wild Rift-exclusive
  items, Norra's kit). Ability windows show the matching ability icon, and a kit
  quick-reference section lists both champions' five abilities with official tooltips.
- **Offline-first PWA** — service worker + web manifest, recent matchups and favorites
  in localStorage, `prefers-reduced-motion` support.
- **SEO**: static prerender of every curated matchup page with unique title/description
  plus generated **"A vs B" OG images** built from the fallback icon system, sitemap.xml.
- **Privacy-friendly analytics**: anonymous event counters only (no cookies, no user
  identifiers, no IPs, no device fingerprints).
- **i18n-ready**: every UI string lives in `data/strings/en.json`; adding a language is
  just another JSON file + `registerLocale()`.
- **No API calls at runtime** — all data is static JSON bundled at build time.

## Tech stack

Vite · React 18 · TypeScript · Tailwind CSS · React Router · vite-plugin-pwa (Workbox) ·
tiny custom SVG-to-PNG node script (`scripts/draw.mjs`) · static prerender script
(`scripts/prerender.mjs`) · champion data pipeline (`scripts/build-champions.mjs`,
`scripts/sync-icons.mjs`).

## Getting started

```bash
npm install
npm run dev        # local dev server (port 5173)
npm run build      # typecheck + build + prerender → dist/
npm run preview    # serve the production build
```

### Refreshing champion data (patches)

```bash
node scripts/fetch-champion-sources.mjs   # pulls data/sources/ (gitignored snapshot)
node scripts/build-champions.mjs          # regenerates data/champions.json (142)
```

The snapshot comes from [TimLindeijer/wildrift-stats](https://github.com/TimLindeijer/wildrift-stats)
(community mirror of the official WR site + China-server data): `champions.json`
(roster/lanes/roles), `base-stats.json` (official patch-7.3 stats), `abilities.json`
(official ability names + tooltips). Classification overlays (damage type, CC/healing,
melee/ranged, ranges, default rune pages) live in `scripts/build-champions.mjs`.

### Syncing champion/item/spell/ability icons

```bash
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/TheePepS/League_Of_Legends_Assets /tmp/wr-assets
(cd /tmp/wr-assets && git sparse-checkout set \
  Champions_assets Items_assets Summoners_Spells_Assets Champions_Spells_Assets)
node scripts/sync-icons.mjs --from /tmp/wr-assets
```

Matching is normalization-based (`Miss_Fortune.png` → `missfortune` ↔ `miss-fortune`;
`Ahri_Charm.png` → `ahricharm` ↔ "Ahri"+"Charm"). Wild Rift ability renames map to the
PC asset names via `ABILITY_ALIASES` in the script (e.g. Vi R "Cease and Desist" →
`Vi_Assault_and_Battery.png`, Teemo E "Guerilla Warfare" → `Teemo_Guerrilla_Warfare.png`).
Unmatched icons keep the fallback glyph. Current sync: **141/142 champions, 61/71 items,
7/7 spells, 705/710 abilities** (the missing ones are Wild Rift-exclusive: Norra and her
kit, plus WR-only items).

## Project structure

```
data/            champions.json (142, generated), items.json (71), runes.json, spells.json,
                 matchups.json (50 curated), strings/en.json
src/lib/         types, constants, strings, storage, analytics, dataLoader,
                 counterEngine (matchup gen), buildAdapter (enemy-items → counters)
src/components/  ChampionSelector, CounterCard, ChampionStatsStrip, EnemyBuildPanel,
                 ItemBuildSection, RuneSwapSection, PowerSpikeTimeline, AbilityWindowCard,
                 CounterPickSection, FeedbackRow, ShareButton, GameIcon, …
src/pages/       HomePage (select), CounterPage (/counter/{player}-vs-{enemy}-{role}), NotFoundPage
scripts/         build-champions.mjs, fetch-champion-sources.mjs, sync-icons.mjs,
                 generate-assets.mjs, draw.mjs, prerender.mjs
public/icons/    champions/, items/, runes/, spells/, app icons
```

## Data model notes (Wild Rift accuracy)

All data is Wild Rift-specific. Points of interest:

- **Base stats** come from the official patch-**7.3** dataset (China server, version
  `7.3`): HP/mana/AD/armor/MR/HP-regen/mana-regen + per-level growth and move speed are
  official values. **Attack range + melee/ranged** are hand-maintained (defaults: 175
  melee / 550 ranged with per-champion overrides) — verify after big class reworks.
  **Attack speed is omitted** — no authoritative public dataset carries it; we prefer
  honest gaps over invented numbers.
- **Abilities**: official WR names + tooltip summaries and cooldown arrays from the same
  dataset (e.g. Ahri's E is **Charm**, Vi's R is **Cease and Desist** — the WR rename).
  Cooldown arrays use WR's rank system: **4 ranks** for Q/W/E, **3 ranks** for ult.
- **Ability ranks & levels**: ultimates unlock at **level 5** (WR's level cap is 15),
  not level 6 as on PC. Power-spike timelines respect this.
- **Runes**: the current WR rune system (Keystone + Primary path ×3 slots + Secondary
  path ×1 slot). IDs like `conqueror`, `electrocute`, `brutal`, `legend-tenacity`,
  `second-wind`, `sweet-tooth`.
- **Items** (71): WR-exclusive items included (`Infinity Orb`, `Awakened Soulstealer`,
  `Harmonic Echo`, `Protector's Vow`, `Crystalline Reflector`, `Oceanid's Trident`,
  `Amaranth's Twinguard`, `Dawnshroud`, boot enchants like `Stasis Enchant` — WR's
  answer to PC's Zhonya's Hourglass, which does **not** exist in Wild Rift and is not
  in this dataset). Costs/stat blocks are approximate for 7.3 — update
  `data/items.json` on balance patches.
- **Champion classifications** (damage type, hard-CC/healing flags, default rune pages
  and spells by archetype) are hand-maintained overlays in `scripts/build-champions.mjs`
  — flagged for review when champions get mini-reworks.
- `patchVersion` fields (and `PATCH_VERSION` in `src/lib/constants.ts`) say **7.3** —
  bump them together when data is refreshed.

### Asset sourcing note

Champion, item, summoner-spell and ability icons are PC-LoL art synced from
[`TheePepS/League_Of_Legends_Assets`](https://github.com/TheePepS/League_Of_Legends_Assets)
(user-specified source). They match Wild Rift for every champion/item/ability that
exists in both; Wild Rift-exclusive entries use the `<GameIcon>` fallback glyphs. Riot's
fan policy permits non-commercial use of game assets with attribution (see footer).
Icons can be re-pointed with `VITE_ICON_URL` if you host them on a CDN.

## Icon fallback system

`<GameIcon>` renders a shape with the champion/item's first letter when the image fails
to load: champion → colored circle (champion accent color), item/ability → gray rounded
square, rune → diamond, spell → hexagon. The same system generates the OG share images.

## Deep linking & static hosting

- URLs: `/counter/{player}-vs-{enemy}-{role}` (e.g.
  `/counter/miss-fortune-vs-lee-sin-bot`). Champion ids may contain hyphens; the role is
  after the **last** hyphen.
- `npm run build` prerenders 100 pages (top-50 shared + top-50 trending) with unique
  meta tags + OG images, `sitemap.xml` and `404.html`.
- Hosts must SPA-fallback to `index.html`. For GitHub Pages project sites set
  `VITE_BASE=/wr-counter/`; for 404 handling copy `dist/index.html` to `dist/404.html`
  (already done by the prerender script).
- Service worker precaches the app shell + data; game icons are cached at runtime
  (cache-first) to keep the install payload small (~630 KB).

## SEO

Per-page `<title>`/description, Open Graph tags and a generated **"A vs B" OG PNG**
(gradient card with champion A and B names). `sitemap.xml` lists all prerendered
matchups. Auto-generated (non-curated) matchups set `noindex`.

## Analytics (privacy-friendly)

`track()` in `src/lib/analytics.ts` stores anonymous event counters in localStorage and
logs to console (ready to be swapped for Plausible/Umami). No cookies, no user
identifiers, no IPs, no device fingerprints.

## Performance

- Data is typed JSON modules — zero runtime fetches.
- Route-level code splitting is not required; the whole bundle is ~160 KB gzipped
  including the full 142-champion dataset, and everything works offline after first
  visit (PWA). Install payload ~630 KB precache + icons cached on demand.

## Current scope / roadmap

**Shipped**: full 142-champion roster + base stats · 50 curated matchups · enemy-items
counter-build adapter · counter pick recommendations · real champion/item icons ·
feedback system · onboarding · OG images · sitemap.

**Possible next steps**: attack-speed column if an authoritative source appears ·
more curated matchups · per-champion build pages · minimap images · additional
languages via `registerLocale()` · matchup-specific enemy item presets.
