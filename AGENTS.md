# Phopod project instructions

Mario requires an SEO review on every deployment. Update SEO when page names, routes, tools, supported formats, behavior or public copy changes. Do not rewrite accurate metadata merely to change it, fabricate reviews, or claim indexing/rankings are guaranteed.

Before deploying, review scripts/update-seo.py against the implemented features, generate metadata, and run the SEO checks plus relevant application tests. New public pages need accurate titles/descriptions, a production canonical URL, social metadata, truthful structured data and sitemap inclusion. Retired/alias pages need canonical/noindex handling without breaking same-tab photo handoffs. Review the sitemap and robots.txt after route changes. Keep private previews out of indexing.

Publish changes to the private preview first unless Mario explicitly authorizes immediate production deployment. “Deploy” authorizes production release. Preserve the separate production Node server and EXIF browser controller, update the public asset allowlist/MIME mappings, and verify actual live files after pushing production main.

The public domain is https://inspectorfocus.com. The production repository is marioromay/inspectorfocus.com. The creator credit links to https://marioromay.com in a new tab. Preserve the approved robot/comic and existing tool behavior.
