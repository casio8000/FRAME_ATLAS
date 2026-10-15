# FRAME ATLAS 2.0 — Continuation checkpoint

Last updated: 2026-10-14 (Korea Standard Time)

## Current release
- Live path: https://casio8000.github.io/FRAME_ATLAS/v2/index.html
- Source path: `v2/` in the existing `casio8000/FRAME_ATLAS` repository.
- The older root app is preserved; do not edit or delete it while validating 2.0.
- This checkpoint records the work so a dropped ChatGPT connection does not require restarting the project from the beginning. Code changes are stored in Git commits, not only in the conversation.

## Previous baseline (v2.41; historical verification only)
- The prior checkpoint reported a browser smoke test for the then-current catalog and desktop/mobile navigation.
- Those prior results do **not** validate later changes to the 43-place development catalog. Run the current branch's updated browser smoke test before treating v2.42 as verified.
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


## Current development checkpoint — v2.42 (2026-10-14, not deployed)
- Development branch: `FRAME_ATLAS-v2.0-development`.
- Current files updated: `v2/index.html`, `v2/assets/app.js`, `v2/assets/app.css`, `v2/data/places.json`, `v2/sw.js`, and `tests/v2-browser-smoke.cjs`.
- Catalog: 43 active locations and 12 review-only candidates, with seven top-level regional filters: Seoul, Gyeonggi/Incheon Capital Area, Gangwon, Chungcheong, Jeolla, Gyeongsang, Jeju.
- Promoted Museum SAN and Asia Culture Center (Gwangju) from the review queue after adding matching location-reference photos. Their `primaryImageId` values remain empty.
- Added CJ ENM Studio Center, Daejeon Studio Cube, Busan Cinema Center, Haslla Art World, MMCA Cheongju / Culture Factory, Jeonju Film Studios, Suncheon Drama Film Set, and Bonte Museum.
- The photo policy separates (1) place/photo match, (2) cover/representative-photo selection, (3) image reuse rights, and (4) actual location/production permission. New reference images are not marked as approved covers.
- Regional filter logic includes the home shortcuts, home archive, list workspace, map, analysis and review queue. Region labels retain city-level detail in each place record.
- PWA update: service-worker cache and CSS/JS query versions bumped to `20261014-42`.
- Static source checks passed when the changes were authored: `v2/assets/app.js` parses as JavaScript, `v2/data/places.json` parses as JSON, and unique location IDs were checked.
- **Pending:** run browser smoke tests on desktop/mobile, verify the remote image loads, inspect screenshots and test-results artifacts, then fix failures. Direct iPhone Safari testing remains necessary after automated tests.
- No deployment change has been made to `main`; the legacy root app and the existing live site remain untouched.


## Current development checkpoint — v2.44 (2026-10-14, not deployed)

- Development branch: `FRAME_ATLAS-v2.0-development`. No changes were made to production `main` or the legacy root v5.x app.
- Catalog: 52 active places and 9 review-only candidates. Active region groups: Seoul 18, Gyeonggi/Incheon Capital Area 20, Gangwon 3, Chungcheong 2, Jeolla 3, Gyeongsang 4, Jeju 2.
- Newly activated/added records: F1963, LG Arts Center Seoul, LEEUM Museum, K-Film Studio 5 in Paju, SKT TEAM Studios XR/Volume Stage in Seongnam, Hapcheon Image Theme Park, Jeju Glass House/Seopjikoji. Existing Museum SAN was retained once, not duplicated.
- Confirmed place-matching images can be displayed as location-reference images. Representative/cover selection remains separate (`primaryImageId: null` for newly added records). Image-reuse rights, current operation/access, and commercial shooting/venue permission are separate and may still be unknown.
- Catalog structural checks: 52 active IDs are unique, each active record has a confirmed reference image candidate, each active record has no automatically approved primary photo, and regional totals sum to 52.
- HTML counters changed to 52 active places, 52 location-reference images, and 9 review-queue candidates. HTML asset query strings and service-worker cache are set to `20261014-44`.
- Browser regression test's required-location list now includes the seven new/promoted locations and verifies that the reference image has a source and an explicit rights status.
- **Still pending:** execute `node tests/v2-browser-smoke.cjs` in a working checkout with Playwright, review all desktop/mobile screenshots and image-load audit, inspect actual GitHub Pages deployment for the development preview, and conduct physical iPhone Safari checks. Do not mark v2.44 fully verified based solely on static source checks.
- No merge/deployment to `main` has been made. Root v5.x is unchanged.


## Current development checkpoint — v2.47 (2026-10-14 KST, not deployed)

### Current state
- Development branch: FRAME_ATLAS-v2.0-development in casio8000/FRAME_ATLAS. This is a branch, not an independent repository, and the changes are not live on production main.
- Active locations: 58. Review-only candidates: 9.
- Active counts by UI region: Seoul 19; Gyeonggi/Incheon Capital Area 20; Gangwon 3; Chungcheong 3; Jeolla 4; Gyeongsang 6; Jeju 3.
- Six unique additions relative to the 52-place checkpoint: KBS Arena, Bangju Church, Busan Cinema Studio, Daegu Opera House, Sejong Arts Center, and Jeonju Palbok Art Factory. The earlier 10-record add pass was deduplicated; same-place image candidates were merged into existing records rather than keeping duplicate places.
- Museum SAN remains active in Gangwon with a location-reference image and no automatically approved cover image.

### Photo policy
- A location-matched reference image can be shown as a place photo before the final editorial cover decision.
- A reference image does not imply approval as the representative cover. For the listed newly added/curated records, primaryImageId remains null.
- Rights/reuse permission and commercial shooting/venue permission are independent metadata. Unknown rights remain explicitly unknown. Jeonju Palbok Art Factory's Visit Jeonju image is marked as KOGL Type 2 (attribution required; commercial use prohibited).
- External links may block hotlinking or change. Static source availability is not a guarantee of browser-time image loading.

### Changes saved to this branch
- v2/data/places.json: added four unique records, retained existing KBS Arena and Bangju Church, added source/rights metadata, corrected CJ ENM exterior-photo attribution, normalized all regionGroup keys, and removed duplicate location records while retaining useful alternate image references.
- v2/assets/app.js, v2/index.html, v2/sw.js: unified Jeju label to 제주권 and bumped CSS/JS/service-worker cache versions to 20261014-47; initial counters updated to 58 active and 9 queued.
- tests/v2-browser-smoke.cjs: now asserts unique IDs, unique normalized names, schema agreement for seven region groups and all new/selected nationwide locations.
- tools/validate-catalog.mjs: deterministic static data/UI/cache validation.
- .github/workflows/v2-quality.yml: automated Node syntax, catalog validation, Playwright browser smoke test, and screenshot/image-audit artifact upload.
- This checkpoint and the README must be updated again after the first actual workflow run and any failure corrections.

### Validation evidence available now
- JSON parsing succeeded through the GitHub connector.
- Unique record ID check: passed.
- Duplicate normalized location-name check: passed.
- All 7 region groups present: passed.
- All 58 active records have a matching reference image candidate and explicit rights status: passed.
- Required locations checked in the smoke-test catalog list: each reference image match and rights metadata present; cover approval unset for the 14 core/new scouting records: passed.
- HTML button labels, initial counters and service-worker/CSS/JS cache version agreement: passed by source checks.
- Not yet verified: execution of node tools/validate-catalog.mjs in a runner, actual Playwright desktop/mobile smoke test, screenshot review, remote-image loading on the test browser, and physical iPhone Safari behavior. Do not mark the build tested or production-ready until the workflow logs confirm these results.
- No merge/deployment to main and no change to the legacy root v5.x app.

### Resume instructions
1. Read this section first.
2. Inspect latest commit and the v2-quality.yml workflow result before making more code edits.
3. Fix only concrete test failures; preserve source data and stable IDs.
4. Update this section with test results before ending the work session.


## Latest completed step — 2026-10-15
- **Current development catalog:** 67 active locations, 9 review-queue candidates.
- Reconciled the actual 214-record legacy `data/places.js` source against v2; this was an alias-aware curation step, not a claim that the 195 raw name mismatches are all missing.
- Added nine legacy locations with place-matched reference images: B39, Photo SeMA, Daegu Art Factory, Magok Culture Hall, SongEun Art Space, Nam June Paik Art Center, CICA Museum, Amorepacific Museum of Art, and Cheongju Dongbu Warehouse.
- Added legacy-name aliases to existing locations (for example, DDP, Museum SAN, Cultural Tank, MMCA, ACC, Bonte Museum, Tri-Bowl and Mungyeong Saejae) instead of creating duplicates.
- Reference-image records have explicit unknown rights and all `primaryImageId` values remain null. Commercial shooting permission is not inferred from public visitor access.
- Initial HTML counters and service-worker cache version now match `67` places and `20261015-49`.
- Catalog/static consistency checks: no duplicate normalized names or IDs; seven region groups populated; reference-image links valid; all new place IDs included in catalog validator and browser smoke tests.
- Phase report: `v2/PHASE3_LEGACY_CURATION_2026-10-15.md`.
- **Still not yet claimed:** end-to-end browser automation success; check the current GitHub Actions run before declaring the step fully validated.

## Continue from here — do not repeat prior work
1. Check the latest `FRAME ATLAS v2 quality gate` run for the most recent development-branch commit.
2. Fix any validation or UI issue identified by that run and re-run only the necessary checks.
3. Continue the remaining legacy reconciliation, adding further artistic locations only after source/identity checks. Do not bulk-add all exact-name mismatches; some are subareas, aliases, restricted facilities or candidates with unconfirmed operation.


## 2026-10-15 follow-up — representative-photo rule and operational status
- User clarified the rule: when the source proves that an image depicts the actual place, mark it as the representative image. This replaces the previous unnecessary requirement to keep confirmed photos “reference only.”
- Applied to all **67 active places**: `primaryImageId` now points to the confirmed `referenceImageId`; catalog status says representative approved. Image copyright/reuse rights and production/advertising shooting permission remain separate checks and are not implied by approval.
- Fixed the single broken image discovered by Playwright: Amorepacific Museum of Art now uses a Korea Herald gallery photo from an article specifically about APMA. The earlier image failed in browser testing.
- GitHub Actions on commit `ea0343a32028c84d96acb7eb1fb7084965472dde` passed both development browser regression and quality gate: all 67 active-place images loaded, desktop/mobile checks succeeded, and page errors were empty.
- Added legacy L-025 Samtan Art Mine to the review queue, not the active list. Recent reporting says it is closed for safety reinforcement with reopening projected for October 2027. Its location photo is retained as a reference only until reopening and current access are rechecked.
- Active catalog remains 67; review queue is now 10. Homepage queue counters and service-worker cache have been updated to `20261015-51`.
- The queue/cache/test changes made after the green run still require a fresh GitHub Actions run before they are labelled fully verified.


## Follow-up — restored legacy L-080 Temiorae (2026-10-15)
- Added `legacy-temiorae` to the active catalog as a distinctive former provincial-governor residence compound: 1932-era red-brick residences, blue tiled roofs, stone paths and pine garden.
- Current operating information checked against Daejeon Foundation's October 2026 announcement: generally Tuesday–Sunday, 10:00–17:00, Monday closed (holiday notices can override); individual buildings and tenant/artist-in-residence areas may have different access.
- Representative image is a photo of the actual Temiorae compound from Culture Journal Mac's Temiorae feature. Per user policy, image/place identity is enough for representative approval; copyright/reuse and commercial shoot permits remain separate unknowns.
- Home counts and cache version updated to 70 active places / 10 review candidates / `20261015-53`. Catalog validator and browser regression now require the restored location.
- This new commit still needs a fresh quality gate and browser test before full validation can be claimed.


## Follow-up — legacy L-214 Nonsan 1950 Studio (2026-10-15)
- Restored L-214 as active place `nat-nonsan-sunshine-1950-set`, focusing the record on the city-operated **논산 선샤인랜드 1950스튜디오** rather than conflating it with the adjacent private `선샤인스튜디오`.
- Nonsan City's official FAQ states commercial-shoot approval requires a submitted application and daily fee: broadcast productions ₩1,000,000/day; film/advertising and related production ₩2,500,000/day (official FAQ basis, recheck before booking). It currently lists 10:00–17:30 and a Wednesday closure, but older closure notices have changed, so confirm the latest official notice before visiting.
- Representative photo is identified on the Korea Tourism Organization's Sunshine Land page and is approved under the user's rule. Photo reuse rights are still unverified separately.
- Catalog: **71 active locations, 10 review-queue candidates**. Home counters and service-worker cache use `20261015-54`. Catalog validator and browser regression require this location.
- Fresh CI is required on the latest commit before claiming this change is validated.
