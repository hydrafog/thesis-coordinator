import { LIMITS, UPLOAD_EXTENSIONS } from "../config/constants.js";
import { cleanText, isAllowedUpload, safeFileName } from "../core/validation.js";
import { todayIso } from "../core/format.js";
import { isSupervisedBy } from "../core/selectors.js";

const REVIEW_STATUSES = Object.freeze(["needs-work", "ok"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function addMilestone(state, values) {
  const name = cleanText(values.name, LIMITS.milestoneName);
  const due = String(values.due ?? "");
  if (!name || !DATE_PATTERN.test(due)) {
    return { changed: false, message: "Enter a milestone name and a deadline." };
  }
  if (!isSupervisedBy(state, values.student)) {
    return { changed: false, message: "Choose a supervised student." };
  }
  state.milestones.push({
    id: `m-${Date.now()}`,
    student: values.student,
    name,
    due,
    done: false,
    version: "",
  });
  return { changed: true, message: "Milestone added." };
}

export function toggleMilestone(state, id) {
  const milestone = state.milestones.find((item) => item.id === id);
  if (!milestone) {
    return { changed: false, message: "" };
  }
  milestone.done = !milestone.done;
  return { changed: true, message: milestone.done ? "Milestone marked complete." : "Milestone reopened." };
}

export function recordMilestoneUpload(state, id, file) {
  const milestone = state.milestones.find((item) => item.id === id);
  if (!milestone) {
    return { changed: false, message: "" };
  }
  if (!isAllowedUpload(file)) {
    return { changed: false, message: `Only ${UPLOAD_EXTENSIONS.join(" and ").toUpperCase()} files up to 50 MB are accepted.` };
  }
  milestone.version = `${safeFileName(file.name)}, ${todayIso()}`;
  return { changed: true, message: "File name recorded on this device. Nothing was uploaded." };
}

export function recordFinalUpload(state, student, file) {
  if (!file || !/\.pdf$/i.test(file.name) || file.size > LIMITS.uploadBytes) {
    return { changed: false, message: "Select a PDF file up to 50 MB." };
  }
  state.documents[student] = { ...(state.documents[student] ?? {}), final: safeFileName(file.name) };
  return { changed: true, message: "Thesis file name recorded on this device. Nothing was uploaded." };
}

export function saveReview(state, values) {
  const review = state.reviews.find((item) => item.id === values.id);
  const comment = cleanText(values.comment, LIMITS.reviewComment);
  if (!review) {
    return { changed: false, message: "" };
  }
  if (!comment || !REVIEW_STATUSES.includes(values.status)) {
    return { changed: false, message: "Write feedback before saving." };
  }
  review.status = values.status;
  review.comment = comment;
  return { changed: true, message: "Review feedback saved." };
}
