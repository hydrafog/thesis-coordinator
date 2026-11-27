import { StatusBadge } from "@/core/ui/status-badge";
import { formatClock } from "@/lib/utils/date";
import type { ConversationSummary } from "../domain/conversation";

export interface ConversationListProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  basePath: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export function ConversationList({
  conversations,
  activeId,
  basePath,
}: ConversationListProps) {
  return (
    <nav className="chat__people" aria-label="Conversations">
      {conversations.map((conversation) => (
        <a
          key={conversation.id}
          className="chat__thread"
          href={`${basePath}?c=${conversation.id}`}
          aria-current={conversation.id === activeId ? "page" : undefined}
        >
          <span className="person__avatar" aria-hidden="true">
            {initialsOf(conversation.counterpartName)}
          </span>
          <span className="chat__thread-copy">
            <span className="chat__thread-name">
              <span>{conversation.counterpartName}</span>
              {conversation.unreadCount > 0 ? (
                <StatusBadge
                  status="unread"
                  tone="info"
                  label={String(conversation.unreadCount)}
                />
              ) : (
                conversation.lastMessageAt && (
                  <span className="muted">
                    {formatClock(conversation.lastMessageAt)}
                  </span>
                )
              )}
            </span>
            <span className="chat__thread-preview">
              {conversation.lastMessagePreview ?? "No messages yet"}
            </span>
          </span>
        </a>
      ))}
    </nav>
  );
}
