#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const sourcePath = path.join(__dirname, "..", "v2", "assets", "app.js");
const source = fs.readFileSync(sourcePath, "utf8");
const match = source.match(/function bytesToBase64\(bytes\)\s*\{[\s\S]*?\n\}/);
assert.ok(match, "bytesToBase64 helper must exist in the app");

const context = {
  btoa(binary) {
    return Buffer.from(binary, "binary").toString("base64");
  }
};
vm.runInNewContext(match[0] + "\nthis.bytesToBase64 = bytesToBase64;", context, { timeout: 1000 });

const sizes = [0, 1, 2, 3, 7, 8191, 8192, 32767, 32768, 32769, 65536, 1024 * 1024, 8 * 1024 * 1024];
for (const size of sizes) {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = (i * 37 + 19) & 255;
  const expected = Buffer.from(bytes).toString("base64");
  const actual = context.bytesToBase64(bytes);
  assert.equal(actual, expected, "base64 mismatch for " + size + " bytes");
}

const publishStart = source.indexOf("async function publishCatalog()");
const successfulCatalogPut = source.indexOf('if(!put.ok)throw new Error("카탈로그 저장 실패', publishStart);
const stagingCleanup = source.indexOf("const pendingPhotoKeysToClear=new Set(staged)", publishStart);
assert.ok(publishStart >= 0 && successfulCatalogPut > publishStart, "catalog publish error guard must be present");
assert.ok(stagingCleanup > successfulCatalogPut, "staged photo blobs must only be cleared after successful catalog publish");
assert.ok(source.includes("if(c&&c.assetPath&&!c.pendingAsset)pendingPhotoKeysToClear.add(pendingKey(p.id,c.id));"),
  "retry cleanup must include prior successful asset uploads after a failed catalog commit");


const rawCatalogRead = source.indexOf('const rawCatalogResponse=await fetch("https://raw.githubusercontent.com/casio8000/FRAME_ATLAS/main/"+catalogPath');
const photoPut = source.indexOf('const payload={message:"Add FRAME ATLAS location photo",content:bytesToBase64(bytes),branch:"main"};', publishStart);
const catalogPut = source.indexOf('fetch(repo+catalogPath,{method:"PUT"', publishStart);
const assetDeleteLoop = source.indexOf("for(const assetPath of assetPathsToDelete)", publishStart);
assert.ok(rawCatalogRead > publishStart && rawCatalogRead < photoPut,
  "large remote catalog must be read independently before upload work begins");
assert.ok(photoPut > rawCatalogRead && catalogPut > photoPut,
  "repository photo files must be uploaded before the catalog points to them");
assert.ok(source.includes('const path="v2/assets/places/"+p.id+"/"+c.id+"."+ext;'),
  "photos must be stored under a deterministic repository-relative place/candidate path");
assert.ok(source.includes('c.assetPath=path;c.imageUrl="./assets/places/"+p.id+"/"+c.id+"."+ext;c.pendingAsset=false;'),
  "successful photo upload must set both repository path and relative display URL");
assert.ok(source.includes("sha:currentCatalog.sha"),
  "catalog update must use the current Contents API blob SHA, not a guessed commit SHA");
assert.ok(assetDeleteLoop > successfulCatalogPut,
  "old repository photos must not be deleted until the new catalog publish succeeds");
assert.ok(source.includes('else if(ex.status!==404)throw new Error("사진 파일 경로 확인 실패'),
  "only a true 404 may be treated as a not-yet-existing asset path");
assert.ok(source.includes('if(!up.ok)throw new Error("사진 파일 업로드 실패'),
  "a failed photo upload must stop catalog publication and preserve the local pending file");
assert.ok(source.includes('if(!rawCatalogResponse.ok)throw new Error("최신 카탈로그 원문 읽기 실패'),
  "a failed raw-catalog read must abort instead of publishing against guessed data");

console.log("FRAME ATLAS photo asset tests: Base64 13 sizes (up to 8 MiB), upload ordering, SHA/path checks, and retry cleanup guards passed");
