import {
  COORDINATOR_NAME,
  LIMITS,
  ROLES,
  STUDENT_NAME,
} from "../config/constants.js";
import {
  cleanText,
  isAllowedUpload,
  safeFileName,
} from "../core/validation.js";
import { activeTopicOf, isSupervisedBy } from "../core/selectors.js";

const CLOCK = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

export function openThread(state, student) {
  state.ui.activeThread = student;
  return { changed: true, message: "" };
}

export function sendMessage(state, { text, file }) {
  const isCoordinator = state.role === ROLES.coordinator;
  const thread = isCoordinator ? state.ui.activeThread : STUDENT_NAME;
  const from = isCoordinator ? COORDINATOR_NAME : STUDENT_NAME;
  const allowed = isCoordinator
    ? isSupervisedBy(state, thread)
    : activeTopicOf(state)?.status === "approved";
  if (!allowed) {
    return {
      changed: false,
      message: "Conversations open after topic approval.",
    };
  }
  const body = cleanText(text, LIMITS.message);
  const hasFile = Boolean(file && file.name);
  if (!body && !hasFile) {
    return { changed: false, message: "" };
  }
  if (hasFile && !isAllowedUpload(file)) {
    return {
      changed: false,
      message: "Only PDF and ZIP files up to 50 MB are allowed.",
    };
  }
  const log = (state.messages[thread] ??= []);
  log.push({
    from,
    text: body,
    attachment: hasFile ? safeFileName(file.name) : "",
    time: CLOCK.format(new Date()),
  });
  return {
    changed: true,
    message: hasFile
      ? "Attachment name saved on this device. The file was not uploaded."
      : "",
  };
}
