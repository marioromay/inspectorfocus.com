# Inspector Focus

Single JPEG EXIF inspection, batch Photo Stats, and Print Size, local processing, no uploads. Buildless HTML/CSS/JS. `/exif/`, `/photo-stats/`, and `/print-size/` are the tool URLs; the homepage currently opens EXIF Data.

Print Size previews six common print sizes with crop-aware PPI, portrait/landscape controls, centimeter/inch display, and movable crop position. JPEG/PNG/WebP up to 50 MB, using browser image decoding. No image export, upscaling, borders, or bleed. Pixel density guidance is qualified by viewing distance and image/print quality.

Scope: standard EXIF camera/lens/exposure, JPEG dimensions, file size, recorded capture time, EXIF GPS detection, copy summary without private fields. Photo Stats aggregates focal length, aperture, ISO, shutter ranges, camera/lens, orientation, recorded hour and year/month; each metric has an explicit known-value denominator and missing count. Aggregate CSV excludes filenames and GPS. Batches replace prior results, support stopping with partial results, and are limited to 2,000 files and 50 MB per file. No deduplication. No metadata modification, RAW, or editorial shooting-profile generation yet. XMP/IPTC/MakerNotes are not scanned; GPS status is explicitly limited to EXIF. Files and metadata are never persisted or sent over the network.

Run checks with `node --test tests/*.test.mjs`. Changes to parsing should preserve bounded offsets, original files, missing-value distinctions, and recorded time zones.


## Resize / Export

`/resize/` processes one JPEG, PNG or WebP locally, up to 50 MB / 60 MP. Long-edge sizing (100–6,000 px) retains aspect ratio and never upscales. JPEG quality is adjustable from 50 to 100. Defaults are 2,400 px and quality 85. Canvas output is limited to 24 MP, uses a white background, and does not copy original metadata or embedded profiles. The result preview and exact encoded size appear before downloading. Changes invalidate the previous output; Clear and replacement cancel stale work. Browser encoding and color conversion may vary; this is intended for everyday web copies. Batch, metadata retention and print-critical color handling are deferred.

## Contact Sheet

`/contact-sheet/` creates contact-sheet PDFs locally from up to 300 JPEG, PNG or WebP photographs (50 MB / 60 MP per file). Letter/A4, portrait/landscape, 2–6 columns, optional filename labels, filename or added order, multi-page preview and download. Complete photographs retain their aspect ratio. Reduced JPEG thumbnails (960 px maximum edge) are retained as local blob URLs; full-size decoded sources are released after processing. PDFs contain raster page artwork at 144 pixels per inch, including labels (not searchable text), and do not copy source EXIF/GPS. Originals stay unchanged. Clear cancels pending work and releases thumbnails/downloads.

Validation: contact-engine layout and PDF byte-offset tests; mocked browser batch/invalid-file/download invalidation and Clear cancellation tests; sample PDF inspected and rendered with Poppler. Interactive browser QA was unavailable in this environment.

## Connected single-image tools and homepage

The homepage is a compact five-tool directory. EXIF, Print Size and Resize carry the original file across same-tab tool navigation using an explicit IndexedDB handoff and a sessionStorage ticket. The destination consumes and deletes the record; records expire logically after two minutes and abandoned expired records are removed on the next workspace/home visit. No source files are retained during ordinary inspection. EXIF handoff accepts JPEG only. Clear removes the active file. Crop previews and output settings do not transfer. When browser storage is unavailable, navigation reports the failure and leaves the current image intact. The mobile header retains horizontal scrolling; medium layouts use a separate navigation row. The wordmark is plain monochrome; red is reserved for interface accents.
