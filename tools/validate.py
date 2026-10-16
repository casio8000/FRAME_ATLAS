#!/usr/bin/env python3
"""Validate the active FRAME ATLAS 2.0 catalogs and write a deterministic report."""
from __future__ import annotations

import copy
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP_ROOT = ROOT / "v2"
BASE_PATH = APP_ROOT / "data" / "places.json"
SUPPLEMENT_PATH = APP_ROOT / "data" / "art_locations_curated_20261016.json"
REPORT_PATH = ROOT / "tools" / "report.md"
ERRORS: list[str] = []


def load_catalog(path: Path, label: str) -> dict:
    if not path.is_file():
        ERRORS.append(f"{label} 카탈로그 파일이 없습니다: {path.relative_to(ROOT)}")
        return {"places": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        ERRORS.append(f"{label} 카탈로그 JSON을 읽을 수 없습니다: {exc}")
        return {"places": []}
    if not isinstance(data, dict) or not isinstance(data.get("places"), list):
        ERRORS.append(f"{label} 카탈로그에 places 배열이 없습니다.")
        return {"places": []}
    return data


def norm_name(value: object) -> str:
    return re.sub(r"\s+", "", str(value or "")).lower()


def duplicate_ids(places: list[dict]) -> list[tuple[str, int]]:
    count = Counter(str(p.get("id") or "") for p in places if isinstance(p, dict))
    return [(key, number) for key, number in count.items() if key and number > 1]


def merge_catalogs(base: dict, supplement: dict) -> tuple[list[dict], int, int]:
    places = copy.deepcopy(base.get("places") or [])
    ids = {p.get("id") for p in places if isinstance(p, dict)}
    names = {norm_name(p.get("name")) for p in places if isinstance(p, dict)}
    matched = 0
    appended = 0
    for incoming in supplement.get("places") or []:
        if not isinstance(incoming, dict) or not incoming.get("id"):
            ERRORS.append("보조 카탈로그 항목에 ID가 없습니다.")
            continue
        name = norm_name(incoming.get("name"))
        existing = next((p for p in places if isinstance(p, dict) and
                         (p.get("id") == incoming.get("id") or
                          (name and norm_name(p.get("name")) == name))), None)
        if existing is not None:
            matched += 1
            if incoming.get("curationOverride"):
                by_id = {c.get("id"): c for c in existing.get("imageCandidates", [])
                         if isinstance(c, dict) and c.get("id")}
                for candidate in incoming.get("imageCandidates") or []:
                    if isinstance(candidate, dict) and candidate.get("id"):
                        prior = by_id.get(candidate["id"], {})
                        by_id[candidate["id"]] = {**prior, **copy.deepcopy(candidate)}
                existing["imageCandidates"] = list(by_id.values())
                for key in ("primaryImageId", "referenceImageId"):
                    if key in incoming:
                        existing[key] = incoming[key]
                if incoming.get("overrideExistingFields") is True:
                    for key in ("name", "category", "imageStatus", "selectionStatus", "photoProfile", "summary"):
                        if isinstance(incoming.get(key), str) and incoming[key].strip():
                            existing[key] = incoming[key]
                    for key in ("aliases", "sourceRefs", "bestConcepts", "visualStrengths"):
                        if isinstance(incoming.get(key), list):
                            existing[key] = copy.deepcopy(incoming[key])
            continue
        if incoming.get("id") not in ids and (not name or name not in names):
            places.append(copy.deepcopy(incoming))
            ids.add(incoming["id"])
            if name:
                names.add(name)
            appended += 1
    return places, matched, appended


base = load_catalog(BASE_PATH, "기본")
supplement = load_catalog(SUPPLEMENT_PATH, "보조")
if base.get("schemaVersion") != 2:
    ERRORS.append("기본 카탈로그 schemaVersion이 2가 아닙니다.")
if duplicate_ids(base.get("places") or []):
    ERRORS.append("기본 카탈로그에 중복 장소 ID가 있습니다: " + str(duplicate_ids(base.get("places") or [])[:10]))
if duplicate_ids(supplement.get("places") or []):
    ERRORS.append("보조 카탈로그에 중복 장소 ID가 있습니다: " + str(duplicate_ids(supplement.get("places") or [])[:10]))

places, matched, appended = merge_catalogs(base, supplement)
seen_ids: set[str] = set()
candidates: list[dict] = []
for index, place in enumerate(places, 1):
    if not isinstance(place, dict):
        ERRORS.append(f"통합 카탈로그 {index}번째 장소 레코드가 객체가 아닙니다.")
        continue
    place_id = str(place.get("id") or "")
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,80}", place_id):
        ERRORS.append(f"장소 ID 형식 오류: {place_id or '(미기재)'}")
    if place_id and place_id in seen_ids:
        ERRORS.append(f"통합 카탈로그에 중복 장소 ID가 있습니다: {place_id}")
    seen_ids.add(place_id)
    for key in ("id", "name", "region", "category"):
        if not str(place.get(key) or "").strip():
            ERRORS.append(f"{place_id or index} 장소 필수값 누락: {key}")
    image_candidates = place.get("imageCandidates", [])
    if not isinstance(image_candidates, list):
        ERRORS.append(f"{place_id} imageCandidates가 배열이 아닙니다.")
        image_candidates = []
    local_ids: set[str] = set()
    for candidate in image_candidates:
        if not isinstance(candidate, dict):
            ERRORS.append(f"{place_id} 사진 후보 레코드가 객체가 아닙니다.")
            continue
        candidate_id = str(candidate.get("id") or "")
        if not candidate_id:
            ERRORS.append(f"{place_id} 사진 후보 ID가 없습니다.")
        elif candidate_id in local_ids:
            ERRORS.append(f"{place_id} 사진 후보 ID가 중복됩니다: {candidate_id}")
        local_ids.add(candidate_id)
        candidates.append(candidate)
        image_url = str(candidate.get("imageUrl") or "")
        if image_url and not re.match(r"^https?://", image_url, re.I):
            if image_url.startswith("./assets/places/"):
                local = (APP_ROOT / image_url[2:]).resolve()
                if APP_ROOT.resolve() not in local.parents or not local.is_file():
                    ERRORS.append(f"{place_id}/{candidate_id} 카탈로그가 참조하지만 없는 저장소 사진: {image_url}")
            else:
                ERRORS.append(f"{place_id}/{candidate_id} 지원하지 않는 이미지 주소: {image_url}")
        asset_path = str(candidate.get("assetPath") or "")
        if asset_path:
            if not asset_path.startswith("v2/assets/places/"):
                ERRORS.append(f"{place_id}/{candidate_id} assetPath 형식 오류: {asset_path}")
            local_asset = (ROOT / asset_path).resolve()
            if ROOT.resolve() not in local_asset.parents or not local_asset.is_file():
                ERRORS.append(f"{place_id}/{candidate_id} assetPath 파일을 찾을 수 없습니다: {asset_path}")
    for key in ("primaryImageId", "referenceImageId"):
        value = place.get(key)
        if value and value not in local_ids:
            ERRORS.append(f"{place_id} {key}가 존재하지 않는 사진 후보를 가리킵니다: {value}")
        elif value:
            selected = next((candidate for candidate in image_candidates
                             if isinstance(candidate, dict) and candidate.get("id") == value), None)
            if selected and (selected.get("status") == "rejected" or selected.get("placeMatch") != "confirmed"):
                ERRORS.append(
                    f"{place_id} {key}가 제외되었거나 장소 일치가 확인되지 않은 사진을 가리킵니다: {value}"
                )

records_with_candidates = sum(1 for p in places if isinstance(p, dict) and bool(p.get("imageCandidates")))
primary_count = sum(1 for p in places if isinstance(p, dict) and p.get("primaryImageId"))
reference_count = sum(1 for p in places if isinstance(p, dict) and p.get("referenceImageId"))
photos_with_refs = sum(1 for c in candidates if c.get("imageUrl") or c.get("sourceThumbnail") or c.get("assetPath") or c.get("pendingAsset"))
local_assets = sum(1 for c in candidates if c.get("assetPath") or str(c.get("imageUrl") or "").startswith("./assets/places/"))
missing_refs = sum(1 for c in candidates if not (c.get("imageUrl") or c.get("sourceThumbnail") or c.get("assetPath") or c.get("pendingAsset")))
match_review = sum(1 for c in candidates if c.get("placeMatch") != "confirmed")
rights_review = sum(1 for c in candidates if (c.get("usageRightsStatus") or c.get("rightsStatus")) not in
                    ("commercial-use-cleared", "user-owned", "public-domain-dedication"))
match_states = Counter(str(c.get("placeMatch") or "(미기재)") for c in candidates)
rights_states = Counter(str(c.get("usageRightsStatus") or c.get("rightsStatus") or "(미기재)") for c in candidates)

report = [
    "# FRAME ATLAS 2.0 데이터 검증 보고서",
    "",
    f"- 기본 카탈로그 {len(base.get('places') or [])}곳 · 보조 카탈로그 {len(supplement.get('places') or [])}개 · 기존 장소와 병합 {matched}건 · 별도 추가 {appended}곳 · 통합 장소 {len(places)}곳",
    f"- 구조 오류 {len(ERRORS)}건 · 사진 후보 출처/파일 경로 누락 {missing_refs}건 · 장소 일치 재검토 후보 {match_review}건 · 이미지 이용권 상태 재검토 후보 {rights_review}건",
    "",
    "## 장소 카탈로그 정합성",
    "",
    "| 항목 | 결과 |",
    "|---|---:|",
    f"| 기본 장소 카탈로그 | {len(base.get('places') or [])}곳 |",
    f"| 보조 장소 후보 | {len(supplement.get('places') or [])}개 |",
    f"| 보조 항목 중 기존 장소와 일치 | {matched}건 |",
    f"| 별도 장소로 통합 | {appended}곳 |",
    f"| 앱 기준 통합 장소 | {len(places)}곳 |",
    f"| 필수 ID·이름·지역·유형 누락 | {sum('장소 필수값 누락' in e for e in ERRORS)}건 |",
    f"| 중복 장소 ID | {len(duplicate_ids(places))}개 |",
    f"| 사진 후보 ID 중복 | {sum('사진 후보 ID' in e and '중복' in e for e in ERRORS)}건 |",
    f"| 참조가 끊긴 대표/참고 사진 ID | {sum('존재하지 않는 사진 후보' in e for e in ERRORS)}건 |",
    "",
    "## 사진 자료 현황",
    "",
    "| 항목 | 결과 |",
    "|---|---:|",
    f"| 사진 후보 전체 | {len(candidates)}개 |",
    f"| 사진 후보가 있는 장소 | {records_with_candidates}곳 |",
    f"| 사진 후보가 없는 장소 | {len(places) - records_with_candidates}곳 |",
    f"| 대표사진으로 지정된 장소 | {primary_count}곳 |",
    f"| 참고사진이 지정된 장소 | {reference_count}곳 |",
    f"| URL·저장소 파일 경로가 있는 후보 | {photos_with_refs}개 |",
    f"| GitHub 저장소 사진 파일로 등록된 후보 | {local_assets}개 |",
    f"| URL/파일 경로가 없는 후보 | {missing_refs}개 |",
    "",
    "### 장소 일치 상태",
    "",
    "| 상태 | 후보 수 |",
    "|---|---:|",
    *[f"| {key} | {value} |" for key, value in sorted(match_states.items())],
    "",
    "### 이용권 상태",
    "",
    "| 상태 | 후보 수 |",
    "|---|---:|",
    *[f"| {key} | {value} |" for key, value in sorted(rights_states.items())],
    "",
    "> URL이 있는 사진은 외부 주소를 참조하는 후보일 수 있으며, 이것이 장소 일치·이용권·상업 촬영 허가를 증명하지 않습니다. 새로 직접 등록한 사진 파일은 GitHub에 게시된 뒤에만 다른 기기에서도 같은 저장소 파일을 불러올 수 있습니다. 현장 확인이나 이용권이 미완료인 항목은 미확인 상태로 유지합니다.",
    "",
    "## 구조 오류",
    "",
    *([f"- {err}" for err in ERRORS] if ERRORS else ["- 없음"]),
    "",
]
REPORT_PATH.write_text("\n".join(report), encoding="utf-8")
print("\n".join(report[:4]))
for error in ERRORS:
    print("ERROR:", error)
raise SystemExit(1 if ERRORS else 0)
