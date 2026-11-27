type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, message: string, context?: object): void {
  const line = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...context,
  });
  const stream = level === "info" ? process.stdout : process.stderr;
  stream.write(`${line}\n`);
}

// Callers pass identifiers and codes only; never file contents or tokens.
export const logger = {
  info: (message: string, context?: object) => write("info", message, context),
  warn: (message: string, context?: object) => write("warn", message, context),
  error: (message: string, context?: object) =>
    write("error", message, context),
};

export function errorContext(error: unknown): { error: string } {
  return { error: error instanceof Error ? error.message : "unknown error" };
}
