import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const catalog = JSON.parse(fs.readFileSync(new URL("../data/places.json", import.meta.url), "utf8"));
assert.equal(catalog.schemaVersion, 2, "catalog schemaVersion must be 2");
assert.ok(typeof catalog.selectionMethod === "string" && catalog.selectionMethod.length > 0, "catalog must document its photo-first selection method");
assert.equal(catalog.selectionRubric?.total, 100, "catalog must document the 100-point photo-selection rubric");
assert.equal(catalog.selectionRubric?.productionFeasibilitySeparate, true,
  "artistic photo potential and shooting/access feasibility must be evaluated separately");
assert.ok(Array.isArray(catalog.places), "catalog places must be an array");
assert.ok(catalog.places.length >= 1, "catalog must have starter records");
const ids = new Set();
const allowedRegions = new Set(["서울", "경기", "인천"]);
const allowedRights = new Set(["cc0", "public-domain", "cc-by", "cc-by-sa", "permission", "self-owned"]);
for (const p of catalog.places) {
  assert.ok(p.id && p.name, "every place needs id and name");
  assert.ok(!ids.has(p.id), "duplicate place id: " + p.id);
  ids.add(p.id);
  assert.ok(allowedRegions.has(p.region), "unknown region for " + p.name);
  assert.ok(Array.isArray(p.imageCandidates), "imageCandidates must be an array");
  if (p.scoutPriority === 1) assert.ok(p.imageCandidates.length >= 1, "every A-tier location must have at least one researched photo candidate: " + p.name);
  assert.ok(p.photoProfile && p.photoProfile.length > 15, "place needs a photographer-oriented selection rationale: " + p.name);
  assert.ok(Array.isArray(p.visualStrengths) && p.visualStrengths.length >= 2, "place needs visual strengths: " + p.name);
  assert.ok(Array.isArray(p.bestConcepts) && p.bestConcepts.length >= 2, "place needs suitable shoot concepts: " + p.name);
  assert.ok(Array.isArray(p.constraints) && p.constraints.length >= 2, "place needs scouting constraints: " + p.name);
  assert.ok([1, 2, 3].includes(p.scoutPriority), "place needs a 1-3 scout priority: " + p.name);
  assert.ok(Number.isInteger(p.photoPotentialScore) && p.photoPotentialScore >= 0 && p.photoPotentialScore <= 100,
    "place needs an explicit 0-100 photographer-first potential score: " + p.name);
  assert.ok(p.photoScoreBreakdown && typeof p.photoScoreBreakdown === "object",
    "place needs a score breakdown: " + p.name);
  const scoreValues = [
    p.photoScoreBreakdown.distinctiveness,
    p.photoScoreBreakdown.compositionVariety,
    p.photoScoreBreakdown.lightAndTexture,
    p.photoScoreBreakdown.editorialVersatility,
    p.photoScoreBreakdown.indoorOutdoorFlexibility
  ];
  assert.ok(scoreValues.every(Number.isInteger), "all score components must be integers: " + p.name);
  assert.equal(scoreValues.reduce((sum, n) => sum + n, 0), p.photoPotentialScore,
    "score breakdown must add up to total score: " + p.name);
  assert.ok(p.scoreStatus && /현장/.test(p.scoreStatus),
    "desk scores must clearly disclose that site verification is pending: " + p.name);
  assert.equal(p.selectionGate?.tourismPopularityUsedAsScore, false,
    "tourism popularity must not be used as a photo-selection score: " + p.name);
  assert.equal(p.scoutPriority, p.photoPotentialScore >= 85 ? 1 : p.photoPotentialScore >= 74 ? 2 : 3,
    "A/B/C priority must be derived from photo potential, not popularity: " + p.name);
  assert.ok(Array.isArray(p.searchTerms) && p.searchTerms.length >= 1, "place needs targeted photo-search terms: " + p.name);
  const candidateIds = new Set();
  for (const c of p.imageCandidates) {
    assert.ok(c.id && (c.imageUrl || c.assetPath), "each image candidate needs an id and image URL or stored asset path");
    assert.ok(!candidateIds.has(c.id), "duplicate image candidate id in " + p.name);
    candidateIds.add(c.id);
    if (c.status === "approved") {
      assert.ok(allowedRights.has(c.rights), "approved image must have an allowed rights class");
      assert.equal(c.placeMatch, "confirmed", "approved image must be location-confirmed");
      assert.ok(c.assetPath && String(c.imageUrl || "").startsWith("./assets/places/"),
        "approved representative image must be copied into the repository and use its local asset path");
      if (c.rights !== "self-owned") {
        assert.ok(c.sourcePageUrl, "approved external image must have an original page URL");
        assert.ok(c.licenseUrl, "approved external image must have rights evidence URL");
      } else {
        assert.ok(c.rightsLabel, "self-owned image must document its declared ownership status");
      }
      assert.equal(p.primaryImageId, c.id, "approved image must match primaryImageId");
    }
  }
  if (p.primaryImageId) {
    assert.ok(p.imageCandidates.some(c => c.id === p.primaryImageId && c.status === "approved"),
      "primaryImageId must refer to an approved candidate");
  }
}
const root = new URL("../", import.meta.url);
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appCode = fs.readFileSync(new URL("../assets/app.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/app.css", import.meta.url), "utf8");
assert.ok(html.includes('<link rel="stylesheet" href="assets/app.css">'), "index.html must load the separate stylesheet");
assert.ok(html.includes('<script defer src="assets/app.js"></script>'), "index.html must load the separate app script");
assert.ok(!html.includes("<style>") && !html.includes("<script>"), "index.html should remain a thin shell without inline CSS/JS");
assert.ok(css.length > 1000 && css.includes("@media"), "separate CSS must contain responsive app styling");
new vm.Script(appCode, { filename: "v2/assets/app.js" });
for (const provider of ["Openverse", "Wikimedia Commons", "Google 이미지", "Bing 이미지", "네이버 이미지", "다음 이미지", "Flickr", "공유마당", "한국관광공사", "서울·지자체 공식사진", "공식·운영기관", "패션·인물 에디토리얼", "건축·기하학·질감", "photoQuery", "publishCatalog", "batchSearch(scope)", "data-cand-field", "data-auto-download"]) {
  assert.ok(appCode.includes(provider), "missing photo search provider or workflow: " + provider);
}
assert.match(appCode, /const approvedImage=[^;]+\(\!\!i\.assetPath\|\|\!\!i\.pendingAsset\)/,
  "a photo must be stored locally or staged before it can be treated as a representative image");
assert.ok(appCode.includes('branch:"main"'), "shared catalog publisher must target the Pages source branch");
assert.ok(appCode.includes('c.status==="approved"&&c.assetPath&&c.imageUrl'), "public catalog must only retain approved stored photos");
assert.ok(appCode.includes('obj.schemaVersion=2'), "imported catalogs must be normalized to schema v2");
assert.doesNotMatch(appCode, /localStorage\.setItem\([^\n]*(?:token|Token|TOKEN)/,
  "the GitHub token must not be persisted in browser storage");
const candidateCount = catalog.places.reduce((sum, p) => sum + p.imageCandidates.length, 0);
const candidatePlaces = catalog.places.filter(p => p.imageCandidates.length > 0).length;
const aTier = catalog.places.filter(p => p.scoutPriority === 1);
assert.ok(aTier.every(p => p.imageCandidates.length > 0), "all A-tier locations must be covered by photo research");
console.log("FRAME ATLAS 2.0 validation passed: " + catalog.places.length + " places; " + ids.size + " unique IDs; " + candidatePlaces + " places with photo candidates / " + candidateCount + " candidates; all " + aTier.length + " A-tier places covered.");