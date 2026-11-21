'use client';

import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ChatInputProps {
  onSend: (content: string) => void | Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

const DEFAULT_MAX_LENGTH = 4096;
const CHAR_COUNT_THRESHOLD = 0.8;

export function ChatInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = 'Ask a question about company knowledge...',
  maxLength = DEFAULT_MAX_LENGTH,
  className,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBusy = isLoading || isSubmitting;
  const isDisabled = disabled || isBusy;
  const trimmed = value.trim();
  const canSubmit = !isDisabled && trimmed.length > 0;
  const showCharCount = value.length >= Math.floor(maxLength * CHAR_COUNT_THRESHOLD);
  const isAtLimit = value.length >= maxLength;

  const submitMessage = async () => {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSend(trimmed);
      setValue('');
    } catch {
      // Keep the user's draft in place if sending fails so they can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submitMessage();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col gap-1.5 rounded-xl border border-border bg-background p-2 shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        className
      )}
    >
      <div className="flex items-end gap-2">
        <textarea
          data-testid="chat-input"
          aria-label="Chat message input"
          rows={1}
          value={value}
          maxLength={maxLength}
          disabled={isDisabled}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!canSubmit}
          aria-label="Send message"
          data-testid="chat-submit-button"
        >
          {isBusy ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Send aria-hidden="true" />
          )}
        </Button>
      </div>

      <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
        <span>Press Enter to send, Shift+Enter for a new line</span>
        {showCharCount && (
          <span
            data-testid="chat-char-count"
            className={cn(isAtLimit && 'font-medium text-destructive')}
          >
            {value.length} / {maxLength}
          </span>
        )}
      </div>
    </form>
  );
}
