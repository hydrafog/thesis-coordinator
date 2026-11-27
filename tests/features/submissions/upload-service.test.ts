import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubmissionState } from "@prisma/client";

vi.mock("@/features/submissions/data/storage-client", () => ({
  storeFile: vi.fn(),
  discardFile: vi.fn(),
}));
vi.mock("@/features/submissions/data/submission-repository", () => ({
  submissionRepository: {
    findThesisAccess: vi.fn(),
    findStateForThesis: vi.fn(),
    milestoneBelongsToThesis: vi.fn(),
    addVersion: vi.fn(),
  },
}));
vi.mock("@/core/documents/pdf-text", () => ({ extractPdfText: vi.fn() }));

import { storeFile } from "@/features/submissions/data/storage-client";
import { submissionRepository } from "@/features/submissions/data/submission-repository";
import { uploadSubmissionVersion } from "@/features/submissions/service/submission-service";

const student = { id: "student-1", roles: [] };

function fakeFile(size: number) {
  const arrayBuffer = vi.fn(async () => new ArrayBuffer(0));
  const file = {
    name: "draft.pdf",
    size,
    type: "application/pdf",
    arrayBuffer,
  } as unknown as File;
  return { file, arrayBuffer };
}

function input(file: File, submissionId: string | null = null) {
  return {
    actor: student,
    thesisId: "thesis-1",
    submissionId,
    title: "Chapter 1",
    notes: null,
    milestoneId: null,
    file,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(submissionRepository.findThesisAccess).mockResolvedValue({
    id: "thesis-1",
    title: "Thesis",
    studentUserId: "student-1",
    coordinatorUserId: "coordinator-1",
  });
});

describe("uploadSubmissionVersion", () => {
  it("rejects files over 50 MB before reading or storing them", async () => {
    const { file, arrayBuffer } = fakeFile(52_428_801);

    await expect(uploadSubmissionVersion(input(file))).rejects.toMatchObject({
      code: "upload_too_large",
    });
    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(storeFile).not.toHaveBeenCalled();
    expect(submissionRepository.addVersion).not.toHaveBeenCalled();
  });

  it("rejects uploads from someone other than the thesis owner", async () => {
    const { file } = fakeFile(1024);

    const stranger = { id: "someone-else", roles: [] };

    await expect(
      uploadSubmissionVersion({ ...input(file), actor: stranger }),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(storeFile).not.toHaveBeenCalled();
  });

  it("refuses to replace a locked final submission", async () => {
    vi.mocked(submissionRepository.findStateForThesis).mockResolvedValue(
      SubmissionState.LOCKED,
    );
    const { file } = fakeFile(1024);

    await expect(
      uploadSubmissionVersion(input(file, "submission-1")),
    ).rejects.toMatchObject({ code: "submission_locked" });
    expect(storeFile).not.toHaveBeenCalled();
  });
});
