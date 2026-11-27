import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DOWNLOAD_URL_TTL_SECONDS,
  createDownloadUrl,
  isSafeObjectKey,
  verifyDownloadGrant,
} from "../../../src/core/storage/signed-url";

const KEY = "submissions/thesis-1/5f1c2d1e-0c1d-4b8a-9f64-2b1f8d0f6a11.pdf";
const NOW = new Date("2025-03-01T12:00:00Z");

function grantFrom(url: string, key: string) {
  const query = new URL(url, "http://localhost").searchParams;
  return {
    key,
    userId: query.get("u") ?? "",
    expires: Number(query.get("exp")),
    signature: query.get("sig") ?? "",
  };
}

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "unit-test-secret-unit-test-secret-32");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("signed download URLs", () => {
  it("verifies a fresh grant", () => {
    const grant = grantFrom(createDownloadUrl(KEY, "user-1", NOW), KEY);
    expect(verifyDownloadGrant(grant, NOW)).toBe(true);
  });

  it("expires after five minutes", () => {
    const grant = grantFrom(createDownloadUrl(KEY, "user-1", NOW), KEY);
    const elapsedMs = (DOWNLOAD_URL_TTL_SECONDS + 1) * 1000;
    const later = new Date(NOW.getTime() + elapsedMs);
    expect(verifyDownloadGrant(grant, later)).toBe(false);
  });

  it("is bound to the user and the object key", () => {
    const grant = grantFrom(createDownloadUrl(KEY, "user-1", NOW), KEY);
    const otherUser = { ...grant, userId: "user-2" };
    const otherKey = { ...grant, key: KEY.replace("thesis-1", "thesis-2") };
    const badSignature = { ...grant, signature: "00" };
    expect(verifyDownloadGrant(otherUser, NOW)).toBe(false);
    expect(verifyDownloadGrant(otherKey, NOW)).toBe(false);
    expect(verifyDownloadGrant(badSignature, NOW)).toBe(false);
  });

  it("rejects keys that could traverse paths", () => {
    expect(isSafeObjectKey(KEY)).toBe(true);
    const unsafe = ["../secret", "a/../b.pdf", "/abs.pdf", "a//b.pdf", "A.pdf"];
    for (const key of unsafe) {
      expect(isSafeObjectKey(key)).toBe(false);
    }
  });
});
