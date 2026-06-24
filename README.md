# Coolspots

Static heat-help dashboard for Brussels.

The site reads a local JSON file only:

- `coolspots-data.json`

No browser-side call is made to Overpass, OpenStreetMap, Bruxelles Open Data, or any other public data API. Data refresh happens before deploy through a local Node script.

## Refresh data

Run:

```bash
npm run update:data
```

This script:

- reads the existing `coolspots-data.json`
- fetches indoor cool refuges from OpenStreetMap via Overpass
- merges local Brussels cooling CSV data when available
- normalizes and deduplicates records
- enriches the dataset with `indoorCoolspots` and `coolingWaterPoints`
- updates totals and the `generated` timestamp
- falls back to cached/local indoor data if Overpass is unavailable

`npm run fetch:coolspots` is available as an alias.

## Data sources

- Existing local Treespots / Coolspots dataset in `coolspots-data.json`
- OpenStreetMap via Overpass API for indoor public refuges
- Local Brussels cooling CSV files:
  - `coolspots_brussels_complet.csv` when present
  - fallback: `coolspots_cooling_points.csv`

Indoor categories currently collected:

- libraries
- swimming pools
- sports centres
- malls
- museums
- community centres
- town halls
- stations
- public buildings when tagged in OSM

## Why no live API in the browser

The project is designed to stay static-friendly and Netlify-compatible:

- faster page loads
- fewer runtime failures
- predictable deploys
- one auditable local dataset

## Known limits

- Real indoor temperature is not available in reliable open data here.
- `cool_score` is a heuristic, not a measured temperature.
- `ac_likely`, `free_access`, and `open_now` can be inferred from incomplete OSM tags and should be treated as guidance.
- A future `user_reports` field is reserved for human verification.
