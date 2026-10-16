# FRAME ATLAS 2.0 — 이미지 후보 검증 2차

검토일: 2026-10-16 (KST)  
카탈로그는 기존 200곳을 유지했습니다. 이번 단계는 중복 원본 사진 URL이 다른 후보 ID로 여러 번 등록된 항목을 줄이고 선택된 참고사진을 보존하는 작업입니다.

## 중복 후보 정리

| 장소 | 보존한 후보 ID | 제외한 중복 후보 | 처리 |
|---|---|---|---|
| LG아트센터 서울 TUBE | `ref-lg-arts-center-official-tube-2026` | `img-lg-arts-center-tube-official` | 공식 건축 오디오 투어 사진과 같은 경로를 가리키는 구형 기록을 제외. |
| 장생포문화창고 | `ref-jangsaengpo-mk-culture-warehouse-2026` | `img-jangsaengpo-mediaart-mk` | 매일경제 원문이 장생포문화창고 미디어아트라고 설명하는 동일 이미지 URL의 중복 기록을 제외. |
| 서울새활용플라자 | `ref-upcycling-seoulmediahub-2026` | `ref-seoul-upcycling-plaza-exterior`, `img-seoul-upcycling-plaza-mediahub` | 서울시 미디어허브 원문과 ‘SUP’ 간판이 보이는 동일 사진의 중복 두 건을 제외. |
| 서울시청 신청사 유리 파사드 | `ref-seoul-cityhall-mediahub-2026` | `ref-seoul-city-hall-facade`, `img-seoul-city-hall-mediahub`, `ref-seoul-city-hall-glass-facade` | 서울시 공식 원문 사진과 같은 URL로 등록된 중복 세 건을 제외. |
| 서울생활사박물관 | `img-seoul-urban-life-museum-mediahub` | `ref-seoul-urban-life-museum-entrance` | 한글·영문 시설명이 보이는 같은 외관 사진의 중복 기록을 제외. |

모든 제외 기록은 삭제하지 않고 `status=rejected`로 보존했습니다. 원본 URL·출처 이력은 유지하며, 선택한 참고사진은 변경하지 않았습니다. 사진 재사용 권리와 현장 촬영 허가는 별도 미확인입니다.

## 검증 결과

- 통합 장소: **200곳** (변경 없음)
- 사진 후보 레코드: **307개** (제외 이력 포함)
- 활성 장소-사진 일치 검토 대상: **26개**
- 이용권이 명확히 확인되지 않은 사진 후보: **306개**
- 대표사진/참고사진 연결 오류 및 구조 오류: **0건**
- 기존 선택된 참고사진 ID 및 최근 14개 장소의 사진 지정은 변경하지 않았습니다.

## 출처

- [LG아트센터 서울 공식 건축 오디오 투어 — 튜브](https://www.lgart.com/architecture/ko/audio/5)
- [서울시 미디어허브 — 서울새활용플라자](https://mediahub.seoul.go.kr/archives/2018487)
- [서울시 미디어허브 — 서울시 신청사 소개](https://mediahub.seoul.go.kr/archives/160215)
- [매일경제 — 장생포문화창고 사진 원문](https://www.mk.co.kr/news/society/11079574)

사진 장소 일치, URL 작동 여부, 사진 재사용 권리, 현장 상업촬영 허가는 서로 다른 항목으로 관리합니다.
