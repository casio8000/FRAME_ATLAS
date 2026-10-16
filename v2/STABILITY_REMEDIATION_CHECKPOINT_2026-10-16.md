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

## 2026-10-16 follow-up
- Latest completed quality run `38880334171` and Pages deployment `38880333611` both passed for the duplicate-export cleanup and photo-audit artifact change.
- The workflow now includes `test-results/*.json` in the browser-smoke artifact; audit snapshots identify truly `image-missing` cards separately from photos still loading. The last home snapshot showed 0 final-missing flags but 89 pending at 7 seconds under the test's all-images-eager stress pass; the mobile archive snapshot showed 0 final-missing flags, 180 loaded, and 6 still loading. This is not a guarantee every remote image URL will remain reachable.
- Two garbled-name exports were removed; readable Korean export files with exactly matching blob hashes remain. No active app/manual references to the garbled filenames were found.
- Root `MANUAL.md` was a V5.40 guide and is being replaced with a pointer to the current 2.0 manual. Its prior contents (blob SHA `af46a5531ab59cfafb83f4bd9ed6dc87421130de`) are preserved on the backup branch.

## 2026-10-16 document archive
- Moved four outdated root documents to `archive/legacy-v5-docs/` without rewriting their contents: v5.8 add-on notes, v5.9 location research guide, v5.8 scouting assessment, and the 2026-10-11 sync architecture proposal.
- Current manual remains `MANUAL.md` (redirect pointer to 2.0) and `v2/USER_MANUAL_KO.html`; the prior V5.40 manual blob is also preserved in the backup branch.
- The current 200-place V2 catalog and all legacy data/PWA recovery modules remain untouched.

## 2026-10-16 root service-worker isolation
- Found and fixed a legacy PWA isolation risk: root `sw.js` previously intercepted nested `/v2/` requests and could delete cache names beginning `frame-atlas-v2-` on activation.
- Root worker now uses `frame-atlas-root-bridge-20261016` so existing root-installed PWAs install the transition worker, skips the nested V2 path based on its registered scope, and preserves the `frame-atlas-v2-*` cache namespace.
- `tools/check_app.py` now checks the above guardrails. Initial QA failed only because the checker's regex was over-escaped; that check was simplified to a literal cache-name prefix and then verified.
- Current commit `61345a05eb3ff5106ca9cca0835617a3a09d79d8`: quality run `38881608589` succeeded and Pages deployment `38881608655` succeeded.
- The previous code-only root-worker commit `b9e6dc18c9f1fe2349a11ab320f8b1515c640919` deployed successfully, but its first QA attempt exposed the checker issue noted above.
- Quality workflows now trigger for app/data/service-worker/tool/test changes rather than every README/checkpoint/archive/manual-only edit. Uploaded photo assets still deploy without starting the full browser test. This keeps small documentation saves from repeatedly re-running a long browser smoke test.

## 2026-10-16 photo publishing resilience work
- Identified a retry cleanup issue: when an image upload committed to GitHub but the following catalog PUT failed, local state saved its new `assetPath` and `pendingAsset=false`. A retry correctly skipped re-upload, but old IndexedDB blobs were only deleted from the current attempt's `staged[]` array, so that recovered blob could remain forever.
- Fixed cleanup to collect all local pending-photo keys whose candidates now have a published `assetPath` and `pendingAsset=false`, and clear those blobs only after the catalog PUT succeeds. If the catalog update fails, temporary photos remain.
- Replaced byte-by-byte string concatenation for photo and catalog Base64 with chunked `bytesToBase64`. Added a Node test covering 13 byte sizes through 8 MiB and static recovery-order checks.
- The browser/Actions tests can validate conversion and retry-cleanup ordering. A real GitHub-token upload still requires an actual authorized user-session test and has not been run.

## 2026-10-16 validation target correction
- Found a root cause in the CI report: tools/validate.py analyzed legacy data/places.js (214 records), not the active V2 catalog shown by the app (200 records).
- The old validation script/report are archived as V5 artifacts. The new tools/validate.py validates v2/data/places.json plus v2/data/art_locations_curated_20261016.json using the app's ID/name merge and curation-override behavior, and writes a deterministic tools/report.md.
- The active catalog content has not been rewritten. Pre-run read-only analysis found 151 base records, 65 supplemental entries, 16 entries that merge into existing places, 49 unique additions, and 200 merged locations. It found 288 photo candidates, 0 repository-stored image assets, 39 candidates whose place match is not confirmed, and 1 candidate without an image URL/thumbnail/file reference. These are report metrics, not edits.
- CI's git diff check remains as a guard to ensure the committed report matches the active V2 data.

## Next steps
1. Verify the current cleanup commit's Actions and Pages deployment before doing another code change.
2. Review uploaded browser audit JSON and separate genuinely broken image sources from slow or still-pending remote responses; do not change the catalog automatically from a timed-out image request.
3. Preserve the current 200-place V2 catalog; no place additions or catalog rewrites in this phase.
4. Confirm photo publishing end-to-end in the app when available: local file (JPEG/PNG/WebP/AVIF, up to 8 MB) -> IndexedDB staging -> GitHub path `v2/assets/places/<placeId>/<candidateId>.<ext>` -> catalog path/URL update -> public reload on PC and iPhone. Code markers and mock tests are verified; real token-backed upload is not.
5. Continue auditing root `sw.js`, `manifest.json`, `data/places.js`, old sync/backup modules and icons before deleting anything that may still serve old installed PWAs or recovery.
6. Keep build ID `20261016-89` consistent until the next intentional app build bump.
7. Keep this checkpoint updated after each meaningful, validated change so work can resume without repeating the same audit.

