/* FRAME ATLAS legacy V6 recovery audit.
 * Read-only audit + export of the old FRAME_ATLAS_V6 database.
 * Never mutates IndexedDB, localStorage, or the live app's records.
 */
(function (root) {
  "use strict";
  const DB_NAME = "FRAME_ATLAS_V6";
  let latestSnapshot = null;

  function nonBlank(value) { return typeof value === "string" && value.trim().length > 0; }

  function summarizeUserDB(userDB, photoRows) {
    const map = userDB && userDB.places && typeof userDB.places === "object" && !Array.isArray(userDB.places) ? userDB.places : {};
    const entries = Object.entries(map);
    const count = predicate => entries.filter(([, value]) => value && typeof value === "object" && predicate(value)).length;
    return {
      schemaVersion: userDB && Number.isFinite(Number(userDB.schemaVersion)) ? Number(userDB.schemaVersion) : null,
      updatedAt: userDB && typeof userDB.updatedAt === "string" ? userDB.updatedAt : "",
      places: entries.length,
      favorites: count(v => v.favorite === true),
      notes: count(v => nonBlank(v.notes)),
      logs: count(v => Array.isArray(v.logs) && v.logs.length > 0),
      photoReferences: count(v => Array.isArray(v.photos) && v.photos.length > 0),
      coverReferences: count(v => v.coverId !== null && v.coverId !== undefined && v.coverId !== ""),
      ratings: count(v => Number(v.rating) > 0),
      photoRecords: Array.isArray(photoRows) ? photoRows.length : 0
    };
  }

  function readStore(db, storeName) {
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(storeName)) return resolve([]);
      let tx;
      try {
        tx = db.transaction([storeName], "readonly");
        const store = tx.objectStore(storeName);
        const keyRequest = store.getAllKeys();
        const valueRequest = store.getAll();
        let keys, values, keysDone = false, valuesDone = false;
        keyRequest.onsuccess = () => { keys = keyRequest.result || []; keysDone = true; };
        valueRequest.onsuccess = () => { values = valueRequest.result || []; valuesDone = true; };
        tx.oncomplete = () => {
          if (!keysDone || !valuesDone) return reject(new Error("저장소 데이터 읽기가 완료되지 않았습니다: " + storeName));
          resolve(keys.map((key, i) => ({ key, value: values[i] })));
        };
        keyRequest.onerror = () => reject(keyRequest.error || new Error("저장소 키 읽기에 실패했습니다: " + storeName));
        valueRequest.onerror = () => reject(valueRequest.error || new Error("저장소 데이터 읽기에 실패했습니다: " + storeName));
        tx.onerror = () => reject(tx.error || new Error("읽기 전용 트랜잭션 실패: " + storeName));
        tx.onabort = () => reject(tx.error || new Error("읽기 전용 트랜잭션이 취소되었습니다: " + storeName));
      } catch (error) { reject(error); }
    });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("이전 사진 파일을 읽지 못했습니다."));
      reader.readAsDataURL(blob);
    });
  }

  async function makeJsonSafe(value, seen) {
    if (value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value)) return value;
    if (typeof value === "bigint") return { $faType: "BigInt", value: value.toString() };
    if (value instanceof Date) return { $faType: "Date", value: value.toISOString() };
    if (typeof Blob !== "undefined" && value instanceof Blob) {
      return { $faType: "Blob", mime: value.type || "application/octet-stream", size: value.size, dataUrl: await blobToDataUrl(value) };
    }
    if (value instanceof ArrayBuffer) {
      const bytes = new Uint8Array(value); let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return { $faType: "ArrayBuffer", base64: btoa(binary), byteLength: bytes.length };
    }
    if (ArrayBuffer.isView(value)) return { $faType: value.constructor && value.constructor.name || "TypedArray", values: Array.from(value) };
    const active = seen || new WeakSet();
    if (typeof value === "object") {
      if (active.has(value)) throw new Error("이전 데이터에 순환 참조가 있어 JSON 백업을 만들 수 없습니다.");
      active.add(value); let out;
      if (Array.isArray(value)) {
        out = [];
        for (const item of value) out.push(await makeJsonSafe(item, active));
      } else {
        out = {};
        for (const key of Object.keys(value)) out[key] = await makeJsonSafe(value[key], active);
      }
      active.delete(value); return out;
    }
    return String(value);
  }

  async function inspect() {
    if (!root.indexedDB) throw new Error("이 브라우저에서 IndexedDB를 사용할 수 없습니다.");
    if (typeof root.indexedDB.databases !== "function") {
      throw new Error("이 브라우저는 기존 데이터베이스 목록 확인을 지원하지 않습니다. 안전을 위해 새 DB를 만들지 않았습니다.");
    }
    const databases = await root.indexedDB.databases();
    if (!databases.some(item => item && item.name === DB_NAME)) throw new Error("이 브라우저에서 이전 데이터베이스 " + DB_NAME + "을 찾지 못했습니다.");
    const db = await new Promise((resolve, reject) => {
      const request = root.indexedDB.open(DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("이전 데이터베이스를 열 수 없습니다."));
      request.onblocked = () => reject(new Error("이전 데이터베이스가 다른 창에서 사용 중입니다. 다른 FRAME ATLAS 탭을 닫고 다시 시도하세요."));
      request.onupgradeneeded = () => {
        try { request.transaction.abort(); } catch (_) {}
        reject(new Error("예상하지 못한 DB 생성/업그레이드 요청이 감지되어 중단했습니다. 데이터는 변경하지 않았습니다."));
      };
    });
    try {
      const stores = Array.from(db.objectStoreNames || []);
      const metaRows = await readStore(db, "meta");
      const photoRows = await readStore(db, "photos");
      const userRow = metaRows.find(row => row.key === "userDB");
      const userDB = userRow && userRow.value && typeof userRow.value === "object" ? userRow.value : {};
      const summary = summarizeUserDB(userDB, photoRows);
      latestSnapshot = {
        app: "FRAME ATLAS",
        kind: "legacy-v6-read-only-archive",
        databaseName: DB_NAME,
        exportedAt: new Date().toISOString(),
        schemaVersion: summary.schemaVersion,
        summary,
        objectStores: stores,
        stores: { meta: await makeJsonSafe(metaRows), photos: await makeJsonSafe(photoRows) }
      };
      return { summary, stores, hasUserDB: !!userRow };
    } finally { db.close(); }
  }

  function downloadSnapshot() {
    if (!latestSnapshot) throw new Error("먼저 이전 V6 데이터 점검을 실행하세요.");
    const blob = new Blob([JSON.stringify(latestSnapshot, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = root.document.createElement("a");
    a.href = url;
    a.download = "frame-atlas-v6-archive-" + new Date().toISOString().slice(0, 10) + ".json";
    a.style.display = "none"; root.document.body.appendChild(a); a.click(); a.remove();
    root.setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function element(tag, className, text) {
    const node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function renderSummary(host, result) {
    host.replaceChildren();
    host.appendChild(element("p", "kicker", result.hasUserDB
      ? "이전 데이터베이스를 읽기 전용으로 확인했습니다. 앱 데이터는 변경하지 않았습니다."
      : "이전 데이터베이스는 열렸지만 meta/userDB 항목을 찾지 못했습니다. 앱 데이터는 변경하지 않았습니다."));
    const table = element("table");
    table.style.cssText = "width:100%;border-collapse:collapse;font-size:13px;margin:8px 0";
    const rows = [
      ["이전 장소별 항목 수", result.summary.places],
      ["즐겨찾기 표시", result.summary.favorites],
      ["내용이 있는 메모", result.summary.notes],
      ["촬영 로그가 있는 항목", result.summary.logs],
      ["사진 참조가 있는 항목", result.summary.photoReferences],
      ["대표사진 참조가 있는 항목", result.summary.coverReferences],
      ["평점이 0보다 큰 항목", result.summary.ratings],
      ["이전 photos 저장소 레코드", result.summary.photoRecords],
      ["DB 스키마 버전", result.summary.schemaVersion == null ? "확인 불가" : result.summary.schemaVersion],
      ["마지막 갱신", result.summary.updatedAt || "확인 불가"]
    ];
    rows.forEach(([label, value]) => {
      const tr = element("tr"), th = element("th", "", label), td = element("td", "", value);
      th.style.cssText = "text-align:left;font-weight:600;padding:6px;border-bottom:1px solid var(--line)";
      td.style.cssText = "text-align:right;padding:6px;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums";
      tr.append(th, td); table.appendChild(tr);
    });
    host.appendChild(table);
    host.appendChild(element("p", "kicker", "이전 데이터는 자동 병합·삭제·동기화하지 않습니다. 먼저 별도 JSON 백업 파일로 보관한 뒤 이관 여부를 결정하세요."));
    const download = element("button", "secondary", "이전 V6 데이터 별도 백업 파일 저장");
    download.type = "button";
    download.addEventListener("click", () => {
      try { downloadSnapshot(); } catch (error) { root.alert("이전 데이터 백업 실패: " + (error.message || error)); }
    });
    host.appendChild(download);
  }

  function addPanel() {
    const doc = root.document;
    if (!doc || doc.getElementById("fa-v6-recovery-panel")) return;
    const body = doc.querySelector("#sheet .filterBody.pj");
    if (!body) return;
    const panel = element("div");
    panel.id = "fa-v6-recovery-panel";
    panel.style.cssText = "margin-top:18px;padding-top:14px;border-top:1px solid var(--line)";
    panel.appendChild(element("h3", "", "이전 V6 데이터 안전 점검"));
    panel.appendChild(element("p", "kicker", "FRAME_ATLAS_V6의 기존 사용자 기록을 읽기 전용으로 점검합니다. 현재 데이터나 사진은 수정·삭제하지 않습니다."));
    const check = element("button", "secondary", "이전 V6 데이터 점검");
    check.type = "button";
    const status = element("div"); status.id = "fa-v6-recovery-result"; status.style.cssText = "margin-top:8px;line-height:1.55";
    check.addEventListener("click", async () => {
      check.disabled = true; status.textContent = "이전 데이터베이스를 읽기 전용으로 확인하고 있습니다…";
      try { renderSummary(status, await inspect()); }
      catch (error) {
        status.replaceChildren();
        status.appendChild(element("p", "kicker", "점검을 완료하지 못했습니다: " + (error && error.message || error)));
        status.appendChild(element("p", "kicker", "데이터베이스를 삭제하거나 변경하지 않았습니다."));
      } finally { check.disabled = false; }
    });
    panel.append(check, status); body.appendChild(panel);
  }

  function install() {
    if (!root || !root.document) return;
    if (typeof root.backup === "function" && !root.backup.__faV6AuditWrapped) {
      const original = root.backup;
      const wrapped = async function () { const result = await original.apply(this, arguments); addPanel(); return result; };
      wrapped.__faV6AuditWrapped = true; root.backup = wrapped;
    }
  }

  root.FALegacyV6Audit = { inspect, summarizeUserDB, makeJsonSafe };
  install();
})(typeof window !== "undefined" ? window : null);
