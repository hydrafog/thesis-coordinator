import { createEventsServer } from "./socket-server";
import { getEventsConfig } from "../config/app-config";
import { errorContext, logger } from "../logging/logger";

const server = createEventsServer();

server
  .listen()
  .then(() =>
    logger.info("events server listening", { port: getEventsConfig().port }),
  )
  .catch((error: unknown) => {
    logger.error("events server failed to start", errorContext(error));
    process.exit(1);
  });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void server.close().then(() => process.exit(0));
  });
}
