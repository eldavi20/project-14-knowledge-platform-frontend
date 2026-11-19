import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatPage from '@/app/chat/page';
import type { CurrentUserProfile } from '@/components/auth/UserSwitcher';
import { apiClient } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';
import type { ChatMessageResponse } from '@/types/chat';

vi.mock('@/lib/api', () => ({
  apiClient: vi.fn(),
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(),
}));

const aliceProfile: CurrentUserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  user_id: 1,
  email: 'alice@company.com',
  username: 'alice',
  full_name: 'Alice Engineer',
  department: 'engineering',
  access_level: 'standard',
  is_active: true,
};

const internProfile: CurrentUserProfile = {
  id: '00000000-0000-0000-0000-000000000002',
  user_id: 2,
  email: 'intern@company.com',
  username: 'intern',
  full_name: 'Sam Intern',
  department: 'interns',
  access_level: 'limited',
  is_active: true,
};

describe('ChatPage integration', () => {
  const mockGetUser = vi.fn();
  const mockOnAuthStateChange = vi.fn();
  const mockSignInWithPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: { user: { id: aliceProfile.id, email: aliceProfile.email } },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: mockGetUser,
        onAuthStateChange: mockOnAuthStateChange,
        signInWithPassword: mockSignInWithPassword,
      },
    });

    (apiClient as ReturnType<typeof vi.fn>).mockImplementation(
      async (endpoint: string) => {
        if (endpoint === '/api/auth/me') {
          return aliceProfile;
        }
        throw new Error(`Unexpected endpoint: ${endpoint}`);
      }
    );
  });

  it('renders UserSwitcher, empty MessageList, and ChatInput', async () => {
    render(<ChatPage />);

    expect(screen.getByTestId('chat-page')).toBeInTheDocument();
    expect(screen.getByTestId('user-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('message-empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    expect(screen.getByTestId('new-session-button')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('active-user-name')).toHaveTextContent(
        'Alice Engineer'
      );
    });
  });

  it('submits a query to POST /chat/ and renders assistant reply and retrieved ChunkCards', async () => {
    let capturedBody: { session_id: string; content: string } | null = null;

    (apiClient as ReturnType<typeof vi.fn>).mockImplementation(
      async (endpoint: string, options?: RequestInit) => {
        if (endpoint === '/api/auth/me') {
          return aliceProfile;
        }
        if (endpoint === '/chat/') {
          capturedBody = JSON.parse(String(options?.body));
          const response: ChatMessageResponse = {
            message_id: 'msg-assistant-1',
            session_id: capturedBody!.session_id,
            role: 'assistant',
            content: 'Retrieved engineering handbook sections.',
            citations: [
              {
                chunk_id: '11111111-1111-1111-1111-111111111111',
                document_id: '22222222-2222-2222-2222-222222222222',
                document_title: 'Engineering Handbook',
                content: 'Code review rules and release procedures.',
                score: 0.96,
                metadata: {},
              },
            ],
            created_at: '2026-11-19T18:00:00Z',
          };
          return response;
        }
        throw new Error(`Unexpected endpoint: ${endpoint}`);
      }
    );

    render(<ChatPage />);

    await waitFor(() => {
      expect(screen.getByTestId('active-user-name')).toHaveTextContent(
        'Alice Engineer'
      );
    });

    fireEvent.change(screen.getByTestId('chat-input'), {
      target: { value: 'What are the release procedures?' },
    });
    fireEvent.click(screen.getByTestId('chat-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('chunk-card')).toBeInTheDocument();
    });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.content).toBe('What are the release procedures?');
    expect(capturedBody!.session_id).toBeTruthy();

    expect(
      screen.getByText('What are the release procedures?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Retrieved engineering handbook sections.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('chunk-title')).toHaveTextContent(
      '[1] Engineering Handbook'
    );
    expect(screen.getByTestId('chunk-score')).toHaveTextContent('96%');
  });

  it('clears messages and rotates session_id when switching users or starting a new session', async () => {
    let activeProfile = aliceProfile;
    const sentSessionIds: string[] = [];

    (apiClient as ReturnType<typeof vi.fn>).mockImplementation(
      async (endpoint: string, options?: RequestInit) => {
        if (endpoint === '/api/auth/me') {
          return activeProfile;
        }
        if (endpoint === '/chat/') {
          const body = JSON.parse(String(options?.body)) as {
            session_id: string;
            content: string;
          };
          sentSessionIds.push(body.session_id);
          const response: ChatMessageResponse = {
            message_id: `msg-${sentSessionIds.length}`,
            session_id: body.session_id,
            role: 'assistant',
            content:
              activeProfile.email === aliceProfile.email
                ? 'Alice results'
                : 'Intern results',
            citations: [],
            created_at: '2026-11-19T18:05:00Z',
          };
          return response;
        }
        throw new Error(`Unexpected endpoint: ${endpoint}`);
      }
    );

    render(<ChatPage />);

    await waitFor(() => {
      expect(screen.getByTestId('active-user-name')).toHaveTextContent(
        'Alice Engineer'
      );
    });

    const initialSessionBadge =
      screen.getByTestId('chat-session-id').getAttribute('title');

    // First query as Alice
    fireEvent.change(screen.getByTestId('chat-input'), {
      target: { value: 'What is the salary policy?' },
    });
    fireEvent.click(screen.getByTestId('chat-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Alice results')).toBeInTheDocument();
    });

    // Switch user to Intern via UserSwitcher
    activeProfile = internProfile;
    fireEvent.change(screen.getByTestId('user-switcher-email'), {
      target: { value: 'intern@company.com' },
    });
    fireEvent.change(screen.getByTestId('user-switcher-password'), {
      target: { value: 'InternPass123!' },
    });
    fireEvent.click(screen.getByTestId('user-switcher-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('message-empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('active-user-department')).toHaveTextContent(
        'interns'
      );
    });

    const switchedSessionBadge =
      screen.getByTestId('chat-session-id').getAttribute('title');
    expect(switchedSessionBadge).not.toBe(initialSessionBadge);

    // Second query as Intern uses rotated session_id
    fireEvent.change(screen.getByTestId('chat-input'), {
      target: { value: 'What is the salary policy?' },
    });
    fireEvent.click(screen.getByTestId('chat-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Intern results')).toBeInTheDocument();
    });

    expect(sentSessionIds).toHaveLength(2);
    expect(sentSessionIds[0]).not.toBe(sentSessionIds[1]);

    // Clicking "New Session" clears messages and rotates session_id again
    fireEvent.click(screen.getByTestId('new-session-button'));
    expect(screen.getByTestId('message-empty-state')).toBeInTheDocument();
    expect(
      screen.getByTestId('chat-session-id').getAttribute('title')
    ).not.toBe(switchedSessionBadge);
  });

  it('surfaces backend 403 / 503 errors cleanly in the UI without crashing', async () => {
    (apiClient as ReturnType<typeof vi.fn>).mockImplementation(
      async (endpoint: string) => {
        if (endpoint === '/api/auth/me') {
          return aliceProfile;
        }
        if (endpoint === '/chat/') {
          throw new Error('Retrieval service temporarily unavailable.');
        }
        throw new Error(`Unexpected endpoint: ${endpoint}`);
      }
    );

    render(<ChatPage />);

    await waitFor(() => {
      expect(screen.getByTestId('active-user-name')).toHaveTextContent(
        'Alice Engineer'
      );
    });

    fireEvent.change(screen.getByTestId('chat-input'), {
      target: { value: 'Trigger 503' },
    });
    fireEvent.click(screen.getByTestId('chat-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('chat-page-error')).toHaveTextContent(
        'Retrieval service temporarily unavailable.'
      );
      expect(screen.getByTestId('message-error')).toHaveTextContent(
        'Retrieval service temporarily unavailable.'
      );
    });

    // Dismissing the top-level error banner hides it cleanly
    fireEvent.click(screen.getByTestId('chat-page-error-dismiss'));
    expect(screen.queryByTestId('chat-page-error')).not.toBeInTheDocument();
  });
});
