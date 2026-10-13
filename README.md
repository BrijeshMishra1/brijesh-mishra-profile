# Dr. Brijesh Mishra — profile site

A modern, single-page academic profile and resume. React 18, Vite, TypeScript.
It is a new project; the legacy page (`BrijeshMishra1/Dr._Brijesh_mishra`) is untouched and is only read as the data source.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # data and filter logic
npm run build      # type-check + production build into dist/
```

## Publish

The site is served from the `gh-pages` branch: https://brijeshmishra1.github.io/brijesh-mishra-profile/

```bash
git push origin main   # source
scripts/deploy.sh      # build and publish to gh-pages
```

## Where the content lives

| File | What it holds |
|---|---|
| `src/data/profile.ts` | Identity, bio, career, education, projects, editorial roles, conferences, frequency bands, Scholar metrics |
| `src/data/legacy.json` | Publications, patents, books, reviewer list, memberships, tools (generated) |
| `scripts/extract_profile.py` | Regenerates `legacy.json` from the legacy page: `python3 -I scripts/extract_profile.py <path to legacy index.html>` |
| `public/brijesh.jpg`, `public/brijesh.webp` | Portrait, and the same portrait with the backdrop removed |

To update publications, edit the legacy page (or `legacy.json`) and re-run the extractor. `npm test` checks the counts (35 SCI, 7 Scopus, 4 peer-reviewed, 10 chapters, 12 conference, 10 patents, 5 books).

## Design notes

- Palette sampled from the portrait's own backdrop; amber is the only accent.
- Signature element: a log-frequency ruler (0.5 GHz – 10 THz). Each band is a control that searches the papers.
- Light and dark themes, follows the system and can be switched; choice is remembered if storage is available.
- Keyboard focus rings, skip link, 44 px touch targets, reduced-motion respected, text contrast ≥ 4.5:1.
- "Save as PDF" prints a clean resume (navigation hidden, every paper listed).
- Personal details on the legacy page (date of birth, father's name, mobile number, permanent address) are deliberately not carried over.

## Keeping publications current

`scripts/sync_scholar.py` reads the Google Scholar profile, adds papers that are not on the site yet
(enriched from Crossref when a verified match exists) and refreshes the citation metrics in
`src/data/scholar-sync.json`. `python3 scripts/sync_scholar.py --dry-run` shows what would change.

`scripts/sync_and_publish.sh` does the whole job (sync, test, commit, push, publish). Run
`scripts/install_schedule.sh` once to run it every Monday 09:00 on this Mac via launchd.

Google Scholar blocks GitHub-hosted runners, so `.github/workflows/sync-scholar.yml` normally finds
nothing and exits cleanly; it is kept in case Scholar access changes.
