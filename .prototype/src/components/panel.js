import { esc } from "../core/html.js";
import { icon } from "./icon.js";

export function panel({ id, title, body, collapsed = false }) {
  const label = `${collapsed ? "Expand" : "Collapse"} ${title}`;
  return `<section class="panel" data-collapsed="${collapsed}" aria-labelledby="panel-title-${esc(id)}"><div class="panel__head"><h2 class="panel__title" id="panel-title-${esc(id)}">${esc(title)}</h2><button class="btn btn--ghost btn--icon btn--sm" type="button" data-action="toggle-panel" data-id="${esc(id)}" aria-expanded="${!collapsed}" aria-controls="panel-body-${esc(id)}" aria-label="${esc(label)}">${icon("i-up-line", true)}</button></div><div class="panel__body" id="panel-body-${esc(id)}">${body}</div></section>`;
}

export function railEmpty(text) {
  return `<p class="muted-block">${esc(text)}</p>`;
}
