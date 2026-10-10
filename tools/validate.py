#!/usr/bin/env python3
"""FRAME ATLAS 데이터 검증.  사용: python tools/validate.py [--strict]
오류(E)가 있으면 종료코드 1 → GitHub Actions 배포가 중단됩니다. --strict 는 경고(W)도 오류로 취급."""
import json,re,sys,math,itertools,collections,pathlib
R=pathlib.Path(__file__).resolve().parent.parent
t=(R/'data/places.js').read_text(encoding='utf-8');D=json.loads(t[t.index('{'):t.rindex('}')+1])
L=D['locations'];HID=set(D.get('hidden',[]));E=[];W=[];by={r['id']:r for r in L}
GEN=['신규 스카우팅 후보','실제 촬영 전','현장 답사 후','추후 확인','좋은 장소','분위기가 좋','추천합니다','방문하기 좋','다양한 촬영','아름다운','멋진']
TPL=re.compile(r'의 구조와 .* 분위기가 핵심');IO={'실내','실외','실내·외'}
def bg(s):z=re.sub(r'\s','',s);return {z[i:i+2] for i in range(len(z)-1)}
def hav(a,b,c,d):p=math.pi/180;x=math.sin((c-a)*p/2)**2+math.cos(a*p)*math.cos(c*p)*math.sin((d-b)*p/2)**2;return 12742*math.asin(math.sqrt(x))
for i,c in collections.Counter(r['id'] for r in L).items():
    if c>1:E.append(f'ID 중복: {i}')
for r in L:
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,40}',r['id']):E.append(f"ID 형식 오류(영문·숫자·_-만): {r['id']}")
    for k in('name','region','type'):
        if not str(r.get(k,'')).strip():E.append(f"{r['id']} 필수값 없음: {k}")
    if r.get('indoorOutdoor') not in IO:W.append(f"{r['id']} 실내외 표기 {r.get('indoorOutdoor')!r} (실내/실외/실내·외)")
nr=collections.defaultdict(list)
for r in L:
    if r['id'] not in HID:nr[(r['name'],r['region'])].append(r['id'])
for k,v in nr.items():
    if len(v)>1:E.append(f'같은 장소 중복(이름+지역): {k} {v}')
co={}
for it in D.get('coordStr','').split(';'):
    if ':' in it:
        k,v=it.split(':');la,lo=map(float,v.split(','));i='L-'+k
        if i not in by:E.append(f'좌표의 장소 ID 없음: {i}')
        elif not(33<=la<=38.7 and 124.5<=lo<=132):E.append(f'좌표가 한국 범위 밖: {i} {la},{lo}')
        else:co[i]=(la,lo)
for a,b in itertools.combinations([i for i in co if i not in HID],2):
    if hav(*co[a],*co[b])<0.06:W.append(f'좌표 60m 이내(중복 의심): {a} {by[a]["name"]} / {b} {by[b]["name"]}')
for r in L:
    r['pro_light']=(r.get('pro') or {}).get('light','');r['pro_plan']=(r.get('pro') or {}).get('plan','')
for f in('memo','visualProfile','imageAnalysis','scout','pro_light','pro_plan'):
    cn=collections.Counter((r.get(f) or '').strip() for r in L if (r.get(f) or '').strip())
    for tx,n in cn.items():
        if n>=3:E.append(f'[{f}] 같은 문구 {n}곳 반복(일반 문구): "{tx[:40]}…"')
        elif n==2:W.append(f'[{f}] 같은 문구 2곳: "{tx[:40]}"')
    for r in L:
        tx=(r.get(f) or '').strip()
        if not tx:continue
        if TPL.search(tx):E.append(f"{r['id']} [{f}] 유형·분위기만 치환한 템플릿 문구")
        if len(tx)<45 and any(g in tx for g in GEN):W.append(f"{r['id']} {r['name']} [{f}] 상투 문구: {tx[:40]}")
        for o in L:
            if o['id']!=r['id'] and len(o['name'])>=4 and o['name'] in tx and o['name'] not in r['name']:W.append(f"{r['id']} {r['name']} [{f}]에 다른 장소명 「{o['name']}」 포함")
mm=[(r['id'],bg(r['memo'])) for r in L if len((r.get('memo') or '').strip())>=12]
for (a,A),(b,B) in itertools.combinations(mm,2):
    n=len(A&B)
    if n/((len(A)+len(B)-n) or 1)>=.85 and by[a]['memo']!=by[b]['memo']:W.append(f'메모가 거의 같음: {a} / {b}')
NEWS=re.compile(r'kakaocdn|daumcdn|segye|joongdo|esquire|arcpublishing|korearank|welfarehello|trippose|chosun|blog')
for r in L:
    u=r.get('imageUrl') or ''
    if u and not u.startswith('https://'):W.append(f"{r['id']} 이미지 URL이 https가 아님")
    if u and NEWS.search(u):W.append(f"{r['id']} {r['name']} 블로그·기사 이미지: 상업 이용 전 허락 확인 필요")
nk=lambda s:re.sub(r'[\s·()-]','',s)
for a,b in itertools.combinations([r for r in L if r['id'] not in HID],2):
    x,y=nk(a['name']),nk(b['name'])
    if len(x)>=4 and len(y)>=4 and (x in y or y in x):W.append(f"이름이 겹침(중복·하위 장소 의심): {a['id']} {a['name']} / {b['id']} {b['name']}")
for r in L:
    m=(r.get('memo') or '').strip()
    for f in('visualProfile','scout'):
        if m and (r.get(f) or '').strip()==m:E.append(f"{r['id']} {r['name']} memo와 {f}가 같은 문장(같은 문구가 두 번 표시됨)")
short=sum(1 for r in L if 0<len((r.get('memo') or '').strip())<8)
VISIBLE=[r for r in L if r['id'] not in HID]
def unverified_location(r):
    q=r.get('locationReview') or {}
    return q.get('coordinateStatus')!='precise-coordinate-verified' or not q.get('siteVisitVerified')
def missing_permit(r):
    q=r.get('permitReview') or {}
    return q.get('status') not in ('approved','conditional','not-required-confirmed','denied') or not q.get('evidenceUrl') or not q.get('lastChecked')
def image_unverified(r):
    q=r.get('imageReview') or {}
    return not (q.get('placeMatchVerified') is True or q.get('status')=='place-match-verified')
def rights_unverified(r):
    q=r.get('imageReview') or {}
    has=bool(r.get('imageUrl') or r.get('cardImage'))
    return has and q.get('usageRightsStatus') not in ('commercial-use-cleared','user-owned')
def field_scout_missing(r):
    q=r.get('technicalReview') or {}
    points=[p for p in (q.get('fieldPoints') or []) if p.get('name') and p.get('position') and p.get('lens') and p.get('light') and p.get('notes')]
    return not q.get('fieldScouted') or len(points)<3
quality=[
 ('앱 표시 장소',len(VISIBLE)),
 ('기본 촬영 포인트 0개',sum(len(r.get('points') or [])==0 for r in VISIBLE)),
 ('기본 촬영 포인트 3개 미만',sum(len(r.get('points') or [])<3 for r in VISIBLE)),
 ('공식 정보 링크 없음',sum(not r.get('officialUrl') for r in VISIBLE)),
 ('대표 사진 장소 일치 미확인',sum(image_unverified(r) for r in VISIBLE)),
 ('이미지 이용권 확인 필요(이미지 있는 레코드)',sum(rights_unverified(r) for r in VISIBLE)),
 ('상업촬영 허가 근거/확인일 미충족',sum(missing_permit(r) for r in VISIBLE)),
 ('정밀좌표 또는 현장답사 미기록',sum(unverified_location(r) for r in VISIBLE)),
 ('현장 실측 촬영 포인트 3개 미확보',sum(field_scout_missing(r) for r in VISIBLE)),
]
rep=['# 데이터 검증 보고서','',f'- 전체 레코드 {len(L)}곳 · 앱 표시 {len(VISIBLE)}곳 · 오류 {len(E)} · 경고 {len(W)} · 8자 미만 메모 {short}곳','','## 전문 스카우팅 품질 공백(현장 확인 전의 데이터 상태)','','| 항목 | 건수 |','|---|---:|']+[f'| {k} | {v} |' for k,v in quality]+['','> 이 표는 현재 파일에 기록된 검증 필드의 충족 여부입니다. 장소의 실제 존재·운영·허가·이미지 일치에 대한 현장 실사를 대신하지 않습니다.','','## 오류']+['- '+x for x in E]+['','## 경고']+['- '+x for x in W]
(R/'tools/report.md').write_text('\n'.join(rep),encoding='utf-8');print('\n'.join(rep[:3]+rep[5:]))
for x in E[:30]:print('E',x)
for x in W[:15]:print('W',x)
sys.exit(1 if E or(W and '--strict' in sys.argv) else 0)
