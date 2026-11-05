import { COMMITTEE_MEMBERS } from "../config/constants.js";
import { averageGrade, formatLongDate, todayIso } from "../core/format.js";
import { gradeRecord } from "../core/selectors.js";

export function exportMinutes(state, student) {
  const record = gradeRecord(state, student);
  if (!record.closed) {
    return {
      changed: false,
      message: "Close grading before exporting minutes.",
    };
  }
  const lines = [
    "THESIS DEFENSE MINUTES",
    `Student: ${student}`,
    "Committee A",
    `Date: ${formatLongDate(todayIso())}`,
    "",
    ...COMMITTEE_MEMBERS.map(
      (member, index) =>
        `${member}: ${Number(record.values[index]).toFixed(2)}`,
    ),
    "",
    `Final average: ${averageGrade(record.values)}`,
    "Status: finalized",
    "",
  ];
  const url = globalThis.URL.createObjectURL(
    new Blob([lines.join("\n")], { type: "text/plain" }),
  );
  const anchor = globalThis.document.createElement("a");
  anchor.href = url;
  anchor.download = `defense-minutes-${student.toLowerCase().replace(/\W+/g, "-")}.txt`;
  anchor.click();
  globalThis.setTimeout(() => globalThis.URL.revokeObjectURL(url), 1500);
  return { changed: false, message: "Minutes downloaded." };
}
