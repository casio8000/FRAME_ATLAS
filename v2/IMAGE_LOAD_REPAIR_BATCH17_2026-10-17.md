# FRAME ATLAS 2.0 — 이미지 로딩 복구 17차

검토일: 2026-10-17 (KST)

## 실패 원인

최근 데스크톱 브라우저 감사(#584)에서 활성 이미지 200개 중 198개는 로드됐지만, 부산 청사포 다릿돌전망대와 소래습지생태공원은 원본 주소와 대체 이미지 프록시가 모두 실패해 ‘사진을 불러올 수 없습니다’ 상태가 확인됐습니다.

## 복구 내역

| 장소 | 이전 이미지 | 새 이미지 | 변경 내용 |
|---|---|---|---|
| 부산 청사포 다릿돌전망대 | 부산시 `getImage` API 및 프록시 대체 모두 실패 | [Klook CDN 사진](https://www.klook.com/en-GB/activity/74132-busan-oneday-tour-busan/) | 실제 유리 보행교의 곡선, 바다, 보행자 스케일이 보이는 사진으로 교체했습니다. 부산시 공식 전망대 안내는 장소 확인 근거로 별도 연결했습니다. |
| 소래습지생태공원 | 인천투어 `viewImg.do` 및 `images.weserv.nl` / `wsrv.nl` 대체 실패 | [Daum CDN 사진](https://v.daum.net/v/9CoaMZmjHO) | 풍차, 갈대밭, 데크길과 원근이 보이는 사진으로 교체했습니다. 기존 주소와 실패한 프록시 주소는 보존했습니다. |

앱의 이미지 대체 처리도 수정했습니다. URL이 이미 `images.weserv.nl` 또는 `wsrv.nl` 프록시 결과일 경우 다른 프록시로 다시 감싸지 않습니다.

## 검증 기준 및 영향

- 장소 수: **200곳** (변경 없음)
- 사진 후보: **307개** (변경 없음)
- 두 사진의 PC·모바일 로드 여부를 별도 회귀검사에 추가했습니다.
- 데스크톱 검사는 누락 상태뿐 아니라 종료 시점에 계속 로딩 중인 이미지가 있어도 실패합니다.
- 사진 재사용 권리와 현장 상업촬영 허가는 바뀌지 않았습니다. 두 후보 모두 별도 검토 대상입니다.
- 캐시 식별자: `20261017-117`

## 출처

- [Klook — Busan Day Tour](https://www.klook.com/en-GB/activity/74132-busan-oneday-tour-busan/)
- [부산시 — 청사포 다릿돌전망대 안내](https://www.busan.go.kr/news/storyreport/view?dataNo=70451&gugun=Prev)
- [데일리여행스케치 — 소래습지생태공원 사진 및 장소 설명](https://v.daum.net/v/9CoaMZmjHO)
- [인천투어 — 소래습지생태공원(기존 사진 이력)](https://itour.incheon.go.kr/ssst/ssst/detail.do?cotId=ITD21121615132555085)
