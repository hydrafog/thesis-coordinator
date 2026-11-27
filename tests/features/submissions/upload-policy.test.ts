import { describe, it, expect } from "vitest";
import {
  assertContentMatchesFormat,
  buildObjectKey,
  validateUpload,
} from "../../../src/features/submissions/domain/attachment";

const MAX = 52_428_800;

function candidate(overrides: Partial<Parameters<typeof validateUpload>[0]>) {
  return {
    fileName: "draft.pdf",
    size: 1024,
    mimeType: "application/pdf",
    ...overrides,
  };
}

function codeOf(action: () => unknown): string | undefined {
  try {
    action();
  } catch (error) {
    return (error as { code?: string }).code;
  }
  return undefined;
}

describe("upload validation", () => {
  it("accepts a PDF and a ZIP within the limit", () => {
    expect(validateUpload(candidate({}), { maxBytes: MAX })).toBe("pdf");
    expect(
      validateUpload(
        candidate({ fileName: "code.ZIP", mimeType: "application/zip" }),
        { maxBytes: MAX },
      ),
    ).toBe("zip");
  });

  it("accepts a file of exactly 50 MB and rejects one byte more", () => {
    expect(validateUpload(candidate({ size: MAX }), { maxBytes: MAX })).toBe(
      "pdf",
    );
    const oversize = candidate({ size: MAX + 1 });
    expect(codeOf(() => validateUpload(oversize, { maxBytes: MAX }))).toBe(
      "upload_too_large",
    );
  });

  it("checks the size before any other property", () => {
    expect(
      codeOf(() =>
        validateUpload(candidate({ size: MAX + 1, fileName: "../x.exe" }), {
          maxBytes: MAX,
        }),
      ),
    ).toBe("upload_too_large");
  });

  it("rejects formats outside the allow-list", () => {
    const executable = candidate({
      fileName: "run.exe",
      mimeType: "application/x-msdownload",
    });
    const mismatched = candidate({ mimeType: "application/zip" });
    for (const file of [executable, mismatched]) {
      expect(codeOf(() => validateUpload(file, { maxBytes: MAX }))).toBe(
        "unsupported_format",
      );
    }
  });

  it("restricts to the requested formats", () => {
    expect(
      codeOf(() =>
        validateUpload(
          candidate({ fileName: "a.zip", mimeType: "application/zip" }),
          { maxBytes: MAX, formats: ["pdf"] },
        ),
      ),
    ).toBe("unsupported_format");
  });

  it("rejects file names with path separators or traversal", () => {
    for (const fileName of ["a/b.pdf", "a\\b.pdf", "../a.pdf", "a\u0000.pdf"]) {
      const file = candidate({ fileName });
      expect(codeOf(() => validateUpload(file, { maxBytes: MAX }))).toBe(
        "invalid_filename",
      );
    }
  });

  it("rejects empty files", () => {
    expect(
      codeOf(() => validateUpload(candidate({ size: 0 }), { maxBytes: MAX })),
    ).toBe("validation_failed");
  });
});

describe("content signature", () => {
  it("accepts matching magic bytes", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7 body");
    const zip = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x00]);
    expect(() => assertContentMatchesFormat(pdf, "pdf")).not.toThrow();
    expect(() => assertContentMatchesFormat(zip, "zip")).not.toThrow();
  });

  it("rejects content that does not match the declared format", () => {
    const text = new TextEncoder().encode("MZ not a pdf");
    expect(codeOf(() => assertContentMatchesFormat(text, "pdf"))).toBe(
      "unsupported_format",
    );
  });
});

describe("object keys", () => {
  it("are server generated and never reuse the user file name", () => {
    const key = buildObjectKey("submissions/t1", "pdf");
    expect(key).toMatch(/^submissions\/t1\/[0-9a-f-]{36}\.pdf$/);
    expect(buildObjectKey("submissions/t1", "pdf")).not.toBe(key);
  });
});
