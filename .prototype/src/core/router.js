import { DEFAULT_PAGE, NAVIGATION } from "../config/navigation.js";

export function pagesFor(role) {
  return NAVIGATION[role].flatMap((group) =>
    group.items.map((item) => item.key),
  );
}

export function resolvePage(requested, role, fallback) {
  const allowed = pagesFor(role);
  if (allowed.includes(requested)) {
    return requested;
  }
  if (allowed.includes(fallback)) {
    return fallback;
  }
  return DEFAULT_PAGE;
}

export function pageFromHash(hash) {
  try {
    return decodeURIComponent(String(hash ?? "").replace(/^#/, ""));
  } catch {
    return "";
  }
}

export function navigateTo(page) {
  const target = `#${page}`;
  if (globalThis.location.hash === target) {
    return false;
  }
  globalThis.location.hash = target;
  return true;
}

export function correctHash(page) {
  globalThis.history.replaceState(null, "", `#${page}`);
}
