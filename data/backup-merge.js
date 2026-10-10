/* FRAME ATLAS backup merge core.
 * Rules: preserve local scalar values on conflict; add remote-only object fields;
 * union arrays without duplicating items; merge array objects by stable ID.
 * No network, browser or storage APIs are used, so the same code is testable in Node.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FABackupMerge = api;
})(typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  const isObject = value => value !== null && typeof value === "object";
  const isPlainObject = value => isObject(value) && !Array.isArray(value);
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

  function canonical(value) {
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (isPlainObject(value)) {
      return "{" + Object.keys(value).sort().map(key =>
        JSON.stringify(key) + ":" + canonical(value[key])
      ).join(",") + "}";
    }
    return JSON.stringify(value);
  }

  function areEqual(left, right) {
    return canonical(left) === canonical(right);
  }

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (isPlainObject(value)) {
      const out = {};
      for (const key of Object.keys(value)) out[key] = clone(value[key]);
      return out;
    }
    return value;
  }

  function stableId(value) {
    if (!isPlainObject(value)) return null;
    for (const field of ["id", "_id", "uuid", "key"]) {
      if (hasOwn(value, field) && ["string", "number"].includes(typeof value[field])) {
        return field + ":" + String(value[field]);
      }
    }
    return null;
  }

  function arrayIdentity(value) {
    return stableId(value) || "value:" + canonical(value);
  }

  function mergeValues(localValue, remoteValue) {
    if (areEqual(localValue, remoteValue)) {
      return { value: clone(localValue), changed: false, conflicts: 0 };
    }

    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      const out = localValue.map(clone);
      let changed = false;
      let conflicts = 0;

      for (const remoteItem of remoteValue) {
        const identity = arrayIdentity(remoteItem);
        const index = out.findIndex(localItem => arrayIdentity(localItem) === identity);
        if (index < 0) {
          out.push(clone(remoteItem));
          changed = true;
          continue;
        }

        const localItem = out[index];
        if (stableId(localItem) && stableId(localItem) === stableId(remoteItem) &&
            isPlainObject(localItem) && isPlainObject(remoteItem)) {
          const result = mergeValues(localItem, remoteItem);
          if (result.changed) {
            out[index] = result.value;
            changed = true;
          }
          conflicts += result.conflicts;
        }
      }
      return { value: out, changed, conflicts };
    }

    if (isPlainObject(localValue) && isPlainObject(remoteValue)) {
      const out = clone(localValue);
      let changed = false;
      let conflicts = 0;

      for (const key of Object.keys(remoteValue)) {
        if (!hasOwn(localValue, key)) {
          out[key] = clone(remoteValue[key]);
          changed = true;
          continue;
        }

        const result = mergeValues(localValue[key], remoteValue[key]);
        if (result.changed) {
          out[key] = result.value;
          changed = true;
        }
        conflicts += result.conflicts;
      }
      return { value: out, changed, conflicts };
    }

    // Conflicting scalar/type changes are intentionally resolved in favour of
    // the current device. The backup remains available for a manual overwrite.
    return { value: clone(localValue), changed: false, conflicts: 1 };
  }

  function mergeRaw(localRaw, remoteRaw) {
    if (typeof localRaw !== "string" || typeof remoteRaw !== "string") {
      return { raw: localRaw, value: localRaw, changed: false, conflicts: 1, error: "non-string-value" };
    }
    if (localRaw === remoteRaw) {
      return { raw: localRaw, value: localRaw, changed: false, conflicts: 0 };
    }

    let localValue, remoteValue;
    try {
      localValue = JSON.parse(localRaw);
      remoteValue = JSON.parse(remoteRaw);
    } catch (_) {
      return { raw: localRaw, value: localRaw, changed: false, conflicts: 1, error: "invalid-json" };
    }

    const result = mergeValues(localValue, remoteValue);
    return {
      raw: result.changed ? JSON.stringify(result.value) : localRaw,
      value: result.value,
      changed: result.changed,
      conflicts: result.conflicts
    };
  }

  return { areEqual, mergeValues, mergeRaw };
});
