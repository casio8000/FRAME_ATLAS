#!/usr/bin/env node
"use strict";

// Dependency-free data audit. Run from the repository root with:
//   node tests/v2-data-audit.cjs
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "v2/data/places.json"), "utf8"));
const appJs = fs.readFileSync(path.join(root, "v2/assets/app.js"), "utf8");
const expectedGroups = ["seoul", "capital", "gangwon", "chungcheong", "jeolla", "gyeongsang", "jeju"];
const groups = data.regionGroups || [];
const active = data.places || [];
const queue = data.reviewQueue || [];
const records = [...active, ...queue];

function normalizeName(value) {
  return String(value || "").toLowerCase().replace(/[\s()（）·・,，]/g, "");
}
function regionGroupFor(value) {
  const region = String(value || "").replace(/\s+/g, " ").trim();
  if (!region) return "";
  const code = groups.find(g => g.id === region);
  if (code) return code.id;
  for (const group of groups) {
    const prefixes = (group.provinces || []).map(String);
    if (prefixes.some(prefix => region === prefix || region.startsWith(prefix + " ") ||
      region.startsWith(prefix + "·") || region.startsWith(prefix + "-") ||
      region.startsWith(prefix + "/") || region.startsWith(prefix + "("))) return group.id;
  }
  return "";
}

// Schema and region taxonomy
assert.equal(data.schemaVersion, 2, "Expected v2 catalog schema");
assert.ok(Array.isArray(data.places), "Active places must be an array");
assert.ok(Array.isArray(data.reviewQueue), "Review queue must be an array");
assert.deepEqual(groups.map(g => g.id), expectedGroups, "Seven regional groups must remain in the expected order");
for (const id of expectedGroups) {
  assert.ok(appJs.includes('key:"' + id + '"'), "App region logic is missing group: " + id);
}
assert.equal(records.length, active.length + queue.length, "Catalog counts must be consistent");

// Stable identifiers and duplicate locations
const ids = records.map(p => p.id);
assert.ok(ids.every(Boolean), "Every active and queued location needs a stable ID");
assert.equal(new Set(ids).size, ids.length, "Location IDs must be unique across active and queued records");
const names = records.map(p => normalizeName(p.name));
assert.ok(names.every(Boolean), "Every location needs a name");
assert.equal(new Set(names).size, names.length, "Normalized location names must not be duplicated");
assert.ok(records.every(p => regionGroupFor(p.region) && p.regionGroup === regionGroupFor(p.region)),
  "Every location must have a matching detailed region and regionGroup");

const activeByGroup = Object.fromEntries(expectedGroups.map(id => [id, active.filter(p => regionGroupFor(p.region) === id).length]));
for (const id of expectedGroups) assert.ok(activeByGroup[id] > 0, "Active catalog must have at least one location in " + id);

// Photo-reference metadata. A reference image is not automatically an approved cover.
const candidates = records.flatMap(place => (place.imageCandidates || []).map(candidate => ({ place, candidate })));
const candidateIds = candidates.map(x => x.candidate.id);
assert.ok(candidateIds.every(Boolean), "Every image candidate needs a stable ID");
assert.equal(new Set(candidateIds).size, candidateIds.length, "Image-candidate IDs must be unique across the catalog");
for (const { place, candidate } of candidates) {
  assert.ok(candidate.status, "Image status is required: " + place.id + "/" + candidate.id);
  assert.ok([candidate.rights, candidate.rightsStatus, candidate.license, candidate.rightsLabel]
    .some(v => String(v || "").trim()), "Image rights must be explicit, including unknown: " + place.id + "/" + candidate.id);
  if (candidate.placeMatch === "confirmed") {
    assert.ok(candidate.imageUrl || candidate.sourceThumbnail || candidate.pendingAsset || candidate.assetPath,
      "Confirmed place image needs a usable source: " + place.id + "/" + candidate.id);
    assert.ok(/^https?:\/\//i.test(String(candidate.sourcePageUrl || "")),
      "Confirmed place image needs a source page: " + place.id + "/" + candidate.id);
  }
  if (candidate.primaryImageId === candidate.id) {
    assert.equal(candidate.placeMatch, "confirmed", "An approved representative photo must match the place: " + place.id);
  }
}
for (const place of records) {
  if (place.primaryImageId) {
    assert.ok((place.imageCandidates || []).some(c => c.id === place.primaryImageId),
      "Representative-photo ID must reference a candidate: " + place.id);
  }
  if (place.referenceImageId) {
    assert.ok((place.imageCandidates || []).some(c => c.id === place.referenceImageId),
      "Reference-photo ID must reference a candidate: " + place.id);
  }
}

// Ensure each required category remains represented in the active archive.
const categoryText = active.map(p => [p.name, p.category, p.photoProfile, p.summary, ...(p.bestConcepts || [])].join(" ")).join("\n");
for (const [label, pattern] of [
  ["large studios/production", /스튜디오|프로덕션|호리존|LED|촬영장|오픈세트/i],
  ["performance venues", /공연장|오페라|공연예술|아트센터|공연문화/i],
  ["architecture/art sculpture", /건축|조형|미술관|조각|건축가/i],
]) assert.ok(pattern.test(categoryText), "No active catalog locations represent: " + label);

console.log(JSON.stringify({
  audit: "PASS",
  activePlaces: active.length,
  reviewCandidates: queue.length,
  imageCandidates: candidates.length,
  activePlacesByRegion: activeByGroup,
  representativeImagesApproved: active.filter(p => p.primaryImageId).length,
  note: "This is a data-integrity audit, not a live-browser or image-rights verification."
}, null, 2));
