import { DossierState, DossierItemType, ItemStatus } from "@prisma/client";

export { DossierState, DossierItemType, ItemStatus };

export interface DefenseFileItemDomain {
  id: string;
  defenseFileId: string;
  type: DossierItemType;
  name: string;
  fileKey: string | null;
  status: ItemStatus;
}

export interface DefenseFileDomain {
  id: string;
  thesisId: string;
  state: DossierState;
  feedback: string | null;
  verifiedAt: Date | null;
  items: DefenseFileItemDomain[];
}

export const MANDATORY_DOSSIER_TYPES: DossierItemType[] = [
  DossierItemType.FINAL_THESIS,
  DossierItemType.COORDINATOR_REPORT,
  DossierItemType.SIMILARITY_REPORT,
  DossierItemType.APPROVAL_RECORD,
];

export function canVerifyDossier(
  items: Array<{ type: DossierItemType; status: ItemStatus }>,
): {
  canVerify: boolean;
  missingItems: DossierItemType[];
} {
  const missingItems = MANDATORY_DOSSIER_TYPES.filter((type) => {
    const item = items.find((i) => i.type === type);
    return !item || item.status !== ItemStatus.COMPLETE;
  });

  return {
    canVerify: missingItems.length === 0,
    missingItems,
  };
}

export function transitionDossierState(
  currentState: DossierState,
  action: "SUBMIT" | "VERIFY" | "RETURN",
  params?: {
    items?: Array<{ type: DossierItemType; status: ItemStatus }>;
    feedback?: string;
  },
): { newState: DossierState; error?: string } {
  switch (action) {
    case "SUBMIT":
      if (
        currentState !== DossierState.DRAFT &&
        currentState !== DossierState.RETURNED
      ) {
        return {
          newState: currentState,
          error: `Cannot submit dossier in state ${currentState}.`,
        };
      }
      return { newState: DossierState.SUBMITTED };

    case "VERIFY":
      if (currentState !== DossierState.SUBMITTED) {
        return {
          newState: currentState,
          error: `Only submitted dossiers can be verified (current: ${currentState}).`,
        };
      }
      if (params?.items) {
        const { canVerify, missingItems } = canVerifyDossier(params.items);
        if (!canVerify) {
          return {
            newState: currentState,
            error: `Cannot verify dossier: Missing or incomplete required items (${missingItems.join(", ")}).`,
          };
        }
      }
      return { newState: DossierState.VERIFIED };

    case "RETURN":
      if (currentState !== DossierState.SUBMITTED) {
        return {
          newState: currentState,
          error: `Only submitted dossiers can be returned for correction (current: ${currentState}).`,
        };
      }
      if (!params?.feedback || params.feedback.trim() === "") {
        return {
          newState: currentState,
          error:
            "Feedback is required when returning a dossier for correction.",
        };
      }
      return { newState: DossierState.RETURNED };

    default:
      return { newState: currentState, error: "Invalid action." };
  }
}
