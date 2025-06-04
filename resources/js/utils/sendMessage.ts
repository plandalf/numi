import { BaseEvent } from "@/events/BaseEvent";

export const sendMessage = (message: BaseEvent) => {
  window.parent.postMessage(message, '*');
}