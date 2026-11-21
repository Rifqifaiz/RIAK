# CLAUDE.md — RIAK web prototype

Read `docs/SPEC.md` in full before writing code. It is the single source of truth (Bahasa Indonesia).

## Non-negotiables
- Static SPA: Vite + React + TypeScript + Tailwind, Recharts, react-leaflet, Zustand, Vitest. No backend, no login, no personal data, no third-party analytics.
- All model logic lives in `src/engine/` as pure, tested TypeScript functions (SPEC §8).
- `engine/backtest2021.ts` must reproduce `scripts/backtest_2021.py`; tests for SPEC §9.3 and §9.4 must pass (dates ±1 day).
- Never invent data. Empty capacity/stock/population fields render `<DataMissing/>`. Illustrative data lives only in `public/data/demo_*.json`, labelled ILUSTRASI.
- Every model number is rendered with `<Angka status="BERSUMBER|KALIBRASI|ASUMSI|ILUSTRASI|FIKTIF" sumber="…"/>`.
- Forbidden copy (SPEC §11): "pertama di dunia", "satu-satunya", "AI memprediksi pandemi", lives-saved claims, fixed density multipliers. Add a test that greps `src/` for these.
- Brand: blue `#1E3A8A`, pink `#BE185D`, gradient 135°. Status colours (Aman/Siaga/Terlewat) are separate tokens; never use brand pink as a status colour.
- UI copy in Bahasa Indonesia; dates `21 Jun 2021`; numbers `1.014`, `0,26`.

## Commands
- `npm run dev` · `npm run test` · `npm run build`
- Data prep (Python): `python scripts/prepare_data.py <inacovid>/data/csv public/data`; WHO feed: `python scripts/fetch_who_don.py public/data/who_don.json`

## Working order
Follow SPEC §14. After each step: run tests, run the app, check the page against SPEC §6, then commit.
