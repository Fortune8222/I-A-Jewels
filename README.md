# I&A Jewels catalogue

Static mobile-first catalogue. Customers browse, then enquire on WhatsApp. No cart, checkout or accounts.

## Run
`npm run build` creates `dist/` (no dependencies, Node 18+). Netlify uses `netlify.toml` (publish `dist`).

## Edit
- Business details: `src/data/config.js` (**siteUrl is a placeholder, replace before launch**, then rebuild).
- Products: `src/data/products.js`. Add photos under `src/assets/products/<folder>/01.jpg`, then add an entry (id, name, category, price, images, alt, description, optional variants).
- The build fails with a clear message on bad data (duplicate ids, unknown category, bad price, missing image or alt).

## Notes
- Rings, Moana sets, claw clips, scrunchies/flower clips and waist chains use one group photo each (cropped to trim empty cloth). Replace with individual product photos when available.
- Categories Hair and Waist Chains are additions to the spec's V1 list, as approved with the inventory.
