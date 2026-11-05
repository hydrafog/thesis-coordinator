import { LIMITS } from "../config/constants.js";
import { gradeRecord } from "../core/selectors.js";
import { isGrade } from "../core/validation.js";

export function setGrade(state, student, index, value) {
  const record = gradeRecord(state, student);
  if (record.closed) {
    return { changed: false, message: "Grading is closed for this student." };
  }
  const text = String(value ?? "").trim();
  if (text !== "" && !isGrade(text)) {
    return {
      changed: false,
      message: `Enter a grade from ${LIMITS.gradeMin} to ${LIMITS.gradeMax}.`,
    };
  }
  const values = [...record.values];
  values[index] = text;
  state.grades[student] = { ...record, values };
  return { changed: true, message: "" };
}

export function closeGrading(state, student) {
  const record = gradeRecord(state, student);
  if (record.closed) {
    return { changed: false, message: "Grading is already closed." };
  }
  if (!record.values.every(isGrade)) {
    return {
      changed: false,
      message: "Enter all three grades before closing grading.",
    };
  }
  state.grades[student] = { ...record, closed: true };
  return { changed: true, message: "Final grades locked." };
}
