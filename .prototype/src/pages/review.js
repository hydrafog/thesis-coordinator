import { esc } from "../core/html.js";
import { formatLongDate } from "../core/format.js";
import { supervisedStudents } from "../core/selectors.js";
import { badge } from "../components/badge.js";
import { button } from "../components/button.js";
import { emptyState } from "../components/empty-state.js";
import { icon } from "../components/icon.js";
import { panel } from "../components/panel.js";
import { sectionHeading } from "../components/section-heading.js";
import { COORDINATOR_NAME } from "../config/constants.js";

export function renderReview({ state, collapsed }) {
  const supervisedProposals = supervisedStudents(state, COORDINATOR_NAME);
  const students = supervisedProposals.map((proposal) => proposal.student);
  const milestones = state.milestones.filter((item) => students.includes(item.student)).sort((a, b) => a.due.localeCompare(b.due));
  const reviews = state.reviews.filter((item) => students.includes(item.student));
  const needsWork = reviews.filter((item) => item.status === "needs-work").length;
  const doneMilestones = milestones.filter((item) => item.done).length;
  const feedback = reviews.length
    ? `<div class="records">${reviews
        .map(
          (review) =>
            `<article class="review"><div class="review__head"><div class="person__copy"><span class="person__name">${esc(review.chapter)}</span><span class="person__sub">${esc(review.student)}</span></div>${badge(review.status)}</div><p class="review__comment">${esc(review.comment)}</p><div><button class="btn btn--sm" type="button" data-action="edit-review" data-id="${esc(review.id)}">Edit feedback</button></div></article>`,
        )
        .join("")}</div>`
    : emptyState({ title: "No chapter reviews yet", text: "Chapter feedback appears here once a supervised student uploads a chapter." });
  const milestoneList = milestones.length
    ? `<div class="milestones">${milestones
        .map(
          (milestone) =>
            `<div class="milestone"><span class="milestone__mark" data-done="${milestone.done}" aria-hidden="true"></span><div class="milestone__info"><span class="person__name">${esc(milestone.name)}</span><span class="person__sub">${esc(milestone.student)}, due ${esc(formatLongDate(milestone.due))}</span></div><div class="milestone__actions">${badge(milestone.done ? "complete" : "pending")}${button({ label: milestone.done ? "Reopen" : "Mark complete", action: "toggle-milestone", id: milestone.id, variant: "btn--sm" })}</div></div>`,
        )
        .join("")}</div>`
    : emptyState({ title: "No milestones yet", text: "Add a milestone for a supervised student to track progress." });
  const summary = `<div class="kv"><div class="kv__row"><span class="kv__key">Needs revision</span><span class="kv__value num">${needsWork}</span></div><div class="kv__row"><span class="kv__key">Approved chapters</span><span class="kv__value num">${reviews.length - needsWork}</span></div><div class="kv__row"><span class="kv__key">Completed milestones</span><span class="kv__value num">${doneMilestones} of ${milestones.length}</span></div></div>`;
  const supervised = students.length
    ? `<div class="records">${supervisedProposals
        .map((proposal) => `<div class="record"><div class="record__main"><span class="person__name">${esc(proposal.student)}</span><span class="person__sub">${esc(proposal.title)}</span></div>${button({ label: "Message", action: "open-chat", id: proposal.student, variant: "btn--ghost", size: "btn--icon btn--sm", iconOnly: true, icon: icon("i-chat-1-line", true) })}</div>`)
        .join("")}</div>`
    : emptyState({ title: "No supervised students", text: "Approve a proposal to start supervising a student." });
  return `<div class="workspace"><section class="card workspace__main"><section class="section">${sectionHeading("Chapter feedback", `<span class="section__count">${reviews.length} chapters</span>`)}${feedback}</section><section class="section">${sectionHeading("Milestones", button({ label: "Add milestone", action: "add-milestone", variant: "btn--sm", icon: icon("i-add-line", true) }))}${milestoneList}</section></section><aside class="workspace__rail">${panel({ id: "review-summary", title: "Summary", collapsed: collapsed.includes("review-summary"), body: summary })}${panel({ id: "review-students", title: "Supervised theses", collapsed: collapsed.includes("review-students"), body: supervised })}</aside></div>`;
}
