import { esc } from "../core/html.js";
import { initials } from "../core/format.js";

export function person(name, sub = "") {
  const subLine = sub ? `<span class="person__sub">${esc(sub)}</span>` : "";
  return `<div class="person"><span class="person__avatar" aria-hidden="true">${esc(initials(name))}</span><span class="person__copy"><span class="person__name" title="${esc(name)}">${esc(name)}</span>${subLine}</span></div>`;
}
