# FRAME ATLAS 2.0 — 데스크톱 지연 이미지 재시도 18차

검토일: 2026-10-17 (KST)

## 확인 내용

- 소래습지·청사포 이미지의 출처 후보를 확인하는 회귀 검사는 유지합니다.
- 품질검사 #586에서는 데스크톱 사진 200개 중 199개가 로드됐고, 누락 표시는 0개였으나 서울시립미술관 남서울미술관 외관 카드 1개가 여전히 로딩 중이었습니다. 당시 fallback 후보 URL이 2개 남아 있어 실패가 확정된 상태는 아니었습니다.
- 기존 30초 전체 지연 로딩 점검은 유지하고, 그 후에도 로딩 중인 카드만 한 장씩 화면에 가져와 다시 시도하도록 테스트를 보강했습니다. 전체 200장의 외부 로드를 한꺼번에 강제하지 않습니다.
- 누락 상태와 재시도 후에도 로딩이 끝나지 않은 상태는 모두 검사 실패로 처리합니다.

## 영향

- 장소 200곳 / 사진 후보 307개는 변경 없음.
- 사진 URL·선택된 사진 ID·사용권 상태는 변경 없음.
- 사용자 매뉴얼에 지연 이미지 처리 방법을 추가했습니다.
- 확인 대상: [남서울미술관 외관 원문 이미지](https://mediahub.seoul.go.kr/archives/1198657)


## Final CI verification — 2026-10-17

- GitHub Actions quality run #587: **success**.
- Desktop: **200/200 loaded**, 0 missing, 0 pending.
- Mobile archive: **200/200 loaded**, 0 missing, 0 loading.
- Smoke result: **PASS**, zero page errors.
- GitHub Pages deployment #629: **success**.
- This verifies automated desktop/mobile browser emulation; it does not replace a physical iPhone Safari/PWA check.


## Batch 19 regression-test note

The follow-up quality run #588 loaded **200/200 desktop images** with zero missing/pending images but failed the Paradise City assertion because it compared the rendered URL string directly to the source-host string. The artifact's rendered image URL is an images.weserv.nl proxy containing the encoded original Esquire Korea path. The test is updated to decode the URL before checking the original source path. The app image fallback behavior and catalog data were not changed.
