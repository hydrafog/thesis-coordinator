import { getEventsConfig } from "../config/app-config";
import { errorContext, logger } from "../logging/logger";
import type { RealtimeEventName } from "./channels";

export interface PublishInput {
  channel: string;
  event: RealtimeEventName;
  payload: object;
  excludeUserId?: string;
}

export interface PublishResult {
  recipients: number;
}

const PUBLISH_TIMEOUT_MS = 2_000;

export async function publishEvent(
  input: PublishInput,
): Promise<PublishResult> {
  const config = getEventsConfig();
  if (!config.publishUrl || !config.internalToken) {
    return { recipients: 0 };
  }
  try {
    const response = await fetch(`${config.publishUrl}/internal/publish`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.internalToken}`,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(PUBLISH_TIMEOUT_MS),
    });
    if (!response.ok) {
      logger.warn("event publish rejected", {
        event: input.event,
        status: response.status,
      });
      return { recipients: 0 };
    }
    const body = (await response.json()) as { recipients?: unknown };
    return {
      recipients: typeof body.recipients === "number" ? body.recipients : 0,
    };
  } catch (error) {
    logger.warn("event publish failed", {
      event: input.event,
      ...errorContext(error),
    });
    return { recipients: 0 };
  }
}
