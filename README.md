# thesis-site

Foundation for [thesis.daanluttik.nl](https://thesis.daanluttik.nl) — the public site for Daan Luttik's MBA thesis.

## Content

| Path | Description |
|------|-------------|
| `content/Thesis - Daan Luttik - MBA.docx` | Source Word thesis |
| `content/thesis.md` | Markdown export (via pandoc) |
| `downloads/` | PDF and DOCX for download |
| `index.html` | Landing page |

## Local preview

Serve the repo root with any static file server, for example:

```powershell
npx --yes serve .
```

Then open the printed local URL.

## Deploy

Point a Vercel (or similar) project at this repo with static output from the repository root, and attach the domain `thesis.daanluttik.nl`.
