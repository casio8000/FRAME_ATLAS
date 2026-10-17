# FRAME ATLAS 2.0 — Continuation checkpoint

Last updated: 2026-10-17 (Korea Standard Time) — photo PR #8 and docs PR #9 merged; quality #603/#605 passed; post-merge Pages deployment confirmation pending

## Current release
- Live path: https://casio8000.github.io/FRAME_ATLAS/v2/index.html
- Source path: `v2/` in the existing `casio8000/FRAME_ATLAS` repository.
- The older root app is preserved; do not edit or delete it while validating 2.0.
- This checkpoint records the work so a dropped ChatGPT connection does not require restarting the project from the beginning. Code changes are stored in Git commits, not only in the conversation.

## Active checkpoint — PC stale-screen / 201-count regression (2026-10-17)

- User report: on PC, clicking “시작하기” sometimes opened an old-looking screen, the newest-location section was absent, and the count was 201. Pressing Ctrl+F5 showed the new-place section and 200 places. After build 20261017-124 was applied, the user confirmed the PC now displays normally; mark this symptom resolved unless it recurs.
- Diagnosis from source: the prior service worker's activation cleaned up old caches and claimed open clients, but deliberately did not navigate the already-open app tab. FRAME ATLAS is a single-page app, so its old JavaScript and rendered UI could survive a deployment even after the new service worker was installed. This matches the hard-refresh symptom; the specific stale local-storage record has not been identified and should not be assumed to be the root cause.
- Fix committed to `main` in build `20261017-124`: version-fingerprint the app-shell URLs in `v2/index.html`, update the PWA `start_url`, and have the new service worker reload only open `/v2/` or `/v2/index.html` app-entry clients once when a new worker activates. It starts navigation without waiting for the reload inside the activation promise, so activation can finish. The special versioned navigation response is now limited to `/v2/` and `/v2/index.html`; other pages such as `USER_MANUAL_KO.html` use the normal fetch path. A brief one-time refresh can be visible during an upgrade.
- Updated `v2/USER_MANUAL_KO.html` with the new PC symptom and safe recovery steps. Updated `v2/WORK_LOG_2026-10-17.md` as a compact session checkpoint.
- Static GitHub source verification confirms that `index.html`, `sw.js`, `manifest.webmanifest`, the manual, and the work log all contain build `20261017-124` where applicable; the old `20261017-121` version string is no longer present in the three app-shell files. The final runtime adjustment, manual revision, and checkpoints are committed on `main`; use the repository's recent commit history for the current head rather than this historical checkpoint hash.
- Verification completed: quality run #594 succeeded and Pages deployment #640 succeeded on commit `a27244909e196f13e3af41db98b2a7f80a084ca7`. User confirmed normal PC display, including the newest-location section and 200-place count. The physical iPhone whole-catalog check remains incomplete; do not describe browser emulation as physical-device acceptance.

## Current verified UI state
- Current integrated catalog count is 200 unique locations: base catalog 151 + supplement 67 − 18 ID/name matches = 200. This count is confirmed by the catalog merge/validation report. The latest 14 additions now each have a primary and reference image candidate assignment.
- Latest previously recorded full quality/browser run: GitHub Actions quality run #567 passed for build 20261016-100, including desktop/mobile Playwright checks, canonical count tests, stale PC-only draft and alternate-ID duplicate reconciliation, preservation of genuine local-only drafts, newest-14 photo checks, catalog validation, report consistency, backup/photo/device-sync tests. Pages deployment #607 succeeded for that build family. That result is a historical baseline, not validation of build 20261017-124. The browser audit then rendered 200/200 cards, loaded 200/200 location images, and flagged 0 missing images; all newest 14 images loaded.
- A floating “맨 위로” control appears after scrolling.
- A floating “전체 촬영장소로 돌아가기” control is available from a selected place detail.
- The first screen fits the version header, splash copy and creator credits into a fixed viewport, with nationwide (not Seoul-area-only) wording.
- Mobile input font sizing and page/list scrolling have been adjusted for iPhone Safari layout stability.
- Incheon Open Port uses a refreshed image reference from the Incheon Tour site. It is a reference candidate; commercial reuse rights have not been verified.
- The previous-version scout notes are separately labelled as legacy information and are not represented as current confirmed permit/fee facts.

## Midpoint evaluation — 2026-10-16

### Current position
- Location-count phase: complete and frozen at 200 unique places. Base 151 + supplemental candidates 67 − 18 ID/name matches = 200; 49 supplemental entries were added as distinct places. Do not add more places during core verification except corrections or replacements for duplicates/incorrect entries.
- Latest photo batch: all 14 recently added locations have place-matched primary/reference assignments; all 14 loaded in the current automated audit.
- Automated stability: build 100 quality checks passed. The smoke suite tests a stale PC catalog that contains an alternate-ID duplicate, unfinished numbered placeholders, and one unique unpublished location. The published catalog is reconciled to exactly 200; the genuine unpublished location is moved to frameAtlas2UnpublishedPlaceDrafts and disclosed, not silently deleted.
- Live-view audit from the latest automated browser run: 200 cards rendered, 200 images loaded, 0 missing-image flags. This is a time-specific run, not a guarantee that external hosts will never fail later.

### Current risks and limitations
- Photo source reliability is not the same as photo rights. The catalog has 307 photo candidates; 306 have a URL or asset reference, but 0 photo files are stored inside the repository. External hosts may change, rate-limit, or block hotlinking.
- Candidate matching states: 268 confirmed, 37 unverified, 1 unconfirmed, and 1 mismatch. The selected primary/reference image IDs are checked to avoid rejected or non-confirmed images, but unused alternates still need review.
- Rights statuses are not yet uniformly cleared for re-use: 306/307 candidates remain in a status other than public-domain-dedication; many are intentionally reference-only, review-required, unknown, or missing a rights status. Do not describe reference images as commercial-use-cleared.
- Automated mobile-browser emulation passed, but actual iPhone Safari/home-screen app behavior still needs hands-on confirmation. Remote inspection cannot read the user's PC localStorage, so the exact formerly counted 201st local record cannot be named.

### Recommended validation sequence (no new-location expansion)
1. Verify the user's PC after build 100 is freshly loaded: expected common count 200; any unique unpublished draft should appear only in the local-draft notice/backup, not as a 201st common location.
2. Validate core flows on desktop and mobile emulation: opening/return navigation, search/region/category filters, all-places list, newest-six section, place details, map choice, saved places and missing-photo fallback.
3. Validate data safety: export/import backup; local draft preservation; GitHub publish; cross-device merge; conflict handling; and ensure no local-only private draft is accidentally published or lost.
4. Continue the 200-place image pass: confirm the 37 unverified candidates, check source stability and place match, then review usage-rights/source metadata. Fix any broken external image with a correct source or repository-hosted image when allowed.
5. Perform a final hands-on PC + actual iPhone Safari/PWA acceptance test before declaring v2.0 release-ready.

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

- Follow-up research update: expanded the 200-place plan with a separate studio-facility track using KOFIC/KoBiz source pages. Namyangju is explicitly flagged for an operations/access recheck because its public visitor experience closed, and not presented as a currently public venue.


## 2026-10-16 · Cross-device data workflow and staged 14-location research
- Manual updated again: the actual publishing code writes the complete current browser catalog directly to `main/v2/data/places.json`, and uploads eligible selected/approved file photos. Local catalog drafts are stored per-browser; there is no safe field-by-field concurrent merge guarantee. The user manual now explicitly recommends one editing/publishing device (PC by default), JSON backups before/after batches, deployment verification, and refreshing any device with a stale local draft only after exporting it.
- Added dedicated cross-device workflow instructions to `v2/USER_MANUAL_KO.html`; cache-busted app menu link is `USER_MANUAL_KO.html?v=20261016-69`.
- The earlier checkpoint created `v2/PLAN_FIRST_14_CANDIDATES_2026-10-16.md` with 14 research targets. The subsequent update below added them as preliminary active records, while retaining explicit caveats about access, permission and image rights.
- Updated `v2/PLAN_200_PLACES_2026-10-15.md` so 14 new candidates are the first research phase and the 200-place target proceeds in later batches after verification.
- At the earlier checkpoint, the catalog had 137 places plus 14 reviewQueue entries. The later update below adds 14 distinct places; queue entries remain separate and are not counted as new locations.
- Operational safety recommendation: one editor/publisher at a time. The current client can publish a stale local draft as a full catalog; it does not offer reliable concurrent field-level merge. Future engineering option is remote revision checking, conflict detection, and record-level merge/explicit conflict review before writes.


## 2026-10-16 — 14 provisional records and public image browsing

- A safety branch was created before these changes: `backup/phase1-add-14-public-image-search-2026-10-16`.
- Added 14 distinct first-pass research records to `v2/data/places.json`: BUSAN Cinema Studios, DIMA, Goyang Aqua Studio, Jeonju Film Studios, Daejeon Video Special Effects Town, Studio Cube, K Film Studio Paju, Seoul National University Museum of Art, ARKO Art Center, Jeju Museum of Art, Arario Museum Tapdong Cinema, Korea Traditional Architecture Museum, Chilseong Shipyard, and OAR Museum.
- Active place count is now 151. `reviewQueue` remains 14 separate items and was not merged with the new additions.
- These are preliminary scouting records, not final recommendations or proof of visitor/shooting permission. Studio access, current operations, booking, commercial filming terms, and image reuse rights require separate confirmation.
- Linked place-specific images are reference candidates only; no image was made an approved primary cover. Other new records retain search terms and official source links rather than invented images.
- The normal detail screen now exposes Google Images, Naver Images, Bing Images and an official source search regardless of administrator mode. A candidate-image gallery lets users browse saved reference images and open each original source. Automatic Openverse/Wikimedia candidate fetching and image administration remain administrator-only.
- Updated the Korean user manual, app cache build marker to `20261016-71`, the research plan, and the 200-place roadmap. Data and code changes have been committed to GitHub; GitHub Pages deployment and real-browser visual verification still need confirmation.


- Follow-up after the prior checkpoint commit: reconciled the 200-place roadmap to the active 151-record catalog, updated region/type remaining targets to a provisional +49, and changed mobile image-search links to a 2-column layout. Cache-bust build is now `20261016-71`.


- Final image-source enhancement: the Jeonju Film Studio record now has two reference-photo candidates (exterior and sound stage), and Studio Cube has three (exterior/interior candidates). All remain non-primary candidates with unknown reuse rights; no approved primary cover was assigned.
- Last data count check after these additions: 151 active records, 14 separate reviewQueue items, unique active IDs, and all 14 planned IDs present. Place JSON and detail-gallery data are committed. The latest Pages workflow run should be checked for its final result before claiming public deployment is complete.


## 2026-10-16 — 15 curated art/architecture spaces and easier cross-device sync

- Safety branch before this task: `backup/add-art-locations-and-sync-merge-2026-10-16` (pre-task main SHA `f97297685cbfb049aeaae9c1623e0ec14f8a53e5`).
- Added `v2/data/art_locations_curated_20261016.json`, 15 additional places focused on sculpture, galleries, modern Korean architecture, natural materials, gardens, and Korean/global editorial potential. Thirteen have one or more place-relevant reference photo candidates; none is auto-selected as the primary/cover image.
- New art/architecture places: Lee Jaehyo Gallery, AYU Space, Eham Campus, KOO House Museum, Art Sonje Center, Arario Museum in Space, Kim Chong Yung Museum, Whanki Museum, SOMA Museum/Olympic Park Sculpture Park, Museum Hanmi Samcheong, Moran Museum, Wooyang Museum, Jeju Kim Tschang-Yeul Museum, Itami Jun Museum, and Kukje Gallery K1-K3.
- `v2/assets/app.js` now loads the supplemental art dataset by relative URL and appends places that are not already present by ID/name, for 166 places in the app view (core `places.json` currently holds 151 until this supplement is merged by a successful GitHub sync/publish).
- Added a baseline snapshot key `frameAtlas2PublishedBaseline`. When there is a baseline, publishing now fetches current GitHub content, merges three ways (last-published baseline / current device / latest GitHub), preserves different field changes and different new place IDs, and aborts with a conflict message when the same field was changed differently on both sides.
- Legacy device drafts with no saved baseline take a conservative path: locally new locations and records that appear newer can be retained, but old deletion state is not used to delete remote records or remote image assets on the first sync. The status and manual explain that deletion must be done again after first sync if needed. JSON backup before first sync is recommended.
- Added an optional “remember GitHub token on this device” checkbox. When selected, the token is kept in that browser’s localStorage and is not shared to other devices. Do not select this on a shared/public computer; use a repository-limited token.
- Place entry guidance is simplified: create a useful first draft with place name, region, location/address or map query, short visual profile, and a reference image or image-search terms. More detail is added gradually. The detail gallery emphasizes the source label rather than license-state wording; source/reference records remain in the data.
- Updated user manual, 200-place roadmap (screen target 166 with nominal remaining +34), and added `v2/PLAN_ARTISTIC_SPACES_2026-10-16.md`.
- Build keys in `v2/index.html`, JS and CSS are set to `20261016-72`. Must verify the current Pages action for the latest main commit and then open the public page to check 166-place display and cross-device merge flow. Static commit checks are not a substitute for the live browser test.


- Follow-up verification on build `20261016-72`: app JS parses successfully in a JavaScript parser; the 15-place supplemental JSON parses, all 15 IDs are unique, all entries have core fields, and its 16 image candidates have valid-looking HTTP(S) image URLs. Thirteen places have image candidates. Synthetic merge checks passed for (a) separate field edits from two devices, (b) newly added IDs from both devices, (c) same-field conflict detection, and (d) delete-vs-remote-edit conflict.
- Simplified public reference-photo text so the default emphasis is real-place/image matching and visual value; separate usage terms are mentioned mainly when an image itself will be reused in published/commercial material.
- The user manual and roadmap now describe the actual merge flow; the optional per-device token setting is noted. Latest code SHA as checked during this work: `7e322dc3eb20fe542118753e70bc0e0c2e55c46f` for `v2/assets/app.js`; `v2/index.html` uses build `20261016-72` and matching JS/CSS/manual cache keys.
- This is static and synthetic validation, not an end-to-end PC/iPhone browser session. Current Pages deployment status still needs verification for the final checkpoint commit.


- CI recovery: the first browser smoke failure was a stale count assumption. `tests/v2-browser-smoke.cjs` was updated to count both the core catalogue and the supplemental art-space JSON, and its manual-link selector now accepts the cache-busted manual URL.
- PWA cache alignment: `v2/sw.js` now uses build `20261016-72` and pre-caches `data/art_locations_curated_20261016.json`; `v2/manifest.webmanifest` start_url uses the same build key.
- Verified on commit `a04891003a46b4e5a4d66332760efb721c5b2238`: GitHub Actions **FRAME ATLAS quality checks — success** (including desktop/mobile Playwright smoke test) and **Pages build and deployment — success**.
- Supplemental locations are merged in the app’s runtime catalog. Before the next ‘GitHub 동기화·게시’, the core JSON file can still show 151 records; after a successful sync/publish, those 15 supplemental records are also incorporated into the core published catalog. The runtime loader deduplicates the supplemental list against the published core data.


## 2026-10-16 — Second researched location batch
- Added seven new location candidates to v2/data/art_locations_curated_20261016.json: Uijeongbu Art Library, SeMA Art Archives, Gana Art Center, Artspace Boan1942, piknic, Pohang Space Walk, and the specific Álvaro Siza Hall / Anyang Pavilion.
- Selection used official venue pages, local government/tourism sources, architectural project references, and media/photo cross-checks. Existing catalog entries such as Photo SeMA, Nam-Seoul Museum, Incheon Art Platform, Mimesis Art Museum, Anyang Art Park, MMCA Cheongju and Nam June Paik Art Center were not re-added as new broad locations.
- The data bundle now has 51 supplement records. Applying the app's ID/name deduplication to the 151 core entries yields 186 distinct visible catalog entries, including the new seven, before any user-local draft adjustments. The core catalogue itself remains 151 until a successful publish merges the supplemental file.
- Reference images were attached to the seven entries as candidate and reference-only; they do not certify commercial reuse rights or on-site commercial-shoot permission. piknic's official notice limits ordinary visitor photography to phone cameras and prohibits video/equipment photography; professional equipment use must be separately approved.
- Excluded Korea Furniture Museum from this active batch because the Korea Tourism Organization result surfaced a current renovation-closure note; re-check reopening before considering it for an active list.
- Research matrix and source URLs: v2/LOCATION_RESEARCH_BATCH2_2026-10-16.md.
- The Korean user manual was updated in the same task to list the seven venues and their specific restrictions.
- Post-deployment checks completed: quality run #557 and Pages run #595 passed. The most recent 15-second browser audit rendered 200/200 location cards with 0 missing-image flags; 166 images loaded and 34 were still loading at the snapshot, while all newest 14 images loaded successfully. Actual physical iPhone testing remains outstanding.


## Release 2026-10-16 · latest 14 photo references assigned
- User priority remains: finish the recent location photos and the “새로 추가된 장소” section before unrelated work.
- The 14 newest locations now all have a matching image candidate, and both `primaryImageId` and `referenceImageId` point to that candidate: 양주 장욱진미술관, 안양 김중업건축박물관, 대구 간송미술관, 제주 유민미술관, 제주 글라스하우스(휘닉스 아일랜드), 통영 전혁림미술관, 부산 국립해양박물관, 군산 이당미술관, 국립익산박물관, 춘천 이상원미술관, 거제식물원 정글돔, 김포 애기봉평화생태공원, 대구 수창청춘맨숀, 서귀포 소라의성.
- Each of the 14 external photo URLs was opened and visually checked against a corresponding place/source page during this pass. These are still reference images, not locally hosted assets; if a remote host blocks hotlinking or changes an address, fallback behavior may be needed.
- Set `curationOverride=true` for this 14-place batch so a same-ID/name record already in the base catalog inherits the curated image references rather than being duplicated. Updated `syncAttachSupplementalPlaces()` to also carry over `newlyAdded`, `newlyAddedAt`, `imageStatus`, and `referenceImageStatus` for existing matches, so the recent-location section remains consistent across devices.
- Updated app build, service worker, manifest, and root entry to `20261016-99` to refresh the local-draft reconciliation, home notice, corrected photo fallback URLs, and safe failure handling during backup import.
- Validation report after merging: base 151, supplement 65, 16 matches, 49 appended, 200 unique locations; 304 photo candidates, 303 with a usable URL/path, 1 with no URL/path; every location has at least one candidate and all 200 have a reference-photo assignment. 38 places have an explicit primary-image ID; the recent 14 all have one. Selected primary/reference IDs now validate to non-rejected `placeMatch=confirmed` candidates.
- Verification complete for the latest app/data logic: GitHub Actions quality checks passed (run #557 on build 99; catalog validation, report consistency, app resource checks, real-browser desktop/mobile smoke test, backup/photo/device-sync tests). GitHub Pages deployment passed (run #595). The 15-second browser audit recorded 200/200 place cards, 0 missing-image flags; 166 images loaded and 34 were still loading at the snapshot, while all newest 14 loaded successfully. The screenshot shows the mobile “새로 추가된 장소” section with six image cards. Actual physical iPhone testing has not been performed.


## Release 2026-10-16 · latest image-integrity repair
- Yeolumul mural-village record now assigns `primaryImageId` and `referenceImageId` to `ref-yeolumul-historic-mural-20261016`. The apartment/playground-like candidate remains explicitly rejected/mismatch so it cannot become a fallback.
- `tools/validate.py` now reports an error if either selected primary/reference image points to a rejected candidate or anything other than a confirmed place match. `tests/v2-browser-smoke.cjs` has regression assertions for all 14 newest photo assignments and the Yeolumul primary-photo correction.
- Latest quality run #557 passed and Pages deployment run #595 succeeded. The 200-card 15-second audit had 0 missing-image flags; 166 loaded, 34 were still loading, and all newest 14 loaded. The count-reconciliation regression uses a synthetic PC draft with an alternate-ID duplicate and one unique unpublished place: active count stays at 200, duplicate is merged to the canonical ID, and the unique unpublished place is retained separately in `frameAtlas2UnpublishedPlaceDrafts`. The home screen tells the user when such drafts are preserved; JSON backup export/import also carries `localUnpublishedPlaces`. Import now stops with an explicit error if imported unpublished drafts cannot be saved locally, rather than silently proceeding without them.


## Release 2026-10-16 · PC/mobile count reconciliation and mid-project review
- Canonical shared count remains 200 (151 base + 65 supplemental − 16 ID/name matches). The discrepancy was traced to the old loader trusting per-device local draft arrays: a PC can retain a place with an alternate ID and/or one or more unpublished records, inflating the visible count independently of the published catalog.
- New `reconcileLocalDraftToPublished()` matches drafts by stable ID or a unique normalized location name, merges alternate-ID duplicates into the canonical ID, preserves user fields/photo candidates, and separates unknown local-only records into `frameAtlas2UnpublishedPlaceDrafts`. These records are not counted among the shared 200, are not silently deleted, and remain included in JSON export/import (`localUnpublishedPlaces`). The home screen shows a notice when separate drafts exist.
- Automated regression passed using a synthetic stale PC draft with an alternate-ID DDP duplicate, an unfinished “50/51” placeholder, and one unique local-only test location: count stays 200, duplicate is merged, placeholders are removed, unique local-only record remains separately backed up, and the user gets a visible notice.
- Final catalog/report counts: 200 locations; 304 photo candidates; 303 candidates with URL/path; 1 no URL/path; 265 confirmed, 37 unverified, 1 unconfirmed, 1 mismatch (rejected/mismatch candidate is intentionally retained only as a historical rejection record); no selected primary/reference ID points to a rejected or non-confirmed candidate.
- Mid-project assessment: location collection is complete for the 200-place target and should remain frozen. Main work now shifts to image loading and source/rights review, real iPhone verification, and regression checks for backup/restore, cross-device merge/conflicts, and data preservation. Many photos are external references, not local files, and photo match, reuse rights, and filming permissions are separate questions.


## Release 2026-10-16 · Photo audit batch 1 and report precision
- Created safety branch `backup/pre-image-audit-batch1-2026-10-16` from the pre-audit main commit `b5d1d16d284f9c800e48d1fdfb7385506968d4bc` before changing photo metadata.
- Visually checked three alternate image/source pairs and promoted only their place-match state to `confirmed`: `ref-gyeongchun-rail-axis` (Gyeongchun Line Forest Trail), `ref-naksan-wall-news-night` (Naksan/Hanyang fortress wall night view), and `ref-starfield-suwon-library-interior` (Starfield Suwon Byeolmadang Library). Their status remains `candidate`; reuse rights stay unknown; no primary/reference-image IDs were changed.
- Rejected `ref-acc-gwangju-architecture` as a usable photo candidate because it is a high-angle complex-wide view rather than a useful ground-level scouting reference. Its original URL and history remain; `placeMatch` stays unverified because the exact sub-location was not proven.
- Refined `tools/validate.py`: active photo-match review totals now exclude candidates marked `rejected`, while the state table preserves all candidate history. This avoids counting an excluded image as an active review task.
- Post-merge result: **200 unique locations**, **307 photo candidates**, 271 confirmed, 34 unverified, 1 unconfirmed, and 1 mismatch. The state table includes rejected-history candidates; the active match-review count is 34. There remain 306 candidates whose image reuse rights are not clearly cleared.
- Checked the successful desktop/mobile smoke artifacts from quality run #567 (build 100): 200/200 catalog cards rendered, 200/200 displayed image elements loaded, and 0 held/missing/pending images in the captured audit. All latest 14 locations remained loaded. The actual physical iPhone Safari/PWA acceptance test remains outstanding.
- Sources reviewed: FN News article on Gyeongchun Forest Trail (https://www.fnnews.com/news/202110051153483478); Nongmin Hanyang Fortress/Naksan route article (https://www.nongmin.com/article/20250317500224); Starfield Suwon Byeolmadang Library photo source (https://koreacrate.com/blogs/blog/starfield-byeolmadang-library-opens-in-suwon-south-korea).


## Release 2026-10-16 · Photo audit batch 2 and duplicate candidate cleanup
- Created safety branch `backup/pre-image-audit-batch2-2026-10-16` from pre-audit main commit `0b29197f8aa2d3c4509a6b04af19666dab27a694` before editing image candidate records.
- Kept the shared catalog frozen at 200 unique locations. Existing active reference selections were not changed.
- Checked source pages/direct imagery for LG Art Center Seoul's TUBE, Jangsaengpo Culture Warehouse's media-art interior, Seoul Upcycling Plaza, Seoul New City Hall's curved glass facade, and Seoul Urban Life Museum. Exact or www/non-www alias URLs with identical file paths were matched before duplicate records were pruned.
- Eight redundant candidate records were excluded from the active photo gallery: LG Art Center (1), Jangsaengpo Culture Warehouse (1), Seoul Upcycling Plaza (2), Seoul City Hall (3), and Seoul Urban Life Museum (1). Their original source URLs and notes were preserved; chosen reference candidates remain active and unchanged.
- Recomputed the catalog report from both data lists: 200 locations, 307 photo candidate records including rejected history, 26 unresolved active image-match candidates, 306 candidates with reuse rights not clearly cleared, and 0 structural/selected-reference errors.
- The latest 14 new-location photo assignments remain unchanged. Automated quality checks for the preceding batch passed and its Pages deployment succeeded. This batch awaits its own quality test and deployment result.
- Source checks: LG Art Center official TUBE architectural tour (https://www.lgart.com/architecture/ko/audio/5); Seoul Mediahub Upcycling Plaza page (https://mediahub.seoul.go.kr/archives/2018487); Seoul Mediahub New City Hall page (https://mediahub.seoul.go.kr/archives/160215); Seoul Urban Life Museum name visible in its exterior image (source recorded in catalog); MK News photo source for Jangsaengpo Culture Warehouse (https://www.mk.co.kr/news/society/11079574).


## Release 2026-10-16 · Photo audit batch 3 and accurate location references
- Created safety branch `backup/pre-image-audit-batch3-2026-10-16` from pre-audit main commit `1fc1bb065459351ab44c4057c48b6f68e8d9118a`.
- Confirmed location matching and source captions for four photo candidates: Jangtaesan Natural Recreation Forest skyway; Busan Cinema Center LED canopy at night; Peace Culture Bunker exterior; and MMCA Cheongju first-floor storage. None of the existing primary/reference IDs were changed.
- Replaced the legacy Jangtaesan forest-road URL with a source-linked photo explicitly captioned as the Jangtaesan skyway in NewsWA, crediting Korea Tourism PhotoKorea photographer Lee Beom-su. The previous URL is retained in the candidate notes for history.
- Rejected one generic Unsplash studio image from the Paju CJ ENM Studio Center record because there is no evidence that the picture depicts the actual CJ ENM site. The URL and source note remain stored, but the image is no longer an active photo candidate.
- Post-merge report: 200 locations, 307 records including rejected history, 21 active location-match review candidates, 306 candidates without clearly cleared reuse rights, and 0 structural or selected-reference errors. The 200 current selected reference IDs remain unchanged.
- Source pages: NewsWA's Jangtaesan skyway photo caption credits Korea Tourism PhotoKorea (https://www.news-wa.com/article/travel/tour-korea/2025/09/14/20250914500020); VisitKorea's Busan Cinema Center at night (https://english.visitkorea.or.kr/svc/contents/infoBscView.do?dataSetId=76&menuSn=229&vcontsId=177333); CoRe Architects' Peace Culture Bunker photo portfolio (https://www.co-re.kr/project/peace-culture-bunker); NewsPim's MMCA Cheongju opening story (https://m.newspim.com/news/view/20181226000640).


## Release 2026-10-16 · Photo audit batch 4 — alleys, museum frontage, station photos
- Created safety branch `backup/pre-image-audit-batch4-2026-10-16` from pre-audit main commit `74238b2417af8c21d2ea334a56837dbe7e2cc97b`.
- Confirmed the exact photo/location relationship for four references without changing the selected primary/reference IDs: Seoul Seo-Seoul Museum of Art (Brique article and visible bilingual museum sign), Donuimun Museum Village (Seoul official-site image file, relabelled as an indoor retro exhibition space rather than an outdoor alley), Suwon Haenggung-dong Mural Village (VisitKorea detail and matching mural alley), and Namwon Seodo Station (the replacement image visibly shows the ‘서도 / Seodo’ sign).
- Replaced the non-loading Seodo Station candidate image with the directly verifiable on-site photo URL from a Naver travel blog. The old World Daily image URL and source URL are retained in `previousImageUrl` and `previousSourcePageUrl` for audit history; usage rights remain unknown.
- Post-merge data: 200 unique locations, 307 photo candidate records including retired histories, 17 active image-match review candidates, 306 candidates without clearly cleared reuse rights, and 0 broken selected-image references or structural errors.
- Sources: Brique Magazine's March 2026 opening article for Seo-Seoul Museum of Art (https://magazine.brique.co/brq-news/seoseoul-museum-opening-geumnarae-park-kimchanjoong-thesystemlab/); Seoul's official Donuimun Museum Village image path (https://english.seoul.go.kr/wp-content/uploads/2023/12/donuimun-01.jpg); VisitKorea's Haenggung-dong Mural Village listing (https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=50c0daa1-83a7-416c-a38f-7b5257fed378); Naver blog field photograph with the Seodo station sign (https://blog.naver.com/hey_che/222381772211).


## Release 2026-10-16 · Photo audit batch 5 — working public-space references
- Created safety branch `backup/pre-image-audit-batch5-2026-10-16` from pre-audit main commit `22c6864b70a9e0802cfd4aa94c772b32a418cabb`.
- Repaired four alternate photo references without changing any selected primary/reference ID or increasing the place count:
  - Seongsu Daelim Changgo now points to the Daelim Changgo interior image displayed on the venue-source page rather than the older Sekainavi image; source and reuse rights remain in review.
  - Daejeon Lee Ungno Museum now uses the Daejeon City photo archive's explicitly named 2026 exterior photograph. The record notes both the page's Public Nuri Type 1 label and the archive's separate attribution/no-alteration/permission conditions, so reuse is not marked commercially cleared.
  - Busan UN Sculpture Park now points to the VisitKorea image showing an actual sculptural installation on the park walkway.
  - Incheon Open Port now points to Incheon City's tourism site photo of the Qing/Japanese concession-boundary staircase and surrounding historic street; the old TripPose URL remains as history.
- Post-merge catalog: **200 locations**, **307 photo candidates**, **13 active place-match review candidates**, **306 reuse-rights candidates still not clearly cleared**, and **0 structural or selected-reference errors**. All edited candidates remain alternates; existing selected primary/reference IDs are unchanged.
- Official/venue source pages checked: Daelim Changgo venue photo and place description (https://visit.seoul.kr/en/places/daelim-changgo); Daejeon City's Lee Ungno Museum photo record (https://photo.daejeon.go.kr/prog/photodbCate/74387/view.do?cateNo=50&mno=sub01_05) and its separate photo-use rules (https://photo.daejeon.go.kr/kor/sitemap_15.do); VisitKorea's UN Sculpture Park photo page (https://www.koreatriptips.com/en/tourist-attractions/2953407.html); Incheon tourism's Qing/Japanese Concession Boundary Steps (https://chn-itour.incheon.go.kr/cmn/board/BBSMSTR_000000000081/2052bbsDetail.do).


## Release 2026-10-16 · Photo audit batch 6 — source-matched references
- Created safety branch `backup/pre-image-audit-batch6-2026-10-16` from current main commit `1c4850fabfa2a8e81eb8ca10cd4fac9765639613` before edits.
- Confirmed seven active candidate/source pairs and updated photo descriptions: Solgeo Art Museum interior (NOL World photo listing); Arte Museum Gangneung immersive ocean projection (official museum location page); CJ ENM Studio Center's virtual LED stage (FNN article caption); Hyangho Beach's BTS-related bus stop (Triple location entry and visible BUS STOP sign); Daegu Art Museum's Lee Kang-so retrospective view (AAArt caption explicitly credits Daegu Art Museum); and Iksan Prison Film Set's corridor and cells (article source and visible set layout); Jangnim Port's colorful facade walkway (replaced the previous higher-angle candidate with a ground-level Triple photo).
- Two candidates were retired from active use without deleting their source history: the unidentified Hangang bridge-pier photo (bridge/accessible segment not identifiable) and an old Suwon downtown alley photo (exact Haenggung-dong location not verifiable). Both stay marked as unverified in their preserved rejected history.
- No locations were added and no selected primary/reference-photo IDs were changed. The shared catalog remains **200 places**, **307 candidate records including history**, **4 active place-match review candidates**, **306 image candidates whose reuse rights are not clearly cleared**, and **0 structural/selected-image errors**.
- The Korean user manual was updated with the same audit summary and its link query changed to `v=20261016-106` to avoid stale browser cache. Application JSON is requested with no-store/time-varying URLs, so the app shell build remains 20261016-100.
- Source pages reviewed: Solgeo Art Museum/NOL World (https://world.nol.com/en/content/pois/29e25710-c7f9-46eb-91f6-a40319ef80cb); Jangnim Port photo reference (https://triple.guide/articles/45dad00e-703f-4633-bad0-29c3ae19f288); Arte Museum Gangneung (https://cn.artemuseum.com/GANGNEUNG); FNN CJ ENM Studio Center (https://www.fnn.jp/articles/-/385893?display=full); Hyangho Beach (https://triple.guide/attractions/2bddb32c-d3da-43d2-ab15-197ddf317121); Daegu Art Museum exhibition photo caption (https://m.aaart.co.kr/m/m_article.html?no=8704); Iksan Prison Film Set article (https://v.daum.net/v/KaxpzHBW82?f=p).


## Release 2026-10-16 · Photo audit batch 7 — last unresolved source matches
- Created safety branch `backup/pre-image-audit-batch7-2026-10-16` from pre-audit main commit `9ac5a05b8a2bd0e62fd018d3e6012f9bc65abb8f`.
- Linked the official Leeum Museum of Art lobby/rotunda photo from the museum's own introduction page; the direct image shows the curved light well, columns, and reflective floor. The candidate's previously blank image URL is now populated.
- Replaced the broken Sodaeheon–Hoyeonjae heritage-house image with a direct photograph on Daejeon Metropolitan City's official Daejeon Is You page, within the section specifically titled ‘소대헌·호연재 고택’.
- Confirmed the Nakdong Estuary Eco Center photo against the Chosun Ilbo original caption, which names the center exterior inside Eulsukdo Ecological Park and attributes the image to Busan City.
- Updated Daecheongho Meditation Garden's selected reference to a ground-level photo showing the actual garden sign, timber boardwalk, and circular platform. The matching high-angle Joongdo image is retained as a rejected duplicate history record.
- Post-merge: **200 locations**, **307 candidate records**, **0 active location-match review candidates**, **306 reuse-rights candidates not clearly cleared**, and **0 structural/selected-photo errors**. No selected reference points to a rejected candidate, and every photo candidate now has a URL or stored asset reference.
- Source pages: Leeum Museum official gallery/interior photo (https://www.leeumhoam.org/leeum/info/museum); Daejeon City's official traditional-house article (https://www.daejeon.go.kr/its/ItsdjNormalboardView.do?boardGubun=itsdj01&boardSeq=3548&menuSeq=5929&pageIndex=1&searchCondition=TOTAL&searchKeyword=%EC%82%AC%ED%9A%8C%EC%A0%81%EA%B2%BD%EC%A0%9C); Chosun Ilbo's Nakdong Estuary Eco Center reopening photo (https://www.chosun.com/national/regional/yeongnam/2024/05/02/4WK2RC6YVFFHZAF77ANANRPHBU/?outputType=amp); Daecheongho Meditation Garden photo article (https://njob-crew.com/entry/%EC%98%AC-%EC%97%AC%EB%A6%84-%EC%82%AC%EC%83%89%EC%9D%98-%EC%84%AC%EC%9C%BC%EB%A1%9C-%EB%96%A0%EB%82%98%EC%9A%94-%EB%8C%80%EC%B2%AD%ED%98%B8-%EB%AA%85%EC%83%81%EC%A0%95%EC%9B%90-%ED%9E%90%EB%A7%81%EC%97%AC%ED%96%89-%EC%97%B4%EB%A6%B0%EA%B4%80%EA%B4%91%EC%A7%80).


## Release 2026-10-16 · Rights metadata normalization batch 8
- Created safety branch `backup/pre-rights-metadata-normalization-2026-10-16` from pre-change main commit `722de0319f32f301bead8899419b514fbca46dc5`.
- Normalized 125 legacy candidate records in the raw source catalog that lacked standard rights-status fields. Existing rights descriptions, license strings, source pages, labels, and image choices were preserved. Added `rightsStatusSource` to record whether a normalized value came from a legacy rights field, a license field, an existing review label, or a conservative default.
- The merged 200-place catalog now has a recognized rights-status value for all 307 candidate records: 54 unknown; 11 attribution-required; 82 reference-only; 159 review-required; 1 public-domain dedication. **0 status fields missing**. The independent review queue remains **306 candidates**, because a normalized metadata value is not legal clearance.
- Enhanced `tools/validate.py` so any future candidate without a recognized standard rights status fails quality validation; regenerated `tools/report.md` with status completeness and an explicit note that normalization does not grant reuse permission.
- Updated the Korean user manual and changed its link query to `v=20261016-108` for cache freshness. Did not change app functionality, place IDs, selected photo IDs, or the 200-place target.
- Next review should prioritize explicit license evidence first, then sources with separate image-use rules. External URL runtime loading and real iPhone rendering remain separate checks.


## Release 2026-10-16 · Image-load reliability batch 9
- Created safety branch `backup/pre-image-load-reliability-batch9-2026-10-16` from pre-change main commit `7988ad8b70e783d2dd6540043475ba855291ca6b`.
- The preceding desktop browser audit loaded **199/200** active reference images; Daecheongho Meditation Garden was the only missing image. Its Kakao CDN URL and the wsrv thumbnail fallback both failed in the audit.
- Replaced the selected Daecheongho reference URL with the direct image URL from Daejeon Metropolitan City's official Story Daejeon blog, republished on Wello. The image shows an entrance deck, trail-sign board, and lake; the source page is retained. The failed URL/source are saved in `lastFailedImageUrl` and `lastFailedSourcePageUrl`.
- Added smoke-test release gates: desktop audit fails on any active image missing-state; Daecheongho must load from the verified replacement host; mobile archive audit also fails on any missing-image card.
- No place count, selected photo ID, or rights status changed. Daecheongho rights status remains `review-required` pending separate review.
- Source page: https://www.welfarehello.com/community/hometownNews/0649c2c6-11f2-4650-acd7-3e300a6daf5a (the page identifies the source blog as Daejeon Metropolitan City's Story Daejeon).
- Quality check and Pages deployment for this batch are pending.


## Release 2026-10-16 · Image-load reliability batch 10
- Created safety branch `backup/pre-paradise-city-image-repair-batch10-2026-10-16` from pre-change main commit `5cfaf04c94cb827704883d985125f235568b57a3`.
- Found a second external-image issue after batch 9: Paradise City’s UniqHotels pumpkin image URL returned **HTTP 404**, despite the previous run snapshot reporting it as still loading. Replaced it with the working Esquire Korea direct image file `https://www.esquirekorea.co.kr/resources/online/online_image/2026/06/16/2d093ae9-3102-4d19-b337-8762f7f80362.png`.
- The source article (2026-06-23) identifies the photo as Yayoi Kusama’s “Great Gigantic Pumpkin” and credits the image source to Paradise City. The candidate title and view type now accurately describe the indoor large-scale sculpture, lobby and reflective floor.
- Preserved the failed URL and source in `lastFailedImageUrl` and `lastFailedSourcePageUrl`. Rights status was not changed; public reuse and commercial shoot permissions are still not cleared.
- Extended desktop and mobile photo audits to require this specific candidate to load from the replacement image host. Place count remains 200.
- Source checked: https://www.esquirekorea.co.kr/article/1904479 (Esquire Korea, 2026-06-23, photo source credited in caption to Paradise City).
- Quality test and Pages deployment are pending.


## Release 2026-10-17 · Image-load audit batch 11 — targeted retry recovery
- Created safety branch `backup/pre-image-load-audit-batch11-recovery-2026-10-17` from pre-change main `ed87f1494c594886ae7e456cc1c6b47516abadd6`.
- Quality run #579 passed after the three previously pending desktop cards were scrolled into view and checked individually. Desktop audit: **200/200 loaded**, **0 missing**, **0 pending**, and **0 held**. Daejeon Video Special Effects Town, Gyeonggi Sangsang Campus, and MBC studio rental all returned loaded states. MBC loaded via the images.weserv.nl fallback using the official MBC source image; its original image URL and rights status were not changed.
- The first mass-eager test attempt (#578) was reverted: forcing all 200 remote images eager at once produced artificial concurrency and 100 pending cards. The recovered test keeps the usual lazy-load sweep and only forces the three priority cards individually.
- Pages deployment #621 succeeded. No catalog/photo source data changed; the shared catalog remains 200 places, 307 image candidate records and 306 reuse-rights candidates not clearly cleared.
- Mobile screenshot audit from #579: 200 archive cards, 197 loaded at the 7-second broad snapshot, **0 missing**, **3 still loading** (Seoul City Hall Seosomun Museum, Suwon Museum of Art Haenggung Main, MBC rental studio). The next batch adds the same individual in-view retries on mobile, followed by an explicit assertion that these three finish as loaded photos.


- Created safety branch `backup/pre-image-load-audit-batch11-2026-10-17` from pre-change main `ed87f1494c594886ae7e456cc1c6b47516abadd6`.
- Baseline quality run #577 recorded 197/200 active images loaded, zero missing, and three still loading. Those records were Daejeon Video Special Effects Town, Gyeonggi Sangsang Campus, and MBC studio rental; each retained fallback URLs and did not enter the explicit missing state.
- First test-only attempt to force all 200 images to `loading=eager` caused an artificial concurrency pile-up: only 100 loaded while 100 remained pending, then the new assertion failed. This did not prove 100 bad URLs; it showed that forcing every external image simultaneously is not a reliable runtime test.
- Recovery: restored the normal full-grid lazy-load sweep and its previous 30-second settling window. The test then scrolls only the three previously pending cards into view one at a time, temporarily requests eager loading on each, waits up to 25 seconds for a loaded or explicit missing state, and asserts that these three all finish successfully. The prior all-grid pending assertion and mass eager-loading mobile test were removed.
- No catalog or source-photo data was changed. Pages deployment succeeded for the first instrumentation commit; its quality run failed only because the forced-eager audit left 100 unresolved loading states. The targeted-retry version is now queued for quality validation.


## Release 2026-10-17 · Image-load audit batch 12 — targeted mobile image retries
- Created safety branch `backup/pre-mobile-image-load-audit-batch12-2026-10-17` from pre-change main `07fba14d446045820606d291fbeb0655a0705970`.
- Mobile archive audit previously had 197/200 images loaded after seven seconds, zero missing and three still loading: Seoul City Hall Seosomun Museum, Suwon Museum of Art Haenggung Main, and MBC studio rental. Desktop targeted retries in batch 11 demonstrated that these cards should be tested individually instead of forcing all remote images at once.
- Added the same per-card, in-view eager retry and 25-second success-or-explicit-missing wait for those three mobile cards. Added a release assertion requiring all three to finish loaded with no missing/loading flags after retries.
- This is test/checkpoint-only; photo source records and the 200-place catalog remain unchanged. Quality test and Pages deployment are pending for this batch.


## Release 2026-10-17 · Rights metadata audit batch 13 — explicit CC licenses
- Created safety branch `backup/pre-license-metadata-batch13-2026-10-17` from main commit `84e5215cf413ce7202db4d865e8ddc7d3c4560cc`.
- Added the source-page evidence URL, canonical license URL, creator/attribution and consistent license label to 12 file-level licensing records. Existing rights statuses were preserved; no conditionally licensed photograph was relabeled as unrestricted/commercially cleared.
- Verified the file-specific CC BY, CC BY-SA or CC0 statements on Wikimedia Commons and the CC BY label on the Gongu record. The 11 original conditional-license records include one image whose scene is actually a salt-field model inside Siheung Gaetgol Ecology Park's information centre, not the outdoor Sorae wetland place. That image is now rejected/mismatch history, retains its license metadata, and no longer remains selected.
- Restored Sorae Wetland's reference to the official Incheon City windmill/wetland photo through an image-proxy preview; the direct original URL is preserved in `previousImageUrl`. Its rights status stays `review-required` pending photo-specific conditions.
- Strengthened `tools/validate.py` to require license/evidence URLs for conditional-license and CC0 records, and creator/attribution for conditional licenses. The report now separates active conditional licenses from the active images still needing further rights/conditions review.
- Expected totals: 200 places, 307 photo records, 0 active place-match review records, 0 candidates without an image URL/path, 10 active conditional licenses, 1 active CC0, 11 active candidates with license/source evidence links, 1 retired licensed-image history record, and 267 active candidates needing additional rights/conditions review.
- Quality run #580 (mobile targeted photo retries) was still in progress when this batch was prepared. Desktop run #579 verified 200/200 loaded with zero missing/pending/held. Mobile baseline was 197/200 loaded after 7s, 0 missing and 3 loading; batch #580 added targeted retries for those three. Append its final result after CI.
- Source pages: Oil Tank Culture Park (https://commons.wikimedia.org/wiki/File:Oil-tank-culture-park.jpg); SeMA Bunker (https://commons.wikimedia.org/wiki/File:Yeouido_SeMA_Bunker.jpg); Culture Station CC BY 4.0 (https://commons.wikimedia.org/wiki/File:%EB%AC%B8%ED%99%94%EC%97%AD%EC%84%9C%EC%9A%B8284_2024.jpg); Culture Station CC0 (https://commons.wikimedia.org/wiki/File:Culture_Station_Seoul_284_(2014_08_05).jpg); Nodeul Island (https://commons.wikimedia.org/wiki/File:Nodeulseom_(14005438206).jpg); MMCA Seoul (https://commons.wikimedia.org/wiki/File:MMCA_Seoul.jpg); Gwangmyeong Cave (https://commons.wikimedia.org/wiki/File:Gwangmyeong_Cave.jpg); Starfield Library (https://commons.wikimedia.org/wiki/File:%EB%B3%84%EB%A7%88%EB%8B%B9%EB%8F%84%EC%84%9C%EA%B4%803.jpg); Incheon Art Platform (https://commons.wikimedia.org/wiki/File:%EC%9D%B8%EC%B2%9C%EC%95%84%ED%8A%B8%ED%94%8C%EB%9E%AB%ED%8F%BC_%EC%A4%91%EC%95%99%EA%B8%B8_Incheon_Art_Platform,_Central_way.jpg); Sorae model (https://commons.wikimedia.org/wiki/File:Replica_of_Sorae_Salt_Field.jpg); Daegu Art Museum (https://commons.wikimedia.org/wiki/File:Daegu_Art_Museum.jpg); Seonyudo Park (https://gongu.copyright.or.kr/gongu/wrt/wrt/view.do?menuNo=200018&wrtSn=11179916).


## Release 2026-10-17 · Image-load audit batch 14 — retry all pending mobile cards individually
- Created safety branch `backup/pre-mobile-image-load-audit-batch14-2026-10-17` from pre-change main `ec24b9568fc50c07d183dd39538a30e9095f917b`.
- Quality run #580 passed the three priority mobile photo checks but its 7-second snapshot still showed 191/200 mobile images loaded, zero missing and nine still loading. This was an incomplete loading snapshot rather than a confirmed missing-photo state.
- Reworked the mobile browser audit so it captures pending cards after the initial snapshot, retries each pending card one at a time in the viewport, waits up to 20 seconds for either a loaded image or the explicit missing-photo fallback, then requires the final mobile archive to contain zero loading and zero missing states. This avoids the prior pattern of forcing the same few hard-coded IDs only.
- No place data or photo assignment was changed. Quality run #581 was running the previous test while this update was prepared. This commit starts a new full quality and Pages deployment cycle.


## Release 2026-10-17 · Report disclaimer sync hotfix batch 15
- Created safety branch `backup/pre-report-disclaimer-fix-batch15-2026-10-17` from main `c5ee14e096a3f1c1233e7f047286ef85fe3b5db2`.
- Quality run #581 verified the 200-place catalog and photo/license validation successfully but then failed the report-consistency step because the Python report generator still emitted the older generic rights disclaimer while the checked-in `tools/report.md` had the more precise CC BY/CC BY-SA/CC0 explanation. The report body and actual counts matched; the discrepancy was one explanatory paragraph.
- Updated the generator's disclaimer to match the checked-in report exactly. No place data, photo URL, selected photo, license metadata, or status was changed.
- Quality run #582 is separately testing the per-card mobile loading retry introduced in batch 14. A new quality/Pages cycle will validate this report hotfix and the broader mobile retry logic.


## Release 2026-10-17 · Sorae wetland photo URL repair batch 16
- Created from main commit `93266c1c2e11e258b1f01034726f23486361ae99` after quality run #582 failed during the desktop photo audit because the Sorae reference candidate's preview URL was wrapped again by the app's fallback proxy, creating a nested proxy URL and a confirmed missing-image state.
- Replaced the nested proxy preview with the separate direct image endpoint used by Incheon Tour's official Sorae Wetland Ecological Park detail page: `https://itour.incheon.go.kr/common/viewImg.do?imgId=DBI21121615182359828`. The new photo visibly shows an actual wooden windmill and wetland boardwalk.
- Preserved the original Incheon City direct URL in `previousImageUrl`, the failed nested proxy in `lastFailedImageUrl`, and the earlier source page in `previousSourcePageUrl`. The official Incheon Tour detail page now supplies `sourcePageUrl`; usage rights remain `review-required` because photo-specific reuse conditions are not yet verified.
- The licensed Wikimedia CC BY 3.0 Sorae salt-field model remains `rejected/mismatch` with all author/license metadata preserved; it is no longer the selected reference.
- Catalog remains 200 locations and 307 photo candidate records. Quality run #583 is testing the report-disclaimer hotfix; this URL change triggers another desktop/mobile verification cycle.


## Release 2026-10-17 · Image-load repair batch 17 — Cheongsapo and Sorae
- Created safety branch `backup/pre-image-load-repair-batch17-2026-10-17` from pre-change main commit `94b46327851a43aeeba6732a5a3ae1a196ad0e67`.
- Latest desktop browser test (#584) failed on two active images after all fallback URLs had been exhausted: Busan Cheongsapo Daritdol Observatory and Sorae Wetland Ecological Park. The audit had 198/200 images loaded and 2 in the explicit missing state.
- Replaced Cheongsapo's failing Busan City image API with a Klook CDN photo showing the curved glass walkway and sea. The Busan City page that documents the observatory is stored as `locationEvidenceUrl`. The original image URL and source remain in history fields.
- Replaced Sorae's failing direct Incheon Tour image URL with a Daum CDN image from an article identifying Sorae Wetland Ecological Park and showing boardwalk, reeds, and windmill. Failed URLs remain in history fields/notes.
- Preserved `rightsStatus=review-required` for both candidates. This photo-reference fix does not grant image reuse rights or commercial-shoot permissions.
- Updated image fallback helpers so URLs already hosted by `images.weserv.nl` or `wsrv.nl` are not wrapped in another proxy URL.
- Added regression assertions for the expected replacement source candidates and loaded states on desktop/mobile. Desktop audit now fails if active images remain loading after targeted retries.
- Bumped synchronized app shell/service-worker/manifest/root-entry build ID to `20261017-117`; user manual link query also uses `v=20261017-117`.
- Place count stays **200** and candidate count stays **307**. The new CI cycle must pass before treating this repair as verified.
- Sources: Klook Busan day-tour image (https://www.klook.com/en-GB/activity/74132-busan-oneday-tour-busan/); Busan City Cheongsapo context (https://www.busan.go.kr/news/storyreport/view?dataNo=70451&gugun=Prev); Daily Travel Sketch Sorae image page (https://v.daum.net/v/9CoaMZmjHO); previous Incheon Tour source remains in photo history.


## Release 2026-10-17 · Desktop pending-image retry batch 18
- Created safety branch backup/pre-desktop-pending-retry-batch18-2026-10-17 from main commit cd216b25a0ab070f4f7d6f4c94b5eae506d3be9f.
- Batch 17 source replacement and nested-proxy guard passed JavaScript syntax validation, but quality run #586's desktop browser audit found 199/200 photos loaded, 0 missing, and 1 still in a loading state: Seoul City Hall Nam-Seoul Museum exterior. This is a delayed/fallback-in-progress image, not a confirmed broken URL.
- Updated desktop smoke audit to identify only cards still pending after the regular 30-second lazy-load sweep and revisit them one at a time. This mirrors mobile retry behavior and avoids triggering unnecessary requests for all 200 external URLs.
- Kept explicit failure rules for missing photos, images still pending after retry, and the two repaired images (Cheongsapo and Sorae) on both desktop and mobile. No source photo URL, selected reference ID, rights status, or place count changed in this test adjustment.
- User manual now documents the delayed-image review procedure; its navigation link query is v=20261017-118.
- App shell build ID remains 20261017-117; only the manual link cache query and test retry logic changed.
- Quality run #586 reported the one pending Nam-Seoul Museum photo with 2 fallback URLs remaining; run #587 after this patch will confirm the targeted retry resolves it or expose the final broken URL.


## Verification completed · quality run #587 and Pages deployment #629
- Quality workflow run #587 passed: JavaScript syntax, catalog/report checks, desktop/mobile UI smoke tests, safe backup merge, photo asset publication recovery, device sync safety, and legacy audit tests all passed.
- Desktop browser audit: **200/200 images loaded**, **0 missing**, **0 pending**.
- Mobile archive audit: **200/200 images loaded**, **0 missing**, **0 still loading**.
- Overall browser smoke test: **PASS**, with no uncaught page JavaScript errors.
- The two formerly failing selected reference photos now load at their final image URLs: Cheongsapo Daritdol Observatory (Klook CDN) and Sorae Wetland Ecological Park (Daum CDN). Proxy nesting is prevented in the app fallback helper.
- Pages deployment run #629 succeeded. App build ID: `20261017-117`; manual link query is now `v=20261017-119`.
- Catalog remains **200 places** and **307 image candidate records**. Rights metadata remains separate from image loading: both replaced photo candidates still have `rightsStatus=review-required`; physical iPhone Safari/PWA acceptance still needs testing on the user's device.
- Run links: https://github.com/casio8000/FRAME_ATLAS/actions/runs/38986800180 and https://github.com/casio8000/FRAME_ATLAS/actions/runs/38986800351.


## Release 2026-10-17 · Batch 19 — proxy-aware Paradise City source assertion
- Quality run #587 fully passed on the app/test source: desktop audit 200/200 loaded, 0 missing, 0 pending; mobile archive 200/200 loaded, 0 missing, 0 loading; smoke PASS; no page errors. Pages run #629 also passed.
- A second run (#588), triggered only by the final documentation/cache-query commit, again showed 200/200 desktop images loaded with no missing or pending images, but failed one overly strict Paradise City URL assertion.
- The failure artifact confirms the image loaded successfully through the approved fallback proxy URL. The resolved proxy URL contained the encoded original Esquire Korea image path; the test incorrectly searched the un-decoded URL string for the original hostname.
- Corrected the regression test to decode the rendered image URL before checking for the verified Esquire original path. This accepts either direct rendering or the app's fallback proxy while still verifying the source identity, and does not weaken the load-success assertion.
- No app code, photo URL, catalog entry, selected reference ID, rights status, or place count changed in this test-only repair. A final quality run is pending.
- Reference evidence: https://www.esquirekorea.co.kr/article/1904479 and the #588 browser artifact (desktop 200/200 loaded, 0 missing, 0 pending).


## Release 2026-10-17 · Batch 20 — mobile retry stability
- Created safety branch backup/pre-mobile-detached-retry-batch20-2026-10-17 from main commit f1996d9f0b384d0d56597f7b16a5801315b09124.
- Quality run #589 desktop photo audit reported 200/200 loaded with 0 missing and 0 pending. The mobile test failed during an image retry because a card element had been replaced by the app while the retry was scrolling it into view: Playwright raised "Element is not attached to the DOM" at the mobile retry loop. This was a browser-test locator race, not an image-load failure.
- Updated mobile retry to re-query the current card by stable location ID before each action, and catch a detach between the scroll/eager-load actions. The final archive audit still requires 0 missing and 0 loading cards, and specifically requires both repaired images to load.
- Kept the Paradise City assertion proxy-aware by decoding the rendered URL before checking the verified Esquire original path.
- No catalog records, source URLs, selected IDs, rights state, app JavaScript, or build ID changed. The current place and photo counts stay 200 and 307.
- User manual adds a short note explaining that automatic photo audits retry delayed cards sequentially; its link query moves to v=20261017-120.
- Quality run #589 failure artifact: browser audit had 200/200 loaded, 0 missing, 0 pending on desktop; it failed only because a mobile card detached during the retry. Run #590 should re-confirm mobile audit with the more robust locator flow.


## Release 2026-10-17 · Batch 21 — photo attribution UI
- Created safety branch `backup/pre-photo-attribution-ui-batch21-2026-10-17` from pre-change main commit `8095878ad4ed3de536eed24c289b897ba4b20413` before modifying the public photo display.
- Added a visible attribution block to selected/reference-photo detail when the image has an explicit CC BY/CC BY-SA or CC0 status: creator, license name, and a link to the exact license-evidence page. A separate sentence reminds users that photo-file licensing does not authorize photography at the location.
- Added a compact creator/license line to alternate-photo gallery cards for explicitly licensed images. Images without explicit licensing keep their existing usage-warning behavior and are not relabelled as cleared.
- Added a real-browser regression assertion for Incheon Art Platform's selected Wikimedia Commons photo: the detail must display creator `이강철`, `CC BY-SA 3.0`, and the exact Commons file-evidence URL.
- Sources checked: Oil Tank Culture Park T6 file page (https://commons.wikimedia.org/wiki/File:Oil-tank-culture-park.jpg, CC BY-SA 4.0); SeMA Bunker (https://commons.wikimedia.org/wiki/File:Yeouido_SeMA_Bunker.jpg, CC BY-SA 3.0); Nodeulseom (https://commons.wikimedia.org/wiki/File:Nodeulseom_(14005438206).jpg, CC BY-SA 2.0); Incheon Art Platform (https://commons.wikimedia.org/wiki/File:%EC%9D%B8%EC%B2%9C%EC%95%84%ED%8A%B8%ED%94%8C%EB%9E%AB%ED%8F%BC_%EC%A4%91%EC%95%99%EA%B8%B8_Incheon_Art_Platform,_Central_way.jpg, CC BY-SA 3.0).
- App shell/service-worker cache build changed to `20261017-121`; manual link query changed to `v=20261017-121`. User manual now documents the same attribution behavior.
- The 200-place target, candidate IDs, external image URLs, and rights status values were not changed. Awaiting quality run and Pages deployment.


## Latest continuation checkpoint — catalog integrity and confirmed cache fix

- User-confirmed PC fix: latest 2.0 screen renders normally, newest-location section is visible, and the count is 200. Close the earlier PC 201/stale-screen incident unless it recurs.
- Current deployed app build at this checkpoint: `20261017-124`.
- Quality run #595: PASS — https://github.com/casio8000/FRAME_ATLAS/actions/runs/38995171458. Pages deployment #641: SUCCESS — https://github.com/casio8000/FRAME_ATLAS/actions/runs/38995171160.
- Fresh source-data cross-check matched `tools/report.md`: base 151, supplement 67, name/ID matches 18, appended 49, integrated 200 places, 307 photo candidates; duplicate IDs 0; missing required place fields 0; duplicate candidate IDs 0; broken selected-photo references 0; selected photo mismatch/rejected references 0; missing photo URLs/paths 0; missing standardized rights status 0; active photo-match review candidates 0.
- Rights review remains separate: 267 active photo candidates still need conditions/reuse review. This is not a place-data or selected-image-link structural error and must not be represented as automatically cleared for commercial reuse.
- Added static regression checks in `tools/check_app.py` for the exact failure pattern: app-shell asset versions match `app-build`; service-worker activation refreshes only app-entry pages; identical builds do not cause repeated navigations; activation does not wait for page navigation; manual pages are not rewritten to the home screen. These checks passed in quality run #595.
- Next steps: (1) confirm new quality run passes; (2) inspect remaining non-selected candidate history only where it can affect the displayed reference photo; (3) keep the 200-location count frozen during verification; (4) test the full catalog on actual iPhone when accessible; (5) plan independent-repository migration only after the existing project and deployment path are backed up and validated.


## 2026-10-17 — Latest validation results and documentation alignment

- User-confirmed: PC start → home shows the latest-added section and a total of 200 places. Treat the stale-PC/count issue as resolved unless it recurs.
- Build `20261017-124` is the current deployed app. [Quality run #595 passed](https://github.com/casio8000/FRAME_ATLAS/actions/runs/38995171458) and [Pages deployment #641 succeeded](https://github.com/casio8000/FRAME_ATLAS/actions/runs/38995171160).
- Desktop/mobile Playwright checks all report 200 place rows; image audits report 200/200 loaded, 0 missing, 0 pending/loading, and 0 uncaught page errors.
- Static cache-regression guard is now part of `tools/check_app.py`, and the new checks passed in run #595.
- `v2/README.md` now has a dated current-state section and explicitly labels the 34-location/36-photo figures as the initial 2026-10-13 snapshot, not current totals.
- Current merged catalog remains 200 locations / 307 photo candidate records; no location entries or photo assignments were changed in this documentation update.
- Outstanding: actual iPhone full-catalog visual check; independent `FRAME_ATLAS_v2.0` repository/deployment migration after a safety backup plan. Do not claim real iPhone acceptance from browser emulation.


## Photo quality audit batch 22 — 2026-10-17

- Audit record: `v2/IMAGE_AUDIT_BATCH22_2026-10-17.md`.
- Recent-14 spot-check: 13 selected photos visually checked against place identity/source context. National Maritime Museum image remains a separate visual verification target; no mismatch has been asserted without sufficient evidence.
- Idang Art Museum: the selected red-brick exterior is consistent with the former Yeonghwa-jang bathhouse/inn building converted into the museum. The banner/wires weaken its editorial value, not its place identity; preserve it as a valid reference until a verifiable stronger candidate is found.
- Next photo improvement batch: (1) replace watermark-bearing Glass House image only if a clear, exact-location alternative is confirmed; (2) seek a less banner-dominated Suchang Youth Mansion photo; (3) seek a more architectural Aegibong image; (4) add a stronger interior/outdoor reference for Idang; (5) visually verify National Maritime Museum's selected image and source.
- Catalog remains frozen at 200 unique places / 307 candidate records. This audit did not change catalog data or photo IDs.


## Follow-up image-quality fix — batch 22 extension (2026-10-17)

- Kept the national catalog frozen at 200 locations. Three selected-reference image URLs were improved without changing place IDs, candidate IDs, or primary/reference pointers: Glass House (unwatermarked architecture image), Idang Art Museum (interior archive photo showing tilework and exposed plumbing), and Aegibong (curved skywalk with explicit place-name sign).
- Old images and source metadata are retained in each candidate's `previousImageUrl`, `previousSourcePageUrl`, `previousSourceName`, and `previousTitle` fields. No extra candidate records were added, so the total remains 307.
- Status is still `reference-only` for these images; this is a scouting image change, not rights approval or filming permission.
- Run the complete quality check and verify PC/mobile 200/200 photo loading before merging this change into `main`.


## Photo refinement validation — completed

- Pull request: https://github.com/casio8000/FRAME_ATLAS/pull/6
- PR #6 merged; quality #599 passed and Pages #644 succeeded. Main quality #600 subsequently passed; PR #7 quality #601 and main quality #602 passed; Pages #647 succeeded.
- Added exact-image regression assertions for Glass House, Idang Art Museum, and Aegibong: expected candidate IDs/source hosts, confirmed place match, preserved previous image URL for rollback, and reference-only rights state.
- Updated manual section 22 with the visible reference-photo changes. The previous location IDs, candidate IDs, selected primary/reference IDs, and counts (200 places / 307 candidates) are unchanged.
- Three photo replacements are already merged and deployed; do not revert unless a new source/matching defect is found.


## Merge and deploy completion — three same-location reference-photo improvements

- PR #6 merged to main as `4d53b9f38b5b0a68dd745b89c0ef98ffbb6e442b`: https://github.com/casio8000/FRAME_ATLAS/pull/6.
- Final PR quality test #599 passed: https://github.com/casio8000/FRAME_ATLAS/actions/runs/38996198372. It reported desktop 200/200 loaded, held/missing/pending 0; mobile 200/200 loaded, loading/missing 0; all desktop/mobile home/archive place rows at 200; smoke PASS; no uncaught JS errors.
- Pages deployment #644 succeeded for the merge commit: https://github.com/casio8000/FRAME_ATLAS/actions/runs/38996377658.
- Replaced photo references: Glass House (unwatermarked facade/cantilever/grass-slope view), Idang Art Museum (historical bathhouse-tile/exposed-pipe interior photo), and Aegibong (curved skywalk with place-name sign). Same candidate IDs and same primary/reference IDs; previous image/source/title retained for rollback.
- All three photos remain `reference-only`; no reuse/shooting permission is implied. Counts remain 200 places and 307 photo candidate records.
- Main quality run #600 later passed. PR #7 quality run #601 passed; main quality #602 passed; Pages deployment #647 succeeded.
- Next priorities: continue source/image quality review of any remaining weak selected photos, review rights/use-condition metadata separately, and verify the whole catalog on a physical iPhone. National Maritime Museum and Suchang Youth Mansion now have Korea Tourism Organization reference photos from PR #7. Do not add places; keep the total frozen at 200.


## Photo quality batch 23 — merged and deployed

- Busan National Maritime Museum now uses the Korea Tourism Organization's curved-roof/tower exterior reference. Daegu Suchang Youth Mansion now uses the KTO interior reference showing weathered concrete, exposed pipes and art posters.
- Candidate IDs, primary/reference pointers and place IDs remain unchanged. Prior image/source/title metadata is available for rollback; both rights states remain `reference-only`.
- PR #7 merged; quality checks #601 and #602 passed; Pages deployment #647 succeeded. PC/mobile audits reported 200/200 images loaded, 0 missing/loading/pending and 0 page errors.
- No new locations; total remains 200 places / 307 candidate records.


## Final checkpoint after photo batch 23 — 2026-10-17

- Current deployed app build: `20261017-124`. PC cache issue was user-confirmed resolved.
- PR #6 / quality #599 / Pages #644: merged and successful. PR #7 / quality #601 / main quality #602 / Pages #647: merged and successful.
- Final 200-place browser audit: desktop 200/200 selected photos loaded; mobile 200/200 selected photos loaded; 0 missing/loading/pending; 200 rows in desktop/mobile home/archive views; smoke PASS; no page errors.
- Five same-location photo references improved: Jeju Glass House, Gunsan Idang Art Museum, Gimpo Aegibong Peace/Ecology Park, Busan National Maritime Museum, and Daegu Suchang Youth Mansion. Old image URLs/sources/titles are retained for rollback, and all five remain `reference-only`.
- Current data remains 200 locations / 307 photo candidate records. 267 active photo candidates still require rights/use-condition review; place/photo matching does not establish reuse permission.
- Next work: inspect remaining weak selected photos without adding places; continue separate rights-status review; verify the full catalog on a physical iPhone; then plan independent-repository migration after ensuring a complete backup.


## Active checkpoint — photo quality batch 24 (Yangju Chang Ucchin Museum)

- User confirmed the PC now displays normally: newest-place section visible, total 200. Do not reopen the resolved cache regression unless it recurs.
- Next photo-quality work started without adding locations. Yangju Chang Ucchin Museum's previous front-on reference is being replaced with a stronger architecture/landscape view from Divisare's project page for Chae-Pereira Architects: https://images.divisare.com/images/c_limit%2Cf_auto%2Ch_2000%2Cq_auto%2Cw_3000/v1/project_images/4436131/CHAE_PEREIRA_ARCHITECTS_9/chae-pereira-architects-chang-ucchin-museum.jpg.
- The source page identifies the project location as Yangju, Korea and credits the photo to Park Wansoon. The new composition includes the museum's white forms, forest, stone riverbank and bridge. Source: https://divisare.com/projects/257332-chae-pereira-architects-chang-ucchin-museum.
- Same place ID `gg-yangju-chang-ucchin-museum` and candidate ID `ref-yangju-chang-ucchin-museum-exterior-2020`; selected primary/reference pointers do not change. Previous URL/source/title/creator/viewType are preserved for rollback.
- rightsStatus=reference-only remains unchanged. No explicit image reuse license was verified. This is not approval for republication or commercial reuse.
- Regression test adds exact host/source page/photographer assertions and retains the general PC/mobile full-photo audit. Expected totals remain 200 locations / 307 candidates.
- Status update: PR #8 merged to main at `f1ed8a3d6ff7e673dcb37ce345ca4842d69970e4`; quality run #603 passed. Desktop and mobile audits each loaded 200/200 images, with zero missing/loading/pending photos and zero page errors. Post-merge Pages deployment success is not independently confirmed in this checkpoint; do not claim the image is live until that is verified.


## Batch 24 final validation — PR #8 merged (2026-10-17)

- PR #8: https://github.com/casio8000/FRAME_ATLAS/pull/8 — merged as `f1ed8a3d6ff7e673dcb37ce345ca4842d69970e4`.
- Quality run #603: PASS — https://github.com/casio8000/FRAME_ATLAS/actions/runs/38997993769.
- Automated PC/mobile audit: 200 rows in desktop home/archive and mobile home/archive; 200/200 images loaded in both audits; 0 missing/loading/pending; smoke PASS; no page errors.
- Source metadata and prior image rollback data are intact; candidate/place pointers did not change; `rightsStatus=reference-only` remains. Totals are 200 places / 307 candidate records.
- The GitHub tool used for this checkpoint can fetch PR-triggered quality runs but cannot list post-merge Pages deployment runs. Treat the source merge and quality pass as confirmed; Pages live deployment after merge remains unconfirmed here.


## Documentation/cache-key closeout — PR #9 (2026-10-17)

- Documentation PR #9 merged to main as `32f2ad04e65bc55e1d2ebc6ee3f7f7463b4552ba`: https://github.com/casio8000/FRAME_ATLAS/pull/9.
- Quality run #605 passed: https://github.com/casio8000/FRAME_ATLAS/actions/runs/38998368950. The browser suite, catalog validator, app/resource checks, backup merge, photo assets, per-device sync, and legacy-audit tests completed successfully.
- User manual link cache key is now `USER_MANUAL_KO.html?v=20261017-126`; app shell build remains `20261017-124`. No place records or photo candidate records changed in PR #9.
- Photo batch 24 remains merged in PR #8; quality run #603 passed with desktop/mobile audits at 200/200 images, 0 missing/loading/pending, and 0 page errors.
- Pages deployment status following the PR #8/#9 main-branch commits was not independently retrievable with the available GitHub workflow interface in this session. The prior separately confirmed deployment remains #647. Do not claim batch 24 is live until a later Pages deployment success is explicitly confirmed or the updated live site is inspected.
- Ongoing priorities: keep locations frozen at 200; review remaining selected-photo quality without adding locations; rights/use-condition status review remains separate from reference-image selection; complete actual iPhone whole-catalog acceptance when accessible; plan independent-repository migration only after backup and source/deployment validation.
