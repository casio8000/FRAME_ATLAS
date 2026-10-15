
(function(){
"use strict";
const DATA_URL="./data/places.json";
const LOCAL_KEY="frameAtlas2CatalogDraft";
const PENDING_DB="frameAtlas2PendingPhotos";
const objectUrls=new Map();
const PERMITTED=new Set(["cc0","public-domain","cc-by","cc-by-sa","permission","self-owned"]);
const $=id=>document.getElementById(id);
let catalog={schemaVersion:1,places:[]},selectedId=null,searchCache=[],homeHeroPlaceId=null;
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const getPlace=id=>catalog.places.find(p=>p.id===id);
const imageCount=p=>(p.imageCandidates||[]).length;
const approvedImage=p=>(p.imageCandidates||[]).find(i=>i.id===p.primaryImageId&&i.status!=="rejected"&&i.placeMatch==="confirmed"&&(!!i.imageUrl||!!i.sourceThumbnail||!!i.pendingAsset||!!i.assetPath));
const isImageReady=p=>!!approvedImage(p);
const hasPending=p=>(p.imageCandidates||[]).some(i=>i.status!=="rejected"&&i.id!==p.primaryImageId&&(!!i.imageUrl||!!i.sourceThumbnail||!!i.pendingAsset||!!i.assetPath));
function referenceImage(p){
 const candidates=(p.imageCandidates||[]).filter(c=>c&&c.status!=="rejected"&&c.placeMatch==="confirmed"&&(c.imageUrl||c.sourceThumbnail||c.pendingAsset||c.assetPath));
 const selected=candidates.find(c=>c.id===p.referenceImageId);
 if(selected)return selected;
 const usable=c=>!/(항공|드론|지도|포스터|렌더링|aerial|drone|map|poster|render)/i.test(String(c.viewType||"")+" "+String(c.title||""));
 return candidates.find(usable)||null;
}
function activePhoto(p){return approvedImage(p)||referenceImage(p);}
function clearObjectUrl(cid){const old=objectUrls.get(cid);if(old){URL.revokeObjectURL(old);objectUrls.delete(cid);}}
function bindImageFallbacks(root){
 if(!root)return;
 root.querySelectorAll("img[data-image-fallback]").forEach(img=>{
  if(img.dataset.fallbackBound==="1")return;
  img.dataset.fallbackBound="1";
  img.dataset.originalImageUrl=img.getAttribute("src")||img.currentSrc||img.src||"";
  const initialFrame=img.closest(".thumb,.reference-photo-wrap,.candidate-image-frame,.scout-feature-image,.landing-hero");
  if(initialFrame){if(img.complete&&img.naturalWidth>0)initialFrame.classList.remove("image-loading");else initialFrame.classList.add("image-loading");}
  img.addEventListener("load",()=>{
   const frame=img.closest(".thumb,.reference-photo-wrap,.candidate-image-frame,.scout-feature-image,.landing-hero");
   if(frame)frame.classList.remove("image-loading","image-missing","proxy-loading");
   img.removeAttribute("aria-hidden");
  });
  img.addEventListener("error",()=>{
   const frame=img.closest(".thumb,.reference-photo-wrap,.candidate-image-frame,.scout-feature-image,.landing-hero");
   const original=img.dataset.originalImageUrl||"";
   const thumbnail=img.dataset.fallbackThumbnail||"";
   // Some host sites reject direct hotlink requests. Try an alternate preview if supplied.
   if(!img.dataset.thumbnailTried && thumbnail && thumbnail!==original){
    img.dataset.thumbnailTried="1";
    img.src=thumbnail;
    return;
   }
   // Retry only remote HTTP(S) image URLs through an image resize/cache proxy.
   // This does not approve the image's copyright or place match; it only helps display it.
   if(!img.dataset.proxyTried && /^https?:\/\//i.test(original) && !/images\.weserv\.nl/i.test(original)){
    img.dataset.proxyTried="1";
    if(frame)frame.classList.add("proxy-loading");
    const width=frame&&frame.classList.contains("thumb")?240:900;
    const height=frame&&frame.classList.contains("thumb")?180:650;
    img.referrerPolicy="no-referrer";
    img.src="https://images.weserv.nl/?url="+encodeURIComponent(original)+"&w="+width+"&h="+height+"&fit=inside&output=webp";
    return;
   }
   // If the first URL and its proxy fail, try another non-rejected candidate for the same place.
   if(Number(img.dataset.alternateCandidateIndex||0)<8){
    const placeId=img.dataset.homePreview||img.dataset.placePreview||img.closest("[data-home-place]")?.dataset.homePlace||img.closest("[data-select]")?.dataset.select||img.closest("[data-photos-detail]")?.dataset.photosDetail||img.closest("[data-map-place]")?.dataset.mapPlace||img.closest("[data-analysis-place]")?.dataset.analysisPlace||selectedId;
    const place=getPlace(placeId);
    const alternatives=(place?.imageCandidates||[]).filter(c=>c&&c.status!=="rejected"&&c.placeMatch==="confirmed"&&(c.imageUrl||c.sourceThumbnail)&&![(img.dataset.originalImageUrl||""),thumbnail].includes(c.imageUrl||c.sourceThumbnail));
    const index=Number(img.dataset.alternateCandidateIndex||0);
    if(index<alternatives.length){
     const alt=alternatives[index];img.dataset.alternateCandidateIndex=String(index+1);img.dataset.alternateCandidatesTried="1";
     img.dataset.originalImageUrl=alt.imageUrl||alt.sourceThumbnail||"";img.dataset.thumbnailTried="1";img.dataset.proxyTried="";img.removeAttribute("aria-hidden");
     if(frame)frame.classList.remove("image-missing","proxy-loading");
     img.src=img.dataset.originalImageUrl;
     return;
    }
   }
   if(frame)frame.classList.remove("image-loading","proxy-loading");
   if(frame)frame.classList.add("image-missing");
   img.setAttribute("aria-hidden","true");
  });
  // Cached images can fail before the error listener has finished binding.
  if(img.complete&&img.naturalWidth===0)queueMicrotask(()=>img.dispatchEvent(new Event("error")));
  else if(img.complete&&img.naturalWidth>0){const frame=img.closest(".thumb,.reference-photo-wrap,.candidate-image-frame,.scout-feature-image,.landing-hero");if(frame)frame.classList.remove("image-loading","image-missing","proxy-loading");}
 });
}
function stamp(){return new Date().toISOString();}
function localSave(msg){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(catalog));$("saveStatus").textContent=msg||("이 기기에 임시저장 · "+new Date().toLocaleTimeString("ko-KR"));if($("homeFeaturedGrid"))renderLanding();}catch(e){$("saveStatus").textContent="임시저장 실패: "+e.message;}}
function normalizeCatalog(obj){
 if(!obj||!Array.isArray(obj.places))throw new Error("places 배열이 없는 카탈로그 파일입니다.");
 const seen=new Set();
 obj.schemaVersion=2;
 obj.places.forEach((p,index)=>{
  if(!p||!p.id||!p.name)throw new Error((index+1)+"번째 장소에 id 또는 name이 없습니다.");
  if(seen.has(p.id))throw new Error("중복 장소 ID: "+p.id);seen.add(p.id);
  if(!Array.isArray(p.imageCandidates))p.imageCandidates=[];
  if(!Array.isArray(p.aliases))p.aliases=[];
  if(!Array.isArray(p.spaceTypes)||!p.spaceTypes.length)p.spaceTypes=["실내·외 조사 필요"];
  if(typeof p.photoProfile!=="string"||p.photoProfile.length<15)p.photoProfile="사진가 관점의 조형성·빛·배경과 촬영 활용 가능성을 조사해야 하는 신규 후보 장소.";
  if(!Array.isArray(p.visualStrengths)||p.visualStrengths.length<2)p.visualStrengths=["시각적 강점 조사 필요","배경 재료와 빛 분석 필요"];
  if(!Array.isArray(p.bestConcepts)||p.bestConcepts.length<2)p.bestConcepts=["패션·인물 화보 활용성 검토","에디토리얼·브랜드 촬영 적합성 검토"];
  if(!Array.isArray(p.constraints)||p.constraints.length<2)p.constraints=["운영·출입 조건 확인 필요","상업촬영 허가·장비 반입 확인 필요"];
  if(![1,2,3].includes(p.scoutPriority))p.scoutPriority=3;
  if(!Array.isArray(p.searchTerms)||!p.searchTerms.length)p.searchTerms=[p.name+" 사진 촬영 장소"];
  if(!p.verification)p.verification={location:"미확인",photoMatch:"미확인",rights:"미확인",shootingPermission:"미확인",lastCheckedAt:null};
  p.shootingDetails=Object.assign({parking:"확인 필요 — 주차 요금·높이 제한·장비 하차 지점",publicTransport:"확인 필요 — 가까운 역·정류장과 도보 동선",loadIn:"확인 필요 — 반입구·차량 하차점·카트 이동",stairsElevator:"확인 필요 — 계단·경사·엘리베이터",accessibleRoute:"확인 필요 — 휠체어·경사로·촬영 포인트 접근",restroom:"확인 필요 — 화장실 위치와 운영시간",changingRoom:"확인 필요 — 탈의·메이크업·대기 공간",crewBase:"확인 필요 — 스태프 집결·모니터링·휴식 공간",power:"확인 필요 — 콘센트·사용허가·회로 용량",lightDirection:"확인 필요 — 시간대별 자연광 방향과 역광",shadowControl:"확인 필요 — 차광·플래그 설치 가능 위치",backgroundControl:"확인 필요 — 간판·방문객·차량 등 배경 통제",focalLength:"기획 제안 — 공간·인물 구도별 초점거리 시험",cameraHeight:"기획 제안 — 아이레벨·로우앵글·하이앵글 비교",composition:"기획 제안 — 와이드·미디엄·디테일 촬영 포인트",subjectScale:"기획 제안 — 전신·3/4·환경 인물 구도",movement:"기획 제안 — 워킹샷·정지 포즈·카메라 이동",ceiling:"확인 필요 — 천장 높이·스탠드·붐 설치 제한",sound:"확인 필요 — 방문객·교통·공조·작업 소음",connectivity:"확인 필요 — 휴대전화 수신·Wi‑Fi·데이터 백업",lighting:"확인 필요 — 전원·조명 설치 조건",indoorBackup:"확인 필요 — 우천·강풍 대체 장소",crowdTiming:"확인 필요 — 행사·혼잡 시간·추천 시간대",equipmentRestrictions:"확인 필요 — 삼각대·플래시·조명·드론·연막 제한",permitCost:"확인 필요 — 상업촬영 허가·예약·촬영료·보증금",restoration:"확인 필요 — 촬영 후 청소·원상복구·손상 책임",contact:"확인 필요 — 관리 부서·담당 연락처",fieldNotes:"",lastFieldCheck:"미확인"},p.shootingDetails||{});
  p.updatedAt=p.updatedAt||stamp();
 });
 return obj;
}
let lastCleanRefresh=0;
function mergePublishedPhotoReferences(draft,base){
 if(!draft||!Array.isArray(draft.places))return base;
 const excluded=new Set(base.excludedLocationIds||[]);
 draft.places=draft.places.filter(p=>p&&!excluded.has(p.id));
 draft.excludedLocationIds=[...excluded];
 const queueById=new Map((Array.isArray(draft.reviewQueue)?draft.reviewQueue:[]).map(p=>[p.id,p]));
 for(const item of (base.reviewQueue||[])){
  if(!item||!item.id)continue;
  const prior=queueById.get(item.id);
  if(!prior){queueById.set(item.id,JSON.parse(JSON.stringify(item)));continue;}
  for(const key of ["curationQueueStatus","catalogPlaceId","reviewedOn","curationQueueReason"]){if(item[key])prior[key]=item[key];}
 }
 draft.reviewQueue=[...queueById.values()];
 const draftIds=new Set(draft.places.map(p=>p&&p.id).filter(Boolean));
 for(const freshPlace of (base.places||[])){if(freshPlace&&freshPlace.id&&!draftIds.has(freshPlace.id)){draft.places.push(JSON.parse(JSON.stringify(freshPlace)));draftIds.add(freshPlace.id);}}
 const sourceById=new Map((base.places||[]).map(p=>[p.id,p]));
 for(const p of draft.places){
  const fresh=sourceById.get(p.id);if(!fresh)continue;
  for(const key of ["address","officialUrl","phone","mapSearchQuery"]){if(!String(p[key]||"").trim()&&String(fresh[key]||"").trim())p[key]=fresh[key];}
  for(const key of ["visualCurationStatus","photoReviewStatus","mediaExposureStatus","selectionStatus"]){if(!String(p[key]||"").trim()&&String(fresh[key]||"").trim())p[key]=fresh[key];}
  if((!Array.isArray(p.mediaAppearances)||!p.mediaAppearances.length)&&Array.isArray(fresh.mediaAppearances)&&fresh.mediaAppearances.length)p.mediaAppearances=JSON.parse(JSON.stringify(fresh.mediaAppearances));
  if(!Array.isArray(p.imageCandidates))p.imageCandidates=[];
  if(p.photoSelectionCleared)continue;
  for(const sourceCandidate of (fresh.imageCandidates||[])){if(!p.imageCandidates.some(c=>c.id===sourceCandidate.id))p.imageCandidates.push(JSON.parse(JSON.stringify(sourceCandidate)));}
  const usable=c=>c&&c.status!=="rejected"&&(c.imageUrl||c.sourceThumbnail||c.pendingAsset||c.assetPath);
  const publicPrimary=(fresh.imageCandidates||[]).find(c=>c&&c.id===fresh.primaryImageId&&usable(c));
  if(publicPrimary){
   let localPrimary=p.imageCandidates.find(c=>c.id===publicPrimary.id);
   if(!localPrimary){localPrimary=JSON.parse(JSON.stringify(publicPrimary));p.imageCandidates.push(localPrimary);}
   else if(!usable(localPrimary)&&!localPrimary.pendingAsset){Object.assign(localPrimary,JSON.parse(JSON.stringify(publicPrimary)));}
   if(!usable(p.imageCandidates.find(c=>c.id===p.primaryImageId)))p.primaryImageId=publicPrimary.id;
  }
  let current=p.imageCandidates.find(c=>c.id===p.referenceImageId&&usable(c));
  if(!current){
   const publicRef=(fresh.imageCandidates||[]).find(c=>c.id===fresh.referenceImageId&&usable(c))||(fresh.imageCandidates||[]).find(usable);
   if(publicRef){
    current=p.imageCandidates.find(c=>c.id===publicRef.id);
    if(!current){current=JSON.parse(JSON.stringify(publicRef));p.imageCandidates.push(current);}
    else if(!usable(current)&&!current.pendingAsset){Object.assign(current,JSON.parse(JSON.stringify(publicRef)));}
    p.referenceImageId=current.id;
    p.referenceImageStatus="기본 사진 후보 · 대체 가능";
   }
  }
 }
 return draft;
}
async function loadBase(){
 lastCleanRefresh=Date.now();
 try{
  const r=await fetch(DATA_URL+"?v="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("기본 카탈로그를 읽지 못했습니다 (HTTP "+r.status+")");
  const base=normalizeCatalog(await r.json());
  let draft=null;try{draft=JSON.parse(localStorage.getItem(LOCAL_KEY)||"null");}catch(_){}
  const source=draft&&Array.isArray(draft.places)?mergePublishedPhotoReferences(draft,base):base;
  catalog=normalizeCatalog(source);
  const routeAfterLoad=document.body.dataset.appView||"home";
  if(selectedId&&!getPlace(selectedId))selectedId=null;
  if(draft){
   try{localStorage.setItem(LOCAL_KEY,JSON.stringify(catalog));}catch(_){}
   $("saveStatus").textContent="이 기기의 작업 초안 불러옴 · 사진 연결 확인";
  }else $("saveStatus").textContent="공통 카탈로그 최신본 불러옴";
  render();renderLanding();showAppView(routeAfterLoad,false);
 }catch(e){$("saveStatus").textContent="자료 불러오기 실패: "+e.message;$("placeList").innerHTML='<div class="empty">기본 자료를 불러오지 못했습니다.<br>GitHub Pages URL에서 열었는지 확인하세요.</div>';renderLanding();}
}
function refreshSharedCatalogIfClean(){
 if(localStorage.getItem(LOCAL_KEY))return;
 if(Date.now()-lastCleanRefresh<3000)return;
 loadBase();
}
function render(){
 syncRegionFilters();
 const q=$("query").value.trim().toLowerCase(),region=$("regionFilter").value,filter=$("imageFilter").value,category=$("categoryFilter")?$("categoryFilter").value:"",mood=$("moodFilter")?$("moodFilter").value:"";
 const places=catalog.places.filter(p=>{
  const text=[p.name,p.region,regionGroup(p.region),p.category,p.summary,p.photoProfile,p.address,p.placeType,p.indoorOutdoor,...(p.aliases||[]),...(p.searchTerms||[]),...(p.spaceTypes||[]),...(p.visualStrengths||[]),...(p.bestConcepts||[])].join(" ").toLowerCase();
  if(archiveMode==="favorites"&&!favorites.includes(p.id))return false;
  // 공백으로 나눈 여러 검색어는 모두 일치해야 하며, 지역·유형·사진상태 필터와 함께 적용됩니다.
  const terms=q.split(/\s+/).filter(Boolean);
  if(terms.some(term=>!text.includes(term)))return false;
  if(region&&String(p.region||"").trim()!==region)return false;
  if(category){
   const tags=[p.category,p.indoorOutdoor,p.placeType,p.summary,p.photoProfile,...(p.spaceTypes||[]),...(p.visualStrengths||[]),...(p.bestConcepts||[])].join(" ").toLowerCase();
   const termsByCategory={
    실내:["실내","인테리어","홀","전시장","실내공간","갤러리"],
    실외:["실외","야외","거리","광장","공원","정원","외부"],
    건축:["건축","미술관","박물관","건물","구조","공간","콘크리트","벽돌"],
    자연:["자연","야외","숲","바다","산","공원","정원","강","해변","외부"],
    스튜디오:["스튜디오","공연장","대형스튜디오","촬영장","방송 세트"]
   };
   const matches=termsByCategory[category]||[category];
   if(!matches.some(t=>tags.includes(t.toLowerCase())))return false;
  }
  if(mood){
   const tags=[p.category,p.summary,p.photoProfile,p.legacyMood,p.mood,...(p.legacyVisualTags||[]),...(p.spaceTypes||[]),...(p.visualStrengths||[]),...(p.bestConcepts||[])].join(" ").toLowerCase();
   const moodTerms={
    "자연광":["자연광","채광","빛","그림자","역광"],
    "산업적":["산업","산업적","콘크리트","철골","공장","창고","노출"],
    "레트로":["레트로","빈티지","복고","옛","벽돌","오래된","레트로"],
    "미니멀":["미니멀","여백","절제","무채색","흰 벽","단순한"],
    "도시적":["도시","도심","거리","빌딩","도시적","urban"],
    "야간":["야간","밤","네온","야경","야간조명"],
    "드라마틱":["드라마틱","극적","실루엣","강한 대비","무대","조명"]
   }[mood]||[mood];
   if(!moodTerms.some(term=>tags.includes(term.toLowerCase())))return false;
  }
  if(filter==="none"&&activePhoto(p))return false;
  if(filter==="review"&&!hasPending(p))return false;
  if(filter==="ready"&&!isImageReady(p))return false;
  return true;
 }).sort((a,b)=>(a.scoutPriority||9)-(b.scoutPriority||9)||["서울","경기","인천","강원","대전","세종","충북","충남","전북","전남","광주","대구","경북","부산","울산","경남","제주"].indexOf(a.region)-["서울","경기","인천","강원","대전","세종","충북","충남","전북","전남","광주","대구","경북","부산","울산","경남","제주"].indexOf(b.region)||a.name.localeCompare(b.name,"ko"));
 $("countAll").textContent=catalog.places.length;if($("workspaceTitle"))$("workspaceTitle").textContent=archiveMode==="favorites"?"내 저장 장소":"촬영 장소 아카이브";
 $("countNoImage").textContent=catalog.places.filter(p=>!isImageReady(p)).length;
 $("countReview").textContent=catalog.places.filter(hasPending).length;
 $("listCount").textContent=places.length+"곳";
 $("placeList").innerHTML=places.length?places.map(p=>{
  const im=approvedImage(p),ref=im?null:referenceImage(p),shown=im||ref;
  const closed=/운영 종료/.test(String(p.openingStatus||""));
  const reviewHeld=p.visualCurationStatus==="conditional"||p.visualCurationStatus==="rejected"||p.photoReviewStatus==="pending-place-photo-review";
  const state=(closed?'<span class="chip closed">운영 종료 · 재개관 확인</span>':'')+
   (reviewHeld?'<span class="chip need">사진 검토 보류</span>':'')+
   (im?'<span class="chip selected-photo">대표사진 선택됨</span>':ref?'<span class="chip need">기본 사진 · 변경 가능</span>':imageCount(p)?'<span class="chip need">사진 후보 '+imageCount(p)+'개</span>':'<span class="chip need">사진 없음</span>');
  const thumb=shown?'<img data-image-fallback="true" data-fallback-thumbnail="'+esc(shown.sourceThumbnail||"")+'" data-place-preview="'+esc(p.id)+'" loading="lazy" alt="'+esc(p.name)+' '+(im?'대표사진':'장소 사진 후보')+'" src="'+esc(shown.imageUrl||shown.sourceThumbnail||"")+'" referrerpolicy="no-referrer"><span class="thumb-flag '+(im?'approved':'reference')+'">'+(im?'대표사진':'장소 사진')+'</span><span class="thumb-missing">사진 연결을 확인할 수 없습니다</span>':'<span>'+(imageCount(p)?(p.visualCurationStatus==="conditional"||p.photoReviewStatus==="pending-place-photo-review"?"사진 검토 보류":"사진 후보 검토 중"):"사진 후보 없음")+'</span>';
  return '<article class="place '+(p.id===selectedId?'active':'')+'" data-select="'+esc(p.id)+'" tabindex="0" role="button" aria-pressed="'+(p.id===selectedId?'true':'false')+'"><div class="thumb '+(im?'thumb-approved':ref?'thumb-reference':'')+'">'+thumb+'</div><div><h3>'+esc(p.name)+'</h3><p>'+esc(p.region)+' · '+esc(p.category||"분류 미정")+'</p><div class="chips"><span class="chip">'+esc((p.spaceTypes||[]).join(" · "))+'</span><span class="chip '+(p.scoutPriority===1?'':'need')+'">조사 '+(p.scoutPriority===1?'A':p.scoutPriority===2?'B':'C')+'</span><span class="chip">사진잠재력 '+esc(p.photoPotentialScore||"—")+'/100</span>'+state+'</div><div class="place-photo-title">'+esc(shown?(shown.title||"장소 사진 후보"):"사진 후보 없음")+'</div></div><span class="place-chevron" aria-hidden="true">↗</span></article>';
 }).join(""):'<div class="empty">검색 조건에 맞는 장소가 없습니다.</div>';
 bindImageFallbacks($("placeList"));
 catalog.places.forEach(place=>{if((place.imageCandidates||[]).some(c=>c.pendingAsset))hydratePendingPreviews(place);});
 $("placeList").querySelectorAll("[data-select]").forEach(el=>{
   const choose=()=>{selectedId=el.dataset.select;if(window.matchMedia("(max-width: 1050px)").matches)showAppView("detail");else render();};
   el.addEventListener("click",choose);
   el.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();choose();}});
  });
 renderDetail();
 updateFloatingControls();
}
function regionGroup(region){
 // '수도권'은 검색어 별칭으로만 지원하고 지역 선택은 경기·인천을 각각 유지합니다.
 const r=String(region||"").trim();
 if(r==="경기"||r==="인천")return "수도권";
 if(["대전","세종","충북","충남"].includes(r))return "충청";
 if(["전북","전남"].includes(r))return "전라";
 if(["경북","경남"].includes(r))return "경상";
 return r;
}
const REGION_ORDER=["서울","경기","인천","부산","대구","광주","울산","강원","충북","충남","대전","세종","경북","경남","전북","전남","제주"];
function syncRegionFilters(){
 const found=Array.from(new Set((catalog.places||[]).map(p=>String(p.region||"").trim()).filter(Boolean)));
 const regions=[...REGION_ORDER,...found.filter(r=>!REGION_ORDER.includes(r)).sort((a,b)=>a.localeCompare(b,"ko"))];
 for(const [id,label] of [["homeAllRegionFilter","전국 전체"],["regionFilter","전국 전체"],["mapRegionFilter","전국 전체"],["analysisRegionFilter","모든 지역"]]){
  const select=$(id);if(!select)continue;const prior=select.value;
  const opts=regions.map(r=>[r,r]);
  select.innerHTML='<option value="">'+label+'</option>'+opts.map(([value,name])=>'<option value="'+esc(value)+'">'+esc(name)+'</option>').join("");
  if(opts.some(([value])=>value===prior))select.value=prior;
 }
}
function showAppView(view,scroll=true){
 const workspaceViews=["workspace","detail","favorites"];
 $("homeView").hidden=view!=="home";$("workspaceView").hidden=!workspaceViews.includes(view);
 $("welcomeView").hidden=view!=="welcome";$("mapView").hidden=view!=="map";$("photosView").hidden=view!=="photos";$("analysisView").hidden=view!=="analysis";$("moreView").hidden=view!=="more";$("appNav").hidden=view==="welcome";
 document.body.dataset.appView=view;
 if(workspaceViews.includes(view))render();
 if(view==="home")renderLanding();if(view==="welcome")renderWelcomeView();if(view==="map")renderMapScreen();if(view==="photos")renderPhotosScreen();if(view==="analysis")renderAnalysisScreen();if(view==="more")renderMoreScreen();
 document.querySelectorAll("[data-nav-view]").forEach(button=>{const target=button.dataset.navView,active=(view==="detail"&&(target==="home"||(target==="favorites"&&archiveMode==="favorites")))||(view==="favorites"&&target==="favorites")||((view==="workspace"||view==="photos"||view==="analysis")&&target==="more")||target===view;button.classList.toggle("active",active);if(active)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");});
 if(scroll)window.scrollTo({top:0,behavior:"auto"});
 updateFloatingControls();
}
function goToWorkspace(query="",region=""){archiveMode="all";selectedId=null;$("query").value=query;$("regionFilter").value=region;$("imageFilter").value="";if($("categoryFilter"))$("categoryFilter").value="";if($("moodFilter"))$("moodFilter").value="";showAppView("workspace");}
const FAVORITES_KEY="frameAtlas2FavoritePlaces";
let favorites=[];try{favorites=JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]");if(!Array.isArray(favorites))favorites=[];}catch(_){favorites=[];}
let archiveMode="all";
const scrollTopBtn=$("scrollTopBtn"),backToArchiveBtn=$("backToArchiveBtn");
function updateFloatingControls(){
 const view=document.body.dataset.appView||"welcome";
 const y=Math.max(window.scrollY||0,document.documentElement.scrollTop||0);
 if(scrollTopBtn)scrollTopBtn.hidden=view==="welcome"||y<Math.max(280,(window.innerHeight||700)*.4);
 const placeDetailOpen=!!selectedId&&(view==="detail"||view==="workspace"||view==="favorites");
 if(backToArchiveBtn)backToArchiveBtn.hidden=!placeDetailOpen;
}
let floatingUpdateFrame=0;
function scheduleFloatingControlUpdate(){
 if(floatingUpdateFrame)return;
 floatingUpdateFrame=requestAnimationFrame(()=>{floatingUpdateFrame=0;updateFloatingControls();});
}
window.addEventListener("scroll",scheduleFloatingControlUpdate,{passive:true});
window.addEventListener("resize",scheduleFloatingControlUpdate,{passive:true});
if(scrollTopBtn)scrollTopBtn.addEventListener("click",()=>window.scrollTo({top:0,behavior:window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}));
function showHomeAllPlaces(){
 archiveMode="all";selectedId=null;
 $("query").value="";$("regionFilter").value="";$("imageFilter").value="";
 $("homeAllSearchInput").value="";$("homeAllRegionFilter").value="";if($("homeAllCategoryFilter"))$("homeAllCategoryFilter").value="";if($("homeAllMoodFilter"))$("homeAllMoodFilter").value="";
 /* Force the 2.0 home container visible before rendering; never route this control through the legacy workspace. */
 const home=$("homeView"),workspace=$("workspaceView");
 if(home)home.hidden=false;
 if(workspace)workspace.hidden=true;
 showAppView("home",false);
 renderLanding();
 updateFloatingControls();
 requestAnimationFrame(()=>{
  const grid=$("homeFeaturedGrid");
  if(grid)grid.scrollIntoView({behavior:"auto",block:"start"});
  if(document.body.dataset.appView!=="home"||$("workspaceView").hidden===false){
   showAppView("home",false);renderLanding();
  }
  updateFloatingControls();
 });
}
function showPlaceArchive(event){
 if(event){event.preventDefault();event.stopPropagation();}
 /* Stay in the current 2.0 page so unsaved editing context is not lost; showHomeAllPlaces scrolls to the visible full catalog. */
 showHomeAllPlaces();
}
if(backToArchiveBtn)backToArchiveBtn.addEventListener("click",showPlaceArchive);

function isFavorite(id){return favorites.includes(id);}
function toggleFavorite(id){if(isFavorite(id))favorites=favorites.filter(x=>x!==id);else favorites.push(id);try{localStorage.setItem(FAVORITES_KEY,JSON.stringify(favorites));}catch(_){}render();renderLanding();renderMoreScreen();renderPhotosScreen();}
function chooseHomeHeroPlace(places){
 const manuallyHeld=new Set(["seo-peace-culture-bunker","seo-city-hall-new-building"]);
 const pool=places.filter(p=>{
  if(manuallyHeld.has(p.id))return false;
  if(p.visualCurationStatus==="conditional"||p.visualCurationStatus==="rejected")return false;
  if(/운영 종료|폐쇄|영구 휴관/.test(String(p.openingStatus||"")))return false;
  const photo=activePhoto(p),url=photo&&(photo.imageUrl||photo.sourceThumbnail||"");
  return !!url && /^https?:\/\//i.test(String(url)) && photo.placeMatch==="confirmed" && photo.status!=="rejected";
 });
 if(!pool.length)return null;
 const current=pool.find(p=>p.id===homeHeroPlaceId);
 if(current)return current;
 let previous="";
 try{previous=localStorage.getItem("frameAtlas2HomeHeroLast")||"";}catch(_){}
 let candidates=pool.length>1?pool.filter(p=>p.id!==previous):pool;
 if(!previous&&candidates.length>1){const alternatives=candidates.filter(p=>p.id!=="seo-ddp");if(alternatives.length)candidates=alternatives;}
 if(!candidates.length)candidates=pool;
 const chosen=candidates[Math.floor(Math.random()*candidates.length)];
 homeHeroPlaceId=chosen.id;
 try{localStorage.setItem("frameAtlas2HomeHeroLast",chosen.id);}catch(_){}
 return chosen;
}
function renderLanding(){
 syncRegionFilters();
 const grid=$("homeFeaturedGrid");if(!grid)return;
 const places=Array.isArray(catalog.places)?catalog.places:[];
 $("homeCountPlaces").textContent=places.length;if($("homeFeaturedCount"))$("homeFeaturedCount").textContent=places.length;
 $("homeCountPhotos").textContent=places.filter(p=>!!activePhoto(p)).length;
 const get=id=>places.find(p=>p.id===id);
 const prefer=["seo-ddp","seo-oil-tank","seo-seoul-station-284","gg-mimesis","ic-tri-bowl","ic-art-platform"];
 const picked=prefer.map(get).filter(Boolean);
 const baseFeatured=[...picked,...places.filter(p=>!picked.some(x=>x.id===p.id)).sort((a,b)=>{
  const aClosed=/운영 종료|폐쇄|영구 휴관/.test(String(a.openingStatus||""))?1:0,bClosed=/운영 종료|폐쇄|영구 휴관/.test(String(b.openingStatus||""))?1:0;
  return aClosed-bClosed+(a.visualCurationStatus==="conditional"?1:0)-(b.visualCurationStatus==="conditional"?1:0)||(a.scoutPriority||9)-(b.scoutPriority||9);
 })];
 const heroPlace=chooseHomeHeroPlace(places)||baseFeatured.find(p=>activePhoto(p))||baseFeatured[0];
 /* The first visible card is the same random location as the hero; on mobile the photo banner is compacted into this first card. */
 const featured=heroPlace?[heroPlace,...baseFeatured.filter(p=>p.id!==heroPlace.id)]:baseFeatured;
 if(heroPlace){
  const photo=activePhoto(heroPlace),hero=$("landingHeroImage");
  if(hero&&photo){
   hero.dataset.homeHeroPlace=heroPlace.id;
   hero.dataset.fallbackThumbnail=photo.sourceThumbnail||"";
   hero.dataset.fallbackBound="";
   hero.classList.remove("image-missing");
   hero.src=photo.imageUrl||photo.sourceThumbnail||"";
   const cap=$("landingHeroCaption");if(cap)cap.textContent=heroPlace.name+" / "+heroPlace.region;
   bindImageFallbacks($("homeView"));
  }else if(hero){
   hero.removeAttribute("src");hero.classList.add("image-missing");
   const cap=$("landingHeroCaption");if(cap)cap.textContent="PLACE PHOTO UNAVAILABLE";
  }
 }
 grid.innerHTML=featured.length?featured.map((p,index)=>{
  const photo=activePhoto(p),url=photo?(photo.imageUrl||photo.sourceThumbnail||""):"";
  const status=p.visualCurationStatus==="conditional"||p.visualCurationStatus==="rejected"||p.photoReviewStatus==="pending-place-photo-review"?"대표사진 검토 보류":photo&&photo.placeMatch==="confirmed"?"장소 일치 후보":"실제 장소 확인 필요";
  const holdPhoto=p.visualCurationStatus==="conditional"||p.visualCurationStatus==="rejected"||p.photoReviewStatus==="pending-place-photo-review";
  const photoLabel=photo&&(p.primaryImageId===photo.id?"승인 대표사진":"참고사진 · 후보 "+imageCount(p)+"개");
  const image=photo&&!holdPhoto?'<img data-image-fallback="true" data-fallback-thumbnail="'+esc(photo.sourceThumbnail||"")+'" data-home-preview="'+esc(p.id)+'" src="'+esc(url)+'" loading="lazy" alt="'+esc(p.name)+' 촬영 참고사진" referrerpolicy="no-referrer"><span class="featured-photo-label">'+esc(photoLabel)+'</span><span class="featured-photo-missing">사진을 불러올 수 없습니다</span>':'<div class="featured-no-photo">'+(holdPhoto?"대표사진 검토 보류":"사진 후보를 찾는 중입니다")+'</div>';
  return '<button type="button" class="scout-feature-card" data-home-place="'+esc(p.id)+'"><span class="scout-feature-image">'+image+'</span><span class="scout-feature-body"><span class="scout-feature-top"><span class="scout-feature-index">'+String(index+1).padStart(2,"0")+'</span><span>'+esc(p.region||"지역 미등록")+'</span></span><b>'+esc(p.name)+'</b><span class="scout-feature-desc">'+esc(p.photoProfile||p.summary||"사진가 관점에서 검토할 촬영 장소")+'</span><span class="scout-feature-bottom"><span>'+esc(status)+'</span><span class="scout-feature-arrow">↗</span></span></span></button>';
 }).join(""):'<div class="landing-empty">장소 자료를 불러오지 못했습니다.</div>';
 bindImageFallbacks(grid);
 grid.querySelectorAll("[data-home-place]").forEach(card=>card.addEventListener("click",()=>{selectedId=card.dataset.homePlace;showAppView("detail");}));
 const allGrid=$("homeAllPlacesGrid");
 if(allGrid){
  const q=($("homeAllSearchInput")?.value||"").trim().toLowerCase(),region=$("homeAllRegionFilter")?.value||"",category=$("homeAllCategoryFilter")?.value||"",mood=$("homeAllMoodFilter")?.value||"";
  const all=places.filter(p=>{
   const haystack=[p.name,p.region,regionGroup(p.region),p.category,p.summary,p.photoProfile,p.address,p.placeType,p.indoorOutdoor,...(p.aliases||[]),...(p.searchTerms||[]),...(p.spaceTypes||[]),...(p.visualStrengths||[]),...(p.bestConcepts||[])].join(" ").toLowerCase();
   const terms=q.split(/\s+/).filter(Boolean);
   if(terms.some(term=>!haystack.includes(term)))return false;
   if(region&&String(p.region||"").trim()!==region)return false;
   if(category){
    const tags=[p.category,p.indoorOutdoor,p.placeType,p.summary,p.photoProfile,...(p.spaceTypes||[]),...(p.visualStrengths||[]),...(p.bestConcepts||[])].join(" ").toLowerCase();
    const termsByCategory={실내:["실내","인테리어","홀","전시장","실내공간","갤러리"],실외:["실외","야외","거리","광장","공원","정원","외부"],건축:["건축","미술관","박물관","건물","구조","공간","콘크리트","벽돌"],자연:["자연","야외","숲","바다","산","공원","정원","강","해변","외부"],스튜디오:["스튜디오","공연장","대형스튜디오","촬영장","방송 세트"]}[category]||[category];
    if(!termsByCategory.some(term=>tags.includes(term.toLowerCase())))return false;
   }
   if(mood){
    const tags=[p.category,p.summary,p.photoProfile,p.legacyMood,p.mood,...(p.legacyVisualTags||[]),...(p.spaceTypes||[]),...(p.visualStrengths||[]),...(p.bestConcepts||[])].join(" ").toLowerCase();
    const moodTerms={"자연광":["자연광","채광","빛","그림자","역광"],"산업적":["산업","산업적","콘크리트","철골","공장","창고","노출"],"레트로":["레트로","빈티지","복고","옛","벽돌","오래된"],"미니멀":["미니멀","여백","절제","무채색","흰 벽","단순한"],"도시적":["도시","도심","거리","빌딩","도시적","urban"],"야간":["야간","밤","네온","야경","야간조명"],"드라마틱":["드라마틱","극적","실루엣","강한 대비","무대","조명"]}[mood]||[mood];
    if(!moodTerms.some(term=>tags.includes(term.toLowerCase())))return false;
   }
   return true;
  })
   .sort((a,b)=>(a.scoutPriority||9)-(b.scoutPriority||9)||["서울","경기","인천","강원","대전","세종","충북","충남","전북","전남","광주","대구","경북","부산","울산","경남","제주"].indexOf(a.region)-["서울","경기","인천","강원","대전","세종","충북","충남","전북","전남","광주","대구","경북","부산","울산","경남","제주"].indexOf(b.region)||a.name.localeCompare(b.name,"ko"));
  $("homeAllPlaceCount").textContent=all.length;
  allGrid.innerHTML=all.map((p,index)=>{
   const photo=activePhoto(p),url=photo?(photo.imageUrl||photo.sourceThumbnail||""):"";
   const held=p.visualCurationStatus==="conditional"||p.visualCurationStatus==="rejected"||p.photoReviewStatus==="pending-place-photo-review";
   const status=held?"대표사진·장소 일치 검토 보류":/운영 종료|휴관|폐쇄/.test(String(p.openingStatus||""))?"운영 상태 재확인":"촬영 조건 사전 확인";
   return '<button type="button" class="home-place-row" data-home-all-place="'+esc(p.id)+'"><span class="home-place-thumb">'+(photo&&!held?'<img loading="lazy" data-image-fallback="true" data-fallback-thumbnail="'+esc(photo.sourceThumbnail||"")+'" src="'+esc(url)+'" alt="'+esc(p.name)+' 촬영 참고사진" referrerpolicy="no-referrer">':'<span class="home-place-placeholder">'+(held?"사진 검토 보류":"▧")+'</span>')+'</span><span class="home-place-info"><small>'+String(index+1).padStart(2,"0")+' / '+esc(p.region||"수도권")+'</small><b>'+esc(p.name)+'</b><span>'+esc(p.category||"장소 유형 조사 필요")+'</span><em>'+esc(status)+'</em></span><span class="home-place-chevron">↗</span></button>';
  }).join("")||'<div class="landing-empty">조건에 맞는 장소가 없습니다.</div>';
  bindImageFallbacks(allGrid);
  allGrid.querySelectorAll("[data-home-all-place]").forEach(card=>card.addEventListener("click",()=>{selectedId=card.dataset.homeAllPlace;showAppView("detail");}));
 }
 const queue=(Array.isArray(catalog.reviewQueue)?catalog.reviewQueue:[]).filter(item=>!["registered-in-catalog","merged-into-catalog"].includes(item.curationQueueStatus));
 const queueCount=$("homeCountReviewQueue");if(queueCount)queueCount.textContent=queue.length;
 const queueCountLabel=$("reviewQueueCount");if(queueCountLabel)queueCountLabel.textContent=queue.length;
 const queueHost=$("reviewQueueGrid");
 if(queueHost){
  queueHost.innerHTML=queue.length?queue.map(item=>{
   const reason=String(item.curationQueueReason||item.photoReviewStatus||item.summary||"사진과 촬영 적합성을 추가 확인해야 합니다.");
   const official=String(item.officialUrl||"").trim();
   const source=(item.imageCandidates||[]).find(c=>c&&c.sourcePageUrl);
   const photo=(item.imageCandidates||[]).find(c=>c&&/^https?:\/\//i.test(String(c.imageUrl||c.sourceThumbnail||""))&&c.placeMatch!=="mismatch");
   const photoUrl=photo&&(photo.imageUrl||photo.sourceThumbnail)||"";
   const photoMarkup=photoUrl?'<div class="review-queue-media"><img data-image-fallback="true" data-place-preview="'+esc(item.id||"")+'" data-fallback-thumbnail="'+esc(photo.sourceThumbnail||"")+'" src="'+esc(photoUrl)+'" alt="'+esc(item.name||"촬영 장소")+' 검토 후보 사진" loading="lazy" referrerpolicy="no-referrer"><span>검토 후보 · 대표사진 아님</span></div>':'<div class="review-queue-no-photo">직접 확인 가능한 대표사진 미등록</div>';
   const candidateCount=(item.imageCandidates||[]).filter(c=>/^https?:\/\//i.test(String(c.imageUrl||c.sourceThumbnail||""))).length;
   return '<article class="review-queue-card" data-review-queue-id="'+esc(item.id||"")+'">'+photoMarkup+'<div class="review-queue-card-body"><div class="review-queue-kicker"><span>'+esc(item.region||"전국")+'</span><span>검증 전 보류</span></div><h3>'+esc(item.name||"이름 미등록 후보")+'</h3><p>'+esc(reason)+'</p><div class="review-queue-meta">직접 사진 후보 '+candidateCount+'개 · 대표사진 승인 0개</div><div class="review-queue-links">'+(official&&/^https?:\/\//i.test(official)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(official)+'">공식 정보 ↗</a>':'')+(source&&/^https?:\/\//i.test(String(source.sourcePageUrl||""))?'<a target="_blank" rel="noopener noreferrer" href="'+esc(source.sourcePageUrl)+'">사진 원문 ↗</a>':'')+'</div></div></article>';
  }).join(""):'<div class="landing-empty">현재 검토 대기 후보가 없습니다.</div>';
  bindImageFallbacks(queueHost);
 }
}

function renderWelcomeView(){const p=chooseHomeHeroPlace(catalog.places)||catalog.places.find(x=>activePhoto(x)),photo=p&&activePhoto(p),img=$("welcomeHeroImage");if(img&&photo){img.dataset.homeHeroPlace=p.id;img.dataset.fallbackThumbnail=photo.sourceThumbnail||"";img.dataset.fallbackBound="";img.src=photo.imageUrl||photo.sourceThumbnail||"";bindImageFallbacks($("welcomeView"));}}
function renderMapScreen(){
 syncRegionFilters();
 const region=$("mapRegionFilter").value,filter=$("mapAccessFilter").value;
 const places=catalog.places.filter(p=>{if(region&&p.region!==region)return false;const permission=String(p.shootingPermission||"")+" "+String(p.verification&&p.verification.shootingPermission||""),closed=/운영 종료|휴관|폐쇄/.test(String(p.openingStatus||"")),verified=/촬영 가능|허가 불필요|공식 근거 확인|서면 확인/.test(permission);if(filter==="closed"&&!closed)return false;if(filter==="verified"&&!verified)return false;if(filter==="unknown"&&(closed||verified))return false;return true;}).sort((a,b)=>(a.scoutPriority||9)-(b.scoutPriority||9)||a.name.localeCompare(b.name,"ko"));
 $("mapCount").textContent=places.length+"곳";$("mapListCount").textContent=places.length+"곳";
 const place=places.find(p=>p.id===selectedId)||getPlace(selectedId);
 $("mapPlaceTitle").textContent=place?place.name:"전국 촬영 장소";
 $("mapPlaceCaption").textContent=place?(place.address||place.region+" · 실제 출입구·촬영 구역을 확인하세요."):"왼쪽 목록에서 장소를 선택한 뒤 지도 보기 또는 길찾기를 누르세요.";
 const target=place||{name:"전국 촬영 장소",region:"대한민국",mapSearchQuery:"대한민국 촬영 장소",address:""};
 const mapBtn=$("mapScreenMapBtn"),routeBtn=$("mapScreenRouteBtn");
 if(mapBtn)mapBtn.onclick=()=>openMapLinksDialog(target,"map");
 if(routeBtn)routeBtn.onclick=()=>openMapLinksDialog(target,"route");
 $("mapPlaceList").innerHTML=places.map(p=>{const photo=activePhoto(p),permission=String(p.shootingPermission||""),label=/촬영 불가/.test(permission)?"촬영 불가 근거 확인":/촬영 가능|허가 불필요/.test(permission)?"가능 근거 확인":"사전 확인 필요";return '<button class="map-place-row" type="button" data-map-place="'+esc(p.id)+'"><span class="map-place-thumb">'+(photo?'<img loading="lazy" data-image-fallback="true" data-fallback-thumbnail="'+esc(photo.sourceThumbnail||"")+'" src="'+esc(photo.imageUrl||photo.sourceThumbnail||"")+'" alt="" referrerpolicy="no-referrer">':'<span>⌖</span>')+'</span><span class="map-place-info"><b>'+esc(p.name)+'</b><small>'+esc(p.region)+' · '+esc(p.category||"분류 미정")+'</small><small>'+esc(label)+'</small></span><span class="map-place-arrow">↗</span></button>';}).join("")||'<div class="empty">조건에 맞는 장소가 없습니다.</div>';
 bindImageFallbacks($("mapPlaceList"));$("mapPlaceList").querySelectorAll("[data-map-place]").forEach(button=>button.addEventListener("click",()=>{selectedId=button.dataset.mapPlace;renderMapScreen();}));
}
let photoCategoryFilter="all";
function renderPhotosScreen(){
 const query=$("photosSearchInput").value.trim().toLowerCase(),match=$("photosMatchFilter").value,items=[];
 for(const place of catalog.places)for(const candidate of (place.imageCandidates||[])){if(candidate.status==="rejected"||!(candidate.imageUrl||candidate.sourceThumbnail||candidate.pendingAsset||candidate.assetPath))continue;if(match&&String(candidate.placeMatch||"unverified")!==match)continue;const kind=String(candidate.viewType||"")+" "+String(candidate.title||"")+" "+String(candidate.notes||"");if(photoCategoryFilter==="portrait"&&!/인물|패션|모델|portrait|fashion/i.test(kind))continue;if(photoCategoryFilter==="landscape"&&!/풍경|야외|자연|공원|거리|landscape|outdoor|nature/i.test(kind))continue;if(photoCategoryFilter==="architecture"&&!/건축|실내|구조|외관|전경|디테일|architecture|interior|building/i.test(kind))continue;if(query&&![place.name,place.region,place.category,candidate.title,candidate.viewType].join(" ").toLowerCase().includes(query))continue;items.push({place,candidate});}
 items.sort((a,b)=>Number(b.place.primaryImageId===b.candidate.id)-Number(a.place.primaryImageId===a.candidate.id)||(a.place.scoutPriority||9)-(b.place.scoutPriority||9)||a.place.name.localeCompare(b.place.name,"ko"));
 $("photoCandidateCount").textContent=items.length+"장";
 $("photosGrid").innerHTML=items.map(({place:p,candidate:c})=>{const selected=p.primaryImageId===c.id,reference=p.referenceImageId===c.id,src=c.imageUrl||c.sourceThumbnail||"",status=c.placeMatch==="confirmed"?"장소 일치 확인됨":c.placeMatch==="mismatch"?"다른 장소 사진":"장소 일치 확인 필요";
 return '<article class="photo-gallery-card"><button class="photo-gallery-image" type="button" data-photos-detail="'+esc(p.id)+'" aria-label="'+esc(p.name)+' 상세 보기"><img loading="lazy" data-image-fallback="true" data-fallback-thumbnail="'+esc(c.sourceThumbnail||"")+'" src="'+esc(src)+'" alt="'+esc(p.name)+' 촬영 참고사진" referrerpolicy="no-referrer"><span class="photo-gallery-count">'+(selected?"대표사진":reference?"기본 참고사진":"사진 후보")+'</span></button><div class="photo-gallery-info"><span class="photo-gallery-region">'+esc(p.region)+" · "+esc(p.category||"분류 미정")+'</span><h3>'+esc(p.name)+'</h3><p>'+esc(c.title||"장소 사진 후보")+'</p><span class="photo-match-state '+(c.placeMatch==="confirmed"?"match-good":c.placeMatch==="mismatch"?"match-bad":"match-wait")+'">'+esc(status)+'</span><div class="photo-gallery-actions">'+(selected?'<span class="selected-photo-chip">대표사진으로 사용 중</span>':'<button type="button" class="btn small primary" data-photos-select="'+esc(p.id)+'" data-candidate-id="'+esc(c.id)+'">대표사진 선택</button>')+'<button type="button" class="btn small" data-photos-detail="'+esc(p.id)+'">장소 상세</button></div></div></article>';
 }).join("")||'<div class="landing-empty">검색 조건에 맞는 사진 후보가 없습니다.</div>';
 bindImageFallbacks($("photosGrid"));$("photosGrid").querySelectorAll("[data-photos-detail]").forEach(button=>button.addEventListener("click",()=>{selectedId=button.dataset.photosDetail;showAppView("detail");}));$("photosGrid").querySelectorAll("[data-photos-select]").forEach(button=>button.addEventListener("click",()=>{selectedId=button.dataset.photosSelect;candidateAction(selectedId,button.dataset.candidateId,"select");renderPhotosScreen();}));
}
function renderAnalysisScreen(){
 syncRegionFilters();
 const query=$("analysisSearchInput").value.trim().toLowerCase(),region=$("analysisRegionFilter").value,places=catalog.places.filter(p=>(!query||[p.name,p.region,p.category,p.photoProfile].join(" ").toLowerCase().includes(query))&&(!region||p.region===region));
 places.sort((a,b)=>(Number(b.photoPotentialScore)||0)-(Number(a.photoPotentialScore)||0)||(a.scoutPriority||9)-(b.scoutPriority||9));$("analysisCount").textContent=places.length+"곳";
 $("analysisGrid").innerHTML=places.map(p=>{const score=Math.max(0,Math.min(100,Number(p.photoPotentialScore)||0)),photo=activePhoto(p);return '<button class="analysis-card" type="button" data-analysis-place="'+esc(p.id)+'"><span class="analysis-image">'+(photo?'<img loading="lazy" data-image-fallback="true" data-fallback-thumbnail="'+esc(photo.sourceThumbnail||"")+'" src="'+esc(photo.imageUrl||photo.sourceThumbnail||"")+'" alt="" referrerpolicy="no-referrer">':'<span>⌖</span>')+'</span><span class="analysis-text"><small>'+esc(p.region)+' · '+(p.scoutPriority===1?"A 우선 조사":p.scoutPriority===2?"B 조사":"C 조건부")+'</small><b>'+esc(p.name)+'</b><span>'+esc(p.photoProfile||p.summary||"사진적 활용도 확인 필요")+'</span><em>시각적 잠재력 <strong>'+score+'</strong> / 100</em></span></button>';}).join("")||'<div class="empty">조건에 맞는 장소가 없습니다.</div>';
 bindImageFallbacks($("analysisGrid"));$("analysisGrid").querySelectorAll("[data-analysis-place]").forEach(button=>button.addEventListener("click",()=>{selectedId=button.dataset.analysisPlace;showAppView("detail");}));
}
function renderMoreScreen(){
 $("moreFavoriteCount").textContent=favorites.filter(id=>getPlace(id)).length;
 $("moreView").querySelectorAll("[data-more-action]").forEach(button=>{if(button.dataset.bound==="1")return;button.dataset.bound="1";button.addEventListener("click",()=>{const action=button.dataset.moreAction;
 if(action==="archive")goToWorkspace("","");else if(action==="favorites"){archiveMode="favorites";selectedId=null;$("query").value="";$("regionFilter").value="";$("imageFilter").value="";showAppView("favorites");}else if(action==="analysis")showAppView("analysis");else if(action==="photos")showAppView("photos");else if(action==="export")exportCatalog();else if(action==="import")$("importInput").click();else if(action==="settings"){if(typeof $("installDialog").showModal==="function")$("installDialog").showModal();}else if(action==="welcome")showAppView("welcome");
 });});
}

function photoQuery(p,mode){
 const searchTerms=Array.isArray(p.searchTerms)?p.searchTerms:[];
 const base=[p.name,p.region,"Korea"].filter(Boolean).join(" ");
 const extras={
  place:searchTerms[0]||p.name+" 현장 외관 사진",
  fashion:"패션 화보 인물 촬영 editorial fashion portrait photoshoot",
  architecture:"건축 파사드 기하학 질감 architecture facade geometry texture photography",
  interior:"실내 건축 자연광 interior architecture natural light",
  outdoor:"야외 인물 화보 outdoor portrait location",
  details:"건축 디테일 재료 질감 그림자 architectural details texture shadows"
 };
 return (base+" "+(extras[mode]||extras.place)).trim();
}
function sourceLinks(p,mode){
 const q=photoQuery(p,mode||"place"),qt=encodeURIComponent(q),official=String(p.officialUrl||"").trim();
 const officialUrl=/^https?:\/\//i.test(official)?official:"https://www.google.com/search?q="+encodeURIComponent('"'+p.name+'" 공식 홈페이지');
 const links=[["Google 이미지","https://www.google.com/search?tbm=isch&q="+qt,"이미지 전반 검색"],["네이버 이미지","https://search.naver.com/search.naver?where=image&query="+qt,"국내 현장 사진·블로그"],["Bing 이미지","https://www.bing.com/images/search?q="+qt,"대체 이미지 검색"],[/^https?:\/\//i.test(official)?"공식 홈페이지":"공식 운영정보 검색",officialUrl,"주소·운영시간·촬영 문의 확인"]];
 return '<div class="sourcegrid">'+links.map(x=>'<a class="source" target="_blank" rel="noopener noreferrer" href="'+esc(x[1])+'">'+esc(x[0])+'<small>'+esc(x[2])+'</small></a>').join("")+'</div>';
}
function openMapLinksDialog(p,purpose){
 const dlg=$("mapLinksDialog");if(!dlg||!p)return;
 const address=String(p.address||"").trim(),area=String(p.mapSearchQuery||"").trim(),query=address||area||[p.name,p.region,"대한민국"].filter(Boolean).join(" "),encoded=encodeURIComponent(query),name=String(p.name||"촬영 장소");
 const naverMap="https://map.naver.com/p/search/"+encoded,naverRoute=naverMap;
 const coords=p.coordinates||{},lat=Number(Array.isArray(coords)?coords[0]:(coords.lat??coords.latitude)),lng=Number(Array.isArray(coords)?coords[1]:(coords.lng??coords.lon??coords.longitude));
 let tmap="tmap://search?name="+encodeURIComponent(name+" "+String(p.region||""));
 if(purpose==="route"&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat!==0&&lng!==0)tmap="tmap://route?goalname="+encodeURIComponent(name)+"&goalx="+encodeURIComponent(lng)+"&goaly="+encodeURIComponent(lat);
 $("mapLinksHeading").textContent=purpose==="route"?"길찾기 서비스 선택":"지도 보기 서비스 선택";
 $("mapLinksAddress").textContent=(address||area||query)+" · "+(purpose==="route"?"목적지 검색 결과를 확인한 뒤 안내를 시작하세요.":"실제 촬영 구간·출입구를 확인하세요.");
 $("mapNaverMapLink").href=naverMap;$("mapNaverRouteLink").href=naverRoute;$("mapTmapLink").href=tmap;
 $("mapNaverMapLink").hidden=purpose==="route";$("mapNaverRouteLink").hidden=purpose!=="route";
 $("mapNaverRouteLink").querySelector("b").textContent="네이버 지도에서 목적지 확인";
 $("mapNaverRouteLink").querySelector("small").textContent="장소를 선택한 뒤 지도에서 길찾기를 누르세요";
 $("mapTmapLink").textContent=purpose==="route"?"티맵에서 검색·길찾기":"티맵에서 장소 찾기";
 $("mapLinksNote").textContent=Number.isFinite(lat)&&Number.isFinite(lng)&&lat!==0&&lng!==0?"등록 좌표를 사용할 수 있습니다. 지도 서비스에서 위치와 경로를 확인하세요.":"현재 등록 좌표가 없는 장소는 이름·주소 검색으로 열립니다. 티맵은 앱 설치·기기 환경에 따라 열리는 방식이 다를 수 있습니다.";
 if(typeof dlg.showModal==="function"){if(!dlg.open)dlg.showModal();}else dlg.setAttribute("open","open");
}
function locationActions(p){
 const address=String(p.address||"").trim(),area=String(p.mapSearchQuery||"").trim(),query=address||area||[p.name,p.region,"대한민국"].filter(Boolean).join(" ");
 return '<div class="location-actions" aria-label="지도 보기와 길찾기"><button class="btn primary" type="button" data-open-map-dialog data-map-purpose="map">⌖ 지도 보기</button><button class="btn orange" type="button" data-open-map-dialog data-map-purpose="route">➜ 길찾기</button><p class="map-note">'+esc(query+" · 팝업에서 네이버 지도 또는 티맵을 선택합니다.")+'</p></div>';
}
function referencePhotoPanel(p,approved,ref){
 const photo=approved||ref;
 if(!photo){
  const waiting=(p.imageCandidates||[]).some(c=>c&&c.status!=="rejected"&&c.placeMatch!=="mismatch"&&(c.imageUrl||c.sourceThumbnail||c.pendingAsset||c.assetPath));
  return '<div class="statusbar warn">'+(waiting?'등록된 사진 후보는 실제 장소와의 일치 여부가 아직 확인되지 않아 기본 참고사진으로 표시하지 않습니다. 사진 후보 목록에서 장소·구도 일치를 확인한 뒤 대표사진으로 지정하세요.':'확인된 사진 후보가 없습니다. 아래에서 이미지 주소를 넣거나 사진 파일을 추가하세요.')+'</div>';
 }
 const chosen=!!approved;
 const matchText=photo.placeMatch==="confirmed"?"장소 일치 확인 후보":photo.placeMatch==="mismatch"?"장소 불일치 · 대표사진 사용 금지":"실제 장소의 사진인지 확인해 주세요";
 const rightsUnknown=!photo.rights||photo.rights==="unknown"||/미확인|확인 필요/i.test(String(photo.rightsLabel||""));
 const imageRationale=String(photo.viewType||"").trim();
 const photoNotes=String(photo.notes||"").trim();
 const sourceName=String(photo.sourceName||photo.creator||"").trim();
 return '<div class="section reference-hero"><div class="reference-photo-wrap"><img data-image-fallback="true" data-fallback-thumbnail="'+esc(photo.sourceThumbnail||"")+'" data-reference-preview="'+esc(photo.id)+'" '+(chosen?'data-primary-preview="'+esc(photo.id)+'"':'')+' src="'+esc(photo.imageUrl||photo.sourceThumbnail||"")+'" alt="'+esc(p.name)+' '+(chosen?'대표사진':'촬영 참고사진')+'" loading="lazy" referrerpolicy="no-referrer"><span class="reference-stamp">'+(chosen?'CURRENT COVER PHOTO':'LOCATION PHOTO · REVIEWABLE')+'</span><span class="reference-missing">사진 연결을 확인할 수 없습니다</span></div><div class="reference-info"><div class="reference-kicker">'+(chosen?'SELECTED PHOTO':'SUGGESTED PHOTO')+' / '+esc(p.region||"수도권")+'</div><h3>'+(chosen?'현재 대표사진':'기본 참고사진')+'</h3><p>'+esc(photo.title||p.name+" 장소 사진")+'</p>'+(imageRationale?'<div class="photo-rationale"><b>이 사진에서 볼 촬영 포인트</b><span>'+esc(imageRationale)+'</span></div>':"")+(photoNotes?'<p class="photo-evidence-note">'+esc(photoNotes)+'</p>':"")+'<div class="reference-meta">'+esc(matchText)+(sourceName?' · 출처: '+esc(sourceName):'')+'</div>'+(rightsUnknown?'<div class="photo-rights-warning">이미지 이용권은 미확인입니다. 사진 참고용으로만 보고, 외부 공개·상업적 재사용 전 원문 이용조건을 확인하세요.</div>':'')+'<div class="toolbar">'+(photo.sourcePageUrl?'<a class="btn small" href="'+esc(photo.sourcePageUrl)+'" target="_blank" rel="noopener noreferrer">사진 원문 ↗</a>':"")+'<a class="btn small" href="#candidateList">사진 변경·삭제 ↓</a></div><p class="tiny">사진의 구도·장소가 추천 사유와 맞지 않으면 대표사진으로 확정하지 말고 다른 후보로 바꾸거나 삭제하세요.</p></div></div>';
}
function renderMediaExposureCard(p){
 const entries=Array.isArray(p.mediaAppearances)?p.mediaAppearances.filter(x=>x&&String(x.title||"").trim()):[];
 const status=String(p.mediaExposureStatus||"").trim();
 if(!entries.length&&!status)return "";
 const items=entries.map(item=>{
  const date=String(item.date||"").trim(),publisher=String(item.publisher||"").trim(),kind=String(item.kind||"매체 기록").trim();
  const url=String(item.url||"").trim(),link=/^https?:\/\//i.test(url)?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">근거 보기 ↗</a>':"";
  return '<article class="media-appearance-item"><div class="media-appearance-meta"><span>'+esc(kind)+'</span>'+(date?'<time>'+esc(date)+'</time>':'')+'</div><b>'+esc(item.title)+'</b>'+(publisher?'<small>'+esc(publisher)+'</small>':'')+(item.notes?'<p>'+esc(item.notes)+'</p>':'')+link+'</article>';
 }).join("");
 return '<section class="section media-exposure-card"><h3>매체 노출·촬영 이력</h3><p class="searchnote">작품명·매체·공개 정보와 근거가 확인된 기록만 표시합니다. 건축·언론 기사와 실제 영화·드라마·광고 촬영 크레딧은 서로 구분합니다.</p>'+(items?'<div class="media-appearance-list">'+items+'</div>':'')+(status?'<p class="media-exposure-status">'+esc(status)+'</p>':'')+'</section>';
}
function renderDetail(){
 const p=getPlace(selectedId);
 if(!p){$("detail").innerHTML='<div class="empty">장소를 선택하세요.</div>';$("selectedMeta").textContent="";return;}
 $("selectedMeta").textContent=p.region+" · "+(p.imageCandidates||[]).length+"개 사진 후보";
 const prim=approvedImage(p);
 const ref=prim?null:referenceImage(p);
 const photoPanel=referencePhotoPanel(p,prim,ref);
 const isClosed=/운영 종료/.test(String(p.openingStatus||""));
 const closureNotice=isClosed?'<div class="statusbar warn"><b>운영 종료 확인</b><br>'+esc(p.openingStatus)+'<br>재개관과 촬영 접근 가능 여부가 공식 확인되기 전에는 실제 촬영 일정에 넣지 마세요.</div>':'';
 const bd=p.photoScoreBreakdown||{},photoScore=Math.max(0,Math.min(100,Number(p.photoPotentialScore)||0));
 const scoreBar=(label,value,max)=>{const n=Math.max(0,Math.min(max,Number(value)||0)),pct=Math.round(n/max*100);return '<div class="score-item"><div><span>'+label+'</span><b>'+n+'/'+max+'</b></div><div class="score-track"><span style="width:'+pct+'%"></span></div></div>';};
 const profileCard='<div class="statusbar"><b>사진 기획 적합성 · '+(p.scoutPriority===1?'우선 조사 A':p.scoutPriority===2?'우선 조사 B':'조건부 조사 C')+'</b><br>'+esc(p.photoProfile||p.summary||"사진적 활용도 확인 필요")+'<br><br><b>시각적 강점</b>: '+esc((p.visualStrengths||[]).join(" · ")||"검토 필요")+'<br><b>추천 콘셉트</b>: '+esc((p.bestConcepts||[]).join(" · ")||"검토 필요")+'<br><b>조사 시 확인</b>: '+esc((p.constraints||[]).join(" · ")||"운영·허가·접근성 확인")+'</div>'+
 '<div class="scorecard"><div class="scoretop"><div><b>사진가 관점의 시각적 잠재력</b><div class="tiny">관광 인지도는 점수에 포함하지 않음</div></div><div class="scorenum">'+photoScore+'<span style="font-size:11px;color:var(--muted)"> / 100</span></div></div><div class="scoregrid">'+
 scoreBar("시각적 고유성",bd.distinctiveness,30)+scoreBar("구도 다양성",bd.compositionVariety,20)+scoreBar("빛·재료 질감",bd.lightAndTexture,20)+scoreBar("에디토리얼 활용도",bd.editorialVersatility,20)+scoreBar("실내외·날씨 유연성",bd.indoorOutdoorFlexibility,10)+
 '</div><div class="score-legend"><span>A 85–100 · 최우선</span><span>B 74–84 · 보완 조사</span><span>C 0–73 · 조건부</span></div><div class="score-foot">'+esc(p.scoreStatus||"탁상 평가이며 현장 확인 전입니다.")+' 점수는 시각적 잠재력만 나타내며 출입·운영·촬영 허가 가능성은 별도 확인합니다.</div></div>';
 const venueParts=[];
 const venueAddress=String(p.address||"").trim(),venuePhone=String(p.phone||"").trim(),venueOfficial=String(p.officialUrl||"").trim();
 if(venueAddress)venueParts.push('<div class="venue-info-item"><span>주소</span><b>'+esc(venueAddress)+'</b></div>');
 if(venuePhone)venueParts.push('<div class="venue-info-item"><span>전화</span><a href="tel:'+esc(venuePhone.replace(/[^+\d]/g,""))+'">'+esc(venuePhone)+'</a></div>');
 if(/^https?:\/\//i.test(venueOfficial))venueParts.push('<div class="venue-info-item venue-official"><span>공식 사이트</span><a href="'+esc(venueOfficial)+'" target="_blank" rel="noopener noreferrer">홈페이지 열기 ↗</a></div>');
 const venueInfoCard=venueParts.length?'<div class="section venue-info-card"><h3>장소 이용 정보</h3><div class="venue-info-grid">'+venueParts.join("")+'</div><p class="searchnote">운영시간·휴관·촬영 허가 및 상업촬영 비용은 방문 전에 공식 홈페이지나 담당 부서에서 다시 확인하세요.</p></div>':'';
 const creativeInfoForm='<div class="section creative-info-form"><h3>촬영 기획·분류 정보 입력</h3><p class="searchnote">기존 장소 상세 화면과 같은 기록 항목입니다. 항목을 채운 뒤 저장하세요. 시각적 잠재력 점수는 실측값이 아니라 기획 평가이며, 운영·촬영 허가와 구분합니다.</p><div class="catalogform"><label class="wide">사진가 관점의 촬영 설명<textarea id="f_photoProfile" rows="3" placeholder="공간의 조형성, 빛, 재료, 구도와 촬영 콘셉트">'+esc(p.photoProfile||"")+'</textarea></label><label class="wide">공간 유형 (쉼표로 구분)<input id="f_spaceTypes" value="'+esc((p.spaceTypes||[]).join(", "))+'" placeholder="실내, 실외, 산업건축"></label><label class="wide">시각적 강점 (쉼표로 구분)<textarea id="f_visualStrengths" rows="2" placeholder="반복 창호, 자연광, 콘크리트 질감">'+esc((p.visualStrengths||[]).join(", "))+'</textarea></label><label class="wide">추천 촬영 콘셉트 (쉼표로 구분)<textarea id="f_bestConcepts" rows="2" placeholder="패션 에디토리얼, 인물 화보, 브랜드 룩북">'+esc((p.bestConcepts||[]).join(", "))+'</textarea></label><label class="wide">사전 확인·제약 조건 (쉼표로 구분)<textarea id="f_constraints" rows="2" placeholder="촬영 허가, 혼잡 시간, 장비 반입">'+esc((p.constraints||[]).join(", "))+'</textarea></label><label>사진적 잠재력 (0–100)<input type="number" id="f_photoPotentialScore" min="0" max="100" value="'+esc(p.photoPotentialScore??0)+'"></label><label>조사 우선순위<select id="f_scoutPriority"><option value="1" '+(p.scoutPriority===1?'selected':'')+'>A · 우선 조사</option><option value="2" '+(p.scoutPriority===2?'selected':'')+'>B · 보완 조사</option><option value="3" '+(p.scoutPriority===3?'selected':'')+'>C · 조건부 조사</option></select></label><label class="wide">지도 검색어·세부 위치<input id="f_mapSearchQuery" value="'+esc(p.mapSearchQuery||"")+'" placeholder="장소 이름과 실제 출입구·촬영 구역"></label><label class="wide">공식 출처 URL (쉼표로 구분)<textarea id="f_sourceRefs" rows="2" placeholder="https://공식-운영기관...">'+esc((p.sourceRefs||[]).join(", "))+'</textarea></label><label class="wide">추가 메모·확인 기록<textarea id="f_placeNotes" rows="3" placeholder="확인일, 담당자 답변, 현장 답사, 사진 출처와 권리 조건">'+esc(p.notes||"")+'</textarea></label><div class="wide"><button type="button" class="btn primary" id="saveCreativeFieldsBtn">촬영 기획·분류 정보 저장</button></div></div></div>';
 const mediaExposureCard=renderMediaExposureCard(p);
 $("detail").innerHTML=
 '<div class="detailtitle"><div><h2>'+esc(p.name)+'</h2><p>'+esc(p.region)+' · '+esc(p.category||"분류 미정")+' · ID '+esc(p.id)+'</p></div><div class="toolbar"><button class="btn small favorite-toggle" id="favoritePlaceBtn" type="button">♡ 저장하기</button><button class="btn small" id="editPlaceBtn">정보 수정</button><button class="btn small" id="deletePlaceBtn">장소 삭제</button></div></div>'+locationActions(p)+closureNotice+photoPanel+profileCard+creativeInfoForm+venueInfoCard+mediaExposureCard+
 '<div class="section"><h3>사진 찾기 · 핵심 검색원 4개</h3><label class="tiny">사진가 관점의 검색 방향<select id="photoSearchMode" class="field"><option value="place">장소·현장 전경</option><option value="fashion">패션·인물 에디토리얼</option><option value="architecture">건축·기하학·질감</option><option value="interior">실내·자연광</option><option value="outdoor">야외·인물 배경</option><option value="details">디테일·재료·그림자</option></select></label><div id="sourceLinksHost">'+sourceLinks(p,"place")+'</div><p class="searchnote">검색 페이지 링크는 Google 이미지·네이버 이미지·Bing 이미지·공식 홈페이지/운영정보 4개로 줄였습니다. 아래 Openverse와 Wikimedia Commons는 열린 라이선스 후보를 별도로 검색합니다. 사진 속 장소 일치 여부와 재사용 권리는 반드시 확인하세요.</p></div>'+
 '<div class="section"><h3>열린 라이선스 이미지 자동 검색</h3><div class="row"><button class="btn primary" id="searchOpenverseBtn">Openverse 검색</button><button class="btn" id="searchCommonsBtn">Wikimedia Commons 검색</button><button class="btn" id="clearSearchBtn">검색 결과 지우기</button></div><div class="searchnote">Openverse와 Commons에서 제목·썸네일·출처·라이선스 정보를 불러옵니다. 결과에 다른 장소가 섞일 수 있으므로 실제 사진을 확인한 뒤 후보로 저장하세요.</div><div id="autoSearchStatus" class="statusbar hidden"></div><div id="autoResults" class="results"></div></div>'+
 '<div class="section"><h3>장소 기본 정보</h3><div class="catalogform"><label>장소명<input id="f_name" value="'+esc(p.name)+'"></label><label>지역<select id="f_region">'+["서울","경기","인천","부산","대구","광주","울산","강원","충북","충남","대전","세종","경북","경남","전북","전남","제주"].map(r=>'<option value="'+r+'" '+(p.region===r?'selected':'')+'>'+r+'</option>').join("")+'</select></label><label>분류<input id="f_category" value="'+esc(p.category||"")+'"></label><label>별칭(쉼표 구분)<input id="f_aliases" value="'+esc((p.aliases||[]).join(", "))+'"></label><label class="wide">주소<input id="f_address" value="'+esc(p.address||"")+'" placeholder="공식 출처로 확인된 주소"></label><label>전화번호<input id="f_phone" value="'+esc(p.phone||"")+'" placeholder="공식 대표번호"></label><label class="wide">공식 홈페이지·근거 링크<input id="f_official" value="'+esc(p.officialUrl||"")+'" placeholder="https://..."></label><label>운영 상태<select id="f_open">'+["미확인","운영 확인","운영시간 확인","휴관·폐쇄 확인"].map(v=>'<option '+((p.openingStatus||"미확인")===v?'selected':'')+'>'+v+'</option>').join("")+'</select></label><label>촬영 허가<select id="f_permission">'+["미확인","사전 허가 필요","제한 있음","허가 불필요 근거 확인","촬영 불가 근거 확인"].map(v=>'<option '+((p.shootingPermission||"미확인")===v?'selected':'')+'>'+v+'</option>').join("")+'</select></label><label class="wide">촬영·조사 메모<textarea id="f_summary" rows="3">'+esc(p.summary||p.notes||"")+'</textarea></label><div class="wide"><button class="btn primary" id="savePlaceBtn">장소 정보 저장</button></div></div></div>'+
 '<div class="section photo-editor"><h3>사진 추가 / 교체</h3><p class="searchnote">이미지 주소를 붙여 넣거나 기기에 저장된 사진 파일을 선택하세요. 추가한 후보는 아래에서 대표사진으로 지정할 수 있습니다.</p><div class="candidateform"><label>이미지 주소(URL)<input id="c_image" placeholder="사진 파일의 직접 주소 https://..."></label><label>사진 파일 선택<input type="file" id="c_file" accept="image/jpeg,image/png,image/webp,image/avif"></label><label>사진 설명<input id="c_title" placeholder="예: 건물 정면, 중앙홀, 야간 외관"></label><label>사진 구도<select id="c_view"><option>장소 전경</option><option>건물·장소 전경</option><option>실내</option><option>디테일</option><option>야외 인물 배경</option><option>항공·드론</option><option>지도·포스터</option></select></label><label>실제 장소와 일치 여부<select id="c_match"><option value="unverified">확인 필요</option><option value="confirmed">이 장소의 사진임을 확인</option><option value="mismatch">다른 장소 사진</option></select></label><label>사진 원문 링크(선택)<input id="c_page" placeholder="사진이 표시된 페이지 주소"></label><label class="wide">메모(선택)<input id="c_notes" placeholder="장소가 맞는 근거, 촬영 위치나 각도"></label><div class="wide"><button class="btn primary" id="addCandidateBtn">사진 후보 추가</button></div></div></div>'+
'<div class="section"><h3>저장된 사진 후보 ('+imageCount(p)+')</h3><div id="candidateList">'+renderCandidates(p)+'</div></div>'+
 '<div class="section"><h3>장소 확인 상태</h3><div class="catalogform"><label>장소 정보<select id="v_location">'+["미확인","공식 출처 확인","현장 확인"].map(v=>'<option '+((p.verification?.location||"미확인")===v?'selected':'')+'>'+v+'</option>').join("")+'</select></label><label>대표사진의 장소 일치<select id="v_photo">'+["미확인","검토 중","확인 완료"].map(v=>'<option '+((p.verification?.photoMatch||"미확인")===v?'selected':'')+'>'+v+'</option>').join("")+'</select></label><label>촬영 가능 여부<select id="v_permission">'+["미확인","공식 근거 확인","서면 확인","현장 확인 필요"].map(v=>'<option '+((p.verification?.shootingPermission||"미확인")===v?'selected':'')+'>'+v+'</option>').join("")+'</select></label><div class="wide"><button class="btn" id="saveVerificationBtn">장소 확인 상태 저장</button></div></div></div>'+
'<div class="section"><h3>이 장소의 출처·작업 기록</h3><p class="tiny">최종 확인일: '+esc(p.verification?.lastCheckedAt||"미기록")+' · 최근 수정: '+esc(p.updatedAt||"미기록")+'</p></div>';
 $("favoritePlaceBtn").textContent=isFavorite(p.id)?"♥ 저장됨":"♡ 저장하기";$("favoritePlaceBtn").setAttribute("aria-pressed",isFavorite(p.id)?"true":"false");$("favoritePlaceBtn").addEventListener("click",()=>toggleFavorite(p.id));
 bindImageFallbacks($("detail"));
 $("detail").querySelectorAll("[data-open-map-dialog]").forEach(button=>button.addEventListener("click",()=>openMapLinksDialog(p,button.dataset.mapPurpose)));
 $("editPlaceBtn").addEventListener("click",()=>{$("f_name").focus();$("f_name").scrollIntoView({behavior:"smooth",block:"center"});});
 $("deletePlaceBtn").addEventListener("click",()=>deletePlace(p.id));
 $("savePlaceBtn").addEventListener("click",()=>savePlace(p.id));
 $("saveCreativeFieldsBtn").addEventListener("click",()=>saveCreativeFields(p.id));
 $("addCandidateBtn").addEventListener("click",()=>addCandidate(p.id));
 $("saveVerificationBtn").addEventListener("click",()=>saveVerification(p.id));
 $("photoSearchMode").addEventListener("change",()=>{$("sourceLinksHost").innerHTML=sourceLinks(p,$("photoSearchMode").value);});
 $("searchOpenverseBtn").addEventListener("click",()=>searchOpenverse(p));
 $("searchCommonsBtn").addEventListener("click",()=>searchCommons(p));
 $("clearSearchBtn").addEventListener("click",()=>{$("autoResults").innerHTML="";$("autoSearchStatus").classList.add("hidden");searchCache=[];});
 $("candidateList").querySelectorAll("[data-cand-action]").forEach(el=>el.addEventListener("click",()=>candidateAction(p.id,el.dataset.candId,el.dataset.candAction)));
 $("candidateList").querySelectorAll("[data-cand-field]").forEach(el=>el.addEventListener("change",()=>{
  const c=(p.imageCandidates||[]).find(x=>x.id===el.dataset.candId);if(!c)return;
  const field=el.dataset.candField,value=el.value.trim();
  if(field==="sourcePageUrl"){
   if(value){try{const u=new URL(value);if(!["https:","http:"].includes(u.protocol))throw new Error("URL");}catch(_){alert("사진 원문 링크는 http:// 또는 https:// 형식으로 입력하세요.");el.focus();return;}}
   c[field]=value;
  }else if(field==="title"){c.title=value||"장소 사진 후보";}
  else if(field==="placeMatch"||field==="viewType"||field==="notes"){c[field]=value;}
  c.updatedAt=stamp();p.updatedAt=stamp();localSave("사진 정보를 저장했습니다");render();renderLanding();
 }));
 renderShootingDetails(p);
 $("detail").querySelectorAll(".shooting-form input.unconfirmed-field").forEach(input=>{
  input.addEventListener("focus",()=>input.select());
  input.addEventListener("input",()=>input.classList.toggle("unconfirmed-field",isUnconfirmed(input.value)));
 });
 $("saveShootingDetailsBtn").addEventListener("click",()=>saveShootingDetails(p.id));
 hydratePendingPreviews(p);
}
function renderShootingDetails(p){
 const d=p.shootingDetails||{},old=p.legacyScout;
 const groups=[
  ["접근·장비 동선",[["parking","주차·하차 위치"],["publicTransport","대중교통·도보 접근"],["loadIn","장비 반입·이동 동선"],["stairsElevator","계단·엘리베이터·층간 이동"],["accessibleRoute","휠체어·접근성"],["restroom","화장실"],["changingRoom","탈의·메이크업 공간"],["crewBase","스태프 집결·대기·모니터링"]]],
  ["장비·공간·사진 설계",[["power","전원·콘센트·회로"],["lighting","인공조명 사용 조건"],["lightDirection","자연광 방향·시간대"],["shadowControl","그림자·차광 통제"],["backgroundControl","배경 통제·통행"],["focalLength","추천 초점거리"],["cameraHeight","카메라 높이·앵글"],["composition","구도·촬영 포인트"],["subjectScale","인물·피사체 크기"],["movement","워킹샷·카메라 이동"],["ceiling","천장 높이·스탠드·붐"],["sound","주변 소음·음향"]]],
  ["허가·운영·현장 대응",[["connectivity","휴대전화·Wi‑Fi·데이터 백업"],["indoorBackup","우천·강풍 대체 장소"],["crowdTiming","혼잡 시간·추천 시간대"],["equipmentRestrictions","삼각대·플래시·조명·드론 제한"],["permitCost","촬영 허가·예약·비용"],["restoration","청소·원상복구 조건"],["contact","관리 부서·담당 연락처"]]]
 ];
 const list=items=>Array.isArray(items)&&items.length?'<ul>'+items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>':'<p class="tiny">기록 없음</p>';
 const legacyMarkup=old?'<section class="legacy-scout-card" data-legacy-scout><div class="shooting-section-head"><div><p class="eyebrow">MIGRATED / LEGACY SCOUT NOTES</p><h3>이전 버전 스카우팅 기록</h3></div><span class="checklist-note">'+esc(old.statusLabel||"참고 기록 · 최신 확인 필요")+'</span></div><p class="searchnote">이전 DB 장소 ID '+esc(old.sourceLocationId||"—")+' · '+esc(old.legacyRecordedAt||"날짜 미상")+' 기록. 아래 점수·제안·체크 항목은 참고용이며 현재 운영/허가를 확인했다는 뜻이 아닙니다.</p><div class="legacy-score-row"><div><span>창작 적합성</span><b>'+esc(old.proScout?.creativeFit??"—")+'<small>/100</small></b></div><div><span>제작 적합성</span><b>'+esc(old.proScout?.productionFit??"—")+'<small>/100</small></b></div><div><span>이전 기록 확신도</span><b>'+esc(old.proScout?.confidence||"미상")+'</b></div></div><div class="legacy-fact-grid"><div><b>추천 촬영 시간대</b><p>'+esc(old.proScout?.bestWindow||"기록 없음")+'</p></div><div><b>추천 렌즈</b><p>'+esc(old.proScout?.recommendedFocalLength||"기록 없음")+'</p></div><div><b>카메라 높이·움직임</b><p>'+esc(old.proScout?.cameraHeight||"기록 없음")+' · '+esc(old.proScout?.movement||"기록 없음")+'</p></div><div><b>빛·배경</b><p>'+esc(old.proScout?.lightDirection||"기록 없음")+' · '+esc(old.proScout?.backgroundControl||"기록 없음")+'</p></div></div><div class="legacy-notes-grid"><div><h4>이전 촬영 체크리스트</h4>'+list(old.shootingChecklist)+'</div><div><h4>이전 현장 리스크</h4>'+list(old.fieldRisks)+'</div><div><h4>구도 제안</h4>'+list(old.compositionTips)+'</div><div><h4>빛·시간대 제안</h4>'+list(old.lightTips)+'</div></div>'+(old.photographerMemo?'<p class="legacy-memo"><b>사진가 메모</b><br>'+esc(old.photographerMemo)+'</p>':'')+'<p class="tiny legacy-disclaimer">이관 출처: '+esc(old.sourceVersion||"FRAME ATLAS 이전 버전")+'. 이전 자료와 현재 확인된 공식 조건은 구분해서 사용하세요. 새로 확인한 정보는 아래 체크리스트에 기록합니다.</p></section>':'';
 const isUnconfirmed=value=>!String(value||"").trim()||/(미확인|확인 필요|확인해야|재확인|조사 필요|여부 확인|조건 확인|필요 여부|확보 여부|검토 필요)/.test(String(value));
 const fieldMarkup=groups.map(([title,fields])=>'<div class="wide scout-subsection"><h4>'+esc(title)+'</h4></div>'+fields.map(([key,label])=>{const value=String(d[key]||"미확인"),pending=isUnconfirmed(value);return '<label>'+esc(label)+'<input id="sd_'+key+'" class="'+(pending?'unconfirmed-field':'')+'" value="'+esc(value)+'" placeholder="'+(pending?'미확인 · 클릭 후 확인 결과 입력':'확인 결과 또는 근거 링크')+'"></label>';}).join('')).join('');
 const markup=legacyMarkup+'<div class="section shooting-checklist"><div class="shooting-section-head"><div><p class="eyebrow">FIELD CHECK / PRODUCTION LOGISTICS</p><h3>현장 촬영 체크리스트</h3></div><span class="checklist-note">미확인 항목은 방문 전 확인</span></div><p class="searchnote">‘확인 필요’는 확인된 사실이 아니라 점검할 내용입니다. 공식 안내·전화·현장 답사 결과를 날짜와 근거 링크와 함께 기록하세요.</p><div class="catalogform shooting-form">'+fieldMarkup+'<label class="wide">현장 답사·촬영 메모<textarea id="sd_fieldNotes" rows="4" placeholder="빛의 방향, 촬영 포인트, 혼잡도, 담당자 답변, 근거 URL 등">'+esc(d.fieldNotes||'')+'</textarea></label><label>마지막 확인일<input id="sd_lastFieldCheck" value="'+esc(d.lastFieldCheck||"미확인")+'" placeholder="YYYY-MM-DD"></label><div class="wide"><button class="btn primary" type="button" id="saveShootingDetailsBtn">현장 체크리스트 저장</button></div></div></div>';
 $("detail").insertAdjacentHTML("beforeend",markup);
}
function saveShootingDetails(id){
 const p=getPlace(id);if(!p)return;
 const keys=["parking","publicTransport","loadIn","stairsElevator","accessibleRoute","restroom","changingRoom","crewBase","power","lighting","lightDirection","shadowControl","backgroundControl","focalLength","cameraHeight","composition","subjectScale","movement","ceiling","sound","connectivity","indoorBackup","crowdTiming","equipmentRestrictions","permitCost","restoration","contact","fieldNotes","lastFieldCheck"];
 p.shootingDetails=p.shootingDetails||{};
 keys.forEach(key=>{const el=$("sd_"+key);if(el)p.shootingDetails[key]=el.value.trim()||(key==="fieldNotes"?"":"미확인");});
 p.updatedAt=stamp();localSave("현장 촬영 체크리스트를 이 기기에 저장했습니다");render();
}
function renderCandidates(p){
 if(!imageCount(p))return '<div class="empty">사진 후보가 없습니다. 위에서 이미지 주소를 입력하거나 사진 파일을 추가하세요.</div>';
 const viewOptions=["장소 전경","건물·장소 전경","실내","디테일","야외 인물 배경","항공·드론","지도·포스터"];
 return p.imageCandidates.map(c=>{
  const safe=esc(c.imageUrl||c.sourceThumbnail||"");
  const chosen=p.primaryImageId===c.id,defaultRef=p.referenceImageId===c.id;
  const badge=chosen?'<span class="chip selected-photo">현재 대표사진</span>':defaultRef?'<span class="chip need">기본 참고사진</span>':'<span class="chip">대체 후보</span>';
  const imageMarkup=(c.imageUrl||c.sourceThumbnail||c.pendingAsset||c.assetPath)?'<div class="candidate-image-frame"><img data-image-fallback="true" data-fallback-thumbnail="'+esc(c.sourceThumbnail||"")+'" data-local-preview="'+esc(c.id)+'" loading="lazy" alt="사진 후보 미리보기" src="'+safe+'" referrerpolicy="no-referrer"><span class="reference-missing">사진 연결을 확인할 수 없습니다</span></div>':'<div class="thumb">사진 없음</div>';
  const matchOptions=[["unverified","확인 필요"],["confirmed","이 장소의 사진임을 확인"],["mismatch","다른 장소 사진"]];
  const matchSelect='<select class="field" data-cand-field="placeMatch" data-cand-id="'+esc(c.id)+'">'+matchOptions.map(o=>'<option value="'+o[0]+'" '+(c.placeMatch===o[0]?'selected':'')+'>'+o[1]+'</option>').join("")+'</select>';
  const viewSelect='<select class="field" data-cand-field="viewType" data-cand-id="'+esc(c.id)+'">'+viewOptions.map(o=>'<option '+(c.viewType===o?'selected':'')+'>'+o+'</option>').join("")+'</select>';
  return '<article class="candidate"><div class="candidategrid">'+imageMarkup+'<div><div class="candidate-heading"><h4>'+esc(c.title||"장소 사진 후보")+'</h4>'+badge+'</div><p class="candidate-location-state">'+(c.placeMatch==="confirmed"?"장소 일치 확인됨":c.placeMatch==="mismatch"?"다른 장소 사진으로 표시됨":"실제 장소와 일치하는지 확인 필요")+'</p><p class="tiny">'+(c.viewType?esc(c.viewType)+" · ":"")+(c.sourceName?esc(c.sourceName)+" · ":"")+(c.license?esc(c.license)+" · ":"")+(c.localFileName?"기기 사진 파일: "+esc(c.localFileName):c.assetPath?"저장된 이미지 파일":c.imageUrl?"사진 URL 등록됨":"이미지 주소 확인 필요")+'</p>'+(c.notes?'<p>'+esc(c.notes)+'</p>':'')+(c.sourcePageUrl?'<p><a target="_blank" rel="noopener noreferrer" href="'+esc(c.sourcePageUrl)+'">사진 원문 열기 ↗</a></p>':'')+
   '<details class="candidateReview"><summary>사진 정보 수정</summary><div class="candidateform"><label>사진 설명<input class="field" data-cand-field="title" data-cand-id="'+esc(c.id)+'" value="'+esc(c.title||"")+'" placeholder="사진 설명"></label><label>사진 구도'+viewSelect+'</label><label>실제 장소 일치'+matchSelect+'</label><label class="wide">사진 원문 링크<input class="field" data-cand-field="sourcePageUrl" data-cand-id="'+esc(c.id)+'" value="'+esc(c.sourcePageUrl||"")+'" placeholder="https://..."></label><label class="wide">메모<textarea class="field" data-cand-field="notes" data-cand-id="'+esc(c.id)+'" rows="2">'+esc(c.notes||"")+'</textarea></label></div></details>'+
   '<div class="toolbar photo-actions">'+(chosen?'<span class="chip selected-photo">현재 대표사진</span>':'<button class="btn small primary" data-cand-action="select" data-cand-id="'+esc(c.id)+'">대표사진으로 사용</button>')+'<button class="btn small" data-cand-action="edit-url" data-cand-id="'+esc(c.id)+'">이미지 주소 변경</button><button class="btn small" data-cand-action="replace-file" data-cand-id="'+esc(c.id)+'">파일로 교체</button><button class="btn small danger-quiet" data-cand-action="delete" data-cand-id="'+esc(c.id)+'">사진 삭제</button></div></div></div></article>';
 }).join("");
}
function savePlace(id){
 const p=getPlace(id);if(!p)return;
 const name=$("f_name").value.trim();if(!name){alert("장소 이름을 입력하세요.");return;}
 p.name=name;p.region=$("f_region").value;p.category=$("f_category").value.trim();p.aliases=$("f_aliases").value.split(",").map(x=>x.trim()).filter(Boolean);p.address=$("f_address").value.trim();p.phone=$("f_phone").value.trim();p.officialUrl=$("f_official").value.trim();p.openingStatus=$("f_open").value;p.shootingPermission=$("f_permission").value;p.summary=$("f_summary").value.trim();p.updatedAt=stamp();localSave("장소정보 임시저장 완료");render();
}
function saveCreativeFields(id){
 const p=getPlace(id);if(!p)return;
 p.photoProfile=$("f_photoProfile").value.trim();
 p.spaceTypes=$("f_spaceTypes").value.split(",").map(x=>x.trim()).filter(Boolean);
 p.visualStrengths=$("f_visualStrengths").value.split(",").map(x=>x.trim()).filter(Boolean);
 p.bestConcepts=$("f_bestConcepts").value.split(",").map(x=>x.trim()).filter(Boolean);
 p.constraints=$("f_constraints").value.split(",").map(x=>x.trim()).filter(Boolean);
 const score=Number($("f_photoPotentialScore").value);p.photoPotentialScore=Number.isFinite(score)?Math.max(0,Math.min(100,score)):0;
 p.scoutPriority=[1,2,3].includes(Number($("f_scoutPriority").value))?Number($("f_scoutPriority").value):3;
 p.mapSearchQuery=$("f_mapSearchQuery").value.trim();
 p.sourceRefs=$("f_sourceRefs").value.split(",").map(x=>x.trim()).filter(Boolean);
 p.notes=$("f_placeNotes").value.trim();p.scoreStatus="사용자 기획 평가 · 현장 확인 전";
 p.searchTerms=[...new Set([p.name,p.region,p.category,p.mapSearchQuery,...(p.aliases||[]),...(p.spaceTypes||[]),...(p.visualStrengths||[]),...(p.bestConcepts||[])].filter(Boolean))];
 p.updatedAt=stamp();localSave("촬영 기획·분류 정보를 이 기기에 저장했습니다");render();renderLanding();
}
function saveVerification(id){
 const p=getPlace(id);if(!p)return;p.verification=p.verification||{};p.verification.location=$("v_location").value;p.verification.photoMatch=$("v_photo").value;p.verification.shootingPermission=$("v_permission").value;p.verification.lastCheckedAt=stamp().slice(0,10);p.updatedAt=stamp();localSave("장소 확인 상태를 임시저장했습니다");render();renderLanding();
}
function pendingKey(placeId,candidateId){return placeId+"::"+candidateId;}
function openPendingPhotoDb(){
 return new Promise((resolve,reject)=>{
  if(!("indexedDB" in window)){reject(new Error("이 브라우저는 사진 파일 임시보관을 지원하지 않습니다."));return;}
  const req=indexedDB.open(PENDING_DB,1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("photos"))db.createObjectStore("photos");};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error("사진 보관소 열기 실패"));
 });
}
async function putPendingPhoto(key,file){
 const db=await openPendingPhotoDb();
 return new Promise((resolve,reject)=>{const tx=db.transaction("photos","readwrite");tx.objectStore("photos").put({blob:file,name:file.name,type:file.type,size:file.size,savedAt:stamp()},key);tx.oncomplete=()=>{db.close();resolve(true);};tx.onerror=()=>{db.close();reject(tx.error||new Error("사진 파일 임시보관 실패"));};});
}
async function getPendingPhoto(key){
 const db=await openPendingPhotoDb();
 return new Promise((resolve,reject)=>{const tx=db.transaction("photos","readonly");const req=tx.objectStore("photos").get(key);req.onsuccess=()=>{const value=req.result||null;db.close();resolve(value);};req.onerror=()=>{db.close();reject(req.error||new Error("사진 파일 읽기 실패"));};});
}
async function deletePendingPhoto(key){
 const db=await openPendingPhotoDb();
 return new Promise((resolve,reject)=>{const tx=db.transaction("photos","readwrite");tx.objectStore("photos").delete(key);tx.oncomplete=()=>{db.close();resolve(true);};tx.onerror=()=>{db.close();reject(tx.error||new Error("사진 파일 삭제 실패"));};});
}
async function hydratePendingPreviews(p){
 const isCurrent=p.id===selectedId;
 const candidateList=isCurrent?$("candidateList"):null;
 const detail=isCurrent?$("detail"):null;
 const placeList=$("placeList"),homeView=$("homeView");
 for(const c of (p.imageCandidates||[])){
  if(!c.pendingAsset)continue;
  try{
   const item=await getPendingPhoto(pendingKey(p.id,c.id));if(!item||!item.blob)continue;
   let u=objectUrls.get(c.id);if(!u){u=URL.createObjectURL(item.blob);objectUrls.set(c.id,u);}
   const img=candidateList?candidateList.querySelector('[data-local-preview="'+CSS.escape(c.id)+'"]'):null;
   if(img){img.src=u;img.style.objectFit="contain";}
   const primary=detail?detail.querySelector('[data-primary-preview="'+CSS.escape(c.id)+'"]'):null;if(primary)primary.src=u;
   const reference=detail?detail.querySelector('[data-reference-preview="'+CSS.escape(c.id)+'"]'):null;if(reference)reference.src=u;
   const listThumb=placeList?placeList.querySelector('[data-place-preview="'+CSS.escape(p.id)+'"]'):null;
   if(listThumb&&(p.primaryImageId===c.id||p.referenceImageId===c.id))listThumb.src=u;
   const homeThumb=homeView?homeView.querySelector('[data-home-preview="'+CSS.escape(p.id)+'"]'):null;
   if(homeThumb&&(p.primaryImageId===c.id||p.referenceImageId===c.id))homeThumb.src=u;
   const hero=$("landingHeroImage");
   if(hero&&(p.id==="seo-ddp"||p.id==="seo-oil-tank")&&(p.primaryImageId===c.id||p.referenceImageId===c.id))hero.src=u;
  }catch(_){}
 }
}
async function addCandidate(placeId,record){
 const p=getPlace(placeId);if(!p)return;let c=record,file=null;
 if(!c){
  const imageUrl=$("c_image").value.trim(),sourcePageUrl=$("c_page").value.trim();
  file=$("c_file").files&&$("c_file").files[0]||null;
  if(!imageUrl&&!file){alert("이미지 주소를 입력하거나 사진 파일을 선택하세요.");return;}
  if(file&&file.size>8*1024*1024){alert("사진 파일은 8MB 이하로 선택하세요.");return;}
  if(imageUrl){try{const u=new URL(imageUrl);if(!["http:","https:"].includes(u.protocol))throw new Error("URL");}catch(_){alert("http:// 또는 https:// 형식의 이미지 주소를 입력하세요.");return;}}
  if(sourcePageUrl){try{const u=new URL(sourcePageUrl);if(!["http:","https:"].includes(u.protocol))throw new Error("URL");}catch(_){alert("사진 원문 링크는 http:// 또는 https:// 형식으로 입력하세요.");return;}}
  c={id:"img-"+Math.random().toString(36).slice(2,10),imageUrl,sourcePageUrl,sourceName:"",creator:"",rights:"unknown",rightsLabel:"",licenseUrl:"",placeMatch:$("c_match").value,viewType:$("c_view").value,notes:$("c_notes").value.trim(),status:"candidate",createdAt:stamp(),title:$("c_title").value.trim()||"장소 사진 후보",pendingAsset:!!file};
 }
 if(!Array.isArray(p.imageCandidates))p.imageCandidates=[];
 if(p.imageCandidates.some(x=>c.imageUrl&&x.imageUrl===c.imageUrl)){alert("같은 이미지 주소가 이미 등록돼 있습니다.");return;}
 if(file){
  try{await putPendingPhoto(pendingKey(p.id,c.id),file);}catch(e){alert("사진 파일 임시저장 실패: "+e.message);return;}
  c.pendingAsset=true;c.localFileName=file.name;c.localFileSize=file.size;
 }
 p.imageCandidates.unshift(c);p.photoSelectionCleared=false;p.imageStatus="사진 후보 추가";p.updatedAt=stamp();
 if(!p.referenceImageId||!referenceImage(p))p.referenceImageId=c.id;
 $("c_image").value="";$("c_page").value="";$("c_title").value="";$("c_notes").value="";if($("c_file"))$("c_file").value="";
 localSave(file?"사진 후보와 로컬 파일을 이 기기에 임시저장했습니다":"사진 후보를 이 기기에 저장했습니다");render();renderLanding();
}
async function candidateAction(placeId,cid,action){
 const p=getPlace(placeId),c=(p&&p.imageCandidates||[]).find(x=>x.id===cid);if(!p||!c)return;
 if(action==="select"||action==="reference"){
  if(c.status==="rejected"||!(c.imageUrl||c.sourceThumbnail||c.pendingAsset||c.assetPath)){alert("표시할 수 있는 이미지가 있는 후보만 대표사진으로 지정할 수 있습니다.");return;}
  if(p.primaryImageId&&p.primaryImageId!==cid){const previous=p.imageCandidates.find(x=>x.id===p.primaryImageId);if(previous&&previous.status==="selected")previous.status="candidate";}
  p.primaryImageId=c.id;p.referenceImageId=c.id;p.photoSelectionCleared=false;c.status="selected";p.imageStatus="대표사진 선택됨";p.updatedAt=stamp();
  localSave("대표사진을 변경했습니다");render();renderLanding();return;
 }
 if(action==="edit-url"){
  const value=prompt("이 사진의 이미지 주소를 입력하세요.",c.imageUrl||"");
  if(value===null)return;
  clearObjectUrl(c.id);
  const url=value.trim();
  if(!/^https?:\/\//i.test(url)){alert("http:// 또는 https://로 시작하는 이미지 주소를 입력하세요.");return;}
  if(c.assetPath){catalog.deletedAssetPaths=Array.from(new Set([...(catalog.deletedAssetPaths||[]),c.assetPath]));c.assetPath=null;}
  if(c.pendingAsset){try{await deletePendingPhoto(pendingKey(p.id,c.id));}catch(_){}c.pendingAsset=false;}
  c.imageUrl=url;c.sourceThumbnail="";c.localFileName="";c.updatedAt=stamp();p.updatedAt=stamp();
  localSave("이미지 주소를 변경했습니다");render();renderLanding();return;
 }
 if(action==="replace-file"){
  const picker=document.createElement("input");picker.type="file";picker.accept="image/jpeg,image/png,image/webp,image/avif";
  picker.addEventListener("change",async()=>{
   const file=picker.files&&picker.files[0];if(!file)return;
   if(file.size>8*1024*1024){alert("사진 파일은 8MB 이하로 선택하세요.");return;}
   try{
    clearObjectUrl(c.id);
    await putPendingPhoto(pendingKey(p.id,c.id),file);
    if(c.assetPath)catalog.deletedAssetPaths=Array.from(new Set([...(catalog.deletedAssetPaths||[]),c.assetPath]));
    c.assetPath=null;c.pendingAsset=true;c.localFileName=file.name;c.localFileSize=file.size;c.imageUrl="";c.sourceThumbnail="";c.updatedAt=stamp();
    p.primaryImageId=c.id;p.referenceImageId=c.id;p.photoSelectionCleared=false;p.imageStatus="대표사진 변경됨";p.updatedAt=stamp();
    localSave("사진 파일로 교체했습니다 · 이 기기에 임시저장");render();renderLanding();
   }catch(e){alert("사진 파일 저장에 실패했습니다: "+e.message);}
  });
  picker.click();return;
 }
 if(action==="delete"){
  if(!confirm("이 사진을 이 장소의 후보 목록에서 삭제할까요?"))return;
  clearObjectUrl(c.id);
  if(c.assetPath)catalog.deletedAssetPaths=Array.from(new Set([...(catalog.deletedAssetPaths||[]),c.assetPath]));
  try{await deletePendingPhoto(pendingKey(p.id,c.id));}catch(_){}
  p.imageCandidates=p.imageCandidates.filter(x=>x.id!==cid);
  if(p.primaryImageId===cid)p.primaryImageId=null;
  if(p.referenceImageId===cid)p.referenceImageId=null;
  const any=p.imageCandidates.some(x=>x.status!=="rejected"&&(x.imageUrl||x.sourceThumbnail||x.pendingAsset||x.assetPath));
  p.photoSelectionCleared=!any;
  if(!any){p.referenceImageStatus="사진 없음";p.imageStatus="사진 없음";}
  else if(!p.referenceImageId){const next=referenceImage(p);p.referenceImageId=next?next.id:null;}
  p.updatedAt=stamp();localSave("사진을 삭제했습니다");render();renderLanding();return;
 }
}
function deletePlace(id){if(!confirm("이 장소와 사진 후보 기록을 이 기기의 카탈로그에서 삭제할까요? 배포된 원본 자료는 바뀌지 않습니다."))return;catalog.places=catalog.places.filter(p=>p.id!==id);selectedId=catalog.places[0]?.id||null;localSave("장소 삭제를 이 기기에 임시저장");render();}
function addNewPlace(){
 let id="new-place-"+Date.now().toString(36);
 while(catalog.places.some(p=>p.id===id))id="new-place-"+(Date.now()+Math.floor(Math.random()*10000)).toString(36);
 const name="새 촬영 장소 (이름 입력)";
 const p={
  id,name,region:"서울",category:"",aliases:[],address:"",phone:"",coordinates:null,
  officialUrl:"",mapSearchQuery:"",summary:"",
  spaceTypes:["실내","실외"],photoProfile:"장소의 조형성·빛·배경 재료와 사진가 관점의 촬영 활용 가능성을 입력하세요.",
  visualStrengths:["시각적 강점 입력"],bestConcepts:["추천 촬영 콘셉트 입력"],
  constraints:["운영·출입 조건 확인 필요","상업촬영 허가·장비 반입 확인 필요"],
  scoutPriority:3,photoPotentialScore:0,scoreStatus:"사용자 신규 등록 · 검증 전",
  searchTerms:[name+" 서울 사진 촬영 장소"],openingStatus:"미확인",
  shootingPermission:"미확인",parking:"미확인",fee:"미확인",imageStatus:"대표사진 미등록",
  primaryImageId:null,referenceImageId:null,imageCandidates:[],sourceRefs:[],
  verification:{location:"미확인",photoMatch:"미확인",rights:"미확인",shootingPermission:"미확인",lastCheckedAt:null},
  notes:"새로 등록한 장소입니다. 실제 장소·사진·운영 정보·촬영 허가를 확인하고 근거 출처를 기록하세요.",
  createdAt:stamp(),updatedAt:stamp()
 };
 catalog.places.unshift(p);selectedId=id;archiveMode="all";
 if($("query"))$("query").value="";if($("regionFilter"))$("regionFilter").value="";if($("imageFilter"))$("imageFilter").value="";
 localSave("신규 장소 입력 양식을 열었습니다 · 아직 이 기기에 임시저장 상태입니다");
 showAppView("detail");
 render();
 const nameField=$("f_name");
 if(nameField){nameField.focus();nameField.select();nameField.scrollIntoView({behavior:"smooth",block:"center"});}
}
async function searchOpenverse(p){
 const status=$("autoSearchStatus"),host=$("autoResults");status.classList.remove("hidden");status.textContent="Openverse에서 장소 사진 후보를 검색 중…";host.innerHTML="";
 try{
  const mode=$("photoSearchMode")?.value||"place";const query=photoQuery(p,mode);const url="https://api.openverse.org/v1/images/?q="+encodeURIComponent(query)+"&page_size=12";
  const r=await fetch(url);if(!r.ok)throw new Error("HTTP "+r.status);
  const data=await r.json();const items=data.results||[];searchCache=items.map(x=>({provider:"Openverse",x}));
  if(!items.length){status.textContent="검색 결과가 없습니다. Google·Bing·네이버·다음·공식 출처 검색도 확인하세요.";return;}
  status.textContent=items.length+"개 후보를 찾았습니다. 자동 결과에는 다른 장소가 포함될 수 있습니다. 장소와 라이선스 근거를 확인한 뒤 후보 저장을 누르세요.";
  host.innerHTML=items.map((x,i)=>renderAutoCard({
   idx:i,title:x.title||"제목 없음",thumb:x.thumbnail||x.url,source:x.source||x.provider||"Openverse",
   creator:x.creator||"미확인",imageUrl:x.url||"",pageUrl:x.foreign_landing_url||x.detail_url||"",license:x.license||"unknown",
   licenseUrl:x.license_url||"",attribution:x.attribution||"",provider:"Openverse"
  })).join("");attachAutoButtons(host,items,"openverse",p);
 }catch(e){status.textContent="Openverse 검색 실패: "+e.message+" · 아래 Google·네이버·Bing 이미지 검색 링크로 계속 검색할 수 있습니다.";}
}
async function searchCommons(p){
 const status=$("autoSearchStatus"),host=$("autoResults");status.classList.remove("hidden");status.textContent="Wikimedia Commons 검색 중…";host.innerHTML="";
 try{
  const mode=$("photoSearchMode")?.value||"place";const query=photoQuery(p,mode);const url="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(query)+"&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=480&format=json&origin=*";
  const r=await fetch(url);if(!r.ok)throw new Error("HTTP "+r.status);
  const data=await r.json();const pages=Object.values((data.query&&data.query.pages)||{});
  const items=pages.map(x=>{const info=(x.imageinfo||[])[0]||{},m=info.extmetadata||{};const val=k=>(m[k]&&m[k].value)||"";return{title:x.title,thumb:info.thumburl||info.url,imageUrl:info.url||"",pageUrl:info.descriptionurl||("https://commons.wikimedia.org/wiki/"+encodeURIComponent(x.title.replace(/^File:/,"File:"))),creator:stripHtml(val("Artist")||val("Credit")),license:stripHtml(val("LicenseShortName"))||"unknown",licenseUrl:val("LicenseUrl"),provider:"Wikimedia Commons",attribution:stripHtml(val("Attribution"))};});
  searchCache=items.map(x=>({provider:"Wikimedia Commons",x}));
  if(!items.length){status.textContent="검색 결과가 없습니다. 다른 검색원 링크로 계속 검색하세요.";return;}
  status.textContent=items.length+"개 후보를 찾았습니다. 장소 일치 여부와 라이선스 상세를 반드시 확인하세요.";
  host.innerHTML=items.map((x,i)=>renderAutoCard({idx:i,title:x.title,thumb:x.thumb,source:"Wikimedia Commons",creator:x.creator,imageUrl:x.imageUrl,pageUrl:x.pageUrl,license:x.license,licenseUrl:x.licenseUrl,attribution:x.attribution,provider:x.provider})).join("");attachAutoButtons(host,items,"commons",p);
 }catch(e){status.textContent="Wikimedia Commons 검색 실패: "+e.message+" · 웹 검색 링크는 계속 사용할 수 있습니다.";}
}
function stripHtml(s){const d=document.createElement("div");d.innerHTML=String(s||"");return d.textContent||d.innerText||"";}
function renderAutoCard(x){
 return '<article class="result"><img loading="lazy" referrerpolicy="no-referrer" src="'+esc(x.thumb||"")+'" alt=""><div class="rtitle">'+esc(x.title)+'</div><div class="rmeta">'+esc(x.source)+'<br>사진 후보 · 실제 장소와 일치하는지 확인하세요.</div><p><a target="_blank" rel="noopener noreferrer" href="'+esc(x.pageUrl||"#")+'">사진 원문 열기 ↗</a></p><div class="toolbar"><button class="btn small" data-auto-save="'+x.idx+'">후보 저장</button><button class="btn small primary" data-auto-download="'+x.idx+'">파일까지 저장</button></div></article>';
}
function autoCandidateFrom(x,provider){
 let rights="unknown",label=x.license||"미확인";
 const lic=String(x.license||"").toLowerCase().replace(/[\s_]+/g,"").replace(/^cc-/,"cc");
 const url=String(x.licenseUrl||x.license_url||"").toLowerCase();
 const hasNC=lic.includes("by-nc")||lic.includes("ccby-nc")||lic.includes("noncommercial")||url.includes("/by-nc/");
 const hasND=lic.includes("by-nd")||lic.includes("ccby-nd")||lic.includes("noderivatives")||url.includes("/by-nd/");
 if(lic.includes("cc0")||lic==="zero")rights="cc0";
 else if(lic.includes("publicdomain")||lic==="pdm")rights="public-domain";
 else if(!hasNC&&!hasND&&(lic.includes("by-sa")||lic.includes("ccby-sa")||url.includes("/licenses/by-sa/")))rights="cc-by-sa";
 else if(!hasNC&&!hasND&&(lic==="by"||lic==="ccby"||/^ccby[0-9.]+$/.test(lic)||lic.includes("creativecommons.org/licenses/by/")||url.includes("/licenses/by/")))rights="cc-by";
 return {id:"img-"+Math.random().toString(36).slice(2,10),title:x.title||"검색 후보",imageUrl:x.imageUrl||x.url||"",sourceThumbnail:x.thumbnail||x.thumb||"",sourcePageUrl:x.pageUrl||x.foreign_landing_url||x.detail_url||"",sourceName:provider==="commons"?"Wikimedia Commons":"Openverse",creator:x.creator||"미확인",rights,rightsLabel:label,licenseUrl:x.licenseUrl||x.license_url||"",placeMatch:"unverified",viewType:"미확인",notes:"자동 검색 후보. 실제 장소 일치·라이선스 문구·공개 사용 가능 여부를 다시 확인하세요. "+(x.attribution||""),status:"candidate",createdAt:stamp()};
}
function attachAutoButtons(host,items,provider,p){
 host.querySelectorAll("[data-auto-save]").forEach(btn=>btn.addEventListener("click",()=>{
  const x=items[Number(btn.dataset.autoSave)],candidate=autoCandidateFrom(x,provider);
  if(!candidate.imageUrl){alert("원본 이미지 주소가 없어 후보 등록할 수 없습니다.");return;}
  addCandidate(p.id,candidate);
  alert("사진 후보를 저장했습니다. 실제 장소와 일치하는지 확인한 뒤 대표사진으로 선택할 수 있습니다.");
 }));
 host.querySelectorAll("[data-auto-download]").forEach(btn=>btn.addEventListener("click",async()=>{
  const x=items[Number(btn.dataset.autoDownload)],candidate=autoCandidateFrom(x,provider);
  if(!candidate.imageUrl){alert("원본 이미지 주소가 없어 파일을 받을 수 없습니다.");return;}
  if((p.imageCandidates||[]).some(c=>c.imageUrl===candidate.imageUrl)){alert("같은 이미지 URL이 이미 등록돼 있습니다.");return;}
  btn.disabled=true;const oldText=btn.textContent;btn.textContent="파일 가져오는 중…";
  try{
   const response=await fetch(candidate.imageUrl,{mode:"cors",cache:"no-store"});
   if(!response.ok)throw new Error("원본 이미지 응답 HTTP "+response.status);
   const raw=await response.blob();let mime=(raw.type||response.headers.get("content-type")||"").split(";")[0].toLowerCase();if(mime==="image/pjpeg"||mime==="image/jpg")mime="image/jpeg";const blob=new Blob([raw],{type:mime});
   if(!["image/jpeg","image/png","image/webp","image/avif"].includes(mime))throw new Error("이 원본은 지원하지 않는 이미지 형식입니다: "+(mime||"형식 미확인"));
   if(blob.size>8*1024*1024)throw new Error("이미지가 8MB를 초과합니다. 원본 이미지를 내려받은 뒤 크기를 줄여 직접 등록하세요.");
   await putPendingPhoto(pendingKey(p.id,candidate.id),blob);
   candidate.pendingAsset=true;
   candidate.localFileName=(candidate.title||"photo").slice(0,45)+"."+({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"}[mime]);
   candidate.localFileSize=blob.size;
   addCandidate(p.id,candidate);
   alert("이미지 파일을 이 기기에 저장하고 사진 후보로 등록했습니다. 장소 일치·사진 일치 여부를 확인한 뒤 승인하세요.");
  }catch(e){
   alert("브라우저가 원본 이미지 파일을 가져오지 못했습니다. 외부 사이트의 접근 제한(CORS)일 수 있습니다.\n\n"+e.message+"\n\n원본 페이지를 열고 사진 파일을 기기에 저장한 뒤 '사진 후보 직접 등록'의 파일 선택을 이용하세요.");
  }finally{btn.disabled=false;btn.textContent=oldText;}
 }));
}
async function batchSearch(scope){
 const status=$("batchStatus"),buttons=[$("batchSearchA"),$("batchSearchAll")];
 const targets=catalog.places.filter(p=>scope==="all"||p.scoutPriority===1).sort((a,b)=>(a.scoutPriority||9)-(b.scoutPriority||9)||a.name.localeCompare(b.name,"ko"));
 if(!targets.length){alert("검색 대상 장소가 없습니다.");return;}
 if(scope==="all"&&!confirm("서울·수도권 "+targets.length+"곳을 대상으로 Openverse와 Wikimedia Commons 검색을 실행합니다. 네트워크 상태에 따라 시간이 걸릴 수 있습니다. 계속할까요?"))return;
 buttons.forEach(b=>b.disabled=true);status.classList.remove("hidden");
 let found=0,duplicates=0,failures=0,requests=0;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const modesFor=p=>scope==="all"?["place"]:["place","architecture",((p.spaceTypes||[]).some(x=>String(x).includes("실내"))?"interior":"outdoor"),"fashion"];
 const modeLabel={place:"장소·현장 전경",architecture:"건축·기하학",interior:"실내·자연광",outdoor:"야외·인물 배경",fashion:"패션·인물 에디토리얼"};
 try{
  for(let i=0;i<targets.length;i++){
   const p=targets[i],modes=modesFor(p);
   for(let mi=0;mi<modes.length;mi++){
    const mode=modes[mi],query=photoQuery(p,mode);
    status.textContent="사진 후보 다중검색 "+(i+1)+"/"+targets.length+" · "+p.name+" · "+modeLabel[mode]+" ("+(mi+1)+"/"+modes.length+") · 후보 "+found+"개 · 오류 "+failures+"건";
    const tasks=[
     {provider:"openverse",url:"https://api.openverse.org/v1/images/?q="+encodeURIComponent(query)+"&page_size=8"},
     {provider:"commons",url:"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(query)+"&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=480&format=json&origin=*"}
    ];
    for(const task of tasks){
     requests++;
     try{
      const r=await fetch(task.url,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);
      const data=await r.json();let rawItems=[];
      if(task.provider==="openverse"){
       rawItems=(data.results||[]).map(x=>({title:x.title||"제목 없음",url:x.url||"",foreign_landing_url:x.foreign_landing_url||x.detail_url||"",license:x.license||"unknown",license_url:x.license_url||"",creator:x.creator||"미확인",attribution:x.attribution||"",thumbnail:x.thumbnail||""}));
      }else{
       rawItems=Object.values((data.query&&data.query.pages)||{}).map(x=>{
        const info=(x.imageinfo||[])[0]||{},m=info.extmetadata||{},val=k=>(m[k]&&m[k].value)||"";
        return {title:x.title||"제목 없음",url:info.url||"",foreign_landing_url:info.descriptionurl||"",license:stripHtml(val("LicenseShortName"))||"unknown",license_url:val("LicenseUrl"),creator:stripHtml(val("Artist")||val("Credit"))||"미확인",attribution:stripHtml(val("Attribution"))||"",thumbnail:info.thumburl||info.url||""};
       });
      }
      for(const item of rawItems){
       if(!item.url)continue;
       if((p.imageCandidates||[]).some(c=>c.imageUrl===item.url)){duplicates++;continue;}
       const candidate=autoCandidateFrom(item,task.provider);
       candidate.title=item.title||"검색 후보";candidate.sourceName=task.provider==="commons"?"Wikimedia Commons":"Openverse";
       candidate.sourceThumbnail=item.thumbnail||"";candidate.searchMode=mode;
       candidate.status="candidate";candidate.placeMatch="unverified";candidate.viewType="미확인";
       candidate.notes="사진가 관점 자동검색 후보 · 검색 방향: "+modeLabel[mode]+". "+(item.attribution||"")+" 실제 장소 일치·라이선스·원본 해상도를 개별 확인해야 합니다.";
       p.imageCandidates=p.imageCandidates||[];p.imageCandidates.push(candidate);found++;
      }
      p.updatedAt=stamp();
     }catch(e){failures++;}
     status.textContent="사진 후보 다중검색 "+(i+1)+"/"+targets.length+" · "+p.name+" · "+modeLabel[mode]+" · 후보 "+found+"개 · 중복 "+duplicates+"건 · 오류 "+failures+"건";
     await wait(400);
    }
   }
   catalog.updatedAt=stamp();localSave("사진 후보 일괄검색 진행 중");
   render();
  }
  localSave("사진 후보 일괄검색 완료");
  status.textContent="다중검색 완료 · 대상 "+targets.length+"곳 · 신규 후보 "+found+"개 · 중복 제외 "+duplicates+"개 · 요청 "+requests+"회 중 오류 "+failures+"회. A급은 장소·건축·실내/야외·패션 방향으로 검색했습니다. 후보는 자동 승인되지 않았습니다.";
  render();
 }catch(e){
  status.textContent="사진 후보 다중검색이 중단되었습니다: "+e.message+" · 지금까지 수집된 후보는 이 기기에 저장되어 있습니다.";
  localSave("사진 후보 다중검색 중단 · 중간 결과 저장");render();
 }finally{buttons.forEach(b=>b.disabled=false);}
}
function exportCatalog(){
 const blob=new Blob([JSON.stringify(catalog,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="frame-atlas-v2-catalog-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 $("saveStatus").textContent="카탈로그 JSON 내보내기 완료";
}
function importCatalog(file){
 const reader=new FileReader();reader.onload=()=>{try{catalog=normalizeCatalog(JSON.parse(reader.result));selectedId=catalog.places[0]?.id||null;localSave("가져온 카탈로그를 이 기기에 임시저장");render();alert("가져오기 완료. 장소 "+catalog.places.length+"곳");}catch(e){alert("가져오기 실패: "+e.message);}};reader.readAsText(file,"utf-8");
}
$("addPlaceBtn").addEventListener("click",addNewPlace);
$("batchSearchA").addEventListener("click",()=>batchSearch("A"));
$("batchSearchAll").addEventListener("click",()=>batchSearch("all"));
$("nextUnphotographedBtn").addEventListener("click",()=>{
 const start=catalog.places.findIndex(p=>p.id===selectedId);
 for(let n=1;n<=catalog.places.length;n++){
  const p=catalog.places[(start+n+catalog.places.length)%catalog.places.length];
  if(!isImageReady(p)){selectedId=p.id;$("imageFilter").value="";render();return;}
 }
 alert("모든 장소에 대표사진 후보가 확정되어 있습니다.");
});
$("exportBtn").addEventListener("click",exportCatalog);
$("importInput").addEventListener("change",e=>{if(e.target.files&&e.target.files[0])importCatalog(e.target.files[0]);e.target.value="";});
$("reloadBtn").addEventListener("click",async()=>{if(!confirm("이 기기에 저장된 임시 수정사항을 버리고 배포된 기본자료를 다시 읽을까요? 먼저 JSON을 내보내 백업하는 것이 안전합니다."))return;localStorage.removeItem(LOCAL_KEY);await loadBase();});
$("publishBtn").addEventListener("click",()=>{$("publishStatus").classList.add("hidden");$("publishStatus").textContent="";$("publishToken").value="";$("publishDialog").showModal();});
$("cancelPublishBtn").addEventListener("click",()=>{$("publishToken").value="";$("publishDialog").close();});
$("confirmPublishBtn").addEventListener("click",publishCatalog);
async function publishCatalog(){
 const token=$("publishToken").value.trim(),status=$("publishStatus"),btn=$("confirmPublishBtn");
 if(!token){alert("GitHub 토큰을 입력하세요.");return;}
 status.classList.remove("hidden");status.textContent="선택한 사진 파일과 장소 카탈로그를 게시할 준비 중…";btn.disabled=true;
 try{
  const repo="https://api.github.com/repos/casio8000/FRAME_ATLAS/contents/";
  const headers={"Accept":"application/vnd.github+json","Authorization":"Bearer "+token,"X-GitHub-Api-Version":"2022-11-28"};
  const catalogPath="v2/data/places.json";
  const before=await fetch(repo+catalogPath+"?ref=main",{headers,cache:"no-store"});
  if(!before.ok)throw new Error("현재 카탈로그 확인 실패 (HTTP "+before.status+"). 토큰 권한과 브랜치를 확인하세요.");
  const currentCatalog=await before.json();
  const staged=[];
  for(const p of catalog.places){
   for(const c of (p.imageCandidates||[])){
    if(!c.pendingAsset||c.assetPath||!(c.id===p.primaryImageId||c.id===p.referenceImageId||c.status==="approved"))continue;
    const key=pendingKey(p.id,c.id),photo=await getPendingPhoto(key);
    if(!photo||!photo.blob)throw new Error("선택한 사진 파일을 찾지 못했습니다: "+p.name+" / "+(c.title||c.id)+" · 이 기기에서 파일을 다시 선택하세요.");
    const mime=photo.type||photo.blob.type||"image/jpeg";
    const extByMime={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"};
    const ext=extByMime[mime];if(!ext)throw new Error("지원하지 않는 이미지 형식입니다: "+mime);
    const path="v2/assets/places/"+p.id+"/"+c.id+"."+ext;
    const encodedPath=path.split("/").map(encodeURIComponent).join("/");
    let existingSha=null;
    const ex=await fetch(repo+encodedPath+"?ref=main",{headers,cache:"no-store"});
    if(ex.ok){const exj=await ex.json();existingSha=exj.sha;}
    else if(ex.status!==404)throw new Error("사진 파일 경로 확인 실패 (HTTP "+ex.status+"): "+p.name);
    const bytes=new Uint8Array(await photo.blob.arrayBuffer());let binary="";for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
    const payload={message:"Add FRAME ATLAS location photo",content:btoa(binary),branch:"main"};
    if(existingSha)payload.sha=existingSha;
    const up=await fetch(repo+encodedPath,{method:"PUT",headers:Object.assign({"Content-Type":"application/json"},headers),body:JSON.stringify(payload)});
    const upj=await up.json();
    if(!up.ok)throw new Error("사진 파일 업로드 실패 (HTTP "+up.status+"): "+String(upj.message||p.name));
    c.originalImageUrl=c.originalImageUrl||c.imageUrl||"";
    // If replacing a repository image with the same path/extension, do not delete the newly uploaded file later.
    catalog.deletedAssetPaths=(catalog.deletedAssetPaths||[]).filter(oldPath=>oldPath!==path);
    c.assetPath=path;c.imageUrl="./assets/places/"+p.id+"/"+c.id+"."+ext;c.pendingAsset=false;c.assetStoredAt=stamp();
    staged.push(key);p.imageStatus=(p.primaryImageId===c.id?"대표사진 선택됨":"사진 파일 저장됨");p.updatedAt=stamp();
    localSave("선택 사진 파일 업로드 완료 · 카탈로그 게시 준비 중");
    status.textContent="선택한 사진 업로드 중… "+staged.length+"개 완료";
   }
  }
  const publishedCatalog=JSON.parse(JSON.stringify(catalog));
  for(const p of publishedCatalog.places){
   p.imageCandidates=(p.imageCandidates||[]).filter(c=>c.status!=="rejected"&&(!!c.imageUrl||!!c.sourceThumbnail||!!c.assetPath));
   if(!p.imageCandidates.some(c=>c.id===p.primaryImageId)){p.primaryImageId=null;if(!p.imageStatus)p.imageStatus="사진 후보 있음";}
   p.deletedAssetPaths=[];
  }
  const assetPathsToDelete=[...(catalog.deletedAssetPaths||[])];
  publishedCatalog.updatedAt=stamp();
  const bodyText=JSON.stringify(publishedCatalog,null,2),bytes=new TextEncoder().encode(bodyText);
  let binaryText="";for(let i=0;i<bytes.length;i++)binaryText+=String.fromCharCode(bytes[i]);
  const content=btoa(binaryText);
  const put=await fetch(repo+catalogPath,{method:"PUT",headers:Object.assign({"Content-Type":"application/json"},headers),body:JSON.stringify({message:"Publish FRAME ATLAS 2.0 catalog",content,sha:currentCatalog.sha,branch:"main"})});
  const result=await put.json();
  if(!put.ok)throw new Error("카탈로그 저장 실패 (HTTP "+put.status+"): "+String(result.message||"응답 오류"));
  const cleanupFailed=[];
  for(const assetPath of assetPathsToDelete){
   try{
    const encodedPath=assetPath.split("/").map(encodeURIComponent).join("/");
    const existing=await fetch(repo+encodedPath+"?ref=main",{headers,cache:"no-store"});
    if(existing.status===404)continue;
    if(!existing.ok)throw new Error("HTTP "+existing.status);
    const info=await existing.json();
    const del=await fetch(repo+encodedPath,{method:"DELETE",headers:Object.assign({"Content-Type":"application/json"},headers),body:JSON.stringify({message:"Remove deleted FRAME ATLAS location photo",sha:info.sha,branch:"main"})});
    if(!del.ok)throw new Error("HTTP "+del.status);
   }catch(e){cleanupFailed.push(assetPath);}
  }
  for(const key of staged){try{await deletePendingPhoto(key);}catch(_){}}
  catalog.deletedAssetPaths=cleanupFailed;
  localSave("GitHub에 장소 카탈로그와 선택 사진을 게시했습니다");
  render();renderLanding();
  status.classList.remove("hidden");
  status.textContent="게시 완료. 커밋: "+String(result.commit&&result.commit.sha||"성공")+" · 장소 정보와 사진 변경사항을 게시했습니다."+ (cleanupFailed.length?" 다만 오래된 이미지 파일 "+cleanupFailed.length+"개는 삭제 재시도가 필요합니다. 다시 게시하면 재시도됩니다.":"") +" PC와 아이폰에서 같은 카탈로그를 볼 수 있습니다.";
  $("publishToken").value="";btn.textContent="게시 완료";
 }catch(e){status.textContent="게시 실패: "+e.message+" · 토큰은 저장하지 않았습니다.";}
 finally{btn.disabled=false;}
}
$("query").addEventListener("input",render);
$("regionFilter").addEventListener("change",render);
$("imageFilter").addEventListener("change",render);
if($("categoryFilter"))$("categoryFilter").addEventListener("change",render);if($("moodFilter"))$("moodFilter").addEventListener("change",render);
$("brandHomeBtn").addEventListener("click",event=>{event.preventDefault();showAppView("welcome");});
$("welcomeStartBtn").addEventListener("click",()=>showAppView("home"));$("welcomeHomeBtn").addEventListener("click",()=>showAppView("home"));
$("startBrowseBtn").addEventListener("click",()=>goToWorkspace("",""));$("homeMapBtn").addEventListener("click",()=>showAppView("map"));$("seeAllPlacesBtn").addEventListener("click",showHomeAllPlaces);$("homeAllPlacesBtn").addEventListener("click",showHomeAllPlaces);
$("homeSearchBtn").addEventListener("click",()=>goToWorkspace($("homeSearchInput").value.trim(),""));$("homeSearchInput").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();goToWorkspace($("homeSearchInput").value.trim(),"");}});
$("homeView").querySelectorAll("[data-home-region]").forEach(button=>button.addEventListener("click",()=>goToWorkspace("",button.dataset.homeRegion||"")));$("goHomeBtn").addEventListener("click",()=>showAppView("home"));
$("homeAllSearchInput").addEventListener("input",renderLanding);$("homeAllRegionFilter").addEventListener("change",renderLanding);if($("homeAllCategoryFilter"))$("homeAllCategoryFilter").addEventListener("change",renderLanding);if($("homeAllMoodFilter"))$("homeAllMoodFilter").addEventListener("change",renderLanding);
$("mapRegionFilter").addEventListener("change",renderMapScreen);$("mapAccessFilter").addEventListener("change",renderMapScreen);$("photosSearchInput").addEventListener("input",renderPhotosScreen);$("photosMatchFilter").addEventListener("change",renderPhotosScreen);document.querySelectorAll("[data-photo-category]").forEach(button=>button.addEventListener("click",()=>{photoCategoryFilter=button.dataset.photoCategory;document.querySelectorAll("[data-photo-category]").forEach(item=>{const active=item===button;item.classList.toggle("active",active);item.setAttribute("aria-pressed",active?"true":"false");});renderPhotosScreen();}));$("analysisSearchInput").addEventListener("input",renderAnalysisScreen);$("analysisRegionFilter").addEventListener("change",renderAnalysisScreen);
$("appNav").querySelectorAll("[data-nav-view]").forEach(button=>button.addEventListener("click",()=>{const target=button.dataset.navView;if(target==="favorites"){archiveMode="favorites";$("query").value="";$("regionFilter").value="";$("imageFilter").value="";selectedId=null;showAppView("favorites");return;}if(target==="home")archiveMode="all";showAppView(target);}));
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refreshSharedCatalogIfClean();});
window.addEventListener("pageshow",refreshSharedCatalogIfClean);

let deferredInstallPrompt=null;
const installButton=$("installAppBtn"),installDialog=$("installDialog");
function isStandaloneMode(){return (window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)||window.navigator.standalone===true;}
if(isStandaloneMode()&&installButton)installButton.hidden=true;
window.addEventListener("beforeinstallprompt",event=>{
 event.preventDefault();deferredInstallPrompt=event;
 if(installButton){installButton.textContent="앱 설치";installButton.classList.add("install-ready");}
});
window.addEventListener("appinstalled",()=>{if(installButton){installButton.textContent="설치 완료";installButton.disabled=true;}deferredInstallPrompt=null;});
if(installButton)installButton.addEventListener("click",async()=>{
 if(deferredInstallPrompt){
  deferredInstallPrompt.prompt();
  try{const choice=await deferredInstallPrompt.userChoice;if(choice&&choice.outcome==="accepted"){installButton.textContent="설치 완료";installButton.disabled=true;}}catch(_){}
  deferredInstallPrompt=null;
 }else if(installDialog&&typeof installDialog.showModal==="function"){installDialog.showModal();}
});
const mapLinksDialog=$("mapLinksDialog");
if(mapLinksDialog){const closeMapLinksDialogBtn=$("closeMapLinksDialogBtn");if(closeMapLinksDialogBtn)closeMapLinksDialogBtn.addEventListener("click",()=>mapLinksDialog.close());mapLinksDialog.addEventListener("click",event=>{if(event.target===mapLinksDialog)mapLinksDialog.close();});}
const closeInstallDialogBtn=$("closeInstallDialogBtn");
if(closeInstallDialogBtn)closeInstallDialogBtn.addEventListener("click",()=>installDialog.close());
if("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)){
 window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{scope:"./",updateViaCache:"none"})
  .then(registration=>registration.update())
  .catch(error=>console.warn("FRAME ATLAS 오프라인 셸 등록 실패",error)));
}
loadBase();
})();
