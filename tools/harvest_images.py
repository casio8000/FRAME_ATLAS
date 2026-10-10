#!/usr/bin/env python3
"""FRAME ATLAS 대표 이미지 후보 수집기 (사용자 PC에서 실행; 인터넷 필요)

사용:  python tools/harvest_images.py            # 이미지 없는 장소 전체
       python tools/harvest_images.py L-040 L-211 # 지정한 장소만
       python tools/harvest_images.py --dry       # 파일을 쓰지 않고 결과만 출력

동작
  1) 장소의 officialUrl / sourceRefs 페이지에서 og:image·twitter:image 후보를 수집
  2) 없으면 Wikimedia Commons에서 장소명(+지역)으로 검색(라이선스 표기 있는 사진만)
  3) 제목/URL에 항공·위성·드론·지도·로고 등이 있으면 제외 (항공사진 방지)
  4) 결과를 data/image-registry.js 에 'reference-unverified' 상태로 병합
     → 장소 일치·이용권은 반드시 사람이 확인(앱의 [장소 일치 확인])한 뒤 사용하세요.
기존 확정 항목(place-match-verified, user-set)은 덮어쓰지 않습니다.
"""
import json, re, sys, time, urllib.request, urllib.parse, pathlib, datetime
R = pathlib.Path(__file__).resolve().parent.parent
UA = {'User-Agent': 'FrameAtlasHarvest/5.23 (personal location scouting)'}
BAD = re.compile(r'(map|logo|plan|diagram|flag|signature|poster|icon|sketch|locator|stamp|ticket|menu|favicon|sprite|banner|aerial|satellite|drone|항공|위성|드론|조감|지도|로고)', re.I)
OG = re.compile(r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)(?::secure_url)?["\'][^>]*content=["\']([^"\']+)["\']|<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\']', re.I)

def load():
    t = (R / 'data/places.js').read_text(encoding='utf-8')
    return json.loads(t[t.index('{'):t.rindex('}') + 1])['locations']

def load_reg():
    p = R / 'data/image-registry.js'
    if p.exists():
        t = p.read_text(encoding='utf-8')
        return json.loads(t[t.index('{'):t.rindex('}') + 1])
    return {'version': '5.23', 'entries': {}}

def get(url, binary=False, timeout=15):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        b = r.read(600000)
        return b if binary else b.decode(r.headers.get_content_charset() or 'utf-8', 'replace')

def og_candidates(html, base):
    out = []
    for m in OG.finditer(html):
        u = (m.group(1) or m.group(2) or '').strip()
        if u:
            out.append(urllib.parse.urljoin(base, u.replace('&amp;', '&')))
    return out

def is_image(url):
    try:
        req = urllib.request.Request(url, headers=UA, method='HEAD')
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.headers.get_content_type().startswith('image/')
    except Exception:
        return False

def from_pages(x):
    for page in [x.get('officialUrl')] + list(x.get('sourceRefs') or []):
        if not page or not page.startswith('http'):
            continue
        try:
            for u in og_candidates(get(page), page):
                if not BAD.search(u) and is_image(u):
                    return {'url': u, 'credit': urllib.parse.urlparse(page).netloc + ' 공식/출처 페이지 대표 이미지', 'page': page, 'source': 'og-image'}
        except Exception:
            continue
    return None

def from_commons(x):
    sub = (x.get('region') or '').split(' ')[-1]
    toks = [w for w in re.sub(r'\(.*?\)', '', x['name']).replace('·', ' ').split() if len(w) >= 2][:2]
    for q in [x['name'], sub + ' ' + x['name']]:
        u = ('https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8'
             '&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime%7Csize&iiurlwidth=900&gsrsearch=' + urllib.parse.quote(q))
        try:
            pages = sorted((json.loads(get(u)).get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 0))
        except Exception:
            continue
        for p in pages:
            ii = (p.get('imageinfo') or [{}])[0]
            md = ii.get('extmetadata') or {}
            lic = (md.get('LicenseShortName') or {}).get('value', '')
            t = p.get('title', '')
            if not ii.get('thumburl') or not lic or re.search('fair use|non.?free', lic, re.I) or BAD.search(t):
                continue
            if not re.match(r'image/(jpeg|png|webp)', ii.get('mime', '')) or not any(k.lower() in t.lower() for k in toks):
                continue
            artist = re.sub('<[^>]+>', '', (md.get('Artist') or {}).get('value', '')) or 'Wikimedia Commons'
            return {'url': ii['thumburl'], 'credit': artist + ' · ' + lic, 'page': ii.get('descriptionurl', ''), 'source': 'wikimedia-commons', 'license': lic}
        time.sleep(0.3)
    return None

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry' in sys.argv
    reg = load_reg(); ent = reg.setdefault('entries', {})
    todo = [x for x in load() if (not args and not x.get('imageUrl')) or x['id'] in args]
    got = 0
    for x in todo:
        if ent.get(x['id'], {}).get('status') in ('place-match-verified', 'user-set'):
            continue
        r = from_pages(x) or from_commons(x)
        print(('OK  ' if r else '--  ') + x['id'], x['name'], (r or {}).get('url', ''))
        if r:
            got += 1
            ent[x['id']] = {**r, 'status': 'reference-unverified', 'confirmedAt': '', 'harvestedAt': datetime.date.today().isoformat(), 'mode': 'fill'}
        time.sleep(0.4)
    print(f'수집 {got}/{len(todo)}')
    if got and not dry:
        reg['updated'] = datetime.date.today().isoformat()
        (R / 'data/image-registry.js').write_text('/* FRAME ATLAS 이미지 레지스트리 */\nwindow.FA_IMAGE_REGISTRY=' + json.dumps(reg, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
        print('data/image-registry.js 갱신 완료 — 앱에서 [장소 일치 확인] 후 사용하세요.')

if __name__ == '__main__':
    main()
