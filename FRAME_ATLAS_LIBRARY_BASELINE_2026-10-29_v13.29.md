# FRAME ATLAS Library 기준점 기록 — 2026-10-29 / v13.29

## 최신 실행 기준
현행으로 사용할 프로그램은 `FRAME_ATLAS_3_0_v13.29_DATA_AND_CODE.zip`; 전체 백업은 `FRAME_ATLAS_MASTER_BACKUP_2026-10-29_v13.29.zip`이다. 두 ZIP은 SHA-256이 같고 내부 체크섬 검증을 통과했다. v13.29는 Library에 있던 v13.28 패키지에서 시작해 티맵 길찾기만 수정했다.

## 핵심 기준 자료
1. `FRAME_ATLAS_3_0_v13.29_DATA_AND_CODE.zip` — 최신 실행 코드·장소·사진/에디토리얼 데이터·매뉴얼·검수 결과.
2. `FRAME_ATLAS_MASTER_BACKUP_2026-10-29_v13.29.zip` — 위 앱 패키지와 바이트 동일 백업.
3. `FRAME_ATLAS_v13.29_NEXT_SESSION_CHECKPOINT_KO.md` — 상태, 다음 작업, 미검증 사항.
4. `FRAME_ATLAS_CHANGE_REPORT_v13.29_KO.md` — 변경 내용 및 검수 근거.
5. `FRAME_ATLAS_STATIC_VALIDATION_v13.29.json` 및 `FRAME_ATLAS_TMAP_ROUTE_TEST_v13.29.json` — 테스트 상세.
6. `FRAME_ATLAS_LIBRARY_CLEANUP_LOG_v13.29_KO.md` — Library 정리 기록과 보존 목록.

## Library 업로드 상태
2026-10-29에 v13.29 패키지/체크포인트 업로드를 시도했지만 Library 업로드 한도에 도달했다. 최신 ZIP은 현재 대화의 다운로드로 제공한다. Library에 남아 있는 v13.28 앱 ZIP/마스터 ZIP/보고서/체크포인트는 iPhone 실기기 검증 후 롤백 여부를 결정할 때까지 보존한다. v13.29 핵심 파일을 Library에 추가할 수 있게 된 후 이 기록을 다시 갱신한다.

## 에디토리얼 축적 기준 자료 — 삭제하지 않음
- `EDITORIAL_REFERENCE_GALLERY_STANDALONE_PREVIEW_v2.11.html`
- `EDITORIAL_REFERENCE_GALLERY_STANDALONE_v2.11_KO.zip`
- `EDITORIAL_REFERENCE_GALLERY_IMAGE_SOURCE_REGISTER_v2.1.csv`
- `EDITORIAL_REFERENCE_GALLERY_NEW_REFERENCES_v2.11.csv`
- `EDITORIAL_REFERENCE_GALLERY_EXPANSION_REPORT_v2.11_KO.md`
- `EDITORIAL_REFERENCE_CANDIDATES_PREVIEW_v2.19.html`
- `EDITORIAL_CATEGORY_COVERAGE_GAPS_v2.19.csv`
- `PHOTO_COVER_AUDIT.csv`
- `3.0_독립후보4곳_장소·사진권리_심층검토결과_v13.md`
- `3.0_독립후보4곳_이미지6건_출처·권리검토_v13.csv`
- `3.0_독립후보4곳_장소ID·운영·촬영준비_검토표_v13.csv`
- `frame-atlas-backup-2026-10-10.json`
- `frame-atlas-photos-only-2026-10-10.json`

## Library 정리 범위
기존 목록 189개 중 명백한 중복 v13.28 ZIP 및 오래된 v12/v5 계열의 반복 검수 보고서·사용 설명서·중간 파일 등 63개를 휴지통으로 이동했다. 남은 126개에는 최신 롤백 기준, 연구 원본, 사용자 데이터 백업, 최근 화면 캡처, 다른 프로젝트 파일 및 개인 자료가 포함된다. FRAME ATLAS와 무관한 파일 및 이미지 내용이 확인되지 않은 사진은 임의로 삭제하지 않는다.

## 현재 앱/검수 상태
- 앱 장소 421곳, 대표/후보 사진 665건.
- 티맵은 유효한 좌표가 있을 때 `tmap://route?rGoName=...&rGoX=경도&rGoY=위도` 사용. 좌표 조회 실패 시 홈페이지/검색 URI로 폴백하지 않는다. PC에서는 티맵 홈페이지를 열지 않고 모바일 티맵 사용을 안내한다.
- URL/control-flow 모의 검사 5/5, 정적 검수 통과. 실제 iPhone 앱 전환·도착점/진입점 정확성 및 GitHub 게시 이후 검증은 대기.
- 사용자 확인 후 서울 → 수도권 → 지방 순으로 전문 촬영 장소를 확대하고 실내:실외 비율은 대략 2:1 유지. 에디토리얼은 원문/이미지/소분류/중복/권리 확인 후 축적한다.
