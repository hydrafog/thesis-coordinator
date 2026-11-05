import { COORDINATOR_NAME, PAGE_TITLES, SEARCHABLE_PAGES, STUDENT_NAME } from "./config/constants.js";
import { loadStore, getState, saveStore } from "./core/store.js";
import { applyAppearance } from "./core/theme.js";
import { bindEvents } from "./core/events.js";
import { correctHash, navigateTo, pageFromHash, resolvePage } from "./core/router.js";
import { activeTopicOf, supervisedStudents } from "./core/selectors.js";
import { isAllowedUpload, safeFileName } from "./core/validation.js";
import { accountMarkup, navMarkup, shellMarkup, topbarMarkup } from "./components/shell.js";
import { button } from "./components/button.js";
import { showToast } from "./components/toast.js";
import { PAGES } from "./pages/index.js";
import { topicDialogMarkup, openTopicDialog } from "./dialogs/topic-dialog.js";
import { milestoneDialogMarkup, openMilestoneDialog } from "./dialogs/milestone-dialog.js";
import { reviewDialogMarkup, openReviewDialog } from "./dialogs/review-dialog.js";
import { closeDialog, closeDialogs } from "./dialogs/controls.js";
import { proposeTopic, reviseTopic, decideProposal } from "./actions/proposals.js";
import { addMilestone, toggleMilestone, recordMilestoneUpload, recordFinalUpload, saveReview } from "./actions/workflow.js";
import { openThread, sendMessage } from "./actions/messaging.js";
import { setGrade, closeGrading } from "./actions/grading.js";
import { switchRole, setThemeMode, setAccent, setZoom, saveSettings } from "./actions/preferences.js";
import { exportMinutes } from "./actions/export-minutes.js";

const STORAGE_NOTICE = "Changes are kept for this visit only.";
const doc = globalThis.document;
const win = globalThis;

function slot(name) {
  return doc.querySelector(`[data-slot="${name}"]`);
}

function preferenceOf(state) {
  return state.preferences[state.role];
}

function pageFallback(page) {
  return `<section class="card error-page"><h2 class="section__label">This page could not be shown</h2><p class="muted-block">Try again. Your saved data is unchanged.</p>${button({ label: "Try again", action: "retry-page", id: page, variant: "btn--primary" })}</section>`;
}

function renderPageMarkup(page, state) {
  try {
    return PAGES[page]({ state, ui: state.ui, collapsed: state.ui.collapsed });
  } catch {
    console.error("page_render_failed", page);
    return pageFallback(page);
  }
}

function focusKey(element) {
  if (!element || element === doc.body) {
    return null;
  }
  if (element.id) {
    return { id: element.id, action: "", target: "", decision: "" };
  }
  if (element.dataset.action) {
    return { id: "", action: element.dataset.action, target: element.dataset.id ?? "", decision: element.dataset.decision ?? "" };
  }
  return null;
}

function restoreFocus(key) {
  if (!key) {
    return;
  }
  let target = null;
  if (key.id) {
    target = doc.getElementById(key.id);
  } else {
    target = [...doc.querySelectorAll("[data-action]")].find(
      (element) =>
        element.dataset.action === key.action &&
        (element.dataset.id ?? "") === key.target &&
        (element.dataset.decision ?? "") === key.decision,
    );
  }
  target?.focus({ preventScroll: true });
}

function renderView() {
  const state = getState();
  const key = focusKey(doc.activeElement);
  slot("view").innerHTML = renderPageMarkup(doc.body.dataset.page, state);
  restoreFocus(key);
}

function render() {
  const state = getState();
  const requested = pageFromHash(win.location.hash);
  const page = resolvePage(requested, state.role, preferenceOf(state).defaultPage);
  if (page !== requested) {
    correctHash(page);
  }
  doc.body.dataset.page = page;
  const key = focusKey(doc.activeElement);
  slot("nav").innerHTML = navMarkup(state.role, page);
  slot("account").innerHTML = accountMarkup({ name: preferenceOf(state).name, role: state.role });
  slot("topbar").innerHTML = topbarMarkup({ page, query: state.ui.query, searchable: SEARCHABLE_PAGES.includes(page) });
  doc.title = `${PAGE_TITLES[page]}, Thesis Coordinator`;
  slot("view").innerHTML = renderPageMarkup(page, state);
  restoreFocus(key);
}

function commit(result, { chrome = true } = {}) {
  if (result.changed) {
    applyAppearance(getState().appearance);
    if (!saveStore().ok) {
      showToast(STORAGE_NOTICE);
    }
    if (chrome) {
      render();
    } else {
      renderView();
    }
  }
  if (result.message) {
    showToast(result.message);
  }
}

function commitUi() {
  saveStore();
  renderView();
}

function setNav(open) {
  doc.body.classList.toggle("nav-open", open);
  doc.querySelector('[data-action="toggle-nav"]')?.setAttribute("aria-expanded", String(open));
}

function setAccount(open) {
  const menu = doc.getElementById("account-menu");
  if (menu) {
    menu.hidden = !open;
  }
  doc.querySelector('[data-action="toggle-account"]')?.setAttribute("aria-expanded", String(open));
}

function navigate(page) {
  if (!navigateTo(page)) {
    render();
  }
}

function closeAccountOutside(event) {
  if (event.target instanceof Element && !event.target.closest(".account")) {
    setAccount(false);
  }
}

const ACTIONS = Object.freeze({
  go(element, event) {
    event.preventDefault();
    setNav(false);
    navigate(element.dataset.id);
  },
  "toggle-nav"() {
    setNav(!doc.body.classList.contains("nav-open"));
  },
  "close-nav"() {
    setNav(false);
  },
  "toggle-account"() {
    const menu = doc.getElementById("account-menu");
    setAccount(menu ? menu.hidden : false);
  },
  "switch-role"(element) {
    const state = getState();
    closeDialogs();
    setNav(false);
    setAccount(false);
    commit(switchRole(state, element.dataset.id));
  },
  "toggle-panel"(element) {
    const state = getState();
    const id = element.dataset.id;
    state.ui.collapsed = state.ui.collapsed.includes(id)
      ? state.ui.collapsed.filter((item) => item !== id)
      : [...state.ui.collapsed, id];
    commitUi();
  },
  filter(element) {
    const state = getState();
    state.ui.proposalFilter = element.dataset.id;
    commitUi();
  },
  decide(element) {
    commit(decideProposal(getState(), element.dataset.id, element.dataset.decision));
  },
  revise(element) {
    const proposal = getState().proposals.find((item) => item.id === element.dataset.id);
    if (proposal) {
      openTopicDialog({ coordinator: proposal.coordinator, proposal });
    }
  },
  propose(element) {
    if (activeTopicOf(getState(), STUDENT_NAME)) {
      showToast("You already have one active proposal.");
      return;
    }
    openTopicDialog({ coordinator: element.dataset.id });
  },
  "open-chat"(element) {
    openThread(getState(), element.dataset.id);
    commitUi();
    navigate("chat");
  },
  "select-thread"(element) {
    openThread(getState(), element.dataset.id);
    commitUi();
  },
  "toggle-thread-details"() {
    const state = getState();
    state.ui.threadDetails = !state.ui.threadDetails;
    commitUi();
  },
  "add-milestone"() {
    const students = supervisedStudents(getState(), COORDINATOR_NAME).map((proposal) => proposal.student);
    openMilestoneDialog(students);
  },
  "toggle-milestone"(element) {
    commit(toggleMilestone(getState(), element.dataset.id));
  },
  "edit-review"(element) {
    const review = getState().reviews.find((item) => item.id === element.dataset.id);
    if (review) {
      openReviewDialog(review);
    }
  },
  "close-grading"(element) {
    commit(closeGrading(getState(), element.dataset.id));
  },
  "export-minutes"(element) {
    const result = exportMinutes(getState(), element.dataset.id);
    if (result.message) {
      showToast(result.message);
    }
  },
  "close-dialog"(element) {
    closeDialog(element.closest("dialog"));
  },
  "retry-page"() {
    render();
  },
  escape() {
    setNav(false);
    setAccount(false);
  },
});

const CHANGES = Object.freeze({
  "grade-student"(element) {
    getState().ui.gradeStudent = element.value;
    commitUi();
  },
  "grade-input"(element) {
    const state = getState();
    commit(setGrade(state, state.ui.gradeStudent, Number(element.dataset.index), element.value));
  },
  "upload-milestone"(element) {
    const file = element.files?.[0];
    commit(recordMilestoneUpload(getState(), element.dataset.id, file));
    element.value = "";
  },
  "upload-final"(element) {
    const file = element.files?.[0];
    commit(recordFinalUpload(getState(), STUDENT_NAME, file));
    element.value = "";
  },
  "chat-attach"(element) {
    const file = element.files?.[0];
    if (!file) {
      return;
    }
    if (!isAllowedUpload(file)) {
      element.value = "";
      showToast("Only PDF and ZIP files up to 50 MB are allowed.");
      return;
    }
    const note = doc.getElementById("chat-file-note");
    if (note) {
      note.textContent = `${safeFileName(file.name)}. The file name is kept; the file is not uploaded.`;
    }
  },
  "theme-mode"(element) {
    commit(setThemeMode(getState(), element.value));
  },
  accent(element) {
    commit(setAccent(getState(), element.value));
  },
  zoom(element) {
    commit(setZoom(getState(), element.value));
  },
});

const INPUTS = Object.freeze({
  search(element) {
    getState().ui.query = element.value.trim();
    renderView();
  },
});

function validateForm(form) {
  let firstInvalid = null;
  for (const element of form.querySelectorAll("input, select, textarea")) {
    if (element.hasAttribute("required") && !element.value.trim()) {
      element.setAttribute("aria-invalid", "true");
      if (!firstInvalid) {
        firstInvalid = element;
      }
    } else {
      element.removeAttribute("aria-invalid");
    }
  }
  if (firstInvalid) {
    firstInvalid.focus();
    showToast("Please fill in the required fields.");
    return false;
  }
  return true;
}

const SUBMITS = Object.freeze({
  topic(form) {
    if (!validateForm(form)) {
      return;
    }
    const state = getState();
    const values = Object.fromEntries(new FormData(form));
    const result = form.dataset.editId ? reviseTopic(state, form.dataset.editId, values) : proposeTopic(state, values);
    if (result.changed) {
      closeDialogs();
      form.reset();
    }
    commit(result);
  },
  milestone(form) {
    if (!validateForm(form)) {
      return;
    }
    const result = addMilestone(getState(), Object.fromEntries(new FormData(form)));
    if (result.changed) {
      closeDialogs();
      form.reset();
    }
    commit(result);
  },
  review(form) {
    if (!validateForm(form)) {
      return;
    }
    const result = saveReview(getState(), Object.fromEntries(new FormData(form)));
    if (result.changed) {
      closeDialogs();
    }
    commit(result);
  },
  message(form) {
    const file = form.elements.file?.files?.[0];
    const result = sendMessage(getState(), { text: form.elements.text.value, file });
    if (result.changed) {
      form.reset();
    }
    commit(result, { chrome: false });
  },
  settings(form) {
    commit(
      saveSettings(getState(), {
        displayName: form.elements.displayName.value,
        defaultPage: form.elements.defaultPage.value,
        alerts: form.elements.alerts.checked ? "on" : "",
      }),
    );
  },
});

const KEYS = Object.freeze({
  compose(element, event) {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      element.form?.requestSubmit();
    }
  },
});

const REGISTRY = Object.freeze({
  action: ACTIONS,
  change: CHANGES,
  input: INPUTS,
  submit: SUBMITS,
  keydown: KEYS,
  escape: { escape: () => ACTIONS.escape() },
});

function dispatch(kind, name, element, event) {
  if (element && (kind === "input" || kind === "change")) {
    element.removeAttribute("aria-invalid");
  }
  const handler = REGISTRY[kind]?.[name];
  if (handler) {
    handler(element, event);
  }
}

function boot() {
  const state = loadStore();
  applyAppearance(state.appearance);
  doc.getElementById("app").innerHTML = shellMarkup();
  slot("dialogs").innerHTML = `${topicDialogMarkup()}${milestoneDialogMarkup()}${reviewDialogMarkup()}`;
  bindEvents(dispatch);
  doc.addEventListener("click", closeAccountOutside);
  win.addEventListener("hashchange", () => {
    getState().ui.query = "";
    render();
    doc.getElementById("page-title")?.focus({ preventScroll: true });
  });
  render();
}

boot();
