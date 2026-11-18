import { apiClient } from '@/lib/api';
import type {
  ChatMessageCreateRequest,
  ChatMessageResponse,
} from '@/types/chat';

export function createSessionId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  // RFC 4122 v4 fallback so backend UUID validation succeeds if crypto.randomUUID is unavailable
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function sendChatMessage(
  payload: ChatMessageCreateRequest
): Promise<ChatMessageResponse> {
  return apiClient<ChatMessageResponse>('/chat/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
