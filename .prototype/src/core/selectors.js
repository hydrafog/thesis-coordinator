import { COORDINATOR_NAME, STUDENT_NAME } from "../config/constants.js";

const OPEN_STATUSES = Object.freeze(["submitted", "changes-requested"]);
const TOPIC_STATUSES = Object.freeze(["draft", "submitted", "approved", "changes-requested"]);

export function coordinatorByName(state, name) {
  return state.coordinators.find((coordinator) => coordinator.name === name);
}

export function proposalsOf(state, coordinatorName) {
  return state.proposals.filter((proposal) => proposal.coordinator === coordinatorName);
}

export function approvedProposalsOf(state, coordinatorName) {
  return proposalsOf(state, coordinatorName).filter((proposal) => proposal.status === "approved");
}

export function usedPlaces(state, coordinatorName) {
  const coordinator = coordinatorByName(state, coordinatorName);
  const reserved = coordinator ? coordinator.reserved : 0;
  return approvedProposalsOf(state, coordinatorName).length + reserved;
}

export function freePlaces(state, coordinatorName) {
  const coordinator = coordinatorByName(state, coordinatorName);
  if (!coordinator) {
    return 0;
  }
  return Math.max(0, coordinator.quota - usedPlaces(state, coordinatorName));
}

export function awaitingDecision(state, coordinatorName) {
  return proposalsOf(state, coordinatorName).filter((proposal) => OPEN_STATUSES.includes(proposal.status));
}

export function activeTopicOf(state, studentName = STUDENT_NAME) {
  return state.proposals.find(
    (proposal) => proposal.student === studentName && TOPIC_STATUSES.includes(proposal.status),
  );
}

export function isSupervisedBy(state, studentName, coordinatorName = COORDINATOR_NAME) {
  return state.proposals.some(
    (proposal) =>
      proposal.student === studentName && proposal.coordinator === coordinatorName && proposal.status === "approved",
  );
}

export function supervisedStudents(state, coordinatorName = COORDINATOR_NAME) {
  return approvedProposalsOf(state, coordinatorName);
}

export function milestonesOf(state, studentName) {
  return state.milestones.filter((milestone) => milestone.student === studentName);
}

export function openMilestonesByDue(state, studentNames) {
  return state.milestones
    .filter((milestone) => !milestone.done && studentNames.includes(milestone.student))
    .sort((a, b) => a.due.localeCompare(b.due));
}

export function slotsOf(state, studentName) {
  return studentName ? state.slots.filter((slot) => slot.student === studentName) : state.slots;
}

export function sortedSlots(slots) {
  return [...slots].sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`));
}

export function messagesWith(state, studentName) {
  return state.messages[studentName] ?? [];
}

export function gradeRecord(state, studentName) {
  return state.grades[studentName] ?? { values: ["", "", ""], closed: false };
}

export function documentsOf(state, studentName) {
  return state.documents[studentName] ?? {};
}

export function matchesQuery(query, parts) {
  if (!query) {
    return true;
  }
  return parts.join(" ").toLowerCase().includes(query.toLowerCase());
}
