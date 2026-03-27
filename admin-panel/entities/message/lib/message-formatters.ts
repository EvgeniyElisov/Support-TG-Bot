import type { MessageRecord } from "../model/types";

export function getDisplayName(message: MessageRecord): string {
  if (message.username) {
    return `@${message.username}`;
  }

  const fullName = [message.first_name, message.last_name].filter(Boolean).join(" ");
  return fullName || "Unknown user";
}

export function getDisplayText(message: MessageRecord): string {
  return message.text_content ?? message.caption ?? "(empty message)";
}

export function formatMessageDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}
