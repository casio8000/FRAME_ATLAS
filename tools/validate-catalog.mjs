#!/usr/bin/env node
"use strict";

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "v2", "data", "places.json"), "utf8"));
const html = fs.readFileSync(path.join(root, "v2", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "v2", "assets", "app.js"), "utf8");
const sw = fs.readFileSync(path.join(root, "v2", "sw.js"), "utf8");

const EXPECTED_GROUPS = ["seoul", "capital", "gangwon", "chungcheong", "jeolla", "gyeongsang", "jeju"];
const GROUP_LABELS = ["서울", "경기·인천 수도권", "강원권", "충청권", "전라권", "경상권", "제주권"];
const allRecords = [...(data.places || []), ...(data.reviewQueue || [])];

assert.equal(data.app, "FRAME ATLAS 2.0", "Unexpected catalog app name");
assert.equal(data.schemaVersion, 2, "Unexpected catalog schema version");
assert.ok(Array.isArray(data.places) && data.places.length > 0, "Active place catalog is missing");
assert.ok(Array.isArray(data.reviewQueue), "Review queue must be present");
assert.deepEqual(data.regionGroups.map(group => group.id), EXPECTED_GROUPS, "Catalog region groups do not match the UI contract");
assert.deepEqual(data.regionGroups.map(group => group.label), GROUP_LABELS, "Region labels do not match the agreed Korean labels");

const ids = allRecords.map(place => place.id);
assert.ok(ids.every(Boolean), "Every active and queued location needs a stable ID");
assert.equal(new Set(ids).size, ids.length, "Duplicate location IDs exist across the active catalog and review queue");

const normalizeName = value => String(value || "").normalize("NFKC").toLocaleLowerCase("ko").replace(/[\s()（）·・,，]/g, "");
const normalizedNames = allRecords.map(place => normalizeName(place.name));
assert.ok(normalizedNames.every(Boolean), "Every active and queued record needs a name");
assert.equal(new Set(normalizedNames).size, normalizedNames.length, "Duplicate normalized location names exist across the active catalog and review queue");

const activeGroupCounts = Object.fromEntries(EXPECTED_GROUPS.map(group => [group, 0]));
let referenceImageCount = 0;
for (const place of data.places) {
  assert.ok(EXPECTED_GROUPS.includes(place.regionGroup), "Invalid region group for " + place.id + ": " + place.regionGroup);
  activeGroupCounts[place.regionGroup] += 1;
  assert.ok(String(place.region || "").trim(), "Missing region for " + place.id);
  assert.ok(place.primaryImageId === null || typeof place.primaryImageId === "string", "Invalid primaryImageId for " + place.id);

  const candidates = Array.isArray(place.imageCandidates) ? place.imageCandidates : [];
  const ref = candidates.find(candidate => candidate && candidate.id === place.referenceImageId);
  assert.ok(ref, "Reference image candidate missing for " + place.id);
  assert.equal(ref.placeMatch, "confirmed", "Reference image must be marked as matching its place: " + place.id);
  assert.ok(ref.imageUrl || ref.sourceThumbnail || ref.assetPath || ref.pendingAsset, "Reference image has no usable source for " + place.id);
  assert.ok(ref.rights || ref.rightsStatus, "Reference image must have an explicit rights state (unknown is allowed): " + place.id);
  assert.equal(place.primaryImageId, place.referenceImageId, "A source-identified location photo should be approved as the representative image: " + place.id);
  referenceImageCount += 1;

  if (place.primaryImageId) {
    const primary = candidates.find(candidate => candidate && candidate.id === place.primaryImageId);
    assert.ok(primary, "Primary image points to a missing candidate for " + place.id);
    assert.equal(primary.placeMatch, "confirmed", "A primary image cannot be a known location mismatch: " + place.id);
    assert.ok(primary.rights || primary.rightsStatus, "Primary image needs an explicit rights state for " + place.id);
  }
}
assert.ok(EXPECTED_GROUPS.every(group => activeGroupCounts[group] > 0), "Every one of the seven region groups must have at least one active place");

const requiredPlaces = [
  "nat-museum-san", "nat-cjenm-studio-center", "nat-studio-cube-daejeon", "nat-busan-cinema-center",
  "nat-busan-film-studio", "nat-daegu-opera-house", "nat-sejong-arts-center", "nat-jeonju-palbok-art-factory", "nat-bucheon-art-bunker-b39", "seo-photo-sema", "nat-daegu-art-factory", "seo-magok-culture-hall", "seo-songeun-art-space", "gg-nam-june-paik-art-center", "gg-cica-museum", "seo-amorepacific-museum", "nat-cheongju-dongbu-warehouse", "seo-seoseoul-museum", "gg-gyeonggi-sangsang-campus",
  "nat-jeonju-film-studios", "nat-suncheon-drama-set", "nat-bonte-museum",
  "nat-jeju-glass-house-seopjikoji", "seo-kbs-arena", "jj-bangju-church"
];
for (const id of requiredPlaces) {
  const place = data.places.find(item => item.id === id);
  assert.ok(place, "Required nationwide scouting location missing: " + id);
  assert.equal(place.primaryImageId, place.referenceImageId, "Required location with a confirmed matching photo should use that photo as its representative: " + id);
}

const expectedCount = data.places.length;
const expectedQueueCount = data.reviewQueue.length;
for (const [id, value] of [
  ["homeCountPlaces", expectedCount],
  ["homeCountPhotos", referenceImageCount],
  ["homeFeaturedCount", expectedCount],
  ["homeAllPlaceCount", expectedCount],
  ["homeCountReviewQueue", expectedQueueCount],
  ["reviewQueueCount", expectedQueueCount]
]) {
  assert.match(html, new RegExp('id="' + id + '">' + value + '<'), "HTML initial count is stale for " + id);
}

const homeRegionButtons = [...html.matchAll(/data-home-region="([^"]*)">([^<]*)<\/button>/g)].map(match => ({ key: match[1], label: match[2] }));
assert.deepEqual(homeRegionButtons.map(button => button.key), ["", ...EXPECTED_GROUPS], "Homepage shortcuts must expose All plus all seven region groups in order");
assert.deepEqual(homeRegionButtons.slice(1).map(button => button.label), GROUP_LABELS, "Homepage region labels do not match the agreed labels");
for (const key of EXPECTED_GROUPS) assert.ok(app.includes('key:"' + key + '"'), "Region filtering logic is missing group " + key);

const cache = sw.match(/CACHE_NAME="([^"]+)"/);
assert.ok(cache, "Service worker cache name is missing");
const shellVersion = cache[1].match(/(20\d{6}-\d+)$/)?.[1];
assert.ok(shellVersion, "Service worker cache name must have a dated version suffix");
const appVersions = [...html.matchAll(/\?v=(20\d{6}-\d+)/g)].map(match => match[1]);
assert.ok(appVersions.length >= 2, "HTML must version both CSS and JavaScript assets");
assert.equal(new Set(appVersions).size, 1, "CSS and JS cache versions must match");
assert.equal(appVersions[0], shellVersion, "HTML asset query version must match service-worker cache version");

console.log(JSON.stringify({
  status: "PASS",
  activePlaces: data.places.length,
  reviewQueue: data.reviewQueue.length,
  regionGroups: activeGroupCounts,
  referenceImagesChecked: referenceImageCount,
  uniqueLocationIds: true,
  uniqueNormalizedNames: true,
  homeLabelsAndCounts: true,
  assetCacheVersion: shellVersion,
  requiredNationwideLocations: requiredPlaces.length
}, null, 2));
