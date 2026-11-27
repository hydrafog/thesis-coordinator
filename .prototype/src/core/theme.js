import {
  ACCENTS,
  DEFAULT_ACCENT,
  DEFAULT_THEME,
  DEFAULT_ZOOM,
  THEME_MODES,
  ZOOM_PRESETS,
} from "../config/constants.js";

export function applyAppearance(appearance) {
  const root = globalThis.document.documentElement;
  root.dataset.themeMode = THEME_MODES.includes(appearance.themeMode)
    ? appearance.themeMode
    : DEFAULT_THEME;
  root.dataset.accent = ACCENTS.includes(appearance.accent)
    ? appearance.accent
    : DEFAULT_ACCENT;
  root.dataset.zoom = ZOOM_PRESETS.includes(appearance.zoom)
    ? appearance.zoom
    : DEFAULT_ZOOM;
}
