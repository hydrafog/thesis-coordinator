import { timingSafeEqual } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from "node:http";
import { Server } from "socket.io";
import { UserRole } from "@prisma/client";
import { getEventsConfig } from "../config/app-config";
import { errorContext, logger } from "../logging/logger";
import { canSubscribe, type RealtimeUser } from "./authorization";
import {
  REALTIME_EVENTS,
  isRealtimeEvent,
  parseChannel,
  type RealtimeEventName,
} from "./channels";

const MAX_BODY_BYTES = 64 * 1024;
const SESSION_LOOKUP_TIMEOUT_MS = 3_000;
const MAX_TIMER_MS = 2 ** 31 - 1;
const KNOWN_ROLES = new Set<string>(Object.values(UserRole));

interface AuthenticatedSession {
  user: RealtimeUser;
  expiresAt: number | null;
}

interface AckResult {
  ok: boolean;
  error?: string;
}

interface PublishRequest {
  channel: string;
  event: RealtimeEventName;
  payload: object;
  excludeUserId?: string;
}

function userOf(socket: { data: unknown }): RealtimeUser {
  return (socket.data as { user: RealtimeUser }).user;
}

async function resolveSession(
  cookie: string | undefined,
  sessionUrl: string,
): Promise<AuthenticatedSession | null> {
  if (!cookie) {
    return null;
  }
  const response = await fetch(sessionUrl, {
    headers: { cookie },
    signal: AbortSignal.timeout(SESSION_LOOKUP_TIMEOUT_MS),
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as {
    user?: { id?: unknown; roles?: unknown };
    expires?: unknown;
  } | null;
  const id = body?.user?.id;
  const roles = body?.user?.roles;
  if (typeof id !== "string" || id === "" || !Array.isArray(roles)) {
    return null;
  }
  const expiresAt =
    typeof body?.expires === "string" ? Date.parse(body.expires) : Number.NaN;
  return {
    user: {
      id,
      roles: roles.filter(
        (role): role is UserRole =>
          typeof role === "string" && KNOWN_ROLES.has(role),
      ),
    },
    expiresAt: Number.isNaN(expiresAt) ? null : expiresAt,
  };
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error("payload too large");
    }
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function hasValidToken(request: IncomingMessage, token: string): boolean {
  const header = request.headers.authorization ?? "";
  const expected = Buffer.from(`Bearer ${token}`);
  const actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function parsePublishRequest(body: unknown): PublishRequest | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const { channel, event, payload, excludeUserId } = body as Record<
    string,
    unknown
  >;
  if (
    !parseChannel(channel) ||
    !isRealtimeEvent(event) ||
    typeof payload !== "object" ||
    payload === null
  ) {
    return null;
  }
  return {
    channel: channel as string,
    event,
    payload,
    excludeUserId:
      typeof excludeUserId === "string" ? excludeUserId : undefined,
  };
}

function respond(response: ServerResponse, status: number, body: object) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

export interface EventsServer {
  httpServer: HttpServer;
  io: Server;
  listen: (port?: number) => Promise<void>;
  close: () => Promise<void>;
}

export function createEventsServer(): EventsServer {
  const config = getEventsConfig();
  const sessionUrl = `${config.appInternalUrl}/api/auth/session`;

  const httpServer = createServer((request, response) => {
    void handleHttp(request, response);
  });

  const io = new Server(httpServer, {
    cors: { origin: config.allowedOrigin, credentials: true },
    allowRequest: (request, callback) => {
      const origin = request.headers.origin;
      callback(null, origin === undefined || origin === config.allowedOrigin);
    },
  });

  async function handleHttp(
    request: IncomingMessage,
    response: ServerResponse,
  ) {
    if (request.method === "GET" && request.url === "/healthz") {
      respond(response, 200, { status: "ok" });
      return;
    }
    if (request.method !== "POST" || request.url !== "/internal/publish") {
      respond(response, 404, { error: "not_found" });
      return;
    }
    if (
      !config.internalToken ||
      !hasValidToken(request, config.internalToken)
    ) {
      respond(response, 401, { error: "unauthorized" });
      return;
    }
    try {
      const message = parsePublishRequest(await readJson(request));
      if (!message) {
        respond(response, 400, { error: "invalid_request" });
        return;
      }
      const sockets = await io.in(message.channel).fetchSockets();
      const recipients = new Set(
        sockets
          .map((socket) => userOf(socket).id)
          .filter((id) => id !== message.excludeUserId),
      );
      io.in(message.channel).emit(message.event, message.payload);
      respond(response, 200, { recipients: recipients.size });
    } catch (error) {
      logger.warn("internal publish failed", errorContext(error));
      respond(response, 400, { error: "invalid_request" });
    }
  }

  io.use(async (socket, next) => {
    try {
      const session = await resolveSession(
        socket.handshake.headers.cookie,
        sessionUrl,
      );
      if (!session) {
        next(new Error("unauthorized"));
        return;
      }
      socket.data = { user: session.user };
      if (session.expiresAt !== null) {
        const remaining = Math.max(session.expiresAt - Date.now(), 0);
        const timer = setTimeout(
          () => socket.disconnect(true),
          Math.min(remaining, MAX_TIMER_MS),
        );
        socket.on("disconnect", () => clearTimeout(timer));
      }
      next();
    } catch (error) {
      logger.warn("socket authentication failed", errorContext(error));
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = userOf(socket);

    socket.on("subscribe", async (name: unknown, ack?: unknown) => {
      const reply = (result: AckResult) => {
        if (typeof ack === "function") {
          (ack as (result: AckResult) => void)(result);
        }
      };
      const channel = parseChannel(name);
      if (!channel) {
        reply({ ok: false, error: "invalid_channel" });
        return;
      }
      try {
        if (!(await canSubscribe(user, channel))) {
          reply({ ok: false, error: "forbidden" });
          return;
        }
        await socket.join(name as string);
        reply({ ok: true });
      } catch (error) {
        logger.error("socket subscribe failed", errorContext(error));
        reply({ ok: false, error: "internal_error" });
      }
    });

    socket.on("unsubscribe", async (name: unknown) => {
      if (parseChannel(name)) {
        await socket.leave(name as string);
      }
    });

    socket.on("typing", (input: unknown) => {
      if (typeof input !== "object" || input === null) {
        return;
      }
      const { channel: name, typing } = input as Record<string, unknown>;
      const channel = parseChannel(name);
      if (
        !channel ||
        channel.kind !== "conversation" ||
        typeof typing !== "boolean" ||
        !socket.rooms.has(name as string)
      ) {
        return;
      }
      socket.to(name as string).emit(REALTIME_EVENTS.MESSAGE_TYPING, {
        conversationId: channel.id,
        userId: user.id,
        typing,
      });
    });
  });

  return {
    httpServer,
    io,
    listen: (port = config.port) =>
      new Promise<void>((resolve) => {
        httpServer.listen(port, resolve);
      }),
    close: () =>
      new Promise<void>((resolve) => {
        void io.close(() => resolve());
      }),
  };
}
