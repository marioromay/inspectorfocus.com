# Inspector Focus

Single JPEG EXIF inspection, batch Photo Stats, and Print Size, local processing, no uploads. Buildless HTML/CSS/JS. `/exif/`, `/photo-stats/`, and `/print-size/` are the tool URLs; the homepage currently opens EXIF Data.

Print Size previews six common print sizes with crop-aware PPI, portrait/landscape controls, centimeter/inch display, and movable crop position. JPEG/PNG/WebP up to 50 MB, using browser image decoding. No image export, upscaling, borders, or bleed. Pixel density guidance is qualified by viewing distance and image/print quality.

Scope: standard EXIF camera/lens/exposure, JPEG dimensions, file size, recorded capture time, EXIF GPS detection, copy summary without private fields. Photo Stats aggregates focal length, aperture, ISO, shutter ranges, camera/lens, orientation, recorded hour and year/month; each metric has an explicit known-value denominator and missing count. Aggregate CSV excludes filenames and GPS. Batches replace prior results, support stopping with partial results, and are limited to 2,000 files and 50 MB per file. No deduplication. No metadata modification, RAW, or editorial shooting-profile generation yet. XMP/IPTC/MakerNotes are not scanned; GPS status is explicitly limited to EXIF. Files and metadata are never persisted or sent over the network.

Run checks with `node --test tests/*.test.mjs`. Changes to parsing should preserve bounded offsets, original files, missing-value distinctions, and recorded time zones.


## Resize / Export

`/resize/` processes one JPEG, PNG or WebP locally, up to 50 MB / 60 MP. Long-edge sizing (100–6,000 px) retains aspect ratio and never upscales. JPEG quality is adjustable from 50 to 100. Defaults are 2,400 px and quality 85. Canvas output is limited to 24 MP, uses a white background, and does not copy original metadata or embedded profiles. The result preview and exact encoded size appear before downloading. Changes invalidate the previous output; Clear and replacement cancel stale work. Browser encoding and color conversion may vary; this is intended for everyday web copies. Batch, metadata retention and print-critical color handling are deferred.


## Production hosting

Serve the repository root in Hostinger PHP/HTML hosting using GitHub deployment into public_html. No build is needed. The included .htaccess sets JavaScript MIME for .mjs. Tool pages have their own directories. For optional Node hosting, npm start serves the same pages from app.mjs on PORT or 3000. Browser EXIF logic is exif-app.mjs.

The shared presentation uses Helvetica Neue / Helvetica / Arial, monochrome themes, red accents, the approved robot, numbered navigation and a privacy strip. The sun/moon button defaults to the system theme and stores only a visual preference locally.
