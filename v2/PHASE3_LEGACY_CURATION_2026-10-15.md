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


## Follow-up — legacy L-214 Nonsan 1950 Studio (2026-10-15)
The legacy entry is restored as `nat-nonsan-sunshine-1950-set`, specifically scoped to the city-run 1950 Studio, not the adjacent private Sunshine Studio. Nonsan City's official FAQ describes a required commercial-shoot application and daily charges of ₩1,000,000 for broadcast productions and ₩2,500,000 for film/advertising productions (verify current rate at booking). The Korea Tourism Organization's Sunshine Land page identifies the representative photo as the actual 1950s street set. Per the user's rule, that image is approved as the representative; re-use rights remain unverified separately. Active catalog: 71; review queue: 10; cache: `20261015-54`.


## Current verification result — 2026-10-15
On commit `8da40bc5a73fd17a04393de0a8581aeee002ae32`, both [development browser regression](https://github.com/casio8000/FRAME_ATLAS/actions/runs/38667330009) and [catalog quality gate](https://github.com/casio8000/FRAME_ATLAS/actions/runs/38667329986) passed. The validator confirmed 71 active locations and 10 review candidates across seven regions; desktop and mobile rendered all 71 locations, the image audits loaded 71/71 in both layouts, and no JavaScript page errors were reported. Counters/cache were aligned at `71 / 10 / 20261015-54`. No production merge/deployment occurred.


## Latest batch — legacy-curated expansion to 90 locations (2026-10-15)
- Activated 19 additional records from the legacy 214-place scouting list: 정동1928 아트센터, 소대헌·호연재 고택, 장림포구, UN조각공원, 서울시립미술관 서소문본관, 서울시립 북서울미술관, 한국근대문학관, 수원시립미술관 행궁본관, 아르떼뮤지엄 강릉, 이응노미술관, 대전시립미술관, 대구미술관, 울산시립미술관, 솔거미술관, 제주도립미술관, 서울도서관, MBC 드림센터, 헤이리시네마, 현대 모터스튜디오 고양.
- Catalog is **90 active locations + 10 review-only candidates**. The 19 records retain their legacy IDs so they can be reconciled against the original catalog without recreating the review from scratch.
- Per the user's clarified rule, each selected place has a representative image whose source identifies the actual location. Copyright/reuse permissions and location-specific commercial shoot permits remain separate detail fields.
- The browser image audit exposed multiple host URLs that do not load reliably; the source URLs for Daejeon Museum of Art and Nodeul Island were replaced with source-identified alternates. Cache version is `20261015-57`.
- [Browser regression PASS](https://github.com/casio8000/FRAME_ATLAS/actions/runs/38669996761): PC 90/90 images loaded, mobile 90/90 images loaded, no loading/missing overlays and zero page errors.
- [Quality gate PASS](https://github.com/casio8000/FRAME_ATLAS/actions/runs/38669996733): JavaScript/data validation, catalog IDs, counts, cache agreement and browser tests passed.
- These changes are on `FRAME_ATLAS-v2.0-development`; production `main` has not been merged or deployed.
