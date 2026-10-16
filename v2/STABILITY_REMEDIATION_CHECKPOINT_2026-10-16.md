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
1. Root index.html: removed the visible public link to legacy-v5.44.html. The root redirect and direct 2.0 link remain.
   Commit: d810cf49be8ec1bc2754052be9bc634f207d0f0e
2. v2/manifest.webmanifest: aligned start_url from fa_build=20261016-72 to fa_build=20261016-88.
   Commit: ef1c557133c116351432db3b2085ce4d71b26c56
3. A GitHub Actions quality-check run was queued for the manifest commit. Do not call the changes validated until the run completes and actual public pages are checked.

## Next steps
1. Confirm Actions result and verify the root index and manifest contents.
2. Inspect root sw.js/manifest.json and all code references to legacy-v5.44.html, legacy root scripts, and old data files.
3. Inspect quality-check script/test assumptions before deleting any legacy files.
4. Compare v2 base and supplemental catalog counts/IDs without losing or duplicating locations. Use a full-data retrieval path before any large JSON write.
5. Inspect image publishing flow end-to-end: local IndexedDB staging -> GitHub image file upload -> catalog assetPath update -> public image render -> failure recovery.
6. Standardize future images to repository-relative assetPath, with source/rights/place-match metadata, while allowing older external imageUrl/sourceThumbnail references to remain until migrated.
7. Review service-worker cache rules and unify build identifiers in index, manifest, CSS/JS URLs and worker.
8. Remove obsolete files only after dependency/reference audit, backup, and quality tests. Prefer one small change per commit.
9. Report what is verified versus what still requires user testing on PC/iPhone. Never claim device validation based on code inspection alone.
