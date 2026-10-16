#!/usr/bin/env python3
"""FRAME ATLAS 2.0 app-shell, catalog, offline-cache, and photo-publishing checks."""
from __future__ import annotations

import json
import re
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
APP_ROOT = ROOT / "v2"
HTML_PATH = APP_ROOT / "index.html"
JS_PATH = APP_ROOT / "assets" / "app.js"
CSS_PATH = APP_ROOT / "assets" / "app.css"
SW_PATH = APP_ROOT / "sw.js"
MANIFEST_PATH = APP_ROOT / "manifest.webmanifest"
CATALOG_PATH = APP_ROOT / "data" / "places.json"
SUPPLEMENTAL_PATH = APP_ROOT / "data" / "art_locations_curated_20261016.json"
errors: list[str] = []
checks: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def check_js(path: Path, label: str) -> None:
    if not path.is_file():
        fail(f"{label} 파일이 없습니다: {path.relative_to(ROOT)}")
        return
    try:
        result = subprocess.run(
            ["node", "--check", str(path)],
            text=True,
            capture_output=True,
            check=False,
            timeout=30,
        )
        if result.returncode:
            fail(f"{label} JavaScript 문법 오류:\n" + (result.stderr.strip() or result.stdout.strip()))
        else:
            checks.append(f"{label} JavaScript 문법 통과")
    except FileNotFoundError:
        fail("Node.js가 없습니다. GitHub Actions 환경에 Node.js를 설치해야 합니다.")
    except subprocess.TimeoutExpired:
        fail(f"{label} JavaScript 문법 검사 시간 초과")


for required_path, label in [
    (HTML_PATH, "2.0 시작 화면"),
    (JS_PATH, "2.0 앱 코드"),
    (CSS_PATH, "2.0 스타일"),
    (SW_PATH, "2.0 서비스 워커"),
    (MANIFEST_PATH, "2.0 웹 앱 매니페스트"),
    (CATALOG_PATH, "2.0 장소 카탈로그"),
    (SUPPLEMENTAL_PATH, "2.0 보조 장소 카탈로그"),
    (ROOT / "tests" / "v2-browser-smoke.cjs", "2.0 브라우저 스모크 테스트"),
]:
    if not required_path.is_file():
        fail(f"{label} 파일이 없습니다: {required_path.relative_to(ROOT)}")

if HTML_PATH.is_file():
    html = HTML_PATH.read_text(encoding="utf-8")
    # Confirm that all fixed local app resources referenced by the HTML still exist.
    refs = re.findall(r"""\b(?:src|href)\s*=\s*["']([^"']+)["']""", html, re.I)
    local_checked = 0
    for ref in refs:
        ref = ref.strip()
        if not ref or ref.startswith("#") or re.match(r"^[a-z][a-z0-9+.-]*:", ref, re.I):
            continue
        if re.match(r"^(?:https?:)?//", ref, re.I):
            continue
        # Only static resources are checked here; in-page routes/fragments are not files.
        path_part = ref.split("?", 1)[0].split("#", 1)[0]
        if not path_part:
            continue
        candidate = (APP_ROOT / path_part).resolve()
        if APP_ROOT.resolve() not in candidate.parents and candidate != APP_ROOT.resolve():
            fail(f"2.0 화면의 로컬 리소스 경로가 앱 폴더 밖을 가리킵니다: {ref}")
        elif not candidate.is_file():
            fail(f"2.0 화면에서 참조하지만 없는 로컬 리소스: {ref}")
        else:
            local_checked += 1
    checks.append(f"2.0 HTML 고정 리소스 {local_checked}개 확인")

    build_match = re.search(r'<meta\s+name=["\']app-build["\']\s+content=["\']([^"\']+)', html, re.I)
    if not build_match:
        fail("2.0 HTML에 app-build 버전이 없습니다.")
        build_id = ""
    else:
        build_id = build_match.group(1)
        checks.append(f"2.0 HTML 빌드 식별자 확인: {build_id}")

    if re.search(r"legacy-v5\.44\.html", html, re.I):
        fail("2.0 HTML에 공개 구버전 화면 링크가 남아 있습니다.")

    if 'assets/app.js?v=' not in html or 'assets/app.css?v=' not in html:
        fail("2.0 HTML에서 앱 JS/CSS의 버전 쿼리를 사용하지 않습니다.")
    else:
        checks.append("2.0 앱 JS/CSS 캐시 버전 쿼리 확인")
else:
    html = ""
    build_id = ""

check_js(JS_PATH, "2.0 앱 코드")

if SW_PATH.is_file():
    sw = SW_PATH.read_text(encoding="utf-8")
    sw_match = re.search(r'const\s+BUILD_ID\s*=\s*["\']([^"\']+)["\']', sw)
    if not sw_match:
        fail("2.0 서비스 워커 BUILD_ID를 읽을 수 없습니다.")
    elif build_id and sw_match.group(1) != build_id:
        fail(f"2.0 HTML/서비스 워커 빌드 불일치: {build_id} / {sw_match.group(1)}")
    else:
        checks.append("2.0 HTML과 서비스 워커 빌드 일치")

    core_match = re.search(r"const\s+CORE_FILES\s*=\s*\[([\s\S]*?)\];", sw)
    if not core_match:
        fail("2.0 서비스 워커 CORE_FILES 목록을 찾지 못했습니다.")
    else:
        core_paths = re.findall(r'["\']([^"\']+)["\']', core_match.group(1))
        missing = []
        for item in core_paths:
            item = item.split("?", 1)[0].split("#", 1)[0]
            if not item or item.startswith(("http://", "https://")):
                continue
            if item in (".", "./"):
                item = "index.html"
            resolved = (APP_ROOT / item).resolve()
            if APP_ROOT.resolve() not in resolved.parents and resolved != APP_ROOT.resolve():
                missing.append(item + " (앱 폴더 밖)")
            elif not resolved.is_file():
                missing.append(item)
        if missing:
            fail("2.0 서비스 워커의 캐시 선행 파일 누락: " + ", ".join(missing))
        else:
            checks.append(f"2.0 서비스 워커 캐시 선행 파일 {len(core_paths)}개 확인")

if MANIFEST_PATH.is_file():
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        start_url = str(manifest.get("start_url", ""))
        if not start_url:
            fail("2.0 manifest에 start_url이 없습니다.")
        else:
            start_path = start_url.split("?", 1)[0].split("#", 1)[0]
            if not (APP_ROOT / start_path).is_file():
                fail(f"2.0 manifest 시작 화면 파일이 없습니다: {start_url}")
            else:
                checks.append("2.0 manifest 시작 화면 경로 확인")
        if build_id and ("fa_build=" + build_id) not in start_url:
            fail(f"2.0 manifest start_url의 빌드 식별자가 현재 HTML과 다릅니다: {start_url}")
        elif build_id:
            checks.append("2.0 manifest 시작 주소 빌드 식별자 일치")
        for icon in manifest.get("icons", []):
            src = str(icon.get("src", ""))
            if src and not (APP_ROOT / src.split("?", 1)[0].split("#", 1)[0]).is_file():
                fail(f"2.0 manifest 아이콘 파일이 없습니다: {src}")
        if manifest.get("scope") not in ("./", "./"):
            fail(f"2.0 manifest scope가 앱 경로와 일치하지 않습니다: {manifest.get('scope')}")
        checks.append("2.0 manifest JSON 및 아이콘 경로 확인")
    except (json.JSONDecodeError, OSError) as exc:
        fail(f"2.0 manifest를 읽을 수 없습니다: {exc}")

# Validate the main and supplemental catalogs without rewriting or normalizing source data.
for path, label in [(CATALOG_PATH, "기본"), (SUPPLEMENTAL_PATH, "보조")]:
    if not path.is_file():
        continue
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        places = data.get("places")
        if not isinstance(places, list):
            fail(f"{label} 카탈로그에 places 배열이 없습니다.")
            continue
        seen = set()
        for number, place in enumerate(places, 1):
            if not isinstance(place, dict) or not place.get("id"):
                fail(f"{label} 카탈로그 {number}번째 항목에 id가 없습니다.")
                continue
            if place["id"] in seen:
                fail(f"{label} 카탈로그에 중복 장소 ID가 있습니다: {place['id']}")
            seen.add(place["id"])
            if not place.get("name") and not str(place["id"]).startswith("new-place-"):
                fail(f"{label} 카탈로그 항목에 장소명이 없습니다: {place['id']}")
            for candidate in place.get("imageCandidates", []):
                asset_path = candidate.get("assetPath") if isinstance(candidate, dict) else None
                if asset_path:
                    asset = (ROOT / str(asset_path)).resolve()
                    if ROOT.resolve() not in asset.parents:
                        fail(f"저장소 밖 사진 경로: {asset_path}")
                    elif not asset.is_file():
                        fail(f"카탈로그가 참조하지만 저장소에 없는 사진 파일: {asset_path}")
        checks.append(f"{label} 카탈로그 JSON / ID / 사진 경로 확인 ({len(places)}개 항목)")
    except (json.JSONDecodeError, OSError) as exc:
        fail(f"{label} 카탈로그를 읽을 수 없습니다: {exc}")

# Future uploaded photos should be repository assets; existing remote URLs remain supported.
if JS_PATH.is_file():
    app_js = JS_PATH.read_text(encoding="utf-8")
    for label, marker in {
        "GitHub 사진 업로드": 'Add FRAME ATLAS location photo',
        "저장소 사진 경로": 'v2/assets/places/',
        "사진 파일 업로드 후 카탈로그 경로 저장": 'c.assetPath=path',
        "기존 외부 이미지 주소 지원": 'c.imageUrl=url',
        "1 MiB 초과 원격 카탈로그 읽기 경로": 'raw.githubusercontent.com/casio8000/FRAME_ATLAS/main/',
        "사진 파일 선택 후 크기 제한": 'file.size>8*1024*1024',
    }.items():
        if marker not in app_js:
            fail(f"2.0 사진/게시 기능 코드가 누락되었습니다: {label}")
        else:
            checks.append(f"2.0 {label} 확인")

# The retired root worker must not hijack V2 URLs or purge the V2 cache namespace.
root_sw_path = ROOT / "sw.js"
if not root_sw_path.is_file():
    fail("루트 서비스 워커 파일이 없습니다.")
else:
    root_sw = root_sw_path.read_text(encoding="utf-8")
    if not re.search(r"const\\s+CACHE_NAME\\s*=\\s*['\"]frame-atlas-root-bridge-[^'\"]+['\"]", root_sw):
        fail("루트 서비스 워커가 V2 전환용 캐시 이름을 사용하지 않습니다.")
    if "path.startsWith(v2Prefix)" not in root_sw or "path === v2Prefix.slice(0, -1)" not in root_sw:
        fail("루트 서비스 워커가 /v2/ 요청을 제외하지 않습니다.")
    if "!k.startsWith('frame-atlas-v2-')" not in root_sw:
        fail("루트 서비스 워커가 V2 캐시 공간을 보호하지 않습니다.")
    if all(marker in root_sw for marker in ["path.startsWith(v2Prefix)", "path === v2Prefix.slice(0, -1)", "!k.startsWith('frame-atlas-v2-')"]):
        checks.append("루트 서비스 워커가 V2 경로와 V2 캐시를 보호함")

# Root URL should lead to the supported 2.0 app, not expose the archived V5 page.
root_index = ROOT / "index.html"
if root_index.is_file():
    root_html = root_index.read_text(encoding="utf-8")
    if "v2/index.html" not in root_html:
        fail("저장소 첫 화면이 FRAME ATLAS 2.0으로 이동하지 않습니다.")
    if re.search(r'href=["\'][^"\']*legacy-v5\.44\.html', root_html, re.I):
        fail("저장소 첫 화면에 구버전 공개 링크가 남아 있습니다.")
    if "v2/index.html" in root_html and not re.search(r'href=["\']legacy-v5\.44\.html', root_html, re.I):
        checks.append("저장소 첫 화면이 2.0으로 연결되고 구버전 링크가 숨겨짐")

if errors:
    print("FRAME ATLAS 2.0 정적 검사: 실패")
    for item in errors:
        print("ERROR:", item)
    raise SystemExit(1)
print("FRAME ATLAS 2.0 정적 검사: 통과")
for item in checks:
    print("OK:", item)
