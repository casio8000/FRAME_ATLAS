# 구버전 애플리케이션과 검증 자료

이 폴더는 FRAME ATLAS V5 계열의 복구·참고용 코드를 보관합니다. 현재 서비스 앱은 /v2/index.html이고, 신규 개발과 검증은 현재 tools/validate.py 및 v2/를 기준으로 합니다.

- validate_legacy_v5.py: 구형 루트 data/places.js의 214개 레코드를 검증하는 이전 도구
- report_v5.md: 이전 214개 데이터 검증 보고서
- data/places.js: 구형 장소 원본은 저장소 루트에 그대로 보존 중이며, 롤백에 쓰일 수 있으므로 이번 단계에서는 이동하지 않았습니다.

현재 2.0의 장소 수, 사진 후보, 실제 저장소 사진 경로 상태는 tools/report.md를 참고하세요.
