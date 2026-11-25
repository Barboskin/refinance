# re:finance website

Source of truth for https://barboskin.github.io/refinance/ is this repository, branch `main`.
GitHub Pages publishes the static files from the repository root.

## Pages

- `index.html`: application overview and download links.
- `investment-portfolio.html`: portfolio setup, data sources and return metrics.
- `bank-statement-import.html`: preparing, reviewing and importing bank statements.
- `dividend-calendar.html`: expected payments and forecast limitations.

The guides reuse `styles.css`, `guides.css`, the existing screenshots and store links.
Each page has a self-referencing canonical, unique title/description and ordinary HTML links.
Keep both `sitemap.xml` and `sitemap.txt` synchronized when adding or removing public pages.
Preserve the Google site verification HTML file. Host-level robots rules live in the
separate root website at https://barboskin.github.io/robots.txt.

## Preview and publish

Run `python3 -m http.server 8766` from this directory and open http://localhost:8766/.
Check links, page metadata, structured data and narrow-screen layout before publishing.
Changes to `main` trigger the configured GitHub Pages deployment. Verify the deployment
and live HTML after it completes. Application repository copies are not the deployment source.
