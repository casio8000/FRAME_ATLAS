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
SYNC_PATH = ROOT / "data" / "device-sync.js"
AUDIT_PATH = ROOT / "data" / "legacy-v6-audit.js"
AUDIT_TEST_PATH = ROOT / "tests" / "legacy-v6-audit.test.js"
SYNC_TEST_PATH = ROOT / "tools" / "test_device_sync.js"
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
if not SYNC_PATH.is_file():
    fail("data/device-sync.js가 없습니다.")
if not AUDIT_PATH.is_file():
    fail("data/legacy-v6-audit.js가 없습니다.")
if not AUDIT_TEST_PATH.is_file():
    fail("tests/legacy-v6-audit.test.js가 없습니다.")
if not SYNC_TEST_PATH.is_file():
    fail("tools/test_device_sync.js가 없습니다.")

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

# 독립 동기화 엔진 파일도 Node.js로 별도 문법 검사합니다.
if SYNC_PATH.is_file():
    try:
        result = subprocess.run(
            ["node", "--check", str(SYNC_PATH)],
            text=True,
            capture_output=True,
            check=False,
            timeout=30,
        )
        if result.returncode:
            fail("기기별 동기화 엔진 JavaScript 문법 오류:\n" + (result.stderr.strip() or result.stdout.strip()))
        else:
            checks.append("기기별 동기화 엔진 문법 통과 (Node.js --check)")
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        fail(f"기기별 동기화 엔진 문법 검사 실패: {exc}")

# 이전 V6 데이터 점검 모듈도 별도 문법 검사를 거칩니다.
if AUDIT_PATH.is_file():
    try:
        result = subprocess.run(
            ["node", "--check", str(AUDIT_PATH)],
            text=True,
            capture_output=True,
            check=False,
            timeout=30,
        )
        if result.returncode:
            fail("이전 V6 점검 모듈 JavaScript 문법 오류:\n" + (result.stderr.strip() or result.stdout.strip()))
        else:
            checks.append("이전 V6 점검 모듈 문법 통과 (Node.js --check)")
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        fail(f"이전 V6 점검 모듈 문법 검사 실패: {exc}")

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
    "안전 병합 모듈 스크립트": 'src="data/backup-merge.js"',
    "로컬 우선 병합 함수 호출": "window.FABackupMerge.mergeRaw",
    "병합 복원 버튼 충돌 정책": "새 항목 추가 · 충돌 시 현재 기기 우선",
    "수동 백업 병합의 삭제 정책": "삭제를 다른 백업에 전파하지 않습니다",
    "구형 공유 스냅샷과 자동 동기화 구분": "이 구형 공유 스냅샷 방식은 자동 양방향 동기화가 아닙니다",
}
for label, token in required.items():
    if token not in html:
        fail(f"필수 기능 코드 누락: {label}")
    else:
        checks.append(f"{label} 확인")
if "async function bkApply(replace)" not in html or "window.FABackupMerge.mergeValues" not in html:
    fail("백업 복원 경로에 안전한 항목별 병합 로직이 없습니다.")
else:
    checks.append("백업의 항목별 안전 병합 경로 확인")

if html.count("faBackupDataUrlToBlob(o.data)") < 3:
    fail("전체 백업 복원과 공유 백업 적용에서 공통 Blob 변환 함수를 모두 사용하지 않습니다.")
if re.search(r"fetch\(o\.data\)\)\.blob\(\)", html):
    fail("레거시 fetch(Data URL).blob() 복원 코드가 남아 있습니다.")
if "더보기 → 데이터 관리" in html:
    fail("사용 안내에 실제 메뉴와 다른 '더보기 → 데이터 관리' 경로가 남아 있습니다.")

if "async async function ghApi" in html:
    fail("GitHub API 함수에 중복 async 선언이 남아 있습니다.")
else:
    checks.append("GitHub API 함수 선언 확인")
if "자동 양방향 동기화는 아직 구현되지 않았습니다" in html:
    fail("현재 버전과 맞지 않는 자동 동기화 미구현 안내가 남아 있습니다.")
else:
    checks.append("구형 도움말의 자동 동기화 안내 최신화 확인")

# 새 기기별 동기화는 비공개 저장소, 백업 게이트 및 항목별 병합을 요구합니다.
sync_js = SYNC_PATH.read_text(encoding="utf-8") if SYNC_PATH.is_file() else ""
for label, token in {
    "기기별 동기화 모듈 연결": 'src="data/device-sync.js',
    "이전 V6 점검 모듈 연결": 'src="data/legacy-v6-audit.js"',
    "비공개 저장소 강제": 'if (repo.private !== true)',
    "기기별 독립 레코드 경로": 'const ROOT_PATH = "sync/v1/devices"',
    "동기화 전 안전 백업 확인": 'const backupGateAt = Number(root.localStorage.getItem(BACKUP_GATE_KEY) || 0);',
    "사진 파일 개별 전송": 'if (rec.store === "pblob")',
    "충돌 사진의 로컬 보존": 'action: "preserve-local-photo"',
    "충돌 내역 조회 함수": "function getConflicts()",
    "삭제 기록 시각 비교": "function remoteSupersedesDelete(",
    "동기화 중 추가 변경 재실행": "let rerunRequested = false;",
}.items():
    source = html if label in {"기기별 동기화 모듈 연결", "이전 V6 점검 모듈 연결"} else sync_js
    if token not in source:
        fail(f"기기별 동기화 안전 검사 누락: {label}")
    else:
        checks.append(f"{label} 확인")
# Temporary API/network failures must retry with a bounded backoff; auth/permission errors must not loop.
for label, token in {
    "일시 오류 재시도 분류": "function isRetryableError(error)",
    "제한된 지수형 재시도 일정": "const RETRY_DELAYS = [5000, 15000, 30000, 60000, 120000];",
    "재시도 중지 시 타이머 정리": "clearRetry(true);",
    "실패 후 자동 재시도 예약": "queueRetry(error);",
}.items():
    if token not in sync_js:
        fail(f"기기별 동기화 재시도 안정성 검사 누락: {label}")
    else:
        checks.append(f"{label} 확인")

if "core.isRetryableError" not in (ROOT / "tools" / "test_device_sync.js").read_text(encoding="utf-8"):
    fail("일시적 동기화 오류 분류 테스트가 없습니다.")
else:
    checks.append("일시적 동기화 오류 분류 테스트 확인")

if 'faDeviceSyncShowConflicts()' not in html:
    fail("동기화 충돌 내역 조회 버튼이 없습니다.")
else:
    checks.append("동기화 충돌 내역 조회 버튼 확인")
if "async function ghPush(){const s=$('gh_s'),ls={};if(localStorage.getItem('faDeviceSyncEnabled')==='1')" not in html:
    fail("안전 동기화 사용 중 기존 단일 파일 업로드가 차단되지 않습니다.")
else:
    checks.append("안전 동기화와 기존 단일 파일 업로드 간섭 방지 확인")
if "async function ghPull(){const s=$('gh_s');if(localStorage.getItem('faDeviceSyncEnabled')==='1')" not in html:
    fail("안전 동기화 사용 중 기존 단일 파일 내려받기가 차단되지 않습니다.")
else:
    checks.append("안전 동기화와 기존 단일 파일 내려받기 간섭 방지 확인")

if "if(ri.private!==true)" not in html:
    fail("기존 백업 API의 공개 저장소 차단 검사가 없습니다.")
else:
    checks.append("기존 백업 API의 비공개 저장소 강제 확인")
if "if(repoInfo.private!==true)" not in html:
    fail("기존 공유 스냅샷의 공개 저장소 차단 검사가 없습니다.")
else:
    checks.append("기존 공유 스냅샷의 비공개 저장소 강제 확인")

if "node tools/test_device_sync.js" not in (ROOT / ".github/workflows/quality-check.yml").read_text(encoding="utf-8"):
    fail("GitHub Actions에 기기별 동기화 테스트가 연결되지 않았습니다.")
else:
    checks.append("GitHub Actions 기기별 동기화 테스트 연결 확인")

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
