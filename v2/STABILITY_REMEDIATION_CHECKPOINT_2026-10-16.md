# FRAME ATLAS 2.0 stability remediation checkpoint

Date: 2026-10-16 (Korea Standard Time)

## User-approved direction
- Prioritize removing obsolete public entry points/files where safe.
- Stabilize the existing 2.0 app; do not rebuild from scratch without evidence.
- Preserve the current ~200-location catalog and its metadata.
- For newly added/replaced photos, prefer storing the image file in this GitHub repository and refer to it by a repository-relative path.
- Keep legacy external image references where they still work; migrate gradually after checking actual place match and reuse rights.
- Work in small, durable steps so an interrupted chat does not restart the audit.

## Confirmed repository observations
- Public repository: casio8000/FRAME_ATLAS; main app is served under v2/.
- Root index.html redirects to v2 and also used to show a public link to legacy-v5.44.html.
- legacy-v5.44.html is still present (about 730 KB). It must not be deleted until all links/references and any unique data are checked.
- v2/manifest.webmanifest had start_url fa_build=20261016-72 while v2/index.html and v2/sw.js use build 20261016-88.
- v2/data/places.json is about 1.05 MB; the GitHub file fetch wrapper did not return its content, although GitHub Contents metadata confirms it exists. Treat large-file read/update limits as a design risk; do not blindly rewrite this file via an API that cannot return full content.
- v2/data/art_locations_curated_20261016.json is about 276 KB and contains supplemental location records.
- v2/assets/app.js supports a base catalog, supplemental catalog, local draft, imageCandidates, primaryImageId/referenceImageId, pending local photo files in IndexedDB, and GitHub publishing. Data merge and photo publication paths require more inspection before redesign.
- .github/workflows/quality-check.yml checks JS syntax, browser smoke test, location data, app resources/version/photo import, backup merge and per-device sync tests, and legacy audit summary.

## Changes made in this checkpoint
1. Root index.html: removed the visible public link to legacy-v5.44.html. The root redirect remains directed to v2.
   Commit: d810cf49be8ec1bc2754052be9bc634f207d0f0e
2. Fixed v2/manifest.webmanifest start_url version mismatch, then aligned all current v2 shell references to build 20261016-89.
   Latest shell commits: index f9f7b1f37598d4e658a12b193bfcbedf5545729c; service worker 9587bdee8e59204c49ca69825eb2b1a211347b42; manifest 4b0a517d0b37c47b1a379d7b8795161afe07282f; root redirect ed824c9179184895e6dfaafc672efcc80239475a.
3. Fixed large-catalog publishing read path in v2/assets/app.js: the Contents API metadata is still used for its SHA, but JSON content is read from raw.githubusercontent.com because the catalog is over 1 MiB and Contents responses may omit its base64 content.
   Commit: 2fab8c3f56bb6a907c161a264dd5b59cf2df42dd
4. Added durable audit checkpoint file. Commit: 915d6927a48084b0fd2ef67e08b36f99dacf8dee
5. A GitHub Actions quality-check run was queued and is being monitored. Do not call the changes validated until the run completes and actual public pages are checked.

## Additional important finding
- The current automated workflow's tools/check_app.py explicitly requires legacy-v5.44.html and inspects its scripts, sync code, manifest and cache version. This means deleting that file immediately would break the repository's quality checks and remove the current test target. Before removing the file, migrate or replace those checks so they validate the supported v2 app, then delete legacy assets in a controlled commit.
- v2/assets/app.js publishes the large places.json using GitHub's Contents API. The API's content payload may be omitted for files above 1 MiB; the read path has now been changed to fetch raw JSON separately while retaining the Contents SHA for safe update. This needs to pass Actions and be verified in the browser before considered complete.

## Next steps
1. Verify the new cleanup commit's Actions quality run and Pages deployment. Previous v2 browser smoke testing passed on the pre-cleanup commit; repeat it after the deletion.
2. Continue auditing root `sw.js`, `manifest.json`, `data/places.js`, old sync/backup modules and icons. Do not delete these as a batch: first identify root-PWA offline behavior and any useful recovery functions.
3. Preserve the 214-location validated legacy dataset and the current v2 base/supplemental JSON; compare IDs with a full-data retrieval path before any catalog modification.
4. Confirm the photo flow end-to-end in the actual app when available: select local file (JPEG/PNG/WebP/AVIF, up to 8 MB) -> IndexedDB staging -> GitHub `v2/assets/places/<placeId>/<candidateId>.<ext>` upload -> catalog `assetPath`/relative `imageUrl` update -> public reload on PC and iPhone. Code paths and CI markers have been inspected, but a real write using the user's GitHub token has not been performed.
5. Improve photo publishing recovery if real use reveals orphaned uploads, size/memory problems or stale catalog conflicts. Keep previous external URLs working and migrate only when the exact place/photo match has been confirmed.
6. Keep build ID `20261016-89` synchronized among `v2/index.html`, `v2/sw.js`, and `v2/manifest.webmanifest` until the next coherent build bump.
7. Report verified automated test results separately from PC/iPhone live-use checks. Never treat source inspection as proof of an actual photo upload or device synchronization.
