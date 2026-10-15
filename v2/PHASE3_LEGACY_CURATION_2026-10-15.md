# FRAME ATLAS 2.0 — Legacy location curation phase 3
Date: 2026-10-15 (KST)

## Implemented in this step
- Active catalog increased from 58 to **67 places** (+9); review queue remains 9.
- All 9 are traced to prior catalog records from `data/places.js`:
  - L-020 — 부천아트벙커 B39
  - L-188 — 서울시립 사진미술관
  - L-058 — 대구예술발전소
  - L-189 — 마곡문화관
  - L-159 — 송은 아트스페이스
  - L-164 — 백남준아트센터
  - L-125 — CICA미술관
  - L-145 — 아모레퍼시픽미술관
  - L-054 — 청주 동부창고
- Added aliases to existing 2.0 locations for earlier-version names/subareas to reduce false “missing” results and avoid duplicate place cards. Key examples:
  - L-007 → `nat-jeonju-palbok-art-factory` (팔복예술공장)
  - L-005 → `ic-open-port` (개항장 근대건축전시관 일대)
  - L-082 → `seo-sewoon` (세운상가)
  - L-098 → `nat-museum-san` (뮤지엄 산)
  - L-115 → `seo-oil-tank` (문화비축기지)
  - L-117 → `seo-ddp` (DDP)
  - L-118 → `seo-mmca` (국립현대미술관 서울관 일대)
  - L-130 → `nat-mmca-cheongju` (국립현대미술관 청주/문화제조창)
  - L-134 → `nat-busan-cinema-center` (영화의전당)
  - L-135 → `nat-acc-gwangju` (국립아시아문화전당)
  - L-140 → `nat-bonte-museum` (본태박물관)
  - L-163 → `gg-mmca-gwacheon`; L-166 → `gg-gyeonggi-museum-art`
  - L-168/L-208 → `ic-tri-bowl`
  - L-204 → `gg-suwon-hwaseong`; L-206 → `gg-mimesis`
  - L-209 → `gg-goyang-aram`; L-210 → `gg-gwangmyeong-cave`
  - L-218 → `nat-mungyeong-saejae-open-set` (existing set; not duplicated)

## Image and permit safety
- Nine reference-image candidates are linked to pages that identify the relevant location. These are **reference images only**, not approved cover photographs.
- Every new place has `primaryImageId: null`; all image re-use rights remain explicitly **unknown** until verified.
- Public access is not treated as permission for advertising, fashion/editorial or film shooting. B39's official guidance expressly requires prior approval/rental for commercial photography: https://artbunkerb39.org/ko/sub/sub04.html
- Photo SeMA's official building/visit information is recorded: https://sema.seoul.go.kr/kr/visit/photosema
- Dongbu Warehouse's current official facility-by-facility schedule and rental process is recorded: https://www.dbchangko.org/sub.php?code=47
- CICA's official page warns that gallery closure can occur during installation periods: https://cicamuseum.com/visit/
- Amorepacific Museum's current visitor information is linked: https://apma.amorepacific.com/
- The remaining venues have a separate shoot permission/fee/equipment confirmation flag; no record claims that commercial shooting is already authorized.

## Technical changes
- Catalog: `v2/data/places.json` now has 67 active places and 9 review-queue candidates.
- Homepage initial counters: places, image references and both archive counts updated to 67; queue counters remain 9.
- Cache version synchronized: `20261015-49` in `v2/index.html` and `v2/sw.js`.
- Catalog validator now accepts date-based cache versions and requires the 9 new place IDs.
- Desktop/mobile browser smoke test requires the new place IDs and verifies each has a matching reference-image candidate with rights stated and no automatically approved cover.

## Validation status
- Static catalog checks executed in tool: unique IDs and normalized names, 7 region groups present, all 67 active records have a confirmed location-reference candidate, every cover approval remains null, homepage counters and cache version aligned.
- The full GitHub Actions desktop/mobile browser run is pending/requires checking after the latest commits. Do not claim end-to-end success until that run is green.

## Next checkpoint
Continue alias-aware reconciliation of the remaining old records. Where a location is genuinely distinct and artistically strong, add only after confirming location identity and source page; keep uncertain broadcast studios, restricted venues and uncertain operating status in review queue rather than treating them as generally accessible.


## Follow-up correction — 2026-10-15
The user clarified that a photo proven to depict the actual place should be marked approved as the representative image. Accordingly, all 67 active places now have `primaryImageId === referenceImageId` when the source identifies the location. This is an image/place identity approval only; copyright/reuse rights and commercial-shoot permission remain independent. The single image that failed the browser smoke test (Amorepacific Museum of Art) was replaced with an APMA gallery image from The Korea Herald. Development browser regression and quality gate passed on commit `ea0343a32028c84d96acb7eb1fb7084965472dde` with 67/67 images loaded.

Legacy L-025 Samtan Art Mine was added to the review queue rather than the active catalog because recent news reports closure for safety reinforcement and a projected October 2027 reopening. The catalog is 67 active + 10 review-queue items. The latest queue-counter/cache changes are awaiting a fresh CI run.


## Follow-up — legacy L-080 Temiorae (2026-10-15)
Temiorae was restored as active location `legacy-temiorae`. The red-brick, blue-tiled former governor residence and pine garden add a distinct modern-history/period-editorial environment. Daejeon Foundation's October 2026 operations notice says Tuesday–Sunday 10:00–17:00 with Monday closure subject to special holiday announcements; individual residence buildings and private/artist-in-residence spaces have different access. Representative photo is a source-identified photo of the actual complex, approved under the user's simplified rule; reuse rights and commercial filming permission are still separate. Catalog now contains 70 active places and 10 candidates in review queue. Cache version is `20261015-53`; current commit awaits CI.
