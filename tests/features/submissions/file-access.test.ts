import { describe, it, expect } from "vitest";
import { UserRole } from "@prisma/client";
import {
  authorizeFileAccess,
  contentDispositionFor,
  type FileAccessContext,
} from "../../../src/features/submissions/domain/file-access";

const submissionFile: FileAccessContext = {
  fileName: "thesis.pdf",
  mimeType: "application/pdf",
  memberUserIds: ["student-1", "coordinator-1"],
  staffAllowed: true,
};

const attachment: FileAccessContext = {
  ...submissionFile,
  staffAllowed: false,
};

function codeOf(action: () => unknown): string | undefined {
  try {
    action();
  } catch (error) {
    return (error as { code?: string }).code;
  }
  return undefined;
}

describe("file access authorization", () => {
  it("allows the student and coordinator of the thesis", () => {
    for (const id of ["student-1", "coordinator-1"]) {
      const requester = { id, roles: [UserRole.STUDENT] };
      const code = codeOf(() => authorizeFileAccess(submissionFile, requester));
      expect(code).toBeUndefined();
    }
  });

  it("returns forbidden for an unrelated user", () => {
    expect(
      codeOf(() =>
        authorizeFileAccess(submissionFile, {
          id: "student-2",
          roles: [UserRole.STUDENT],
        }),
      ),
    ).toBe("forbidden");
  });

  it("lets staff open dossier files but not private attachments", () => {
    const admin = { id: "admin-1", roles: [UserRole.ADMINISTRATOR] };
    const dossier = codeOf(() => authorizeFileAccess(submissionFile, admin));
    const chat = codeOf(() => authorizeFileAccess(attachment, admin));
    expect(dossier).toBeUndefined();
    expect(chat).toBe("forbidden");
  });

  it("builds a safe content disposition header", () => {
    const header = contentDispositionFor('bad"\r\nname.pdf');
    expect(header).not.toMatch(/[\r\n]/);
    expect(header).toContain("attachment;");
  });
});
