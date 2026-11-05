import { ACCENTS, LIMITS, ROLES, THEME_MODES, ZOOM_PRESETS } from "../config/constants.js";
import { pagesFor } from "../core/router.js";
import { cleanText } from "../core/validation.js";

export function switchRole(state, role) {
  if (!Object.values(ROLES).includes(role) || role === state.role) {
    return { changed: false, message: "" };
  }
  state.role = role;
  return { changed: true, message: "" };
}

export function setThemeMode(state, mode) {
  if (!THEME_MODES.includes(mode)) {
    return { changed: false, message: "" };
  }
  state.appearance.themeMode = mode;
  return { changed: true, message: mode === "dark" ? "Dark mode on." : "Light mode on." };
}

export function setAccent(state, accent) {
  if (!ACCENTS.includes(accent)) {
    return { changed: false, message: "" };
  }
  state.appearance.accent = accent;
  return { changed: true, message: `Accent set to ${accent}.` };
}

export function setZoom(state, zoom) {
  if (!ZOOM_PRESETS.includes(zoom)) {
    return { changed: false, message: "" };
  }
  state.appearance.zoom = zoom;
  return { changed: true, message: `Zoom set to ${zoom} percent.` };
}

export function saveSettings(state, values) {
  const name = cleanText(values.displayName, LIMITS.displayName);
  if (!name) {
    return { changed: false, message: "Enter a display name." };
  }
  const preference = state.preferences[state.role];
  const pages = pagesFor(state.role);
  preference.name = name;
  preference.defaultPage = pages.includes(values.defaultPage) ? values.defaultPage : preference.defaultPage;
  preference.alerts = values.alerts === "on";
  return { changed: true, message: "Preferences updated." };
}
