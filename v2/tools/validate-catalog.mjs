import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const catalog = JSON.parse(fs.readFileSync(new URL("../data/places.json", import.meta.url), "utf8"));
assert.equal(catalog.schemaVersion, 1, "catalog schemaVersion must be 1");
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
  const candidateIds = new Set();
  for (const c of p.imageCandidates) {
    assert.ok(c.id && c.imageUrl, "each image candidate needs an id and direct image URL");
    assert.ok(!candidateIds.has(c.id), "duplicate image candidate id in " + p.name);
    candidateIds.add(c.id);
    if (c.status === "approved") {
      assert.ok(allowedRights.has(c.rights), "approved image must have an allowed rights class");
      assert.equal(c.placeMatch, "confirmed", "approved image must be location-confirmed");
      assert.ok(c.sourcePageUrl, "approved image must have an original page URL");
      assert.ok(c.licenseUrl, "approved image must have rights evidence URL");
      assert.equal(p.primaryImageId, c.id, "approved image must match primaryImageId");
    }
  }
  if (p.primaryImageId) {
    assert.ok(p.imageCandidates.some(c => c.id === p.primaryImageId && c.status === "approved"),
      "primaryImageId must refer to an approved candidate");
  }
}
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length >= 1, "index.html must contain client code");
for (const [, code] of scripts) new vm.Script(code, { filename: "v2/index-inline.js" });
for (const provider of ["Openverse", "Wikimedia Commons", "Google 이미지", "Bing 이미지", "네이버 이미지", "다음 이미지", "Flickr", "공식·관광 출처"]) {
  assert.ok(html.includes(provider), "missing photo search provider: " + provider);
}
console.log("FRAME ATLAS 2.0 validation passed: " + catalog.places.length + " starter places; " + ids.size + " unique IDs.");
