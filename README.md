# Inspector Focus

Browser-based photography tools for https://inspectorfocus.com. Photograph processing stays local; originals remain unchanged.

Seven tools: EXIF Data with metadata removal, Photo Stats with camera/lens donuts and compact settings bars, Batch Rename, Print Size, Crop & Export with batch ZIP download, Contact Sheet PDFs with author credit and direct arrangement, and Photo Viewer. Contact Sheet and Photo Viewer share ordered selections. Photo Viewer creates a branded offline ZIP with manual or timed playback and light/dark mode; its separate-tab preview embeds the JPEGs. Photo Viewer and Batch Rename retain completion popups with direct ZIP downloads; other tools dismiss progress when finished. Viewer controls use aligned icons, and its photo-book preview uses the offline layout. Meet Inspector Focus opens the supplied robot comic.

## Development

Use Node 20 or newer. Run `npm start` to serve locally and `npm test` for checks. The server entrypoint is `app.mjs`; the browser EXIF controller is `exif-app.mjs`. Public files are at the repository root. No runtime dependencies or build step are required.

## Project notes

- [Project overview](docs/project-overview.md)
- [Tools and behavior](docs/tools-and-behavior.md)
- [Design and brand](docs/design-and-brand.md)
- [Development and deployment](docs/development-and-deployment.md)

See the notes for processing limits, metadata cleanup guarantees, file handoff behavior, and deployment checks.


## Photo Stats inspection report


After analyzing JPEGs, choose **Inspection report / PDF**. The collection-wide report offers an optional title and photographer credit, US Letter/A4, and a native PDF download. CSV remains available. Sample data cannot be exported.

The four-page summary covers collection/metadata totals, equipment, weighted median ISO and range, tied shooting-pattern leaders, exact repeated-filename counts, largest oriented image dimensions, uncropped 300-PPI print estimate, distinct reduced aspect ratios, recorded dates, and all nine statistics. Charts display up to eight categories; truncated or abbreviated categories receive complete, paginated exact-value appendix tables. Shooting times use the recorded camera clock; percentages exclude missing fields. Stopped analyses remain explicitly partial, including when more photos are appended later.

`stats-report.mjs` generates the model and PDF locally, with vector charts, searchable standard Helvetica/Helvetica-Bold text, a JPEG robot logo, page numbers and a linked footer. Titles and labels use safe hex encoding; unsupported WinAnsi characters are replaced with `?` and reported. Export includes no individual filenames, source photo bytes, GPS or serial numbers. Optional title/credit text is intentionally included. Repeated filenames are case-sensitive and do not imply duplicate image contents. Near-duplicates are not assessed. Print size is an estimate, not a quality guarantee.

Collection changes revoke old PDF URLs and prevent unfinished exports from downloading stale results. Real interactive browser/mobile PDF download QA remains pending. The production server allowlist includes the report module; the EXIF controller/server naming split is preserved.

PDF presentation refinement: compact white header with the original robot at its native proportions, INSPECTION REPORT, optional collection title, photographer/report date, and a thin red rule. Removed Inspection Complete/Completed Collection; only stopped collections receive a partial note. Every page repeats the footer “Inspection report by Inspector Focus.” and “Get yours at inspectorfocus.com”, linked to the public homepage, with page numbering at right. Logo raster preparation retains up to a 600px edge at quality 98 instead of the former padded 240px square.
