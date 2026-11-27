import { esc } from "../core/html.js";

export function sectionHeading(title, trailing = "") {
  return `<div class="section__head"><h2 class="section__label">${esc(title)}</h2>${trailing}</div>`;
}
