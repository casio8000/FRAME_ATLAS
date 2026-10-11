/* FRAME ATLAS v5.39 — device-isolated, non-destructive GitHub sync.
 * Each device writes only its own records. Peers are merged locally; no public
 * repository writes are allowed. Conflicts keep both device copies available.
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.FADeviceSync = api;
    root.faDeviceSyncEnable = function () {
      api.enable().catch(function (e) {
        const last = root.localStorage && root.localStorage.getItem("faDeviceSyncLastStatus") || "";
        if (!last.startsWith("안전 동기화 실패:")) factoryReport(e);
      });
    };
    root.faDeviceSyncNow = function () {
      if (!api.isEnabled()) { root.alert("먼저 [안전 동기화 시작]을 눌러 이 기기의 백업을 만들고 연결을 승인하세요."); return; }
      api.syncNow(true).catch(function () {});
    };
    root.faDeviceSyncDisable = function () { api.disable(); };
    root.faDeviceSyncShowConflicts = function () {
      const host = root.document && root.document.getElementById("fa_device_sync_conflicts");
      if (!host) return;
      const conflicts = api.getConflicts();
      host.replaceChildren();
      if (!conflicts.length) {
        host.textContent = "현재 남아 있는 동기화 충돌이 없습니다.";
        return;
      }
      const intro = root.document.createElement("p");
      intro.textContent = conflicts.length + "건의 충돌이 보관되어 있습니다. 아래 항목은 양쪽 데이터를 자동 삭제하지 않았습니다.";
      host.appendChild(intro);
      conflicts.forEach(function (item, index) {
        const card = root.document.createElement("div");
        card.style.cssText = "border:1px solid var(--line);border-radius:8px;padding:10px;margin:8px 0;background:#fff";
        const title = root.document.createElement("b");
        title.textContent = (index + 1) + ". " + String(item.store || "기록") + " · " + String(item.key || "알 수 없는 항목");
        const detail = root.document.createElement("p");
        detail.style.cssText = "font-size:12px;line-height:1.6;margin:6px 0 0";
        detail.textContent = String(item.reason || "수동 확인이 필요합니다.") + " · 기기 " + String(item.deviceId || "알 수 없음") + " · " + String(item.updatedAt || "");
        card.appendChild(title);
        card.appendChild(detail);
        host.appendChild(card);
      });
    };
  }
  if (root && root.document) api.install();
  function factoryReport(error) {
    const message = "안전 동기화 설정 실패: " + (error && error.message ? error.message : String(error));
    try { root.localStorage.setItem("faDeviceSyncLastStatus", message); } catch (_) {}
    const el = root.document && root.document.getElementById("fa_device_sync_status");
    if (el) el.textContent = message;
    if (root.alert) root.alert(message);
  }
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : null), function (root) {
  "use strict";

  const VERSION = 1;
  const ROOT_PATH = "sync/v1/devices";
  const ENABLED_KEY = "faDeviceSyncEnabled";
  const DEVICE_KEY = "faDeviceSyncDeviceId";
  const LABEL_KEY = "faDeviceSyncDeviceLabel";
  const META_KEY = "faDeviceSyncMeta";
  const SEEN_KEY = "faDeviceSyncSeen";
  const CONFLICT_KEY = "faDeviceSyncConflicts";
  const BACKUP_GATE_KEY = "faDeviceSyncPreflightDone";
  const ALLOWED_LS = /^(frameAtlas[\w-]*|memo25_[\w-]*|rec30_[\w-]*|faReview57_[\w-]*|img31|faPhotoUrlVault525)$/;
  const STORES = new Set(["places", "pmeta", "pblob"]);
  let installed = false;
  let busy = false;
  let rerunRequested = false;
  let suppress = 0;
  let timer = null;

  function parse(raw, fallback) {
    try { return raw == null ? fallback : JSON.parse(raw); } catch (_) { return fallback; }
  }
  function readState(key, fallback) {
    if (!root || !root.localStorage) return fallback;
    return parse(root.localStorage.getItem(key), fallback);
  }
  function writeState(key, value) {
    if (!root || !root.localStorage) return;
    root.localStorage.setItem(key, JSON.stringify(value));
  }
  function enabled() {
    return !!root && root.localStorage.getItem(ENABLED_KEY) === "1";
  }
  function stableStringify(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
    return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
  }
  function fallbackHash(bytes) {
    let h = 2166136261;
    for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16) + "-" + bytes.length;
  }
  async function digest(bytes) {
    if (root && root.crypto && root.crypto.subtle) {
      const hash = await root.crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
    }
    return fallbackHash(bytes);
  }
  async function fingerprint(store, value) {
    if (store === "pblob") {
      if (!(value instanceof Blob)) throw new Error("사진 데이터가 Blob 형식이 아닙니다.");
      return digest(new Uint8Array(await value.arrayBuffer()));
    }
    const text = store === "ls" ? String(value) : stableStringify(value);
    return digest(new TextEncoder().encode(text));
  }
  function base64Url(text) {
    const bytes = new TextEncoder().encode(String(text));
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  function base64Bytes(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  }
  function encodeText(text) {
    return base64Bytes(new TextEncoder().encode(String(text)));
  }
  function decodeText(text) {
    const binary = atob(String(text || ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function logicalId(store, key) { return store + "\u0000" + String(key); }
  function keyPath(key, extension) { return base64Url(key) + (extension || ".json"); }
  function inferDeviceLabel() {
    const ua = root && root.navigator ? root.navigator.userAgent || "" : "";
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua)) return "iPad";
    if (/Android/i.test(ua)) return "Android";
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/Macintosh|Mac OS/i.test(ua)) return "Mac";
    return "기기";
  }
  function newId() {
    if (root.crypto && typeof root.crypto.randomUUID === "function") return root.crypto.randomUUID().replace(/-/g, "");
    const bytes = new Uint8Array(16);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  }
  function deviceId() {
    let id = root.localStorage.getItem(DEVICE_KEY);
    if (!/^[a-f0-9]{24,64}$/i.test(id || "")) {
      id = newId();
      root.localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }
  function localMeta() { return readState(META_KEY, {}); }
  function markLocal(store, key, deleted) {
    if (!root || suppress || root.__faDeviceSyncApplying || root.__fa532SyncApplying) return;
    const id = logicalId(store, key), meta = localMeta();
    meta[id] = { updatedAt: new Date().toISOString(), deleted: !!deleted };
    writeState(META_KEY, meta);
    schedule("변경사항 감지 · 동기화 대기");
  }
  function updateRemoteMeta(store, key, entry) {
    const id = logicalId(store, key), meta = localMeta();
    meta[id] = { updatedAt: entry.updatedAt || new Date().toISOString(), deleted: !!entry.deleted };
    writeState(META_KEY, meta);
  }
  function safeStatus(message, kind) {
    if (!root || !root.document) return;
    try { root.localStorage.setItem("faDeviceSyncLastStatus", String(message)); } catch (_) {}
    const status = root.document.getElementById("fa_device_sync_status");
    if (status) status.textContent = String(message);
    let banner = root.document.getElementById("fa-device-sync-banner");
    if (kind === "ok" && !message.includes("충돌")) {
      if (banner) banner.remove();
      return;
    }
    if (!banner && kind && kind !== "quiet") {
      banner = root.document.createElement("div");
      banner.id = "fa-device-sync-banner";
      banner.className = "notice";
      banner.style.cssText = "margin:10px 14px;line-height:1.55";
      const host = root.document.querySelector(".top") || root.document.body;
      host.prepend(banner);
    }
    if (banner) {
      banner.textContent = String(message);
      banner.style.display = kind ? "block" : "none";
    }
  }
  function reportError(error, manual) {
    const msg = "안전 동기화 실패: " + (error && error.message ? error.message : String(error));
    safeStatus(msg, "error");
    if (manual && root && root.alert) root.alert(msg);
  }
  function config() {
    const c = readState("faGH", {});
    const repo = String(c.repo || "").trim();
    const token = String(c.token || "").trim();
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !token) throw new Error("먼저 GitHub 백업·동기화 화면에서 저장소와 토큰을 저장하세요.");
    return { repo, token };
  }
  function apiPath(repo, path) {
    return "https://api.github.com/repos/" + repo + "/contents/" + path.split("/").map(encodeURIComponent).join("/");
  }
  function headers(token, accept) {
    return { Authorization: "Bearer " + token, Accept: accept || "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  }
  async function apiResponse(url, token, options) {
    const response = await fetch(url, Object.assign({ headers: headers(token) }, options || {}));
    if (!response.ok) {
      let detail = "";
      try { const body = await response.clone().json(); detail = body.message ? " — " + body.message : ""; } catch (_) {}
      const err = new Error("GitHub 응답 " + response.status + detail);
      err.status = response.status;
      throw err;
    }
    return response;
  }
  async function verifyPrivateRepo(c) {
    const res = await apiResponse("https://api.github.com/repos/" + c.repo.split("/").map(encodeURIComponent).join("/"), c.token, {});
    const repo = await res.json();
    if (repo.private !== true) throw new Error("개인 메모·사진 보호를 위해 비공개(private) 저장소만 사용할 수 있습니다. 공개 저장소에는 동기화 데이터를 전송하지 않았습니다.");
    if (repo.permissions && repo.permissions.push === false) throw new Error("이 토큰에는 저장소 쓰기 권한이 없습니다. Contents 읽기/쓰기 권한을 확인하세요.");
    return repo;
  }
  async function getMeta(c, path) {
    const res = await fetch(apiPath(c.repo, path), { headers: headers(c.token), cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.clone().json()).message || ""; } catch (_) {}
      throw new Error("파일 확인 실패 " + res.status + (detail ? " — " + detail : ""));
    }
    const j = await res.json();
    if (!j || typeof j.sha !== "string") throw new Error("GitHub 파일 메타데이터를 확인할 수 없습니다: " + path);
    return { sha: j.sha, size: j.size || 0, type: j.type || "" };
  }
  async function readFile(c, path, binary) {
    const res = await fetch(apiPath(c.repo, path), { headers: headers(c.token, "application/vnd.github.raw+json"), cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("파일 읽기 실패 " + res.status + ": " + path);
    if (binary) return res.blob();
    return res.text();
  }
  async function putFile(c, path, payload, sha, binary) {
    let content;
    if (binary) {
      if (!(payload instanceof Blob)) throw new Error("사진 파일 형식이 올바르지 않습니다.");
      if (payload.size > 650000) throw new Error("사진 파일이 650KB를 넘습니다. 이미지를 줄인 뒤 다시 동기화하세요.");
      content = base64Bytes(new Uint8Array(await payload.arrayBuffer()));
    } else {
      const bytes = new TextEncoder().encode(String(payload));
      if (bytes.length > 750000) throw new Error("동기화 JSON이 750KB를 넘습니다. 전체 백업 파일 하나로 합치지 말고 데이터를 정리한 뒤 다시 시도하세요.");
      content = base64Bytes(bytes);
    }
    const body = { message: "FRAME ATLAS 안전 동기화: " + path.split("/").slice(-2).join("/"), content };
    if (sha) body.sha = sha;
    const response = await fetch(apiPath(c.repo, path), {
      method: "PUT",
      headers: headers(c.token),
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      let detail = "";
      try { detail = (await response.clone().json()).message || ""; } catch (_) {}
      const err = new Error("업로드 실패 " + response.status + (detail ? " — " + detail : "") + ". 원본은 이 기기에 유지했습니다.");
      err.status = response.status;
      throw err;
    }
    const result = await response.json();
    if (!result || !result.content || !result.content.sha) throw new Error("업로드 응답에 파일 SHA가 없습니다.");
    return result.content.sha;
  }
  async function listDevices(c) {
    const res = await fetch(apiPath(c.repo, ROOT_PATH), { headers: headers(c.token), cache: "no-store" });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error("기기 목록 읽기 실패 " + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("동기화 기기 목록 형식이 올바르지 않습니다.");
    return data.filter(v => v && v.type === "dir" && /^[a-f0-9]{24,64}$/i.test(v.name)).map(v => v.name);
  }
  async function loadManifest(c, id) {
    const path = ROOT_PATH + "/" + id + "/manifest.json";
    const meta = await getMeta(c, path);
    if (!meta) return { path, sha: null, data: { app: "FRAME ATLAS", schema: VERSION, deviceId: id, records: {} } };
    const raw = await readFile(c, path, false);
    let data;
    try { data = JSON.parse(raw); } catch (_) { throw new Error("기기 manifest JSON이 손상되었습니다: " + id); }
    if (!data || data.app !== "FRAME ATLAS" || data.schema !== VERSION || data.deviceId !== id || !data.records || typeof data.records !== "object" || Array.isArray(data.records)) {
      throw new Error("지원하지 않는 기기 manifest 형식입니다: " + id);
    }
    return { path, sha: meta.sha, data };
  }
  async function collectRecords() {
    const map = new Map();
    const add = async (store, key, value) => {
      if (value === undefined || value === null) return;
      const id = logicalId(store, key);
      map.set(id, { id, store, key: String(key), value, fingerprint: await fingerprint(store, value) });
    };
    let ls = {};
    if (typeof bkLS === "function") {
      try { ls = bkLS() || {}; } catch (_) {}
    } else {
      for (let i = 0; i < root.localStorage.length; i++) {
        const key = root.localStorage.key(i);
        if (key && ALLOWED_LS.test(key)) ls[key] = root.localStorage.getItem(key);
      }
    }
    for (const key of Object.keys(ls)) if (ALLOWED_LS.test(key) && typeof ls[key] === "string") await add("ls", key, ls[key]);
    if (typeof IDB === "undefined" || !IDB || typeof IDB.keys !== "function") throw new Error("IndexedDB를 사용할 수 없어 장소·사진을 안전하게 동기화할 수 없습니다.");
    const placeKeys = await IDB.keys("places");
    for (const key of placeKeys) {
      const value = await IDB.get("places", key);
      if (value && typeof value === "object" && value.id != null) await add("places", key, value);
    }
    for (const store of ["pmeta", "pblob"]) {
      const keys = await IDB.keys(store);
      for (const key of keys) {
        const value = await IDB.get(store, key);
        if (value != null) await add(store, key, value);
      }
    }
    return map;
  }
  async function readPeerValue(c, entry) {
    if (entry.store === "pblob") {
      const blob = await readFile(c, entry.path, true);
      if (!blob) throw new Error("동기화 사진 파일을 찾을 수 없습니다: " + entry.key);
      const buffer = await blob.arrayBuffer();
      return new Blob([buffer], { type: entry.mime || blob.type || "image/jpeg" });
    }
    const raw = await readFile(c, entry.path, false);
    if (raw == null) throw new Error("동기화 레코드 파일을 찾을 수 없습니다: " + entry.key);
    let env;
    try { env = JSON.parse(raw); } catch (_) { throw new Error("동기화 레코드 JSON이 손상되었습니다: " + entry.key); }
    if (!env || env.app !== "FRAME ATLAS" || env.schema !== VERSION || env.store !== entry.store || String(env.key) !== String(entry.key) || env.deleted) {
      throw new Error("동기화 레코드가 manifest와 일치하지 않습니다: " + entry.key);
    }
    return env.value;
  }
  async function applyLocal(store, key, value, deleted, sourceEntry) {
    root.__faDeviceSyncApplying = true;
    root.__fa532SyncApplying = true;
    suppress++;
    try {
      if (store === "ls") {
        if (deleted) {
          if (typeof LSX !== "undefined" && LSX.removeItem) LSX.removeItem(key);
          else root.localStorage.removeItem(key);
        } else {
          const raw = typeof value === "string" ? value : JSON.stringify(value);
          if (typeof LSX !== "undefined" && LSX.setItem) LSX.setItem(key, raw);
          else root.localStorage.setItem(key, raw);
        }
      } else if (deleted) {
        await IDB.del(store, key);
      } else if (store === "pblob") {
        await IDB.put(store, key, value);
      } else {
        await IDB.put(store, key, value);
      }
      if (store === "pmeta" && typeof PMETA !== "undefined") {
        if (deleted) delete PMETA[key]; else PMETA[key] = value;
      }
      if ((store === "pblob" || (store === "pmeta" && deleted)) && typeof PCACHE !== "undefined" && PCACHE[key]) {
        try { URL.revokeObjectURL(PCACHE[key]); } catch (_) {}
        delete PCACHE[key];
      }
      if (store === "pblob" && !deleted && typeof PCACHE !== "undefined" && value instanceof Blob) {
        PCACHE[key] = URL.createObjectURL(value);
      }
      if (store === "places" && typeof DB !== "undefined" && Array.isArray(DB)) {
        const at = DB.findIndex(function (p) { return p && String(p.id) === String(key); });
        if (deleted) {
          if (at >= 0) DB.splice(at, 1);
        } else if (at >= 0) {
          DB[at] = value;
        } else {
          if (typeof prep === "function") prep(value);
          if (typeof applyTips === "function") applyTips(value);
          DB.push(value);
        }
      }
    } finally {
      suppress--;
      root.__faDeviceSyncApplying = false;
      root.__fa532SyncApplying = false;
    }
    updateRemoteMeta(store, key, { updatedAt: sourceEntry && sourceEntry.updatedAt ? sourceEntry.updatedAt : new Date().toISOString(), deleted });
  }
  function mergeRecord(store, localValue, remoteValue) {
    if (store === "pblob") return { value: localValue, changed: false, conflicts: 1, action: "preserve-local-photo" };
    if (store === "ls") {
      if (typeof root.FABackupMerge !== "undefined" && root.FABackupMerge && typeof root.FABackupMerge.mergeRaw === "function") {
        const result = root.FABackupMerge.mergeRaw(String(localValue), String(remoteValue));
        return { value: result.raw, changed: result.changed, conflicts: result.conflicts || (result.error ? 1 : 0), action: "merge-json" };
      }
      return { value: localValue, changed: false, conflicts: 1, action: "preserve-local-no-merger" };
    }
    if (typeof root.FABackupMerge !== "undefined" && root.FABackupMerge && typeof root.FABackupMerge.mergeValues === "function") {
      const result = root.FABackupMerge.mergeValues(localValue, remoteValue);
      return { value: result.value, changed: result.changed, conflicts: result.conflicts || 0, action: "merge-object" };
    }
    return { value: localValue, changed: false, conflicts: 1, action: "preserve-local-no-merger" };
  }
  function remoteSupersedesDelete(deleteTime, remoteTime) {
    const deleted = typeof deleteTime === "number" ? deleteTime : Date.parse(deleteTime || 0);
    const changed = typeof remoteTime === "number" ? remoteTime : Date.parse(remoteTime || 0);
    return Number.isFinite(changed) && changed > deleted;
  }
  function setConflict(conflicts, peerId, entry, reason) {
    conflicts[peerId + "|" + entry.id] = {
      deviceId: peerId,
      store: entry.store,
      key: entry.key,
      reason: reason || "동일 항목을 여러 기기에서 수정했습니다.",
      updatedAt: entry.updatedAt || new Date().toISOString()
    };
  }
  async function syncNow(manual) {
    if (!root || !root.localStorage) throw new Error("브라우저 저장소를 사용할 수 없습니다.");
    if (busy) {
      rerunRequested = true;
      return { skipped: true, queued: true, message: "동기화 중 발생한 변경사항을 다음 실행에 반영합니다." };
    }
    if (!enabled() && !manual) return { skipped: true, message: "안전 동기화가 아직 활성화되지 않았습니다." };
    busy = true;
    const counts = { added: 0, updated: 0, deleted: 0, uploaded: 0, conflicts: 0, errors: 0 };
    try {
      const c = config();
      const repoInfo = await verifyPrivateRepo(c);
      if (repoInfo.private !== true) throw new Error("비공개 저장소 확인에 실패했습니다.");
      const id = deviceId();
      const label = root.localStorage.getItem(LABEL_KEY) || inferDeviceLabel();
      root.localStorage.setItem(LABEL_KEY, label);
      const own = await loadManifest(c, id);
      const seen = readState(SEEN_KEY, {});
      const conflictMap = readState(CONFLICT_KEY, {});
      const localMetaMap = localMeta();
      const local = await collectRecords();
      const originalFingerprints = new Map();
      local.forEach((r, key) => originalFingerprints.set(key, r.fingerprint));
      const remoteTouched = new Set();
      const peers = (await listDevices(c)).filter(v => v !== id).sort();

      for (const peerId of peers) {
        const peer = await loadManifest(c, peerId);
        const peerEntries = Object.entries(peer.data.records || {}).sort((a, b) => {
          const rank = { ls: 0, places: 1, pmeta: 2, pblob: 3 };
          return (rank[a[1].store] ?? 9) - (rank[b[1].store] ?? 9);
        });
        for (const pair of peerEntries) {
          const rid = pair[0], entry = pair[1];
          if (!entry || !STORES.has(entry.store) && entry.store !== "ls") continue;
          if (entry.id && entry.id !== rid) continue;
          const seenId = peerId + "|" + rid;
          const current = local.get(rid);
          if (seen[seenId] === entry.revision) {
            if (conflictMap[seenId] && current && !entry.deleted && current.fingerprint === entry.fingerprint) {
              delete conflictMap[seenId];
            }
            continue;
          }
          const base = own.data.records[rid];
          const baseMatchesLocal = !!(current && base && !base.deleted && base.fingerprint === current.fingerprint);
          const priorLocalFingerprint = originalFingerprints.get(rid);
          const localChanged = !!current && (!base || base.deleted || base.fingerprint !== current.fingerprint);
          const alreadyMergedRemote = remoteTouched.has(rid);

          if (entry.deleted) {
            if (!current) {
              updateRemoteMeta(entry.store, entry.key, entry);
            } else if (baseMatchesLocal && !localChanged && !alreadyMergedRemote) {
              await applyLocal(entry.store, entry.key, null, true, entry);
              local.delete(rid);
              counts.deleted++;
            } else {
              counts.conflicts++;
              setConflict(conflictMap, peerId, Object.assign({ id: rid }, entry), "원격 기기에서 삭제했지만 현재 기기에도 변경 또는 미동기화 기록이 있어 자동 삭제하지 않았습니다.");
            }
            seen[seenId] = entry.revision;
            remoteTouched.add(rid);
            continue;
          }

          if (current && current.fingerprint === entry.fingerprint) {
            delete conflictMap[seenId];
            seen[seenId] = entry.revision;
            continue;
          }

          if (!current) {
            const currentDeleteMeta = localMeta()[rid];
            const localDeleteTime = (currentDeleteMeta && currentDeleteMeta.deleted && currentDeleteMeta.updatedAt) || (base && base.deleted && base.updatedAt) || 0;
            if ((currentDeleteMeta && currentDeleteMeta.deleted || base && base.deleted) &&
                !remoteSupersedesDelete(localDeleteTime, entry.updatedAt)) {
              counts.conflicts++;
              setConflict(conflictMap, peerId, Object.assign({ id: rid }, entry), "현재 기기의 삭제 기록보다 원격 변경 시각이 늦다는 점이 확인되지 않아 자동 복구하지 않았습니다.");
              seen[seenId] = entry.revision;
              remoteTouched.add(rid);
              continue;
            }
          }

          const remoteValue = await readPeerValue(c, entry);
          const remoteRec = { id: rid, store: entry.store, key: entry.key, value: remoteValue, fingerprint: entry.fingerprint };
          if (!current) {
            await applyLocal(entry.store, entry.key, remoteValue, false, entry);
            local.set(rid, remoteRec);
            counts.added++;
            delete conflictMap[seenId];
          } else if (baseMatchesLocal && !alreadyMergedRemote) {
            await applyLocal(entry.store, entry.key, remoteValue, false, entry);
            local.set(rid, remoteRec);
            counts.updated++;
            delete conflictMap[seenId];
          } else {
            const merged = mergeRecord(entry.store, current.value, remoteValue);
            if (merged.changed && merged.value !== current.value) {
              await applyLocal(entry.store, entry.key, merged.value, false, null);
              const newFingerprint = await fingerprint(entry.store, merged.value);
              local.set(rid, Object.assign({}, current, { value: merged.value, fingerprint: newFingerprint }));
              counts.updated++;
            }
            if (merged.conflicts > 0) {
              counts.conflicts += merged.conflicts;
              setConflict(conflictMap, peerId, Object.assign({ id: rid }, entry), entry.store === "pblob" ? "같은 사진 키에 서로 다른 이미지가 있어 현재 사진을 유지했습니다. 양쪽 기기의 파일은 보존되어 있습니다." : "같은 항목의 일부 값이 달라 현재 기기 값을 우선 보존했습니다.");
            } else {
              delete conflictMap[seenId];
            }
          }
          seen[seenId] = entry.revision;
          remoteTouched.add(rid);
          if (priorLocalFingerprint && current && priorLocalFingerprint !== current.fingerprint) {
            /* Keep the conflict marker when local edits overlapped an unseen remote revision. */
          }
        }
      }

      const fresh = await collectRecords();
      const metaMap = localMeta();
      const nextRecords = Object.assign({}, own.data.records || {});
      for (const [rid, oldEntry] of Object.entries(nextRecords)) {
        if (fresh.has(rid)) continue;
        const m = metaMap[rid];
        if (m && m.deleted && (!oldEntry.deleted || Date.parse(m.updatedAt || 0) > Date.parse(oldEntry.updatedAt || 0))) {
          nextRecords[rid] = Object.assign({}, oldEntry, {
            id: rid, store: oldEntry.store, key: oldEntry.key,
            deleted: true, fingerprint: "", updatedAt: m.updatedAt || new Date().toISOString(),
            revision: newId(), mime: oldEntry.mime || ""
          });
        }
        /* No delete marker means this absence might be an interrupted restore, so preserve the remote copy. */
      }
      for (const [rid, rec] of fresh) {
        const oldEntry = nextRecords[rid];
        if (oldEntry && !oldEntry.deleted && oldEntry.fingerprint === rec.fingerprint) continue;
        const meta = metaMap[rid] || {};
        const updatedAt = meta.updatedAt || (oldEntry && oldEntry.updatedAt) || new Date().toISOString();
        const ext = rec.store === "pblob" ? ".bin" : ".json";
        const path = ROOT_PATH + "/" + id + "/records/" + rec.store + "/" + keyPath(rec.key, ext);
        let payload, mime = "";
        if (rec.store === "pblob") {
          payload = rec.value;
          mime = payload.type || "application/octet-stream";
        } else {
          payload = JSON.stringify({ app: "FRAME ATLAS", schema: VERSION, deviceId: id, store: rec.store, key: rec.key, updatedAt, value: rec.value });
        }
        let sha = oldEntry && oldEntry.sha && oldEntry.path === path ? oldEntry.sha : null;
        if (!sha) {
          const metaFile = await getMeta(c, path);
          sha = metaFile ? metaFile.sha : null;
          if (metaFile) {
            const remoteSame = rec.store === "pblob"
              ? metaFile.size === rec.value.size
              : false;
            if (!remoteSame && sha) {
              /* Existing orphaned record is updated with its known SHA; a SHA mismatch is handled by GitHub. */
            }
          }
        }
        const newSha = await putFile(c, path, payload, sha, rec.store === "pblob");
        nextRecords[rid] = {
          id: rid, store: rec.store, key: rec.key, path, sha: newSha,
          fingerprint: rec.fingerprint, revision: newId(), updatedAt,
          deleted: false, mime
        };
        counts.uploaded++;
      }
      for (const [rid, m] of Object.entries(metaMap)) {
        if (fresh.has(rid) || !m || !m.deleted || nextRecords[rid]) continue;
        const split = rid.split("\u0000"), store = split[0], key = split.slice(1).join("\u0000");
        if (!(STORES.has(store) || store === "ls")) continue;
        nextRecords[rid] = {
          id: rid, store, key, path: ROOT_PATH + "/" + id + "/records/" + store + "/" + keyPath(key, store === "pblob" ? ".bin" : ".json"),
          sha: null, fingerprint: "", updatedAt: m.updatedAt || new Date().toISOString(), revision: newId(), deleted: true, mime: ""
        };
      }

      const manifestData = {
        app: "FRAME ATLAS", schema: VERSION, deviceId: id, label,
        updatedAt: new Date().toISOString(), records: nextRecords
      };
      const manifestText = JSON.stringify(manifestData);
      if (new TextEncoder().encode(manifestText).length > 750000) throw new Error("이 기기의 동기화 목록이 750KB를 넘습니다. 전체 백업 파일로 덮어쓰지 않았으며, 데이터는 로컬에 유지했습니다.");
      const newManifestSha = await putFile(c, own.path, manifestText, own.sha, false);
      writeState(SEEN_KEY, seen);
      writeState(CONFLICT_KEY, conflictMap);
      const conflictCount = Object.keys(conflictMap).length;
      if (counts.added + counts.updated + counts.deleted > 0) {
        try {
          if (typeof updateMetrics === "function") updateMetrics();
          if (typeof renderChips === "function") renderChips();
          if (typeof render === "function") render();
          if (typeof renderHome === "function") renderHome();
        } catch (_) {}
      }
      const status = "동기화 완료 · 추가 " + counts.added + " · 갱신 " + counts.updated + " · 삭제 반영 " + counts.deleted + " · 업로드 " + counts.uploaded + (conflictCount ? " · 충돌 확인 " + conflictCount : "");
      safeStatus(status, conflictCount ? "warn" : "ok");
      try { root.dispatchEvent(new Event("faDeviceSyncComplete")); } catch (_) {}
      return Object.assign({ ok: true, deviceId: id, conflictsPending: conflictCount, manifestSha: newManifestSha, message: status }, counts);
    } catch (error) {
      reportError(error, !!manual);
      throw error;
    } finally {
      busy = false;
      if (rerunRequested && enabled()) {
        rerunRequested = false;
        setTimeout(function () { syncNow(false).catch(function () {}); }, 500);
      } else {
        rerunRequested = false;
      }
    }
  }
  async function enable() {
    const c = config();
    await verifyPrivateRepo(c);
    if (enabled()) return await syncNow(true);
    const backupGateAt = Number(root.localStorage.getItem(BACKUP_GATE_KEY) || 0);
    if (!backupGateAt || !Number.isFinite(backupGateAt) || Date.now() - backupGateAt > 60 * 60 * 1000) {
      if (typeof faDownloadPreApplyBackup === "function") await faDownloadPreApplyBackup();
      else throw new Error("전체 백업 기능을 찾을 수 없습니다. 먼저 DB 백업/복원에서 백업 파일을 저장하세요.");
      root.localStorage.setItem(BACKUP_GATE_KEY, String(Date.now()));
      safeStatus("안전 백업 다운로드를 시작했습니다. 파일이 실제로 저장된 것을 확인한 뒤 [안전 동기화 시작]을 다시 누르세요.", "warn");
      return { backupRequired: true };
    }
    const ok = root.confirm("이 기기의 개인 메모·촬영 기록·추가 장소·사진을 비공개 저장소 " + c.repo + "에 동기화합니다. 공개 저장소에는 전송하지 않습니다. 다른 기기에서도 같은 저장소와 토큰을 설정해야 합니다. 계속할까요?");
    if (!ok) return { cancelled: true };
    root.localStorage.setItem(ENABLED_KEY, "1");
    root.localStorage.removeItem(BACKUP_GATE_KEY);
    const result = await syncNow(true);
    return result;
  }
  function disable() {
    root.localStorage.removeItem(ENABLED_KEY);
    safeStatus("자동 동기화를 일시중지했습니다. 저장소와 원격 기록은 삭제하지 않았습니다.", "warn");
  }
  function schedule(message) {
    if (!root || !enabled() || root.__faDeviceSyncApplying || root.__fa532SyncApplying) return;
    if (message) safeStatus(message, "pending");
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      syncNow(false).catch(function () {});
    }, 3500);
  }
  function wrapMutationHooks() {
    if (typeof LSX !== "undefined" && LSX && typeof LSX.setItem === "function" && !LSX.__faDeviceSyncWrapped) {
      const set = LSX.setItem.bind(LSX);
      const remove = typeof LSX.removeItem === "function" ? LSX.removeItem.bind(LSX) : null;
      try {
        LSX.setItem = function (key, value) {
          const result = set(key, value);
          if (ALLOWED_LS.test(String(key))) markLocal("ls", String(key), false);
          return result;
        };
        if (remove) LSX.removeItem = function (key) {
          const result = remove(key);
          if (ALLOWED_LS.test(String(key))) markLocal("ls", String(key), true);
          return result;
        };
        LSX.__faDeviceSyncWrapped = true;
      } catch (_) {}
    }
    if (typeof IDB !== "undefined" && IDB && !IDB.__faDeviceSyncWrapped) {
      for (const method of ["put", "del"]) {
        if (typeof IDB[method] !== "function") continue;
        const original = IDB[method].bind(IDB);
        try {
          IDB[method] = function (store, key, value) {
            const result = original.apply(null, arguments);
            if (STORES.has(String(store))) {
              const changed = function () { markLocal(String(store), String(key), method === "del"); };
              if (result && typeof result.then === "function") result.then(changed, function () {});
              else changed();
            }
            return result;
          };
        } catch (_) {}
      }
      if (typeof IDB.clear === "function") {
        const clear = IDB.clear.bind(IDB);
        try {
          IDB.clear = function (store) {
            if (STORES.has(String(store)) && !suppress && !root.__faDeviceSyncApplying && !root.__fa532SyncApplying) {
              const meta = localMeta();
              for (const id of Object.keys(meta)) if (id.startsWith(String(store) + "\u0000")) {
                meta[id] = { updatedAt: new Date().toISOString(), deleted: true };
              }
              writeState(META_KEY, meta);
            }
            const result = clear.apply(null, arguments);
            if (STORES.has(String(store))) schedule("기록 변경 감지 · 동기화 대기");
            return result;
          };
          IDB.__faDeviceSyncWrapped = true;
        } catch (_) {}
      }
    }
  }
  function install() {
    if (installed || !root || !root.document) return;
    installed = true;
    wrapMutationHooks();
    root.addEventListener("online", function () { if (enabled()) syncNow(false).catch(function () {}); });
    root.addEventListener("focus", function () { if (enabled()) syncNow(false).catch(function () {}); });
    root.addEventListener("pageshow", function () { if (enabled()) syncNow(false).catch(function () {}); });
    root.document.addEventListener("visibilitychange", function () {
      if (!root.document.hidden && enabled()) syncNow(false).catch(function () {});
    });
    if (root.__faStoreReady && typeof root.__faStoreReady.then === "function") {
      root.__faStoreReady.then(function () { setTimeout(function () { if (enabled()) syncNow(false).catch(function () {}); }, 2200); }).catch(function () {});
    } else {
      setTimeout(function () { if (enabled()) syncNow(false).catch(function () {}); }, 3200);
    }
  }
  function getConflicts() {
    const map = readState(CONFLICT_KEY, {});
    return Object.entries(map).map(function (pair) {
      return Object.assign({ id: pair[0] }, pair[1] || {});
    }).sort(function (a, b) { return String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")); });
  }
  return {
    version: VERSION,
    install,
    syncNow,
    enable,
    disable,
    isEnabled: enabled,
    schedule,
    getConflicts,
    core: { fingerprint, stableStringify, logicalId, keyPath, mergeRecord, fallbackHash, encodeText, decodeText, remoteSupersedesDelete }
  };
});
