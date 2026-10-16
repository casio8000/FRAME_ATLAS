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

## Additional important findings
- The quality checker is now migrated to the supported V2 shell; `legacy-v5.44.html` was removed from main only after the replacement checks passed. The original file's blob SHA `ec2ffb4e88c379751076a9e0a7b49ed84db72f41` is preserved as the backup branch's root `index.html`.
- The V2 browser smoke test and quality run `38879973279` passed; Pages deployment `38879973573` also passed. The smoke test reported 200 places on both desktop and mobile, zero uncaught JavaScript errors, and correct 2.0 navigation/detail return behavior.
- Photo audit numbers are bounded snapshots rather than a full guarantee that every source is available. In the latest 7-second home snapshot, 104 of 186 non-held photos had loaded, zero had the app's final `image-missing` flag, and 82 were still pending; mobile archive reported 180 loaded, 6 loading, and zero final-missing flags. Do not equate pending loads with broken images.
- The test run creates `test-results/v2-image-audit.json`; the workflow now uploads JSON audit files alongside screenshots so future reports retain the per-location failure/pending distinction.
- Two mojibake-named root exports had exact blob duplicates under readable Korean filenames, with no source-code or manual references found. The garbled aliases are being removed; readable-name exports are preserved.
- `v2/assets/app.js` contains the local photo staging and GitHub asset upload flow and keeps legacy external image URLs supported. Static and mock tests pass, but a real write using the user's GitHub token and a manual iPhone publication check have not been performed.
- Root legacy `sw.js`, `manifest.json`, `data/places.js`, and backup/sync modules remain pending a separate offline/rollback audit; they have not been deleted.

## Next steps
1. Verify the current cleanup commit's Actions and Pages deployment before doing another code change.
2. Review uploaded browser audit JSON and separate genuinely broken image sources from slow or still-pending remote responses; do not change the catalog automatically from a timed-out image request.
3. Preserve the current 200-place V2 catalog; no place additions or catalog rewrites in this phase.
4. Confirm photo publishing end-to-end in the app when available: local file (JPEG/PNG/WebP/AVIF, up to 8 MB) -> IndexedDB staging -> GitHub path `v2/assets/places/<placeId>/<candidateId>.<ext>` -> catalog path/URL update -> public reload on PC and iPhone. Code markers and mock tests are verified; real token-backed upload is not.
5. Continue auditing root `sw.js`, `manifest.json`, `data/places.js`, old sync/backup modules and icons before deleting anything that may still serve old installed PWAs or recovery.
6. Keep build ID `20261016-89` consistent until the next intentional app build bump.
7. Keep this checkpoint updated after each meaningful, validated change so work can resume without repeating the same audit.

