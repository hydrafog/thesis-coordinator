"use server";

import { requireUser } from "@/core/auth/guards";
import { runAction } from "@/core/errors/mapper";
import { idSchema, parseInput } from "@/lib/validation/schemas";
import {
  loadMessages,
  markConversationRead,
} from "./service/messaging-service";

export async function loadMessagesAction(conversationId: string) {
  return runAction(async () => {
    const actor = await requireUser();
    const messages = await loadMessages(
      actor,
      parseInput(idSchema, conversationId),
    );
    return { messages };
  });
}

export async function markReadAction(conversationId: string) {
  return runAction(async () => {
    const actor = await requireUser();
    await markConversationRead(actor, parseInput(idSchema, conversationId));
    return {};
  });
}
