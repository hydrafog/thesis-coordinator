const DEFAULT_MAX_UPLOAD_BYTES = 52_428_800;

function readInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}.`);
  }
  return value;
}

export function getMaxUploadBytes(): number {
  return readInteger("MAX_UPLOAD_BYTES", DEFAULT_MAX_UPLOAD_BYTES);
}

export function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export function getAuthSecret(): string {
  return required("AUTH_SECRET");
}

export function getStorageConfig() {
  return {
    endpoint: required("MINIO_ENDPOINT"),
    region: process.env.MINIO_REGION ?? "us-east-1",
    bucket: required("MINIO_BUCKET"),
    accessKey: required("MINIO_ACCESS_KEY"),
    secretKey: required("MINIO_SECRET_KEY"),
  };
}

export function getEventsConfig() {
  return {
    publishUrl: process.env.EVENTS_URL ?? null,
    internalToken: process.env.EVENTS_INTERNAL_TOKEN ?? null,
    port: readInteger("EVENTS_PORT", 3001),
    appInternalUrl: process.env.APP_INTERNAL_URL ?? getAppUrl(),
    allowedOrigin: getAppUrl(),
  };
}

export function getMailConfig() {
  return {
    host: process.env.SMTP_HOST ?? null,
    port: readInteger("SMTP_PORT", 587),
    from: process.env.SMTP_FROM ?? "thesis@localhost",
    user: process.env.SMTP_USER ?? null,
    password: process.env.SMTP_PASSWORD ?? null,
  };
}
