# FRAME ATLAS · PHOTO LOCATION SCOUT

## 현재 사용하는 앱

**FRAME ATLAS 2.0**  
https://casio8000.github.io/FRAME_ATLAS/v2/index.html

현재 장소 카탈로그와 사진 검토 작업은 `v2/`에서 진행합니다. 사용법은 [간단 사용자 매뉴얼](v2/USER_MANUAL_KO.html)을 참고하세요.

## 프로젝트 구조

- `v2/index.html`: 2.0 앱 화면
- `v2/assets/app.js`, `v2/assets/app.css`: 동작과 반응형 디자인
- `v2/data/places.json`: 전국 촬영 장소 카탈로그
- `v2/USER_MANUAL_KO.html`: 사용자 매뉴얼
- `v2/CONTINUATION_CHECKPOINT.md`: 다음 작업을 이어갈 때 확인할 최신 체크포인트
- `.github/workflows/quality-check.yml`: 데이터·앱·PC/모바일 브라우저 자동 검사

저장소 루트의 `index.html`은 FRAME ATLAS 2.0으로 이동시키는 진입점입니다. 중복 V5.44 화면 파일은 자동 검사가 실제 서비스 중인 2.0을 직접 검증하도록 바꾼 뒤 기본 브랜치에서 제거했습니다. 원본 파일은 `backup/legacy-material-before-cleanup-2026-10-15` 브랜치의 루트 `index.html`과 동일한 Git blob(SHA `ec2ffb4e88c379751076a9e0a7b49ed84db72f41`)로 보존됩니다. 루트의 `data/`, `sw.js`, `manifest.json` 및 백업·동기화 모듈은 오프라인·복구 경로와 2.0으로의 기능 이관을 추가 점검하기 전까지 유지합니다.

## 관리자 모드와 게시 권한

관리자 화면은 등록된 두 비밀번호 중 하나로 잠금을 해제합니다. 첫 방문자가 임의의 새 비밀번호를 등록할 수는 없습니다. 이 화면 잠금은 공개 정적 웹앱의 서버 인증은 아니므로, 실제 GitHub 게시에는 저장소 범위가 제한된 쓰기 토큰이 별도로 필요합니다. 비밀번호와 GitHub 토큰은 공개 문서나 코드에 기록하지 마세요.

## 데이터와 사진 관련 원칙

장소 사진이 표시된다고 해서 장소 일치·재사용 권리·상업 촬영 허가가 확인됐다는 의미는 아닙니다. 이미지 출처, 장소 일치, 이용 조건, 실제 촬영 허가를 각각 확인합니다. 기기별 개인 초안은 다른 기기에 자동으로 복사된다고 가정하지 말고, 중요한 작업 전후 JSON 백업을 보관합니다.

## 자동 검증

- [품질 검사](https://github.com/casio8000/FRAME_ATLAS/actions/workflows/quality-check.yml)
- [Pages 배포](https://github.com/casio8000/FRAME_ATLAS/actions/workflows/pages-build-deployment)

이전 v5.x 변경 기록·이미지 감사 보고서와 사용하지 않는 중간 아이콘 파일은 2026-10-15에 정리했습니다. 삭제된 파일의 원본은 아래 백업 브랜치에서 복구할 수 있습니다.

**정리 전 전체 백업:** [backup/legacy-material-before-cleanup-2026-10-15](https://github.com/casio8000/FRAME_ATLAS/tree/backup/legacy-material-before-cleanup-2026-10-15)
