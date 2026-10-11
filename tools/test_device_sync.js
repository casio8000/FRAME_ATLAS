"use strict";
const assert = require("node:assert/strict");
global.FABackupMerge = require("../data/backup-merge.js");
const sync = require("../data/device-sync.js");
const core = sync.core;
const remoteSupersedesDelete = core.remoteSupersedesDelete;

(async function main() {
  assert.equal(core.stableStringify({ b: 2, a: 1 }), core.stableStringify({ a: 1, b: 2 }),
    "object key order should not change a record fingerprint");
  assert.notEqual(await core.fingerprint("ls", '{"a":1}'), await core.fingerprint("ls", '{"a":2}'),
    "different raw localStorage values need different fingerprints");
  assert.equal(await core.fingerprint("places", { id: "P1", b: 2, a: 1 }),
               await core.fingerprint("places", { a: 1, id: "P1", b: 2 }),
    "equivalent place objects should have equal fingerprints");

  const key = "faReview57_서울/#1";
  const path = core.keyPath(key, ".json");
  assert.match(path, /^[A-Za-z0-9_-]+\.json$/, "record keys must not break GitHub path segments");
  assert.equal(core.logicalId("pmeta", "L-001#2"), "pmeta\u0000L-001#2");

  const merged = core.mergeRecord("places",
    { id: "P1", memo: "PC 메모", localOnly: 1 },
    { id: "P1", memo: "아이폰 메모", remoteOnly: 2 });
  assert.deepEqual(merged.value, { id: "P1", memo: "PC 메모", localOnly: 1, remoteOnly: 2 });
  assert.equal(merged.conflicts, 1, "same-field edits should be surfaced rather than silently replacing local text");

  const mergedJson = core.mergeRecord("ls",
    JSON.stringify({ memo: "PC", left: true }),
    JSON.stringify({ memo: "iPhone", right: true }));
  assert.deepEqual(JSON.parse(mergedJson.value), { memo: "PC", left: true, right: true });
  assert.equal(mergedJson.conflicts, 1);

  const localBlob = new Blob(["local photo"], { type: "image/jpeg" });
  const remoteBlob = new Blob(["remote photo"], { type: "image/jpeg" });
  const photoConflict = core.mergeRecord("pblob", localBlob, remoteBlob);
  assert.equal(photoConflict.value, localBlob, "different photo blobs must never be auto-overwritten during a conflict");
  assert.equal(photoConflict.conflicts, 1);

  assert.equal(remoteSupersedesDelete("2026-10-11T10:00:00.000Z", "2026-10-11T09:59:59.000Z"), false,
    "an older peer record must not resurrect a deleted item");
  assert.equal(remoteSupersedesDelete("2026-10-11T10:00:00.000Z", "2026-10-11T10:00:01.000Z"), true,
    "a genuinely newer remote edit can be considered after deletion");
  assert.equal(remoteSupersedesDelete("2026-10-11T10:00:00.000Z", "invalid"), false,
    "an invalid remote timestamp must not resurrect a deleted item");

  const text = "FRAME ATLAS · 촬영 장소";
  assert.equal(core.decodeText(core.encodeText(text)), text, "UTF-8 data must survive API Base64 conversion");

  console.log("FRAME ATLAS device sync tests: 10 cases passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
