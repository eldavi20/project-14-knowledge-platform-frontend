'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Hash,
  ShieldCheck,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ChunkCitation } from '@/types/chat';

export interface ChunkCardProps {
  chunk: ChunkCitation;
  index?: number;
  defaultExpanded?: boolean;
  className?: string;
}

const PREVIEW_CHAR_LIMIT = 240;

function formatScorePercent(score: number): string {
  const clamped = Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : 0;
  return `${Math.round(clamped * 100)}%`;
}

function formatIdSnippet(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function extractMetadataTags(
  metadata?: Record<string, unknown>
): Array<{ key: string; value: string }> {
  if (!metadata || typeof metadata !== 'object') {
    return [];
  }

  const tags: Array<{ key: string; value: string }> = [];
  const preferredKeys = ['department', 'classification', 'acl_principals'];

  for (const key of preferredKeys) {
    const raw = metadata[key];
    if (raw === undefined || raw === null) {
      continue;
    }

    if (Array.isArray(raw)) {
      const items = raw
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
      if (items.length > 0) {
        tags.push({ key, value: items.join(', ') });
      }
    } else if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
      const text = String(raw).trim();
      if (text.length > 0) {
        tags.push({ key, value: text });
      }
    }
  }

  return tags;
}

export function ChunkCard({
  chunk,
  index,
  defaultExpanded = false,
  className,
}: ChunkCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isLongContent = chunk.content.length > PREVIEW_CHAR_LIMIT;
  const displayedContent =
    isLongContent && !isExpanded
      ? `${chunk.content.slice(0, PREVIEW_CHAR_LIMIT).trimEnd()}…`
      : chunk.content;

  const metadataTags = extractMetadataTags(chunk.metadata);

  return (
    <Card
      size="sm"
      data-testid="chunk-card"
      className={cn(
        'border border-border bg-card text-card-foreground shadow-xs',
        className
      )}
    >
      <CardHeader className="gap-1.5 border-b border-border pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <FileText
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <CardTitle
              data-testid="chunk-title"
              className="truncate text-sm font-semibold text-card-foreground"
            >
              {index !== undefined ? `[${index + 1}] ` : ''}
              {chunk.document_title}
            </CardTitle>
          </div>
          <span
            data-testid="chunk-score"
            aria-label={`Similarity score ${formatScorePercent(chunk.score)}`}
            className="inline-flex shrink-0 items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            {formatScorePercent(chunk.score)}
          </span>
        </div>

        <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span
            className="inline-flex items-center gap-1 font-mono"
            title={`Document ID: ${chunk.document_id}`}
          >
            <Hash className="size-3" aria-hidden="true" />
            doc: {formatIdSnippet(chunk.document_id)}
          </span>
          <span
            className="inline-flex items-center gap-1 font-mono"
            title={`Chunk ID: ${chunk.chunk_id}`}
          >
            <Hash className="size-3" aria-hidden="true" />
            chunk: {formatIdSnippet(chunk.chunk_id)}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="gap-3 pt-1">
        <p
          data-testid="chunk-content"
          className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground"
        >
          {displayedContent}
        </p>

        {isLongContent && (
          <div>
            <button
              type="button"
              data-testid="chunk-expand-toggle"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:underline"
            >
              {isExpanded ? (
                <>
                  Show less
                  <ChevronUp className="size-3.5" aria-hidden="true" />
                </>
              ) : (
                <>
                  Show more
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        )}

        {metadataTags.length > 0 && (
          <div
            data-testid="chunk-metadata"
            className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2"
          >
            <ShieldCheck
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            {metadataTags.map((tag) => (
              <span
                key={tag.key}
                className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                <span className="font-medium text-foreground">{tag.key}:</span>
                <span className="ml-1">{tag.value}</span>
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
