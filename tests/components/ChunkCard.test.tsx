import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChunkCard } from '@/components/chat/ChunkCard';
import type { ChunkCitation } from '@/types/chat';

const baseChunk: ChunkCitation = {
  chunk_id: '11111111-2222-3333-4444-555555555555',
  document_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  document_title: 'Vacation Policy',
  content: 'Employees request vacation through the HR portal at least two weeks in advance.',
  score: 0.95,
  metadata: {},
};

describe('ChunkCard', () => {
  it('renders document title, content, formatted score, and provenance IDs', () => {
    render(<ChunkCard chunk={baseChunk} index={0} />);

    expect(screen.getByTestId('chunk-card')).toBeInTheDocument();
    expect(screen.getByTestId('chunk-title')).toHaveTextContent('[1] Vacation Policy');
    expect(screen.getByTestId('chunk-score')).toHaveTextContent('95%');
    expect(screen.getByTestId('chunk-content')).toHaveTextContent(baseChunk.content);
    expect(screen.getByText('doc: aaaaaaaa…')).toBeInTheDocument();
    expect(screen.getByText('chunk: 11111111…')).toBeInTheDocument();
    expect(screen.queryByTestId('chunk-expand-toggle')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chunk-metadata')).not.toBeInTheDocument();
  });

  it('truncates long content and toggles between expanded and collapsed states', () => {
    const longText = 'A'.repeat(300);
    render(<ChunkCard chunk={{ ...baseChunk, content: longText }} />);

    const content = screen.getByTestId('chunk-content');
    const toggle = screen.getByTestId('chunk-expand-toggle');

    expect(content.textContent?.length).toBeLessThan(longText.length);
    expect(content.textContent?.endsWith('…')).toBe(true);
    expect(toggle).toHaveTextContent('Show more');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    expect(content).toHaveTextContent(longText);
    expect(toggle).toHaveTextContent('Show less');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);

    expect(content.textContent?.length).toBeLessThan(longText.length);
    expect(toggle).toHaveTextContent('Show more');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('respects defaultExpanded prop for long content', () => {
    const longText = 'B'.repeat(280);
    render(
      <ChunkCard chunk={{ ...baseChunk, content: longText }} defaultExpanded />
    );

    expect(screen.getByTestId('chunk-content')).toHaveTextContent(longText);
    expect(screen.getByTestId('chunk-expand-toggle')).toHaveTextContent('Show less');
  });

  it('renders optional metadata badges when present and handles empty or missing metadata gracefully', () => {
    const { rerender } = render(
      <ChunkCard
        chunk={{
          ...baseChunk,
          metadata: {
            department: 'engineering',
            classification: 'internal',
            acl_principals: ['group:engineering', 'group:managers'],
          },
        }}
      />
    );

    const metadataSection = screen.getByTestId('chunk-metadata');
    expect(metadataSection).toBeInTheDocument();
    expect(metadataSection).toHaveTextContent('department:engineering');
    expect(metadataSection).toHaveTextContent('classification:internal');
    expect(metadataSection).toHaveTextContent(
      'acl_principals:group:engineering, group:managers'
    );

    rerender(<ChunkCard chunk={{ ...baseChunk, metadata: undefined }} />);
    expect(screen.queryByTestId('chunk-metadata')).not.toBeInTheDocument();
  });
});
