import { esc } from "../core/html.js";
import { initials } from "../core/format.js";
import { NAVIGATION } from "../config/navigation.js";
import { PAGE_TITLES, ROLES } from "../config/constants.js";
import { icon } from "./icon.js";
import { button } from "./button.js";

export function shellMarkup() {
  return `<a class="skip-link" href="#main">Skip to main content</a><aside class="sidebar" id="app-sidebar" aria-label="Primary navigation"><div class="sidebar__brand">Thesis Coordinator</div><div class="sidebar__scroll" data-slot="nav"></div><div class="account" data-slot="account"></div></aside><div class="nav-backdrop" data-action="close-nav" aria-hidden="true"></div><div class="main"><header class="topbar" data-slot="topbar"></header><main class="view" id="main" tabindex="-1" data-slot="view"></main></div>`;
}

export function navMarkup(role, currentPage) {
  return NAVIGATION[role]
    .map((group) => {
      const items = group.items
        .map((item) => {
          const current =
            item.key === currentPage ? ' aria-current="page"' : "";
          return `<li><a class="nav-link" href="#${esc(item.key)}" data-action="go" data-id="${esc(item.key)}"${current}>${icon(item.icon, true)}<span>${esc(item.label)}</span></a></li>`;
        })
        .join("");
      return `<section class="nav-group"><h2 class="nav-heading">${esc(group.label)}</h2><ul class="nav-list">${items}</ul></section>`;
    })
    .join("");
}

export function accountMarkup({ name, role }) {
  const roleLabel = role === ROLES.coordinator ? "Coordinator" : "Student";
  const options = [
    { key: ROLES.coordinator, label: "Coordinator view" },
    { key: ROLES.student, label: "Student view" },
  ]
    .map(
      (option) =>
        `<button class="btn btn--ghost btn--block" type="button" data-action="switch-role" data-id="${option.key}" aria-pressed="${option.key === role}">${esc(option.label)}</button>`,
    )
    .join("");
  return `<button class="account__button" type="button" data-action="toggle-account" aria-expanded="false" aria-controls="account-menu"><span class="person__avatar" aria-hidden="true">${esc(initials(name))}</span><span class="account__copy"><span class="account__name">${esc(name)}</span><small>${esc(roleLabel)}</small></span></button><div class="account__menu" id="account-menu" hidden><p class="account__menu-label">Switch workspace</p>${options}</div>`;
}

export function topbarMarkup({ page, query, searchable }) {
  const title = PAGE_TITLES[page] ?? PAGE_TITLES.overview;
  const toggle = button({
    label: "Open navigation",
    action: "toggle-nav",
    variant: "btn--ghost nav-toggle",
    size: "btn--icon",
    iconOnly: true,
    icon: icon("i-menu-line"),
    attrs: 'aria-controls="app-sidebar" aria-expanded="false"',
  });
  const search = searchable
    ? `<div class="search" role="search"><label class="sr-only" for="global-search">Search this page</label><input id="global-search" type="search" data-input="search" value="${esc(query)}" placeholder="Search ${esc(title.toLowerCase())}" autocomplete="off"></div>`
    : "";
  return `${toggle}<h1 class="page-title" id="page-title" tabindex="-1">${esc(title)}</h1>${search}`;
}
