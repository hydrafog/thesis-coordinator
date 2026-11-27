"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

export type ChannelHandlers = Record<string, (payload: unknown) => void>;

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_EVENTS_URL;
    const options = { withCredentials: true };
    socket = url ? io(url, options) : io(options);
  }
  return socket;
}

export function emitTyping(channel: string, typing: boolean): void {
  getSocket().emit("typing", { channel, typing });
}

export function useChannel(
  channel: string | null,
  handlers: ChannelHandlers,
): void {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });
  const eventNames = Object.keys(handlers).sort().join(",");

  useEffect(() => {
    if (!channel) {
      return;
    }
    const connection = getSocket();
    const listeners = (eventNames ? eventNames.split(",") : []).map(
      (name) => {
        const listener = (payload: unknown) => latest.current[name]?.(payload);
        connection.on(name, listener);
        return [name, listener] as const;
      },
    );
    const subscribe = () => connection.emit("subscribe", channel);
    connection.on("connect", subscribe);
    if (connection.connected) {
      subscribe();
    }
    return () => {
      connection.off("connect", subscribe);
      for (const [name, listener] of listeners) {
        connection.off(name, listener);
      }
      connection.emit("unsubscribe", channel);
    };
  }, [channel, eventNames]);
}
