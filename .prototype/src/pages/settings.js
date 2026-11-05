import {
  ACCENTS,
  PAGE_TITLES,
  ROLES,
  THEME_MODES,
  ZOOM_PRESETS,
} from "../config/constants.js";
import { esc } from "../core/html.js";
import { pagesFor } from "../core/router.js";
import { panel } from "../components/panel.js";
import { sectionHeading } from "../components/section-heading.js";

const THEME_LABELS = Object.freeze({ light: "Light", dark: "Dark" });
const ACCENT_LABELS = Object.freeze({
  vermilion: "Vermilion",
  pink: "Pink",
  teal: "Teal",
  amber: "Amber",
  violet: "Violet",
});

function themeChoices(current) {
  return THEME_MODES.map(
    (mode) =>
      `<label class="choice"><input type="radio" name="themeMode" value="${mode}" data-change="theme-mode"${current === mode ? " checked" : ""}><span class="choice__label">${esc(THEME_LABELS[mode])}</span></label>`,
  ).join("");
}

function accentChoices(current) {
  return ACCENTS.map(
    (accent) =>
      `<label class="swatch-card"><input type="radio" name="accent" value="${accent}" data-change="accent"${current === accent ? " checked" : ""}><span class="swatch" data-accent="${accent}" aria-hidden="true"><i></i><i></i><i></i></span><span class="swatch-card__label">${esc(ACCENT_LABELS[accent])}</span></label>`,
  ).join("");
}

function zoomChoices(current) {
  return ZOOM_PRESETS.map(
    (zoom) =>
      `<label class="choice"><input type="radio" name="zoom" value="${zoom}" data-change="zoom"${current === zoom ? " checked" : ""}><span class="choice__label">${esc(zoom)}%</span></label>`,
  ).join("");
}

export function renderSettings({ state, collapsed }) {
  const preference = state.preferences[state.role];
  const pages = pagesFor(state.role);
  const pageOptions = pages
    .map(
      (key) =>
        `<option value="${esc(key)}"${preference.defaultPage === key ? " selected" : ""}>${esc(PAGE_TITLES[key])}</option>`,
    )
    .join("");
  const { themeMode, accent, zoom } = state.appearance;
  const form = `<form class="card form-grid" data-submit="settings" novalidate>${sectionHeading("Preferences")}<div class="setting"><div class="setting__label"><label class="field__label" for="display-name">Display name</label></div><div class="setting__control"><input class="input" id="display-name" name="displayName" required maxlength="60" value="${esc(preference.name)}"></div></div><div class="setting"><div class="setting__label"><label class="field__label" for="default-page">Start page</label></div><div class="setting__control"><select class="select" id="default-page" name="defaultPage">${pageOptions}</select></div></div><div class="setting"><div class="setting__label"><strong>Updates</strong></div><div class="setting__control"><label class="choice"><input type="checkbox" name="alerts" value="on"${preference.alerts ? " checked" : ""}><span class="choice__label">Show status notifications</span></label></div></div><div class="setting"><div class="setting__label"><strong>Theme</strong><span class="muted">Light or dark appearance</span></div><div class="setting__control"><div class="choice-group" role="radiogroup" aria-label="Theme">${themeChoices(themeMode)}</div></div></div><div class="setting"><div class="setting__label"><strong>Color palette</strong><span class="muted">Ink accent for buttons, marks, and focus</span></div><div class="setting__control"><div class="choice-group" role="radiogroup" aria-label="Color palette">${accentChoices(accent)}</div></div></div><div class="setting"><div class="setting__label"><strong>Scale and zoom</strong><span class="muted">Magnification of the whole site</span></div><div class="setting__control"><div class="choice-group" role="radiogroup" aria-label="Website scale">${zoomChoices(zoom)}</div></div></div><div class="cluster"><button class="btn btn--primary" type="submit">Save changes</button><span class="muted" role="status" id="settings-feedback"></span></div></form>`;
  const summary = `<div class="kv"><div class="kv__row"><span class="kv__key">Active view</span><span class="kv__value">${state.role === ROLES.coordinator ? "Coordinator" : "Student"}</span></div><div class="kv__row"><span class="kv__key">Theme</span><span class="kv__value">${esc(THEME_LABELS[themeMode])}</span></div><div class="kv__row"><span class="kv__key">Palette</span><span class="kv__value">${esc(ACCENT_LABELS[accent])}</span></div><div class="kv__row"><span class="kv__key">Zoom</span><span class="kv__value num">${esc(zoom)}%</span></div><div class="kv__row"><span class="kv__key">Storage</span><span class="kv__value">Saved in this browser</span></div></div>`;
  return `<div class="workspace"><div class="workspace__main">${form}</div><aside class="workspace__rail">${panel({ id: "settings-summary", title: "Workspace", collapsed: collapsed.includes("settings-summary"), body: summary })}</aside></div>`;
}
