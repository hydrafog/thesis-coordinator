import { esc } from "../core/html.js";

export function button({ label, action = "", id = "", variant = "", size = "", attrs = "", icon = "", type = "button", disabled = false, title = "", iconOnly = false }) {
  const classes = ["btn", variant, size].filter(Boolean).join(" ");
  const actionAttr = action ? ` data-action="${esc(action)}"` : "";
  const idAttr = id ? ` data-id="${esc(id)}"` : "";
  const titleText = title || (iconOnly ? label : "");
  const titleAttr = titleText ? ` title="${esc(titleText)}"` : "";
  const text = iconOnly ? `<span class="sr-only">${esc(label)}</span>` : `<span>${esc(label)}</span>`;
  return `<button class="${classes}" type="${type}"${actionAttr}${idAttr}${titleAttr}${attrs ? ` ${attrs}` : ""}${disabled ? " disabled" : ""}>${icon}${text}</button>`;
}
