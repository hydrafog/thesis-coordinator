import { renderOverview } from "./overview.js";
import { renderStudents } from "./students.js";
import { renderCoordinators } from "./coordinators.js";
import { renderMyThesis } from "./my-thesis.js";
import { renderReview } from "./review.js";
import { renderChat } from "./chat.js";
import { renderSchedule } from "./schedule.js";
import { renderGradebook } from "./gradebook.js";
import { renderSettings } from "./settings.js";

export const PAGES = Object.freeze({
  overview: renderOverview,
  students: renderStudents,
  coordinators: renderCoordinators,
  "my-thesis": renderMyThesis,
  review: renderReview,
  chat: renderChat,
  schedule: renderSchedule,
  gradebook: renderGradebook,
  settings: renderSettings,
});
