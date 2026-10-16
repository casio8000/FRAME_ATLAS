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

console.log("FRAME ATLAS photo asset tests: Base64 13 sizes (up to 8 MiB) + retry cleanup guards passed");
