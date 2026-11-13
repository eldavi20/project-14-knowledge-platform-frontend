'use client';

import React, { useEffect, useRef } from 'react';
import {
  AlertCircle,
  Bot,
  Loader2,
  MessageSquare,
  ShieldAlert,
  User,
} from 'lucide-react';
import { ChunkCard } from '@/components/chat/ChunkCard';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/chat';

export interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageList({
  messages,
  isLoading = false,
  emptyTitle = 'Start a conversation',
  emptyDescription = 'Ask a question about company knowledge to inspect the permission-filtered chunks retrieved for your account.',
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div
      data-testid="message-list"
      role="log"
      aria-live="polite"
      className={cn(
        'flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-4',
        className
      )}
    >
      {isEmpty ? (
        <div
          data-testid="message-empty-state"
          className="my-auto flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MessageSquare className="size-5" aria-hidden="true" />
          </div>
          <div className="max-w-md space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              {emptyTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const hasCitations =
              !isUser && Array.isArray(message.citations) && message.citations.length > 0;
            const hasNoCitations =
              !isUser &&
              Array.isArray(message.citations) &&
              message.citations.length === 0 &&
              !message.error;

            return (
              <article
                key={message.id}
                data-testid="message-item"
                data-role={message.role}
                className={cn(
                  'flex w-full gap-3',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                {!isUser && (
                  <div
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground"
                    aria-hidden="true"
                  >
                    <Bot className="size-4" />
                  </div>
                )}

                <div
                  className={cn(
                    'flex max-w-[85%] flex-col gap-2 sm:max-w-[75%]',
                    isUser ? 'items-end' : 'items-start'
                  )}
                >
                  <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {isUser ? 'You' : 'Assistant'}
                    </span>
                    <time dateTime={message.createdAt}>
                      {formatTimestamp(message.createdAt)}
                    </time>
                  </div>

                  <div
                    className={cn(
                      'w-full rounded-xl px-4 py-3 text-sm leading-relaxed shadow-xs',
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-card text-card-foreground'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {message.error && (
                      <div
                        role="alert"
                        data-testid="message-error"
                        className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                      >
                        <AlertCircle
                          className="mt-0.5 size-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{message.error}</span>
                      </div>
                    )}
                  </div>

                  {hasCitations && (
                    <section
                      data-testid="message-citations"
                      aria-label="Retrieved chunks"
                      className="flex w-full flex-col gap-2 pt-1"
                    >
                      <p className="px-1 text-xs font-medium text-muted-foreground">
                        Retrieved chunks ({message.citations!.length})
                      </p>
                      <div className="flex flex-col gap-2">
                        {message.citations!.map((citation, idx) => (
                          <ChunkCard
                            key={citation.chunk_id}
                            chunk={citation}
                            index={idx}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {hasNoCitations && (
                    <div
                      data-testid="message-no-citations"
                      className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground"
                    >
                      <ShieldAlert
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span>No authorized chunks retrieved for this query.</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    aria-hidden="true"
                  >
                    <User className="size-4" />
                  </div>
                )}
              </article>
            );
          })}

          {isLoading && (
            <div
              data-testid="message-loading"
              className="flex items-start gap-3"
            >
              <div
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground"
                aria-hidden="true"
              >
                <Bot className="size-4" />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-xs">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>Retrieving authorized chunks…</span>
              </div>
            </div>
          )}
        </>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
