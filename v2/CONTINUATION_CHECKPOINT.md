# FRAME ATLAS 2.0 — Continuation checkpoint

Last updated: 2026-10-16 (Korea Standard Time) — app shell build 20261016-99; canonical count reconciliation and photo audit passed

## Current release
- Live path: https://casio8000.github.io/FRAME_ATLAS/v2/index.html
- Source path: `v2/` in the existing `casio8000/FRAME_ATLAS` repository.
- The older root app is preserved; do not edit or delete it while validating 2.0.
- This checkpoint records the work so a dropped ChatGPT connection does not require restarting the project from the beginning. Code changes are stored in Git commits, not only in the conversation.

## Current verified UI state
- Current integrated catalog count is 200 unique locations: base catalog 151 + supplement 65 − 16 ID/name matches = 200. This count is confirmed by the catalog merge/validation report. The latest 14 additions now each have a primary and reference image candidate assignment.
- GitHub Actions quality run #557 passed on build 20261016-99, including the desktop/mobile smoke suite, canonical count tests, unpublished local-draft preservation test, newest-14 photo-load check, catalog validation, report consistency, backup/photo/device-sync tests. Pages deployment #595 passed for the same build. The exact 200-count reconciliation is regression-tested; the actual user PC browser storage cannot be inspected remotely.
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
