import { esc } from "../core/html.js";

export function emptyState({ title, text, action = "" }) {
  return `<div class="empty" role="status"><p class="empty__title">${esc(title)}</p><p class="empty__text">${esc(text)}</p>${action}</div>`;
}
