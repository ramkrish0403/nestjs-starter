import { api } from './index';

export interface QueryDto {
  question: string;
  knowledgeBaseIds: string[];
  topK?: number;
}

export interface SourceDto {
  documentId: string;
  documentName: string;
  chunkContent: string;
  relevanceScore: number;
  metadata: Record<string, any>;
}

export interface ChatResponseDto {
  answer: string;
  sources: SourceDto[];
  knowledgeBasesUsed: string[];
}

export const chatApi = {
  query: (data: QueryDto) => api.post<ChatResponseDto>('/rag/chat/query', data),
};
