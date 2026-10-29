# FRAME ATLAS 3.0 v13.22 — master backup provenance

Date: 2026-10-29

IMPORTANT: The complete v13.22 ZIP previously shown in the conversation was not recoverable from the current persistent file library at the time of this repair. This current v13.22 package was reconstructed from the recovered v13.12 application/runtime ZIP, v13.20 place/editorial data ZIP, and v13.22 audit ZIP; it is not claimed to be a byte-identical edit of the missing prior v13.22 ZIP. The app release label intentionally remains v13.22, as requested.

Regression fixes and embedded-browser results:
- Removed the startup invocation that inserted the full-screen #introScreen overlay above the application; the overlay had intercepted navigation clicks.
- Fixed the detail-screen MutationObserver so it only writes the photo-candidate title when the text actually differs, avoiding repeated DOM mutations.
- Aligned Recent Added with Archive Latest by one shared rank comparator and stable name tie-break. Browser DOM test confirms all 252 new/added places have exactly the same order as the corresponding subset of Archive Latest (252/252).
- Runtime photo candidate connections: 421/421. 418 locations are eligible for automatic cover display; three locations (Factory2, Giheung Lake Park, Misa Hangang Park) remain `photoHold` until the photo/precise shooting section can be confirmed. Candidate connection is not a claim that every remote image loads on every device or has reuse permission.
- Core event test passed in embedded Chromium DOM: Home/Map/Favorites/More navigation; opening a place detail; expanded place-use/photo-candidate sections; return-to-list button; Manual modal; zero page errors. External image/network requests were intentionally blocked for this isolated test.
- 18 external JavaScript files and 2 inline scripts passed syntax checks; 26 JSON files parsed; 421 unique place IDs and zero duplicate normalized names; all three ZIP archives passed integrity checks.

Data verification remains incomplete for addresses: 17 public-source-verified, 95 approximate/entrance review needed, and 309 address strings not yet source-cross-checked. Although runtime resolves photo candidates for every location through inline data, shared image library, and PHOTO_COVER_OVERRIDES, 110 canonical records do not have an inline cover/candidate field; this is not the same as zero runtime candidate connection.

Not verified: physical PC/iPhone rendering, external image HTTP loading, full image rights clearance, and Cloudflare/GitHub deployment. The separate browser environment used for direct file/local-host navigation returned ERR_BLOCKED_BY_ADMINISTRATOR before page rendering; that is not evidence that the user's own Chrome is blocked.

Recovered source archives are included under `_MASTER_BACKUP/RECOVERED_INPUTS/`, with build, validation and runtime-test scripts under `_MASTER_BACKUP/BUILD_AND_VALIDATION_TOOLS/`.
