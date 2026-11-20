import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChat } from '@/hooks/useChat';
import { apiClient } from '@/lib/api';
import type { ChatMessageResponse } from '@/types/chat';

vi.mock('@/lib/api', () => ({
  apiClient: vi.fn(),
}));

const sampleResponse: ChatMessageResponse = {
  message_id: '22222222-3333-4444-5555-666666666666',
  session_id: '11111111-2222-3333-4444-555555555555',
  role: 'assistant',
  content: 'This is a placeholder response from the permission-aware RAG pipeline.',
  citations: [
    {
      chunk_id: 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb',
      document_id: 'cccccccc-4444-5555-6666-dddddddddddd',
      document_title: 'Vacation Policy',
      content: 'Employees request vacation through the HR portal.',
      score: 0.94,
      metadata: {},
    },
  ],
  created_at: '2026-11-17T18:00:00Z',
};

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty messages, non-empty sessionId, idle loading, and null error', async () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toEqual([]);
    await waitFor(() => {
      expect(result.current.sessionId).toBeTruthy();
      expect(result.current.sessionId.length).toBeGreaterThan(0);
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('appends optimistic user message, posts to /chat/, and appends assistant response with citations', async () => {
    let resolveRequest: (value: ChatMessageResponse) => void;
    (apiClient as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise<ChatMessageResponse>((resolve) => {
          resolveRequest = resolve;
        })
    );

    const { result } = renderHook(() => useChat({ initialTopK: 4 }));
    await waitFor(() => {
      expect(result.current.sessionId).toBeTruthy();
    });
    const activeSessionId = result.current.sessionId;

    let pendingSend: Promise<void>;
    act(() => {
      pendingSend = result.current.sendMessage('  What is the vacation policy?  ');
    });

    // Optimistic user message and loading state immediately visible
    expect(result.current.isLoading).toBe(true);
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'What is the vacation policy?',
    });

    expect(apiClient).toHaveBeenCalledTimes(1);
    expect(apiClient).toHaveBeenCalledWith('/chat/', {
      method: 'POST',
      body: JSON.stringify({
        session_id: activeSessionId,
        content: 'What is the vacation policy?',
        top_k: 4,
      }),
    });

    await act(async () => {
      resolveRequest!({ ...sampleResponse, session_id: activeSessionId });
      await pendingSend!;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toEqual({
      id: sampleResponse.message_id,
      role: 'assistant',
      content: sampleResponse.content,
      citations: sampleResponse.citations,
      createdAt: sampleResponse.created_at,
    });
  });

  it('ignores empty and whitespace-only messages without calling apiClient', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('');
      await result.current.sendMessage('   \n\t  ');
    });

    expect(apiClient).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('captures API errors (403 / 503) in error state and appends an inline error message', async () => {
    (apiClient as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('User profile not found or inactive.'))
      .mockRejectedValueOnce(new Error('Retrieval service temporarily unavailable.'));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Restricted query');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('User profile not found or inactive.');
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      error: 'User profile not found or inactive.',
    });

    await act(async () => {
      await result.current.sendMessage('Retry during outage');
    });

    expect(result.current.error).toBe('Retrieval service temporarily unavailable.');
    expect(result.current.messages).toHaveLength(4);
    expect(result.current.messages[3]).toMatchObject({
      role: 'assistant',
      error: 'Retrieval service temporarily unavailable.',
    });
  });

  it('resets messages, clears error, and rotates sessionId on resetSession', async () => {
    (apiClient as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Access denied')
    );

    const { result } = renderHook(() => useChat());
    await waitFor(() => {
      expect(result.current.sessionId).toBeTruthy();
    });
    const initialSessionId = result.current.sessionId;

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.error).toBe('Access denied');

    act(() => {
      result.current.resetSession();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.sessionId).toBeTruthy();
    expect(result.current.sessionId).not.toBe(initialSessionId);
  });
});