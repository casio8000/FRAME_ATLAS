# FRAME ATLAS 2.0 — 사진가 관점의 로케이션 스카우팅

현재 배포 브랜치: `main` · 2.0 작업 경로: `v2/`  
미리보기: https://casio8000.github.io/FRAME_ATLAS/v2/index.html  
기존 메인 앱 경로 `/FRAME_ATLAS/`와 기존 파일은 유지하고, 2.0은 같은 저장소의 `/v2/` 경로에서 운영 중이다. **아직 별도 GitHub 저장소로 분리된 상태는 아니다.** 별도 저장소 생성·복제 및 독립 배포를 완료하기 전에는 기존 저장소나 루트 앱을 삭제하지 않는다.

## 현재 운영 상태 — 2026-10-17

- 운영 앱 빌드: `20261017-124` · 최신 주소: https://casio8000.github.io/FRAME_ATLAS/v2/index.html
- 공통 카탈로그: **200개 고유 장소**. 기본 카탈로그 151곳 + 보조 카탈로그 67개 − 기존 장소 중복 병합 18건 = 200곳.
- 이미지 후보: **307건**. 200곳 모두 참고사진 ID와 사진 출처 페이지가 연결되어 있으며, 자동화 검사상 선택된 대표·참고사진 참조 오류와 사진 URL/파일 경로 누락은 0건. 2026-10-17에는 글라스하우스·이당미술관·애기봉·국립해양박물관·수창청춘맨숀·양주 장욱진미술관의 기존 참고사진 6건을 개선했으며, 이전 URL·출처는 복구용으로 보존하고 권리 상태는 모두 `reference-only`로 유지한다.
- 최신 품질검사: [GitHub Actions #602 — 성공](https://github.com/casio8000/FRAME_ATLAS/actions/runs/38996898482). [Pages 배포 #647 — 성공](https://github.com/casio8000/FRAME_ATLAS/actions/runs/38996898778).
- 추가 검증: [참고사진 개선 PR #8 병합](https://github.com/casio8000/FRAME_ATLAS/pull/8), [품질검사 #603 — 성공](https://github.com/casio8000/FRAME_ATLAS/actions/runs/38997993769). 병합 후 Pages 배포의 별도 성공 여부는 아직 확인 기록이 없으므로 현재 배포 완료로 단정하지 않는다.
- 자동화 브라우저 검사: PC 홈 목록 200곳, PC 보관 목록 200곳, 모바일 홈·보관 목록 각각 200곳. 최근 완료된 이미지 감사에서 PC/모바일 모두 200/200 로드, 누락·대기 0, JavaScript 오류 0건.
- PC의 구버전 화면과 201곳 표시는 빌드 124 적용 후 사용자가 정상 표시를 확인해 해결 처리했다. 전체 카탈로그를 실제 iPhone Safari/홈 화면 앱에서 수동 확인하는 단계는 아직 남아 있다.
- 사진의 장소 일치 확인과 이미지 재사용 권리는 별개다. 활성 사진 후보 267건은 이용조건 추가 확인 대상으로 남아 있으므로, 참고사진을 상업적 재사용이 허가된 이미지라고 간주하지 않는다.
- 개발·정적 검사 경로는 저장소 루트의 `tools/validate.py`, `tools/check_app.py`, `tests/v2-browser-smoke.cjs`, `.github/workflows/quality-check.yml`이다. 사용자 매뉴얼은 [USER_MANUAL_KO.html](./USER_MANUAL_KO.html)이다.


## 설계 방향

목적은 유명 관광지를 많이 나열하는 것이 아니다. 패션·인물·에디토리얼·아이돌 콘셉트·브랜드 촬영에서 실제 사진적 가치를 만들 수 있는 **실내·야외 공간을 선별하고, 실제 장소에 맞는 사진을 확보해 검증된 대표 이미지로 등록**하는 것이다.

초기 조사 단계(2026-10-13)에는 서울 17곳, 경기 12곳, 인천 5곳 등 34개 후보로 시작했다. 이 문단의 34곳은 초기 작업 기록이며 현재 운영 카탈로그 수가 아니다. 후보를 선정할 때는 다음 특성을 우선 고려했다.

- 조형적 건축, 산업유산, 재료 질감, 선·반복 패턴, 빛과 그림자
- 실내와 야외의 배경 다양성, 자연광/인공광, 인물과 공간의 스케일 대비
- 패션·인물·예술 에디토리얼로 발전시킬 시각적 잠재력
- 사진 탐색에 쓸 만한 서로 다른 촬영 구역과 구도
- 접근·운영·상업촬영 조건을 나중에 확인할 수 있는 구체적인 현장 조사 가능성

A/B/C는 위 기준에 따른 1차 기획 우선순위이며, 현재 운영 상태·접근성·촬영 허가를 확인했다는 등급이 아니다. 일부 공원·문화유산·유명 시설도 건축/질감/공간성이 독특한 경우에만 조사 후보로 남겼다.

## 사진가 관점의 선정·점수 체계

각 장소에 100점 기준의 사진 잠재력 평가를 넣었다.

- 시각적 고유성 30점
- 구도·촬영 각도 다양성 20점
- 빛·그림자·재료 질감 20점
- 패션·인물·예술 에디토리얼 활용도 20점
- 실내외 및 날씨 대안 10점

A(85–100), B(74–84), C(0–73)로 조사 순서를 분류한다. 방문객 수·SNS 인기·유명세는 점수에 포함하지 않는다. 점수는 탁상 기획 평가이며, 현장 답사/운영/접근/촬영 허가 가능성은 별도 확인 대상이다. 상세 기준은 \`LOCATION_SELECTION_STANDARD.md\`에 있다.

## 파일 구조와 테스트

- \`index.html\`: 앱의 기본 화면 골격만 유지한다.
- \`assets/app.css\`: PC/iPhone 반응형 스타일을 별도 관리한다.
- \`assets/app.js\`: 장소 검색, 다중 이미지 검색, 후보 검토, 로컬 사진 임시보관, 검증 및 게시 흐름을 담당한다.
- \`data/places.json\`: 장소별 사진 잠재력 점수, 조사 이유, 제약과 초기 이미지 조사 후보를 기록한다.
- \`tools/validate.py\`: 기본·보조 카탈로그를 병합해 장소 ID, 필수값, 사진 후보, 출처·라이선스 근거 및 선택된 사진 참조를 검사한다.
- \`tools/check_app.py\`와 \`tests/v2-browser-smoke.cjs\`: 앱 리소스·버전·캐시 규칙과 PC·모바일 브라우저 동작을 검사한다.
- \`.github/workflows/quality-check.yml\`: 기본 브랜치 변경 시 데이터·앱 품질 검사를 실행한다.

## 현재 구현된 기능

- 전국 장소 검색 및 지역·공간 유형·촬영 분위기 필터
- 장소별 선정 이유, 시각적 강점, 어울리는 촬영 콘셉트, 현장 조사 시 확인할 제약
- 사진가 관점 검색 방향: 장소 전경 / 패션·인물 에디토리얼 / 건축·기하학 / 실내·자연광 / 야외·인물 / 디테일·재료·그림자
- 외부 검색: Google 이미지, Bing 이미지, 네이버 이미지, 다음 이미지, Flickr, Openverse, Wikimedia Commons, 공식·관광 출처
- 앱 내 Openverse 및 Wikimedia Commons 이미지 후보 검색
- 후보마다 사진 URL, 원본 페이지, 저작자, 라이선스, 라이선스 근거, 장소 일치, 촬영 구도, 메모 기록
- 일부 원본 이미지에 대해 CORS 허용 시 파일을 바로 이 기기에 가져오는 기능. 실패하면 원본 페이지에서 사진을 내려받아 파일 입력으로 등록
- JPEG/PNG/WebP/AVIF 파일을 최대 8MB까지 브라우저 IndexedDB에 임시 보관
- 공개 사용 권리와 실제 장소 일치 확인 전에는 대표사진 승인을 차단
- 장소/후보 카탈로그 JSON 내보내기와 가져오기
- A급 후보 또는 전체 장소를 대상으로 Openverse/Wikimedia Commons의 사진 후보를 순차적으로 모으는 일괄검색 기능. 자동 수집된 후보는 로컬 초안에만 보관하며 자동 승인하지 않음.
- 사진 후보마다 장소 일치·권리·저작자·원본 페이지·라이선스 근거를 수정하고 검토할 수 있는 편집 UI
- Fine-grained GitHub token을 게시 순간에만 입력해 승인된 로컬 사진 파일과 승인 카탈로그만 main의 v2 경로에 게시하는 초기 기능. 미승인 외부 이미지 URL/후보는 공개 카탈로그에서 제외

## 초기 이미지 조사 결과 — 2026-10-13 기록

당시 초기 34개 장소에 이미지 조사 후보 36건을 연결했다. A급 16곳은 당시 모두 장소별 사진 후보가 있었다. 아래 수치는 초기 작업 기록이며, 현재 200곳 카탈로그의 사진 후보 수나 승인 상태를 나타내지 않는다. 후보 출처는 서울시 미디어허브, 인천시·인천투어, 수원화성관광, SPACE GROUP, 건축 전문 매체, 지역 언론, 건축/공간 프로젝트 페이지 등으로 분산했다.

사진 후보는 문화비축기지, 선유도공원, DDP, SeMA 벙커, 세운상가, 문래창작촌, 성수동 옛 공장 골목, 문화역서울284, 서울식물원 온실, 노들섬, 서울공예박물관, 을지로, 경춘선숲길, 국립현대미술관 과천관, 파주출판도시, 미메시스 아트 뮤지엄, 헤이리, 안양예술공원, 포천아트밸리, 수원화성, 행궁동, 경기도미술관, 광명동굴, 고양아람누리, 인천아트플랫폼, 송도 트라이보울, 인천 개항장, 배다리 헌책방 골목, 소래습지, 남서울미술관, 한강 교량 하부 등 여러 공간 유형에 걸쳐 있다.

**당시 36건 모두 조사 후보였고 그 초기 스냅샷에서 대표사진으로 승인된 사진은 0건이었다.** 이 수치는 2026-10-13 초기 34곳 연구 스냅샷에만 해당하며 현재 운영 카탈로그의 상태를 뜻하지 않는다. 출처 링크가 있는 것과 장소가 맞는 것, 그리고 공개 사용 권리가 있는 것은 서로 다른 검증 항목이다. 대표사진은 장소 일치·원본 페이지·저작자/라이선스 근거를 확인하고 앱 안에 파일을 저장한 뒤에만 승인한다.

낙산공원과 스타필드 수원 별마당도서관에도 실제 현장 사진으로 보이는 조사 후보를 각각 추가했다. 두 사진 모두 저작자/재사용 권리를 확인하지 않았으므로 공개 대표사진으로 승인하지 않았으며, 원본 출처를 열어 확인하는 단계가 남아 있다.

이미지 부족을 무조건 채우기 위해 항공사진·렌더링·워터마크 사진이나 사용 권리가 불명확한 이미지를 대표사진으로 등록하지 않는다. 이 기준은 이미지 수를 빠르게 늘리는 것보다 정확하고 실제 촬영에 유효한 카탈로그를 만드는 데 중요하다.

## 이미지 확보 원칙

사진을 많이 찾는 것과 사용할 수 있는 사진을 정확히 등록하는 것은 다르다. 각 사진 후보는 다음을 별도 검토한다.

1. 실제 대상 장소와 사진이 일치하는가?
2. 사진은 실제 공간에서 촬영 가능한 배경을 보여주는가, 아니면 항공사진/지도/포스터/행사 홍보물인가?
3. 원본 페이지·저작자·라이선스 조건을 확인할 수 있는가?
4. 공개 웹앱에 재사용할 권리가 있는가?
5. 필요 저작자 표시 등 라이선스 조건을 카탈로그에 기록했는가?

Openverse는 공개 라이선스 이미지를 찾는 데 활용하지만, 검색 서비스도 라이선스 정보의 정확성을 보증하지 않으므로 개별 결과의 근거를 확인한다. Wikimedia Commons만 사용하지 않으며 여러 검색원을 병행한다. Google/Bing/Naver/Daum/Flickr는 검색 페이지를 열어주고, 무단 스크래핑이나 자동 다운로드를 시도하지 않는다.

CC BY-NC 등 비상업 조건, CC BY-ND 등 파생 저작물 제한이 있는 결과는 공개 사진 카탈로그의 대표사진으로 자동 승인하지 않는다. 권리가 불명확한 이미지는 개인 참고 후보에 머물러야 하며 공개 저장소에 복제하지 않는다. 사진을 저장했다고 해서 해당 장소의 상업촬영 허가를 확보한 것은 아니다.

## 초안 저장과 게시

- 미게시 수정본과 사진 파일 초안은 현재 브라우저에 로컬 저장된다. PC에서 수정한 후보 검색 결과는 iPhone에 자동으로 나타나지 않는다.
- GitHub에 게시하면 승인된 로컬 사진 파일과 승인된 대표사진 카탈로그만 공개 저장소의 main 브랜치 v2 경로에 기록한다. 미승인 이미지·검색 후보의 외부 이미지 URL은 공개 카탈로그에 넣지 않는다. 이를 통해 권리 검토 전 사진이 웹앱에서 공개 표시되는 위험을 줄인다.
- 토큰은 입력 시점에만 사용하며 localStorage에 저장하지 않는다. 토큰은 casio8000/FRAME_ATLAS 저장소에만 Contents 읽기/쓰기 권한을 부여한 Fine-grained token으로 제한하고, 신뢰할 수 있는 기기에서만 사용한다.
- 개발 중인 코드는 v2-development 브랜치에서 검증한 뒤, 기존 홈페이지를 바꾸지 않고 /v2/ 경로로 따로 공개하는 방식으로 운영한다. main에 v2 경로가 병합·배포된 뒤에는 승인자료를 게시하면 GitHub Pages 갱신 후 PC/iPhone이 같은 공개 카탈로그를 읽는다.
- 사진 파일 업로드는 개별 커밋으로 이뤄질 수 있다. 카탈로그 게시가 실패하면 일부 업로드 파일이 고아 파일로 남을 수 있으나, 기존 카탈로그/운영 앱은 덮어쓰지 않는다.

## 다음 개발 단계

1. Openverse/Commons의 검색 결과 품질과 라이선스 파싱을 계속 검증한다.
2. 초기 34곳을 기준으로 실제 사진이 잘 맞는지, 검색어를 조정해야 하는지 장소별로 검토한다.
3. A 우선순위 장소부터 여러 출처의 실사 사진을 모으고, 대표사진과 보조사진을 분리해 축적한다.
4. v5.x 저장소에 남아 있는 장소명/별칭을 비교해 중복 제거한 후 누락 후보를 추가한다. 기존 프로그램의 스크립트는 그대로 복사하지 않는다.
5. 정식 공개 전에 이미지 권리·출처·장소 일치·동작 테스트를 강화하고, 배포/PC-iPhone 공통 카탈로그 흐름을 별도로 검증한다.


- `LOCATION_SELECTION_STANDARD.md`: 사진가 관점의 100점 장소 선정 기준과 A/B/C 우선순위


## 2026-10-13 — UX, navigation and home-screen update
- Kept the existing main page separate from `/v2/`.
- Added an editorial visual system using forest green, warm limestone and restrained vermilion accents.
- Added Google Maps search/directions, Naver Map, KakaoMap and Apple Maps links to place details.
- If a verified address is missing, map links use the place name + region and tell the user to verify the exact address.
- Added a web app manifest, app mark, Apple touch icon, and a versioned service worker for offline app-shell/catalog fallback.
- Added native installation prompt where supported and iPhone/Android home-screen instructions.
- Added keyboard activation and mobile scrolling from selected place to its detail.
- Offline caching does not sync device-local drafts/photos between devices. Only deliberately published catalog data is shared.
- Historical snapshot: 34 locations and 36 image candidates at the time of the 2026-10-13 initial build. See the current operating status near the top for today's 200-place catalog.


## 2026-10-13 — Navigation accuracy and operating-status checks
- Place details now use a verified street address when available; neighborhood/district-style locations use an explicit map-search target instead of a fabricated address.
- Added source references for official address checks.
- SeMA Bunker is marked as closed from 2025-01-13 based on the Seoul Museum of Art notice. The app now displays a closed-status warning and advises against scheduling a shoot before reopening is confirmed.
- Updated service-worker cache version so installed devices refresh changed app UI.


## 2026-10-13 — Reference photo presentation
- Each current location now records a separate `referenceImageId` for the best available candidate image.
- Reference images appear in the list and the selected location detail, but remain labeled as review references until rights and final placement are verified.
- The “대표 참고사진으로 지정” action lets the user choose another candidate without falsely marking it rights-approved.
- External image errors are handled with a readable placeholder.
- The published `primaryImageId` / approval state is not changed by selecting a reference photo.


## 2026-10-13 — Thumbnail loading fix
- Added an image load fallback: when a source image is blocked or unavailable, the page retries a provided source thumbnail and then tries an image-resizing/cache proxy for the original remote image.
- The fallback is applied to place-list thumbnails, the selected place's reference image, and saved candidate cards.
- Visible loading/error states replace the previous silent blank thumbnail.
- This only changes display reliability; it does not confer copyright permission or mark a reference image as a formally approved representative image.


## 2026-10-13 — Home-first scouting and editorial layout
- The app now starts on a home/dashboard page inspired by the previous FRAME ATLAS home screen. Users enter the workspace deliberately.
- Added a location photo hero, quick search, region shortcuts and six curated location cards.
- Rebalanced the desktop list/detail workspace and added dedicated responsive layouts for tablet and phone widths.
- Reframed the image workflow around matching the actual location, selecting a representative photo, replacing an image URL, replacing it with a local file, editing photo notes, and deleting an image.
- Author/license fields are no longer part of routine photo review screens.
- Service-worker cache version bumped so installed devices refresh the new landing/workspace UX.


## 2026-10-13 — Home state and image-reference migration
- Added navigation from the home page into the workspace via start, region shortcuts, search, and featured location cards.
- The home screen renders image-led cards from the current 34-location catalog.
- Older local drafts now merge missing published reference-photo records rather than masking the public catalog's new image references.
- The place list shows the best available actual-location photo candidate, whether or not the user has explicitly selected it as the representative photo.
- Service worker cache updated for the new interface.


## 2026-10-13 — Photo selection and edit workflow
- Representative photo selection follows the chosen image and does not require author/license metadata.
- Added image URL/file, caption, view type, actual-place match, optional source page and notes.
- Candidate cards support selecting a representative, changing an image URL, replacing with a local file, editing details, and deleting.
- Publishing retains non-rejected photo candidates and uploads a local file selected as representative/reference.
- Repository image files marked for deletion are removed on the next publish.
- Venue access and actual-place match checks remain; creator/license fields are not part of routine photo management.
- The service-worker cache version has been bumped.

- Follow-up safety: uploaded photo files are now deleted after the updated catalog commits successfully, avoiding a broken catalog if the metadata update fails.
- Object URLs are revoked when a local file is replaced/deleted so previews never keep showing an old image.

- Corrected local-file preview hydration so IndexedDB photos can appear in the selected place detail, the place list, and the home featured cards before they are published.

- Prevented deleting a repository image when a replacement uploads to the same file path.
- If the chosen hero location has no remaining image, the home hero clears its previous photo instead of showing a stale image.
