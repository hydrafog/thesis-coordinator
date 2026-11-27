"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { EVENT_CHANNELS, REALTIME_EVENTS } from "@/core/events/channels";
import { emitTyping, useChannel } from "@/core/events/client";
import { Button } from "@/core/ui/button";
import { Icon } from "@/core/ui/icon";
import { formatClock } from "@/lib/utils/date";
import { loadMessagesAction, markReadAction } from "../actions";
import {
  MAX_MESSAGE_LENGTH,
  deliveryStateOf,
  markMessagesRead,
  mergeMessages,
  type MessageView,
} from "../domain/message";
import { AttachmentPicker } from "./attachment-picker";

export interface ChatPanelProps {
  conversationId: string;
  currentUserId: string;
  counterpartName: string;
  thesisTitle: string;
  initialMessages: MessageView[];
  maxBytes: number;
}

const TYPING_IDLE_MS = 2_000;
const TYPING_EXPIRY_MS = 4_000;

function readPayload(
  payload: unknown,
): { messageIds: string[]; readAt: string } | null {
  const data = payload as { messageIds?: unknown; readAt?: unknown } | null;
  if (
    data &&
    Array.isArray(data.messageIds) &&
    data.messageIds.every((id) => typeof id === "string") &&
    typeof data.readAt === "string"
  ) {
    return { messageIds: data.messageIds as string[], readAt: data.readAt };
  }
  return null;
}

export function ChatPanel({
  conversationId,
  currentUserId,
  counterpartName,
  thesisTitle,
  initialMessages,
  maxBytes,
}: ChatPanelProps) {
  const channel = EVENT_CHANNELS.conversation(conversationId);
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [counterpartTyping, setCounterpartTyping] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const typingStop = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingExpiry = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const result = await loadMessagesAction(conversationId);
    if (result.success) {
      setMessages((current) => mergeMessages(current, result.messages));
    }
  }, [conversationId]);

  useChannel(channel, {
    [REALTIME_EVENTS.MESSAGE_CREATED]: () => {
      void refresh();
    },
    [REALTIME_EVENTS.MESSAGE_READ]: (payload) => {
      const read = readPayload(payload);
      if (read) {
        setMessages((current) =>
          markMessagesRead(current, read.messageIds, read.readAt),
        );
      }
    },
    [REALTIME_EVENTS.MESSAGE_TYPING]: (payload) => {
      const data = payload as { userId?: unknown; typing?: unknown } | null;
      if (!data || data.userId === currentUserId) {
        return;
      }
      setCounterpartTyping(data.typing === true);
      if (typingExpiry.current) {
        clearTimeout(typingExpiry.current);
      }
      typingExpiry.current = setTimeout(
        () => setCounterpartTyping(false),
        TYPING_EXPIRY_MS,
      );
    },
  });

  const unreadCount = messages.filter(
    (message) => message.senderId !== currentUserId && !message.readAt,
  ).length;
  useEffect(() => {
    if (unreadCount === 0) {
      return;
    }
    void markReadAction(conversationId).then((result) => {
      if (!result.success) {
        return;
      }
      setMessages((current) =>
        markMessagesRead(
          current,
          current
            .filter((entry) => entry.senderId !== currentUserId)
            .map((entry) => entry.id),
          new Date().toISOString(),
        ),
      );
    });
  }, [unreadCount, conversationId, currentUserId]);

  useEffect(() => {
    const log = logRef.current;
    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  }, [messages.length]);

  function handleTextChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(event.target.value);
    emitTyping(channel, true);
    if (typingStop.current) {
      clearTimeout(typingStop.current);
    }
    typingStop.current = setTimeout(
      () => emitTyping(channel, false),
      TYPING_IDLE_MS,
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || (text.trim() === "" && !file)) {
      return;
    }
    setError(null);
    setSending(true);
    const data = new FormData();
    data.set("conversationId", conversationId);
    data.set("content", text);
    if (file) {
      data.set("file", file);
    }
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        body: data,
      });
      const body = (await response.json().catch(() => null)) as {
        message?: MessageView;
        error?: string;
      } | null;
      if (!response.ok || !body?.message) {
        setError(body?.error ?? "The message could not be sent.");
        return;
      }
      const sent = body.message;
      setMessages((current) => mergeMessages(current, [sent]));
      setText("");
      setFile(null);
      emitTyping(channel, false);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat__main" aria-label="Thesis conversation">
      <header className="chat__head">
        <div>
          <h2 className="section__label">{counterpartName}</h2>
          <p className="muted">{thesisTitle}</p>
        </div>
      </header>

      <div
        ref={logRef}
        className="chat__log"
        role="log"
        aria-live="polite"
        aria-label={`Messages with ${counterpartName}`}
      >
        {messages.length === 0 ? (
          <p className="muted-block">
            No messages yet. Send a message to {counterpartName}.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <div key={message.id} className="bubble-row" data-mine={mine}>
                <div className="bubble">
                  {message.content && <p>{message.content}</p>}
                  {message.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      className="bubble__file"
                      href={attachment.downloadUrl}
                    >
                      <Icon name="document-2-line" small />
                      <span>{attachment.fileName}</span>
                    </a>
                  ))}
                </div>
                <span className="bubble__stamp">
                  {formatClock(message.createdAt)}
                  {mine && deliveryStateOf(message) === "read"
                    ? ", Read"
                    : mine
                      ? ", Sent"
                      : ""}
                </span>
              </div>
            );
          })
        )}
      </div>

      <p className="chat__typing" role="status">
        {counterpartTyping ? `${counterpartName} is typing...` : ""}
      </p>

      <form
        ref={formRef}
        className="chat__composer"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="chat__composer-row">
          <AttachmentPicker
            id={`attachment-${conversationId}`}
            file={file}
            maxBytes={maxBytes}
            disabled={sending}
            onChange={setFile}
            onError={setError}
          />
          <label className="sr-only" htmlFor={`message-${conversationId}`}>
            Write a message
          </label>
          <textarea
            className="textarea"
            id={`message-${conversationId}`}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={`Message ${counterpartName}`}
            value={text}
            onChange={handleTextChange}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
          />
          <Button type="submit" variant="primary" disabled={sending}>
            <Icon name="send-line" small />
            <span>Send</span>
          </Button>
        </div>
        {error ? (
          <p className="chat__composer-note" role="alert">
            {error}
          </p>
        ) : (
          <p className="chat__composer-note">
            PDF or ZIP, up to {Math.floor(maxBytes / 1_048_576)} MB.
          </p>
        )}
      </form>
    </section>
  );
}
