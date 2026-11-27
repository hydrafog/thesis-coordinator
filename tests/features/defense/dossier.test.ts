import { describe, it, expect } from "vitest";
import {
  canVerifyDossier,
  transitionDossierState,
  DossierState,
  DossierItemType,
  ItemStatus,
} from "../../../src/features/defense/domain/defense-file";

describe("Defense Dossier Domain & State Transitions", () => {
  it("rejects verification if mandatory checklist items are incomplete", () => {
    const items = [
      { type: DossierItemType.FINAL_THESIS, status: ItemStatus.COMPLETE },
      { type: DossierItemType.COORDINATOR_REPORT, status: ItemStatus.PENDING },
      { type: DossierItemType.SIMILARITY_REPORT, status: ItemStatus.PENDING },
      { type: DossierItemType.APPROVAL_RECORD, status: ItemStatus.COMPLETE },
    ];

    const result = canVerifyDossier(items);
    expect(result.canVerify).toBe(false);
    expect(result.missingItems).toContain(DossierItemType.COORDINATOR_REPORT);
    expect(result.missingItems).toContain(DossierItemType.SIMILARITY_REPORT);
  });

  it("approves verification check when all mandatory items are complete", () => {
    const items = [
      { type: DossierItemType.FINAL_THESIS, status: ItemStatus.COMPLETE },
      { type: DossierItemType.COORDINATOR_REPORT, status: ItemStatus.COMPLETE },
      { type: DossierItemType.SIMILARITY_REPORT, status: ItemStatus.COMPLETE },
      { type: DossierItemType.APPROVAL_RECORD, status: ItemStatus.COMPLETE },
    ];

    const result = canVerifyDossier(items);
    expect(result.canVerify).toBe(true);
    expect(result.missingItems.length).toBe(0);
  });

  it("handles valid state transitions: DRAFT -> SUBMITTED -> VERIFIED", () => {
    const submit = transitionDossierState(DossierState.DRAFT, "SUBMIT");
    expect(submit.newState).toBe(DossierState.SUBMITTED);
    expect(submit.error).toBeUndefined();

    const completeItems = [
      { type: DossierItemType.FINAL_THESIS, status: ItemStatus.COMPLETE },
      { type: DossierItemType.COORDINATOR_REPORT, status: ItemStatus.COMPLETE },
      { type: DossierItemType.SIMILARITY_REPORT, status: ItemStatus.COMPLETE },
      { type: DossierItemType.APPROVAL_RECORD, status: ItemStatus.COMPLETE },
    ];

    const verify = transitionDossierState(submit.newState, "VERIFY", {
      items: completeItems,
    });
    expect(verify.newState).toBe(DossierState.VERIFIED);
    expect(verify.error).toBeUndefined();
  });

  it("handles correction cycle: SUBMITTED -> RETURNED -> SUBMITTED", () => {
    const returnAttempt = transitionDossierState(
      DossierState.SUBMITTED,
      "RETURN",
      {
        feedback: "Please upload the revised coordinator report.",
      },
    );
    expect(returnAttempt.newState).toBe(DossierState.RETURNED);
    expect(returnAttempt.error).toBeUndefined();

    const resubmit = transitionDossierState(DossierState.RETURNED, "SUBMIT");
    expect(resubmit.newState).toBe(DossierState.SUBMITTED);
  });

  it("rejects RETURN action without feedback", () => {
    const returnWithoutFeedback = transitionDossierState(
      DossierState.SUBMITTED,
      "RETURN",
      { feedback: "" },
    );
    expect(returnWithoutFeedback.error).toContain("Feedback is required");
    expect(returnWithoutFeedback.newState).toBe(DossierState.SUBMITTED);
  });
});
