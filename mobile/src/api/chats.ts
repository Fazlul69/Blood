import { apiFetch } from "./client";
import type { ChatSummary, Message } from "../types";

export function listChats() {
  return apiFetch<{ chats: ChatSummary[] }>("/api/v1/chats");
}

export function startChat(otherUserId: number) {
  return apiFetch<{ chat: { id: number; userAId: number; userBId: number } }>("/api/v1/chats", {
    method: "POST",
    body: JSON.stringify({ otherUserId }),
  });
}

export function getMessages(chatId: number) {
  return apiFetch<{ messages: Message[] }>(`/api/v1/chats/${chatId}/messages`);
}

export function sendMessage(chatId: number, body: string) {
  return apiFetch<{ message: Message }>(`/api/v1/chats/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
