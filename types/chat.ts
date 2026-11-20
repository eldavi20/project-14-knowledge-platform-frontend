export interface ChunkCitation {
  chunk_id: string;
  document_id: string;
  document_title: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface ChatMessageCreateRequest {
  session_id: string;
  content: string;
  top_k?: number;
}

export interface ChatMessageResponse {
  message_id: string;
  session_id: string;
  role: 'assistant' | 'user';
  content: string;
  citations: ChunkCitation[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChunkCitation[];
  createdAt: string;
  error?: string;
}
