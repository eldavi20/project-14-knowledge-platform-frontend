import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatInput } from '@/components/chat/ChatInput';

describe('ChatInput', () => {
  it('renders textarea and submit button with placeholder', () => {
    render(<ChatInput onSend={vi.fn()} placeholder="Type your query..." />);

    const input = screen.getByTestId('chat-input');
    const button = screen.getByTestId('chat-submit-button');

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Type your query...');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('submits trimmed content on button click and clears the input', async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement;
    const button = screen.getByTestId('chat-submit-button');

    fireEvent.change(input, { target: { value: '  What is the vacation policy?  ' } });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledTimes(1);
      expect(onSend).toHaveBeenCalledWith('What is the vacation policy?');
      expect(input.value).toBe('');
    });
  });

  it('submits on Enter and inserts newline without submitting on Shift+Enter', async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Line 1' } });

    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledTimes(1);
      expect(onSend).toHaveBeenCalledWith('Line 1');
      expect(input.value).toBe('');
    });
  });

  it('blocks empty and whitespace-only submissions', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByTestId('chat-input');
    const button = screen.getByTestId('chat-submit-button');

    fireEvent.change(input, { target: { value: '    \n\t  ' } });
    expect(button).toBeDisabled();

    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    fireEvent.click(button);

    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables input and button when disabled or isLoading is true', () => {
    const onSend = vi.fn();
    const { rerender } = render(<ChatInput onSend={onSend} disabled />);

    expect(screen.getByTestId('chat-input')).toBeDisabled();
    expect(screen.getByTestId('chat-submit-button')).toBeDisabled();

    rerender(<ChatInput onSend={onSend} isLoading />);

    expect(screen.getByTestId('chat-input')).toBeDisabled();
    expect(screen.getByTestId('chat-submit-button')).toBeDisabled();
  });

  it('shows character count when approaching maxLength', () => {
    render(<ChatInput onSend={vi.fn()} maxLength={10} />);

    const input = screen.getByTestId('chat-input');

    fireEvent.change(input, { target: { value: '1234567' } });
    expect(screen.queryByTestId('chat-char-count')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: '12345678' } });
    expect(screen.getByTestId('chat-char-count')).toHaveTextContent('8 / 10');
  });

  it('preserves input text if async onSend rejects', async () => {
    const onSend = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Retry me' } });
    fireEvent.click(screen.getByTestId('chat-submit-button'));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith('Retry me');
    });
    expect(input.value).toBe('Retry me');
  });
});
