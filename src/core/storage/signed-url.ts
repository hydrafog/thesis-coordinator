import { createHmac, timingSafeEqual } from "node:crypto";
import { getAuthSecret } from "@/core/config/app-config";

export const DOWNLOAD_URL_TTL_SECONDS = 300;

const SAFE_KEY = /^[a-z0-9][a-z0-9/_.-]*$/;

export function isSafeObjectKey(key: string): boolean {
  return (
    key.length <= 512 &&
    SAFE_KEY.test(key) &&
    !key.includes("..") &&
    !key.includes("//") &&
    !key.endsWith("/")
  );
}

function sign(key: string, userId: string, expires: number): string {
  return createHmac("sha256", getAuthSecret())
    .update(`${key}\n${userId}\n${expires}`)
    .digest("hex");
}

export interface DownloadGrant {
  key: string;
  userId: string;
  expires: number;
  signature: string;
}

export function createDownloadUrl(
  key: string,
  userId: string,
  now: Date = new Date(),
): string {
  const expires =
    Math.floor(now.getTime() / 1000) + DOWNLOAD_URL_TTL_SECONDS;
  const query = new URLSearchParams({
    u: userId,
    exp: String(expires),
    sig: sign(key, userId, expires),
  });
  return `/api/files/${key}?${query.toString()}`;
}

export function verifyDownloadGrant(
  grant: DownloadGrant,
  now: Date = new Date(),
): boolean {
  if (!isSafeObjectKey(grant.key)) {
    return false;
  }
  if (
    !Number.isSafeInteger(grant.expires) ||
    grant.expires < Math.floor(now.getTime() / 1000)
  ) {
    return false;
  }
  const expected = Buffer.from(sign(grant.key, grant.userId, grant.expires));
  const actual = Buffer.from(grant.signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
