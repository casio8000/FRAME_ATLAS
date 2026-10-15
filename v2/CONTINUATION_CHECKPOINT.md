# FRAME ATLAS 2.0 — Continuation checkpoint

Last updated: 2026-10-15 (Korea Standard Time)

## Current release
- Live path: https://casio8000.github.io/FRAME_ATLAS/v2/index.html
- Source path: `v2/` in the existing `casio8000/FRAME_ATLAS` repository.
- The older root app is preserved; do not edit or delete it while validating 2.0.
- This checkpoint records the work so a dropped ChatGPT connection does not require restarting the project from the beginning. Code changes are stored in Git commits, not only in the conversation.

## Current verified UI state
- The V2 catalog now holds 136 registered locations across the nationwide archive. The old checkpoint's 34-place figure was stale and has been superseded.
- The last recorded browser smoke run stopped at a flaky scroll on a changing card; this commit removes that unnecessary scroll before rerunning the whole test. Do not claim end-to-end pass until the next Actions run completes.
- A floating “맨 위로” control appears after scrolling.
- A floating “전체 촬영장소로 돌아가기” control is available from a selected place detail.
- The first screen fits the version header, splash copy and creator credits into a fixed viewport, with nationwide (not Seoul-area-only) wording.
- Mobile input font sizing and page/list scrolling have been adjusted for iPhone Safari layout stability.
- Incheon Open Port uses a refreshed image reference from the Incheon Tour site. It is a reference candidate; commercial reuse rights have not been verified.
- The previous-version scout notes are separately labelled as legacy information and are not represented as current confirmed permit/fee facts.

## Hero image behavior
- Select a random location with a usable non-mismatch photo when the app first opens. On the first use, avoid the formerly fixed DDP hero if other usable photos exist.
- Keep that hero stable while navigating within the same page session.
- Remember the previous hero ID and avoid repeating it on the next app load whenever another usable photo exists.
- No additional image service is needed for selection; this only changes which already-catalogued photo is used for the hero.

## Latest edits in this checkpoint
- Random hero avoids mismatched photo candidates and consecutive repeats; the initial display avoids DDP when other eligible photos are available. The first visible home card is reordered to match that randomized location, including on mobile where the wide banner is collapsed.
- Browser smoke test uses deterministic randomness to prove the hero can change across a fresh reload without a flaky probability-based assertion.
- Mobile archive photo framing is 16:9 landscape and remains above the location text; the “photo unavailable” message only appears after the image fallback sequence fails.
- CSS/JS cache-busting and service-worker cache version are kept in sync.

## Remaining work / limitations
- A ChatGPT connection interruption cannot be fixed by application code; continue from this file and the latest Git commit instead of redoing work.
- Direct physical iPhone Safari testing remains useful in addition to automated mobile-browser emulation.
- A standalone 2.0 GitHub repository has not yet been created; preserve the older repository until a separate 2.0 repository is copied, deployed and verified.
- Externally hosted photo URLs may expire or block hotlinking. A successful display check does not grant image reuse rights and does not mean the image files have been copied into the repository. The mobile archive hides its photo-failure overlay while the actual image is loading or displayed.
- Nationwide location research, per-place image verification, and current permit/fee/contact validation remain ongoing.

## Checks to run after changes
1. GitHub Actions: `FRAME ATLAS quality checks`
2. GitHub Actions: `pages build and deployment`
3. Confirm the mobile 16:9 archive frame and both floating controls in browser screenshots.
4. Confirm the Incheon Open Port image loads and that no page errors are recorded.


## Release 2026-10-14 · 2.0.32 changes
- Added four design/architecture candidates in Seoul: Peace Culture Bunker, Seoul Upcycling Plaza, Seoul Urban Life Museum, and Seoul City Hall's new-building facade (34 → 38).
- Incheon Open Port now starts from a static official-tourism JPG and has two secondary candidates for the normal fallback chain. Image reuse rights remain unverified.
- Map/directions buttons open an in-app chooser with an X close control. Only Naver Map and TMAP are offered; where coordinates are missing, place/address search is used.
- Image-source links reduced from 11 to 4. Openverse and Wikimedia Commons remain separate automatic searches with smaller result batches.
- Address, phone, and official website display when data exists; phone can be edited in place details.
- Unconfirmed checklist values are faded and selected on focus for direct replacement.
- Existing local draft catalogs append newly published baseline places without overwriting user edits, and fill only blank address/site/phone/map fields from the baseline.

- Follow-up factual correction: Seoul Urban Life Museum's official visitor guide prohibits indoor commercial filming and flash/tripod photography; the scouting record now states those restrictions explicitly. Naver navigation links use the stable place-search route, with directions selected on the place result rather than relying on an unverified deep path. Incheon Open Port now links to the current official Korean tourism place page and uses its current administrative address.

- Contact-data accuracy pass: removed the SeMA Bunker phone number from the public contact card because the available number was tied to an older exhibition notice, not a clearly verified general contact. The official Seoul Museum of Art homepage is retained and the detail asks the user to confirm the current exhibition/opening schedule.


## Release 2026-10-14 · 2.0.34 nationwide quality expansion
- Floating "전체 촬영장소로 돌아가기" returns to the 2.0 home screen and scrolls to the complete place list instead of the legacy archive workspace. Home "전체 장소" actions use the same route.
- Map tab replaces Google Maps embed with a dismissible popup chooser for Naver Map and TMAP.
- Added four nationwide candidates: Museum SAN (Gangwon), F1963 (Busan), National Asian Culture Center / ACC (Gwangju), and KIKAI Industrial Studio (Gyeonggi). Reference photos do not imply reuse rights or permission to film.
- Added a structured "매체 노출·촬영 이력" detail section. It separates named film/TV/ad credits from press/architecture articles and general studio use categories; no unverified titles are invented.
- Seoul City Hall new-building facade, Seoul Urban Life Museum exterior, and Seoul Upcycling Plaza exterior are now conditional, lower-priority candidates excluded from random hero selection until stronger visual/photo evidence is available.
- Region selectors populate from the place catalog, supporting nationwide locations without fixed Seoul/Gyeonggi/Incheon-only options.

 
## Release 2026-10-14 · 2.0.35 quality-first curation
- The floating "전체 촬영장소로 돌아가기" action now opens the actual 2.0 archive workspace and clears the previous place detail instead of navigating to Home.
- Active archive reduced from 42 to 36. Six uncertain entries were moved into a separate review queue, not discarded: three recent low-confidence locations, two locations whose scene/place match is unverified, and ACC whose press photo does not identify the exact usable space.
- A collapsed "장소 후보 검토 대기" section preserves full records, reasons, and source links without presenting questionable photographs as approved location references.
- LG아트센터 서울 was added as a high-potential review candidate because the official architecture guide describes TUBE, STEP ATRIUM, and GATE ARC. It remains in review queue until a direct photo URL of the exact space and image-use conditions are verified.
- Primary/reference photos and automatic fallback candidates now require explicit place-match confirmation. Unverified photos stay in the photo-candidate manager and are not displayed as if they were confirmed location images.
- Existing local drafts honor the new excluded IDs and inherit the shared review queue while preserving user edits to active places.
- Browser tests updated for 36 active places, seven queue entries, and the archive-return behavior on desktop/mobile.


## Release 2026-10-14 · 2.0.36 navigation and photo-evidence refinement
- The floating return control now goes to the current 2.0 home page and scrolls directly to the full all-places list. It no longer opens the legacy-looking workspace/archive screen.
- The random hero selector now excludes locations explicitly marked closed, permanently closed, or indefinitely suspended.
- The detail's photo panel displays the image's intended view/shot type, notes explaining why the image was chosen, source name, and a clear reuse-rights warning when the license is unknown. This makes it easier to judge whether the photograph actually supports the location's photographic rationale.
- Do not promote new places into the active list until an exact-place photo can be identified. LG Arts Center Seoul remains in the review queue because the architecture is promising but a stable direct photo URL for the exact TUBE/STEP ATRIUM/GATE ARC space has not yet been confirmed; this is intentional quality control, not a dropped candidate.

 
## Release 2026-10-14 · v2.37 quality-first follow-up
- Floating return button now explicitly forces `homeView` visible, hides `workspaceView`, renders the 2.0 home catalog, and rechecks the active view on the next animation frame. The label explicitly says “2.0 전체 장소 목록으로 돌아가기”.
- Bumped HTML asset query strings and service-worker cache to `20261014-37` so older installed PWA bundles are replaced and stale return-button code is less likely to persist.
- Added one carefully scoped Seoul City Hall new-building facade candidate for its curved glass, reflection, and grid geometry, with an official Seoul Mediahub reference image. Reuse rights and shooting permissions remain unverified.
- Marked Peace Culture Bunker as conditional in random hero rotation until its exact representative framing is reviewed. Museum SAN and F1963 reference-image notes now explicitly distinguish space-reference thumbnails from final editorial-quality representative images.
- Browser smoke-test place counts updated to 37 and the mobile return test now asserts `body[data-app-view="home"]`, visible `homeView`, hidden legacy `workspaceView`, and visible `homeAllPlacesGrid`.


## 2026-10-14 · v2.39 return-flow and photo-quality review
- Root cause for the return button: the code tried to scroll to `#homeAllPlacesGrid`, but the design intentionally hides its parent `#homeAllLocations` with `display:none!important`. The visible full 37-place catalog is `#homeFeaturedGrid`. Return now stays in the current v2 app, preserves the current editing context, and scrolls to that visible catalog.
- Added regression assertions on desktop and mobile that the button returns to `/v2/index.html`, shows the 2.0 home, and reveals the visible 37-place catalog instead of the hidden duplicate archive.
- `seo-peace-culture-bunker` and `seo-city-hall-new-building` remain conditional and their photo candidates are marked `unconfirmed`; they are not used as the home hero or displayed as confirmed reference photos until actual place/composition matching is reviewed.
- Added two architecture-led Seoul prospects to the review queue only: Seoul Hall of Urbanism & Architecture and Seosomun Shrine History Museum. They are deliberately not promoted to the main catalog because direct location-specific photographs and permitted shooting zones are not yet verified.
- Review queue is the safe staging area: no fabricated/stock-like image is used to make a new place appear photo-ready. Active catalog remains 37 until image and access evidence is adequate.


## 2026-10-14 · photo-quality review and archive cleanup (v2.40)
- The floating return action remains inside the v2 page; desktop/mobile regression tests verify the /v2/index.html entry point, visible v2 home and current full catalog instead of the hidden duplicate list.
- Four entries were moved from the active archive to the photo-review queue: Peace Culture Bunker and Seoul City Hall new-building facade (exact framing/place match not confirmed), Museum SAN and F1963 (current article/thumbnail photos do not yet demonstrate their full photographic value or composition range). Records, notes, and photo source URLs are preserved.
- Active catalog is now 33; review queue is 14. The reduced count reflects the quality-first decision not to present unresolved candidate images as curated representatives.
- Review-queue cards now show candidate thumbnails only when a direct image URL exists, explicitly labeled “검토 후보 · 대표사진 아님”, with candidate count and source links. Entries without a direct image show a placeholder instead of an invented photo.
- Home cards label unapproved photos “참고사진 · 후보 N개” rather than implying they are approved representative images. KIKAI remains active because its official space gallery directly illustrates the actual studio interior.
- Added LEEUM Museum as a high-potential Seoul candidate for architectural scouting, but it remains unpromoted until exact-location photos, filming access and image reuse conditions are verified. Seoul Urban Architecture Exhibition Hall, Seosomun Shrine History Museum and LG Arts Center Seoul remain in the review queue for the same reason.

- Browser smoke test follow-up (v2.41): the active-detail test now checks Museum SAN's source link in the review queue rather than trying to open a deliberately held location from the active archive. The Gwangmyeong Cave reference is switched to its same-location Wikimedia Commons photo after the earlier news-host URL failed the real-browser load audit. The new image remains a candidate with licence attribution still to be checked.


## Release 2026-10-15 · legacy 214-place comparison and curated additions
- Read the prior root catalog `data/places.js`: 214 legacy records. V2 had 133 registered places before this release.
- A first normalized-name comparison flags many candidates but is not a confirmed omission count; names/aliases and parent/child sublocations still need manual deduplication. Do not bulk-import the remaining records.
- Added three photographically specific omissions after finding actual place images and supporting source pages:
  - **삼탄아트마인** (legacy L-025): real mine-industrial structure and exhibition art; Korean Tourism Organization page names 《태양의 후예》, 《유령》, 《스파이》 and 《협상종결자》 as filming titles. Exact scene locations remain unverified.
  - **오대호아트팩토리** (L-021): actual junk-art sculpture photos from Korea Tourism Organization and location article; selected for unusual sculptures and material texture, not film credits.
  - **나빌레라문화센터** (L-055): official Naju Cultural Foundation confirms reused former silk factory; actual exterior and interior photos linked from regional culture archive.
- New total: 136 places. Photo references remain candidates; image reuse rights and commercial-shooting permission are NOT confirmed.
- Next review priority: SBS Ilsan Production Center current operational/booking status; then compare distinctive large performance spaces from the previous catalog against actual public access and architecture. Avoid generic venues unless they add real photographic value.
- The new cache build is `20261015-51`. The browser smoke test no longer performs an unstable scroll action on a card being re-rendered.


## 2026-10-15 · v2.65 list-return and mobile-admin fix
- Place details opened from the visible home catalog now remember the list scroll position. Returning restores that position and retains the current catalog filters instead of jumping to the first card (DDP).
- The administrator-mode entry remains visible on the welcome screen, including mobile; the password dialog opens from the mobile button.
- Verification: desktop/mobile browser smoke tests, location-data validation, app-resource checks, backup-merge tests, device-sync tests, and legacy audit test all passed.
- Source commit: `d424fdaca64b1d7651f44f14606ac3a0cec86f3a`.
- Quality Checks: https://github.com/casio8000/FRAME_ATLAS/actions/runs/38699963376 — SUCCESS.
- Pages deployment: https://github.com/casio8000/FRAME_ATLAS/actions/runs/38699963424 — SUCCESS.


## 2026-10-15 · v2.66 mobile administrator viewport fix
- Mobile admin workspace is forced into a single fluid column with min-width safeguards; admin tools, text, and action buttons wrap instead of widening the page.
- Password dialog is constrained to the iPhone viewport height and width and remains internally scrollable.
- Added a mobile Playwright regression test that sets a test-only admin password, opens the admin workspace at 390 px width, and asserts document/panel width does not exceed viewport.
- Build/cache ID: `20261015-66`. Awaiting current GitHub Actions results.


## 2026-10-15 · v2.67 two-admin-passphrase gate
- Removed the per-browser first-run password creation path, which allowed any visitor to self-register for administrator mode.
- Admin mode now accepts exactly two pre-provisioned high-entropy passphrases, verified with PBKDF2-HMAC-SHA256 (310,000 iterations). They are not written to localStorage. The previous per-browser admin password hashes are discarded.
- The concise Korean user manual was updated in the same commit. It explains admin entry and clearly states that the UI gate is not server-side authorization; GitHub publication still requires a valid repository-scoped write token.
- Added a browser regression test to verify there are exactly two configured verifiers and invalid passwords do not unlock administrator mode.
- Build/cache ID: `20261015-67`. Actual passphrases are deliberately not included in repository files or the manual.


## 2026-10-15 · User manual refresh and 200-place plan
- Created restore branch `backup/pre-manual-and-200-place-expansion-2026-10-15` from the pre-task main head `5b80371ca8faa121cab0d31eca288160671b1e06`.
- Rebuilt `v2/USER_MANUAL_KO.html`: desktop top-right and mobile bottom-right sticky controls; close button falls back to browser history or app; expanded instructions for navigation, new place registration, edit/delete, image URL vs local file, image source verification, field checklist, JSON backup/restore, GitHub publication, PC/iPhone and troubleshooting.
- Updated the manual link in `v2/index.html` to use query version `20261015-68`.
- Added `v2/PLAN_200_PLACES_2026-10-15.md`. Baseline is 137 catalog place records plus 14 separate review candidates. A provisional net +63 is needed only if all 137 existing entries remain. Quality audit may mean investigating more than 63 candidates.
- No location records were bulk-added as part of this planning step. Candidate venues require deduplication against current and legacy lists, exact-place photo review, official source review and separate permission checks before activation.
- Next: check latest GitHub Actions quality/deploy results; inspect 137 records for holds/photo mismatch; compare against the legacy 214-place list if available; then research/import in batches around 15 with validation after every batch.
