import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageList } from '@/components/chat/MessageList';
import type { ChatMessage, ChunkCitation } from '@/types/chat';

const sampleCitation: ChunkCitation = {
  chunk_id: '11111111-2222-3333-4444-555555555555',
  document_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  document_title: 'Engineering Handbook',
  content: 'Code review guidelines and branch naming conventions.',
  score: 0.92,
  metadata: { department: 'engineering' },
};

const userMessage: ChatMessage = {
  id: 'msg-1',
  role: 'user',
  content: 'What are the engineering guidelines?',
  createdAt: '2026-11-13T18:00:00Z',
};

const assistantMessageWithChunks: ChatMessage = {
  id: 'msg-2',
  role: 'assistant',
  content: 'Here are the relevant retrieved chunks for your question.',
  citations: [sampleCitation],
  createdAt: '2026-11-13T18:00:02Z',
};

describe('MessageList', () => {
  it('renders empty state when there are no messages and not loading', () => {
    render(
      <MessageList
        messages={[]}
        emptyTitle="No queries yet"
        emptyDescription="Submit a question to inspect retrieved chunks."
      />
    );

    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No queries yet')).toBeInTheDocument();
    expect(
      screen.getByText('Submit a question to inspect retrieved chunks.')
    ).toBeInTheDocument();
  });

  it('renders user and assistant messages with distinct roles and hides empty state', () => {
    render(
      <MessageList messages={[userMessage, assistantMessageWithChunks]} />
    );

    expect(screen.queryByTestId('message-empty-state')).not.toBeInTheDocument();

    const items = screen.getAllByTestId('message-item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('data-role', 'user');
    expect(items[1]).toHaveAttribute('data-role', 'assistant');

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toBeInTheDocument();
    expect(
      screen.getByText('What are the engineering guidelines?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Here are the relevant retrieved chunks for your question.')
    ).toBeInTheDocument();
  });

  it('renders ChunkCard citations when present and zero-chunks notice when citations is empty', () => {
    const assistantNoChunks: ChatMessage = {
      id: 'msg-3',
      role: 'assistant',
      content: 'No matching documents were found for your permissions.',
      citations: [],
      createdAt: '2026-11-13T18:01:00Z',
    };

    render(
      <MessageList messages={[assistantMessageWithChunks, assistantNoChunks]} />
    );

    expect(screen.getByTestId('message-citations')).toBeInTheDocument();
    expect(screen.getByText('Retrieved chunks (1)')).toBeInTheDocument();
    expect(screen.getByTestId('chunk-card')).toBeInTheDocument();
    expect(screen.getByTestId('chunk-title')).toHaveTextContent(
      '[1] Engineering Handbook'
    );

    expect(screen.getByTestId('message-no-citations')).toHaveTextContent(
      'No authorized chunks retrieved for this query.'
    );
  });

  it('renders error alert on failed messages and loading indicator when isLoading is true', () => {
    const failedMessage: ChatMessage = {
      id: 'msg-err',
      role: 'assistant',
      content: 'Unable to complete your request.',
      citations: [],
      error: 'Access denied: No valid security principals resolved.',
      createdAt: '2026-11-13T18:02:00Z',
    };

    render(<MessageList messages={[userMessage, failedMessage]} isLoading />);

    expect(screen.getByTestId('message-error')).toHaveTextContent(
      'Access denied: No valid security principals resolved.'
    );
    expect(screen.queryByTestId('message-no-citations')).not.toBeInTheDocument();
    expect(screen.getByTestId('message-loading')).toBeInTheDocument();
  });
});
