/* FRAME ATLAS 3.0 runtime v13.23 · preserves v13.22 data identity merge and fixed-open detail behavior. */
(function(){
 'use strict';
 const win=window;
 const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('ko').replace(/[^0-9a-z가-힣]/g,'');
 const catalog=win.FRAME_ATLAS_DATA||{};
 const existing=[...(catalog.places||[]),...(win.FRAME_ATLAS_ADDITIONS||[])];
 const idOf=p=>String(p&&p.id||'');
 const identityValues=p=>[p&&p.name,p&&p.en,...(Array.isArray(p&&p.aliases)?p.aliases:[])].map(norm).filter(Boolean);
 const mergeAudit=[];
 const mergeUniq=(arr, keyFn)=>{const out=[], seen=new Set();for(const x of (arr||[])){const k=keyFn(x);if(k&&!seen.has(k)){seen.add(k);out.push(x);}}return out;};
 const addArrays=(target,source,field,keyFn)=>{target[field]=mergeUniq([...(Array.isArray(target[field])?target[field]:[]),...(Array.isArray(source[field])?source[field]:[])],keyFn);};
 const lookup=()=>{
   const byToken=new Map();
   for(const p of existing){
     for(const v of identityValues(p)){if(!byToken.has(v))byToken.set(v,p);}
   }
   return byToken;
 };
 const knownIds=new Set(existing.map(idOf).filter(Boolean));
 let byToken=lookup();
 const added=[];
 for(const raw of (win.FRAME_ATLAS_PATCH_CANDIDATES||[])){
   const p=JSON.parse(JSON.stringify(raw));
   const pid=idOf(p);
   const vals=identityValues(p);
   let match=(pid&&existing.find(x=>idOf(x)===pid))||vals.map(v=>byToken.get(v)).find(Boolean)||null;
   if(match){
     const why=pid&&idOf(match)===pid?'same-id':(vals.some(v=>identityValues(match).includes(v))?'local/en/alias-normalized-match':'identity-token-match');
     const before=idOf(match);
     // Preserve the candidate’s localized spelling and English spellings as aliases on the canonical record.
     const aliases=[...(match.aliases||[]),p.name,p.en,...(p.aliases||[])].filter(Boolean);
     const protectedNames=new Set([norm(match.name),norm(match.en)].filter(Boolean));
     match.aliases=mergeUniq(aliases.filter(a=>!protectedNames.has(norm(a))),norm);
     // Merge references and category metadata without overwriting selected cover or canonical place details.
     for(const field of ['editorialCategoryIds','editorialReferenceIds','officialSources','imageCandidates','searchTerms']){
       const keyFn=field==='officialSources'?x=>norm(x&&x.url):field==='imageCandidates'?x=>norm(x&&(x.src||x.imageUrl)):field==='searchTerms'?norm:norm;
       addArrays(match,p,field,keyFn);
     }
     if(p.editorialReferenceApplications&&typeof p.editorialReferenceApplications==='object'){
       match.editorialReferenceApplications={...(p.editorialReferenceApplications||{}),...(match.editorialReferenceApplications||{})};
     }
     const matchId=idOf(match);
     win.FRAME_ATLAS_PATCH_IMAGE_ENTRIES=win.FRAME_ATLAS_PATCH_IMAGE_ENTRIES||{};
     if(p.coverImage){
       const c={src:p.coverImage,imageUrl:p.coverImage,title:p.selectedCoverTitle||p.name+' · 사진 후보',sourcePageUrl:p.imageSourcePageUrl||p.photoSourceUrl||p.coverImageSource||'',sourceName:p.imageSourceName||p.dataSource||'통합 장소 데이터 사진 후보',placeMatch:'unverified',rights:'unknown',status:'candidate',role:'representative_photo_candidate'};
       if(norm(p.name).includes(norm('국립대한민국임시정부기념관')) || vals.includes(norm('국립대한민국임시정부기념관'))){
         const cv={coverImage:p.coverImage,selectedCoverImage:p.coverImage,userSelectedCover:'',selectedCoverTitle:p.name+' · 공식 도메인 이미지 후보',selectedCoverSourceUrl:c.sourcePageUrl,photoMatchStatus:p.photoMatchStatus||'사진 후보 · 장소 일치·실기기 로딩·권리 확인 필요',imageRightsStatus:p.imageRightsStatus||'사진 재사용 조건 미확인',photoHold:false};
         win.FRAME_ATLAS_PATCH_COVER_OVERRIDES=win.FRAME_ATLAS_PATCH_COVER_OVERRIDES||{};
         win.FRAME_ATLAS_PATCH_COVER_OVERRIDES[matchId]={...(win.FRAME_ATLAS_PATCH_COVER_OVERRIDES[matchId]||{}),...cv};
         win.FRAME_ATLAS_PATCH_IMAGE_ENTRIES[matchId]={...(win.FRAME_ATLAS_PATCH_IMAGE_ENTRIES[matchId]||{}),cover:c,candidates:p.imageCandidates||[]};
         win.FRAME_ATLAS_PATCH_MEMORIAL_REPLACED_ID=matchId;
       }else{
         win.FRAME_ATLAS_PATCH_IMAGE_ENTRIES[matchId]={...(win.FRAME_ATLAS_PATCH_IMAGE_ENTRIES[matchId]||{}),addCandidates:[...(win.FRAME_ATLAS_PATCH_IMAGE_ENTRIES[matchId]?.addCandidates||[]),c,...(p.imageCandidates||[])]};
       }
     }
     mergeAudit.push({candidateId:pid,canonicalId:matchId,candidateName:p.name,canonicalName:match.name,reason:why,action:'merged-into-existing-place; preserve references and photo candidates'});
     // Refresh the identity map after aliases were merged, so later candidates cannot create cross-field duplicates.
     byToken=lookup();
     continue;
   }
   const duplicateToken=vals.find(v=>byToken.has(v));
   if((pid&&knownIds.has(pid))||duplicateToken){
     const found=(pid&&existing.find(x=>idOf(x)===pid))||byToken.get(duplicateToken);
     if(found){mergeAudit.push({candidateId:pid,canonicalId:idOf(found),candidateName:p.name,canonicalName:found.name,reason:'fallback-identity-collision',action:'merged-into-existing-place'});}
     continue;
   }
   added.push(p);existing.push(p);if(pid)knownIds.add(pid);
   for(const v of vals)byToken.set(v,p);
 }
 win.FRAME_ATLAS_ADDITIONS=[...(win.FRAME_ATLAS_ADDITIONS||[]),...added];
 // Recalculate after add and merge; never hardcode catalog count.
 const all=[...(catalog.places||[]),...(win.FRAME_ATLAS_ADDITIONS||[])];
 const uniqueIds=new Set(all.map(idOf).filter(Boolean));
 win.FRAME_ATLAS_PATCH_ADDED_PLACE_COUNT=added.length;
 win.FRAME_ATLAS_PATCH_MATCHED_CANDIDATE_COUNT=mergeAudit.length;
 win.FRAME_ATLAS_DUPLICATE_MERGE_AUDIT=mergeAudit;
 win.FRAME_ATLAS_PATCH_EXPECTED_CATALOG_PLACE_COUNT=uniqueIds.size;
 if(catalog)catalog.targetCount=uniqueIds.size;
 const imageLib=win.FRAME_ATLAS_IMAGE_LIBRARY||(win.FRAME_ATLAS_IMAGE_LIBRARY={});
 for(const [id,entry] of Object.entries(win.FRAME_ATLAS_PATCH_IMAGE_ENTRIES||{})){
   if(entry.cover){imageLib[id]={...(imageLib[id]||{}),cover:entry.cover,candidates:mergeUniq([...(imageLib[id]?.candidates||[]),...(entry.candidates||[])],x=>norm(x&&(x.src||x.imageUrl)))};}
   if(entry.addCandidates){imageLib[id]={...(imageLib[id]||{}),candidates:mergeUniq([...(imageLib[id]?.candidates||[]),...(entry.addCandidates||[])],x=>norm(x&&(x.src||x.imageUrl)))};}
   if(entry.metadataUpdate){for(const coll of [catalog.places,win.FRAME_ATLAS_ADDITIONS]){for(const p of (coll||[])){if(idOf(p)===id)Object.assign(p,entry.metadataUpdate);}}}
 }
 if(document&&document.documentElement){
   const style=document.createElement('style');style.id='fa-v1312-detail-layout';style.textContent='@media(min-width:1081px){.detail-layout{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:20px!important}.detail-main,.detail-side{min-width:0}.detail-side{align-content:start}}.detail-fixed-open>summary{cursor:default!important;pointer-events:auto}.detail-fixed-open>summary::after{display:none!important}.detail-fixed-open[open]>summary{border-radius:11px!important}';
   (document.head||document.documentElement).appendChild(style);
   document.addEventListener('click',function(e){
     const sum=e.target&&e.target.closest?e.target.closest('#editorialReferencePanel>summary,#photoCandidateDetails>summary,#placeUseInfoPanel>summary'):null;
     if(sum){e.preventDefault();e.stopImmediatePropagation();const d=sum.parentElement;if(d){d.open=true;d.classList.add('detail-fixed-open');}}
   },true);
   document.addEventListener('keydown',function(e){
     if(e.key!=='Enter'&&e.key!==' ')return;
     const sum=e.target&&e.target.closest?e.target.closest('#editorialReferencePanel>summary,#photoCandidateDetails>summary,#placeUseInfoPanel>summary'):null;
     if(sum){e.preventDefault();e.stopImmediatePropagation();const d=sum.parentElement;if(d){d.open=true;d.classList.add('detail-fixed-open');}}
   },true);
   document.addEventListener('toggle',function(e){const d=e.target;if(d&&d.matches&&d.matches('#editorialReferencePanel,#photoCandidateDetails,#placeUseInfoPanel')&&!d.open)d.open=true;},true);
   document.addEventListener('click',function(e){
     const button=e.target&&e.target.closest?e.target.closest('#floatingBack,#detailBottomTop'):null;
     if(!button)return;e.preventDefault();e.stopImmediatePropagation();window.scrollTo({top:0,behavior:'smooth'});
   },true);
   const fixUi=()=>{
     const back=document.getElementById('floatingBack')||document.getElementById('detailBottomTop');
     if(back){if(back.textContent.trim()!=='↑ 맨 위로')back.textContent='↑ 맨 위로';if(back.getAttribute('aria-label')!=='맨 위로 이동')back.setAttribute('aria-label','맨 위로 이동');if(back.getAttribute('title')!=='맨 위로')back.setAttribute('title','맨 위로');}
     const top=document.getElementById('floatingTop');if(top&&back)top.style.display='none';else if(top)top.style.removeProperty('display');
     for(const id of ['editorialReferencePanel','photoCandidateDetails','placeUseInfoPanel']){const d=document.getElementById(id);if(d){d.open=true;d.classList.add('detail-fixed-open');const s=d.querySelector(':scope > summary');if(s&&id==='photoCandidateDetails'&&s.textContent.trim()!=='대표사진 후보 · 이미지 관리')s.textContent='대표사진 후보 · 이미지 관리';}}
     const more=document.querySelector('#appContent .more-card');if(more){more.querySelectorAll('details').forEach(d=>{if(d.dataset.faV1312Prepared==='1')return;d.open=false;d.dataset.faV1312Prepared='1';const sum=d.querySelector('summary');if(sum){const t=sum.textContent.trim();if(/접기/.test(t))sum.textContent=t.replace(/전체\s*접기/g,'전체 펼치기').replace(/모두\s*접기/g,'모두 펼치기').replace(/접기/g,'펼치기');}});more.querySelectorAll('button').forEach(b=>{const t=b.textContent.trim();if(/^(전체\s*접기|모두\s*접기|접기)$/.test(t)){b.textContent=t.replace(/전체\s*접기/,'전체 펼치기').replace(/모두\s*접기/,'모두 펼치기').replace(/^접기$/,'펼치기');}});}
   };
   const root=document.getElementById('appContent');if(root&&window.MutationObserver)new MutationObserver(fixUi).observe(root,{childList:true,subtree:true});
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fixUi,{once:true});else fixUi();
 }
})();
