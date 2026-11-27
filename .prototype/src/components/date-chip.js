import { esc } from "../core/html.js";
import { formatDayNumber, formatMonthShort } from "../core/format.js";

export function dateChip(isoDay) {
  return `<time class="date-chip" datetime="${esc(isoDay)}"><span class="date-chip__day num">${esc(formatDayNumber(isoDay))}</span><span class="date-chip__month">${esc(formatMonthShort(isoDay))}</span></time>`;
}
