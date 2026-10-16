# FRAME ATLAS V5 구형 애플리케이션·데이터 보관소

이 폴더는 FRAME ATLAS V5 계열의 복구·참고용 코드와 원본 데이터를 보존합니다. **현재 서비스 앱은 [FRAME ATLAS 2.0](../../v2/index.html)이며, 이 폴더의 코드는 신규 편집·게시 기능에 사용하지 않습니다.**

- `data/places.js`: 구형 214개 장소 레코드. 원본 Git blob을 그대로 보존합니다.
- `data/DB_SCHEMA.json`: V5 데이터 가져오기 형식.
- `data/backup-merge.js`, `data/device-sync.js`: 이전 백업 병합·기기별 동기화 모듈. 해당 안전성 회귀 테스트는 현재 CI에서 아카이브 코드를 대상으로 실행합니다.
- `data/legacy-v6-audit.js`: 구형 V6 개인 자료를 읽기 전용으로 살펴보는 도구.
- `data/review-workflow.js`, `data/image-registry.js`: V5의 장소 검증 워크스페이스 및 이미지 레지스트리.
- `data/서울수도권_추가장소_기본가져오기.csv`, `data/서울수도권_추가장소_상세데이터.json`: 이전 장소 검토용 내보내기 자료.
- `tools/harvest_images.py`: V5 데이터 전용 이미지 후보 수집기. V2 카탈로그나 사진 게시에 사용하지 마세요.
- `assets/icons/icon-128.png`: 현재 매니페스트·서비스 워커·2.0 화면에서 참조하지 않는 구형 아이콘.
- `validate_legacy_v5.py`, `report_v5.md`: 구형 장소 데이터의 이전 검증기와 보고서.

현재 2.0의 장소 수·사진 후보·저장소 사진 경로 상태는 [현재 보고서](../../tools/report.md)를, 사용 방법은 [2.0 사용자 매뉴얼](../../v2/USER_MANUAL_KO.html)을 참고하세요.

루트의 구형 데이터·수집기 경로는 정리했지만, 원본은 내용 변경 없이 이 아카이브에 남겼습니다. 같은 내용의 중복 `추가장소_검토자료.csv/json` 파일은 읽기 쉬운 이름의 서울수도권 내보내기 한 쌍과 Git blob SHA가 같아 정본 한 쌍만 보존했습니다.
