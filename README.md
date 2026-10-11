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
