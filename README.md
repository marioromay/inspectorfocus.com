# Inspector Focus

Local-first photography utilities: EXIF Data (`/exif/`) Photo Stats (`/photo-stats/`) and Print Size (`/print-size/`). Photographs and extracted metadata never leave the browser. No accounts, dependencies, or build step are required for the tools.

## Hosting

For Hostinger's Node.js deployment, use framework **Other**, root `./`, entry file `app.mjs`, no build command, and no output directory. The `npm start` command starts a dependency-free static file server on `PORT` or port 3000. Image and metadata processing remain in the visitor's browser. Browser EXIF code is in `exif-app.mjs`, separate from the server entrypoint. HTTPS enables the clipboard feature.

The same HTML and asset files can also be served by conventional static hosting. Preserve the directory structure so `/exif/` and `/photo-stats/` resolve to their `index.html` files; serve `.mjs` as JavaScript. The included `.htaccess` handles Apache MIME settings. The Node server exposes only site pages and assets, and rejects uploads.

## Tests

Run `npm test` with Node.js 20 or newer. Tests cover EXIF parsing, missing-value denominators, dates, CSV escaping, batch errors and stopping.

## Current limits

EXIF and Photo Stats accept JPEG, up to 50 MB per file. Print Size accepts JPEG, PNG and WebP up to 50 MB, previews common print crops and calculates PPI after cropping. Density guidance does not guarantee print quality; no resizing or export is performed. Photo Stats supports up to 2,000 files and replaces the previous collection. It reads standard EXIF, not XMP/IPTC or manufacturer MakerNotes. Missing fields stay missing. Percentages exclude missing values; times use recorded camera time. Photo Stats counts files individually, without deduplication. CSV contains aggregates only, without filenames or GPS. No RAW support, metadata editing/removal, or photo storage.

The included PNG is the approved Inspector Focus character.

