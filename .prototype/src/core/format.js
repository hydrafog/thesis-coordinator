import { isGrade } from "./validation.js";

const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const SHORT_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});
const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric" });
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short" });

const NOON_SUFFIX = "T12:00:00";

function toDate(isoDay) {
  return new Date(`${isoDay}${NOON_SUFFIX}`);
}

export function formatLongDate(isoDay) {
  return isoDay ? LONG_DATE.format(toDate(isoDay)) : "—";
}

export function formatShortDate(isoDay) {
  return isoDay ? SHORT_DATE.format(toDate(isoDay)) : "—";
}

export function formatWeekday(isoDay) {
  return WEEKDAY.format(toDate(isoDay));
}

export function formatDayNumber(isoDay) {
  return DAY.format(toDate(isoDay));
}

export function formatMonthShort(isoDay) {
  return MONTH.format(toDate(isoDay));
}

export function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function initials(name) {
  return String(name ?? "")
    .replace(/^(Dr\.|Prof\.)\s*/, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

export function averageGrade(values) {
  const grades = values.filter(isGrade).map(Number);
  if (!grades.length) {
    return "—";
  }
  const total = grades.reduce((sum, grade) => sum + grade, 0);
  return (total / grades.length).toFixed(2);
}
