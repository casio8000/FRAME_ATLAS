# FRAME ATLAS 2.0 — Continuation checkpoint

Last updated: 2026-10-14 (Korea Standard Time)

## Current release
- Live path: https://casio8000.github.io/FRAME_ATLAS/v2/index.html
- Source path: `v2/` in the existing `casio8000/FRAME_ATLAS` repository.
- The older root app is preserved; do not edit or delete it while validating 2.0.
- This checkpoint records the work so a dropped ChatGPT connection does not require restarting the project from the beginning. Code changes are stored in Git commits, not only in the conversation.

## Current verified UI state
- The home/featured screen and archive render 34 locations.
- The latest browser smoke test checks 34/34 images on desktop and the mobile archive, reports no uncaught JavaScript errors, and verifies the mobile archive image frame is landscape 16:9 (336×189 in a 390px viewport).
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
