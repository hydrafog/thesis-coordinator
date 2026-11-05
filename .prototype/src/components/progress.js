import { esc } from "../core/html.js";

export function capacityBar(used, max) {
  const percent = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return `<div class="progress" role="progressbar" aria-label="${esc(`${used} of ${max} places filled`)}" aria-valuemin="0" aria-valuemax="${esc(max)}" aria-valuenow="${esc(used)}" style="--progress: ${percent}%"><span class="progress__fill"></span></div>`;
}

export function placesMeter(used, max) {
  const marks = Array.from({ length: max }, (_, index) => `<span class="places__mark" data-filled="${index < used}"></span>`).join("");
  return `<div class="places" role="img" aria-label="${esc(`${used} of ${max} places filled`)}">${marks}</div>`;
}
