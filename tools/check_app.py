#!/usr/bin/env python3
"""FRAME ATLAS 앱 셸 및 인라인 JavaScript 정적 검사."""
from __future__ import annotations

import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_PATH = ROOT / "index.html"
SW_PATH = ROOT / "sw.js"
MANIFEST_PATH = ROOT / "manifest.json"
errors: list[str] = []
checks: list[str] = []

def fail(message: str) -> None:
    errors.append(message)

if not HTML_PATH.is_file():
    print("ERROR: index.html이 없습니다.")
    raise SystemExit(1)
html = HTML_PATH.read_text(encoding="utf-8")
sw = SW_PATH.read_text(encoding="utf-8") if SW_PATH.is_file() else ""
if not SW_PATH.is_file():
    fail("sw.js가 없습니다.")

# 앱에서 참조하는 로컬 script 파일이 저장소에 존재하는지 확인합니다.
script_tags = list(re.finditer(r"<script\b([^>]*)>([\s\S]*?)</script\s*>", html, re.I))
if not script_tags:
    fail("script 태그를 찾지 못했습니다.")
inline_scripts = []
for match in script_tags:
    attrs, body = match.group(1), match.group(2)
    src_match = re.search(r"""\bsrc\s*=\s*["']([^"']+)["']""", attrs, re.I)
    if src_match:
        src = src_match.group(1)
        if not re.match(r"^(?:https?:)?//|^data:", src, re.I):
            local_path = (ROOT / src.split("?", 1)[0].split("#", 1)[0]).resolve()
            if ROOT.resolve() not in local_path.parents and local_path != ROOT.resolve():
                fail(f"저장소 밖을 가리키는 script 경로: {src}")
            elif not local_path.is_file():
                fail(f"존재하지 않는 로컬 script: {src}")
    elif not re.search(r"""\btype\s*=\s*["']application/(?:ld\+json|json)["']""", attrs, re.I):
        inline_scripts.append(body)
checks.append(f"script 태그 {len(script_tags)}개 확인")

# 인라인 코드 블록 전체를 하나의 파일로 이어붙여 문법을 검사합니다.
# 개별 태그마다 검사할 때 놓칠 수 있는 최상위 const/let 중복 선언도 함께 찾습니다.
combined_js = "\n;\n".join(inline_scripts)
with tempfile.TemporaryDirectory(prefix="frame-atlas-check-") as tmp:
    js_path = Path(tmp) / "inline-app.js"
    js_path.write_text(combined_js, encoding="utf-8")
    try:
        result = subprocess.run(
            ["node", "--check", str(js_path)],
            text=True,
            capture_output=True,
            check=False,
            timeout=30,
        )
        if result.returncode:
            fail("인라인 JavaScript 문법 오류:\n" + (result.stderr.strip() or result.stdout.strip()))
        else:
            checks.append("인라인 JavaScript 문법 통과 (Node.js --check)")
    except FileNotFoundError:
        fail("Node.js가 없습니다. GitHub Actions 환경에 Node.js를 설치해야 합니다.")
    except subprocess.TimeoutExpired:
        fail("JavaScript 문법 검사 시간 초과")

# PWA manifest 및 아이콘 경로를 검사합니다.
if not MANIFEST_PATH.is_file():
    fail("manifest.json이 없습니다.")
else:
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        start_url = str(manifest.get("start_url", ""))
        if not start_url:
            fail("manifest.json에 start_url이 없습니다.")
        elif not (ROOT / start_url.split("?", 1)[0].split("#", 1)[0]).is_file():
            fail(f"manifest start_url 파일이 없습니다: {start_url}")
        for icon in manifest.get("icons", []):
            src = str(icon.get("src", ""))
            if src and not (ROOT / src.split("?", 1)[0].split("#", 1)[0]).is_file():
                fail(f"manifest 아이콘 파일이 없습니다: {src}")
        checks.append("manifest JSON 및 시작 화면/아이콘 경로 통과")
    except (json.JSONDecodeError, OSError) as exc:
        fail(f"manifest.json을 읽을 수 없습니다: {exc}")

# 화면 버전과 서비스 워커 캐시 이름이 서로 어긋나면 오래된 화면이 남을 수 있습니다.
version_match = re.search(r"<title>\s*FRAME ATLAS v([0-9]+\.[0-9]+)", html, re.I)
cache_match = re.search(r"CACHE_NAME\s*=\s*['\"]frame-atlas-v([0-9]+\.[0-9]+)-", sw)
if not version_match:
    fail("페이지 제목에서 앱 버전을 읽을 수 없습니다.")
elif not cache_match:
    fail("서비스 워커 캐시 이름에 버전이 없습니다.")
elif version_match.group(1) != cache_match.group(1):
    fail(f"앱/서비스 워커 버전 불일치: {version_match.group(1)} / {cache_match.group(1)}")
else:
    checks.append(f"앱과 서비스 워커 버전 일치: v{version_match.group(1)}")

# 아이폰 복원·이미지 가져오기 경로에 대한 회귀 검사입니다.
required = {
    "더보기 메뉴의 이미지 가져오기": "['image','장소 이미지 가져오기'",
    "이미지 가져오기 메뉴 핸들러": "async function openImageImport(",
    "이미지 전용 가져오기 함수": "async function bkApplyImages(",
    "iOS 대응 FileReader 사용": "new FileReader()",
    "공통 Data URL → Blob 변환 함수": "function faBackupDataUrlToBlob(data)",
}
for label, token in required.items():
    if token not in html:
        fail(f"필수 기능 코드 누락: {label}")
    else:
        checks.append(f"{label} 확인")
if html.count("faBackupDataUrlToBlob(o.data)") < 3:
    fail("전체 백업 복원과 공유 백업 적용에서 공통 Blob 변환 함수를 모두 사용하지 않습니다.")
if re.search(r"fetch\(o\.data\)\)\.blob\(\)", html):
    fail("레거시 fetch(Data URL).blob() 복원 코드가 남아 있습니다.")
if "더보기 → 데이터 관리" in html:
    fail("사용 안내에 실제 메뉴와 다른 '더보기 → 데이터 관리' 경로가 남아 있습니다.")

# 공유 전체 스냅샷은 로컬 개인 데이터가 있을 때 자동으로 덮어쓰면 안 됩니다.
for label, token in {
    "공유 백업 적용 전 전체 백업 생성": "async function faDownloadPreApplyBackup()",
    "공유 스냅샷 변경 시 보류 상태": "const FA531_PENDING_HASH='fa532SharedSnapshotPendingHash'",
    "백그라운드 자동 적용 차단": "if(!manual)",
    "백업 후 재확인 절차": "const pendingHash=localStorage.getItem(FA531_PENDING_HASH)",
    "복원 전 명시적 사용자 확인": "const ok=confirm('안전 백업을 파일로 저장했는지 확인하세요.",
}.items():
    if token not in html:
        fail(f"공유 동기화 안전 검사 누락: {label}")
    else:
        checks.append(f"{label} 확인")

apply_start = html.find("async function faApplySharedSnapshot(d,hash,manual)")
clear_at = html.find("const stores=['places','pmeta','pblob'];for(const st of stores)await IDB.clear(st);", apply_start)
guard_at = html.find("const pendingHash=localStorage.getItem(FA531_PENDING_HASH)", apply_start)
confirm_at = html.find("const ok=confirm('안전 백업을 파일로 저장했는지 확인하세요.", apply_start)
if min(apply_start, clear_at, guard_at, confirm_at) < 0 or not (apply_start < guard_at < confirm_at < clear_at):
    fail("공유 스냅샷의 백업·확인 절차가 로컬 저장소 초기화보다 앞에 있지 않습니다.")
else:
    checks.append("공유 스냅샷 초기화 전 안전 게이트 순서 확인")

# 예전 안내가 자동 덮어쓰기를 약속하지 않도록 회귀 검사합니다.
for obsolete in [
    "이후 변경된 백업은 자동 반영됩니다.",
    "새 버전을 자동 반영합니다.",
    "기기 간 자동 반영을 원하면",
]:
    if obsolete in html:
        fail(f"오래된 공유 백업 자동 반영 안내가 남아 있습니다: {obsolete}")
    else:
        checks.append(f"오래된 자동 덮어쓰기 안내 제거: {obsolete}")

# 화면 출력 경로의 HTML 이스케이프와 동적 URL 검증 회귀 검사입니다.
for label, token in {
    "HTML 문자 이스케이프 함수": "const esc=",
    "이미지 주소 제한 함수": "function safeImageSrc(value)",
    "http/https 링크 제한 함수": "function safeHref(value)",
}.items():
    if token not in html:
        fail(f"필수 출력 보안 처리 누락: {label}")
    else:
        checks.append(f"{label} 확인")
for raw, label in [
    ('<div class="name">${x.name}</div>', "장소 카드의 미이스케이프 장소명"),
    ('href="${x.naver}"', "검증되지 않은 Naver 주소 직접 삽입"),
    ('href="${x.google}"', "검증되지 않은 Google 주소 직접 삽입"),
    ('href="${x.officialUrl}"', "검증되지 않은 공식 URL 직접 삽입"),
    ('src="${m.url||phOf(k)}"', "미검증 이미지 주소 직접 삽입"),
]:
    if raw in html:
        fail(f"미해결 동적 출력 패턴: {label}")


if errors:
    print("FRAME ATLAS 정적 검사: 실패")
    for item in errors:
        print("ERROR:", item)
    raise SystemExit(1)
print("FRAME ATLAS 정적 검사: 통과")
for item in checks:
    print("OK:", item)
