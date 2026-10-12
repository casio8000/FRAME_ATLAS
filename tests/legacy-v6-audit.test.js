const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../data/legacy-v6-audit.js"), "utf8");
const sandbox = { window: { document: null } };
vm.runInNewContext(source, sandbox);
const audit = sandbox.window.FALegacyV6Audit;

test("summarizes an old database with only default per-place values", () => {
  const places = {};
  for (let i = 1; i <= 100; i++) {
    const id = "L-" + String(i).padStart(3, "0");
    places[id] = { coverId: null, favorite: false, logs: [], notes: "", photos: [], rating: 0 };
  }
  const result = audit.summarizeUserDB({
    schemaVersion: 6,
    updatedAt: "2026-10-05T11:24:59.978Z",
    places
  }, []);
  assert.equal(result.places, 100);
  assert.equal(result.favorites, 0);
  assert.equal(result.notes, 0);
  assert.equal(result.logs, 0);
  assert.equal(result.photoReferences, 0);
  assert.equal(result.coverReferences, 0);
  assert.equal(result.ratings, 0);
  assert.equal(result.photoRecords, 0);
});

test("counts non-empty user annotations without counting defaults", () => {
  const result = audit.summarizeUserDB({
    schemaVersion: 6,
    updatedAt: "2026-10-05T11:24:59.978Z",
    places: {
      "L-001": { coverId: null, favorite: false, logs: [], notes: "", photos: [], rating: 0 },
      "L-002": { coverId: "photo-2", favorite: true, logs: [{ date: "2026-10-05" }], notes: "촬영 후보", photos: ["photo-2"], rating: 4 },
      "L-003": { coverId: null, favorite: false, logs: [], notes: "   ", photos: [], rating: 0 }
    }
  }, [{ key: "photo-2", value: { placeId: "L-002" } }]);
  assert.equal(result.places, 3);
  assert.equal(result.favorites, 1);
  assert.equal(result.notes, 1);
  assert.equal(result.logs, 1);
  assert.equal(result.photoReferences, 1);
  assert.equal(result.coverReferences, 1);
  assert.equal(result.ratings, 1);
  assert.equal(result.photoRecords, 1);
});

test("handles malformed or missing legacy place maps conservatively", () => {
  const result = audit.summarizeUserDB({ schemaVersion: 6, places: [] }, undefined);
  assert.equal(result.places, 0);
  assert.equal(result.favorites, 0);
  assert.equal(result.notes, 0);
  assert.equal(result.photoRecords, 0);
});
