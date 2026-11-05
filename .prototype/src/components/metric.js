import { esc } from "../core/html.js";

export function metric({ label, value, unit = "", meter = "" }) {
  const unitText = unit ? `<span class="metric__unit">${esc(unit)}</span>` : "";
  return `<div class="metric"><span class="metric__label">${esc(label)}</span><span class="metric__figure"><span class="metric__value">${esc(value)}</span>${unitText}</span>${meter}</div>`;
}
