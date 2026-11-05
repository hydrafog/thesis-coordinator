import { LIMITS, UPLOAD_EXTENSIONS } from "../config/constants.js";

export function isGrade(value) {
  if (value === "" || value === null || value === undefined) {
    return false;
  }
  const number = Number(value);
  return (
    Number.isFinite(number) &&
    number >= LIMITS.gradeMin &&
    number <= LIMITS.gradeMax
  );
}

export function cleanText(value, maxLength) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

export function safeFileName(name) {
  const base = String(name ?? "")
    .split(/[\\/]/)
    .pop();
  return base.replace(/[\u0000-\u001f]/g, "").slice(0, LIMITS.topicTitle);
}

export function isAllowedUpload(file) {
  if (!file) {
    return false;
  }
  const extension = String(file.name ?? "")
    .split(".")
    .pop()
    .toLowerCase();
  return (
    UPLOAD_EXTENSIONS.includes(extension) && file.size <= LIMITS.uploadBytes
  );
}
