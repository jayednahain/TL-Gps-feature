# GPS Live Tracking — Developer Guide

A single-page developer guide for the GPS live-tracking feature (`TlReactOwner`).
Static site: no build step, no dependencies.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All guide content and section markup |
| `style.css` | Styling and layout |
| `script.js` | Sidebar navigation, section filtering, interactions |

## Run locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Hosting (GitHub Pages)

The site is deployed by `.github/workflows/pages.yml` on every push to `main`.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Live URL: https://jayednahain.github.io/TL-Gps-feature/
