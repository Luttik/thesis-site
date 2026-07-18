# thesis-site

Public site for Daan Luttik's MBA thesis, hosted at [thesis.daanluttik.nl](https://thesis.daanluttik.nl).

Built with Next.js (Pages Router) and MDX, using the same design system as [daanluttik.nl](https://daanluttik.nl).

## Content

| Path | Description |
|------|-------------|
| `content/thesis.mdx` | Full thesis (rendered on the homepage) |
| `content/references.bib` | Bibliography source (synced from thesis-shareable) |
| `content/media/` | Figures (also served from `public/media/`) |

Inline citations link to the matching reference entry; each reference entry links out to its DOI or URL.

To refresh citations after editing the `.bib`:

```powershell
python scripts/link_citations.py
```

## Local development

Requires Node.js 22+.

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```powershell
npm run build
npm start
```

## Deploy

Point a Vercel project at this repo (default Next.js settings) and attach the domain `thesis.daanluttik.nl`.
