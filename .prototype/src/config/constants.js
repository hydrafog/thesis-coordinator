export const STORAGE_KEY = "prototype-v2.role-aware.v1";

export const ROLES = Object.freeze({
  coordinator: "coordinator",
  student: "student",
});

export const ZOOM_PRESETS = Object.freeze(["125", "140", "155"]);
export const DEFAULT_ZOOM = "140";

export const ACCENTS = Object.freeze([
  "vermilion",
  "pink",
  "teal",
  "amber",
  "violet",
]);
export const DEFAULT_ACCENT = "vermilion";

export const THEME_MODES = Object.freeze(["light", "dark"]);
export const DEFAULT_THEME = "light";

export const LIMITS = Object.freeze({
  uploadBytes: 52428800,
  topicTitle: 120,
  topicObjectives: 550,
  topicTechnologies: 170,
  topicDescription: 700,
  milestoneName: 100,
  reviewComment: 800,
  message: 2000,
  displayName: 60,
  gradeMin: 1,
  gradeMax: 10,
});

export const UPLOAD_EXTENSIONS = Object.freeze(["pdf", "zip"]);

export const COORDINATOR_NAME = "Dr. Martha Jones";
export const STUDENT_NAME = "Clara Oswald";
export const COMMITTEE_MEMBERS = Object.freeze([
  "Dr. Martha Jones",
  "Prof. Alan Turing",
  "Dr. Sarah Jane",
]);
export const CANDIDATE_STUDENTS = Object.freeze([
  "Liam Vance",
  "Hana Tanaka",
  "Mateo Silva",
  STUDENT_NAME,
]);

export const PAGE_TITLES = Object.freeze({
  overview: "Overview",
  settings: "Settings",
  students: "Students",
  chat: "Chat",
  review: "Review",
  schedule: "Schedule",
  gradebook: "Gradebook",
  coordinators: "Coordinators",
  "my-thesis": "My thesis",
});

export const SEARCHABLE_PAGES = Object.freeze([
  "students",
  "coordinators",
  "schedule",
]);
