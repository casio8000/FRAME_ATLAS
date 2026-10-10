"use strict";
const assert = require("node:assert/strict");
const { areEqual, mergeRaw, mergeValues } = require("../data/backup-merge.js");

{
  const local = JSON.stringify({ id: "P1", memo: "PC 메모", localOnly: 1 });
  const remote = JSON.stringify({ id: "P1", memo: "아이폰 메모", remoteOnly: 2 });
  const result = mergeRaw(local, remote);
  const value = JSON.parse(result.raw);
  assert.equal(value.memo, "PC 메모", "same-field conflict must preserve local value");
  assert.equal(value.localOnly, 1);
  assert.equal(value.remoteOnly, 2, "remote-only fields must be added");
  assert.equal(result.changed, true);
  assert.equal(result.conflicts, 1);
}

{
  const result = mergeRaw('["L-1","L-2"]', '["L-2","L-3"]');
  assert.deepEqual(JSON.parse(result.raw), ["L-1", "L-2", "L-3"]);
  assert.equal(result.conflicts, 0);
}

{
  const local = JSON.stringify([{ id: "review-1", left: true }]);
  const remote = JSON.stringify([{ id: "review-1", right: true }]);
  const result = mergeRaw(local, remote);
  assert.deepEqual(JSON.parse(result.raw), [{ id: "review-1", left: true, right: true }]);
  assert.equal(result.conflicts, 0);
}

{
  const result = mergeRaw("not-json local memo", "not-json remote memo");
  assert.equal(result.raw, "not-json local memo");
  assert.equal(result.changed, false);
  assert.equal(result.conflicts, 1);
  assert.equal(result.error, "invalid-json");
}

{
  const result = mergeRaw('{"v":1}', '{"v":1}');
  assert.equal(result.raw, '{"v":1}');
  assert.equal(result.changed, false);
  assert.equal(result.conflicts, 0);
}

{
  const result = mergeValues({ nested: { left: 1, shared: "local" } },
                             { nested: { right: 2, shared: "remote" } });
  assert.deepEqual(result.value, { nested: { left: 1, shared: "local", right: 2 } });
  assert.equal(result.changed, true);
  assert.equal(result.conflicts, 1);
}

console.log("FRAME ATLAS backup merge tests: 6 cases passed");
