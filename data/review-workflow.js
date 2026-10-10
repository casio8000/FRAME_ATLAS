/* FRAME ATLAS v5.7 — editable field-verification workflow
   User-entered review records are stored on-device under faReview57_<placeId> and included in backups.
   Nothing is presented as verified merely because a field has text; approval states require dated evidence. */
(function(){
'use strict';
const REV_PREFIX='faReview57_';
const today=()=>typeof todayKST==='function'?todayKST():new Date().toISOString().slice(0,10);
const jget=(k,d)=>{try{const v=JSON.parse(LSX.getItem(k));return v==null?d:v}catch(_){return d}};
const jset=(k,v)=>SV(k,v);
const getSaved=id=>jget(REV_PREFIX+id,{});
const merge=(a,b)=>Object.assign({},a||{},b||{});
function readReview(x){const saved=getSaved(x.id);return {
  locationReview:merge(x.locationReview,saved.locationReview),
  imageReview:merge(x.imageReview,saved.imageReview),
  permitReview:merge(x.permitReview,saved.permitReview),
  technicalReview:merge(x.technicalReview,saved.technicalReview),
  updatedAt:saved.updatedAt||''
};}
const opt=(val,cur,label)=>`<option value="${esc(val)}" ${val===cur?'selected':''}>${esc(label)}</option>`;
const field=(label,id,val,placeholder='',type='text')=>`<label>${esc(label)}<input id="${id}" type="${type}" value="${esc(val??'')}" placeholder="${esc(placeholder)}"></label>`;
const area=(label,id,val,placeholder='')=>`<label>${esc(label)}<textarea id="${id}" rows="2" placeholder="${esc(placeholder)}">${esc(val??'')}</textarea></label>`;
const checked=v=>v===true?'checked':'';
function enumLoc(v){if(v==='precise-coordinate-verified')return v;if(v==='address-verified')return v;if(/address.*verified/i.test(String(v))&&!/unverified|needs|필요|미검증/.test(String(v)))return 'address-verified';return 'unverified'}
function enumImage(x,r){if((r.status==='place-match-verified'||r.placeMatchVerified===true)&&r.placeMatchVerifiedAt)return 'place-match-verified';if(x.cardImageVerified===true)return 'place-match-verified';if(r.status==='not-collected'&&!PMETA[x.id]&&!x.imageUrl&&!x.cardImage)return 'not-collected';return 'reference-unverified'}
function enumRights(r,x){const v=r.usageRightsStatus||'';if(['not-verified','personal-use-only','commercial-use-cleared','user-owned','not-permitted','not-applicable'].includes(v))return v;if(PMETA[x.id]&&PMETA[x.id].kind==='blob'&&!PMETA[x.id].auto)return 'user-owned';return (x.imageUrl||x.cardImage)?'not-verified':'not-applicable'}
function enumPermit(r){return ['unverified','contacted','conditional','approved','not-required-confirmed','denied'].includes(r.status)?r.status:'unverified'}
function validGPS(lat,lng){const a=Number(lat),b=Number(lng);return String(lat).trim()!==''&&String(lng).trim()!==''&&Number.isFinite(a)&&Number.isFinite(b)&&a>=33&&a<=39&&b>=124&&b<=132}
function meaningful(v){const s=String(v||'').trim();return s.length>8&&!/(확인 필요|현장 답사 후|미확인|추후 확인|미검증|확인 예정|문의 필요|확인해야|확보 여부|예정입니다|미측정)/.test(s)}
function scores(x,r){
 const l=r.locationReview||{},im=r.imageReview||{},pe=r.permitReview||{},t=r.technicalReview||{},p=x.proScout||{};
 const latok=l.coordinateStatus==='precise-coordinate-verified'&&validGPS(l.gpsLatitude,l.gpsLongitude);
 const addrOk=!!(l.address&&meaningful(l.address));
 const locScore=Math.min(100,(latok?55:(l.coordinateStatus==='address-verified'?25:0))+(l.entranceVerified?20:0)+(l.siteVisitVerified?25:0));
 const matchVerified=(im.placeMatchVerified===true||im.status==='place-match-verified')&&!!im.placeMatchVerifiedAt;
 const imgScore=(matchVerified?60:0)+(['commercial-use-cleared','user-owned'].includes(im.usageRightsStatus)?40:0);
 const permitProof=!!(pe.evidenceUrl&&pe.lastChecked);
 let permitScore=0;if(permitProof){if(['approved','not-required-confirmed','denied'].includes(pe.status))permitScore=100;else if(pe.status==='conditional')permitScore=70;else if(pe.status==='contacted')permitScore=35}
 const verification=Math.round(locScore*.30+imgScore*.20+permitScore*.50);
 const pts=Array.isArray(t.fieldPoints)?t.fieldPoints:[];
 const completenessChecks=[!!x.name,!!x.region,!!x.type,!!x.officialUrl,!!x.addressStatus,Array.isArray(x.points)&&x.points.filter(q=>q&&meaningful(q.name)&&meaningful(q.note)&&!/(대표 촬영 포인트|질감·디테일 포인트)/.test(q.name)).length>=3,meaningful(x.imageAnalysis),meaningful(x.visualProfile),meaningful(p.lightDirection),meaningful(p.cameraHeight),!!im.sourceUrl,!!im.credit,!!pe.evidenceUrl,!!l.coordinateSourceUrl,!!t.fieldNotes,pts.filter(q=>q&&q.name&&q.position&&q.light).length>=3];
 const completeness=Math.round(completenessChecks.filter(Boolean).length/completenessChecks.length*100);
 const readinessChecks=[latok,!!l.entranceVerified,!!l.siteVisitVerified,['approved','conditional','not-required-confirmed'].includes(pe.status)&&permitProof,meaningful(pe.feeDetail),meaningful(t.loadIn),meaningful(t.power),meaningful(t.parking),meaningful(t.crewArea),meaningful(t.safetyRestoration),meaningful(t.weatherBackup),pts.filter(q=>q&&q.name&&q.position&&q.lens&&q.light&&q.notes).length>=3];
 const readiness=Math.round(readinessChecks.filter(Boolean).length/readinessChecks.length*100);
 return {completeness,creative:Number(p.creativeFit)||0,productionIdea:Number(p.productionFit)||0,readiness,verification,latok,addrOk,permitProof,fieldPoints:pts.length,checks:{location:locScore,image:imgScore,permit:permitScore}};
}
function scoreCard(label,val,note){return `<div class="fa57-score"><b>${esc(label)}</b><strong>${Number.isFinite(val)?val:'—'}<small>/100</small></strong><span>${esc(note)}</span></div>`}
function photoLabel(x,r){const m=PMETA[x.id],im=r.imageReview||{};let actual=false,has=false;
 if(m)has=true;
 if(x.imageUrl||x.cardImage||x.cardImageVerified)has=true;
 // A cached/uploaded image is not proof that it depicts this exact location.
 actual=((im.placeMatchVerified===true||im.status==='place-match-verified')&&!!im.placeMatchVerifiedAt)||(!getSaved(x.id).imageReview&&x.cardImageVerified===true);
 if(!has)return {label:'현장 사진 미등록',kind:'missing'};
 if(actual)return {label:'장소 일치 확인됨 · 이용권 별도 확인',kind:'verified'};
 return {label:(m&&m.auto?'자동 검색 후보 · ':'참고 이미지 · ')+'장소 일치 미확인',kind:'unverified'};
}
function placePhotoMarkup(html,x){const r=readReview(x),s=photoLabel(x,r);return html.replace(/(<span class="imagekind">)(.*?)(<\/span>)/,`$1${esc(s.label)}$3`)}
const priorCard=card;card=function(x){return placePhotoMarkup(priorCard(x),x)};
const priorRcard=rcard;rcard=function(x){let h=priorRcard(x);return placePhotoMarkup(h,x)};
function faReviewPanel(x){
 const r=readReview(x),l=r.locationReview,im=r.imageReview,pe=r.permitReview,t=r.technicalReview,p=scores(x,r),id=x.id,prefix='fa57-'+id+'-';
 const lp=enumLoc(l.coordinateStatus),ip=enumImage(x,im),rp=enumRights(im,x),pp=enumPermit(pe);
 const pts=Array.isArray(t.fieldPoints)?t.fieldPoints:[];
 const pointHtml=[0,1,2].map(i=>{const q=pts[i]||{};return `<div class="fa57-point"><b>현장 포인트 ${i+1}</b><div class="fa57-formgrid">${field('포인트 이름',prefix+'fp'+i+'name',q.name||'','예: 서측 파사드 사선')}${field('카메라/피사체 위치',prefix+'fp'+i+'position',q.position||'','실제 위치·거리·방향')}${field('렌즈·화각',prefix+'fp'+i+'lens',q.lens||'','예: 50mm, 카메라-모델 5m')}${field('빛·시간대',prefix+'fp'+i+'light',q.light||'','예: 16:30 서측 반사광')}${area('프레임·안전·주의사항',prefix+'fp'+i+'notes',q.notes||'','배경 통제, 보행자, 촬영 허가 구역 등')}</div></div>`}).join('');
 const scoresHtml=`<div class="fa57-scoregrid">${scoreCard('자료 완성도',p.completeness,'항목 입력 정도')}${scoreCard('창작 적합도',p.creative,'기획 참고 점수')}${scoreCard('기존 제작 적합도',p.productionIdea,'기획 참고 점수')}${scoreCard('현장 준비도',p.readiness,'현장·허가 확인 기준')}${scoreCard('검증 신뢰도',p.verification,'위치·사진·허가 근거')}</div>`;
 return `<section class="panel fa57-review" id="fa57-panel-${id}"><div class="fa57-head"><div><h3>전문 스카우팅 검증 워크스페이스</h3><p class="kicker">자료 완성도·창작 적합도·제작 적합도·현장 준비도·검증 신뢰도는 서로 다른 지표입니다. 회색 점수는 현장 실사 결과가 아닙니다.</p></div><span class="fa57-version">v5.7</span></div>${scoresHtml}
 <div class="fa57-warning"><b>현재 상태:</b> ${esc(photoLabel(x,r).label)} · 상업촬영 허가 ${esc(({unverified:'미확인',contacted:'문의 중',conditional:'조건부 확인',approved:'승인 확인', 'not-required-confirmed':'허가 불필요 확인',denied:'불가 확인'})[pp]||'미확인')} · 위치 ${esc(({unverified:'미검증','address-verified':'주소 확인','precise-coordinate-verified':'정밀 좌표 확인'})[lp]||'미검증')}. 이 요약은 사용자가 기록한 상태이며 공식 기관의 실시간 확인을 뜻하지 않습니다.</div>
 <details open><summary>① 위치·주소·진입점 검증</summary><div class="fa57-formgrid">
 <label>좌표 확인 상태<select id="${prefix}locStatus">${opt('unverified',lp,'미검증')}${opt('address-verified',lp,'주소와 공식 위치 정보 확인')}${opt('precise-coordinate-verified',lp,'정밀 좌표를 지도/현장에서 확인')}</select></label>
 ${field('실제 주소',prefix+'address',l.address||x.address||'', '도로명 주소·건물/구역')}${field('실제 진입점·게이트·하차 위치',prefix+'entrance',l.entranceText||'','정문과 촬영점이 다르면 구분')}
 ${field('위도',prefix+'lat',l.gpsLatitude||'','예: 37.5665')}${field('경도',prefix+'lng',l.gpsLongitude||'','예: 126.9780')}
 ${field('좌표·주소 확인 출처 URL',prefix+'locSource',l.coordinateSourceUrl||'','공식 지도/주소 근거','url')}${field('위치 확인일',prefix+'locDate',l.checkedAt||'','', 'date')}
 <label class="fa57-check"><input type="checkbox" id="${prefix}entranceOk" ${checked(l.entranceVerified)}> 실제 진입점 확인</label><label class="fa57-check"><input type="checkbox" id="${prefix}siteVisit" ${checked(l.siteVisitVerified||t.fieldScouted)}> 현장 답사 완료</label>
 ${field('현장 답사일',prefix+'siteDate',l.siteVisitDate||t.scoutedAt||'','', 'date')}${area('위치·진입 메모',prefix+'locNote',l.note||'','출입 게이트, 계단, 엘리베이터, 케이스 이동거리 등')}
 </div><p class="fa57-help">정밀 좌표로 저장하려면 위도·경도, 출처 URL, 확인일이 필요합니다. 시·군 중심 좌표나 장소명 검색 위치는 정밀 좌표로 표시하지 않습니다.</p></details>
 <details><summary>② 대표 사진·출처·이용권 검증</summary><div class="fa57-formgrid">
 <label>사진 판정<select id="${prefix}imgStatus">${opt('not-collected',ip,'현장/참고 사진 없음')}${opt('reference-unverified',ip,'참고 사진 — 장소 일치 미확인')}${opt('place-match-verified',ip,'사진이 해당 장소임을 확인')}</select></label>
 <label>사진 이용권 상태<select id="${prefix}rights">${opt('not-applicable',rp,'사진 없음 / 해당 없음')}${opt('not-verified',rp,'이용권 미확인')}${opt('personal-use-only',rp,'개인 참고용만 확인')}${opt('commercial-use-cleared',rp,'상업 이용 허락 확인')}${opt('user-owned',rp,'직접 촬영·권리 보유')}${opt('not-permitted',rp,'사용 불허')}</select></label>
 ${field('대표 사진 원본 URL',prefix+'imgSource',im.sourceUrl||PMETA[id]?.url||x.imageSourceUrl||x.imageUrl||'','출처가 있는 경우 입력','url')}${field('사진 크레딧·권리자',prefix+'imgCredit',im.credit||PMETA[id]?.credit||x.imageCredit||'','사진 촬영자/권리자')}
 ${field('이용권 확인 근거 URL',prefix+'rightsEvidence',im.rightsEvidenceUrl||'','라이선스/서면 허락 URL','url')}${field('이용권 확인일',prefix+'rightsDate',im.rightsCheckedAt||'','', 'date')}
 ${field('장소 일치 확인일',prefix+'imgMatchDate',im.placeMatchVerifiedAt||'','', 'date')}${field('촬영/게시 날짜(알면)',prefix+'captureDate',im.captureDate||'','', 'date')}${area('사진 관련 메모',prefix+'imgNote',im.note||'','장소 일치와 저작권·상업 이용권은 별개로 기록')}
 </div><p class="fa57-help">장소 일치를 확인해도 상업 이용권이 자동으로 생기지 않습니다. 권리 확인 근거가 없는 사진은 클라이언트용 제안서의 최종 이미지로 사용하지 마세요.</p></details>
 <details><summary>③ 상업촬영 허가·비용·운영 조건</summary><div class="fa57-formgrid">
 <label>촬영 허가 상태<select id="${prefix}permitStatus">${opt('unverified',pp,'미확인')}${opt('contacted',pp,'관리 주체에 문의 중')}${opt('conditional',pp,'조건부 가능 확인')}${opt('approved',pp,'상업촬영 승인 확인')}${opt('not-required-confirmed',pp,'상업촬영 허가 불필요 확인')}${opt('denied',pp,'촬영 불가 확인')}</select></label>
 ${field('관리 주체·담당 부서',prefix+'permitContact',pe.contact||'','운영처/소유자/담당 부서')}${field('공식 답변·허가 근거 URL',prefix+'permitEvidence',pe.evidenceUrl||'','공식 안내 또는 서면 답변','url')}${field('최종 확인일',prefix+'permitDate',pe.lastChecked||'','', 'date')}
 ${field('대관료·보증금·추가비용',prefix+'fee',pe.feeDetail||'','금액, VAT, 시간 단위, 인원')}${field('허용 구역·촬영시간',prefix+'areas',pe.allowedAreas||'','실내/외, 시간, 인원')}${field('장비·조명 제한',prefix+'limits',pe.equipmentRestrictions||'','삼각대, 플래시, 전력, 차량, 드론')}${area('허가·운영 확인 메모',prefix+'permitNote',pe.note||'','담당자 답변 내용과 계약 조건')}
 </div><p class="fa57-help">승인·허가 불필요를 선택하면 근거 URL과 확인일이 필수입니다. 일반 관람 안내는 그 자체로 상업촬영 승인 근거가 아닙니다.</p></details>
 <details><summary>④ 실측 촬영 포인트 3개</summary><p class="fa57-help">기존 장소 설명은 촬영 아이디어일 수 있으며 실측값이 아닙니다. 아래는 답사 후 카메라 위치·거리·렌즈·광선 방향을 기록하는 전용 필드입니다.</p>${pointHtml}</details>
 <details><summary>⑤ 제작팀 테크스카우트·안전</summary><div class="fa57-formgrid">
 ${area('실제 빛 관찰·시간대',prefix+'lightObservation',t.lightObservation||'','태양 방위, 창광, 반사, 그림자 시각')}${area('장비차량 하차→촬영점 이동',prefix+'loadIn',t.loadIn||x.proScout?.loadIn||'','주차·케이스 이동거리·문폭·계단')}
 ${area('전력·분전반·조명',prefix+'power',t.power||'','콘센트/회로 용량/발전기/케이블 경로')}${area('주차·하차 동선',prefix+'parking',t.parking||'','장비차량과 스태프 차량 구분')}
 ${area('대기·탈의·메이크업 공간',prefix+'crew',t.crewArea||'','인원·거리·화장실 포함')}${area('천장 높이·리깅',prefix+'ceiling',t.ceilingRigging||'','높이, 붐/스탠드/조명 설치 제한')}${area('소음·주변 음향',prefix+'noise',t.noise||'','차량·공조·방문객·작업음 시간대')}
 ${area('안전·보험·원상복구',prefix+'safety',t.safetyRestoration||'','바닥/난간/전선/보험/청소')}${area('우천·강풍 대안',prefix+'weather',t.weatherBackup||'','실내 대안/촬영 취소 기준')}
 ${area('현장 스카우트 종합 메모',prefix+'fieldNotes',t.fieldNotes||'','확인자·측정값·미해결 이슈')}
 </div></details>
 <div class="fa57-actions"><button class="cta" onclick="faSaveReview('${id}')">검증 기록 저장</button><button class="secondary" onclick="faExportReviewCSV()">전체 검증 현황 CSV</button><button class="secondary" onclick="faResetReview('${id}')">이 장소의 사용자 검증 기록 초기화</button></div><p class="fa57-foot">마지막 사용자 기록: ${esc(r.updatedAt||'기록 없음')} · 이 기록은 현재 브라우저/기기의 사용자 데이터입니다. 백업 기능에 포함됩니다.</p></section>`;
}
function faSaveReview(id){
 const x=DB.find(v=>v.id===id);if(!x)return;
 const P='fa57-'+id+'-',v=k=>{const e=document.getElementById(P+k);return e?e.value.trim():''},c=k=>!!document.getElementById(P+k)?.checked;
 const locStatus=v('locStatus'),lat=v('lat'),lng=v('lng'),locSource=v('locSource'),locDate=v('locDate'),siteVisit=c('siteVisit'),siteDate=v('siteDate');
 if(locStatus==='precise-coordinate-verified'&&(!validGPS(lat,lng)||!locSource||!locDate)){alert('정밀 좌표 확인으로 저장하려면 한국 범위의 위도·경도, 확인 출처 URL, 확인일을 입력하세요.');return}
 if(locStatus==='address-verified'&&(!v('address')||!locSource||!locDate)){alert('주소 확인으로 저장하려면 실제 주소, 근거 URL, 확인일을 입력하세요.');return}
 if(siteVisit&&(!siteDate||!v('locNote')&&!v('fieldNotes'))){alert('현장 답사 완료를 선택했다면 답사일과 확인 메모(진입·광선·동선 등)를 입력하세요.');return}
 const imgStatus=v('imgStatus'),rights=v('rights'),imageSource=v('imgSource'),imageExists=!!(PMETA[id]||x.imageUrl||x.cardImage||x.cardImageVerified);
 if(imgStatus==='place-match-verified'&&!imageExists){alert('확인할 사진이 없습니다. 먼저 실제 사진 파일 또는 출처 URL을 등록하세요.');return}
 if(imgStatus==='place-match-verified'&&!confirm('대표 이미지가 이 장소를 정확히 보여주는 것을 직접 확인했습니까? 이용권 상태는 별도로 기록됩니다.'))return
 if(['commercial-use-cleared','personal-use-only','not-permitted'].includes(rights)&&(!v('rightsEvidence')||!v('rightsDate'))){alert('이용권 상태를 제한 또는 확인 완료로 기록하려면 근거 URL과 확인일을 입력하세요. 근거가 없으면 ‘이용권 미확인’을 선택하세요.');return}
 if(rights==='user-owned'&&!v('rightsDate')){alert('직접 촬영한 사진도 권리 보유 확인일을 입력하세요.');return}
 if(rights==='user-owned'&&!confirm('이 이미지의 저작권 또는 상업적 이용권을 직접 보유하거나 확인했습니까? 파일을 업로드했다는 사실만으로 권리가 생기지는 않습니다.'))return;
 if(rights==='not-applicable'&&(PMETA[id]||x.imageUrl||x.cardImage)){alert('이미지가 등록되어 있습니다. 권리를 모르면 “이용권 미확인”을 선택하세요.');return}
 const permitStatus=v('permitStatus'),permitProof=v('permitEvidence'),permitDate=v('permitDate');
 if(permitStatus!=='unverified'&&(!permitDate||(permitStatus!=='contacted'&&!permitProof))){alert('문의 중을 제외한 허가 상태를 기록하려면 근거 URL과 최종 확인일이 필요합니다. 문의 중도 문의 날짜를 입력하세요.');return}
 if(['approved','not-required-confirmed'].includes(permitStatus)&&!confirm('관리 주체의 답변 또는 공식 문서를 확인했습니까? 일반 관람 정보만으로는 승인 상태를 저장하지 마세요.'))return;
 const old=getSaved(id),points=[0,1,2].map(i=>({name:v('fp'+i+'name'),position:v('fp'+i+'position'),lens:v('fp'+i+'lens'),light:v('fp'+i+'light'),notes:v('fp'+i+'notes')})).filter(q=>q.name||q.position||q.lens||q.light||q.notes);
 const lr={...x.locationReview,...(old.locationReview||{}),coordinateStatus:locStatus,address:v('address'),entranceText:v('entrance'),gpsLatitude:lat,gpsLongitude:lng,coordinateSourceUrl:locSource,checkedAt:locDate,entranceVerified:c('entranceOk'),siteVisitVerified:siteVisit,siteVisitDate:siteDate,note:v('locNote'),suppressApproximatePin:locStatus==='unverified'&&!lat&&!lng};
 const ir={...x.imageReview,...(old.imageReview||{}),status:imgStatus,placeMatchVerified:imgStatus==='place-match-verified',placeMatchVerifiedAt:imgStatus==='place-match-verified'?v('imgMatchDate'):'',usageRightsStatus:rights,sourceUrl:imageSource,credit:v('imgCredit'),rightsEvidenceUrl:v('rightsEvidence'),rightsCheckedAt:v('rightsDate'),captureDate:v('captureDate'),note:v('imgNote')};
 const pr={...x.permitReview,...(old.permitReview||{}),status:permitStatus,evidenceUrl:permitProof,lastChecked:permitDate,commercialUseConfirmed:['approved','not-required-confirmed'].includes(permitStatus),contact:v('permitContact'),feeDetail:v('fee'),allowedAreas:v('areas'),equipmentRestrictions:v('limits'),note:v('permitNote')};
 const tr={...x.technicalReview,...(old.technicalReview||{}),status:siteVisit?'field-scouted':'not-scouted',fieldScouted:siteVisit,scoutedAt:siteDate,fieldPoints:points,lightObservation:v('lightObservation'),loadIn:v('loadIn'),power:v('power'),parking:v('parking'),crewArea:v('crew'),ceilingRigging:v('ceiling'),noise:v('noise'),safetyRestoration:v('safety'),weatherBackup:v('weather'),fieldNotes:v('fieldNotes')};
 const recObj={locationReview:lr,imageReview:ir,permitReview:pr,technicalReview:tr,updatedAt:today()};
 jset(REV_PREFIX+id,recObj);
 // Keep reviewed GPS in faReview57_<ID>; do not overwrite or delete pre-existing rec30_ user coordinates.
 const meta=PMETA[id];
 if(meta){if(imgStatus==='place-match-verified'){meta.placeVerified=true;meta.verifiedAt=today();delete meta.auto}else if(imgStatus==='reference-unverified'){meta.placeVerified=false;meta.auto=true}try{IDB.put('pmeta',id,meta)}catch(_){} }
 if(imgStatus==='place-match-verified'&&x.imageUrl&&!PMETA[id]){PMETA[id]={kind:'url',url:x.imageUrl,credit:ir.credit||x.imageCredit||'출처 미기재',license:ir.usageRightsStatus==='commercial-use-cleared'?'상업 이용권 확인 기록 있음':'이용권 미확인',page:ir.sourceUrl||x.officialUrl||'',placeVerified:true,verifiedAt:today(),auto:false};try{IDB.put('pmeta',id,PMETA[id])}catch(_){}}
 if(x.locationReview)Object.assign(x.locationReview,lr);if(x.imageReview)Object.assign(x.imageReview,ir);if(x.permitReview)Object.assign(x.permitReview,pr);if(x.technicalReview)Object.assign(x.technicalReview,tr);
 if(typeof syncActual==='function')syncActual(x);
 alert('검증 기록을 저장했습니다. 기록 상태를 변경했을 뿐, 외부 기관 확인을 대신하지 않습니다.');
 if(typeof updateMetrics==='function')updateMetrics();if(typeof render==='function')render();if(typeof renderHome==='function')renderHome();detail(id,true);
}
function faResetReview(id){if(!confirm('이 장소의 사용자 검증 기록만 삭제합니다. 원본 데이터·사진 파일·기존 개인 좌표는 삭제하지 않습니다. 계속할까요?'))return;const x=DB.find(v=>v.id===id);LSX.removeItem(REV_PREFIX+id);if(x){x.locationReview={coordinateStatus:'precise-coordinate-unverified',entranceVerified:false,siteVisitVerified:false,coordinateSourceUrl:'',checkedAt:'',siteVisitDate:'',gpsLatitude:'',gpsLongitude:'',entranceText:'',note:''};x.imageReview={status:(x.imageUrl||x.cardImage)?'reference-unverified':'not-collected',placeMatchVerified:false,usageRightsStatus:(x.imageUrl||x.cardImage)?'not-verified':'not-applicable',sourceUrl:x.imageUrl||x.imageSourceUrl||'',credit:x.imageCredit||'',rightsEvidenceUrl:'',rightsCheckedAt:'',note:''};x.permitReview={status:'unverified',lastChecked:'',evidenceUrl:'',commercialUseConfirmed:false,contact:'',feeDetail:'',allowedAreas:'',equipmentRestrictions:'',note:''};x.technicalReview={status:'not-scouted',fieldScouted:false,scoutedAt:'',fieldPoints:[],lightObservation:'',loadIn:'',power:'',parking:'',crewArea:'',ceilingRigging:'',noise:'',safetyRestoration:'',weatherBackup:'',fieldNotes:''}}const meta=PMETA[id];if(meta){delete meta.placeVerified;delete meta.verifiedAt;if(meta.kind==='url')meta.auto=true;else delete meta.auto;try{IDB.put('pmeta',id,meta)}catch(_){}}detail(id,true)}
function faExportReviewCSV(){
 const headers=['ID','장소명','지역','좌표상태','주소','진입점확인','현장답사','현장답사일','사진상태','사진이용권','사진출처','촬영허가상태','허가근거','허가확인일','자료완성도','창작적합도','기획제작적합도','현장준비도','검증신뢰도','기본포인트수','실측포인트수','최근사용자기록일'];
 const rows=DB.filter(x=>!HIDE.has(x.id)).map(x=>{const r=readReview(x),l=r.locationReview,im=r.imageReview,pe=r.permitReview,p=scores(x,r);return[x.id,x.name,x.region,l.coordinateStatus,l.address,l.entranceVerified?'예':'아니오',l.siteVisitVerified?'예':'아니오',l.siteVisitDate,im.status,im.usageRightsStatus,im.sourceUrl,pe.status,pe.evidenceUrl,pe.lastChecked,p.completeness,p.creative,p.productionIdea,p.readiness,p.verification,(x.points||[]).length,(r.technicalReview.fieldPoints||[]).length,r.updatedAt||'']});
 const q=v=>{const s=String(v??'');return '"'+s.replace(/"/g,'""')+'"'};const csv='\uFEFF'+[headers,...rows].map(a=>a.map(q).join(',')).join('\r\n');const a=document.createElement('a'),u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=u;a.download='FRAME_ATLAS_v5.7_현장검증현황_'+today()+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function showQualityGuide(){
 const rows=DB.filter(x=>!HIDE.has(x.id)),stats=rows.map(x=>({x,r:readReview(x)}));
 const cnt={points0:rows.filter(x=>(x.points||[]).length===0).length,pointsLt3:rows.filter(x=>(x.points||[]).length<3).length,officialMissing:rows.filter(x=>!x.officialUrl).length,imageUnverified:stats.filter(o=>!(o.r.imageReview.placeMatchVerified===true&&o.r.imageReview.placeMatchVerifiedAt)).length,rightsUnverified:stats.filter(o=>(o.x.imageUrl||o.x.cardImage||PMETA[o.x.id])&&!['commercial-use-cleared','user-owned'].includes(o.r.imageReview.usageRightsStatus)).length,permitUnverified:stats.filter(o=>!['approved','conditional','not-required-confirmed','denied'].includes(o.r.permitReview.status)||!o.r.permitReview.evidenceUrl||!o.r.permitReview.lastChecked).length,locationUnverified:stats.filter(o=>enumLoc(o.r.locationReview.coordinateStatus)!=='precise-coordinate-verified').length,notVisited:stats.filter(o=>!o.r.locationReview.siteVisitVerified).length};
 const avg=k=>Math.round(stats.reduce((a,o)=>a+scores(o.x,o.r)[k],0)/(stats.length||1));
 const need=stats.filter(o=>!o.r.permitReview.evidenceUrl||!o.r.locationReview.siteVisitVerified||enumLoc(o.r.locationReview.coordinateStatus)!=='precise-coordinate-verified').slice(0,18);
 $('sheet').innerHTML=`${shead('전문 스카우팅 품질 대시보드')}<div class="menu"><div class="panel"><h3>FRAME ATLAS v5.7 · 품질 대시보드</h3><p class="kicker">화면 표시 장소 ${rows.length}곳 · 전체 레코드 ${DB.length}개</p><div class="fa57-scoregrid">${scoreCard('평균 자료 완성도',avg('completeness'),'기록 필드의 입력 정도')}${scoreCard('평균 현장 준비도',avg('readiness'),'현장·허가 증빙 기반')}${scoreCard('평균 검증 신뢰도',avg('verification'),'위치·사진·허가 근거')}${scoreCard('평균 창작 적합도',avg('creative'),'설계상 아이디어 점수')}</div></div><div class="panel"><h3>검증 공백 — 미확인을 확인 완료로 간주하지 않습니다</h3><div class="fa57-auditgrid">${Object.entries({ '촬영 포인트 0개':cnt.points0,'촬영 포인트 3개 미만':cnt.pointsLt3,'공식 정보 링크 없음':cnt.officialMissing,'사진 장소 일치 미확인':cnt.imageUnverified,'사진 이용권 확인 필요':cnt.rightsUnverified,'허가 근거/확인일 불충분':cnt.permitUnverified,'정밀 좌표 미검증':cnt.locationUnverified,'현장답사 미기록':cnt.notVisited }).map(([k,v])=>`<div><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div><p class="fa57-help">실제 현장 확인이 필요한 항목 수입니다. 해당 숫자는 문제 장소 수의 완전한 법률·현장 감사를 뜻하지 않고 현재 기록 필드를 기준으로 산출됩니다.</p><button class="cta" onclick="faExportReviewCSV()">검증 현황 CSV 내보내기</button></div><div class="panel"><h3>우선 검토할 장소</h3>${need.map(o=>`<div class="fa57-listrow"><div><b>${esc(o.x.name)}</b><div class="kicker">${esc(o.x.region)} · 허가 ${esc(o.r.permitReview.status||'미확인')} · 현장답사 ${o.r.locationReview.siteVisitVerified?'완료':'미기록'}</div></div><button class="secondary" onclick="detail('${o.x.id}')">상세 검증</button></div>`).join('')}<p class="fa57-help">목록은 후보 검토를 위한 일부 표시이며, 전체 데이터는 CSV로 확인할 수 있습니다.</p></div><div class="panel"><h3>점수 해석</h3><p>자료 완성도는 항목 입력 정도, 창작 적합도는 콘셉트 잠재력, 기획 제작 적합도는 사전 메모의 판단값, 현장 준비도는 실제 기록의 충족 정도, 검증 신뢰도는 출처·허가·위치 확인에 대한 점수입니다. 점수만으로 장소를 확정하지 마세요.</p></div></div>`;$('overlay').classList.add('show');
}
// Local review permission state takes precedence only when the user has saved a review record.
const priorAcc=accOf;accOf=function(x){const sr=getSaved(x.id);if(sr&&sr.permitReview){const p=sr.permitReview,proof=!!(p.evidenceUrl&&p.lastChecked);if(p.status==='approved'&&proof&&p.commercialUseConfirmed)return{k:'g',e:AC.g[0],s:'상업촬영 승인 확인(사용자 기록)',u:1};if(p.status==='not-required-confirmed'&&proof&&p.commercialUseConfirmed)return{k:'g',e:AC.g[0],s:'허가 불필요 확인(사용자 기록)',u:1};if(p.status==='denied'&&proof)return{k:'r',e:AC.r[0],s:'촬영 불가 확인(사용자 기록)',u:1};if(p.status==='conditional'&&proof)return{k:'y',e:AC.y[0],s:'조건부 촬영(사용자 기록)',u:1};if(p.status==='contacted')return{k:'u',e:'⚪',s:'관리 주체 문의 중',u:1};if(p.status==='unverified'||!proof)return{k:'u',e:'⚪',s:'상업촬영 허가 미확인',u:1}}return priorAcc(x)};
// Wrap detail once, then insert an evidence editor on every place card.
const priorDetail=detail;detail=function(id,keep){priorDetail(id,keep);const x=DB.find(v=>v.id===id),body=document.querySelector('#sheet .detailbody');if(!x||!body)return;const old=body.querySelector('.fa57-review');if(old)old.remove();const wrap=document.createElement('div');wrap.innerHTML=faReviewPanel(x);const panel=wrap.firstElementChild;if(panel)body.appendChild(panel);const legacy=body.querySelector('.fa-photo-review button');if(legacy){legacy.textContent='아래 검증 워크스페이스에서 확인·기록';legacy.onclick=()=>body.querySelector('.fa57-review')?.scrollIntoView({behavior:'smooth',block:'start'});}const review=readReview(x),label=photoLabel(x,review);const kinds=body.querySelectorAll('.imagekind');kinds.forEach(e=>e.textContent=label.label);const imgs=body.querySelectorAll('.fa-photo-review');imgs.forEach(e=>{const first=e.querySelector('p');if(first)first.textContent=label.label});};
// Ensure in-source “more” menu uses the v5.7 dashboard and labels are refreshed.
if(Array.isArray(MENU)){const i=MENU.findIndex(m=>m[1]==='전문 스카우팅 기준');if(i>=0)MENU[i]=['shield','전문 스카우팅 품질 대시보드','자료 완성도·현장 준비도·검증 누락 현황','showQualityGuide()'];else MENU.push(['shield','전문 스카우팅 품질 대시보드','자료 완성도·현장 준비도·검증 누락 현황','showQualityGuide()']);}
// Accept richer JSON schema when users import places; import paths keep fields but defaults remain explicitly unverified.
const oldNorm=normPlace;normPlace=function(r,i){const x=oldNorm(r,i);for(const k of ['locationReview','imageReview','permitReview','technicalReview','sourceRefs'])if(r&&r[k]!==undefined)x[k]=r[k];x.locationReview=merge({coordinateStatus:'precise-coordinate-unverified',entranceVerified:false,siteVisitVerified:false,coordinateSourceUrl:'',checkedAt:'',siteVisitDate:'',gpsLatitude:'',gpsLongitude:'',entranceText:'',note:''},x.locationReview);x.imageReview=merge({status:'not-collected',placeMatchVerified:false,placeMatchVerifiedAt:'',usageRightsStatus:'not-verified',sourceUrl:x.imageUrl||'',credit:x.imageCredit||'',rightsEvidenceUrl:'',rightsCheckedAt:'',note:''},x.imageReview);x.permitReview=merge({status:'unverified',lastChecked:'',evidenceUrl:'',commercialUseConfirmed:false,contact:'',feeDetail:'',allowedAreas:'',equipmentRestrictions:'',note:''},x.permitReview);x.technicalReview=merge({status:'not-scouted',fieldScouted:false,scoutedAt:'',fieldPoints:[],lightObservation:'',loadIn:'',power:'',parking:'',crewArea:'',ceilingRigging:'',noise:'',safetyRestoration:'',weatherBackup:'',fieldNotes:''},x.technicalReview);return x};
// expose after all existing source startup handlers have run
window.faSaveReview=faSaveReview;window.faResetReview=faResetReview;window.faExportReviewCSV=faExportReviewCSV;window.showQualityGuide=showQualityGuide;
renderMore();renderChips();renderHome();render();
})();
