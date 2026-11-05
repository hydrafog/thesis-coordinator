import { LIMITS, STUDENT_NAME } from "../config/constants.js";
import { cleanText } from "../core/validation.js";
import { todayIso } from "../core/format.js";
import { activeTopicOf, coordinatorByName, freePlaces } from "../core/selectors.js";

const OPEN = Object.freeze(["submitted", "changes-requested"]);

function readTopic(values) {
  const topic = {
    title: cleanText(values.title, LIMITS.topicTitle),
    objectives: cleanText(values.objectives, LIMITS.topicObjectives),
    technologies: cleanText(values.technologies, LIMITS.topicTechnologies),
    description: cleanText(values.description, LIMITS.topicDescription),
  };
  return Object.values(topic).every(Boolean) ? topic : null;
}

export function proposeTopic(state, values) {
  if (activeTopicOf(state, STUDENT_NAME)) {
    return { changed: false, message: "You already have one active proposal." };
  }
  const coordinator = coordinatorByName(state, values.coordinator);
  if (!coordinator || freePlaces(state, coordinator.name) <= 0) {
    return { changed: false, message: "This coordinator has no free places." };
  }
  const topic = readTopic(values);
  if (!topic) {
    return { changed: false, message: "Fill in every topic field." };
  }
  state.proposals.push({
    id: `p-${Date.now()}`,
    student: STUDENT_NAME,
    coordinator: coordinator.name,
    ...topic,
    status: "submitted",
    updated: todayIso(),
  });
  return { changed: true, message: "Topic proposal sent to the coordinator." };
}

export function reviseTopic(state, id, values) {
  const proposal = state.proposals.find((item) => item.id === id);
  if (!proposal || proposal.status !== "changes-requested") {
    return { changed: false, message: "This proposal has no requested changes." };
  }
  const topic = readTopic(values);
  if (!topic) {
    return { changed: false, message: "Fill in every topic field." };
  }
  Object.assign(proposal, topic, { status: "submitted", updated: todayIso() });
  return { changed: true, message: "Updated proposal sent for review." };
}

export function decideProposal(state, id, decision) {
  const proposal = state.proposals.find((item) => item.id === id);
  if (!proposal || !OPEN.includes(proposal.status)) {
    return { changed: false, message: "This proposal is already decided." };
  }
  if (decision === "approved" && freePlaces(state, proposal.coordinator) <= 0) {
    return { changed: false, message: "All supervision places are occupied." };
  }
  proposal.status = decision;
  proposal.updated = todayIso();
  const messages = {
    approved: "Proposal approved and supervision started.",
    rejected: "Proposal rejected.",
    "changes-requested": "Changes requested.",
  };
  return { changed: true, message: messages[decision] ?? "Proposal updated." };
}
