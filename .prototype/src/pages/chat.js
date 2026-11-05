import { COORDINATOR_NAME, LIMITS, ROLES, STUDENT_NAME } from "../config/constants.js";
import { esc } from "../core/html.js";
import { activeTopicOf, messagesWith, supervisedStudents } from "../core/selectors.js";
import { button } from "../components/button.js";
import { icon } from "../components/icon.js";
import { initials } from "../core/format.js";

function participantsFor(state) {
  if (state.role === ROLES.coordinator) {
    return supervisedStudents(state, COORDINATOR_NAME).map((proposal) => proposal.student);
  }
  const topic = activeTopicOf(state, STUDENT_NAME);
  return topic && topic.status === "approved" ? [topic.coordinator] : [];
}

function lockedMarkup() {
  return `<section class="chat--locked"><h2 class="section__label">Conversations open after topic approval</h2><p class="muted-block">Once a coordinator approves your proposal, your private conversation appears here.</p>${button({ label: "View my thesis", action: "go", id: "my-thesis", variant: "btn--primary" })}</section>`;
}

function bubbleFor(message, identity) {
  const mine = message.from === identity;
  const text = message.text ? `<p>${esc(message.text)}</p>` : "";
  const file = message.attachment
    ? `<span class="bubble__file">${icon("i-document-2-line", true)}<span>${esc(message.attachment)}</span></span>`
    : "";
  return `<div class="bubble-row" data-mine="${mine}"><div class="bubble">${text}${file}</div><span class="bubble__stamp">${esc(message.from)}, ${esc(message.time)}</span></div>`;
}

export function renderChat({ state, ui }) {
  const participants = participantsFor(state);
  if (!participants.length) {
    return lockedMarkup();
  }
  const thread = participants.includes(ui.activeThread) ? ui.activeThread : participants[0];
  const identity = state.role === ROLES.coordinator ? COORDINATOR_NAME : STUDENT_NAME;
  const topic = state.role === ROLES.coordinator ? activeTopicOf(state, thread) : activeTopicOf(state, STUDENT_NAME);
  const messages = messagesWith(state, state.role === ROLES.coordinator ? thread : STUDENT_NAME);
  const people = participants
    .map((name) => {
      const log = messagesWith(state, name);
      const last = log[log.length - 1];
      const preview = last ? (last.attachment ? `Attachment: ${last.attachment}` : last.text) : "No messages yet";
      return `<button class="chat__thread" type="button" data-action="select-thread" data-id="${esc(name)}" aria-pressed="${name === thread}"><span class="person__avatar" aria-hidden="true">${esc(initials(name))}</span><span class="chat__thread-copy"><span class="chat__thread-name"><span>${esc(name)}</span>${last ? `<span class="muted">${esc(last.time)}</span>` : ""}</span><span class="chat__thread-preview">${esc(preview)}</span></span></button>`;
    })
    .join("");
  const detailsOpen = Boolean(ui.threadDetails);
  const details = `<div class="chat__details" id="chat-details"${detailsOpen ? "" : " hidden"}><div class="kv__row"><span class="kv__key">Thesis topic</span><span class="kv__value">${esc(topic?.title ?? "No approved topic")}</span></div><div class="kv__row"><span class="kv__key">Supervision</span><span class="kv__value">Approved</span></div>${button({ label: state.role === ROLES.coordinator ? "Open review" : "Open my thesis", action: "go", id: state.role === ROLES.coordinator ? "review" : "my-thesis", variant: "btn--sm" })}</div>`;
  const log = messages.length
    ? messages.map((message) => bubbleFor(message, identity)).join("")
    : `<p class="muted-block">No messages yet. Send a message to ${esc(thread)}.</p>`;
  return `<div class="chat"><div class="chat__people" role="group" aria-label="Conversations">${people}</div><section class="chat__main" aria-label="Thesis conversation"><header class="chat__head"><div><h2 class="section__label">${esc(thread)}</h2><p class="muted">${esc(topic?.title ?? "Thesis supervision")}</p></div>${button({ label: "Thesis details", action: "toggle-thread-details", variant: "btn--sm", attrs: `aria-controls="chat-details" aria-expanded="${detailsOpen}"` })}</header>${details}<div class="chat__log" id="chat-log" role="log" aria-live="polite" aria-label="Messages with ${esc(thread)}">${log}</div><form class="chat__composer" data-submit="message" novalidate><div class="chat__composer-row"><label class="btn btn--sm" for="chat-attachment">${icon("i-add-line", true)}<span>Attach</span></label><input class="sr-only" id="chat-attachment" name="file" type="file" accept=".pdf,.zip" data-change="chat-attach"><label class="sr-only" for="message-input">Write a message</label><textarea class="textarea" id="message-input" name="text" rows="1" maxlength="${LIMITS.message}" data-keydown="compose" placeholder="Message ${esc(thread)}"></textarea><button class="btn btn--primary" type="submit">${icon("i-send-line", true)}<span>Send</span></button></div><p class="chat__composer-note" id="chat-file-note">PDF or ZIP, up to 50 MB. The file name is kept; the file is not uploaded.</p></form></section></div>`;
}
