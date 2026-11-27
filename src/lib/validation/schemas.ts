import { z } from "zod";
import { DomainError } from "@/core/errors/domain-error";

export const idSchema = z.string().trim().min(1).max(64);

export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new DomainError(
      "validation_failed",
      result.error.issues[0]?.message ?? "The request is not valid.",
    );
  }
  return result.data;
}
