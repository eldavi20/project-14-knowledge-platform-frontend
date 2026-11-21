'use client';

import React, { Suspense, useState } from 'react';
import { AlertCircle, Hash, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { UserSwitcher } from '@/components/auth/UserSwitcher';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageList } from '@/components/chat/MessageList';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';

function formatSessionSnippet(sessionId: string): string {
  if (!sessionId) {
    return '…';
  }
  return sessionId.length > 8 ? `${sessionId.slice(0, 8)}…` : sessionId;
}

function ChatPageContent() {
  const {
    sessionId,
    messages,
    isLoading,
    error,
    sendMessage,
    resetSession,
  } = useChat();
  const [dismissedError, setDismissedError] = useState<string | null>(null);

  const visibleError = error && error !== dismissedError ? error : null;

  const handleResetSession = () => {
    setDismissedError(null);
    resetSession();
  };

  return (
    <main data-testid="chat-page" className="flex min-h-screen flex-1 flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="size-5 text-primary"
                aria-hidden="true"
              />
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Secure Knowledge Chat
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Ask questions and inspect permission-filtered chunks retrieved for
              the active user.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              data-testid="chat-session-id"
              title={sessionId ? `Session ID: ${sessionId}` : 'Initializing session…'}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 py-1 font-mono text-xs text-muted-foreground"
            >
              <Hash className="size-3.5" aria-hidden="true" />
              session: {formatSessionSnippet(sessionId)}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              data-testid="new-session-button"
              onClick={handleResetSession}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              New Session
            </Button>
          </div>
        </header>

        {/* Top-Level Error Banner */}
        {visibleError && (
          <div
            role="alert"
            data-testid="chat-page-error"
            className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{visibleError}</span>
            </div>
            <button
              type="button"
              aria-label="Dismiss error"
              data-testid="chat-page-error-dismiss"
              onClick={() => setDismissedError(visibleError)}
              className="rounded-md p-1 text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Responsive Sidebar + Main Chat Column */}
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="flex flex-col gap-4">
            <UserSwitcher onUserSwitch={handleResetSession} />
          </aside>

          <section
            aria-label="Chat conversation"
            className="flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs"
          >
            <MessageList
              messages={messages}
              isLoading={isLoading}
              className="flex-1 p-4"
            />
            <div className="border-t border-border bg-card p-3 sm:p-4">
              <ChatInput onSend={sendMessage} isLoading={isLoading} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-1 flex-col bg-background p-6 text-sm text-muted-foreground">
          Loading chat…
        </main>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}