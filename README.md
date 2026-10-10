# Inspector Focus

Browser-based photography tools for https://inspectorfocus.com. Photograph processing stays local; originals remain unchanged.

Tools: EXIF Data with metadata removal, Photo Stats, Print Size, Crop / Export with batch ZIP download, and branded Contact Sheet PDFs. Meet Inspector Focus opens the supplied robot comic.

## Development

Use Node 20 or newer. Run `npm start` to serve locally and `npm test` for checks. The server entrypoint is `app.mjs`; the browser EXIF controller is `exif-app.mjs`. Public files are at the repository root. No runtime dependencies or build step are required.

## Project notes

- [Project overview](docs/project-overview.md)
- [Tools and behavior](docs/tools-and-behavior.md)
- [Design and brand](docs/design-and-brand.md)
- [Development and deployment](docs/development-and-deployment.md)

See the notes for processing limits, metadata cleanup guarantees, file handoff behavior, and deployment checks.
