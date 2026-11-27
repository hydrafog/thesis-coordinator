import type { SessionUser } from "@/core/auth/session";
import { getMaxUploadBytes } from "@/core/config/app-config";
import { EmptyState } from "@/core/ui/empty-state";
import { loadInbox, loadMessages } from "../service/messaging-service";
import { ChatPanel } from "./chat-panel";
import { ConversationList } from "./conversation-list";

export interface MessagesWorkspaceProps {
  user: SessionUser;
  basePath: string;
  requestedId: string | null;
}

export async function MessagesWorkspace({
  user,
  basePath,
  requestedId,
}: MessagesWorkspaceProps) {
  const conversations = await loadInbox(user);
  const active =
    conversations.find((conversation) => conversation.id === requestedId) ??
    conversations[0] ??
    null;

  if (!active) {
    return (
      <EmptyState
        title="Conversations open after topic approval"
        text="Once a coordinator approves the proposal, the private conversation appears here."
      />
    );
  }

  const messages = await loadMessages(user, active.id);

  return (
    <div className="chat">
      <ConversationList
        conversations={conversations}
        activeId={active.id}
        basePath={basePath}
      />
      <ChatPanel
        key={active.id}
        conversationId={active.id}
        currentUserId={user.id}
        counterpartName={active.counterpartName}
        thesisTitle={active.thesisTitle}
        initialMessages={messages}
        maxBytes={getMaxUploadBytes()}
      />
    </div>
  );
}
