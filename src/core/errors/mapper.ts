import { errorContext, logger } from "../logging/logger";
import { DomainError, DomainErrorCode, isDomainError } from "./domain-error";

export type ActionFailure = {
  success: false;
  error: string;
  code: DomainErrorCode | "internal_error";
};

export type ActionResult<T extends object = object> =
  | ({ success: true } & T)
  | ActionFailure;

const HTTP_STATUS: Record<DomainErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  validation_failed: 400,
  upload_too_large: 413,
  unsupported_format: 415,
  invalid_filename: 400,
  invalid_transition: 409,
  submission_locked: 409,
  conflict: 409,
};

export function httpStatusFor(error: DomainError): number {
  return HTTP_STATUS[error.code];
}

export function toActionFailure(error: unknown): ActionFailure {
  if (isDomainError(error)) {
    return { success: false, error: error.message, code: error.code };
  }
  logger.error("unexpected action failure", errorContext(error));
  return {
    success: false,
    error: "The request could not be completed.",
    code: "internal_error",
  };
}

export async function runAction<T extends object>(
  work: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { success: true, ...(await work()) };
  } catch (error) {
    return toActionFailure(error);
  }
}

export function errorResponse(error: unknown): Response {
  const failure = toActionFailure(error);
  const status = isDomainError(error) ? httpStatusFor(error) : 500;
  return Response.json(
    { error: failure.error, code: failure.code },
    { status },
  );
}
