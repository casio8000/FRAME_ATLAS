# FRAME ATLAS 2.0 — 사진가 관점의 로케이션 스카우팅

현재 배포 브랜치: `main` · 2.0 작업 경로: `v2/`  
미리보기: https://casio8000.github.io/FRAME_ATLAS/v2/index.html  
기존 메인 앱 경로 `/FRAME_ATLAS/`와 기존 파일은 유지하고, 2.0은 같은 저장소의 `/v2/` 경로에서 운영 중이다. **아직 별도 GitHub 저장소로 분리된 상태는 아니다.** 별도 저장소 생성·복제 및 독립 배포를 완료하기 전에는 기존 저장소나 루트 앱을 삭제하지 않는다.

## 설계 방향

목적은 유명 관광지를 많이 나열하는 것이 아니다. 패션·인물·에디토리얼·아이돌 콘셉트·브랜드 촬영에서 실제 사진적 가치를 만들 수 있는 **실내·야외 공간을 선별하고, 실제 장소 일치가 확인된 사진을 장소 참고 이미지로 연결하며 대표사진 선정·이미지 재사용 권리·촬영 허가는 서로 다른 상태로 관리**하는 것이다.

현재 개발 브랜치 카탈로그에는 활성 장소 58곳과 검토 대기 후보 9곳이 있다. 지역 그룹은 서울, 경기·인천 수도권, 강원권, 충청권, 전라권, 경상권, 제주권이다. 기존 수도권 장소는 유지하고 뮤지엄 산·국립아시아문화전당을 포함해 대형 영화·드라마 스튜디오, 공연장, 실제 작품 촬영용 세트, 세계적 건축가의 건축물을 전국으로 확장했다. 후보를 선정할 때는 다음 특성을 우선 고려했다.

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
- \`tools/validate-catalog.mjs\`: 카탈로그 ID·점수·이미지 검토 규칙, CSS/JS 연결과 JavaScript 문법을 검사한다.
- \`.github/workflows/v2-quality.yml\`: 개발 브랜치 변경 시 품질 검사를 자동으로 실행한다.

## 현재 구현된 기능

- 장소 검색 및 서울/경기/인천 지역 필터
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

## 초기 이미지 조사 결과

초기 이미지 조사 당시에는 34개 장소에서 사진 후보 36건을 기록했다. 이후 장소 데이터는 전국으로 확장되었으므로 이 수치는 현재 총계가 아니라 초기 조사 기록이다. 현재 개발 브랜치에는 활성 장소 52곳과 별도 검토 대기 후보 9곳이 있다. 장소 후보 출처는 공식 시설·관광 안내, 건축 프로젝트 자료, 공연·촬영시설 안내, 건축·공간 매체 및 지역 보도 등으로 분산한다.

사진 후보는 문화비축기지, 선유도공원, DDP, SeMA 벙커, 세운상가, 문래창작촌, 성수동 옛 공장 골목, 문화역서울284, 서울식물원 온실, 노들섬, 서울공예박물관, 을지로, 경춘선숲길, 국립현대미술관 과천관, 파주출판도시, 미메시스 아트 뮤지엄, 헤이리, 안양예술공원, 포천아트밸리, 수원화성, 행궁동, 경기도미술관, 광명동굴, 고양아람누리, 인천아트플랫폼, 송도 트라이보울, 인천 개항장, 배다리 헌책방 골목, 소래습지, 남서울미술관, 한강 교량 하부 등 여러 공간 유형에 걸쳐 있다.

**장소와 일치하는 사진은 먼저 ‘장소 참고 이미지’로 표시하고, ‘대표사진’ 승인 여부는 별도로 관리한다.** 장소 일치가 확인되었다고 해서 사진의 예술적 대표성, 공개 웹앱에서의 재사용 권리, 상업촬영 허가가 자동으로 확인되는 것은 아니다. 카탈로그에는 `placeMatch`, `primaryImageId`, `rights` 및 촬영 허가 필드를 분리해 기록한다. 새로 추가한 장소는 `primaryImageId: null`로 두어 대표사진을 자동 승인하지 않는다.

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

CC BY-NC 등 비상업 조건, CC BY-ND 등 파생 저작물 제한이 있는 결과는 공개 사진 카탈로그의 대표사진으로 자동 승인하지 않는다. 장소 일치가 확인된 외부 이미지는 장소 참고 이미지로 표시할 수 있지만, 권리가 확인되지 않은 이미지를 대표사진 승인 또는 저장소 내부 파일로 복제하지 않는다. 참고 이미지의 표시·대표사진 선정·이미지 재사용 권리·현장 상업촬영 허가는 서로 다른 상태다. 사진을 저장했다고 해서 해당 장소의 상업촬영 허가를 확보한 것은 아니다.

## 초안 저장과 게시

- 미게시 수정본과 사진 파일 초안은 현재 브라우저에 로컬 저장된다. PC에서 수정한 후보 검색 결과는 iPhone에 자동으로 나타나지 않는다.
- 장소·사진 일치가 확인된 참고 이미지 URL은 출처와 함께 카탈로그에 표시할 수 있다. 단, 권리 미확인 표기를 유지하고, 해당 이미지 파일을 공개 저장소에 복사·업로드하거나 ‘대표사진 승인’으로 바꾸지 않는다. 저장소에 이미지 파일을 넣는 작업은 저장·재사용 권리가 확인된 경우로 제한한다.
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
- Catalog currently has 34 locations and 36 image candidates; representative photos are not automatically approved.


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


## 2026-10-14 · 개발 브랜치 v2.42 — 전국 카탈로그 확장

현재 확인 대상은 `FRAME_ATLAS-v2.0-development` 브랜치이며, 이 변경은 운영 `main`에 배포되지 않았다.

- 활성 장소 43곳 / 검토 대기 후보 12곳.
- 지역 필터를 서울, 경기·인천 수도권, 강원권, 충청권, 전라권, 경상권, 제주로 통일했다. 장소 데이터에는 시·도와 도시를 함께 기록할 수 있다(예: `강원 원주`, `충북 청주`).
- 뮤지엄 산과 국립아시아문화전당은 장소 참고 사진이 연결된 상태로 활성 목록으로 이동했다. 둘 다 대표사진 자동 승인 대상이 아니다.
- CJ ENM 스튜디오 센터, 대전 스튜디오큐브, 부산 영화의전당, 하슬라아트월드, 국립현대미술관 청주, 전주영화종합촬영소, 순천 드라마촬영장, 본태박물관을 추가했다.
- 새 사진은 장소 참고 이미지로 연결하되 `primaryImageId`는 비워 두었다. 원저작자·라이선스·재사용권과 촬영 허가는 별개로 확인한다.
- 지역 필터·후보 검토 지역 선택·사진 정책에 대한 브라우저 회귀 테스트를 갱신했다. **현재 변경 묶음의 실제 브라우저 테스트는 GitHub Actions에서 실행·확인되기 전이며, 통과했다고 간주하지 않는다.**
- 서비스 워커와 CSS/JS 자산 버전을 `20261014-42`로 올려 이전 PWA 캐시가 변경 파일을 가리는 위험을 줄였다.


## 2026-10-14 · 개발 브랜치 v2.44 — 전국 확장 및 장소 참고 이미지 정책

현재 개발 브랜치 `FRAME_ATLAS-v2.0-development`에서만 변경했다. 운영 `main`과 루트 v5.x 앱에는 반영하지 않았다.

- 카탈로그: 활성 장소 52곳, 별도 검토 대기 후보 9곳. 권역별 활성 수는 서울 18, 경기·인천 수도권 20, 강원 3, 충청 2, 전라 3, 경상 4, 제주 2다.
- 새로 활성화하거나 추가한 후보: F1963, LG아트센터 서울, 리움미술관, 케이필름 제5스튜디오, SKT 팀스튜디오 XR·Volume 스테이지, 합천영상테마파크, 제주 글라스하우스·섭지코지.
- 기존 전국 항목도 유지했다. 뮤지엄 산은 중복 생성하지 않고 기존 장소 레코드와 참고 이미지 기록을 그대로 사용한다.
- 장소 사진이 실제 해당 장소와 일치하는지 확인된 경우 ‘장소 참고 이미지’로 표시한다. 대표사진 승인은 `primaryImageId`로 별도 관리하며, 새로 추가한 장소는 자동 승인하지 않는다.
- 이미지 재사용 권리와 촬영 허가는 별도 확인 대상이다. 권리 미확인 사진은 공개 저장소에 파일로 복제하지 않고, 출처·권리 상태를 보존한다.
- 홈페이지 표시 카운터를 52/52/9로 맞추고 서비스 워커 및 JS/CSS 쿼리 버전을 `20261014-44`로 갱신했다.
- 회귀 테스트의 필수 장소 검사를 새 장소까지 확장했다. GitHub 원격 파일과 JSON 구조 검사 결과는 확인했으나, Playwright 실제 브라우저 테스트와 물리 iPhone Safari 테스트는 아직 실행/통과 여부를 확인하지 않았다.


## Current Development Checkpoint — v2.47 (2026-10-14, not deployed)

이 상태는 FRAME_ATLAS-v2.0-development 브랜치 기준이며, 운영 main에는 아직 반영하지 않았다.

- 활성 장소 58곳, 별도 검토 대기 후보 9곳. 권역별 활성 수: 서울 19, 경기·인천 수도권 20, 강원 3, 충청 3, 전라 4, 경상 6, 제주 3.
- 52곳 기준본에서 중복 장소 레코드를 만들지 않고 추가한 고유 장소: KBS아레나, 방주교회, 부산영화촬영스튜디오, 대구오페라하우스, 세종예술의전당, 전주 팔복예술공장. 중복 후보의 유용한 사진 자료는 해당 기존 장소 레코드에만 병합했다.
- 기존 사진가 관점 카탈로그와 뮤지엄 산은 유지했다. 뮤지엄 산은 강원권 활성 장소이며, primaryImageId는 비어 있어 참고 이미지를 대표사진으로 자동 승인하지 않는다.
- 모든 활성 장소는 장소 일치 확인된 참고사진 후보와 명시적인 이미지 권리 상태를 갖는다. ‘장소 참고 이미지’와 ‘대표사진 승인’, ‘이미지 재사용 권리’, ‘상업촬영 허가’는 별개다. 부산·대구·세종·전주 사진도 대표사진으로 자동 승인하지 않았다.
- 홈 권역 버튼: 전국 전체, 서울, 경기·인천 수도권, 강원권, 충청권, 전라권, 경상권, 제주권. 데이터·UI 지역 키와 캐시 버전은 동기화했다(20261014-47).
- 정적 검증 결과: 장소 ID 고유, 정규화한 장소명 고유, 7개 권역별 장소 존재, 58개 활성 장소의 참고사진/권리 상태 존재, HTML·서비스 워커 캐시 버전 일치.
- tools/validate-catalog.mjs와 .github/workflows/v2-quality.yml을 추가했다. 브라우저 테스트가 실제로 실행되어 통과하는지는 아직 확인되지 않았다. Playwright 테스트, 스크린샷 및 원격 이미지 로딩 검증을 품질 게이트에서 확인해야 한다.
- 기존 루트 v5.x 앱, 운영 main, 개인 백업 저장소에는 변경을 적용하지 않았다.
