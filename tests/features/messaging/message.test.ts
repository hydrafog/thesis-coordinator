import { describe, it, expect } from "vitest";
import {
  assertParticipant,
  previewOf,
  recipientOf,
} from "../../../src/features/messaging/domain/conversation";
import {
  MAX_MESSAGE_LENGTH,
  markMessagesRead,
  mergeMessages,
  validateMessage,
  type MessageView,
} from "../../../src/features/messaging/domain/message";

function message(id: string, createdAt: string, readAt: string | null = null) {
  return {
    id,
    conversationId: "c1",
    senderId: "s1",
    content: id,
    createdAt,
    readAt,
    attachments: [],
  } satisfies MessageView;
}

function codeOf(action: () => unknown): string | undefined {
  try {
    action();
  } catch (error) {
    return (error as { code?: string }).code;
  }
  return undefined;
}

describe("message validation", () => {
  it("trims content and requires text or an attachment", () => {
    expect(validateMessage("  hello ", false)).toBe("hello");
    expect(validateMessage("   ", true)).toBe("");
    const code = codeOf(() => validateMessage("   ", false));
    expect(code).toBe("validation_failed");
  });

  it("limits message length", () => {
    expect(validateMessage("a".repeat(MAX_MESSAGE_LENGTH), false)).toHaveLength(
      MAX_MESSAGE_LENGTH,
    );
    expect(
      codeOf(() => validateMessage("a".repeat(MAX_MESSAGE_LENGTH + 1), false)),
    ).toBe("validation_failed");
  });
});

describe("conversation membership", () => {
  it("allows only the two participants", () => {
    expect(codeOf(() => assertParticipant(["a", "b"], "a"))).toBeUndefined();
    expect(codeOf(() => assertParticipant(["a", "b"], "c"))).toBe("forbidden");
  });

  it("finds the other participant", () => {
    expect(recipientOf(["a", "b"], "a")).toBe("b");
    expect(recipientOf(["a"], "a")).toBeNull();
  });

  it("previews text or attachment name", () => {
    expect(previewOf({ content: "hi", attachmentName: null })).toBe("hi");
    expect(previewOf({ content: "", attachmentName: "a.pdf" })).toBe(
      "Attachment: a.pdf",
    );
  });
});

describe("message list merging", () => {
  it("deduplicates by id, keeps order, and prefers newer data", () => {
    const first = message("m1", "2025-01-01T10:00:00Z");
    const second = message("m2", "2025-01-01T10:01:00Z");
    const readAt = "2025-01-01T10:05:00Z";
    const secondRead = message("m2", "2025-01-01T10:01:00Z", readAt);
    const merged = mergeMessages([second, first], [secondRead]);
    expect(merged.map((entry) => entry.id)).toEqual(["m1", "m2"]);
    expect(merged[1]?.readAt).toBe("2025-01-01T10:05:00Z");
  });

  it("marks only the listed messages as read", () => {
    const list = [
      message("m1", "2025-01-01T10:00:00Z"),
      message("m2", "2025-01-01T10:01:00Z"),
    ];
    const updated = markMessagesRead(list, ["m1"], "2025-01-01T11:00:00Z");
    expect(updated[0]?.readAt).toBe("2025-01-01T11:00:00Z");
    expect(updated[1]?.readAt).toBeNull();
  });
});
