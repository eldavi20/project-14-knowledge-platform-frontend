'use client';

import { useCallback, useEffect, useState } from 'react';
import { createSessionId, sendChatMessage } from '@/lib/chat';
import type { ChatMessage } from '@/types/chat';

export interface UseChatOptions {
  initialTopK?: number;
}

export function useChat(options?: UseChatOptions) {
  const initialTopK = options?.initialTopK;

  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSessionId((prev) => prev || createSessionId());
  }, []);

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      const trimmed = content.trim();
      if (trimmed.length === 0) {
        return;
      }

      const activeSessionId = sessionId || createSessionId();
      if (!sessionId) {
        setSessionId(activeSessionId);
      }

      const userMessage: ChatMessage = {
        id: createSessionId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendChatMessage({
          session_id: activeSessionId,
          content: trimmed,
          ...(initialTopK !== undefined ? { top_k: initialTopK } : {}),
        });

        const assistantMessage: ChatMessage = {
          id: response.message_id,
          role: 'assistant',
          content: response.content,
          citations: response.citations,
          createdAt: response.created_at,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unable to send chat message.';
        setError(errorMessage);

        const failedMessage: ChatMessage = {
          id: createSessionId(),
          role: 'assistant',
          content: 'Unable to retrieve a response for your query.',
          citations: [],
          createdAt: new Date().toISOString(),
          error: errorMessage,
        };

        setMessages((prev) => [...prev, failedMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, initialTopK]
  );

  const resetSession = useCallback(() => {
    setMessages([]);
    setError(null);
    setSessionId(createSessionId());
  }, []);

  return {
    sessionId,
    messages,
    isLoading,
    error,
    sendMessage,
    resetSession,
  };
}