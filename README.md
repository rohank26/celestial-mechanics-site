# Celestial Mechanics

The website of Celestial Mechanics, a design studio making immersive, life-sized orreries for residences, institutions and businesses. Its first piece, [The Grand Orrery](https://thegrandorrery.art), has its own site and repository (`rohank26/grand-orrery-site`); the two share a design system.

Pages: Home, Residences, Institutions, Businesses, Add-ons, Studio, and Commission (an orrery builder with a live engraved drawing, plus an enquiry form that sends the sketch along). Unlisted for now (`noindex`).

## Stack

- **Site:** [Astro](https://astro.build) 7, built to static HTML, CSS and JS
- **CMS:** [Keystatic](https://keystatic.com) at `/keystatic`; edits are saved as commits to this repo
- **Hosting:** Cloudflare Workers (`celestial-mechanics-site`), auto-deployed from `main`
- **Fonts:** Cinzel (titles) and Crimson Pro Light (body, in `public/fonts`), self-hosted

## Guides

- [Setting up hosting and the CMS](docs/DEPLOY.md)
- [Editing content, the builder and the drawings](docs/EDITING.md)

## Commands

```sh
npm install
npm run dev       # local dev server, http://localhost:4321
npm run build     # production build into dist/
npm run preview   # production build in Cloudflare's local runtime
npx tsx tools/check/validate-content.mts   # check content files against the CMS schema
```
