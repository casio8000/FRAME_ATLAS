"use strict";
const assert = require("node:assert/strict");
global.FABackupMerge = require("../data/backup-merge.js");
const sync = require("../data/device-sync.js");
const core = sync.core;
const remoteSupersedesDelete = core.remoteSupersedesDelete;
const peerReportsConflict = core.peerReportsConflict;

(async function main() {
  assert.equal(core.stableStringify({ b: 2, a: 1 }), core.stableStringify({ a: 1, b: 2 }),
    "object key order should not change a record fingerprint");
  assert.notEqual(await core.fingerprint("ls", '{"a":1}'), await core.fingerprint("ls", '{"a":2}'),
    "different raw localStorage values need different fingerprints");
  assert.equal(await core.fingerprint("places", { id: "P1", b: 2, a: 1 }),
               await core.fingerprint("places", { a: 1, id: "P1", b: 2 }),
    "equivalent place objects should have equal fingerprints");

  assert.equal(core.isRetryableError(Object.assign(new Error("GitHub 응답 503"), { status: 503 })), true,
    "server errors should be retried automatically");
  assert.equal(core.isRetryableError(Object.assign(new Error("GitHub 응답 대기 시간 초과"), { status: 408, name: "TimeoutError" })), true,
    "timed-out GitHub requests should be retried automatically");
  assert.equal(core.isRetryableError(Object.assign(new Error("업로드 충돌 409"), { status: 409 })), false,
    "optimistic write conflicts must not be blindly retried against a stale SHA");
  assert.equal(core.isRetryableError(Object.assign(new Error("유효성 충돌 422"), { status: 422 })), false,
    "validation/SHA conflicts require a fresh sync attempt rather than an automatic retry loop");
  assert.equal(core.isRetryableError(Object.assign(new Error("GitHub 응답 429"), { status: 429 })), true,
    "rate limiting should be retried automatically");
  assert.equal(core.isRetryableError(Object.assign(new Error("업로드 실패 403 — API rate limit exceeded"), { status: 403 })), true,
    "GitHub rate-limit 403 responses should be retried but ordinary permission 403 errors should not");
  assert.equal(core.isRetryableError(new TypeError("Failed to fetch")), true,
    "temporary network failures should be retried automatically");
  assert.equal(core.isRetryableError(Object.assign(new Error("권한 없음"), { status: 401 })), false,
    "authentication errors should not be retried as if they were temporary");
  assert.equal(core.isRetryableError(Object.assign(new Error("저장소 쓰기 권한 없음"), { status: 403 })), false,
    "permission errors should not trigger retry loops");
  assert.deepEqual(core.retryDelays, [5000, 15000, 30000, 60000, 120000],
    "retry delays should be bounded and progressively increase");

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

  const propagated = { "device-A|ls\u0000memo25_P1": { deviceId: "device-A", store: "ls", key: "memo25_P1" } };
  assert.equal(peerReportsConflict(propagated, "device-A", "ls", "memo25_P1"), true,
    "a peer manifest should carry an unresolved conflict back to the device involved");
  assert.equal(peerReportsConflict(propagated, "device-A", "ls", "memo25_P2"), false,
    "conflict markers must match both the record store and key");

  const text = "FRAME ATLAS · 촬영 장소";
  assert.equal(core.decodeText(core.encodeText(text)), text, "UTF-8 data must survive API Base64 conversion");

  // Mock GitHub Contents API to exercise a complete PC -> iPhone -> PC round trip.
  class MemoryStorage {
    constructor() { this.map = new Map(); }
    get length() { return this.map.size; }
    key(i) { return Array.from(this.map.keys())[i] ?? null; }
    getItem(k) { return this.map.has(String(k)) ? this.map.get(String(k)) : null; }
    setItem(k, v) { this.map.set(String(k), String(v)); }
    removeItem(k) { this.map.delete(String(k)); }
  }
  // Regression: the browser entrypoint must not call a factory-scoped helper.
  // This reproduces the startup path with no saved GitHub settings; it should
  // report the missing settings, not a ReferenceError for safeStatus.
  const startupStorage = new MemoryStorage();
  startupStorage.setItem("faGH", JSON.stringify({ repo: "", token: "" }));
  const startupStatus = { textContent: "" };
  global.localStorage = startupStorage;
  global.document = {
    getElementById: id => id === "fa_device_sync_status" ? startupStatus : null
  };
  global.faDeviceSyncEnable();
  await new Promise(resolve => setImmediate(resolve));
  const startupMessage = startupStorage.getItem("faDeviceSyncLastStatus") || "";
  assert.doesNotMatch(startupMessage, /safeStatus/i,
    "safe sync start must not reference a helper outside its scope");
  assert.match(startupMessage, /저장소와 토큰/,
    "safe sync startup should show the normal missing-settings message");
  delete global.document;

  const files = new Map();
  let serial = 0;
  let repoPrivate = true;
  const jsonResponse = (value, status) => new Response(JSON.stringify(value), {
    status: status || 200, headers: { "Content-Type": "application/json" }
  });
  global.fetch = async function (url, options) {
    options = options || {};
    const path = new URL(typeof url === "string" ? url : url.url).pathname;
    if (path === "/repos/owner/vault") {
      return jsonResponse({ private: repoPrivate, permissions: { push: true } });
    }
    const base = "/repos/owner/vault/contents/";
    if (!path.startsWith(base)) return jsonResponse({ message: "not found" }, 404);
    const rel = decodeURIComponent(path.slice(base.length));
    if (options.method === "PUT") {
      const body = JSON.parse(options.body || "{}");
      const oldFile = files.get(rel);
      if (oldFile && body.sha !== oldFile.sha) return jsonResponse({ message: "sha mismatch" }, 409);
      if (!oldFile && body.sha) return jsonResponse({ message: "file missing" }, 422);
      const bytes = Buffer.from(body.content || "", "base64");
      const sha = "mock-sha-" + (++serial);
      files.set(rel, { bytes, sha });
      return jsonResponse({ content: { sha } });
    }
    const file = files.get(rel);
    if (file) {
      const accept = options.headers && options.headers.Accept || "";
      if (accept.includes("raw+json")) return new Response(file.bytes, { status: 200 });
      return jsonResponse({ sha: file.sha, size: file.bytes.length, type: "file" });
    }
    const prefix = rel.replace(/\/+$/, "") + "/";
    const children = new Map();
    for (const filePath of files.keys()) {
      if (!filePath.startsWith(prefix)) continue;
      const rest = filePath.slice(prefix.length);
      const bits = rest.split("/");
      const child = bits[0];
      if (!children.has(child)) children.set(child, bits.length > 1 ? "dir" : "file");
    }
    if (children.size) {
      return jsonResponse(Array.from(children, ([name, type]) => ({ name, type, path: prefix + name })));
    }
    return jsonResponse({ message: "not found" }, 404);
  };
  function makeIdb() {
    const data = new Map(["places", "pmeta", "pblob"].map(name => [name, new Map()]));
    return {
      keys: async store => Array.from(data.get(store).keys()),
      get: async (store, key) => data.get(store).get(key),
      put: async (store, key, value) => { data.get(store).set(key, value); return key; },
      del: async (store, key) => data.get(store).delete(key),
      clear: async store => data.get(store).clear()
    };
  }
  function setupDevice(id, memo, place, photoText) {
    const storage = new MemoryStorage();
    storage.setItem("faGH", JSON.stringify({ repo: "owner/vault", token: "test-token" }));
    storage.setItem("faDeviceSyncEnabled", "1");
    storage.setItem("faDeviceSyncDeviceId", id);
    storage.setItem("memo25_P1", JSON.stringify(memo));
    const db = makeIdb();
    db.put("places", "P-1", place);
    db.put("pmeta", "P-1", { kind: "blob", credit: "local user" });
    db.put("pblob", "P-1", new Blob([photoText], { type: "image/jpeg" }));
    global.localStorage = storage;
    global.LSX = storage;
    global.IDB = db;
    global.DB = [place];
    global.PMETA = { "P-1": { kind: "blob", credit: "local user" } };
    global.PCACHE = {};
    global.FABackupMerge = require("../data/backup-merge.js");
    global.bkLS = function () {
      const activeStorage = global.localStorage;
      const out = {};
      for (let i = 0; i < activeStorage.length; i++) {
        const key = activeStorage.key(i);
        if (/^(frameAtlas[\w-]*|memo25_[\w-]*|rec30_[\w-]*|faReview57_[\w-]*|img31|faPhotoUrlVault525)$/.test(key || "")) out[key] = activeStorage.getItem(key);
      }
      return out;
    };
    return { storage, db };
  }
  const deviceA = setupDevice("a".repeat(32),
    { memo: "PC memo", pcOnly: true },
    { id: "P-1", name: "Mock Place", memo: "PC memo", pcOnly: true },
    "PC photo");
  const first = await sync.syncNow(false);
  assert.equal(first.ok, true, "first device should write its initial snapshot");
  assert.ok(Array.from(files.keys()).some(path => path.endsWith("/manifest.json")),
    "the private mock repository should contain a device manifest");

  const deviceB = setupDevice("b".repeat(32),
    { memo: "iPhone memo", phoneOnly: true },
    { id: "P-1", name: "Mock Place", memo: "iPhone memo", phoneOnly: true },
    "iPhone photo");
  const second = await sync.syncNow(false);
  assert.equal(second.ok, true, "second device should merge and publish its own snapshot");
  assert.ok(second.conflictsPending >= 3, "same-field and photo conflicts should be recorded on the second device");
  const bMemo = JSON.parse(deviceB.storage.getItem("memo25_P1"));
  assert.equal(bMemo.memo, "iPhone memo", "the second device's conflicting scalar should stay local");
  assert.equal(bMemo.pcOnly, true, "remote-only fields should merge into the second device");
  assert.equal(await (await deviceB.db.get("pblob", "P-1")).text(), "iPhone photo",
    "the second device's conflicting photo should not be overwritten");

  global.localStorage = deviceA.storage;
  global.LSX = deviceA.storage;
  global.IDB = deviceA.db;
  global.DB = [{ id: "P-1", name: "Mock Place", memo: "PC memo", pcOnly: true }];
  global.PMETA = { "P-1": { kind: "blob", credit: "local user" } };
  global.PCACHE = {};
  const third = await sync.syncNow(false);
  assert.equal(third.ok, true, "first device should read the peer's changes back");
  const aMemo = JSON.parse(deviceA.storage.getItem("memo25_P1"));
  assert.equal(aMemo.memo, "PC memo", "conflict propagation must prevent the peer from overwriting the original scalar");
  assert.equal(aMemo.phoneOnly, true, "the first device should still receive the peer-only field");
  const aPlace = await deviceA.db.get("places", "P-1");
  assert.equal(aPlace.memo, "PC memo", "place scalar conflicts should keep the first device value");
  assert.equal(aPlace.phoneOnly, true, "place records should merge peer-only fields");
  assert.equal(await (await deviceA.db.get("pblob", "P-1")).text(), "PC photo",
    "the first device's conflicting photo should remain intact");
  assert.ok(sync.getConflicts().length >= 3, "the first device should see propagated conflict markers");

  const writesBeforePublicRepoAttempt = serial;
  repoPrivate = false;
  await assert.rejects(() => sync.syncNow(true), /비공개/,
    "the sync engine must refuse to send personal data to a public repository");
  assert.equal(serial, writesBeforePublicRepoAttempt,
    "a public-repository refusal must occur before any file write");
  repoPrivate = true;

  console.log("FRAME ATLAS device sync tests: unit + mock round-trip + public-repo guard passed");

})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
