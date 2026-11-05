import { STUDENT_NAME } from "../config/constants.js";
import { esc } from "../core/html.js";
import { formatLongDate } from "../core/format.js";
import {
  activeTopicOf,
  freePlaces,
  matchesQuery,
  usedPlaces,
} from "../core/selectors.js";
import { badge } from "../components/badge.js";
import { button } from "../components/button.js";
import { emptyState } from "../components/empty-state.js";
import { person } from "../components/person.js";
import { panel } from "../components/panel.js";
import { capacityBar } from "../components/progress.js";
import { sectionHeading } from "../components/section-heading.js";

export function renderCoordinators({ state, collapsed, ui }) {
  const mine = activeTopicOf(state, STUDENT_NAME);
  const matches = state.coordinators.filter((coordinator) =>
    matchesQuery(ui.query, [coordinator.name, coordinator.research]),
  );
  const openCount = state.coordinators.filter(
    (coordinator) => freePlaces(state, coordinator.name) > 0,
  ).length;
  const entries = matches.length
    ? matches
        .map((coordinator) => {
          const used = usedPlaces(state, coordinator.name);
          const free = freePlaces(state, coordinator.name);
          const isMine = mine?.coordinator === coordinator.name;
          let label = "Propose topic";
          if (isMine) {
            label = "Requested";
          } else if (free === 0) {
            label = "Full";
          }
          const disabled = Boolean(mine) || free === 0;
          return `<article class="directory__item"><div class="directory__main">${person(coordinator.name, coordinator.research)}<div class="directory__capacity">${capacityBar(used, coordinator.quota)}</div></div><div class="directory__side"><span class="directory__count num">${esc(free)} available of ${esc(coordinator.quota)}</span>${button({ label, action: "propose", id: coordinator.name, variant: disabled ? "" : "btn--primary", disabled })}</div></article>`;
        })
        .join("")
    : emptyState({
        title: "No coordinators match your search",
        text: "Try a different name or research area.",
      });
  const row = (key, value) =>
    `<div class="kv__row"><span class="kv__key">${esc(key)}</span><span class="kv__value">${value}</span></div>`;
  const side = mine
    ? `<div class="kv">${row("Status", badge(mine.status))}${row("Title", esc(mine.title))}${row("Coordinator", esc(mine.coordinator))}${row("Objectives", esc(mine.objectives))}${row("Technologies", esc(mine.technologies))}${row("Description", esc(mine.description))}${row("Last updated", esc(formatLongDate(mine.updated)))}</div>`
    : `<div class="figure"><span class="figure__value">${esc(openCount)}</span><span class="muted-block">Coordinators with open places</span></div>`;
  return `<div class="workspace"><section class="card workspace__main">${sectionHeading("Supervisors", `<span class="section__count">${matches.length} shown</span>`)}<div class="directory">${entries}</div></section><aside class="workspace__rail">${panel({ id: "directory-status", title: mine ? "Your proposal" : "Availability", collapsed: collapsed.includes("directory-status"), body: side })}</aside></div>`;
}
