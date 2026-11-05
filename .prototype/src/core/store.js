import { STORAGE_KEY } from "../config/constants.js";
import { createSeed } from "../data/seed.js";

let state = createSeed();

function isStoredShape(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      Array.isArray(value.proposals) &&
      Array.isArray(value.milestones) &&
      Array.isArray(value.reviews) &&
      Array.isArray(value.slots) &&
      value.preferences &&
      value.appearance,
  );
}

function readStored() {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadStore() {
  const seed = createSeed();
  const stored = readStored();
  state = isStoredShape(stored)
    ? { ...seed, ...stored, ui: { ...seed.ui, ...(stored.ui ?? {}) } }
    : seed;
  return state;
}

export function getState() {
  return state;
}

export function saveStore() {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    console.error("storage_write_failed");
    return { ok: false, reason: "storage_unavailable" };
  }
}
